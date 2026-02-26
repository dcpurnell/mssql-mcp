#!/usr/bin/env node

// External imports
import sql from "mssql";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DefaultAzureCredential, InteractiveBrowserCredential } from "@azure/identity";

// Internal imports
import { UpdateDataTool } from "./tools/UpdateDataTool.js";
import { InsertDataTool } from "./tools/InsertDataTool.js";
import { ReadDataTool } from "./tools/ReadDataTool.js";
import { CreateTableTool } from "./tools/CreateTableTool.js";
import { CreateIndexTool } from "./tools/CreateIndexTool.js";
import { ListTableTool } from "./tools/ListTableTool.js";
import { DropTableTool } from "./tools/DropTableTool.js";
import { DescribeTableTool } from "./tools/DescribeTableTool.js";
import { MsNodeSqlV8Pool } from "./utils/msnodesqlv8Wrapper.js";

// Globals for connection and token reuse
let globalSqlPool: sql.ConnectionPool | MsNodeSqlV8Pool | null = null;
let globalAccessToken: string | null = null;
let globalTokenExpiresOn: Date | null = null;
let usingNativeDriver: boolean = false;

// Configuration: Choose authentication method via environment variable
// Options: 
// - "default" (DefaultAzureCredential - for Azure SQL)
// - "interactive" (InteractiveBrowserCredential - for Azure SQL)
// - "integrated" (Windows Integrated Authentication - Windows only, uses current user)
// - "kerberos" (Kerberos Authentication - uses domain credentials or ticket)
// - "sql" (SQL Server Authentication with username/password)
const AUTH_METHOD = process.env.AUTH_METHOD || "default";

// Function to create SQL config based on authentication method
export async function createSqlConfig(): Promise<{ config: any, token: string | null, expiresOn: Date | null, useNativeDriver?: boolean, connectionString?: string }> {
  const trustServerCertificate = process.env.TRUST_SERVER_CERTIFICATE?.toLowerCase() === 'true';
  const connectionTimeout = process.env.CONNECTION_TIMEOUT ? parseInt(process.env.CONNECTION_TIMEOUT, 10) : 30;

  // Parse server name and port (format: "server" or "server,port")
  const serverName = process.env.SERVER_NAME!;
  const [server, portStr] = serverName.includes(',') 
    ? serverName.split(',') 
    : [serverName, undefined];
  const port = portStr ? parseInt(portStr, 10) : undefined;

  const baseConfig: sql.config = {
    server: server,
    database: process.env.DATABASE_NAME!,
    ...(port && { port: port }), // Only include port if specified
    options: {
      encrypt: trustServerCertificate ? false : true, // Local SQL Server typically doesn't use encryption
      trustServerCertificate
    },
    connectionTimeout: connectionTimeout * 1000, // convert seconds to milliseconds
  };

  // Azure AD Authentication (existing behavior)
  if (AUTH_METHOD === "default" || AUTH_METHOD === "interactive") {
    const credential = AUTH_METHOD === "interactive"
      ? new InteractiveBrowserCredential({
          redirectUri: 'http://localhost'
        })
      : new DefaultAzureCredential();

    console.error(`Using authentication method: ${AUTH_METHOD === "interactive" ? "Interactive Browser" : "Default Azure Credential"}`);
    
    const accessToken = await credential.getToken('https://database.windows.net/.default');

    return {
      config: {
        ...baseConfig,
        options: {
          ...baseConfig.options,
          encrypt: true, // Azure SQL always requires encryption
        },
        authentication: {
          type: 'azure-active-directory-access-token',
          options: {
            token: accessToken?.token!,
          },
        },
      },
      token: accessToken?.token!,
      expiresOn: accessToken?.expiresOnTimestamp ? new Date(accessToken.expiresOnTimestamp) : new Date(Date.now() + 30 * 60 * 1000)
    };
  }
  
  // Windows Integrated Authentication (for local SQL Server on Windows)
  // Uses the current Windows user's credentials automatically
  if (AUTH_METHOD === "integrated") {
    console.error('Using Windows Integrated Authentication');
    
    // Check if running on Windows
    if (process.platform !== 'win32') {
      throw new Error('Windows Integrated Authentication is only available on Windows. Use "sql" or "kerberos" authentication method instead.');
    }
    
    return {
      config: {
        ...baseConfig,
        options: {
          ...baseConfig.options,
          trustedConnection: true, // Use Windows credentials
        }
      },
      token: null,
      expiresOn: null
    };
  }

  // Kerberos Authentication (works on Windows, Linux, macOS with proper Kerberos setup)
  if (AUTH_METHOD === "kerberos") {
    console.error('Using Kerberos Authentication');
    
    // Optional: specify domain and user if not using cached Kerberos ticket
    const domain = process.env.DOMAIN;
    const userName = process.env.USERNAME;
    const password = process.env.PASSWORD;
    
    if (domain && userName && password) {
      console.error(`Authenticating as ${domain}\\${userName}`);
      return {
        config: {
          ...baseConfig,
          domain: domain,
          authentication: {
            type: 'ntlm',
            options: {
              domain: domain,
              userName: userName,
              password: password
            }
          }
        },
        token: null,
        expiresOn: null
      };
    } else {
      // Use existing Kerberos ticket (kinit must be run first)
      // Uses native ODBC driver for proper Kerberos support on macOS/Linux
      console.error('Using cached Kerberos ticket with native ODBC driver');
      
      const userName = process.env.USER || process.env.USERNAME;
      const domain = process.env.DOMAIN;
      
      console.error(`  User: ${userName}${domain ? '@' + domain : ''}`);
      
      // Build ODBC connection string for Kerberos
      const trustCertPart = baseConfig.options?.trustServerCertificate ? 'TrustServerCertificate=Yes;' : '';
      const connectionString = `Driver={ODBC Driver 18 for SQL Server};Server=${baseConfig.server}${port ? `,${port}` : ''};Database=${baseConfig.database};Trusted_Connection=Yes;${trustCertPart}`;
      
      console.error(`  Connection string: ${connectionString.replace(/;/g, '; ')}`);
      
      return {
        config: baseConfig,
        token: null,
        expiresOn: null,
        useNativeDriver: true,
        connectionString: connectionString
      };
    }
  }

  // SQL Server Authentication (username/password)
  if (AUTH_METHOD === "sql") {
    if (!process.env.SQL_USER || !process.env.SQL_PASSWORD) {
      throw new Error('SQL_USER and SQL_PASSWORD environment variables are required for SQL Server authentication');
    }
    
    console.error('Using SQL Server Authentication');
    return {
      config: {
        ...baseConfig,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
      },
      token: null,
      expiresOn: null
    };
  }

  throw new Error(`Unknown AUTH_METHOD: ${AUTH_METHOD}. Use "default", "interactive", "integrated", "kerberos", or "sql"`);
}

const updateDataTool = new UpdateDataTool();
const insertDataTool = new InsertDataTool();
const readDataTool = new ReadDataTool();
const createTableTool = new CreateTableTool();
const createIndexTool = new CreateIndexTool();
const listTableTool = new ListTableTool();
const dropTableTool = new DropTableTool();
const describeTableTool = new DescribeTableTool();

const server = new Server(
  {
    name: "mssql-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Read READONLY env variable
const isReadOnly = process.env.READONLY === "true";

// Request handlers

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: isReadOnly
    ? [listTableTool, readDataTool, describeTableTool] // todo: add searchDataTool to the list of tools available in readonly mode once implemented
    : [insertDataTool, readDataTool, describeTableTool, updateDataTool, createTableTool, createIndexTool, dropTableTool, listTableTool], // add all new tools here
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result;
    
    // Type guard to ensure args exists
    if (!args) {
      return {
        content: [{ type: "text", text: `Missing arguments for tool: ${name}` }],
        isError: true,
      };
    }
    
    switch (name) {
      case insertDataTool.name:
        result = await insertDataTool.run(args as any);
        break;
      case readDataTool.name:
        result = await readDataTool.run(args as any);
        break;
      case updateDataTool.name:
        result = await updateDataTool.run(args as any);
        break;
      case createTableTool.name:
        result = await createTableTool.run(args as any);
        break;
      case createIndexTool.name:
        result = await createIndexTool.run(args as any);
        break;
      case listTableTool.name:
        result = await listTableTool.run(args as any);
        break;
      case dropTableTool.name:
        result = await dropTableTool.run(args as any);
        break;
      case describeTableTool.name:
        result = await describeTableTool.run(args as any);
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error occurred: ${error}` }],
      isError: true,
    };
  }
});

// Server startup
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});

// Connect to SQL only when handling a request

async function ensureSqlConnection() {
  // For Azure AD auth, check if token is still valid and reuse connection
  // For Windows/SQL auth, just check if connection exists
  const isAzureAuth = AUTH_METHOD === "default" || AUTH_METHOD === "interactive";
  
  if (
    globalSqlPool &&
    globalSqlPool.connected &&
    (!isAzureAuth || (globalAccessToken && globalTokenExpiresOn && globalTokenExpiresOn > new Date(Date.now() + 5 * 60 * 1000)))
  ) {
    return;
  }

  // Get new configuration (and token if Azure AD)
  const { config, token, expiresOn, useNativeDriver, connectionString } = await createSqlConfig();
  globalAccessToken = token;
  globalTokenExpiresOn = expiresOn;

  // Close old pool if exists
  if (globalSqlPool && globalSqlPool.connected) {
    await globalSqlPool.close();
  }

  // Create appropriate connection pool based on driver type
  if (useNativeDriver && connectionString) {
    // Use msnodesqlv8 for Kerberos ticket authentication
    let nativeDriver: any = null;
    try {
      nativeDriver = await import('msnodesqlv8');
    } catch (e) {
      throw new Error('msnodesqlv8 package is required for Kerberos ticket authentication. Install with: npm install msnodesqlv8');
    }
    
    const nativePool = new MsNodeSqlV8Pool(connectionString, nativeDriver);
    await nativePool.connect();
    globalSqlPool = nativePool;
    usingNativeDriver = true;
  } else {
    // Use standard mssql/tedious driver
    globalSqlPool = await sql.connect(config);
    usingNativeDriver = false;
  }
}

// Export function to get SQL request for tools
// This works with both mssql and msnodesqlv8 drivers
export function getSqlRequest(): any {
  if (!globalSqlPool) {
    throw new Error('SQL connection not established');
  }
  
  if (usingNativeDriver) {
    // For msnodesqlv8, return wrapper's request method
    return (globalSqlPool as MsNodeSqlV8Pool).request();
  } else {
    // For mssql/tedious, use standard Request
    return new sql.Request();
  }
}

// Patch all tool handlers to ensure SQL connection before running
function wrapToolRun(tool: { run: (...args: any[]) => Promise<any> }) {
  const originalRun = tool.run.bind(tool);
  tool.run = async function (...args: any[]) {
    await ensureSqlConnection();
    return originalRun(...args);
  };
}

[insertDataTool, readDataTool, updateDataTool, createTableTool, createIndexTool, dropTableTool, listTableTool, describeTableTool].forEach(wrapToolRun);
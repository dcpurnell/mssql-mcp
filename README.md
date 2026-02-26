# MSSQL Database MCP  Server

> ⚠️ **EXPERIMENTAL USE ONLY** - This MCP Server is provided as an example for educational and experimental purposes only. It is NOT intended for production use. Please use appropriate security measures and thoroughly test before considering any kind of deployment.

## What is this? 🤔

This is a server that lets your LLMs (like Claude) talk directly to your MSSQL Database data! Think of it as a friendly translator that sits between your AI assistant and your database, making sure they can chat securely and efficiently.

### Quick Example

```text
You: "Show me all customers from New York"
Claude: *queries your MSSQL Database database and gives you the answer in plain English*
```

## How Does It Work? 🛠️

This server leverages the Model Context Protocol (MCP), a versatile framework that acts as a universal translator between AI models and databases. It supports multiple AI assistants including Claude Desktop and VS Code Agent.

### What Can It Do? 📊

- Run MSSQL Database queries by just asking questions in plain English
- Create, read, update, and delete data
- Manage database schema (tables, indexes)
- Secure connection handling
- Real-time data interaction

## Quick Start 🚀

### Prerequisites

- Node.js 14 or higher
- Claude Desktop or VS Code with Agent extension

### Set up project

1. **Install Dependencies**  
   Run the following command in the root folder to install all necessary dependencies:

   ```bash
   npm install
   ```

2. **Build the Project**  
   Compile the project by running:

   ```bash
   npm run build
   ```

## Configuration Setup

### Option 1: VS Code Agent Setup

1. **Install VS Code Agent Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Agent" and install the official Agent extension

2. **Create MCP Configuration File**
   - Create a `.vscode/mcp.json` file in your workspace
   - Add the following configuration:

   ```json
   {
     "servers": {
       "mssql-nodejs": {
         "type": "stdio",
         "command": "node",
         "args": ["q:\\Repos\\SQL-AI-samples\\MssqlMcp\\Node\\dist\\index.js"],
         "env": {
           "SERVER_NAME": "your-server-name.database.windows.net",
           "DATABASE_NAME": "your-database-name",
           "READONLY": "false"
         }
       }
     }
   }
   ```

3. **Alternative: User Settings Configuration**
   - Open VS Code Settings (Ctrl+,)
   - Search for "mcp"
   - Click "Edit in settings.json"
   - Add the following configuration:

   ```json
   {
     "mcp": {
       "servers": {
         "mssql": {
           "command": "node",
           "args": ["C:/path/to/your/Node/dist/index.js"],
           "env": {
             "SERVER_NAME": "your-server-name.database.windows.net",
             "DATABASE_NAME": "your-database-name",
             "READONLY": "false"
           }
         }
       }
     }
   }
   ```

4. **Restart VS Code**
   - Close and reopen VS Code for the changes to take effect

5. **Verify MCP Server**
   - Open Command Palette (Ctrl+Shift+P)
   - Run "MCP: List Servers" to verify your server is configured
   - You should see "mssql" in the list of available servers

### Option 2: Claude Desktop Setup

1. **Open Claude Desktop Settings**
   - Navigate to File → Settings → Developer → Edit Config
   - Open the `claude_desktop_config` file

2. **Add MCP Server Configuration**
   Replace the content with the configuration below, updating the path and credentials:

   ```json
   {
     "mcpServers": {
       "mssql": {
         "command": "node",
         "args": ["C:/path/to/your/Node/dist/index.js"],
         "env": {
           "SERVER_NAME": "your-server-name.database.windows.net",
           "DATABASE_NAME": "your-database-name",
           "READONLY": "false"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   - Close and reopen Claude Desktop for the changes to take effect

### Configuration Parameters

- **SERVER_NAME**: Your SQL Server name
  - For Azure SQL: `my-server.database.windows.net`
  - For local SQL Server: `localhost` or `.\SQLEXPRESS` or `(local)` or server IP
- **DATABASE_NAME**: Your database name
- **READONLY**: Set to `"true"` to restrict to read-only operations, `"false"` for full access
- **AUTH_METHOD**: Authentication method (defaults to `"default"`):
  - `"default"` - DefaultAzureCredential (for Azure SQL, recommended for production)
  - `"interactive"` - InteractiveBrowserCredential (for Azure SQL, opens browser)
  - `"windows"` - Windows/Integrated Authentication (for local SQL Server)
  - `"sql"` - SQL Server Authentication with username/password
- **CONNECTION_TIMEOUT**: (Optional) Connection timeout in seconds. Defaults to `30` if not set.
- **TRUST_SERVER_CERTIFICATE**: (Optional) Set to `"true"` to trust self-signed server certificates. Defaults to `"false"`.
- **Path**: Update the path in `args` to point to your actual project location.

#### Additional Parameters for SQL Server Authentication (AUTH_METHOD="sql"):
- **SQL_USER**: SQL Server username
- **SQL_PASSWORD**: SQL Server password

#### Additional Parameters for Windows Authentication (AUTH_METHOD="windows"):
- **DOMAIN**: (Optional) Windows domain
- **USERNAME**: (Optional) Windows username
- **PASSWORD**: (Optional) Windows password
- If not provided, uses current Windows user credentials

## Sample Configurations

You can find sample configuration files in the `src/samples/` folder:

- `claude_desktop_config.json` - For Claude Desktop
- `vscode_agent_config.json` - For VS Code Agent

### Example: Local SQL Server with Windows Authentication

**Claude Desktop (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "mssql": {
      "command": "node",
      "args": ["C:/path/to/your/dist/index.js"],
      "env": {
        "SERVER_NAME": "localhost",
        "DATABASE_NAME": "MyDatabase",
        "AUTH_METHOD": "windows",
        "TRUST_SERVER_CERTIFICATE": "true",
        "READONLY": "false"
      }
    }
  }
}
```

**VS Code (`.vscode/mcp.json`):**
```json
{
  "servers": {
    "mssql": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/your/dist/index.js"],
      "env": {
        "SERVER_NAME": "localhost",
        "DATABASE_NAME": "MyDatabase",
        "AUTH_METHOD": "windows",
        "TRUST_SERVER_CERTIFICATE": "true",
        "READONLY": "false"
      }
    }
  }
}
```

### Example: Local SQL Server with SQL Authentication

```json
{
  "env": {
    "SERVER_NAME": "localhost",
    "DATABASE_NAME": "MyDatabase",
    "AUTH_METHOD": "sql",
    "SQL_USER": "sa",
    "SQL_PASSWORD": "YourPassword123!",
    "TRUST_SERVER_CERTIFICATE": "true",
    "READONLY": "false"
  }
}
```

### Example: Azure SQL Database

```json
{
  "env": {
    "SERVER_NAME": "myserver.database.windows.net",
    "DATABASE_NAME": "MyDatabase",
    "AUTH_METHOD": "default",
    "READONLY": "false"
  }
}
```

## Usage Examples

Once configured, you can interact with your database using natural language:

- "Show me all users from New York"
- "Create a new table called products with columns for id, name, and price"
- "Update all pending orders to completed status"
- "List all tables in the database"
- "Describe the schema of the users table"

### Schema Support

All tools now support optional schema names (defaults to 'dbo' if not specified):

- "Create a table called products in the sales schema"
- "List all tables in the dbo schema"
- "Drop the temp_data table from the staging schema"
- "Describe the customers table in the sales schema"

This allows you to work with multi-schema databases more effectively.

## Security Notes

- All SQL identifiers (table names, column names, schema names) are validated and escaped to prevent SQL injection
- The server requires a WHERE clause for read operations to prevent accidental full table scans
- Update operations require explicit WHERE clauses for security
- Set `READONLY: "true"` in environments if you only need read access
- Character and data type validation prevents malicious input
- Token refresh includes 5-minute buffer to prevent expiration during long queries (Azure SQL)
- Use `AUTH_METHOD="default"` (DefaultAzureCredential) for production Azure environments for better security

### Authentication Methods

**For Azure SQL Database:**
- **DefaultAzureCredential** (recommended): Automatically uses managed identity, environment variables, or Azure CLI credentials
- **InteractiveBrowserCredential**: Opens a browser for interactive login, useful for development

**For Local SQL Server:**
- **Windows/Integrated Authentication**: Uses current Windows user credentials or specified domain credentials
- **SQL Server Authentication**: Traditional username/password authentication

**Important Security Notes:**
- Never commit passwords or connection strings to source control
- For local SQL Server, Windows Authentication is more secure than SQL Authentication
- Use `TRUST_SERVER_CERTIFICATE="true"` only for development/testing with self-signed certificates
- Consider using `READONLY="true"` when querying production databases

You should now have successfully configured the MCP server for MSSQL Database with your preferred AI assistant. This setup allows you to seamlessly interact with MSSQL Database through natural language queries!

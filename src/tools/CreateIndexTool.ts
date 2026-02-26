import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CreateIndexParams, ToolResponse } from "../types/toolParams.js";
import { 
  validateSqlIdentifier, 
  validateSqlIdentifiers, 
  escapeSqlIdentifier 
} from "../utils/sqlValidation.js";
import { getSqlRequest } from "../index.js";

export class CreateIndexTool implements Tool {
  name = "create_index";
  description = "Creates an index on a specified column or columns in an MSSQL Database table. Optionally specify a schema name (defaults to 'dbo').";
  inputSchema = {
    type: "object",
    properties: {
      schemaName: { 
        type: "string", 
        description: "Name of the schema containing the table (optional, defaults to 'dbo')" 
      },
      tableName: { 
        type: "string", 
        description: "Name of the table to create index on" 
      },
      indexName: { 
        type: "string", 
        description: "Name for the new index" 
      },
      columns: { 
        type: "array", 
        items: { type: "string" },
        description: "Array of column names to include in the index" 
      },
      isUnique: { 
        type: "boolean", 
        description: "Whether the index should enforce uniqueness (default: false)",
        default: false
      },
      isClustered: { 
        type: "boolean", 
        description: "Whether the index should be clustered (default: false)",
        default: false
      },
    },
    required: ["tableName", "indexName", "columns"],
  } as any;

  async run(params: CreateIndexParams): Promise<ToolResponse> {
    try {
      const { 
        schemaName = 'dbo', 
        tableName, 
        indexName, 
        columns, 
        isUnique = false, 
        isClustered = false 
      } = params;

      // Validate all identifiers to prevent SQL injection
      validateSqlIdentifier(schemaName, "schema name");
      validateSqlIdentifier(tableName, "table name");
      validateSqlIdentifier(indexName, "index name");
      
      if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("'columns' must be a non-empty array");
      }
      
      validateSqlIdentifiers(columns, "column name");

      // Build index type string
      let indexType = isClustered ? "CLUSTERED" : "NONCLUSTERED";
      if (isUnique) {
        indexType = `UNIQUE ${indexType}`;
      }

      // Build secure query with validated and escaped identifiers
      const fullTableName = `${escapeSqlIdentifier(schemaName)}.${escapeSqlIdentifier(tableName)}`;
      const columnList = columns.map(escapeSqlIdentifier).join(", ");
      const query = `CREATE ${indexType} INDEX ${escapeSqlIdentifier(indexName)} ON ${fullTableName} (${columnList})`;
      
      console.error(`Creating index: ${indexName} on ${fullTableName}`);
      
      const request = getSqlRequest();
      await request.query(query);
      
      return {
        success: true,
        message: `Index '${indexName}' created successfully on table '${schemaName}.${tableName}'`,
        details: {
          schemaName,
          tableName,
          indexName,
          columns,
          isUnique,
          isClustered
        }
      };
    } catch (error) {
      console.error("Error creating index:", error);
      return {
        success: false,
        message: `Failed to create index: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
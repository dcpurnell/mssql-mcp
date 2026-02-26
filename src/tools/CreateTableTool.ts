import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CreateTableParams, ToolResponse } from "../types/toolParams.js";
import { 
  validateSqlIdentifier, 
  validateSqlDataType, 
  escapeSqlIdentifier 
} from "../utils/sqlValidation.js";

export class CreateTableTool implements Tool {
  name = "create_table";
  description = "Creates a new table in the MSSQL Database with the specified columns. Optionally specify a schema name (defaults to 'dbo').";
  inputSchema = {
    type: "object",
    properties: {
      schemaName: { 
        type: "string", 
        description: "Name of the schema (optional, defaults to 'dbo')" 
      },
      tableName: { 
        type: "string", 
        description: "Name of the table to create" 
      },
      columns: {
        type: "array",
        description: "Array of column definitions (e.g., [{ name: 'id', type: 'INT PRIMARY KEY' }, ...])",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Column name" },
            type: { type: "string", description: "SQL type and constraints (e.g., 'INT PRIMARY KEY', 'NVARCHAR(255) NOT NULL')" }
          },
          required: ["name", "type"]
        }
      }
    },
    required: ["tableName", "columns"],
  } as any;

  async run(params: CreateTableParams): Promise<ToolResponse> {
    try {
      const { schemaName = 'dbo', tableName, columns } = params;
      
      // Validate inputs to prevent SQL injection
      validateSqlIdentifier(schemaName, "schema name");
      validateSqlIdentifier(tableName, "table name");
      
      if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("'columns' must be a non-empty array");
      }

      // Validate each column definition
      const columnDefs = columns.map((col, index) => {
        if (!col.name || !col.type) {
          throw new Error(`Column ${index} must have both 'name' and 'type' properties`);
        }
        
        validateSqlIdentifier(col.name, `column name at index ${index}`);
        validateSqlDataType(col.type);
        
        return `${escapeSqlIdentifier(col.name)} ${col.type}`;
      }).join(", ");

      // Build secure query with validated identifiers
      const fullTableName = `${escapeSqlIdentifier(schemaName)}.${escapeSqlIdentifier(tableName)}`;
      const query = `CREATE TABLE ${fullTableName} (${columnDefs})`;
      
      console.log(`Creating table: ${fullTableName}`);
      await new sql.Request().query(query);
      
      return {
        success: true,
        message: `Table '${schemaName}.${tableName}' created successfully with ${columns.length} column(s).`
      };
    } catch (error) {
      console.error("Error creating table:", error);
      return {
        success: false,
        message: `Failed to create table: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

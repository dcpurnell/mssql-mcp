import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DropTableParams, ToolResponse } from "../types/toolParams.js";
import { validateSqlIdentifier, escapeSqlIdentifier } from "../utils/sqlValidation.js";

export class DropTableTool implements Tool {
  name = "drop_table";
  description = "Drops a table from the MSSQL Database. Optionally specify a schema name (defaults to 'dbo'). WARNING: This operation cannot be undone.";
  inputSchema = {
    type: "object",
    properties: {
      schemaName: { 
        type: "string", 
        description: "Name of the schema (optional, defaults to 'dbo')" 
      },
      tableName: { 
        type: "string", 
        description: "Name of the table to drop" 
      }
    },
    required: ["tableName"],
  } as any;

  async run(params: DropTableParams): Promise<ToolResponse> {
    try {
      const { schemaName = 'dbo', tableName } = params;
      
      // Validate identifiers to prevent SQL injection
      validateSqlIdentifier(schemaName, "schema name");
      validateSqlIdentifier(tableName, "table name");
      
      // Build secure query with validated and escaped identifiers
      const fullTableName = `${escapeSqlIdentifier(schemaName)}.${escapeSqlIdentifier(tableName)}`;
      const query = `DROP TABLE ${fullTableName}`;
      
      console.log(`Dropping table: ${fullTableName}`);
      await new sql.Request().query(query);
      
      return {
        success: true,
        message: `Table '${schemaName}.${tableName}' dropped successfully.`
      };
    } catch (error) {
      console.error("Error dropping table:", error);
      return {
        success: false,
        message: `Failed to drop table: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
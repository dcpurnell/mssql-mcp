import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DescribeTableParams, ToolResponse } from "../types/toolParams.js";
import { validateSqlIdentifier } from "../utils/sqlValidation.js";

export class DescribeTableTool implements Tool {
  name = "describe_table";
  description = "Describes the schema (columns and types) of a specified MSSQL Database table. Optionally specify a schema name (defaults to 'dbo').";
  inputSchema = {
    type: "object",
    properties: {
      schemaName: { 
        type: "string", 
        description: "Name of the schema (optional, defaults to 'dbo')" 
      },
      tableName: { 
        type: "string", 
        description: "Name of the table to describe" 
      },
    },
    required: ["tableName"],
  } as any;

  async run(params: DescribeTableParams): Promise<ToolResponse> {
    try {
      const { schemaName = 'dbo', tableName } = params;
      
      // Validate identifiers to prevent SQL injection
      validateSqlIdentifier(schemaName, "schema name");
      validateSqlIdentifier(tableName, "table name");
      
      const request = new sql.Request();
      
      // Use parameterized query with both schema and table name for proper filtering
      const query = `
        SELECT 
          COLUMN_NAME as name, 
          DATA_TYPE as type,
          CHARACTER_MAXIMUM_LENGTH as maxLength,
          IS_NULLABLE as nullable,
          COLUMN_DEFAULT as defaultValue
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = @schemaName 
          AND TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `;
      
      request.input("schemaName", sql.NVarChar, schemaName);
      request.input("tableName", sql.NVarChar, tableName);
      
      console.log(`Describing table: ${schemaName}.${tableName}`);
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return {
          success: false,
          message: `Table '${schemaName}.${tableName}' not found or has no columns.`
        };
      }
      
      return {
        success: true,
        message: `Successfully retrieved schema for table '${schemaName}.${tableName}'`,
        columns: result.recordset,
        columnCount: result.recordset.length
      };
    } catch (error) {
      console.error("Error describing table:", error);
      return {
        success: false,
        message: `Failed to describe table: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

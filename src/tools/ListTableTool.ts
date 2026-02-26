import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ListTableParams, ToolResponse } from "../types/toolParams.js";
import { validateSqlIdentifiers } from "../utils/sqlValidation.js";

export class ListTableTool implements Tool {
  name = "list_table";
  description = "Lists tables in an MSSQL Database, or list tables in specific schemas. Returns fully qualified table names (schema.table).";
  inputSchema = {
    type: "object",
    properties: {
      parameters: { 
        type: "array", 
        description: "Schemas to filter by (optional). If not provided, returns tables from all schemas.",
        items: {
          type: "string"
        },
        minItems: 0
      },
    },
    required: [],
  };

  async run(params: ListTableParams): Promise<ToolResponse> {
    try {
      const { parameters } = params;
      const request = new sql.Request();
      
      let query = `
        SELECT TABLE_SCHEMA + '.' + TABLE_NAME AS FullTableName
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `;
      
      // If schema filter is provided, validate and add to query using parameterized approach
      if (parameters && Array.isArray(parameters) && parameters.length > 0) {
        // Validate all schema names to prevent SQL injection
        validateSqlIdentifiers(parameters, "schema name");
        
        // Use parameterized query for schema filter
        const schemaParams = parameters.map((schema, index) => {
          const paramName = `schema${index}`;
          request.input(paramName, sql.NVarChar, schema);
          return `@${paramName}`;
        }).join(", ");
        
        query += ` AND TABLE_SCHEMA IN (${schemaParams})`;
      }
      
      query += ` ORDER BY TABLE_SCHEMA, TABLE_NAME`;
      
      console.log(`Listing tables${parameters && parameters.length > 0 ? ` in schemas: ${parameters.join(', ')}` : ''}`);
      const result = await request.query(query);
      
      return {
        success: true,
        message: `List tables executed successfully. Found ${result.recordset.length} table(s).`,
        items: result.recordset,
        count: result.recordset.length
      };
    } catch (error) {
      console.error("Error listing tables:", error);
      return {
        success: false,
        message: `Failed to list tables: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

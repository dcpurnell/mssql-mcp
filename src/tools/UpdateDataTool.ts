import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { UpdateDataParams, ToolResponse } from "../types/toolParams.js";
import { 
  validateSqlIdentifier, 
  validateWhereClause, 
  escapeSqlIdentifier 
} from "../utils/sqlValidation.js";
import { getSqlRequest } from "../index.js";

export class UpdateDataTool implements Tool {
  name = "update_data";
  description = "Updates data in an MSSQL Database table using a WHERE clause. The WHERE clause must be provided for security. Optionally specify a schema name (defaults to 'dbo').";
  inputSchema = {
    type: "object",
    properties: {
      schemaName: { 
        type: "string", 
        description: "Name of the schema (optional, defaults to 'dbo')" 
      },
      tableName: { 
        type: "string", 
        description: "Name of the table to update" 
      },
      updates: {
        type: "object",
        description: "Key-value pairs of columns to update. Example: { 'status': 'active', 'last_updated': '2025-01-01' }",
      },
      whereClause: { 
        type: "string", 
        description: "WHERE clause to identify which records to update. Example: \"genre = 'comedy' AND created_date <= '2025-07-05'\"" 
      },
    },
    required: ["tableName", "updates", "whereClause"],
  } as any;

  async run(params: UpdateDataParams): Promise<ToolResponse> {
    let query: string | undefined;
    try {
      const { schemaName = 'dbo', tableName, updates, whereClause } = params;
      
      // Validate identifiers to prevent SQL injection
      validateSqlIdentifier(schemaName, "schema name");
      validateSqlIdentifier(tableName, "table name");
      
      // Validate WHERE clause is not empty and doesn't contain dangerous patterns
      validateWhereClause(whereClause, false);

      // Validate updates object
      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        throw new Error("'updates' must be a non-empty object");
      }

      const request = getSqlRequest();
      
      // Build SET clause with parameterized queries for security
      const setClause = Object.keys(updates)
        .map((key, index) => {
          // Validate column name
          validateSqlIdentifier(key, `column name '${key}'`);
          
          const paramName = `update_${index}`;
          request.input(paramName, updates[key]);
          return `${escapeSqlIdentifier(key)} = @${paramName}`;
        })
        .join(", ");

      // Build secure query with validated identifiers
      const fullTableName = `${escapeSqlIdentifier(schemaName)}.${escapeSqlIdentifier(tableName)}`;
      query = `UPDATE ${fullTableName} SET ${setClause} WHERE ${whereClause}`;
      
      console.error(`Updating table: ${fullTableName} with WHERE clause`);
      const result = await request.query(query);
      
      return {
        success: true,
        message: `Update completed successfully. ${result.rowsAffected[0]} row(s) affected`,
        rowsAffected: result.rowsAffected[0],
      };
    } catch (error) {
      console.error("Error updating data:", error);
      return {
        success: false,
        message: `Failed to update data${query ? ` with '${query}'` : ''}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

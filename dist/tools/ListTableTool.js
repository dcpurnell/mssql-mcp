import sql from "mssql";
export class ListTableTool {
    constructor() {
        this.name = "list_table";
        this.description = "Lists tables in an MSSQL Database, or list tables in specific schemas";
        this.inputSchema = {
            type: "object",
            properties: {
                parameters: {
                    type: "array",
                    description: "Schemas to filter by (optional)",
                    items: {
                        type: "string"
                    },
                    minItems: 0
                },
            },
            required: [],
        };
    }
    async run(params) {
        try {
            const { parameters } = params;
            const request = new sql.Request();
            const schemaFilter = parameters && parameters.length > 0 ? `AND TABLE_SCHEMA IN (${parameters.map((p) => `'${p}'`).join(", ")})` : "";
            const query = `SELECT TABLE_SCHEMA + '.' + TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ${schemaFilter} ORDER BY TABLE_SCHEMA, TABLE_NAME`;
            const result = await request.query(query);
            return {
                success: true,
                message: `List tables executed successfully`,
                items: result.recordset,
            };
        }
        catch (error) {
            console.error("Error listing tables:", error);
            return {
                success: false,
                message: `Failed to list tables: ${error}`,
            };
        }
    }
}
//# sourceMappingURL=ListTableTool.js.map
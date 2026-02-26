import sql from "mssql";
export class DescribeTableTool {
    constructor() {
        this.name = "describe_table";
        this.description = "Describes the schema (columns and types) of a specified MSSQL Database table.";
        this.inputSchema = {
            type: "object",
            properties: {
                tableName: { type: "string", description: "Name of the table to describe" },
            },
            required: ["tableName"],
        };
    }
    async run(params) {
        try {
            const { tableName } = params;
            const request = new sql.Request();
            const query = `SELECT COLUMN_NAME as name, DATA_TYPE as type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName`;
            request.input("tableName", sql.NVarChar, tableName);
            const result = await request.query(query);
            return {
                success: true,
                columns: result.recordset,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to describe table: ${error}`,
            };
        }
    }
}
//# sourceMappingURL=DescribeTableTool.js.map
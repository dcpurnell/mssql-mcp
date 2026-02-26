import sql from "mssql";
export class DropTableTool {
    constructor() {
        this.name = "drop_table";
        this.description = "Drops a table from the MSSQL Database.";
        this.inputSchema = {
            type: "object",
            properties: {
                tableName: { type: "string", description: "Name of the table to drop" }
            },
            required: ["tableName"],
        };
    }
    async run(params) {
        try {
            const { tableName } = params;
            // Basic validation to prevent SQL injection
            if (!/^[\w\d_]+$/.test(tableName)) {
                throw new Error("Invalid table name.");
            }
            const query = `DROP TABLE [${tableName}]`;
            await new sql.Request().query(query);
            return {
                success: true,
                message: `Table '${tableName}' dropped successfully.`
            };
        }
        catch (error) {
            console.error("Error dropping table:", error);
            return {
                success: false,
                message: `Failed to drop table: ${error}`
            };
        }
    }
}
//# sourceMappingURL=DropTableTool.js.map
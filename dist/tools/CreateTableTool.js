import sql from "mssql";
export class CreateTableTool {
    constructor() {
        this.name = "create_table";
        this.description = "Creates a new table in the MSSQL Database with the specified columns.";
        this.inputSchema = {
            type: "object",
            properties: {
                tableName: { type: "string", description: "Name of the table to create" },
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
        };
    }
    async run(params) {
        try {
            const { tableName, columns } = params;
            if (!Array.isArray(columns) || columns.length === 0) {
                throw new Error("'columns' must be a non-empty array");
            }
            const columnDefs = columns.map((col) => `[${col.name}] ${col.type}`).join(", ");
            const query = `CREATE TABLE [${tableName}] (${columnDefs})`;
            await new sql.Request().query(query);
            return {
                success: true,
                message: `Table '${tableName}' created successfully.`
            };
        }
        catch (error) {
            console.error("Error creating table:", error);
            return {
                success: false,
                message: `Failed to create table: ${error}`
            };
        }
    }
}
//# sourceMappingURL=CreateTableTool.js.map
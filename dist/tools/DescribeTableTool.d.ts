import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class DescribeTableTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: {
        tableName: string;
    }): Promise<{
        success: boolean;
        columns: sql.IRecordSet<any>;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        columns?: undefined;
    }>;
}
//# sourceMappingURL=DescribeTableTool.d.ts.map
import sql from "mssql";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class ListTableTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: any): Promise<{
        success: boolean;
        message: string;
        items: sql.IRecordSet<any>;
    } | {
        success: boolean;
        message: string;
        items?: undefined;
    }>;
}
//# sourceMappingURL=ListTableTool.d.ts.map
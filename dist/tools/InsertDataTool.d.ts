import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class InsertDataTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: any): Promise<{
        success: boolean;
        message: string;
        recordsInserted?: undefined;
    } | {
        success: boolean;
        message: string;
        recordsInserted: number;
    }>;
}
//# sourceMappingURL=InsertDataTool.d.ts.map
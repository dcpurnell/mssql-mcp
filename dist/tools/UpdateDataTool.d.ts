import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class UpdateDataTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: any): Promise<{
        success: boolean;
        message: string;
        rowsAffected: number;
    } | {
        success: boolean;
        message: string;
        rowsAffected?: undefined;
    }>;
}
//# sourceMappingURL=UpdateDataTool.d.ts.map
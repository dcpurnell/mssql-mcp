import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class CreateTableTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=CreateTableTool.d.ts.map
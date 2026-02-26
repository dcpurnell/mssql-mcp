import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class CreateIndexTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    run(params: any): Promise<{
        success: boolean;
        message: string;
        details: {
            schemaName: any;
            tableName: any;
            indexName: any;
            columnNames: any;
            isUnique: any;
            isClustered: any;
        };
    } | {
        success: boolean;
        message: string;
        details?: undefined;
    }>;
}
//# sourceMappingURL=CreateIndexTool.d.ts.map
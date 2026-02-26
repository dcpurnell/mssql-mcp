import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare class ReadDataTool implements Tool {
    [key: string]: any;
    name: string;
    description: string;
    inputSchema: any;
    private static readonly DANGEROUS_KEYWORDS;
    private static readonly DANGEROUS_PATTERNS;
    /**
     * Validates the SQL query for security issues
     * @param query The SQL query to validate
     * @returns Validation result with success flag and error message if invalid
     */
    private validateQuery;
    /**
     * Sanitizes the query result to prevent any potential security issues
     * @param data The query result data
     * @returns Sanitized data
     */
    private sanitizeResult;
    /**
     * Executes the validated SQL query
     * @param params Query parameters
     * @returns Query execution result
     */
    run(params: any): Promise<{
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
        recordCount?: undefined;
        totalRecords?: undefined;
    } | {
        success: boolean;
        message: string;
        data: any[];
        recordCount: number;
        totalRecords: number;
        error?: undefined;
    }>;
}
//# sourceMappingURL=ReadDataTool.d.ts.map
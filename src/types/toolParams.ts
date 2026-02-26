/**
 * Type definitions for all MCP tool parameters
 * Replaces the use of 'any' with proper TypeScript interfaces
 */

/**
 * Parameters for the CreateTable tool
 */
export interface CreateTableParams {
  schemaName?: string;
  tableName: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
}

/**
 * Parameters for the CreateIndex tool
 */
export interface CreateIndexParams {
  schemaName?: string;
  tableName: string;
  indexName: string;
  columns: string[];
  isUnique?: boolean;
  isClustered?: boolean;
}

/**
 * Parameters for the UpdateData tool
 */
export interface UpdateDataParams {
  schemaName?: string;
  tableName: string;
  updates: Record<string, any>;
  whereClause: string;
}

/**
 * Parameters for the InsertData tool
 */
export interface InsertDataParams {
  schemaName?: string;
  tableName: string;
  data: Record<string, any> | Record<string, any>[];
}

/**
 * Parameters for the ReadData tool
 */
export interface ReadDataParams {
  query: string;
}

/**
 * Parameters for the ListTable tool
 */
export interface ListTableParams {
  parameters?: string[]; // schema names to filter by
}

/**
 * Parameters for the DropTable tool
 */
export interface DropTableParams {
  schemaName?: string;
  tableName: string;
}

/**
 * Parameters for the DescribeTable tool
 */
export interface DescribeTableParams {
  schemaName?: string;
  tableName: string;
}

/**
 * Common response interface for tool operations
 */
export interface ToolResponse {
  success: boolean;
  message: string;
  [key: string]: any; // Allow additional properties specific to each tool
}

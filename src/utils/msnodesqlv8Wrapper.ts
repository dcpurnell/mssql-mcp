// Wrapper to make msnodesqlv8 work like the mssql library
// This allows Kerberos ticket authentication to work seamlessly

export interface Connection {
  query: (sql: string, callback: (err: any, results: any[]) => void) => void;
  close: () => void;
}

export interface QueryResult {
  recordset: any[];
  recordsets: any[][];
  rowsAffected: number[];
}

export class MsNodeSqlV8Pool {
  private connectionString: string;
  private sql: any;
  private currentConnection: Connection | null = null;

  constructor(connectionString: string, msnodesqlv8Module: any) {
    this.connectionString = connectionString;
    this.sql = msnodesqlv8Module;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sql.open(this.connectionString, (err: any, conn: Connection) => {
        if (err) {
          reject(new Error(`Failed to connect: ${err.message || err}`));
        } else {
          this.currentConnection = conn;
          resolve();
        }
      });
    });
  }

  request(): QueryRequest {
    if (!this.currentConnection) {
      throw new Error('Not connected. Call connect() first.');
    }
    return new QueryRequest(this.currentConnection);
  }

  async close(): Promise<void> {
    if (this.currentConnection) {
      this.currentConnection.close();
      this.currentConnection = null;
    }
  }

  get connected(): boolean {
    return this.currentConnection !== null;
  }
}

export class QueryRequest {
  private connection: Connection;
  private inputParams: Map<string, any> = new Map();

  constructor(connection: Connection) {
    this.connection = connection;
  }

  input(name: string, value: any): this {
    this.inputParams.set(name, value);
    return this;
  }

  async query(sqlQuery: string): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      // Replace named parameters with values
      let processedQuery = sqlQuery;
      this.inputParams.forEach((value, name) => {
        // Simple parameter replacement - escape single quotes in string values
        let paramValue: string;
        if (value === null || value === undefined) {
          paramValue = 'NULL';
        } else if (typeof value === 'string') {
          paramValue = `'${value.replace(/'/g, "''")}'`;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          paramValue = String(value);
        } else {
          paramValue = `'${String(value).replace(/'/g, "''")}'`;
        }
        processedQuery = processedQuery.replace(new RegExp(`@${name}\\b`, 'g'), paramValue);
      });

      this.connection.query(processedQuery, (err, results) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message || err}`));
        } else {
          // Convert results to mssql library format
          const queryResult: QueryResult = {
            recordset: results || [],
            recordsets: [results || []],
            rowsAffected: [results?.length || 0]
          };
          resolve(queryResult);
        }
      });
    });
  }
}

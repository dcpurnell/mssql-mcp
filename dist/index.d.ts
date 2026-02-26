#!/usr/bin/env node
import sql from "mssql";
export declare function createSqlConfig(): Promise<{
    config: sql.config;
    token: string;
    expiresOn: Date;
}>;
//# sourceMappingURL=index.d.ts.map
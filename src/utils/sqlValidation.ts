/**
 * SQL Validation Utilities
 * Provides secure validation and escaping for SQL identifiers to prevent SQL injection
 */

/**
 * Validates that a string is a safe SQL identifier (table name, column name, schema name, etc.)
 * Allows only alphanumeric characters, underscores, and hyphens
 * Prevents SQL injection through identifier names
 */
export function validateSqlIdentifier(identifier: string, identifierType: string = "identifier"): void {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error(`${identifierType} must be a non-empty string`);
  }

  // SQL identifiers should only contain alphanumeric, underscore, and hyphen
  // This prevents SQL injection through identifiers
  const validIdentifierPattern = /^[a-zA-Z0-9_-]+$/;
  
  if (!validIdentifierPattern.test(identifier)) {
    throw new Error(
      `Invalid ${identifierType}: "${identifier}". ` +
      `Identifiers can only contain letters, numbers, underscores, and hyphens.`
    );
  }

  // Additional safety: prevent SQL keywords as identifiers
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
    'TRUNCATE', 'EXEC', 'EXECUTE', 'UNION', 'WHERE', 'FROM', 'JOIN'
  ];
  
  if (sqlKeywords.includes(identifier.toUpperCase())) {
    throw new Error(
      `Invalid ${identifierType}: "${identifier}". ` +
      `SQL keywords cannot be used as identifiers without proper escaping.`
    );
  }

  // Prevent identifiers that are too long (SQL Server limit is 128 characters)
  if (identifier.length > 128) {
    throw new Error(
      `Invalid ${identifierType}: "${identifier}". ` +
      `Identifier is too long (max 128 characters).`
    );
  }
}

/**
 * Validates an array of SQL identifiers
 */
export function validateSqlIdentifiers(identifiers: string[], identifierType: string = "identifier"): void {
  if (!Array.isArray(identifiers)) {
    throw new Error(`${identifierType} list must be an array`);
  }
  
  identifiers.forEach((identifier, index) => {
    validateSqlIdentifier(identifier, `${identifierType}[${index}]`);
  });
}

/**
 * Safely escapes a SQL identifier by wrapping it in brackets
 * Only use this AFTER validation with validateSqlIdentifier
 */
export function escapeSqlIdentifier(identifier: string): string {
  // First validate
  validateSqlIdentifier(identifier);
  
  // Escape any existing brackets in the identifier
  const escaped = identifier.replace(/\]/g, ']]');
  
  // Wrap in brackets for SQL Server
  return `[${escaped}]`;
}

/**
 * Validates and escapes multiple SQL identifiers, joining them with commas
 */
export function escapeSqlIdentifiers(identifiers: string[]): string {
  validateSqlIdentifiers(identifiers);
  return identifiers.map(escapeSqlIdentifier).join(', ');
}

/**
 * Validates that a SQL data type string is safe
 * Used for CREATE TABLE column definitions
 */
export function validateSqlDataType(dataType: string): void {
  if (!dataType || typeof dataType !== 'string') {
    throw new Error('Data type must be a non-empty string');
  }

  // Allow common SQL Server data types with constraints
  // This is a whitelist approach for safety
  const validDataTypePattern = /^((VAR)?CHAR|(N)?(VAR)?CHAR|(TINY|SMALL|BIG)?INT|DECIMAL|NUMERIC|FLOAT|REAL|(SMALL)?MONEY|BIT|(SMALL)?DATETIME|DATETIME2?|DATE|TIME|(VAR)?BINARY|UNIQUEIDENTIFIER|XML|TEXT|NTEXT|IMAGE)\s*(\(\d+(,\s*\d+)?\))?\s*((NOT\s+)?NULL|PRIMARY\s+KEY|UNIQUE|IDENTITY(\(\d+,\s*\d+\))?|DEFAULT\s+[^;]+)*$/i;

  if (!validDataTypePattern.test(dataType.trim())) {
    throw new Error(
      `Invalid or potentially unsafe SQL data type: "${dataType}". ` +
      `Use standard SQL Server data types with appropriate constraints.`
    );
  }

  // Additional check: ensure no dangerous keywords
  const dangerous = ['DROP', 'EXEC', 'EXECUTE', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE'];
  const upperDataType = dataType.toUpperCase();
  
  for (const keyword of dangerous) {
    if (upperDataType.includes(keyword)) {
      throw new Error(
        `Data type contains potentially dangerous keyword: "${keyword}"`
      );
    }
  }

  if (dataType.length > 500) {
    throw new Error('Data type definition is too long (max 500 characters)');
  }
}

/**
 * Validates a WHERE clause to ensure it's not empty and doesn't contain suspicious patterns
 */
export function validateWhereClause(whereClause: string, allowEmpty: boolean = false): void {
  if (!whereClause || typeof whereClause !== 'string') {
    if (allowEmpty) return;
    throw new Error('WHERE clause is required for security reasons');
  }

  const trimmed = whereClause.trim();
  
  if (!allowEmpty && trimmed === '') {
    throw new Error('WHERE clause cannot be empty for security reasons');
  }

  // Check for suspicious patterns that might indicate SQL injection attempts
  const suspiciousPatterns = [
    /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE)/i,
    /--.*?(DROP|DELETE|TRUNCATE|ALTER|CREATE)/i,
    /EXEC\s*\(/i,
    /EXECUTE\s*\(/i,
    /xp_/i,
    /sp_executesql/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(whereClause)) {
      throw new Error(
        'WHERE clause contains potentially dangerous SQL patterns. ' +
        'Use parameterized queries for complex conditions.'
      );
    }
  }

  if (whereClause.length > 5000) {
    throw new Error('WHERE clause is too long (max 5000 characters)');
  }
}

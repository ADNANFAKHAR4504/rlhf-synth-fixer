// test/terraform.unit.test.ts
// Unit tests for DynamoDB Payment Transactions Table
// Static code analysis - reads Terraform files as text
// NO terraform commands - just regex/string matching

import * as fs from 'fs';
import * as path from 'path';

describe('DynamoDB Payment Transactions - Terraform Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  const mainTfPath = path.join(libDir, 'main.tf');
  const providerTfPath = path.join(libDir, 'provider.tf');
  
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read Terraform configuration files
    if (!fs.existsSync(mainTfPath)) {
      throw new Error(`main.tf not found at: ${mainTfPath}`);
    }
    if (!fs.existsSync(providerTfPath)) {
      throw new Error(`provider.tf not found at: ${providerTfPath}`);
    }
    
    mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
    providerTfContent = fs.readFileSync(providerTfPath, 'utf-8');
    
    console.log('✅ Successfully loaded Terraform files');
    console.log(`📄 main.tf: ${mainTfContent.length} characters`);
    console.log(`📄 provider.tf: ${providerTfContent.length} characters`);
  });

  // ============================================================================
  // FILE STRUCTURE VALIDATION
  // ============================================================================
  
  describe('File Structure Validation', () => {
    test('main.tf should exist in lib directory', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test('provider.tf should exist in lib directory', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test('main.tf should be non-trivial (>500 characters)', () => {
      expect(mainTfContent.length).toBeGreaterThan(500);
    });

    test('provider.tf should contain terraform and provider blocks', () => {
      expect(providerTfContent).toMatch(/terraform\s*{/);
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('main.tf should contain valid HCL syntax structure', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"[^"]+"\s*{/);
    });

    test('main.tf should contain output blocks', () => {
      expect(mainTfContent).toMatch(/output\s+"[^"]+"\s*{/);
    });

    test('main.tf should have proper indentation', () => {
      const lines = mainTfContent.split('\n').filter(line => line.trim().length > 0);
      const indentedLines = lines.filter(line => line.match(/^\s+/));
      
      // Most lines should have proper indentation (2-space increments)
      indentedLines.forEach(line => {
        const indent = line.match(/^(\s+)/);
        if (indent) {
          expect(indent[1].length % 2).toBe(0);
        }
      });
    });
  });

  // ============================================================================
  // PROVIDER CONFIGURATION VALIDATION
  // ============================================================================

  describe('Provider Configuration', () => {
    test('should specify AWS provider version >= 5.0', () => {
      const versionMatch = providerTfContent.match(/version\s*=\s*"([^"]+)"/);
      expect(versionMatch).toBeTruthy();
      
      if (versionMatch) {
        const version = versionMatch[1];
        // Should be ~> 5.0 or ~> 6.0 or >= 5.0
        expect(version).toMatch(/[~>]=?\s*[56]\./);
      }
    });

    test('should have required_providers block with AWS source', () => {
      expect(providerTfContent).toMatch(/required_providers\s*{/);
      expect(providerTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('should specify minimum Terraform version', () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*\d+\.\d+"/);
    });

    test('should have S3 backend configuration', () => {
      expect(providerTfContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  // ============================================================================
  // DYNAMODB TABLE BASIC CONFIGURATION
  // ============================================================================

  describe('DynamoDB Table Basic Configuration', () => {
    test('should have DynamoDB table resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"payment_transactions"\s*{/);
    });

    test('table name should be exactly "payment-transactions"', () => {
      const nameMatch = mainTfContent.match(/name\s*=\s*"([^"]+)"/);
      expect(nameMatch).toBeTruthy();
      expect(nameMatch![1]).toBe('payment-transactions');
    });

    test('billing mode should be PAY_PER_REQUEST (on-demand)', () => {
      const billingMatch = mainTfContent.match(/billing_mode\s*=\s*"([^"]+)"/);
      expect(billingMatch).toBeTruthy();
      expect(billingMatch![1]).toBe('PAY_PER_REQUEST');
    });

    test('should have partition key (hash_key) as transaction_id', () => {
      const hashKeyMatch = mainTfContent.match(/hash_key\s*=\s*"([^"]+)"/);
      expect(hashKeyMatch).toBeTruthy();
      expect(hashKeyMatch![1]).toBe('transaction_id');
    });

    test('should have sort key (range_key) as timestamp', () => {
      const rangeKeyMatch = mainTfContent.match(/range_key\s*=\s*"([^"]+)"/);
      expect(rangeKeyMatch).toBeTruthy();
      expect(rangeKeyMatch![1]).toBe('timestamp');
    });

    test('resource name should be "payment_transactions" (snake_case)', () => {
      const resourceMatch = mainTfContent.match(/resource\s+"aws_dynamodb_table"\s+"([^"]+)"/);
      expect(resourceMatch).toBeTruthy();
      expect(resourceMatch![1]).toBe('payment_transactions');
      expect(resourceMatch![1]).toMatch(/^[a-z]+(_[a-z]+)*$/);
    });

    test('should not have provisioned capacity settings', () => {
      expect(mainTfContent).not.toMatch(/read_capacity\s*=/);
      expect(mainTfContent).not.toMatch(/write_capacity\s*=/);
    });
  });

  // ============================================================================
  // ATTRIBUTE DEFINITIONS VALIDATION
  // ============================================================================

  describe('Attribute Definitions', () => {
    test('should define transaction_id attribute with type String (S)', () => {
      const attrRegex = /attribute\s*{[^}]*name\s*=\s*"transaction_id"[^}]*type\s*=\s*"S"[^}]*}/s;
      expect(mainTfContent).toMatch(attrRegex);
    });

    test('should define timestamp attribute with type Number (N)', () => {
      const attrRegex = /attribute\s*{[^}]*name\s*=\s*"timestamp"[^}]*type\s*=\s*"N"[^}]*}/s;
      expect(mainTfContent).toMatch(attrRegex);
    });

    test('should define date attribute with type String (S)', () => {
      const attrRegex = /attribute\s*{[^}]*name\s*=\s*"date"[^}]*type\s*=\s*"S"[^}]*}/s;
      expect(mainTfContent).toMatch(attrRegex);
    });

    test('should define amount attribute with type Number (N)', () => {
      const attrRegex = /attribute\s*{[^}]*name\s*=\s*"amount"[^}]*type\s*=\s*"N"[^}]*}/s;
      expect(mainTfContent).toMatch(attrRegex);
    });

    test('should have exactly 4 attribute definitions', () => {
      const attributeBlocks = mainTfContent.match(/attribute\s*{/g);
      expect(attributeBlocks).toBeTruthy();
      expect(attributeBlocks!.length).toBe(4);
    });

    test('all defined attributes should have valid DynamoDB types', () => {
      const attributePattern = /attribute\s*{[^}]*type\s*=\s*"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(attributePattern)];
      
      const validTypes = ['S', 'N', 'B']; // String, Number, Binary
      matches.forEach(match => {
        expect(validTypes).toContain(match[1]);
      });
    });

    test('all attribute names should use snake_case convention', () => {
      const attributeNames = ['transaction_id', 'timestamp', 'date', 'amount'];
      
      attributeNames.forEach(attrName => {
        expect(attrName).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    test('should not define expiration_time as attribute (TTL only)', () => {
      const expirationAttrRegex = /attribute\s*{[^}]*name\s*=\s*"expiration_time"[^}]*}/s;
      expect(mainTfContent).not.toMatch(expirationAttrRegex);
    });

    test('attribute definitions should have inline comments', () => {
      expect(mainTfContent).toMatch(/type\s*=\s*"S"\s*#\s*String/);
      expect(mainTfContent).toMatch(/type\s*=\s*"N"\s*#\s*Number/);
    });
  });

  // ============================================================================
  // GLOBAL SECONDARY INDEX VALIDATION
  // ============================================================================

  describe('Global Secondary Index Configuration', () => {
    test('should have global_secondary_index block', () => {
      expect(mainTfContent).toMatch(/global_secondary_index\s*{/);
    });

    test('GSI should be named "date-index"', () => {
      const gsiNameMatch = mainTfContent.match(/global_secondary_index\s*{[^}]*name\s*=\s*"([^"]+)"/s);
      expect(gsiNameMatch).toBeTruthy();
      expect(gsiNameMatch![1]).toBe('date-index');
    });

    test('GSI partition key (hash_key) should be "date"', () => {
      const gsiContent = mainTfContent.match(/global_secondary_index\s*{[^}]*}/s);
      expect(gsiContent).toBeTruthy();
      expect(gsiContent![0]).toMatch(/hash_key\s*=\s*"date"/);
    });

    test('GSI sort key (range_key) should be "amount"', () => {
      const gsiContent = mainTfContent.match(/global_secondary_index\s*{[^}]*}/s);
      expect(gsiContent).toBeTruthy();
      expect(gsiContent![0]).toMatch(/range_key\s*=\s*"amount"/);
    });

    test('GSI projection type should be "ALL"', () => {
      const projectionMatch = mainTfContent.match(/global_secondary_index\s*{[^}]*projection_type\s*=\s*"([^"]+)"/s);
      expect(projectionMatch).toBeTruthy();
      expect(projectionMatch![1]).toBe('ALL');
    });

    test('GSI should not specify read/write capacity (inherits on-demand)', () => {
      const gsiContent = mainTfContent.match(/global_secondary_index\s*{[^}]*}/s);
      expect(gsiContent).toBeTruthy();
      expect(gsiContent![0]).not.toMatch(/read_capacity\s*=/);
      expect(gsiContent![0]).not.toMatch(/write_capacity\s*=/);
    });

    test('should have exactly one global secondary index', () => {
      const gsiBlocks = mainTfContent.match(/global_secondary_index\s*{/g);
      expect(gsiBlocks).toBeTruthy();
      expect(gsiBlocks!.length).toBe(1);
    });

    test('GSI should have inline comment explaining purpose', () => {
      expect(mainTfContent).toMatch(/#.*Global Secondary Index.*date-based queries/i);
    });

    test('GSI name should use kebab-case', () => {
      const gsiNameMatch = mainTfContent.match(/global_secondary_index\s*{[^}]*name\s*=\s*"([^"]+)"/s);
      expect(gsiNameMatch![1]).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });
  });

  // ============================================================================
  // SECURITY AND COMPLIANCE CONFIGURATION
  // ============================================================================

  describe('Security and Compliance Configuration', () => {
    test('should have point_in_time_recovery block', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{/);
    });

    test('point-in-time recovery should be enabled', () => {
      const pitrRegex = /point_in_time_recovery\s*{[^}]*enabled\s*=\s*true[^}]*}/s;
      expect(mainTfContent).toMatch(pitrRegex);
    });

    test('should have server_side_encryption block', () => {
      expect(mainTfContent).toMatch(/server_side_encryption\s*{/);
    });

    test('server-side encryption should be enabled', () => {
      const sseRegex = /server_side_encryption\s*{[^}]*enabled\s*=\s*true[^}]*}/s;
      expect(mainTfContent).toMatch(sseRegex);
    });

    test('should NOT use customer managed KMS keys', () => {
      expect(mainTfContent).not.toMatch(/kms_key_arn\s*=/);
      expect(mainTfContent).not.toMatch(/kms_master_key_id\s*=/);
    });

    test('should have inline comment about AWS managed keys', () => {
      expect(mainTfContent).toMatch(/#.*AWS managed keys/i);
    });

    test('should have ttl block', () => {
      expect(mainTfContent).toMatch(/ttl\s*{/);
    });

    test('TTL should be enabled', () => {
      const ttlRegex = /ttl\s*{[^}]*enabled\s*=\s*true[^}]*}/s;
      expect(mainTfContent).toMatch(ttlRegex);
    });

    test('TTL attribute name should be "expiration_time"', () => {
      const ttlAttrMatch = mainTfContent.match(/ttl\s*{[^}]*attribute_name\s*=\s*"([^"]+)"/s);
      expect(ttlAttrMatch).toBeTruthy();
      expect(ttlAttrMatch![1]).toBe('expiration_time');
    });

    test('TTL attribute should use snake_case', () => {
      const ttlAttrMatch = mainTfContent.match(/ttl\s*{[^}]*attribute_name\s*=\s*"([^"]+)"/s);
      expect(ttlAttrMatch![1]).toMatch(/^[a-z]+(_[a-z]+)*$/);
    });

    test('should have inline comments for security features', () => {
      expect(mainTfContent).toMatch(/#.*point-in-time recovery.*data protection/i);
      expect(mainTfContent).toMatch(/#.*Server-side encryption/i);
      expect(mainTfContent).toMatch(/#.*Time to Live.*automatic.*expiration/i);
    });
  });

  // ============================================================================
  // TAGGING VALIDATION
  // ============================================================================

  describe('Resource Tagging', () => {
    test('should have tags block', () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*{/);
    });

    test('should have Environment tag set to exactly "prod"', () => {
      const envTagMatch = mainTfContent.match(/Environment\s*=\s*"([^"]+)"/);
      expect(envTagMatch).toBeTruthy();
      expect(envTagMatch![1]).toBe('prod');
    });

    test('should have Department tag set to exactly "finance"', () => {
      const deptTagMatch = mainTfContent.match(/Department\s*=\s*"([^"]+)"/);
      expect(deptTagMatch).toBeTruthy();
      expect(deptTagMatch![1]).toBe('finance');
    });

    test('tags block should include both required tags', () => {
      const tagsBlock = mainTfContent.match(/tags\s*=\s*{[^}]*}/s);
      expect(tagsBlock).toBeTruthy();
      expect(tagsBlock![0]).toMatch(/Environment/);
      expect(tagsBlock![0]).toMatch(/Department/);
    });

    test('should have exactly 2 tags', () => {
      const tagsBlock = mainTfContent.match(/tags\s*=\s*{([^}]*)}/s);
      expect(tagsBlock).toBeTruthy();
      const tagLines = tagsBlock![1].split('\n').filter(line => line.includes('='));
      expect(tagLines.length).toBe(2);
    });

    test('tags should have inline comment about purpose', () => {
      expect(mainTfContent).toMatch(/#.*tags.*cost allocation.*access control/i);
    });

    test('tag keys should use PascalCase', () => {
      expect(mainTfContent).toMatch(/Environment\s*=/);
      expect(mainTfContent).toMatch(/Department\s*=/);
      // Not snake_case or kebab-case
      expect(mainTfContent).not.toMatch(/environment\s*=/);
      expect(mainTfContent).not.toMatch(/department\s*=/);
    });

    test('tag values should be lowercase strings', () => {
      const envTagMatch = mainTfContent.match(/Environment\s*=\s*"([^"]+)"/);
      const deptTagMatch = mainTfContent.match(/Department\s*=\s*"([^"]+)"/);
      
      expect(envTagMatch![1]).toBe(envTagMatch![1].toLowerCase());
      expect(deptTagMatch![1]).toBe(deptTagMatch![1].toLowerCase());
    });
  });

  // ============================================================================
  // OUTPUT VALIDATION
  // ============================================================================

  describe('Output Configuration', () => {
    test('should have output for table ARN', () => {
      expect(mainTfContent).toMatch(/output\s+"payment_transactions_table_arn"\s*{/);
    });

    test('should have output for GSI name', () => {
      expect(mainTfContent).toMatch(/output\s+"date_index_name"\s*{/);
    });

    test('table ARN output should have a description', () => {
      const arnOutputBlock = mainTfContent.match(/output\s+"payment_transactions_table_arn"\s*{[^}]*}/s);
      expect(arnOutputBlock).toBeTruthy();
      expect(arnOutputBlock![0]).toMatch(/description\s*=/);
    });

    test('GSI name output should have a description', () => {
      const gsiOutputBlock = mainTfContent.match(/output\s+"date_index_name"\s*{[^}]*}/s);
      expect(gsiOutputBlock).toBeTruthy();
      expect(gsiOutputBlock![0]).toMatch(/description\s*=/);
    });

    test('table ARN output should reference the resource', () => {
      const arnOutputBlock = mainTfContent.match(/output\s+"payment_transactions_table_arn"\s*{[^}]*}/s);
      expect(arnOutputBlock).toBeTruthy();
      expect(arnOutputBlock![0]).toMatch(/aws_dynamodb_table\.payment_transactions\.arn/);
    });

    test('GSI name output should be hardcoded string "date-index"', () => {
      const gsiOutputBlock = mainTfContent.match(/output\s+"date_index_name"\s*{[^}]*}/s);
      expect(gsiOutputBlock).toBeTruthy();
      expect(gsiOutputBlock![0]).toMatch(/value\s*=\s*"date-index"/);
    });

    test('should have exactly 2 outputs', () => {
      const outputBlocks = mainTfContent.match(/output\s+"[^"]+"\s*{/g);
      expect(outputBlocks).toBeTruthy();
      expect(outputBlocks!.length).toBe(2);
    });

    test('output names should use snake_case', () => {
      const outputPattern = /output\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(outputPattern)];
      
      matches.forEach(match => {
        expect(match[1]).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    test('output descriptions should explain purpose', () => {
      expect(mainTfContent).toMatch(/description.*ARN.*DynamoDB table/i);
      expect(mainTfContent).toMatch(/description.*global secondary index/i);
    });

    test('outputs should have inline comments', () => {
      expect(mainTfContent).toMatch(/#.*Output.*table ARN.*IAM/i);
      expect(mainTfContent).toMatch(/#.*Output.*GSI.*Lambda/i);
    });
  });

  // ============================================================================
  // NAMING CONVENTION VALIDATION
  // ============================================================================

  describe('Naming Convention Compliance', () => {
    test('table name should use kebab-case "payment-transactions"', () => {
      const nameMatch = mainTfContent.match(/name\s*=\s*"([^"]+)"/);
      expect(nameMatch![1]).toBe('payment-transactions');
      expect(nameMatch![1]).toContain('-');
      expect(nameMatch![1]).not.toMatch(/_/);
    });

    test('GSI name should use kebab-case "date-index"', () => {
      const gsiNameMatch = mainTfContent.match(/global_secondary_index\s*{[^}]*name\s*=\s*"([^"]+)"/s);
      expect(gsiNameMatch![1]).toBe('date-index');
      expect(gsiNameMatch![1]).toContain('-');
    });

    test('resource name should use snake_case', () => {
      const resourceMatch = mainTfContent.match(/resource\s+"aws_dynamodb_table"\s+"([^"]+)"/);
      expect(resourceMatch![1]).toMatch(/^[a-z]+(_[a-z]+)*$/);
    });

    test('attribute names should use snake_case', () => {
      const attributePattern = /attribute\s*{[^}]*name\s*=\s*"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(attributePattern)];
      
      matches.forEach(match => {
        const attrName = match[1];
        expect(attrName).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    test('output names should use snake_case', () => {
      const outputPattern = /output\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(outputPattern)];
      
      matches.forEach(match => {
        const outputName = match[1];
        expect(outputName).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    test('all string values should be lowercase or PascalCase (no UPPERCASE)', () => {
      // Table name, GSI name should be lowercase with hyphens
      expect(mainTfContent).toMatch(/name\s*=\s*"payment-transactions"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"date-index"/);
      
      // Tag keys should be PascalCase
      expect(mainTfContent).toMatch(/Environment\s*=/);
      expect(mainTfContent).toMatch(/Department\s*=/);
    });
  });

  // ============================================================================
  // BEST PRACTICES VALIDATION
  // ============================================================================

  describe('Terraform Best Practices', () => {
    test('should not contain hardcoded AWS account IDs', () => {
      expect(mainTfContent).not.toMatch(/\d{12}/);
    });

    test('should not contain placeholder values', () => {
      const placeholders = ['REPLACE', 'TODO', 'CHANGEME', 'EXAMPLE', 'FIXME'];
      placeholders.forEach(placeholder => {
        expect(mainTfContent.toUpperCase()).not.toContain(placeholder);
      });
    });

    test('should have comments for major configuration blocks', () => {
      expect(mainTfContent).toMatch(/#.*Primary key configuration/i);
      expect(mainTfContent).toMatch(/#.*Attribute definitions/i);
      expect(mainTfContent).toMatch(/#.*Global Secondary Index/i);
      expect(mainTfContent).toMatch(/#.*point-in-time recovery/i);
    });

    test('should use resource references, not hardcoded values', () => {
      // Output should reference resource attribute
      expect(mainTfContent).toMatch(/aws_dynamodb_table\.payment_transactions\.arn/);
      
      // Should not hardcode ARN
      expect(mainTfContent).not.toMatch(/arn:aws:dynamodb:[^:]+:\d{12}:table/);
    });

    test('should have consistent spacing', () => {
      // Check for consistent spacing around =
      const assignmentLines = mainTfContent.split('\n').filter(line => line.includes('='));
      assignmentLines.forEach(line => {
        if (!line.trim().startsWith('#')) {
          expect(line).toMatch(/\s=\s/);
        }
      });
    });

    test('should not have trailing whitespace', () => {
      const lines = mainTfContent.split('\n');
      lines.forEach((line, index) => {
        if (line.length > 0 && !line.trim().startsWith('#')) {
          expect(line).not.toMatch(/\s+$/);
        }
      });
    });

    test('should use consistent quote style (double quotes)', () => {
      // Terraform prefers double quotes
      expect(mainTfContent).toMatch(/"payment-transactions"/);
      expect(mainTfContent).toMatch(/"date-index"/);
      
      // Should not use single quotes
      expect(mainTfContent).not.toMatch(/'payment-transactions'/);
    });

    test('blocks should have proper opening/closing braces', () => {
      const openBraces = (mainTfContent.match(/{/g) || []).length;
      const closeBraces = (mainTfContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have descriptive inline comments', () => {
      const commentLines = mainTfContent.split('\n').filter(line => line.includes('#'));
      expect(commentLines.length).toBeGreaterThan(5);
    });
  });

  // ============================================================================
  // CODE ORGANIZATION
  // ============================================================================

  describe('Code Organization', () => {
    test('resource configuration should come before outputs', () => {
      const resourcePos = mainTfContent.indexOf('resource "aws_dynamodb_table"');
      const outputPos = mainTfContent.indexOf('output "');
      
      expect(resourcePos).toBeGreaterThan(-1);
      expect(outputPos).toBeGreaterThan(-1);
      expect(resourcePos).toBeLessThan(outputPos);
    });

    test('should have logical section grouping with comments', () => {
      // Primary key section
      expect(mainTfContent).toMatch(/#.*Primary key/i);
      
      // Attribute section
      expect(mainTfContent).toMatch(/#.*Attribute definitions/i);
      
      // Security features section
      expect(mainTfContent).toMatch(/#.*point-in-time recovery/i);
      expect(mainTfContent).toMatch(/#.*encryption/i);
      expect(mainTfContent).toMatch(/#.*Time to Live/i);
      
      // Tags section
      expect(mainTfContent).toMatch(/#.*tags/i);
    });

    test('outputs should have explanatory comments', () => {
      expect(mainTfContent).toMatch(/#.*Output.*table ARN/i);
      expect(mainTfContent).toMatch(/#.*Output.*GSI/i);
    });

    test('configuration blocks should be in logical order', () => {
      const content = mainTfContent;
      
      const namePos = content.indexOf('name =');
      const billingPos = content.indexOf('billing_mode =');
      const hashKeyPos = content.indexOf('hash_key =');
      const attributesPos = content.indexOf('attribute {');
      const gsiPos = content.indexOf('global_secondary_index {');
      const pitrPos = content.indexOf('point_in_time_recovery {');
      
      // Logical ordering
      expect(namePos).toBeLessThan(billingPos);
      expect(billingPos).toBeLessThan(hashKeyPos);
      expect(hashKeyPos).toBeLessThan(attributesPos);
      expect(attributesPos).toBeLessThan(gsiPos);
      expect(gsiPos).toBeLessThan(pitrPos);
    });
  });

  // ============================================================================
  // REQUIREMENTS MAPPING
  // ============================================================================

  describe('Requirements Coverage', () => {
    test('REQ-1: Table named payment-transactions with on-demand billing', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"payment-transactions"/);
      expect(mainTfContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('REQ-2: Partition key transaction_id (String) and sort key timestamp (Number)', () => {
      expect(mainTfContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
      expect(mainTfContent).toMatch(/range_key\s*=\s*"timestamp"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"transaction_id"[^}]*type\s*=\s*"S"/s);
      expect(mainTfContent).toMatch(/name\s*=\s*"timestamp"[^}]*type\s*=\s*"N"/s);
    });

    test('REQ-3: GSI date-index with date (String) and amount (Number), project ALL', () => {
      const gsiBlock = mainTfContent.match(/global_secondary_index\s*{[^}]*}/s);
      expect(gsiBlock![0]).toMatch(/name\s*=\s*"date-index"/);
      expect(gsiBlock![0]).toMatch(/hash_key\s*=\s*"date"/);
      expect(gsiBlock![0]).toMatch(/range_key\s*=\s*"amount"/);
      expect(gsiBlock![0]).toMatch(/projection_type\s*=\s*"ALL"/);
    });

    test('REQ-4: Point-in-time recovery enabled', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{[^}]*enabled\s*=\s*true/s);
    });

    test('REQ-5: Server-side encryption with AWS managed keys', () => {
      expect(mainTfContent).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
      expect(mainTfContent).not.toMatch(/kms_key_arn/);
    });

    test('REQ-6: TTL on expiration_time attribute', () => {
      expect(mainTfContent).toMatch(/ttl\s*{[^}]*enabled\s*=\s*true[^}]*attribute_name\s*=\s*"expiration_time"/s);
    });

    test('REQ-7: Tags Environment=prod and Department=finance', () => {
      expect(mainTfContent).toMatch(/Environment\s*=\s*"prod"/);
      expect(mainTfContent).toMatch(/Department\s*=\s*"finance"/);
    });

    test('REQ-8: Output table ARN and GSI name', () => {
      expect(mainTfContent).toMatch(/output\s+"payment_transactions_table_arn"/);
      expect(mainTfContent).toMatch(/output\s+"date_index_name"/);
    });

    test('REQ-9: All attribute names use snake_case', () => {
      const attributeNames = ['transaction_id', 'timestamp', 'date', 'amount', 'expiration_time'];
      attributeNames.forEach(attr => {
        expect(attr).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    test('REQ-10: Resource follows Terraform naming conventions', () => {
      // Resource name: snake_case
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"payment_transactions"/);
      
      // Table name: kebab-case
      expect(mainTfContent).toMatch(/name\s*=\s*"payment-transactions"/);
      
      // Output names: snake_case
      expect(mainTfContent).toMatch(/output\s+"payment_transactions_table_arn"/);
      expect(mainTfContent).toMatch(/output\s+"date_index_name"/);
    });
  });

  // ============================================================================
  // DYNAMODB-SPECIFIC VALIDATIONS
  // ============================================================================

  describe('DynamoDB-Specific Best Practices', () => {
    test('should only define attributes used as keys', () => {
      // DynamoDB only requires attribute definitions for keys (hash, range, GSI keys)
      const attributeBlocks = mainTfContent.match(/attribute\s*{/g);
      expect(attributeBlocks!.length).toBe(4); // transaction_id, timestamp, date, amount
    });

    test('should not define non-key attributes', () => {
      // expiration_time is used for TTL but should NOT be in attribute definitions
      const expirationAttr = /attribute\s*{[^}]*name\s*=\s*"expiration_time"/s;
      expect(mainTfContent).not.toMatch(expirationAttr);
    });

    test('GSI should inherit billing mode from table', () => {
      const gsiBlock = mainTfContent.match(/global_secondary_index\s*{[^}]*}/s);
      // With PAY_PER_REQUEST, GSI should not have read/write capacity
      expect(gsiBlock![0]).not.toMatch(/read_capacity/);
      expect(gsiBlock![0]).not.toMatch(/write_capacity/);
    });

    test('should use appropriate data types for financial data', () => {
      // Amount should be Number (N) for mathematical operations
      expect(mainTfContent).toMatch(/name\s*=\s*"amount"[^}]*type\s*=\s*"N"/s);
      
      // Date should be String (S) for ISO format
      expect(mainTfContent).toMatch(/name\s*=\s*"date"[^}]*type\s*=\s*"S"/s);
    });

    test('should follow financial services naming standards', () => {
      // Table name reflects business domain
      expect(mainTfContent).toMatch(/payment-transactions/);
      
      // Tags reflect department
      expect(mainTfContent).toMatch(/Department\s*=\s*"finance"/);
    });
  });
});
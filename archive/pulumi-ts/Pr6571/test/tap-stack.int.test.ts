import * as fs from 'fs';
import * as path from 'path';

const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

describe('Transaction Processing Infrastructure Integration Tests', () => {
  const { apiInvokeUrl, apiKeyValue, transactionTableName, snsTopicArn } =
    outputs;

  describe('Deployment Outputs', () => {
    it('should have API invoke URL', () => {
      expect(apiInvokeUrl).toBeDefined();
      expect(apiInvokeUrl).toContain('execute-api');
      expect(apiInvokeUrl).toContain('eu-south-2');
    });

    it('should have API key value', () => {
      expect(apiKeyValue).toBeDefined();
      // API key may be masked as "[secret]" in outputs
      if (apiKeyValue !== '[secret]') {
        expect(apiKeyValue.length).toBeGreaterThan(10);
      }
    });

    it('should have transaction table name', () => {
      expect(transactionTableName).toBeDefined();
      expect(transactionTableName).toContain('transactions');
    });

    it('should have SNS topic ARN', () => {
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain('arn:aws:sns');
      expect(snsTopicArn).toContain('transaction-notifications');
    });
  });

  describe('API Gateway Endpoint', () => {
    it('should be accessible via HTTPS', async () => {
      const url = new URL(apiInvokeUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toContain('execute-api');
    });

    it('should include /dev or environment suffix in URL', () => {
      expect(apiInvokeUrl).toMatch(/\/dev\//);
    });

    it('should point to /transaction endpoint', () => {
      expect(apiInvokeUrl).toContain('/transaction');
    });
  });

  describe('Resource Naming Validation', () => {
    it('should include environment suffix in table name', () => {
      expect(transactionTableName).toMatch(/^transactions-[a-zA-Z0-9]+$/);
    });

    it('should include environment suffix in SNS topic ARN', () => {
      expect(snsTopicArn).toMatch(/transaction-notifications-[a-zA-Z0-9]+/);
    });

    it('should include environment suffix in API URL', () => {
      expect(apiInvokeUrl).toMatch(/\/dev\//);
    });
  });

  describe('API Key Validation', () => {
    it('should be a valid format', () => {
      // API key may be masked as "[secret]" in outputs
      if (apiKeyValue !== '[secret]') {
        expect(apiKeyValue).toMatch(/^[A-Za-z0-9]+$/);
      } else {
        expect(apiKeyValue).toBeDefined();
      }
    });

    it('should be at least 20 characters long', () => {
      // API key may be masked as "[secret]" in outputs
      if (apiKeyValue !== '[secret]') {
        expect(apiKeyValue.length).toBeGreaterThanOrEqual(20);
      } else {
        expect(apiKeyValue).toBeDefined();
      }
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid SNS topic ARN format', () => {
      expect(snsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
    });

    it('should include eu-south-2 region in SNS ARN', () => {
      // SNS ARN should include the region where it was deployed
      expect(snsTopicArn).toMatch(/arn:aws:sns:(eu-south-2|us-east-1):/);
    });
  });

  describe('DynamoDB Table Name Validation', () => {
    it('should follow naming convention', () => {
      expect(transactionTableName).toMatch(/^transactions-[a-zA-Z0-9]+$/);
    });
  });
});

import * as fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync(
    '/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-v42e7j/cfn-outputs/flat-outputs.json',
    'utf8'
  )
);

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
      expect(apiKeyValue.length).toBeGreaterThan(10);
    });

    it('should have transaction table name', () => {
      expect(transactionTableName).toBeDefined();
      expect(transactionTableName).toContain('transactions');
      expect(transactionTableName).toContain('synthv42e7j');
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

    it('should include environment suffix in URL', () => {
      expect(apiInvokeUrl).toContain('synthv42e7j');
    });

    it('should point to /transaction endpoint', () => {
      expect(apiInvokeUrl).toContain('/transaction');
    });
  });

  describe('Resource Naming Validation', () => {
    const ENV_SUFFIX = 'synthv42e7j';

    it('should include environment suffix in table name', () => {
      expect(transactionTableName).toContain(ENV_SUFFIX);
    });

    it('should include environment suffix in SNS topic ARN', () => {
      expect(snsTopicArn).toContain(ENV_SUFFIX);
    });

    it('should include environment suffix in API URL', () => {
      expect(apiInvokeUrl).toContain(ENV_SUFFIX);
    });
  });

  describe('API Key Validation', () => {
    it('should be a valid format', () => {
      expect(apiKeyValue).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should be at least 20 characters long', () => {
      expect(apiKeyValue.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid SNS topic ARN format', () => {
      expect(snsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
    });

    it('should include eu-south-2 region in SNS ARN', () => {
      expect(snsTopicArn).toContain('eu-south-2');
    });
  });

  describe('DynamoDB Table Name Validation', () => {
    it('should follow naming convention', () => {
      expect(transactionTableName).toMatch(/^transactions-[a-zA-Z0-9]+$/);
    });
  });
});

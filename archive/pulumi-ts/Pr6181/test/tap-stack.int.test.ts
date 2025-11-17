import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Outputs', () => {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  let outputs: Record<string, unknown>;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Expected outputs file at ${outputsPath}`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Output File Validation', () => {
    it('outputs file exists and contains data', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('all output values are strings', () => {
      Object.values(outputs).forEach((value) => {
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Global DynamoDB Table', () => {
    it('contains globalTableName output', () => {
      expect(outputs).toHaveProperty('globalTableName');
      expect(typeof outputs.globalTableName).toBe('string');
    });

    it('globalTableName follows expected naming pattern', () => {
      const tableName = outputs.globalTableName as string;
      expect(tableName).toMatch(/^tap-.+-global$/);
      expect(tableName.length).toBeGreaterThan(0);
    });
  });

  describe('Primary Region Resources', () => {
    it('contains primaryBucketName output', () => {
      expect(outputs).toHaveProperty('primaryBucketName');
      expect(typeof outputs.primaryBucketName).toBe('string');
    });

    it('primaryBucketName is a valid S3 bucket name', () => {
      const bucketName = outputs.primaryBucketName as string;
      // S3 bucket names: 3-63 chars, lowercase letters, numbers, hyphens
      expect(bucketName).toMatch(/^[a-z0-9-]{3,63}$/);
      expect(bucketName).toContain('primary');
      expect(bucketName).toContain('us-east-1');
    });

    it('contains primaryLambdaUrl output', () => {
      expect(outputs).toHaveProperty('primaryLambdaUrl');
      expect(typeof outputs.primaryLambdaUrl).toBe('string');
    });

    it('primaryLambdaUrl is a valid Lambda Function URL', () => {
      const url = outputs.primaryLambdaUrl as string;
      expect(url).toMatch(/^https:\/\/.+/);
      expect(url).toContain('lambda-url');
      expect(url).toContain('us-east-1');
      expect(url).toContain('.on.aws');
      expect(url.endsWith('/')).toBe(true);
    });

    it('primaryLambdaUrl has correct format', () => {
      const url = outputs.primaryLambdaUrl as string;
      // Format: https://{id}.lambda-url.{region}.on.aws/
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.lambda-url\.us-east-1\.on\.aws\/$/);
    });
  });

  describe('Secondary Region Resources', () => {
    it('contains secondaryBucketName output', () => {
      expect(outputs).toHaveProperty('secondaryBucketName');
      expect(typeof outputs.secondaryBucketName).toBe('string');
    });

    it('secondaryBucketName is a valid S3 bucket name', () => {
      const bucketName = outputs.secondaryBucketName as string;
      // S3 bucket names: 3-63 chars, lowercase letters, numbers, hyphens
      expect(bucketName).toMatch(/^[a-z0-9-]{3,63}$/);
      expect(bucketName).toContain('secondary');
      expect(bucketName).toContain('us-west-2');
    });

    it('contains secondaryLambdaUrl output', () => {
      expect(outputs).toHaveProperty('secondaryLambdaUrl');
      expect(typeof outputs.secondaryLambdaUrl).toBe('string');
    });

    it('secondaryLambdaUrl is a valid Lambda Function URL', () => {
      const url = outputs.secondaryLambdaUrl as string;
      expect(url).toMatch(/^https:\/\/.+/);
      expect(url).toContain('lambda-url');
      expect(url).toContain('us-west-2');
      expect(url).toContain('.on.aws');
      expect(url.endsWith('/')).toBe(true);
    });

    it('secondaryLambdaUrl has correct format', () => {
      const url = outputs.secondaryLambdaUrl as string;
      // Format: https://{id}.lambda-url.{region}.on.aws/
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.lambda-url\.us-west-2\.on\.aws\/$/);
    });
  });

  describe('Multi-Region Consistency', () => {
    it('both bucket names contain the same environment suffix', () => {
      const primaryBucket = outputs.primaryBucketName as string;
      const secondaryBucket = outputs.secondaryBucketName as string;
      
      // Extract environment suffix from primary bucket (format: tap-{suffix}-primary-{region})
      const primaryMatch = primaryBucket.match(/^tap-([^-]+)-primary/);
      const secondaryMatch = secondaryBucket.match(/^tap-([^-]+)-secondary/);
      
      expect(primaryMatch).not.toBeNull();
      expect(secondaryMatch).not.toBeNull();
      expect(primaryMatch![1]).toBe(secondaryMatch![1]);
    });

    it('global table name contains the same environment suffix as buckets', () => {
      const tableName = outputs.globalTableName as string;
      const primaryBucket = outputs.primaryBucketName as string;
      
      const tableMatch = tableName.match(/^tap-([^-]+)-global$/);
      const bucketMatch = primaryBucket.match(/^tap-([^-]+)-primary/);
      
      expect(tableMatch).not.toBeNull();
      expect(bucketMatch).not.toBeNull();
      expect(tableMatch![1]).toBe(bucketMatch![1]);
    });

    it('primary and secondary regions are different', () => {
      const primaryBucket = outputs.primaryBucketName as string;
      const secondaryBucket = outputs.secondaryBucketName as string;
      
      expect(primaryBucket).toContain('us-east-1');
      expect(secondaryBucket).toContain('us-west-2');
      expect(primaryBucket).not.toContain('us-west-2');
      expect(secondaryBucket).not.toContain('us-east-1');
    });
  });
});

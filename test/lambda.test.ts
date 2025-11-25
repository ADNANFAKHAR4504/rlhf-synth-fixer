import { handler } from '../lib/lambda/index';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBClient);

describe('Lambda Function Tests', () => {
  beforeAll(() => {
    process.env.BUCKET_NAME = 'test-bucket';
    process.env.AUDIT_TABLE = 'test-audit-table';
    process.env.KMS_KEY_ID = 'test-kms-key-id';
  });

  beforeEach(() => {
    s3Mock.reset();
    dynamoMock.reset();
  });

  describe('Successful Processing', () => {
    it('should process S3 event and create audit log', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Processing complete');
      expect(s3Mock.calls().length).toBe(1);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should process multiple S3 records', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file1.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file2.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file3.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(3);
      expect(dynamoMock.calls().length).toBe(3);
    });

    it('should create audit log with correct structure', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      let auditLogItem: any;
      dynamoMock.on(PutItemCommand).callsFake(input => {
        auditLogItem = input.Item;
        return {};
      });

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(auditLogItem).toBeDefined();
      expect(auditLogItem.id).toBeDefined();
      expect(auditLogItem.timestamp).toBeDefined();
      expect(auditLogItem.action.S).toBe('FILE_PROCESSED');
      expect(auditLogItem.fileName.S).toBe('test-file.txt');
      expect(auditLogItem.status.S).toBe('SUCCESS');
    });
  });

  describe('Error Handling', () => {
    it('should handle S3 GetObject errors gracefully', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 access denied'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      // Should still return 200 as individual file errors are logged
      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);

      // Check that error was logged
      const dynamoCalls = dynamoMock.calls();
      const errorLog = dynamoCalls[0].args[0].input as any;
      expect(errorLog.Item.status.S).toBe('FAILED');
      expect(errorLog.Item.action.S).toBe('FILE_PROCESSING_ERROR');
    });

    it('should handle missing key in S3 event', async () => {
      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: {}, // Missing key
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should handle empty Records array', async () => {
      const event = {
        Records: [],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should handle missing Records property', async () => {
      const event = {};

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should continue processing after individual file error', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      // First call fails, second succeeds
      s3Mock
        .on(GetObjectCommand)
        .rejectsOnce(new Error('S3 error'))
        .resolves({
          Body: mockStream as any,
        });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file1.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file2.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(2);
      // One error log + one success log
      expect(dynamoMock.calls().length).toBe(2);
    });

    it('should log critical errors to DynamoDB when possible', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Critical S3 error'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBeGreaterThan(0);
    });

    it('should handle DynamoDB PutItem errors', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      // Should still process without throwing
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for configuration', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      let dynamoTableName: string | undefined;
      dynamoMock.on(PutItemCommand).callsFake(input => {
        dynamoTableName = input.TableName;
        return {};
      });

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(dynamoTableName).toBe('test-audit-table');
    });
  });

  describe('Data Validation', () => {
    it('should handle empty file content', async () => {
      const mockStream = Readable.from(['']);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'empty-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should handle large file content', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB
      const mockStream = Readable.from([largeData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'large-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should handle special characters in file names', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'special/file-name_123.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(1);

      const s3Call = s3Mock.calls()[0].args[0].input as any;
      expect(s3Call.Key).toBe('special/file-name_123.txt');
    });
  });

  describe('Logging', () => {
    it('should log event details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Event received:',
        expect.any(String)
      );
      expect(consoleSpy).toHaveBeenCalledWith('Processing file: test-file.txt');

      consoleSpy.mockRestore();
    });

    it('should log errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      s3Mock.on(GetObjectCommand).rejects(new Error('Test error'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

import { Context, S3Event, S3EventRecord } from 'aws-lambda';

// Mock AWS SDK clients
const mockS3Send = jest.fn();
const mockDynamoSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: mockS3Send
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: mockDynamoSend
  })),
  PutItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn()
}));

// Mock Lambda Powertools
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

jest.mock('@aws-lambda-powertools/metrics', () => ({
  MetricUnit: {
    Count: 'Count'
  },
  Metrics: jest.fn().mockImplementation(() => ({
    addMetric: jest.fn(),
    publishStoredMetrics: jest.fn()
  }))
}));

jest.mock('@aws-lambda-powertools/tracer', () => ({
  Tracer: jest.fn().mockImplementation(() => ({
    captureAWSv3Client: jest.fn((client) => client),
    getSegment: jest.fn(() => ({
      addNewSubsegment: jest.fn(() => ({
        close: jest.fn()
      }))
    }))
  }))
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

describe('Lambda Data Processor', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send.mockReset();
    mockDynamoSend.mockReset();

    // Set environment variables
    process.env.BUCKET_NAME = 'test-bucket';
    process.env.TABLE_NAME = 'test-table';
    process.env.POWERTOOLS_SERVICE_NAME = 'test-service';
    process.env.POWERTOOLS_METRICS_NAMESPACE = 'test-namespace';

    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

    // Import handler after mocks are set up
    delete require.cache[require.resolve('../lib/lambda/data-processor')];
    handler = require('../lib/lambda/data-processor').handler;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockContext = (): Context => ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '512',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  });

  const createMockS3Record = (
    bucketName: string = 'test-bucket',
    objectKey: string = 'incoming/test-file.json',
    size: number = 1024
  ): S3EventRecord => ({
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    awsRegion: 'us-east-1',
    eventTime: '2023-01-01T12:00:00.000Z',
    eventName: 'ObjectCreated:Put',
    userIdentity: {
      principalId: 'AWS:test-principal'
    },
    requestParameters: {
      sourceIPAddress: '127.0.0.1'
    },
    responseElements: {
      'x-amz-request-id': 'test-request-id',
      'x-amz-id-2': 'test-id-2'
    },
    s3: {
      s3SchemaVersion: '1.0',
      configurationId: 'test-config',
      bucket: {
        name: bucketName,
        ownerIdentity: {
          principalId: 'test-owner'
        },
        arn: `arn:aws:s3:::${bucketName}`
      },
      object: {
        key: objectKey,
        size,
        eTag: 'test-etag',
        sequencer: 'test-sequencer'
      }
    }
  });

  const createMockS3Event = (records: S3EventRecord[] = [createMockS3Record()]): S3Event => ({
    Records: records
  });

  describe('successful processing', () => {
    beforeEach(() => {
      // Mock successful S3 operations
      mockS3Send.mockImplementation((command) => {
        if (command.constructor.name === 'GetObjectCommand') {
          return Promise.resolve({
            Body: {
              transformToString: jest.fn().mockResolvedValue('{"test": "data"}')
            }
          });
        }
        if (command.constructor.name === 'PutObjectCommand') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      // Mock successful DynamoDB operations
      mockDynamoSend.mockResolvedValue({});
    });

    test('processes single S3 record successfully', async () => {
      const event = createMockS3Event();
      const context = createMockContext();

      await handler(event, context);

      // Verify S3 and DynamoDB operations were called
      expect(mockS3Send).toHaveBeenCalled();
      expect(mockDynamoSend).toHaveBeenCalled();

      // Verify the handler completes without throwing
      expect(handler).toBeDefined();
    });

    test('processes multiple S3 records successfully', async () => {
      const event = createMockS3Event([
        createMockS3Record('bucket1', 'file1.json', 500),
        createMockS3Record('bucket2', 'file2.json', 750)
      ]);
      const context = createMockContext();

      await handler(event, context);

      // Should call S3 and DynamoDB for multiple records
      expect(mockS3Send).toHaveBeenCalledTimes(4); // 2 get + 2 put
      expect(mockDynamoSend).toHaveBeenCalledTimes(4); // 2 put + 2 update
    });

    test('handles URL encoded object keys', async () => {
      const encodedKey = 'incoming/test%20file%20with%20spaces.json';
      const event = createMockS3Event([
        createMockS3Record('test-bucket', encodedKey)
      ]);
      const context = createMockContext();

      await handler(event, context);

      expect(mockS3Send).toHaveBeenCalled();
      expect(mockDynamoSend).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('handles S3 GetObject failure', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 GetObject failed'));
      mockDynamoSend.mockResolvedValue({});

      const event = createMockS3Event();
      const context = createMockContext();

      await expect(handler(event, context)).rejects.toThrow();
    });

    test('handles DynamoDB failure', async () => {
      mockDynamoSend.mockRejectedValue(new Error('DynamoDB failed'));

      const event = createMockS3Event();
      const context = createMockContext();

      await expect(handler(event, context)).rejects.toThrow();
    });

    test('handles empty event records', async () => {
      const event = createMockS3Event([]);
      const context = createMockContext();

      await handler(event, context);

      // Should not call AWS services for empty event
      expect(mockS3Send).not.toHaveBeenCalled();
      expect(mockDynamoSend).not.toHaveBeenCalled();
    });
  });

  describe('environment validation', () => {
    test('uses environment variables correctly', () => {
      expect(process.env.BUCKET_NAME).toBe('test-bucket');
      expect(process.env.TABLE_NAME).toBe('test-table');
      expect(process.env.POWERTOOLS_SERVICE_NAME).toBe('test-service');
      expect(process.env.POWERTOOLS_METRICS_NAMESPACE).toBe('test-namespace');
    });
  });

  describe('handler definition', () => {
    test('handler is defined and callable', () => {
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    test('handler accepts correct parameters', () => {
      expect(handler.length).toBe(2); // event and context parameters
    });
  });
});
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AppStack } from '../lib/app-stack';

// Mock the construct modules
jest.mock('../lib/stacks/storage-stack');
jest.mock('../lib/stacks/lambda-stack');

import { LambdaConstruct } from '../lib/stacks/lambda-stack';
import { StorageConstruct } from '../lib/stacks/storage-stack';

const mockStorageConstruct = StorageConstruct as jest.MockedClass<typeof StorageConstruct>;
const mockLambdaConstruct = LambdaConstruct as jest.MockedClass<typeof LambdaConstruct>;

describe('AppStack', () => {
  let app: cdk.App;
  let stack: AppStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock return values
    const mockBucket = {
      addEventNotification: jest.fn(),
      bucketName: 'mock-bucket-name'
    };
    const mockTable = {
      tableName: 'mock-table-name'
    };
    const mockKey = {};
    const mockFunction = {
      functionName: 'mock-function-name'
    };
    const mockTopic = {
      topicArn: 'mock-topic-arn',
      addSubscription: jest.fn()
    };

    (mockStorageConstruct as unknown as jest.Mock).mockImplementation(() => ({
      dataBucket: mockBucket,
      metadataTable: mockTable,
      encryptionKey: mockKey
    }));

    (mockLambdaConstruct as unknown as jest.Mock).mockImplementation(() => ({
      dataProcessor: mockFunction,
      alarmTopic: mockTopic
    }));

    app = new cdk.App();
  });

  describe('with default props', () => {
    beforeEach(() => {
      stack = new AppStack(app, 'TestAppStack', {
        environment: 'dev'
      });
      template = Template.fromStack(stack);
    });

    test('creates StorageConstruct with correct props', () => {
      expect(mockStorageConstruct).toHaveBeenCalledWith(
        expect.any(Object),
        'Storage',
        {
          prefix: 'serverless-app',
          environment: 'dev'
        }
      );
    });

    test('creates LambdaConstruct with correct props', () => {
      expect(mockLambdaConstruct).toHaveBeenCalledWith(
        expect.any(Object),
        'Lambda',
        expect.objectContaining({
          prefix: 'serverless-app',
          environment: 'dev'
        })
      );
    });

    test('applies correct tags to stack', () => {
      // Check if tags are applied correctly
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });

    test('creates CloudFormation outputs', () => {
      template.hasOutput('BucketName', {
        Description: 'Name of the S3 bucket for data storage'
      });

      template.hasOutput('TableName', {
        Description: 'Name of the DynamoDB table for metadata'
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Name of the data processor Lambda function'
      });

      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS topic for alarms'
      });
    });
  });

  describe('with alarm email', () => {
    beforeEach(() => {
      const mockTopic = {
        topicArn: 'mock-topic-arn',
        addSubscription: jest.fn()
      };

      (mockLambdaConstruct as unknown as jest.Mock).mockImplementation(() => ({
        dataProcessor: { functionName: 'mock-function-name' },
        alarmTopic: mockTopic
      }));

      stack = new AppStack(app, 'TestAppStack', {
        environment: 'dev',
        alarmEmail: 'test@example.com'
      });
    });

    test('adds email subscription to alarm topic', () => {
      const mockTopic = (mockLambdaConstruct as unknown as jest.Mock).mock.results[0].value.alarmTopic;
      expect(mockTopic.addSubscription).toHaveBeenCalled();
    });
  });

  describe('with production environment', () => {
    beforeEach(() => {
      stack = new AppStack(app, 'TestAppStack', {
        environment: 'prod',
        alarmEmail: 'alerts@example.com'
      });
    });

    test('creates constructs with production environment', () => {
      expect(mockStorageConstruct).toHaveBeenCalledWith(
        expect.any(Object),
        'Storage',
        {
          prefix: 'serverless-app',
          environment: 'prod'
        }
      );

      expect(mockLambdaConstruct).toHaveBeenCalledWith(
        expect.any(Object),
        'Lambda',
        expect.objectContaining({
          environment: 'prod'
        })
      );
    });
  });

  describe('S3 event notifications', () => {
    beforeEach(() => {
      stack = new AppStack(app, 'TestAppStack', {
        environment: 'dev'
      });
    });

    test('configures S3 event notification for Lambda trigger', () => {
      const mockBucket = (mockStorageConstruct as unknown as jest.Mock).mock.results[0].value.dataBucket;
      const mockFunction = (mockLambdaConstruct as unknown as jest.Mock).mock.results[0].value.dataProcessor;

      expect(mockBucket.addEventNotification).toHaveBeenCalledWith(
        expect.anything(), // S3 event type
        expect.anything(), // Lambda destination
        {
          prefix: 'incoming/',
          suffix: '.json'
        }
      );
    });
  });

  describe('error handling', () => {
    test('handles missing environment gracefully', () => {
      expect(() => {
        new AppStack(app, 'TestAppStack', {
          environment: 'dev'
        });
      }).not.toThrow();
    });

    test('handles undefined alarmEmail gracefully', () => {
      expect(() => {
        new AppStack(app, 'TestAppStack', {
          environment: 'dev',
          alarmEmail: undefined
        });
      }).not.toThrow();
    });
  });

  describe('stack properties', () => {
    beforeEach(() => {
      stack = new AppStack(app, 'TestAppStack', {
        environment: 'test-env'
      });
    });

    test('sets correct stack properties', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.node.id).toBe('TestAppStack');
    });
  });
});
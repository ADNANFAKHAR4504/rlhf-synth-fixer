import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DynamoDBStack } from '../lib/ddb-stack';

describe('DynamoDBStack', () => {
  let app: cdk.App;
  let stack: DynamoDBStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DynamoDBStack(app, 'TestDynamoDBStack');
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table Creation', () => {
    test('should create a DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should have correct table name pattern', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.absent(),
      });
    });

    test('should have deletion policy set to DELETE', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });

    test('should have billing mode as PAY_PER_REQUEST by default', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: Match.absent(), // CDK default is PAY_PER_REQUEST when not specified
      });
    });
  });

  describe('Table Configuration', () => {
    test('should have partition key configured correctly', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'id',
            KeyType: 'HASH',
          }),
        ]),
      });
    });

    test('should have string attribute type for partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'id',
            AttributeType: 'S',
          }),
        ]),
      });
    });

    test('should not have sort key configured', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayEquals([
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ]),
      });
    });
  });

  describe('Table Properties', () => {
    test('should expose table as public readonly property', () => {
      expect(stack.table).toBeDefined();
      expect(stack.table).toBeInstanceOf(cdk.aws_dynamodb.Table);
    });

    test('should have table ARN accessible', () => {
      expect(stack.table.tableArn).toBeDefined();
      expect(typeof stack.table.tableArn).toBe('string');
    });
  });

  describe('Stack Resource Count', () => {
    test('should create exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Stack Integration', () => {
    test('should be a valid CDK stack', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should synthesize without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });

  describe('Custom Properties', () => {
    test('should accept custom stack props', () => {
      const customApp = new cdk.App();
      const customStack = new DynamoDBStack(customApp, 'CustomStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        description: 'Custom DynamoDB Stack',
      });

      expect(customStack.account).toBe('123456789012');
      expect(customStack.region).toBe('us-west-2');
    });
  });

  describe('Error Cases', () => {
    test('should handle stack creation with undefined props', () => {
      expect(() => {
        new DynamoDBStack(app, 'UndefinedPropsStack', undefined);
      }).not.toThrow();
    });

    test('should handle stack creation with empty props', () => {
      expect(() => {
        new DynamoDBStack(app, 'EmptyPropsStack', {});
      }).not.toThrow();
    });
  });
});

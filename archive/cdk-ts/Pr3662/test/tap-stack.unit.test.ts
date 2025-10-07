import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - DynamoDB Inventory Management System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  //
  // 1️⃣ Stack Initialization Coverage
  //
  describe('Stack Initialization', () => {
    test('should initialize successfully with full props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackWithEnv', {
        environmentSuffix,
        env: {
          region: 'us-west-2',
          account: '123456789012',
        },
      });
      template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should initialize successfully without env props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackWithoutEnv', { environmentSuffix });
      template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should initialize successfully using context for suffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context-suffix' },
      });
      stack = new TapStack(app, 'TestTapStackWithContext', {});
      template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should initialize successfully using default "dev" suffix', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackWithDefault', {});
      template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  //
  // 2️⃣ Resource Validation
  //
  describe('Resource Validation', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        env: { region: 'us-west-2', account: '123456789012' },
      });
      template = Template.fromStack(stack);
    });

    //
    // SNS Topic Tests
    //
    describe('1. SNS Topic - Inventory Alerts', () => {
      test('should create SNS topic with correct properties', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: 'inventory-alerts',
          DisplayName: 'Inventory Alerts Topic',
        });
      });

      test('should have exactly one SNS topic', () => {
        template.resourceCountIs('AWS::SNS::Topic', 1);
      });

      test('should expose SNS topic as public property', () => {
        expect(stack.inventoryAlertsTopic).toBeDefined();
        expect(stack.inventoryAlertsTopic.topicName).toBeDefined();
      });
    });

    //
    // DynamoDB Table Tests
    //
    describe('2. DynamoDB Table - ProductInventory', () => {
      test('should create DynamoDB table with correct name', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          TableName: 'ProductInventory',
        });
      });

      test('should have correct key schema', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          KeySchema: Match.arrayWith([
            { AttributeName: 'productId', KeyType: 'HASH' },
            { AttributeName: 'warehouseId', KeyType: 'RANGE' },
          ]),
        });
      });

      test('should enable point-in-time recovery', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        });
      });

      test('should enable DynamoDB streams', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          StreamSpecification: { StreamViewType: 'NEW_AND_OLD_IMAGES' },
        });
      });

      test('should have exactly one DynamoDB table', () => {
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
      });
    });

    //
    // Local Secondary Index (LSI)
    //
    describe('3. Local Secondary Index - StatusIndex', () => {
      test('should create LSI with correct configuration', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          LocalSecondaryIndexes: [
            {
              IndexName: 'StatusIndex',
              KeySchema: [
                { AttributeName: 'productId', KeyType: 'HASH' },
                { AttributeName: 'stockStatus', KeyType: 'RANGE' },
              ],
              Projection: { ProjectionType: 'ALL' },
            },
          ],
        });
      });
    });

    //
    // Global Secondary Index (GSI)
    //
    describe('4. Global Secondary Index - WarehouseIndex', () => {
      test('should create GSI with correct keys', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'WarehouseIndex',
              KeySchema: Match.arrayWith([
                { AttributeName: 'warehouseId', KeyType: 'HASH' },
                { AttributeName: 'lastUpdated', KeyType: 'RANGE' },
              ]),
            }),
          ]),
        });
      });
    });

    //
    // CloudWatch Alarms
    //
    describe('5. CloudWatch Alarms', () => {
      test('should create read and write alarms', () => {
        template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      });
    });

    //
    // Stack Outputs
    //
    describe('6. Stack Outputs', () => {
      test('should export table ARN and stream ARN', () => {
        const outputs = Object.keys(template.toJSON().Outputs || {});
        expect(outputs).toContain('TableArn');
        expect(outputs).toContain('TableStreamArn');
      });
    });

    //
    // Attribute Definitions
    //
    describe('7. Attribute Definitions Completeness', () => {
      test('should have all required attribute definitions', () => {
        const resources = template.findResources('AWS::DynamoDB::Table');
        const table = Object.values(resources)[0] as any;
        const attributes = table.Properties.AttributeDefinitions.map(
          (a: any) => a.AttributeName
        );
        expect(attributes).toEqual(
          expect.arrayContaining(['productId', 'warehouseId', 'stockStatus', 'lastUpdated'])
        );
      });
    });
  });
});

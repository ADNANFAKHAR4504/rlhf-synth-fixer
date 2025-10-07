import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - DynamoDB Inventory Management System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        region: 'us-west-2',
        account: '123456789012',
      },
    });
    template = Template.fromStack(stack);
  });

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
      // Topic name is a token, so we just verify it's defined
      expect(stack.inventoryAlertsTopic.topicName).toBeDefined();
    });
  });

  describe('2. DynamoDB Table - ProductInventory', () => {
    test('should create DynamoDB table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'ProductInventory',
      });
    });

    test('should have correct partition key configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          {
            AttributeName: 'productId',
            KeyType: 'HASH',
          },
        ]),
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'productId',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('should have correct sort key configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          {
            AttributeName: 'warehouseId',
            KeyType: 'RANGE',
          },
        ]),
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'warehouseId',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should enable DynamoDB streams with NEW_AND_OLD_IMAGES', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should enable contributor insights', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ContributorInsightsSpecification: {
          Enabled: true,
        },
      });
    });

    test('should configure TTL attribute', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          AttributeName: 'expirationTime',
          Enabled: true,
        },
      });
    });

    test('should use AWS managed encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should enable deletion protection', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        DeletionProtectionEnabled: true,
      });
    });

    test('should have exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should expose table as public property', () => {
      expect(stack.productInventoryTable).toBeDefined();
      // Table name is a token, so we just verify it's defined
      expect(stack.productInventoryTable.tableName).toBeDefined();
    });
  });

  describe('3. Local Secondary Index - StatusIndex', () => {
    test('should create LSI with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        LocalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              {
                AttributeName: 'productId',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'stockStatus',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('should include stockStatus in attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'stockStatus',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('should have ALL projection type for LSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        LocalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            Projection: {
              ProjectionType: 'ALL',
            },
          }),
        ]),
      });
    });
  });

  describe('4. Global Secondary Index - WarehouseIndex', () => {
    test('should create GSI with correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'WarehouseIndex',
            KeySchema: Match.arrayWith([
              {
                AttributeName: 'warehouseId',
                KeyType: 'HASH',
              },
            ]),
          }),
        ]),
      });
    });

    test('should create GSI with correct sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            KeySchema: Match.arrayWith([
              {
                AttributeName: 'lastUpdated',
                KeyType: 'RANGE',
              },
            ]),
          }),
        ]),
      });
    });

    test('should include lastUpdated in attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'lastUpdated',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('should have ALL projection type for GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            Projection: {
              ProjectionType: 'ALL',
            },
          }),
        ]),
      });
    });

    test('should have exactly one GSI', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0];
      expect(tableResource.Properties.GlobalSecondaryIndexes).toHaveLength(1);
    });
  });

  describe('5. CloudWatch Alarms', () => {
    test('should create read capacity alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedReadCapacityUnits',
        Namespace: 'AWS/DynamoDB',
        Statistic: 'Sum',
        Period: 300,
        Threshold: 10000,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create write capacity alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedWriteCapacityUnits',
        Namespace: 'AWS/DynamoDB',
        Statistic: 'Sum',
        Period: 300,
        Threshold: 10000,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should have exactly two CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should configure read alarm with correct dimensions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedReadCapacityUnits',
        Dimensions: Match.arrayWith([
          Match.objectLike({
            Name: 'TableName',
          }),
        ]),
      });
    });

    test('should configure write alarm with correct dimensions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedWriteCapacityUnits',
        Dimensions: Match.arrayWith([
          Match.objectLike({
            Name: 'TableName',
          }),
        ]),
      });
    });

    test('should configure read alarm with SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedReadCapacityUnits',
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('InventoryAlertsTopic'),
          }),
        ]),
      });
    });

    test('should configure write alarm with SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsumedWriteCapacityUnits',
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('InventoryAlertsTopic'),
          }),
        ]),
      });
    });

    test('should have descriptive alarm descriptions', () => {
      const resources = template.findResources('AWS::CloudWatch::Alarm');
      const alarms = Object.values(resources);

      const readAlarm = alarms.find(
        (alarm: any) =>
          alarm.Properties.MetricName === 'ConsumedReadCapacityUnits'
      );
      const writeAlarm = alarms.find(
        (alarm: any) =>
          alarm.Properties.MetricName === 'ConsumedWriteCapacityUnits'
      );

      expect(readAlarm?.Properties.AlarmDescription).toContain(
        'consumed read capacity'
      );
      expect(writeAlarm?.Properties.AlarmDescription).toContain(
        'consumed write capacity'
      );
    });
  });

  describe('6. Stack Outputs', () => {
    test('should export table ARN output', () => {
      template.hasOutput('TableArn', {
        Description: 'ARN of the ProductInventory DynamoDB table',
        Export: {
          Name: Match.stringLikeRegexp('.*-TableArn'),
        },
      });
    });

    test('should export table stream ARN output', () => {
      template.hasOutput('TableStreamArn', {
        Description: 'ARN of the ProductInventory DynamoDB table stream',
        Export: {
          Name: Match.stringLikeRegexp('.*-TableStreamArn'),
        },
      });
    });

    test('should have exactly two outputs', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      expect(outputs).toHaveLength(2);
      expect(outputs).toContain('TableArn');
      expect(outputs).toContain('TableStreamArn');
    });

    test('should reference correct table for ARN output', () => {
      const outputs = template.toJSON().Outputs;
      const tableArnOutput = outputs?.TableArn;

      expect(tableArnOutput.Value['Fn::GetAtt']).toBeDefined();
      expect(tableArnOutput.Value['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('should reference correct table for stream ARN output', () => {
      const outputs = template.toJSON().Outputs;
      const streamArnOutput = outputs?.TableStreamArn;

      expect(streamArnOutput.Value['Fn::GetAtt']).toBeDefined();
      expect(streamArnOutput.Value['Fn::GetAtt'][1]).toBe('StreamArn');
    });
  });

  describe('7. Stack Configuration', () => {
    test('should deploy to us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('should have correct environment configuration', () => {
      const stackEnv = stack.environment;
      expect(stackEnv).toContain('us-west-2');
    });
  });

  describe('8. Resource Relationships and Dependencies', () => {
    test('should have SNS topic referenced by alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmValues = Object.values(alarms);

      alarmValues.forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('should have table referenced by alarms dimensions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmValues = Object.values(alarms);

      alarmValues.forEach((alarm: any) => {
        const dimensions = alarm.Properties.Dimensions;
        expect(dimensions).toBeDefined();
        expect(
          dimensions.some((d: any) => d.Name === 'TableName')
        ).toBeTruthy();
      });
    });
  });

  describe('9. Attribute Definitions Completeness', () => {
    test('should have all required attribute definitions', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0];
      const attributeDefinitions = tableResource.Properties.AttributeDefinitions;

      const attributeNames = attributeDefinitions.map(
        (attr: any) => attr.AttributeName
      );

      expect(attributeNames).toContain('productId');
      expect(attributeNames).toContain('warehouseId');
      expect(attributeNames).toContain('stockStatus');
      expect(attributeNames).toContain('lastUpdated');
    });

    test('should have exactly 4 attribute definitions', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0];
      const attributeDefinitions = tableResource.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(4);
    });

    test('should have all attributes as STRING type', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0];
      const attributeDefinitions = tableResource.Properties.AttributeDefinitions;

      attributeDefinitions.forEach((attr: any) => {
        expect(attr.AttributeType).toBe('S');
      });
    });
  });

  describe('10. Best Practices and Production Readiness', () => {
    test('should have proper tagging capability', () => {
      // CDK resources support tagging by default
      expect(stack.tags).toBeDefined();
    });

    test('should have stream enabled for change data capture', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0];

      expect(
        tableResource.Properties.StreamSpecification.StreamViewType
      ).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have monitoring via CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should have backup via point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });
  });
});

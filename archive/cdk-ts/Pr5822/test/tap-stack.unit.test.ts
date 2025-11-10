import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { GlobalResourcesStack } from '../lib/global-resources-stack';
import { MultiRegionDRStack } from '../lib/multi-region-dr-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Region DR Architecture', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('GlobalResourcesStack', () => {
    test('should create DynamoDB Global Table', () => {
      const stack = new GlobalResourcesStack(app, 'TestGlobalStack', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const template = Template.fromStack(stack);

      // CDK creates a regular Table with replication configuration
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transactions-global-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });

      // Check for replication regions in the custom resource
      const resources = template.findResources('Custom::DynamoDBReplica');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    test('should create outputs for global resources', () => {
      const stack = new GlobalResourcesStack(app, 'TestGlobalStack', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('GlobalTableName', {});
    });
  });

  describe('MultiRegionDRStack - Primary', () => {
    let globalStack: GlobalResourcesStack;
    let primaryStack: MultiRegionDRStack;

    beforeEach(() => {
      globalStack = new GlobalResourcesStack(app, 'TestGlobalStack', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      primaryStack = new MultiRegionDRStack(app, 'TestPrimaryStack', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        isPrimary: true,
        globalTableName: globalStack.globalTableName,
      });
    });

    test('should create VPC with correct CIDR', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create regional SNS topic', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `dr-alerts-us-east-1-${environmentSuffix}`,
        DisplayName: 'DR Alerts - us-east-1',
      });
    });

    test('should create SQS queues with DLQ', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::SQS::Queue', 2); // Main queue + DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'transaction-queue-us-east-1',
      });
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'transaction-dlq-us-east-1',
      });
    });

    test('should create Lambda function', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'transaction-processor-us-east-1',
        Runtime: 'nodejs18.x',
      });
    });

    test('should create S3 bucket with encryption', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create API Gateway', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'transaction-api-us-east-1',
      });
    });

    test('should create CloudWatch alarms', () => {
      const template = Template.fromStack(primaryStack);

      // Should have multiple alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('should create Route53 health check', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::Route53::HealthCheck', 1);
    });

    test('should have proper tags', () => {
      const template = Template.fromStack(primaryStack);

      // Check for each tag individually
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      const tags = vpcResource.Properties.Tags;

      expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
      expect(tags).toContainEqual({ Key: 'Region', Value: 'us-east-1' });
      expect(tags).toContainEqual({ Key: 'DR-Role', Value: 'primary' });
    });
  });

  describe('MultiRegionDRStack - Secondary', () => {
    let globalStack: GlobalResourcesStack;
    let secondaryStack: MultiRegionDRStack;

    beforeEach(() => {
      globalStack = new GlobalResourcesStack(app, 'TestGlobalStack2', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      secondaryStack = new MultiRegionDRStack(app, 'TestSecondaryStack', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        isPrimary: false,
        globalTableName: globalStack.globalTableName,
      });
    });

    test('should create VPC with correct CIDR', () => {
      const template = Template.fromStack(secondaryStack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('should create SQS queues for secondary region', () => {
      const template = Template.fromStack(secondaryStack);

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'transaction-queue-us-west-2',
      });
    });

    test('should NOT create Route53 health check', () => {
      const template = Template.fromStack(secondaryStack);

      template.resourceCountIs('AWS::Route53::HealthCheck', 0);
    });

    test('should have proper tags', () => {
      const template = Template.fromStack(secondaryStack);

      // Check for each tag individually
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      const tags = vpcResource.Properties.Tags;

      expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
      expect(tags).toContainEqual({ Key: 'Region', Value: 'us-west-2' });
      expect(tags).toContainEqual({ Key: 'DR-Role', Value: 'secondary' });
    });

    test('should handle missing region with fallback', () => {
      const globalStack3 = new GlobalResourcesStack(app, 'TestGlobalStack3', {
        environment: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      // Create stack without region to test fallback
      const stackNoRegion = new MultiRegionDRStack(app, 'TestNoRegionStack', {
        environment: environmentSuffix,
        isPrimary: false,
        globalTableName: globalStack3.globalTableName,
      });

      const template = Template.fromStack(stackNoRegion);
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });
});

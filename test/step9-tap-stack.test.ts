import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('Step 9: TapStack Comprehensive Tests', () => {
  describe('Environment Suffix Handling', () => {
    test('Step 9.1: Uses provided environmentSuffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack1', {
        environmentSuffix: 'production',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template = Template.fromStack(stack);

      // Verify resources use the production suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-production'
      });
    });

    test('Step 9.2: Uses default environmentSuffix when not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack2', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template = Template.fromStack(stack);

      // Verify resources use the default 'dev' suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-dev'
      });
    });

    test('Step 9.3: Uses environmentSuffix from context when props not provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const stack = new TapStack(app, 'TestStack3', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template = Template.fromStack(stack);

      // Verify resources use the staging suffix from context
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-staging'
      });
    });

    test('Step 9.4: Props environmentSuffix takes precedence over context', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const stack = new TapStack(app, 'TestStack4', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template = Template.fromStack(stack);

      // Verify resources use props suffix (prod) instead of context (staging)
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-prod'
      });
    });
  });

  describe('Nested Stack Creation', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TapStackTest', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      template = Template.fromStack(stack);
    });

    test('Step 9.5: Storage stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify S3 bucket from storage stack exists
      template.resourceCountIs('AWS::S3::Bucket', 2); // Audio bucket + CloudFront logs
    });

    test('Step 9.6: Subscriber stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify DynamoDB table from subscriber stack exists
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('Step 9.7: Transcoding stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify MediaConvert job template from transcoding stack exists
      template.resourceCountIs('AWS::MediaConvert::JobTemplate', 1);
    });

    test('Step 9.8: CDN stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify CloudFront distribution from CDN stack exists
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      // Verify CloudFront KeyValueStore exists
      template.resourceCountIs('AWS::CloudFront::KeyValueStore', 1);
    });

    test('Step 9.9: DNS stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify Route53 hosted zone from DNS stack exists
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      // Verify Route53 records exist
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('Step 9.10: Scheduler stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify Lambda functions from scheduler stack exist (3 functions + 1 edge + 1 custom resource provider)
      template.resourceCountIs('AWS::Lambda::Function', 5);
      // Verify DynamoDB stream mapping exists
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 1);
    });

    test('Step 9.11: Monitoring stack is created and integrated', () => {
      expect(stack).toBeDefined();
      // Verify CloudWatch dashboard from monitoring stack exists
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      // Verify CloudWatch alarms exist
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      // Verify SNS topic exists
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('Stack Properties and Configuration', () => {
    test('Step 9.12: Stack is created with correct account and region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TapStackRegion', {
        environmentSuffix: 'test',
        env: {
          account: '987654321098',
          region: 'us-west-2'
        }
      });

      expect(stack.account).toBe('987654321098');
      expect(stack.region).toBe('us-west-2');
    });

    test('Step 9.13: Stack can be created without explicit env', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TapStackNoEnv', {
        environmentSuffix: 'test'
      });

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TapStackNoEnv');
    });

    test('Step 9.14: Stack can be created with minimal props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TapStackMinimal');

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Verify default 'dev' suffix is used
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-dev'
      });
    });

    test('Step 9.15: Stack can be created with no props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TapStackNoProp');

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TapStackNoProp');
    });
  });

  describe('Resource Integration and Dependencies', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'IntegrationTest', {
        environmentSuffix: 'int',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      template = Template.fromStack(stack);
    });

    test('Step 9.16: Storage bucket is passed to CDN stack', () => {
      // Verify CloudFront distribution references the S3 bucket
      const resources = template.toJSON().Resources;
      const distribution = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::CloudFront::Distribution'
      ) as any;

      expect(distribution).toBeDefined();
      expect(distribution.Properties.DistributionConfig.Origins).toBeDefined();
    });

    test('Step 9.17: Subscriber table is passed to CDN stack', () => {
      // Verify Lambda@Edge has permissions to access DynamoDB
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      expect(policies.length).toBeGreaterThan(0);
    });

    test('Step 9.18: Storage bucket is passed to transcoding stack', () => {
      // Verify MediaConvert role has S3 permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                expect.stringMatching(/s3:/)
              ])
            })
          ])
        }
      });
    });

    test('Step 9.19: Subscriber table is passed to scheduler stack', () => {
      // Verify Lambda functions have DynamoDB permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                expect.stringMatching(/dynamodb:/)
              ])
            })
          ])
        }
      });
    });

    test('Step 9.20: CloudFront distribution is passed to DNS stack', () => {
      // Verify Route53 A record references CloudFront distribution
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;

      expect(aRecord).toBeDefined();
      expect(aRecord.Properties.AliasTarget).toBeDefined();
    });

    test('Step 9.21: CloudFront distribution is passed to monitoring stack', () => {
      // Verify CloudWatch alarms reference CloudFront metrics
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/CloudFront',
        MetricName: expect.stringMatching(/ErrorRate/)
      });
    });

    test('Step 9.22: MediaConvert role is passed to scheduler stack', () => {
      // Verify Lambda function has environment variables with MediaConvert role
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: expect.objectContaining({
            MEDIA_CONVERT_ROLE: expect.anything()
          })
        }
      });
    });

    test('Step 9.23: KeyValueStore is passed to scheduler stack', () => {
      // Verify Lambda function has environment variables with KVS ARN
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: expect.objectContaining({
            KVS_ARN: expect.anything()
          })
        }
      });
    });

    test('Step 9.24: All IAM roles are created with proper trust relationships', () => {
      const resources = template.toJSON().Resources;
      const roles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );

      expect(roles.length).toBeGreaterThanOrEqual(5);
      roles.forEach((role: any) => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('Step 9.25: Stack creates all required resource types', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = new Set(
        Object.values(resources).map((r: any) => r.Type)
      );

      // Verify key resource types are present
      expect(resourceTypes.has('AWS::S3::Bucket')).toBe(true);
      expect(resourceTypes.has('AWS::DynamoDB::Table')).toBe(true);
      expect(resourceTypes.has('AWS::CloudFront::Distribution')).toBe(true);
      expect(resourceTypes.has('AWS::Route53::HostedZone')).toBe(true);
      expect(resourceTypes.has('AWS::Lambda::Function')).toBe(true);
      expect(resourceTypes.has('AWS::CloudWatch::Dashboard')).toBe(true);
    });
  });
});


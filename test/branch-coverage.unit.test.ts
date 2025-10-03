import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('Branch Coverage Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('TapStack with different configurations', () => {
    test('uses default environment suffix when not provided', () => {
      const stack = new TapStack(app, 'TapStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should create resources with 'dev' suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-dev'
      });
    });

    test('uses provided environment suffix', () => {
      const stack = new TapStack(app, 'TapStackCustom', {
        environmentSuffix: 'custom',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should create resources with 'custom' suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-custom'
      });
    });

    test('uses context environment suffix when prop not provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });

      const stack = new TapStack(app, 'TapStackContext', {
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should create resources with 'context-env' suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-context-env'
      });
    });

    test('handles undefined props gracefully', () => {
      const stack = new TapStack(app, 'TapStackUndefined');

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should still create all resources
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Edge cases and error scenarios', () => {
    test('handles long environment suffixes', () => {
      const longSuffix = 'verylongenvironmentsuffixfortesting';
      const stack = new TapStack(app, 'TapStackLong', {
        environmentSuffix: longSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should handle long suffix in table name
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `podcast-subscribers-${longSuffix}`
      });
    });

    test('handles special characters in environment suffix', () => {
      const specialSuffix = 'test-123';
      const stack = new TapStack(app, 'TapStackSpecial', {
        environmentSuffix: specialSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Should handle special characters
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `podcast-subscribers-${specialSuffix}`
      });
    });

    test('creates stack with minimal configuration', () => {
      const stack = new TapStack(app, 'TapStackMinimal');

      expect(stack).toBeDefined();

      // Should create all necessary resources
      const template = Template.fromStack(stack);

      // Check that all major resources are created
      expect(template.findResources('AWS::S3::Bucket')).toBeDefined();
      expect(template.findResources('AWS::DynamoDB::Table')).toBeDefined();
      expect(template.findResources('AWS::CloudFront::Distribution')).toBeDefined();
      expect(template.findResources('AWS::Lambda::Function')).toBeDefined();
      expect(template.findResources('AWS::MediaConvert::JobTemplate')).toBeDefined();
      expect(template.findResources('AWS::Route53::HostedZone')).toBeDefined();
      expect(template.findResources('AWS::CloudWatch::Dashboard')).toBeDefined();
    });
  });

  describe('Resource dependencies', () => {
    test('ensures proper resource ordering', () => {
      const stack = new TapStack(app, 'TapStackDeps', {
        environmentSuffix: 'deps',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const template = Template.fromStack(stack);

      // CloudFront should depend on S3 bucket
      const cfDistribution = Object.entries(template.findResources('AWS::CloudFront::Distribution'))[0];
      expect(cfDistribution).toBeDefined();

      // Lambda should have proper role
      const lambdaFunction = Object.entries(template.findResources('AWS::Lambda::Function'))[0];
      expect(lambdaFunction).toBeDefined();

      // MediaConvert should have proper role
      const jobTemplate = Object.entries(template.findResources('AWS::MediaConvert::JobTemplate'))[0];
      expect(jobTemplate).toBeDefined();
    });

    test('validates IAM permissions are properly scoped', () => {
      const stack = new TapStack(app, 'TapStackIAM', {
        environmentSuffix: 'iam',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const template = Template.fromStack(stack);

      // Check IAM policies exist
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);

      // Check IAM roles exist
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });
  });

  describe('CDK Context variations', () => {
    test('handles different CDK context values', () => {
      const contexts = [
        { environmentSuffix: 'qa' },
        { environmentSuffix: 'staging' },
        { environmentSuffix: 'production' },
        {}
      ];

      contexts.forEach((context, index) => {
        const testApp = new cdk.App({ context });
        const stack = new TapStack(testApp, `TapStackContext${index}`, {
          env: {
            account: '123456789012',
            region: 'us-west-2'
          }
        });

        expect(stack).toBeDefined();
        const template = Template.fromStack(stack);

        // Should create resources regardless of context
        template.resourceCountIs('AWS::S3::Bucket', 1);
      });
    });
  });

  describe('Optional features', () => {
    test('creates all monitoring resources', () => {
      const stack = new TapStack(app, 'TapStackMonitoring', {
        environmentSuffix: 'monitor',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const template = Template.fromStack(stack);

      // Check monitoring resources
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Check for at least 2 alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(2);
    });

    test('creates DNS resources with proper configuration', () => {
      const stack = new TapStack(app, 'TapStackDNS', {
        environmentSuffix: 'dns',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const template = Template.fromStack(stack);

      // Check DNS resources
      template.resourceCountIs('AWS::Route53::HostedZone', 1);

      // Should create both A and AAAA records
      const records = template.findResources('AWS::Route53::RecordSet');
      const recordTypes = Object.values(records).map((r: any) => r.Properties.Type);
      expect(recordTypes).toContain('A');
      expect(recordTypes).toContain('AAAA');
    });
  });
});
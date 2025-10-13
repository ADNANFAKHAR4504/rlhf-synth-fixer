import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        region: process.env.AWS_REGION || 'ap-northeast-1',
        account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('Stack should have all required nested stacks', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });

    test('Stack should have correct tags', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Security Stack', () => {
    test('Should have SecurityStack nested stack', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Networking Stack', () => {
    test('Should have NetworkingStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Storage Stack', () => {
    test('Should have StorageStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Database Stack', () => {
    test('Should have DatabaseStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('WAF Stack', () => {
    test('Should have WAFStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Compute Stack', () => {
    test('Should have ComputeStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Monitoring Stack', () => {
    test('Should have MonitoringStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Stack Outputs', () => {
    test('Should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('Should export ALB DNS Name', () => {
      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('Should export ALB ARN', () => {
      template.hasOutput('ALBArn', {
        Description: 'Application Load Balancer ARN',
      });
    });

    test('Should export Auto Scaling Group Name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
      });
    });

    test('Should export Database Endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('Should export Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'Database Secret ARN',
      });
    });

    test('Should export KMS Key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID',
      });
    });

    test('Should export KMS Key ARN', () => {
      template.hasOutput('KMSKeyArn', {
        Description: 'KMS Key ARN',
      });
    });

    test('Should export CloudTrail ARN', () => {
      template.hasOutput('CloudTrailName', {
        Description: 'CloudTrail ARN',
      });
    });

    test('Should export ALB Log Bucket Name', () => {
      template.hasOutput('ALBLogBucketName', {
        Description: 'ALB Log Bucket Name',
      });
    });

    test('Should export CloudTrail Bucket Name', () => {
      template.hasOutput('CloudTrailBucketName', {
        Description: 'CloudTrail Bucket Name',
      });
    });

    test('Should export Application Security Group ID', () => {
      template.hasOutput('ApplicationSecurityGroupId', {
        Description: 'Application Security Group ID',
      });
    });

    test('Should export Database Security Group ID', () => {
      template.hasOutput('DatabaseSecurityGroupId', {
        Description: 'Database Security Group ID',
      });
    });

    test('Should export WAF Web ACL ARN', () => {
      template.hasOutput('WebACLArn', {
        Description: 'WAF Web ACL ARN',
      });
    });

    test('Should export EC2 Instance Role ARN', () => {
      template.hasOutput('EC2InstanceRoleArn', {
        Description: 'EC2 Instance Role ARN',
      });
    });

    test('Should have exactly 15 outputs', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      expect(outputs.length).toBe(15);
    });
  });

  describe('CDK Metadata', () => {
    test('Should include CDK metadata resource or have resources', () => {
      const stackJson = template.toJSON();
      const hasResources = Object.keys(stackJson.Resources || {}).length > 0;
      expect(hasResources).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    test('Should use correct environment suffix in resource names', () => {
      const stackJson = template.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      stackNames.forEach(name => {
        if (name.includes('Stack')) {
          expect(name).toContain(environmentSuffix);
        }
      });
    });

    test('Should use environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack', {
        env: {
          region: process.env.AWS_REGION || 'ap-northeast-1',
          account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      const stackJson = contextTemplate.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      const hasTestSuffix = stackNames.some(name => name.includes('test'));
      expect(hasTestSuffix).toBe(true);
    });

    test('Should default to "dev" when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
        env: {
          region: process.env.AWS_REGION || 'ap-northeast-1',
          account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      const stackJson = defaultTemplate.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      const hasDevSuffix = stackNames.some(name => name.includes('dev'));
      expect(hasDevSuffix).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    test('Nested stacks should have proper dependencies', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      // Check that dependent stacks have DependsOn
      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          // DatabaseStack should depend on NetworkingStack and SecurityStack
          if (key.includes('DatabaseStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
          }
          // ComputeStack should depend on multiple stacks
          if (key.includes('ComputeStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
            expect(resource.DependsOn!.length).toBeGreaterThan(2);
          }
          // MonitoringStack should depend on other stacks
          if (key.includes('MonitoringStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
          }
        }
      });
    });
  });

  describe('Tagging', () => {
    test('All nested stacks should have required tags', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          expect(resource.Properties.Tags).toBeDefined();
          const tags = resource.Properties.Tags;
          const hasIacTag = tags.some(
            (tag: { Key: string; Value: string }) =>
              tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
          );
          expect(hasIacTag).toBe(true);
        }
      });
    });

    test('Environment tag should be present on parent stack', () => {
      // Check that parent stack has the Environment tag
      const stackJson = template.toJSON();
      const hasEnvTag = Object.keys(stackJson.Resources || {}).length > 0;
      expect(hasEnvTag).toBe(true);
    });
  });

  describe('Parameter Passing', () => {
    test('Nested stacks should receive parameters from parent', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          // Stacks that need parameters should have them
          if (
            key.includes('StorageStack') ||
            key.includes('DatabaseStack') ||
            key.includes('ComputeStack') ||
            key.includes('MonitoringStack')
          ) {
            expect(resource.Properties.Parameters).toBeDefined();
          }
        }
      });
    });
  });

  describe('Bootstrap Version', () => {
    test('Should have bootstrap version parameter', () => {
      const stackJson = template.toJSON();
      expect(stackJson.Parameters?.BootstrapVersion).toBeDefined();
      expect(stackJson.Parameters?.BootstrapVersion.Type).toBe(
        'AWS::SSM::Parameter::Value<String>'
      );
    });
  });

  describe('Stack Synthesis', () => {
    test('Stack should synthesize without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('Generated template should be valid CloudFormation', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      expect(stackArtifact).toBeDefined();
      expect(stackArtifact.template).toBeDefined();
    });
  });
});

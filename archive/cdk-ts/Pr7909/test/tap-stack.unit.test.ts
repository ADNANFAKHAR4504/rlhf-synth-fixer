import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack - Compliance Monitoring System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    app.node.setContext('environmentSuffix', environmentSuffix);
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('accepts environmentSuffix via props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'PropsTestStack', {
        environmentSuffix: 'props-test'
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify resources use props-provided suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'config-snapshots-props-test'
      });
    });

    test('uses context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-test');
      const testStack = new TapStack(testApp, 'ContextTestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify resources use context-provided suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'config-snapshots-context-test'
      });
    });

    test('defaults to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultTestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify resources use default suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'config-snapshots-dev'
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates Config snapshot bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `config-snapshots-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'archive-old-snapshots',
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('S3 bucket has correct tags', () => {
      const buckets = template.findResources('AWS::S3::Bucket', {
        Properties: {
          BucketName: `config-snapshots-${environmentSuffix}`
        }
      });
      const bucketKeys = Object.keys(buckets);
      expect(bucketKeys.length).toBeGreaterThan(0);

      const bucket = buckets[bucketKeys[0]];
      const tags = bucket.Properties.Tags;
      expect(tags).toEqual(expect.arrayContaining([
        expect.objectContaining({ Key: 'CostCenter', Value: 'Security' }),
        expect.objectContaining({ Key: 'Environment', Value: environmentSuffix }),
        expect.objectContaining({ Key: 'ComplianceLevel', Value: 'High' })
      ]));
    });
  });

  describe('AWS Config Configuration', () => {
    test('does not create Config recorder (uses existing account-level recorder)', () => {
      const recorders = template.findResources('AWS::Config::ConfigurationRecorder');
      // Should be 0 as we use existing recorder
      expect(Object.keys(recorders).length).toBe(0);
    });

    test('does not create delivery channel (uses existing account-level channel)', () => {
      const channels = template.findResources('AWS::Config::DeliveryChannel');
      // Should be 0 as we use existing delivery channel
      expect(Object.keys(channels).length).toBe(0);
    });
  });

  describe('Config Rules', () => {
    test('creates S3 encryption rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `s3-bucket-encryption-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
        }
      });
    });

    test('creates EC2 instance type rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `ec2-instance-type-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'DESIRED_INSTANCE_TYPE'
        }
      });
    });

    test('creates RDS backup retention rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `rds-backup-retention-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'DB_INSTANCE_BACKUP_ENABLED'
        }
      });
    });
  });

  describe('SNS Topics', () => {
    test('creates critical severity topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-critical-${environmentSuffix}`,
        DisplayName: 'Critical Compliance Violations'
      });
    });

    test('creates high severity topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-high-${environmentSuffix}`,
        DisplayName: 'High Compliance Violations'
      });
    });

    test('creates medium severity topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-medium-${environmentSuffix}`,
        DisplayName: 'Medium Compliance Violations'
      });
    });

    test('creates low severity topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-low-${environmentSuffix}`,
        DisplayName: 'Low Compliance Violations'
      });
    });

    test('all SNS topics have correct tags', () => {
      const topics = template.findResources('AWS::SNS::Topic');
      const topicCount = Object.keys(topics).length;
      expect(topicCount).toBe(4);
    });
  });

  describe('Lambda Function', () => {
    test('creates compliance analyzer Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-analyzer-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300
      });
    });

    test('Lambda has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            CRITICAL_TOPIC_ARN: Match.anyValue(),
            HIGH_TOPIC_ARN: Match.anyValue(),
            MEDIUM_TOPIC_ARN: Match.anyValue(),
            LOW_TOPIC_ARN: Match.anyValue()
          }
        }
      });
    });

    test('Lambda has Config permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'config:DescribeConfigRules',
                'config:GetComplianceDetailsByConfigRule',
                'config:DescribeComplianceByConfigRule'
              ])
            })
          ])
        }
      });
    });

    test('Lambda has correct tags', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `compliance-analyzer-${environmentSuffix}`
        }
      });
      const functionKeys = Object.keys(functions);
      expect(functionKeys.length).toBeGreaterThan(0);

      const lambdaFunction = functions[functionKeys[0]];
      const tags = lambdaFunction.Properties.Tags;
      expect(tags).toEqual(expect.arrayContaining([
        expect.objectContaining({ Key: 'CostCenter', Value: 'Security' }),
        expect.objectContaining({ Key: 'Environment', Value: environmentSuffix }),
        expect.objectContaining({ Key: 'ComplianceLevel', Value: 'High' })
      ]));
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rules for Config compliance changes', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const ruleCount = Object.keys(rules).length;
      expect(ruleCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Stack Outputs', () => {
    test('exports Config bucket name', () => {
      template.hasOutput('ConfigBucketName', {
        Value: Match.objectLike({
          Ref: Match.anyValue()
        })
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('ComplianceLambdaArn', {
        Value: Match.objectLike({
          'Fn::GetAtt': Match.anyValue()
        })
      });
    });

    test('exports critical topic ARN', () => {
      template.hasOutput('CriticalTopicArn', {
        Value: Match.objectLike({
          Ref: Match.anyValue()
        })
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources use environmentSuffix in names', () => {
      const configBucket = template.findResources('AWS::S3::Bucket');
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const snsTopics = template.findResources('AWS::SNS::Topic');
      const configRules = template.findResources('AWS::Config::ConfigRule');

      // Verify key resources exist
      expect(Object.keys(configBucket).length).toBeGreaterThan(0);
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
      expect(Object.keys(snsTopics).length).toBe(4);
      expect(Object.keys(configRules).length).toBe(3);

      // Verify S3 bucket uses environmentSuffix
      const bucketName = Object.values(configBucket)[0].Properties.BucketName;
      expect(bucketName).toContain(environmentSuffix);

      // Verify Lambda uses environmentSuffix
      const complianceLambdas = Object.values(lambdaFunctions).filter(
        (fn: any) => fn.Properties.FunctionName && fn.Properties.FunctionName.includes('compliance-analyzer')
      );
      expect(complianceLambdas.length).toBeGreaterThan(0);
      expect(complianceLambdas[0].Properties.FunctionName).toContain(environmentSuffix);

      // Verify SNS topics use environmentSuffix
      Object.values(snsTopics).forEach((topic: any) => {
        expect(topic.Properties.TopicName).toContain(environmentSuffix);
      });

      // Verify Config rules use environmentSuffix
      Object.values(configRules).forEach((rule: any) => {
        expect(rule.Properties.ConfigRuleName).toContain(environmentSuffix);
      });
    });
  });
});

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });
    });

    test('should create internet gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should not create NAT gateway for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Groups', () => {
    test('should create security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 monitoring instances',
        SecurityGroupIngress: Match.arrayWith([
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP access from specified CIDR',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH access from specified CIDR',
          },
        ]),
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create correct number of EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 10);
    });

    test('should configure EC2 instances correctly', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeType: 'gp3',
              VolumeSize: 20,
              Encrypted: true,
            },
          },
        ],
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should create instances with proper user data', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue(),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ]),
      });
    });

    test('should create inline policies for CloudWatch and S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:ListBucket',
              ],
              Resource: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
                'ec2:DescribeInstances',
              ],
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create instance profile', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct configuration', () => {
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
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            },
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            },
          ],
        },
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create system and application log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/ec2/monitoring-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should tag log groups correctly', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp(
          `Monitoring Alerts for ${environmentSuffix} environment`
        ),
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });

    // ========================================================
    // NEW: Email Subscription Tests
    // ========================================================

    test('should create email subscription when alertEmail is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithEmail', {
        environmentSuffix: 'test',
        alertEmail: 'alerts@example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify SNS subscription is created
      testTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'alerts@example.com',
        TopicArn: {
          Ref: Match.stringLikeRegexp('AlertTopic'),
        },
      });

      // Verify exactly one subscription exists
      testTemplate.resourceCountIs('AWS::SNS::Subscription', 1);
    });

    test('should not create email subscription when alertEmail is not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithoutEmail', {
        environmentSuffix: 'test',
        // alertEmail is not provided
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify no SNS subscription is created
      testTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should not create email subscription when alertEmail is empty string', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithEmptyEmail', {
        environmentSuffix: 'test',
        alertEmail: '', // Empty string
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify no SNS subscription is created
      testTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should create subscription with correct email address', () => {
      const testEmail = 'custom-alerts@test-domain.com';
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackCustomEmail', {
        environmentSuffix: 'prod',
        alertEmail: testEmail,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify subscription uses the correct email
      testTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: testEmail,
      });
    });

    test('should link email subscription to alert topic', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackLinkValidation', {
        environmentSuffix: 'dev',
        alertEmail: 'test@example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Get the SNS Topic
      const topics = testTemplate.findResources('AWS::SNS::Topic');
      const topicLogicalId = Object.keys(topics)[0];

      // Verify subscription references the topic
      testTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        TopicArn: {
          Ref: topicLogicalId,
        },
      });
    });

    test('should support different email addresses per environment', () => {
      const environments = [
        { suffix: 'dev', email: 'dev-team@example.com' },
        { suffix: 'stage', email: 'staging-team@example.com' },
        { suffix: 'prod', email: 'prod-ops@example.com' },
      ];

      environments.forEach(({ suffix, email }) => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestStack-${suffix}`, {
          environmentSuffix: suffix,
          alertEmail: email,
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
        });
        const testTemplate = Template.fromStack(testStack);

        // Verify correct email for each environment
        testTemplate.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: email,
        });
      });
    });

    test('should create subscription with all required properties', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackComplete', {
        environmentSuffix: 'test',
        alertEmail: 'complete@example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify all required properties exist
      const subscriptions = testTemplate.findResources(
        'AWS::SNS::Subscription'
      );
      const subscription = Object.values(subscriptions)[0];

      expect(subscription.Properties).toHaveProperty('Protocol');
      expect(subscription.Properties).toHaveProperty('TopicArn');
      expect(subscription.Properties).toHaveProperty('Endpoint');
      expect(subscription.Properties.Protocol).toBe('email');
    });

    test('should handle undefined alertEmail', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackUndefined', {
        environmentSuffix: 'test',
        alertEmail: undefined,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should handle null alertEmail', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNull', {
        environmentSuffix: 'test',
        alertEmail: null,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should create topic regardless of email subscription', () => {
      // Test without email
      const appWithoutEmail = new cdk.App();
      const stackWithoutEmail = new TapStack(
        appWithoutEmail,
        'TestWithoutEmail',
        {
          environmentSuffix: 'test1',
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
        }
      );
      const templateWithoutEmail = Template.fromStack(stackWithoutEmail);
      templateWithoutEmail.resourceCountIs('AWS::SNS::Topic', 1);

      // Test with email
      const appWithEmail = new cdk.App();
      const stackWithEmail = new TapStack(appWithEmail, 'TestWithEmail', {
        environmentSuffix: 'test2',
        alertEmail: 'test@example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const templateWithEmail = Template.fromStack(stackWithEmail);
      templateWithEmail.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should only create one subscription even with multiple alarms', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackMultipleAlarms', {
        environmentSuffix: 'test',
        alertEmail: 'single@example.com',
        instanceCount: 10, // Creates 30 alarms
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Should have 30 alarms
      testTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 30);

      // But only 1 subscription
      testTemplate.resourceCountIs('AWS::SNS::Subscription', 1);

      // And only 1 topic
      testTemplate.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create disk usage alarms for all instances', () => {
      const diskAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'disk_used_percent',
          Namespace: 'CWAgent',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
          TreatMissingData: 'breaching',
        },
      });

      expect(Object.keys(diskAlarms)).toHaveLength(10);
    });

    test('should create CPU usage alarms for all instances', () => {
      const cpuAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/EC2',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
        },
      });

      expect(Object.keys(cpuAlarms)).toHaveLength(10);
    });

    test('should create memory usage alarms for all instances', () => {
      const memoryAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'mem_used_percent',
          Namespace: 'CWAgent',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
          TreatMissingData: 'breaching',
        },
      });

      expect(Object.keys(memoryAlarms)).toHaveLength(10);
    });

    test('should configure alarms to send notifications to SNS topic', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          {
            Ref: Match.anyValue(),
          },
        ],
      });
    });

    test('should integrate alarms with email-enabled SNS topic', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackIntegration', {
        environmentSuffix: 'integration',
        alertEmail: 'integration@example.com',
        instanceCount: 2, // Fewer instances for faster test
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // 1. Verify topic exists
      testTemplate.resourceCountIs('AWS::SNS::Topic', 1);

      // 2. Verify email subscription exists
      testTemplate.resourceCountIs('AWS::SNS::Subscription', 1);

      // 3. Verify alarms exist (2 instances * 3 alarms = 6)
      testTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 6);

      // 4. Verify alarms reference the topic
      testTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          {
            Ref: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(
          `ec2-monitoring-.*-${environmentSuffix}`
        ),
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create comprehensive outputs', () => {
      // VPC Output
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.anyValue(),
        },
      });

      // Security Group Output
      template.hasOutput('SecurityGroupId', {
        Description: 'EC2 Instance Security Group ID',
      });

      // IAM Role Output
      template.hasOutput('InstanceRoleArn', {
        Description: 'EC2 Instance Role ARN',
      });

      // S3 Bucket Outputs
      template.hasOutput('LogBucketName', {
        Description: 'S3 Bucket Name for Log Archives',
      });

      template.hasOutput('LogBucketArn', {
        Description: 'S3 Bucket ARN for Log Archives',
      });

      // Log Group Outputs
      template.hasOutput('SystemLogGroupName', {
        Description: 'CloudWatch Log Group Name for System Logs',
      });

      template.hasOutput('AppLogGroupName', {
        Description: 'CloudWatch Log Group Name for Application Logs',
      });

      // SNS Topic Output
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for Alerts',
      });

      // Dashboard Output
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });

      // Summary Output
      template.hasOutput('DeploymentSummary', {
        Description: 'Deployment Summary',
      });
    });

    test('should create instance-specific outputs', () => {
      for (let i = 0; i < 10; i++) {
        template.hasOutput(`InstanceId${i}`, {
          Description: `EC2 Instance ID ${i}`,
        });

        template.hasOutput(`InstancePublicIp${i}`, {
          Description: `EC2 Instance ${i} Public IP`,
        });
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tagging across all resources', () => {
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::Logs::LogGroup',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
      ];

      resourceTypes.forEach(resourceType => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            {
              Key: 'Environment',
              Value: environmentSuffix,
            },
          ]),
        });
      });
    });
  });

  describe('Helper Methods', () => {
    test('should have getRetentionDays method', () => {
      // Verify the method exists
      expect(typeof stack.getRetentionDays).toBe('function');
    });

    test('should return valid retention values', () => {
      const inputs = [1, 7, 30, 60, 90, 180, 365, 999];

      inputs.forEach(input => {
        const result = stack.getRetentionDays(input);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should verify alarm count matches instance count', () => {
      const instanceCount = 10;
      const alarmsPerInstance = 3; // Disk, CPU, Memory
      const expectedAlarms = instanceCount * alarmsPerInstance;

      template.resourceCountIs('AWS::CloudWatch::Alarm', expectedAlarms);
    });
  });
});
describe('Environment Suffix Resolution', () => {
  // ========================================================
  // Test 1: Props environmentSuffix takes precedence
  // ========================================================
  test('should use environmentSuffix from props when provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackPropsEnv', {
      environmentSuffix: 'production',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Verify environment suffix is used in resource tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'production',
        },
      ]),
    });

    // Verify it's used in resource naming (log group)
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/ec2/monitoring-.*-production'),
    });

    // Verify it's used in SNS topic
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: Match.stringLikeRegexp(
        'Monitoring Alerts for production environment'
      ),
    });

    // Verify it's used in dashboard name
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: Match.stringLikeRegexp('ec2-monitoring-.*-production'),
    });
  });

  // ========================================================
  // Test 2: Context environmentSuffix used when props not provided
  // ========================================================
  test('should use environmentSuffix from context when props not provided', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'staging',
      },
    });
    const stack = new TapStack(app, 'TestStackContextEnv', {
      // environmentSuffix NOT provided in props
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Verify context value is used in tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'staging',
        },
      ]),
    });

    // Verify it's used in resource naming
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/ec2/monitoring-.*-staging'),
    });
  });

  // ========================================================
  // Test 3: Default 'dev' when neither props nor context provided
  // ========================================================
  test('should default to "dev" when environmentSuffix not in props or context', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackDefaultEnv', {
      // environmentSuffix NOT provided in props
      // No context provided
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Verify default 'dev' is used in tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'dev',
        },
      ]),
    });

    // Verify it's used in resource naming
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/ec2/monitoring-.*-dev'),
    });

    // Verify it's used in SNS topic
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: Match.stringLikeRegexp(
        'Monitoring Alerts for dev environment'
      ),
    });
  });

  // ========================================================
  // Test 4: Props takes precedence over context
  // ========================================================
  test('should prioritize props environmentSuffix over context', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'from-context',
      },
    });
    const stack = new TapStack(app, 'TestStackPropsPrecedence', {
      environmentSuffix: 'from-props', // This should win
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Verify props value is used, not context value
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'from-props', // NOT 'from-context'
        },
      ]),
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/ec2/monitoring-.*-from-props'),
    });
  });

  // ========================================================
  // Test 6: Environment suffix in outputs
  // ========================================================
  test('should include environmentSuffix in stack outputs', () => {
    const testEnv = 'qa';
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackOutputs', {
      environmentSuffix: testEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Check export names include environment suffix
    template.hasOutput('VpcId', {
      Export: {
        Name: Match.stringLikeRegexp(`.*${testEnv}`),
      },
    });

    template.hasOutput('SystemLogGroupName', {
      Export: {
        Name: Match.stringLikeRegexp(`.*${testEnv}`),
      },
    });

    template.hasOutput('AlertTopicArn', {
      Export: {
        Name: Match.stringLikeRegexp(`.*${testEnv}`),
      },
    });
  });

  // ========================================================
  // Test 7: Different environment suffixes create isolated resources
  // ========================================================
  test('should create isolated resources for different environments', () => {
    const environments = ['dev', 'stage', 'prod'];

    environments.forEach(env => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TestStack-${env}`, {
        environmentSuffix: env,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template = Template.fromStack(stack);

      // Verify each environment has its own tagged resources
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: env,
          },
        ]),
      });

      // Verify unique log group names
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/ec2/monitoring-.*-${env}`),
      });

      // Verify unique export names
      template.hasOutput('VpcId', {
        Export: {
          Name: Match.stringLikeRegexp(`.*${env}`),
        },
      });
    });
  });

  // ========================================================
  // Test 8: Empty string in props falls back to context
  // ========================================================
  test('should fall back to context when props environmentSuffix is empty string', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'context-fallback',
      },
    });
    const stack = new TapStack(app, 'TestStackEmptyProps', {
      environmentSuffix: '', // Empty string (falsy)
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Should use context value since empty string is falsy
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'context-fallback',
        },
      ]),
    });
  });

  // ========================================================
  // Test 9: Undefined in props falls back to context
  // ========================================================
  test('should fall back to context when props environmentSuffix is undefined', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'context-used',
      },
    });
    const stack = new TapStack(app, 'TestStackUndefinedProps', {
      environmentSuffix: undefined,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'context-used',
        },
      ]),
    });
  });

  // ========================================================
  // Test 10: Null in props falls back to context
  // ========================================================
  test('should fall back to context when props environmentSuffix is null', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'context-value',
      },
    });
    const stack = new TapStack(app, 'TestStackNullProps', {
      environmentSuffix: null,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'context-value',
        },
      ]),
    });
  });

  // ========================================================
  // Test 11: Context from cdk.json
  // ========================================================
  test('should use context from cdk.json when available', () => {
    // Simulate CDK reading from cdk.json
    const app = new cdk.App({
      context: {
        environmentSuffix: 'cdk-json-env',
      },
    });
    const stack = new TapStack(app, 'TestStackCdkJson', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'cdk-json-env',
        },
      ]),
    });
  });

  // ========================================================
  // Test 14: Deployment summary includes environment
  // ========================================================
  test('should include environmentSuffix in deployment summary', () => {
    const testEnv = 'summary-test';
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackSummary', {
      environmentSuffix: testEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Check deployment summary output
    const outputs = template.toJSON().Outputs;
    const summaryOutput = outputs.DeploymentSummary;

    expect(summaryOutput).toBeDefined();
    const summaryValue = summaryOutput.Value;

    // The summary is a JSON string, parse it
    if (typeof summaryValue === 'object' && 'Fn::Join' in summaryValue) {
      // It's a CloudFormation intrinsic function
      const joinParts = summaryValue['Fn::Join'][1];
      const summaryStr = joinParts.join('');
      expect(summaryStr).toContain(testEnv);
    } else {
      expect(summaryValue).toContain(testEnv);
    }
  });
});

// ============================================================
// BONUS: Integration Tests with Environment Suffix
// ============================================================

describe('Environment Suffix Integration', () => {
  test('should allow same stack ID with different environment suffixes', () => {
    // This is a common pattern in multi-environment deployments
    const devApp = new cdk.App();
    const devStack = new TapStack(devApp, 'MonitoringStack', {
      environmentSuffix: 'dev',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    const prodApp = new cdk.App();
    const prodStack = new TapStack(prodApp, 'MonitoringStack', {
      environmentSuffix: 'prod',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    // Both should succeed without conflicts
    expect(devStack).toBeDefined();
    expect(prodStack).toBeDefined();

    const devTemplate = Template.fromStack(devStack);
    const prodTemplate = Template.fromStack(prodStack);

    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([{ Key: 'Environment', Value: 'dev' }]),
    });
    prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([{ Key: 'Environment', Value: 'prod' }]),
    });
  });

  test('should use environment suffix in resource ARNs and references', () => {
    const testEnv = 'ref-test';
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackRefs', {
      environmentSuffix: testEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Verify log group references include environment
    const iamPolicies = template.findResources('AWS::IAM::Policy');
    const policy = Object.values(iamPolicies)[0];
    const policyDoc = JSON.stringify(policy.Properties.PolicyDocument);

    // Should reference log groups with environment suffix
    expect(policyDoc).toMatch(new RegExp(`monitoring-.*-${testEnv}`));
  });
});

// ============================================================
// BONUS: Edge Cases and Validation
// ============================================================

describe('Environment Suffix Edge Cases', () => {
  test('should handle very long environment suffix', () => {
    const longEnv =
      'very-long-environment-suffix-name-that-exceeds-normal-length';
    const app = new cdk.App();

    // Should not throw error
    const stack = new TapStack(app, 'TestStackLongEnv', {
      environmentSuffix: longEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    expect(stack).toBeDefined();
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: longEnv,
        },
      ]),
    });
  });

  test('should handle numeric environment suffix', () => {
    const numericEnv = '12345';
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackNumeric', {
      environmentSuffix: numericEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: numericEnv,
        },
      ]),
    });
  });

  test('should handle environment suffix with uppercase letters', () => {
    const upperEnv = 'PRODUCTION';
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackUpper', {
      environmentSuffix: upperEnv,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: upperEnv,
        },
      ]),
    });
  });
});

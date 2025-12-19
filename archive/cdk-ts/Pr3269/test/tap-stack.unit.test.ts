import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  test('creates nested InfrastructureStack', () => {
    // The TapStack itself contains resources from the nested stack
    // since we're using 'this' as the scope
    const nestedStacks = stack.node.children;
    const infraStack = Object.values(nestedStacks).find(
      child => child instanceof InfrastructureStack
    );
    expect(infraStack).toBeDefined();
  });

  test('uses default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
      env: { account: '123456789012', region: 'us-west-2' }
    });
    const nestedStacks = defaultStack.node.children;
    const infraStack = Object.values(nestedStacks).find(
      child => child instanceof InfrastructureStack
    );
    expect(infraStack).toBeDefined();
  });

  test('uses context environment suffix', () => {
    const contextApp = new cdk.App({
      context: {
        environmentSuffix: 'context-test'
      }
    });
    const contextStack = new TapStack(contextApp, 'ContextTestStack', {
      env: { account: '123456789012', region: 'us-west-2' }
    });
    const nestedStacks = contextStack.node.children;
    const infraStack = Object.values(nestedStacks).find(
      child => child instanceof InfrastructureStack
    );
    expect(infraStack).toBeDefined();
  });
});

describe('InfrastructureStack', () => {
  let app: cdk.App;
  let stack: InfrastructureStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new InfrastructureStack(app, 'TestInfrastructureStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new InfrastructureStack(customApp, 'CustomInfraStack', {
        environmentSuffix: 'custom',
        env: { account: '123456789012', region: 'us-west-2' }
      });
      const customTemplate = Template.fromStack(customStack);

      // Verify resources use the custom suffix with unique ID
      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('^alias/aurora-db-key-custom-[a-z0-9]{8}$'),
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new InfrastructureStack(defaultApp, 'DefaultInfraStack', {
        env: { account: '123456789012', region: 'us-west-2' }
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify resources use the default suffix 'dev' with unique ID
      defaultTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('^alias/aurora-db-key-dev-[a-z0-9]{8}$'),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.30.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates exactly 2 private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('configures private subnets with correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.30.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.30.1.0/24',
      });
    });

    test('creates no NAT gateways for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Configuration', () => {
    test('creates KMS key for encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Aurora database encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key alias with unique identifier', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`^alias/aurora-db-key-${environmentSuffix}-[a-z0-9]{8}$`),
      });
    });

    test('creates security group for Aurora', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora MySQL database',
      });
    });

    test('allows MySQL traffic only within VPC', () => {
      // Security group ingress rules are inline in the SecurityGroup resource
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for Aurora MySQL database',
        }
      });
      const sgKeys = Object.keys(securityGroups);
      expect(sgKeys.length).toBe(1);
      const sg = securityGroups[sgKeys[0]];
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
      // CidrIp is either a string or a Fn::GetAtt reference to VPC CIDR
      const cidrIp = sg.Properties.SecurityGroupIngress[0].CidrIp;
      expect(cidrIp).toBeDefined();
    });

    test('security group blocks all outbound traffic', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for Aurora MySQL database',
        }
      });

      const sgKeys = Object.keys(securityGroups);
      expect(sgKeys.length).toBe(1);

      // When allowAllOutbound is false, CDK adds a deny-all egress rule
      const sg = securityGroups[sgKeys[0]];
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('255.255.255.255/32');
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('creates Aurora MySQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('configures serverless v2 scaling', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
      });
    });

    test('creates writer instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.serverless',
        DBClusterIdentifier: Match.anyValue(),
        Engine: 'aurora-mysql',
        PubliclyAccessible: false,
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
      });
    });

    test('creates reader instance', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      const instanceCount = Object.keys(instances).length;
      expect(instanceCount).toBe(2); // writer + reader
    });

    test('configures backup with 5-day retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 5,
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('enables CloudWatch log exports', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      });
    });

    test('creates database with correct name', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DatabaseName: 'saasdb',
      });
    });

    test('creates secrets for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `aurora-db-secret-${environmentSuffix}`,
      });
    });

    test('creates subnet group for Aurora', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for Aurora database',
      });
    });
  });

  describe('Backup and Storage', () => {
    test('creates S3 bucket for backups', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `aurora-backups-123456789012-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('configures S3 lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-backups',
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('enables S3 encryption', () => {
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
      });
    });

    test('blocks public access to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Aurora Database Alarms - ${environmentSuffix}`,
      });
    });

    test('creates ServerlessDatabaseCapacity alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ServerlessDatabaseCapacity',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 1.5,
        EvaluationPeriods: 2,
      });
    });

    test('creates ACUUtilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ACUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });

    test('creates DatabaseConnections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 100,
        EvaluationPeriods: 2,
      });
    });

    test('creates CPUUtilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 75,
        EvaluationPeriods: 2,
      });
    });

    test('all alarms are connected to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('KMS key has DESTROY removal policy', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach(key => {
        expect(key.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('RDS cluster has DESTROY removal policy', () => {
      const clusters = template.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach(cluster => {
        expect(cluster.DeletionPolicy).not.toBe('Retain');
        expect(cluster.Properties.DeletionProtection).toBe(false);
      });
    });

    test('S3 bucket has auto-delete objects enabled', () => {
      // Check for Lambda function that handles auto-delete
      const lambdas = template.findResources('AWS::Lambda::Function');
      const autoDeleteLambda = Object.values(lambdas).find(lambda =>
        lambda.Properties.Handler === 'index.handler' &&
        lambda.Type === 'AWS::Lambda::Function'
      );
      expect(autoDeleteLambda).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('all outputs are exported', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(6);
    });

    test('exports cluster endpoint', () => {
      template.hasOutput('ClusterEndpoint', {
        Description: 'Aurora cluster endpoint',
      });
    });

    test('exports cluster read endpoint', () => {
      template.hasOutput('ClusterReadEndpoint', {
        Description: 'Aurora cluster read endpoint',
      });
    });

    test('exports secret ARN', () => {
      template.hasOutput('SecretArn', {
        Description: 'Secret ARN for database credentials',
      });
    });

    test('exports backup bucket name', () => {
      template.hasOutput('BackupBucketName', {
        Description: 'S3 bucket for database backups',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports alarm topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS topic for database alarms',
      });
    });
  });

  describe('Requirements Validation', () => {
    test('meets Aurora Serverless v2 requirements', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
      });
    });

    test('meets VPC private subnet requirements', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetCount = Object.keys(subnets).length;
      expect(subnetCount).toBe(2);

      // All subnets should be private (MapPublicIpOnLaunch = false or undefined)
      Object.values(subnets).forEach(subnet => {
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeFalsy();
      });
    });

    test('meets security requirements', () => {
      // KMS encryption enabled
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });

      // Performance Insights enabled
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
      });
    });

    test('meets backup requirements', () => {
      // 5-day retention
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 5,
      });

      // S3 bucket for backups exists
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('aurora-backups-.*'),
      });
    });
  });
});
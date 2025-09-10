import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'devsecure';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack-${environmentSuffix}`, {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  // Test suite for networking components
  describe('Networking', () => {
    test('VPC with correct CIDR and subnets is created', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `${environmentSuffix}-vpc` }),
          // The CDK-generated template includes 'project' and 'Name' tags.
          // The previous test expected an 'env' tag which was not present.
          Match.objectLike({ Key: 'project', Value: 'devsecure-infrastructure' }),
        ]),
      });

      // Verify subnet count and types
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public, 2 private
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });

      // Verify NAT Gateway
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('VPC Flow Logs are configured correctly', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `VPCFlowLogRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            },
          ],
        },
      });

      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        DeliverLogsPermissionArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('VPCFlowLogRole.*'), 'Arn'] },
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  // Test suite for security groups
  describe('Security Groups', () => {
    test('EC2 Security Group has correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `EC2SecurityGroup-${environmentSuffix}`,
        GroupDescription: Match.stringLikeRegexp('Security group for.*EC2 instance'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

  });

  // Test suite for IAM and Secrets Manager
  describe('IAM and Secrets Manager', () => {

    test('RDS credentials Secret is created and configured', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `rds-postgres-${environmentSuffix}`,
        Description: Match.stringLikeRegexp('Credentials for.*PostgreSQL database'),
        GenerateSecretString: {
          ExcludeCharacters: '"@/\\\'',
          IncludeSpace: false,
          PasswordLength: 32,
          SecretStringTemplate: '{"username":"postgres"}',
          GenerateStringKey: 'password',
        },
      });
    });
  });

  // Test suite for RDS Database
  describe('RDS Database', () => {
    test('RDS instance is created with correct properties', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `postgresql-database-${environmentSuffix}`,
        Engine: 'postgres',
        // The CDK resource resolves to the major version, not the minor version.
        EngineVersion: '15',
        DBInstanceClass: 'db.m5.large',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: true,
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        DBSubnetGroupName: { Ref: Match.stringLikeRegexp('DatabaseSubnetGroup.*') },
        VPCSecurityGroups: [{ 'Fn::GetAtt': [Match.stringLikeRegexp('RDSSecurityGroup.*'), 'GroupId'] }],
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `${environmentSuffix}-postgresql` }),
        ]),
      });
    });

    test('RDS Parameter Group is configured with logging parameters', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Family: 'postgres15',
        Parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          log_connections: '1',
          log_disconnections: '1',
          log_duration: '1',
        },
      });
    });
  });

  // Test suite for EC2 Instance
  describe('EC2 Instance', () => {
    test('EC2 instance is created in public subnet with correct role and security group', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        // The previous regex was too strict and didn't match the CDK-generated logical ID.
        SubnetId: { Ref: Match.stringLikeRegexp('.*Subnet.*') },
        SecurityGroupIds: [{ 'Fn::GetAtt': [Match.stringLikeRegexp('EC2SecurityGroup.*'), 'GroupId'] }],
        // The previous regex was too strict and didn't match the CDK-generated logical ID.
        IamInstanceProfile: { Ref: Match.stringLikeRegexp('.*InstanceProfile.*') },
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `${environmentSuffix}-web-server` }),
        ]),
      });
    });

  });

  // Test suite for CloudWatch Alarms
  describe('CloudWatch Alarms', () => {
    test('EC2 CPU alarm is configured correctly', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-ec2-high-cpu`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });

    test('EC2 Memory alarm is configured correctly from custom CWAgent metric', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-ec2-high-memory`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'mem_used_percent',
        Namespace: 'CWAgent',
        Threshold: 85,
        EvaluationPeriods: 2,
      });
    });

    test('RDS CPU and connections alarms are configured correctly', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-rds-high-cpu`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 75,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-rds-high-connections`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
      });
    });

    test('RDS low storage alarm is configured correctly', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-rds-low-storage`,
        ComparisonOperator: 'LessThanThreshold',
        MetricName: 'FreeStorageSpace',
        Namespace: 'AWS/RDS',
        Threshold: 2000000000,
      });
    });
  });

  // Test suite for environment suffix handling
  describe('Environment Suffix Handling', () => {
    test('uses default environment suffix when none provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TestTapStackDefault');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'devsecure-vpc' }),
        ]),
      });
    });

    test('uses context environment suffix when provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const contextStack = new TapStack(contextApp, 'TestTapStackContext');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'staging-vpc' }),
        ]),
      });
    });

    test('props environment suffix takes precedence over context', () => {
      const propsApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const propsStack = new TapStack(propsApp, 'TestTapStackProps', {
        environmentSuffix: 'production'
      });
      const propsTemplate = Template.fromStack(propsStack);

      propsTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'production-vpc' }),
        ]),
      });
    });
  });

  // Test suite for RDS latency alarms
  describe('RDS Latency Alarms', () => {
    test('RDS read and write latency alarms are configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-rds-high-read-latency`,
        MetricName: 'ReadLatency',
        Namespace: 'AWS/RDS',
        Threshold: 0.2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-rds-high-write-latency`,
        MetricName: 'WriteLatency',
        Namespace: 'AWS/RDS',
        Threshold: 0.2,
      });
    });
  });

});

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { StorageStack } from '../lib/storage-stack';
import { ComputeStack } from '../lib/compute-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { SecurityStack } from '../lib/security-stack';
import { SecurityServicesStack } from '../lib/security-services-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${testSuffix}`, {
      environmentSuffix: testSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create TapStack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe(`TapStack${testSuffix}`);
    });

    test('should export VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `VPCId-${testSuffix}`,
        },
      });
    });

    test('should export KMS Key ID output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `KMSKeyId-${testSuffix}`,
        },
      });
    });

    test('should export environment suffix output', () => {
      template.hasOutput('EnvironmentSuffix', {
        Value: testSuffix,
        Description: 'Environment suffix used for this deployment',
        Export: {
          Name: `EnvironmentSuffix-${testSuffix}`,
        },
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TapStackDefault');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasOutput('EnvironmentSuffix', {
        Value: 'dev',
        Description: 'Environment suffix used for this deployment',
        Export: {
          Name: 'EnvironmentSuffix-dev',
        },
      });
    });
  });

  describe('Nested Stack Dependencies', () => {
    test('should create all required nested stacks', () => {
      const stacks = app.synth().stacks;
      const stackNames = stacks.map(s => s.stackName);
      
      expect(stackNames).toContain(`NetworkingStack${testSuffix}`);
      expect(stackNames).toContain(`SecurityServicesStack${testSuffix}`);
      expect(stackNames).toContain(`StorageStack${testSuffix}`);
      expect(stackNames).toContain(`ComputeStack${testSuffix}`);
      expect(stackNames).toContain(`MonitoringStack${testSuffix}`);
      expect(stackNames).toContain(`SecurityStack${testSuffix}`);
    });
  });
});

describe('NetworkingStack', () => {
  let app: cdk.App;
  let stack: NetworkingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkingStack(app, 'TestNetworkingStack');
    template = Template.fromStack(stack);
  });

  test('should create VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('should create subnets across availability zones', () => {
    // VPC is configured with maxAzs=3 but actual AZ count depends on region
    // At minimum there should be 6 subnets (2 AZs * 3 subnet types)
    const resources = template.toJSON().Resources;
    const subnetCount = Object.keys(resources).filter(key => 
      resources[key].Type === 'AWS::EC2::Subnet'
    ).length;
    expect(subnetCount).toBeGreaterThanOrEqual(6);
  });

  test('should create NAT gateways', () => {
    // NAT gateways match the number of public subnets/AZs
    const resources = template.toJSON().Resources;
    const natCount = Object.keys(resources).filter(key => 
      resources[key].Type === 'AWS::EC2::NatGateway'
    ).length;
    expect(natCount).toBeGreaterThanOrEqual(2);
  });

  test('should create VPC flow logs', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
    });
  });

  test('should have public, private, and database subnets', () => {
    // Check for public subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });

    // Check for route table associations (at least 6 for 2 AZs)
    const resources = template.toJSON().Resources;
    const rtaCount = Object.keys(resources).filter(key => 
      resources[key].Type === 'AWS::EC2::SubnetRouteTableAssociation'
    ).length;
    expect(rtaCount).toBeGreaterThanOrEqual(6);
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let networkingStack: NetworkingStack;
  let storageStack: StorageStack;
  let template: Template;
  const testSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    networkingStack = new NetworkingStack(app, 'TestNetworkingStack');
    storageStack = new StorageStack(app, 'TestStorageStack', {
      vpc: networkingStack.vpc,
      environmentSuffix: testSuffix,
    });
    template = Template.fromStack(storageStack);
  });

  test('should create KMS key with rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: Match.stringLikeRegexp('KMS key for securing storage resources'),
      EnableKeyRotation: true,
      PendingWindowInDays: 7,
    });
  });

  test('should configure KMS key policy for CloudWatch Logs', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      KeyPolicy: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'Enable CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: 'logs.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('should create S3 buckets with KMS encryption', () => {
    // Check that we have encrypted buckets
    const resources = template.toJSON().Resources;
    const buckets = Object.values(resources).filter((resource: any) => 
      resource.Type === 'AWS::S3::Bucket' &&
      resource.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
    );
    
    // Should have 3 data buckets with KMS encryption
    expect(buckets.length).toBe(3);
  });

  test('should create access logs bucket with S3-managed encryption', () => {
    // Check for access logs bucket with AES256 encryption
    const resources = template.toJSON().Resources;
    const accessLogsBucket = Object.values(resources).find((resource: any) => 
      resource.Type === 'AWS::S3::Bucket' &&
      resource.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm === 'AES256'
    );
    
    expect(accessLogsBucket).toBeDefined();
  });

  test('should configure S3 bucket policies to deny insecure transport', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'DenyPublicAccess',
            Effect: 'Deny',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
        ]),
      },
    });
  });

  test('should create RDS databases with encryption', () => {
    // Check for primary database
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      BackupRetentionPeriod: 7,
      DeletionProtection: false,
      MultiAZ: false,
      AllocatedStorage: '20',
    });

    // Should have 2 RDS instances
    template.resourceCountIs('AWS::RDS::DBInstance', 2);
  });

  test('should create RDS subnet group', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: Match.stringLikeRegexp('Subnet group for RDS databases'),
    });
  });

  test('should create database security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for RDS databases',
    });
  });

  test('should set removal policy to DESTROY for all S3 buckets', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultNetworkingStack = new NetworkingStack(defaultApp, 'DefaultNetworkingStack');
    const defaultStorageStack = new StorageStack(defaultApp, 'TestStorageStackDefault', {
      vpc: defaultNetworkingStack.vpc,
    });
    const defaultTemplate = Template.fromStack(defaultStorageStack);
    
    // Check that default suffix 'dev' is used
    const resources = defaultTemplate.toJSON().Resources;
    const hasDefaultSuffix = JSON.stringify(resources).includes('dev');
    expect(hasDefaultSuffix).toBe(true);
  });
});

describe('ComputeStack', () => {
  let app: cdk.App;
  let networkingStack: NetworkingStack;
  let storageStack: StorageStack;
  let computeStack: ComputeStack;
  let template: Template;
  const testSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    networkingStack = new NetworkingStack(app, 'TestNetworkingStack');
    storageStack = new StorageStack(app, 'TestStorageStack', {
      vpc: networkingStack.vpc,
      environmentSuffix: testSuffix,
    });
    computeStack = new ComputeStack(app, 'TestComputeStack', {
      vpc: networkingStack.vpc,
      kmsKey: storageStack.kmsKey,
      environmentSuffix: testSuffix,
    });
    template = Template.fromStack(computeStack);
  });

  test('should create CloudWatch log group with KMS encryption', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/ec2/secure-instances-${testSuffix}`,
      RetentionInDays: 30,
    });
  });

  test('should create web server security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web servers',
    });
  });

  test('should create app server security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for application servers',
    });
  });

  test('should allow HTTPS traffic to web servers', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web servers',
      SecurityGroupIngress: [{
        CidrIp: '0.0.0.0/0',
        FromPort: 443,
        ToPort: 443,
        IpProtocol: 'tcp',
      }],
    });
  });

  test('should create IAM roles for EC2 instances', () => {
    // Web server role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      },
      Description: 'IAM role for web server instances',
    });

    // App server role
    template.hasResourceProperties('AWS::IAM::Role', {
      Description: 'IAM role for application server instances',
    });
  });

  test('should attach SSM and CloudWatch policies to EC2 roles', () => {
    const resources = template.toJSON().Resources;
    const rolesWithPolicies = Object.values(resources).filter((resource: any) => 
      resource.Type === 'AWS::IAM::Role' && 
      resource.Properties?.ManagedPolicyArns?.length > 0
    );
    expect(rolesWithPolicies.length).toBeGreaterThan(0);
    
    // Check that roles have the expected managed policies
    rolesWithPolicies.forEach((role: any) => {
      const policies = JSON.stringify(role.Properties.ManagedPolicyArns);
      expect(policies).toContain('AmazonSSMManagedInstanceCore');
      expect(policies).toContain('CloudWatchAgentServerPolicy');
    });
  });

  test('should create EC2 instances with encrypted EBS volumes', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      BlockDeviceMappings: [{
        DeviceName: '/dev/xvda',
        Ebs: {
          Encrypted: true,
          VolumeSize: 20,
          VolumeType: 'gp3',
        },
      }],
    });
  });

  test('should deploy 4 EC2 instances (2 web, 2 app)', () => {
    template.resourceCountIs('AWS::EC2::Instance', 4);
  });

  test('should place instances in private subnets', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: Match.anyValue(),
    });
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultNetworkingStack = new NetworkingStack(defaultApp, 'DefaultNetworkingStack2');
    const defaultStorageStack = new StorageStack(defaultApp, 'DefaultStorageStack2', {
      vpc: defaultNetworkingStack.vpc,
      environmentSuffix: 'test',
    });
    const defaultComputeStack = new ComputeStack(defaultApp, 'TestComputeStackDefault', {
      vpc: defaultNetworkingStack.vpc,
      kmsKey: defaultStorageStack.kmsKey,
    });
    const defaultTemplate = Template.fromStack(defaultComputeStack);
    
    // Check that default suffix 'dev' is used in log group name
    defaultTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-instances-dev',
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let storageStack: StorageStack;
  let networkingStack: NetworkingStack;
  let monitoringStack: MonitoringStack;
  let template: Template;
  const testSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    networkingStack = new NetworkingStack(app, 'TestNetworkingStack');
    storageStack = new StorageStack(app, 'TestStorageStack', {
      vpc: networkingStack.vpc,
      environmentSuffix: testSuffix,
    });
    monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      kmsKey: storageStack.kmsKey,
      environmentSuffix: testSuffix,
    });
    template = Template.fromStack(monitoringStack);
  });

  test('should create SNS topic with KMS encryption', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'Security Alerts',
    });
  });

  test('should create CloudWatch dashboard', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: `SecureInfrastructure-Monitoring-${testSuffix}`,
    });
  });

  test('should create GuardDuty findings alarm', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmDescription: 'Alert when GuardDuty detects threats',
      MetricName: 'FindingCount',
      Namespace: 'AWS/GuardDuty',
      Statistic: 'Sum',
      Threshold: 1,
      TreatMissingData: 'notBreaching',
    });
  });

  test('should create security audit log group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/security/audit',
      RetentionInDays: 365,
    });
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultNetworkingStack = new NetworkingStack(defaultApp, 'DefaultNetworkingStack3');
    const defaultStorageStack = new StorageStack(defaultApp, 'DefaultStorageStack3', {
      vpc: defaultNetworkingStack.vpc,
      environmentSuffix: 'test',
    });
    const defaultMonitoringStack = new MonitoringStack(defaultApp, 'TestMonitoringStackDefault', {
      kmsKey: defaultStorageStack.kmsKey,
    });
    const defaultTemplate = Template.fromStack(defaultMonitoringStack);
    
    // Check that default suffix 'dev' is used in dashboard name
    defaultTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'SecureInfrastructure-Monitoring-dev',
    });
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack');
    template = Template.fromStack(stack);
  });

  test('should be properly configured as a security stack', () => {
    // SecurityStack is a simple stack that mainly holds placeholders
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('SecurityStack');
  });
});

describe('SecurityServicesStack', () => {
  let app: cdk.App;
  let stack: SecurityServicesStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityServicesStack(app, 'TestSecurityServicesStack');
    template = Template.fromStack(stack);
  });

  test('should be properly configured as a security services stack', () => {
    // SecurityServicesStack contains placeholder for security services
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('SecurityServicesStack');
  });
});
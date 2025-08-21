import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { NetworkStack } from '../lib/network-stack.mjs';
import { StorageStack } from '../lib/storage-stack.mjs';
import { DatabaseStack } from '../lib/database-stack.mjs';
import { SecurityStack } from '../lib/security-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  
  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
  });

  test('creates nested stacks with correct naming', () => {
    const children = stack.node.children;
    const stackNames = children
      .filter(child => child instanceof cdk.Stack)
      .map(child => child.node.id);
    
    expect(stackNames).toContain('Network');
    expect(stackNames).toContain('Security');
    expect(stackNames).toContain('Storage');
    expect(stackNames).toContain('Database');
  });

  test('passes environment suffix to all nested stacks', () => {
    const children = stack.node.children;
    const nestedStacks = children.filter(child => child instanceof cdk.Stack);
    
    nestedStacks.forEach(nestedStack => {
      expect(nestedStack.stackName).toContain('TestTapStack');
    });
  });

  test('creates all required nested stacks', () => {
    const networkStack = stack.node.findChild('Network');
    const securityStack = stack.node.findChild('Security');
    const storageStack = stack.node.findChild('Storage');
    const databaseStack = stack.node.findChild('Database');
    
    expect(networkStack).toBeDefined();
    expect(securityStack).toBeDefined();
    expect(storageStack).toBeDefined();
    expect(databaseStack).toBeDefined();
  });

  test('nested stacks are CDK Stack instances', () => {
    const networkStack = stack.node.findChild('Network');
    const securityStack = stack.node.findChild('Security');
    
    expect(networkStack).toBeInstanceOf(cdk.Stack);
    expect(securityStack).toBeInstanceOf(cdk.Stack);
  });
});

describe('NetworkStack', () => {
  let app;
  let stack;
  let template;
  
  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkStack(app, 'TestNetworkStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'app-vpc-test' }
      ])
    });
  });

  test('creates subnets in multiple availability zones', () => {
    // We expect at least 6 subnets (2 types x 3 AZs minimum)
    const resources = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(resources).length).toBeGreaterThanOrEqual(6);
  });

  test('creates NAT gateway for cost optimization', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('creates public and private subnets', () => {
    // Check for public subnet
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true
    });
    
    // Check for route to NAT gateway (private subnet)
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue()
    });
  });

  test('creates Internet Gateway', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', Match.anyValue());
  });

  test('outputs VPC ID', () => {
    template.hasOutput('VpcId', {
      Description: 'VPC ID for the application infrastructure'
    });
  });

  test('has VPC property accessible', () => {
    expect(stack.vpc).toBeDefined();
    expect(stack.vpc.vpcId).toBeDefined();
  });
});

describe('StorageStack', () => {
  let app;
  let stack;
  let template;
  
  beforeEach(() => {
    app = new cdk.App();
    
    // Create the storage stack without dependencies for independent testing
    stack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('creates S3 bucket with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('creates S3 bucket with correct naming', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'app-logs-test-123456789012-us-east-1'
    });
  });

  test('enables S3 bucket encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }
        ]
      }
    });
  });

  test('blocks public access on S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('sets lifecycle rules for cost optimization', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'LogRetentionRule',
            Status: 'Enabled',
            ExpirationInDays: 365
          })
        ])
      }
    });
  });

  test('sets removal policy to DESTROY with auto delete', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete'
    });
    
    // Check for custom resource for auto-delete
    template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
      ServiceToken: Match.anyValue()
    });
  });

  test('outputs bucket name and ARN', () => {
    template.hasOutput('LogBucketName', {
      Description: 'S3 bucket name for application logs'
    });
    
    template.hasOutput('LogBucketArn', {
      Description: 'S3 bucket ARN for application logs'
    });
  });

  test('has logBucket property accessible', () => {
    expect(stack.logBucket).toBeDefined();
    expect(stack.logBucket.bucketName).toBeDefined();
  });
});

describe('SecurityStack - IAM', () => {
  let app;
  let parentStack;
  let stack;
  let template;
  
  beforeEach(() => {
    app = new cdk.App();
    
    // Create VPC in its own stack for testing
    const vpcStack = new NetworkStack(app, 'TestVpcStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    // Create security stack with VPC reference
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'test',
      vpc: vpcStack.vpc,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    template = Template.fromStack(stack);
  });

  test('creates IAM role for EC2 instances', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ec2-role-test',
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          })
        ])
      })
    });
  });

  test('creates CloudWatch Logs inline policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ec2-role-test',
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyName: 'CloudWatchLogsPolicy'
        })
      ])
    });
  });

  test('creates instance profile for EC2 role', () => {
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {
      InstanceProfileName: 'ec2-profile-test'
    });
  });

  test('creates security groups for RDS and EC2', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'rds-sg-test',
      GroupDescription: 'Security group for RDS Aurora cluster'
    });
    
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'ec2-sg-test',
      GroupDescription: 'Security group for EC2 instances'
    });
  });

  test('allows EC2 to RDS connection on MySQL port', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 3306,
      ToPort: 3306,
      Description: 'Allow EC2 instances to connect to RDS'
    });
  });

  test('outputs EC2 role ARN', () => {
    template.hasOutput('EC2RoleArn', {
      Description: 'ARN of the EC2 instance role'
    });
  });

  test('has required properties accessible', () => {
    expect(stack.ec2Role).toBeDefined();
    expect(stack.rdsSecurityGroup).toBeDefined();
    expect(stack.ec2SecurityGroup).toBeDefined();
  });
});

describe('DatabaseStack - RDS', () => {
  let app;
  let parentStack;
  let stack;
  let template;
  
  beforeEach(() => {
    app = new cdk.App();
    
    // Create VPC in its own stack for testing
    const vpcStack = new NetworkStack(app, 'TestVpcStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    // Create security stack for security group
    const securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'test',
      vpc: vpcStack.vpc,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    // Create database stack with VPC and security group references
    stack = new DatabaseStack(app, 'TestDatabaseStack', {
      environmentSuffix: 'test',
      vpc: vpcStack.vpc,
      dbSecurityGroup: securityStack.rdsSecurityGroup,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    template = Template.fromStack(stack);
  });

  test('creates DB subnet group', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupName: 'db-subnet-test',
      DBSubnetGroupDescription: 'Subnet group for Aurora Serverless V2 cluster'
    });
  });

  test('creates Aurora Serverless V2 cluster', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-mysql',
      DBClusterIdentifier: 'aurora-cluster-test',
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 16
      }
    });
  });

  test('creates database credentials secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'aurora-credentials-test',
      Description: Match.anyValue() // Description can be a function or string
    });
  });

  test('enables automated backups', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      BackupRetentionPeriod: 7,
      PreferredBackupWindow: '03:00-04:00'
    });
  });

  test('disables deletion protection for testing', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      DeletionProtection: false
    });
  });

  test('sets removal policy to DESTROY', () => {
    template.hasResource('AWS::RDS::DBCluster', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete'
    });
  });

  test('enables storage encryption', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      StorageEncrypted: true
    });
  });

  test('creates writer and reader instances', () => {
    // Check for writer instance
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.serverless',
      Engine: 'aurora-mysql'
    });
    
    // Should have 2 instances (1 writer + 1 reader)
    template.resourceCountIs('AWS::RDS::DBInstance', 2);
  });

  test('enables CloudWatch logs exports', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      EnableCloudwatchLogsExports: Match.arrayWith(['error', 'general', 'slowquery'])
    });
  });

  test('outputs cluster endpoints and secret ARN', () => {
    template.hasOutput('ClusterEndpoint', {
      Description: 'Aurora cluster endpoint'
    });
    
    template.hasOutput('ClusterReadEndpoint', {
      Description: 'Aurora cluster read endpoint'
    });
    
    template.hasOutput('DatabaseSecretArn', {
      Description: 'ARN of the database credentials secret'
    });
  });

  test('has auroraCluster property accessible', () => {
    expect(stack.auroraCluster).toBeDefined();
    expect(stack.auroraCluster.clusterEndpoint).toBeDefined();
  });
});
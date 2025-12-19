import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SimplifiedStack } from '../lib/simplified-stack';

describe('SimplifiedStack Unit Tests', () => {
  let app: cdk.App;
  let stack: SimplifiedStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SimplifiedStack(app, 'TestStack', {
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new SimplifiedStack(testApp, 'TestStackWithSuffix', {
        environmentSuffix: 'provided-suffix',
        env: {
          account: '123456789012',
          region: 'ap-southeast-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'healthcare-provided-suffix',
      });
    });

    test('should use context environmentSuffix when not provided in props', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix',
        },
      });
      const testStack = new SimplifiedStack(testApp, 'TestStackWithContext', {
        env: {
          account: '123456789012',
          region: 'ap-southeast-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'healthcare-context-suffix',
      });
    });

    test('should use default dev suffix when no suffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new SimplifiedStack(testApp, 'TestStackDefault', {
        env: {
          account: '123456789012',
          region: 'ap-southeast-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'healthcare-dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'healthcare-vpc-test123' }),
        ]),
      });
    });

    test('should create 3 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-name', Value: 'Public' }),
        ]),
      });
    });

    test('should create 3 private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-name', Value: 'Private' }),
        ]),
      });
    });

    test('should create 1 NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create an Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should attach IGW to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: { Ref: Match.anyValue() },
        InternetGatewayId: { Ref: Match.anyValue() },
      });
    });
  });

  describe('Security and Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/healthcare-key-test123',
      });
    });

    test('should create Secrets Manager secret for database', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'healthcare-db-test123',
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          GenerateStringKey: 'password',
          ExcludePunctuation: true,
          IncludeSpace: false,
          PasswordLength: 32,
        },
      });
    });
  });

  describe('Database Configuration', () => {
    test('should create RDS Aurora Serverless v2 cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.anyValue(),
        SubnetIds: Match.anyValue(),
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Database.*|RDS security group'),
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('should create database writer instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.serverless',
        DBClusterIdentifier: { Ref: Match.anyValue() },
        Engine: 'aurora-postgresql',
      });
    });
  });

  describe('EFS Configuration', () => {
    test('should create encrypted EFS file system', () => {
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
        KmsKeyId: {
          'Fn::GetAtt': [Match.anyValue(), 'Arn'],
        },
        PerformanceMode: 'generalPurpose',
      });
    });

    test('should create EFS mount targets for all private subnets', () => {
      template.resourceCountIs('AWS::EFS::MountTarget', 3);
    });

    test('should create EFS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*EFS.*|.*EfsSecurityGroup.*'),
        VpcId: { Ref: Match.anyValue() },
      });
    });
  });

  describe('ECS Configuration', () => {
    test('should create ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'healthcare-test123',
        ClusterSettings: [{
          Name: 'containerInsights',
          Value: 'enabled',
        }],
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should have task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          }],
        },
      });
    });

    test('should configure container with nginx image', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Image: 'nginx:alpine',
            Name: 'app',
            PortMappings: [{
              ContainerPort: 80,
              Protocol: 'tcp',
            }],
          }),
        ]),
      });
    });

    test('should configure EFS volume in task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Volumes: Match.arrayWith([
          Match.objectLike({
            Name: 'efs',
            EFSVolumeConfiguration: {
              FilesystemId: { Ref: Match.anyValue() },
            },
          }),
        ]),
      });
    });

    test('should mount EFS volume in container', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            MountPoints: [{
              ContainerPath: '/data',
              SourceVolume: 'efs',
              ReadOnly: false,
            }],
          }),
        ]),
      });
    });

    test('should create Fargate service with 2 desired tasks', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 2,
        TaskDefinition: { Ref: Match.anyValue() },
      });
    });

    test('should configure service with private subnets', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
          AwsvpcConfiguration: {
            Subnets: Match.anyValue(),
            SecurityGroups: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create ALB target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('should create ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [{
          Type: 'forward',
          TargetGroupArn: { Ref: Match.anyValue() },
        }],
      });
    });

    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*ALB.*'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
        ]),
      });
    });
  });

  describe('ElastiCache Configuration', () => {
    test('should create ElastiCache subnet group', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        Description: 'Cache subnet group',
        SubnetIds: Match.anyValue(),
      });
    });

    test('should create ElastiCache security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Cache.*'),
      });
    });

    test('should create Redis replication group', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        ReplicationGroupId: 'cache-test123',
        ReplicationGroupDescription: 'Session cache',
        Engine: 'redis',
        CacheNodeType: 'cache.t3.micro',
        NumCacheClusters: 1,
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: false,
        AutomaticFailoverEnabled: false,
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('should create CloudWatch log group for ECS tasks', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should configure CloudWatch logs in container definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            LogConfiguration: {
              LogDriver: 'awslogs',
              Options: {
                'awslogs-stream-prefix': 'healthcare',
                'awslogs-region': 'ap-southeast-1',
              },
            },
          }),
        ]),
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should grant task role access to database secret', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Resource: {
                Ref: Match.anyValue(),
              },
            }),
          ]),
        },
      });
    });

    test('should grant execution role access to ECR and logs', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output ALB endpoint', () => {
      template.hasOutput('ALBEndpoint', {
        Value: {
          'Fn::GetAtt': [Match.anyValue(), 'DNSName'],
        },
        Export: {
          Name: 'test123-alb-endpoint',
        },
      });
    });

    test('should output database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Value: {
          'Fn::GetAtt': [Match.anyValue(), 'Endpoint.Address'],
        },
        Export: {
          Name: 'test123-db-endpoint',
        },
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Value: {
          Ref: Match.anyValue(),
        },
        Export: {
          Name: 'test123-vpc-id',
        },
      });
    });

    test('should output EFS ID', () => {
      template.hasOutput('EFSId', {
        Value: {
          Ref: Match.anyValue(),
        },
        Export: {
          Name: 'test123-efs-id',
        },
      });
    });
  });

  describe('Removal Policies', () => {
    test('should set DESTROY removal policy on KMS key', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should set DESTROY removal policy on database', () => {
      template.hasResource('AWS::RDS::DBCluster', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should set DESTROY removal policy on EFS', () => {
      template.hasResource('AWS::EFS::FileSystem', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should encrypt database at rest', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        KmsKeyId: {
          'Fn::GetAtt': [Match.anyValue(), 'Arn'],
        },
      });
    });

    test('should encrypt EFS at rest', () => {
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
      });
    });

    test('should encrypt ElastiCache at rest', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
      });
    });

    test('should use KMS for Secrets Manager encryption', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        KmsKeyId: {
          'Fn::GetAtt': [Match.anyValue(), 'Arn'],
        },
      });
    });

    test('should have appropriate security group rules', () => {
      // Check that database security group exists
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Database.*|RDS security group'),
      });

      // Check that cache security group has proper ingress rule
      // The ingress rule is added directly to the security group, not as a separate resource
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*CacheSG.*|TestStack/CacheSG'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 6379,
            ToPort: 6379,
          }),
        ]),
      });
    });
  });

  describe('Resource Naming', () => {
    test('should include environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'healthcare-test123',
      });

      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        ReplicationGroupId: 'cache-test123',
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/healthcare-key-test123',
      });
    });
  });
});
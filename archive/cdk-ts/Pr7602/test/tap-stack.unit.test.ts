import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('creates ECS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });
    });

    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL',
      });
    });

    test('creates EFS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EFS',
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageType: 'gp3',
        StorageEncrypted: true,
        MultiAZ: false,
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
      });
    });

    test('database uses private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Database credentials for healthcare application',
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludePunctuation: true,
        }),
      });
    });

    test('creates rotation schedule for secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)',
        },
      });
    });
  });

  describe('EFS File System', () => {
    test('creates EFS file system', () => {
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
        PerformanceMode: 'generalPurpose',
      });
    });

    test('creates EFS access point', () => {
      template.hasResourceProperties('AWS::EFS::AccessPoint', {
        PosixUser: {
          Gid: '1000',
          Uid: '1000',
        },
        RootDirectory: Match.objectLike({
          Path: '/ecs-data',
          CreationInfo: {
            OwnerGid: '1000',
            OwnerUid: '1000',
            Permissions: '755',
          },
        }),
      });
    });
  });

  describe('ECS Cluster', () => {
    test('creates ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('creates Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
      });
    });

    test('task definition includes EFS volume', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Volumes: Match.arrayWith([
          Match.objectLike({
            Name: 'efs-storage',
            EFSVolumeConfiguration: Match.objectLike({
              TransitEncryption: 'ENABLED',
              AuthorizationConfig: Match.objectLike({
                IAM: 'ENABLED',
              }),
            }),
          }),
        ]),
      });
    });

    test('creates Fargate service in private subnets', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 2,
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: Match.objectLike({
            AssignPublicIp: 'DISABLED',
          }),
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 8080,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates log group for ECS', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('CodePipeline', () => {
    test('creates CodeCommit repository', () => {
      template.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryDescription: 'Healthcare application source code repository',
      });
    });

    test('creates S3 bucket for artifacts', () => {
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
      });
    });

    test('creates CodeBuild project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true,
          ComputeType: 'BUILD_GENERAL1_SMALL',
        }),
      });
    });

    test('creates CodePipeline', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('creates ECS task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('grants EFS permissions to task role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'elasticfilesystem:ClientMount',
                'elasticfilesystem:ClientWrite',
              ]),
            }),
          ]),
        }),
      });
    });

    test('grants Secrets Manager read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Resource Naming', () => {
    test('resources include environment suffix in names', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithNames = Object.values(resources).filter(
        (resource: any) =>
          resource.Properties &&
          (resource.Properties.ClusterName ||
            resource.Properties.LoadBalancerName ||
            resource.Properties.RepositoryName ||
            resource.Properties.PipelineName ||
            resource.Properties.FileSystemName ||
            resource.Properties.SecretName ||
            resource.Properties.TargetGroupName ||
            resource.Properties.ServiceName ||
            resource.Properties.ProjectName ||
            resource.Properties.BucketName ||
            resource.Properties.DBInstanceIdentifier ||
            resource.Properties.GroupName)
      );

      expect(resourcesWithNames.length).toBeGreaterThan(0);

      resourcesWithNames.forEach((resource: any) => {
        const nameProperty =
          resource.Properties.ClusterName ||
          resource.Properties.LoadBalancerName ||
          resource.Properties.RepositoryName ||
          resource.Properties.PipelineName ||
          resource.Properties.FileSystemName ||
          resource.Properties.SecretName ||
          resource.Properties.TargetGroupName ||
          resource.Properties.ServiceName ||
          resource.Properties.ProjectName ||
          resource.Properties.BucketName ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.GroupName;

        if (typeof nameProperty === 'string') {
          expect(nameProperty).toContain('test');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('exports load balancer DNS', () => {
      template.hasOutput('*', {
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('healthcare-alb-dns-test'),
        }),
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('*', {
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('healthcare-db-endpoint-test'),
        }),
      });
    });

    test('exports EFS file system ID', () => {
      template.hasOutput('*', {
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('healthcare-efs-id-test'),
        }),
      });
    });

    test('exports pipeline name', () => {
      template.hasOutput('*', {
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('healthcare-pipeline-name-test'),
        }),
      });
    });
  });

  describe('Destroyability', () => {
    test('RDS has deletion protection disabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('S3 bucket has removal policy DESTROY', () => {
      const resources = template.toJSON().Resources;
      const s3Buckets = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('no resources have RETAIN policy', () => {
      const resources = template.toJSON().Resources;
      const retainResources = Object.values(resources).filter(
        (resource: any) => resource.DeletionPolicy === 'Retain'
      );

      expect(retainResources).toHaveLength(0);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses environmentSuffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'ctx-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'healthcare-vpc-ctx-test',
          }),
        ]),
      });
    });

    test('uses default "dev" when neither props nor context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'healthcare-vpc-dev',
          }),
        ]),
      });
    });
  });
});

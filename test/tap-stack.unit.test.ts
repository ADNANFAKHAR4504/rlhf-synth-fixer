import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Mock VPC lookup to avoid actual AWS API calls during testing
    jest.spyOn(cdk.Fn, 'importValue').mockReturnValue('mocked-value');

    app = new cdk.App({
      context: {
        // Mock VPC lookup context to avoid actual AWS calls
        'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
          {
            vpcId: 'vpc-12345',
            availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
            publicSubnetIds: ['subnet-pub-1', 'subnet-pub-2', 'subnet-pub-3'],
            publicSubnetNames: [
              'Public Subnet 1',
              'Public Subnet 2',
              'Public Subnet 3',
            ],
            publicSubnetRouteTableIds: ['rt-pub-1', 'rt-pub-2', 'rt-pub-3'],
            privateSubnetIds: [
              'subnet-priv-1',
              'subnet-priv-2',
              'subnet-priv-3',
            ],
            privateSubnetNames: [
              'Private Subnet 1',
              'Private Subnet 2',
              'Private Subnet 3',
            ],
            privateSubnetRouteTableIds: ['rt-priv-1', 'rt-priv-2', 'rt-priv-3'],
          },
      },
    });

    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('KMS Key Configuration', () => {
    test('should create a KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting EBS volumes and RDS database',
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('should create a KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-${environmentSuffix}-key`,
        TargetKeyId: Match.anyValue(),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should create EC2 security group with ALB and SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
            SourceSecurityGroupId: Match.anyValue(),
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          }),
        ]),
      });
    });

    test('should create RDS security group with MySQL access from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupEgress: [],
        SecurityGroupIngress: [
          {
            FromPort: 3306,
            IpProtocol: 'tcp',
            ToPort: 3306,
            SourceSecurityGroupId: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('IAM Role for EC2', () => {
    test('should create EC2 role with proper managed policies', () => {
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
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        ],
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [Match.anyValue()],
      });
    });
  });

  describe('Launch Template', () => {
    test('should create launch template with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                KmsKeyId: Match.anyValue(),
                VolumeSize: 20,
                VolumeType: 'gp3',
              },
            },
          ],
          IamInstanceProfile: {
            Arn: Match.anyValue(),
          },
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          MetadataOptions: {
            HttpTokens: 'required',
          },
          SecurityGroupIds: [Match.anyValue()],
          UserData: Match.anyValue(),
        },
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-${environmentSuffix}-asg`,
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckGracePeriod: 300,
        HealthCheckType: 'ELB',
        LaunchTemplate: {
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        },
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('should create CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        AdjustmentType: 'ChangeInCapacity',
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'deletion_protection.enabled',
              Value: 'false',
            },
          ]),
          Name: `tap-${environmentSuffix}-alb`,
          Scheme: 'internet-facing',
          SecurityGroups: [Match.anyValue()],
          Subnets: Match.anyValue(),
          Type: 'application',
        }
      );
    });

    test('should create target group with health check configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: `tap-${environmentSuffix}-tg`,
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckEnabled: true,
          HealthCheckIntervalSeconds: 30,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          Matcher: {
            HttpCode: '200',
          },
          UnhealthyThresholdCount: 3,
          VpcId: Match.anyValue(),
        }
      );
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        DefaultActions: [
          {
            TargetGroupArn: Match.anyValue(),
            Type: 'forward',
          },
        ],
        LoadBalancerArn: Match.anyValue(),
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group`,
        SubnetIds: Match.anyValue(),
      });
    });

    test('should create RDS instance with Multi-AZ and encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        DBInstanceIdentifier: `tap-${environmentSuffix}-database`,
        DBName: 'tapdb',
        DBSubnetGroupName: Match.anyValue(),
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        MultiAZ: true,
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
        DeletionProtection: false,
        AllocatedStorage: '20',
        StorageType: 'gp3',
        AutoMinorVersionUpgrade: true,
        EnablePerformanceInsights: true,
        PerformanceInsightsKMSKeyId: Match.anyValue(),
        VPCSecurityGroups: [Match.anyValue()],
        MasterUsername: 'admin',
        ManageMasterUserPassword: true,
        MasterUserSecret: {
          KmsKeyId: Match.anyValue(),
          SecretArn: Match.anyValue(),
        },
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create ALB response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-alb-response-time`,
        AlarmDescription: 'ALB target response time too high',
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Statistic: 'Average',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create ASG CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-high-cpu`,
        AlarmDescription: 'High CPU utilization detected',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/AutoScaling',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create RDS CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-rds-cpu`,
        AlarmDescription: 'RDS high CPU utilization',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create RDS database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-db-connections`,
        AlarmDescription: 'High database connection count',
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create LoadBalancerDNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
        Export: {
          Name: `tap-${environmentSuffix}-alb-dns`,
        },
      });
    });

    test('should create DatabaseEndpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
        Export: {
          Name: `tap-${environmentSuffix}-db-endpoint`,
        },
      });
    });

    test('should create KMSKeyId output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `tap-${environmentSuffix}-kms-key-id`,
        },
      });
    });

    test('should create AutoScalingGroupName output', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
        Export: {
          Name: `tap-${environmentSuffix}-asg-name`,
        },
      });
    });
  });

  describe('Resource Counting', () => {
    test('should create expected number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should create expected number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });

    test('should create one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should create one RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should create one Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should create one Auto Scaling Group', () => {
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    });
  });

  describe('Naming Convention', () => {
    test('should follow project-stage-resource naming convention', () => {
      // Test that resource names follow the expected pattern
      const resources = template.toJSON().Resources;

      // Check KMS Key alias follows naming convention
      const kmsAliases = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::KMS::Alias'
      );
      expect(kmsAliases).toHaveLength(1);
      expect((kmsAliases[0] as any).Properties.AliasName).toBe(
        `alias/tap-${environmentSuffix}-key`
      );

      // Check ALB name follows naming convention
      const loadBalancers = Object.values(resources).filter(
        (resource: any) =>
          resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(loadBalancers).toHaveLength(1);
      expect((loadBalancers[0] as any).Properties.Name).toBe(
        `tap-${environmentSuffix}-alb`
      );

      // Check ASG name follows naming convention
      const asgs = Object.values(resources).filter(
        (resource: any) =>
          resource.Type === 'AWS::AutoScaling::AutoScalingGroup'
      );
      expect(asgs).toHaveLength(1);
      expect((asgs[0] as any).Properties.AutoScalingGroupName).toBe(
        `tap-${environmentSuffix}-asg`
      );
    });
  });

  describe('Stack Tags', () => {
    test('should apply proper tags to stack resources', () => {
      const stackTags = template.toJSON().Tags;
      expect(stackTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Project', Value: 'tap' }),
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        ])
      );
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const customStack = new TapStack(app, 'CustomTapStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-prod-key',
      });
    });

    test('should use context environment suffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
          // VPC lookup context
          'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
            {
              vpcId: 'vpc-12345',
              availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
              publicSubnetIds: ['subnet-pub-1', 'subnet-pub-2', 'subnet-pub-3'],
              publicSubnetNames: [
                'Public Subnet 1',
                'Public Subnet 2',
                'Public Subnet 3',
              ],
              publicSubnetRouteTableIds: ['rt-pub-1', 'rt-pub-2', 'rt-pub-3'],
              privateSubnetIds: [
                'subnet-priv-1',
                'subnet-priv-2',
                'subnet-priv-3',
              ],
              privateSubnetNames: [
                'Private Subnet 1',
                'Private Subnet 2',
                'Private Subnet 3',
              ],
              privateSubnetRouteTableIds: [
                'rt-priv-1',
                'rt-priv-2',
                'rt-priv-3',
              ],
            },
        },
      });

      const contextStack = new TapStack(contextApp, 'ContextTapStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-staging-key',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enable IMDSv2 on launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });

    test('should encrypt EBS volumes with KMS', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                KmsKeyId: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('should encrypt RDS storage with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should enable RDS backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
      });
    });
  });
});

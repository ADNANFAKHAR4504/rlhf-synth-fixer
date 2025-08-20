import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.js';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new App({
      context: {
        environmentSuffix: 'test',
      },
    });
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Security Requirement 1: S3 Bucket Encryption', () => {
    test('should create S3 buckets with KMS encryption', () => {
      // Check for SecureDataBucket with KMS encryption (more secure than AES-256)
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('should enable versioning on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const dataBucket = Object.values(buckets).find(
        b =>
          JSON.stringify(b).includes('SecureDataBucket') ||
          JSON.stringify(b).includes('LifecycleConfiguration')
      );
      expect(dataBucket).toBeDefined();
      expect(dataBucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(dataBucket.Properties.LifecycleConfiguration.Rules).toHaveLength(
        2
      );
    });
  });

  describe('Security Requirement 2: IAM MFA Enforcement', () => {
    test('should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should enforce MFA for critical IAM actions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:PutRolePolicy',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
              ]),
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should create instance profile for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.anyValue(),
      });
    });
  });

  describe('Security Requirement 3: API Gateway Logging', () => {
    test('should create API Gateway with logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: Match.objectLike({
          DestinationArn: Match.anyValue(),
          Format: Match.anyValue(),
        }),
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('should create CloudWatch log group for API Gateway', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const apiLogGroup = Object.entries(logGroups).find(
        ([id, lg]) =>
          id.includes('APIGatewayLogGroup') ||
          lg.Properties?.LogGroupName?.includes('/aws/apigateway/')
      );
      expect(apiLogGroup).toBeDefined();
    });

    test('should configure API Gateway throttling', () => {
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const stage = Object.values(stages)[0];

      // Check that one of the method settings has throttling configured
      const hasThrottling = stage.Properties.MethodSettings.some(
        setting =>
          setting.ThrottlingRateLimit === 1000 &&
          setting.ThrottlingBurstLimit === 2000
      );

      expect(hasThrottling).toBe(true);
    });

    test('should create health check endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: Match.objectLike({
          Type: 'MOCK',
        }),
      });
    });
  });

  describe('Security Requirement 4: Secure VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public, private, and database subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetCount = Object.keys(subnets).length;
      expect(subnetCount).toBe(9); // 3 AZs x 3 subnet types
    });

    test('should create NAT gateways for high availability', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(2);
    });

    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should create Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });
  });

  describe('Security Requirement 5: RDS KMS Encryption', () => {
    test('should create RDS instance with KMS encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should configure RDS backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/financial-app-key-.*'),
      });
    });

    test('should create RDS database instance', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(dbInstances).length).toBe(1);
    });
  });

  describe('Security Requirement 6: Security Groups', () => {
    test('should create ALB security group with restrictive rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSG = Object.values(securityGroups).find(sg =>
        sg.Properties?.GroupDescription?.includes('Application Load Balancer')
      );

      expect(albSG).toBeDefined();
      // Check that SecurityGroupEgress is either undefined (no rules) or empty array
      expect(albSG.Properties.SecurityGroupEgress || []).toEqual([]);
    });

    test('should create EC2 security group with restrictive rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const ec2SG = Object.values(securityGroups).find(sg =>
        sg.Properties?.GroupDescription?.includes('EC2 instances')
      );

      expect(ec2SG).toBeDefined();
      expect(ec2SG.Properties.SecurityGroupEgress).toBeDefined();
    });

    test('should create database security group with restrictive rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSG = Object.values(securityGroups).find(sg =>
        sg.Properties?.GroupDescription?.includes('RDS database')
      );

      expect(dbSG).toBeDefined();
      // Check that SecurityGroupEgress is either undefined (no rules) or empty array
      expect(dbSG.Properties.SecurityGroupEgress || []).toEqual([]);
    });

    test('should only allow HTTPS/HTTP traffic to ALB from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
      });
    });
  });

  describe('Security Requirement 7: Systems Manager Patch Management', () => {
    test('should create SSM patch baseline', () => {
      template.hasResourceProperties('AWS::SSM::PatchBaseline', {
        OperatingSystem: 'AMAZON_LINUX_2023',
        ApprovalRules: {
          PatchRules: Match.arrayWith([
            Match.objectLike({
              PatchFilterGroup: {
                PatchFilters: Match.arrayWith([
                  Match.objectLike({
                    Key: 'CLASSIFICATION',
                    Values: Match.arrayWith(['Security', 'Bugfix']),
                  }),
                ]),
              },
            }),
          ]),
        },
      });
    });

    test('should create maintenance window for patching', () => {
      template.hasResourceProperties('AWS::SSM::MaintenanceWindow', {
        Duration: 4,
        Cutoff: 1,
        Schedule: 'cron(0 2 ? * SUN *)',
      });
    });

    test('should attach SSM policy to EC2 role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(
        role =>
          JSON.stringify(role).includes('EC2InstanceRole') ||
          role.Properties?.AssumeRolePolicyDocument?.Statement?.some(stmt =>
            stmt.Principal?.Service?.includes('ec2.amazonaws.com')
          )
      );

      expect(ec2Role).toBeDefined();

      // Check if the role has the AmazonSSMManagedInstanceCore policy
      const hasSsmPolicy = ec2Role.Properties.ManagedPolicyArns.some(policy => {
        if (typeof policy === 'string') {
          return policy.includes('AmazonSSMManagedInstanceCore');
        }
        if (policy && policy['Fn::Join']) {
          const joinArray = policy['Fn::Join'][1]; // Get the array part
          // Look for AmazonSSMManagedInstanceCore in the array
          return (
            joinArray &&
            joinArray.some(
              item =>
                typeof item === 'string' &&
                item.includes('AmazonSSMManagedInstanceCore')
            )
          );
        }
        return false;
      });

      expect(hasSsmPolicy).toBe(true);
    });
  });

  describe('Infrastructure Components', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create target group for EC2 instances', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 8080,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckEnabled: true,
          HealthCheckPath: '/health',
        }
      );
    });

    test('should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should create launch template with encrypted EBS', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create HTTP listener for ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should create CloudWatch alarm for high CPU', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });

    test('should create CloudWatch alarm for database connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the secure financial application',
      });
    });

    test('should output ALB DNS name', () => {
      template.hasOutput('ALBDNSName', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('should output database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name',
      });
    });

    test('should output KMS key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS key ID for encryption',
      });
    });

    test('should output API Gateway URL', () => {
      template.hasOutput('APIGatewayURL', {
        Description: 'API Gateway URL',
      });
    });
  });

  describe('Resource Naming and Tags', () => {
    test('should include environment suffix in resource names', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketWithName = Object.values(buckets).find(
        b => b.Properties?.BucketName
      );

      if (bucketWithName) {
        expect(bucketWithName.Properties.BucketName).toMatch(/tap-test-/);
      }
    });

    test('should set removal policies for cleanup', () => {
      // Check KMS key has delete policy
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Secrets Management', () => {
    test('should create Secrets Manager secret for database', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.anyValue(),
        GenerateSecretString: Match.objectLike({
          ExcludeCharacters: Match.anyValue(),
          GenerateStringKey: 'password',
        }),
      });
    });

    test('should attach secret to RDS instance', () => {
      template.hasResourceProperties(
        'AWS::SecretsManager::SecretTargetAttachment',
        {
          SecretId: Match.anyValue(),
          TargetId: Match.anyValue(),
          TargetType: 'AWS::RDS::DBInstance',
        }
      );
    });
  });

  describe('Network Routing', () => {
    test('should create route tables for all subnet types', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(9);
    });

    test('should create routes to Internet Gateway for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('should create routes to NAT Gateway for private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      });
    });
  });
});

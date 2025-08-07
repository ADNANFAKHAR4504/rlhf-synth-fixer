import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MainStack } from '../lib/main-stack';

const environmentSuffix = 'test';

describe('MainStack Unit Tests', () => {
  let app: cdk.App;
  let stack: MainStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: environmentSuffix,
      },
    });
    stack = new MainStack(app, `TapStack-${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('Stack uses default environmentSuffix when not provided in context', () => {
      const appWithoutContext = new cdk.App();
      const stackWithDefault = new MainStack(appWithoutContext, 'TapStack-default', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const templateWithDefault = Template.fromStack(stackWithDefault);
      
      // Check that resources are created with 'dev' as default suffix
      templateWithDefault.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-dev-logs-123456789012-us-west-2`,
      });
    });
  });

  describe('Security Layer', () => {
    test('KMS Key is created with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting all data at rest',
        EnableKeyRotation: true,
      });
    });

    test('KMS Key has proper policy for CloudWatch Logs', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable CloudWatch Logs',
              Principal: Match.objectLike({
                Service: Match.anyValue(),
              }),
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*',
              ]),
            }),
          ]),
        }),
      });
    });

    test('VPC is created with multi-AZ configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct number of subnets', () => {
      // 2 public, 2 private, 2 database subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('S3 buckets are created with encryption', () => {
      // Log bucket with KMS encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-${environmentSuffix}-logs-123456789012-us-west-2`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });

      // ALB log bucket with S3 managed encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-${environmentSuffix}-alb-logs-123456789012-us-west-2`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('CloudWatch Log Group is created with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/application/secure-web-app-${environmentSuffix}`,
        RetentionInDays: 365,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('Secrets Manager secret is created for database', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-${environmentSuffix}-db-secret`,
        Description: 'RDS Database Credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: JSON.stringify({ username: 'admin' }),
          GenerateStringKey: 'password',
          PasswordLength: 32,
        }),
      });
    });

    test('Security groups are created with restricted access', () => {
      // ALB Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });

      // App Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application instances',
      });

      // DB Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('IAM Role for EC2 has minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'IAM role for EC2 instances with minimal permissions',
      });
    });
  });

  describe('Compute Layer', () => {
    test('Launch Template is created with encryption', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
              }),
            }),
          ]),
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required', // IMDSv2
          }),
        }),
      });
    });

    test('Auto Scaling Group is configured for high availability', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('Application Load Balancer is created', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: `tap-${environmentSuffix}-alb`,
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('Target Group is configured with health checks', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: `tap-${environmentSuffix}-tg`,
          Port: 8080,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/health',
          HealthCheckProtocol: 'HTTP',
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }
      );
    });

    test('HTTP Listener is created on port 80', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 80,
          Protocol: 'HTTP',
        }
      );
    });
  });

  describe('Database Layer', () => {
    test('RDS Subnet Group is created', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('RDS Parameter Group is created with security parameters', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Family: 'mysql8.0',
        Parameters: {
          innodb_file_per_table: '1',
          innodb_flush_log_at_trx_commit: '1',
          log_bin_trust_function_creators: '1',
        },
      });
    });

    test('RDS Database is configured with encryption and Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-${environmentSuffix}-db`,
        Engine: 'mysql',
        EngineVersion: Match.anyValue(),
        DBInstanceClass: 'db.t3.small',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 30,
        DeletionProtection: false,
        EnablePerformanceInsights: false,
      });
    });
  });

  describe('WAF Layer', () => {
    test('WAF WebACL is created with managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `SecureWebAppAcl-${environmentSuffix}`,
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            }),
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            }),
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
            Statement: Match.objectLike({
              RateBasedStatement: {
                Limit: 10000,
                AggregateKeyType: 'IP',
              },
            }),
          }),
        ]),
      });
    });

    test('WAF is associated with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('All required outputs are present', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('LoadBalancerDNS');
      expect(outputs).toHaveProperty('VPCId');
      expect(outputs).toHaveProperty('KMSKeyId');
      expect(outputs).toHaveProperty('DatabaseEndpoint');
      expect(outputs).toHaveProperty('S3BucketName');
      expect(outputs).toHaveProperty('WebAclArn');
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are properly tagged', () => {
      // Check that VPC has tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Compliance and Security', () => {
    test('No resources have public IPs except ALB', () => {
      // Ensure private subnets don't have MapPublicIpOnLaunch
      const template_json = template.toJSON();
      const subnets = Object.values(template_json.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      const privateSubnets = subnets.filter(
        (s: any) =>
          s.Properties.Tags &&
          s.Properties.Tags.some(
            (t: any) =>
              (t.Key === 'aws-cdk:subnet-type' && t.Value === 'Private') ||
              (t.Key === 'aws-cdk:subnet-type' && t.Value === 'Isolated')
          )
      );
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeFalsy();
      });
    });

    test('All data storage uses encryption', () => {
      // S3 buckets have encryption
      template.resourceCountIs('AWS::S3::Bucket', 2);
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });

      // RDS has encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // EBS volumes have encryption
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
              }),
            }),
          ]),
        }),
      });
    });

    test('Deletion protection is disabled for testing', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      Object.values(dbInstances).forEach((db: any) => {
        expect(db.Properties.DeletionProtection).toBe(false);
      });
    });

    test('Resources have removal policies for cleanup', () => {
      // Check S3 buckets have auto-delete enabled
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        const tags = bucket.Properties.Tags || [];
        const hasAutoDelete = tags.some(
          (t: any) => t.Key === 'aws-cdk:auto-delete-objects' && t.Value === 'true'
        );
        expect(hasAutoDelete).toBeTruthy();
      });
    });
  });
});
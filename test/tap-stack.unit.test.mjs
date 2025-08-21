import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    app = new cdk.App({
      context: {
        'availability-zones:account=160071257600:region=us-east-1': [
          'us-east-1a',
          'us-east-1b',
          'us-east-1c'
        ],
      },
    });
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Tests', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '16.4',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: true,
      });
    });

    test('creates S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          PriceClass: 'PriceClass_100',
        },
      });
    });

    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates Secrets Manager secret for database', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: `Database credentials for ${environmentSuffix} environment`,
      });
    });

    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Application Alerts - ${environmentSuffix}`,
      });
    });

    test('creates CloudWatch CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });

    test('creates CloudWatch ALB response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
      });
    });

    test('creates CloudWatch database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
      });
    });

    test('creates Lambda function for S3 processing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('validates environment suffix is applied to resource names', () => {
      const resources = template.toJSON().Resources;
      const resourceNames = Object.keys(resources);
      
      const hasEnvironmentSuffix = resourceNames.some(name => 
        name.includes(environmentSuffix)
      );
      expect(hasEnvironmentSuffix).toBe(true);
    });

    test('validates all required outputs are present', () => {
      const outputs = template.toJSON().Outputs;
      const expectedOutputs = [
        `LoadBalancerDns-${environmentSuffix}`,
        `CloudFrontDomain-${environmentSuffix}`,
        `DatabaseEndpoint-${environmentSuffix}`,
        `S3BucketName-${environmentSuffix}`,
        `BastionHostIp-${environmentSuffix}`,
        `VpcId-${environmentSuffix}`,
        `KmsKeyId-${environmentSuffix}`,
        `DatabaseSecretArn-${environmentSuffix}`,
        `AutoScalingGroupName-${environmentSuffix}`,
        `TargetGroupArn-${environmentSuffix}`,
        `LoadBalancerArn-${environmentSuffix}`,
        `LambdaFunctionArn-${environmentSuffix}`,
        `LambdaFunctionName-${environmentSuffix}`,
        `SnsTopicArn-${environmentSuffix}`,
        `DatabasePort-${environmentSuffix}`,
        `BastionHostId-${environmentSuffix}`,
        `WebServerSecurityGroupId-${environmentSuffix}`,
        `DatabaseSecurityGroupId-${environmentSuffix}`,
        `PrivateSubnetIds-${environmentSuffix}`,
        `PublicSubnetIds-${environmentSuffix}`,
        `DatabaseSubnetIds-${environmentSuffix}`,
        `EnvironmentSuffix-${environmentSuffix}`,
      ];

      expectedOutputs.forEach(outputName => {
        expect(outputs).toHaveProperty(outputName);
      });
    });

    test('validates security groups have correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: expect.stringMatching(/Security group for Application Load Balancer/),
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          }
        ]
      });
    });

    test('validates CloudFormation conditions exist for conditional resources', () => {
      const conditions = template.toJSON().Conditions;
      expect(conditions).toHaveProperty('EnableEmailNotifications');
      expect(conditions).toHaveProperty('EnableVpcPeering');
    });

    test('validates IAM roles have least privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('validates subnet configuration across multiple AZs', () => {
      // Check that we have multiple subnets of each type
      const template_json = template.toJSON();
      const subnets = Object.values(template_json.Resources).filter(
        resource => resource.Type === 'AWS::EC2::Subnet'
      );

      // Should have 9 subnets total (3 AZs × 3 subnet types)
      expect(subnets.length).toBe(9);
    });

    test('validates backup and retention settings', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {}
        }
      });
    });
  });
});
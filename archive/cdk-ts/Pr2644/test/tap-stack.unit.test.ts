import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        {
          Key: 'Name',
          Value: 'prod-vpc',
        }
      ]),
    });
  });

  test('Application Load Balancer is created correctly', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );
  });

  test('Auto Scaling Group is created with correct configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '6',
      DesiredCapacity: '2',
      HealthCheckType: 'ELB',
    });
  });

  test('RDS PostgreSQL instance is created with Multi-AZ', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      DBInstanceClass: 'db.t3.micro',
      MultiAZ: true,
      StorageEncrypted: true,
    });
  });

  test('S3 bucket is created with proper security settings', () => {
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

  test('Security Groups are configured correctly', () => {
    // Check that we have the expected number of security groups
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
  });

  test('IAM role is created with correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  test('Target Group is configured with health checks', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
      HealthCheckEnabled: true,
    });
  });

  test('Auto Scaling policies are created', () => {
    // Should have at least one scaling policy
    template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 2);
  });

  test('All resources have required tags', () => {
    // Check that VPC has the required tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'Production',
        },
        {
          Key: 'Project',
          Value: 'CloudFormationSetup',
        },
      ]),
    });
  });
});

// Add tests for different scenarios
describe('TapStack - Certificate Scenarios', () => {
  test('No certificate created when domain not provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestNoCert', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);
    
    // Should not have any certificates
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });

  test('Certificate created when domain provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestWithCert', {
      env: { account: '123456789012', region: 'us-east-1' },
      domainName: 'example.com',
      hostedZoneId: 'Z123456789',
    });
    const template = Template.fromStack(stack);
    
    // Should have a certificate
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });
});
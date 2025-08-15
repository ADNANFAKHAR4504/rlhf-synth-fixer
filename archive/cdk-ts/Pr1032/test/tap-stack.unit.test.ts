import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('Should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1); // Reduced to 1 due to AWS quota limits
    });

    test('Should create VPC Endpoints', () => {
      // S3 Gateway endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway'
      });
      // SSM Interface endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface'
      });
    });
  });

  describe('Compute Resources', () => {
    test('Should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('Should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '3',
      });
    });

    test('Should create Launch Template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.medium',
        }
      });
    });
  });

  describe('Database Resources', () => {
    test('Should create Aurora Serverless v2 cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 4,
        },
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('Should create writer and reader instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });
  });

  describe('Storage Resources', () => {
    test('Should create S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }
      });
    });

    test('Should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_100',
        }
      });
    });

    test('Should create EFS file system', () => {
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
        PerformanceMode: 'generalPurpose',
        ThroughputMode: 'bursting',
      });
    });
  });

  describe('Container Resources', () => {
    test('Should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [{
          Name: 'containerInsights',
          Value: 'enabled',
        }]
      });
    });
  });

  describe('Monitoring Resources', () => {
    test('Should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `CloudEnv-${environmentSuffix}`,
      });
    });

    test('Should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `cloudenv-alerts-${environmentSuffix}`,
      });
    });

    test('Should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('Should create Log Groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Security Resources', () => {
    test('Should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }]
        }
      });
    });

    test('Should create security groups', () => {
      // Check that we have at least the core security groups
      const resources = template.toJSON().Resources;
      const securityGroups = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
      );
      // We should have at least ALB, EC2, RDS, EFS, and SSM endpoint security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Configuration Resources', () => {
    test('Should create SSM Parameter for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/cloudenv/${environmentSuffix}/app-config`,
        Type: 'String',
      });
    });

    // Certificate creation commented out - requires valid domain
    // test('Should create ACM Certificate', () => {
    //   template.hasResourceProperties('AWS::CertificateManager::Certificate', {
    //     DomainName: `*.cloudenv-${environmentSuffix}.example.com`,
    //     ValidationMethod: 'DNS',
    //   });
    // });
  });

  describe('Stack Outputs', () => {
    test('Should have required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);
      
      expect(outputKeys).toEqual(
        expect.arrayContaining([
          expect.stringContaining('LoadBalancerDNS'),
          expect.stringContaining('DatabaseEndpoint'),
          expect.stringContaining('S3BucketName'),
          expect.stringContaining('CloudFrontDistribution'),
          expect.stringContaining('EFSFileSystemId'),
        ])
      );
    });
  });
});

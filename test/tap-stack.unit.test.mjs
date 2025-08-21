import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix,
        appName: 'service-discovery',
        vpcCidrBlock: '10.0.0.0/16',
        enableHttps: false,
        domainName: null,
      },
    });
    
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    
    // Get the ServiceDiscoveryStack template from the app
    const serviceDiscoveryStack = app.node.findChild(`ServiceDiscoveryStack${environmentSuffix}`);
    template = Template.fromStack(serviceDiscoveryStack);
  });

  describe('Service Discovery Stack Tests', () => {
    test('should create a VPC with correct configuration', () => {
      // Check VPC creation
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create ALB in private subnets', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internal',
      });
    });

    test('should create Service Discovery namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `service-discovery-${environmentSuffix}.local`,
      });
    });

    test('should create Parameter Store entries', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
      });
      
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'SecureString',
      });
    });

    test('should create IAM role for service instances', () => {
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

    test('should create S3 buckets for logging', () => {
      // VPC Flow Logs bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });
});
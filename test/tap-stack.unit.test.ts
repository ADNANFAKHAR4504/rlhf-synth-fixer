import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'test',
      },
    });
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC Created with correct configuration', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    template.resourceCountIs('AWS::EC2::NatGateway', 2);
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('Security Groups Created', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 5); // ALB, Frontend, Backend, DB, Lambda(Rotation)
  });

  test('Aurora Cluster Created', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      StorageEncrypted: true,
      DeletionProtection: false, // For test env
    });
    template.resourceCountIs('AWS::RDS::DBInstance', 2);
  });

  test('Secrets Manager Secret Created', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'tap-app-test-db-credentials',
    });
  });

  test('ALB Created', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );
    // Verify HTTP Listener exists and HTTPS/Certificates are absent (due to test env constraints)
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });

  test('ECS Cluster and Services Created', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::Service', 2); // Frontend, Backend
    template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
  });

  test('Fargate Task Definitions have correct container definitions', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'FrontendContainer',
          PortMappings: [{ ContainerPort: 80 }], // Sample container listens on port 80
        }),
      ]),
      Cpu: '512',
      Memory: '1024',
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'BackendContainer',
          PortMappings: [{ ContainerPort: 80 }], // Sample container listens on port 80
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'DB_HOST' }),
            Match.objectLike({ Name: 'DB_SECRET_ARN' }),
          ]),
        }),
      ]),
    });
  });

  test('CodeDeploy Groups Created', () => {
    template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 2);
    template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
      DeploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
      BlueGreenDeploymentConfiguration: Match.objectLike({
        DeploymentReadyOption: {
          ActionOnTimeout: 'STOP_DEPLOYMENT', // Valid when wait time is non-zero
          WaitTimeInMinutes: 1, // 1 minute wait time (cannot be 0 with STOP_DEPLOYMENT)
        },
        TerminateBlueInstancesOnDeploymentSuccess: {
          Action: 'TERMINATE',
          TerminationWaitTimeInMinutes: 0,
        },
      }),
    });
  });

  test('CloudFront Distribution Created', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Origins: Match.arrayWith([
          Match.objectLike({
            S3OriginConfig: {
              OriginAccessIdentity: Match.anyValue(),
            },
          }),
        ]),
        // ViewerCertificate is absent when using default CloudFront certificate in some CDK versions/defaults
      },
    });
  });

  test('WAF WebACL Created', () => {
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Scope: 'REGIONAL',
      DefaultAction: { Allow: {} },
      Rules: Match.arrayWith([
        Match.objectLike({ Name: 'RateLimit' }),
        Match.objectLike({ Name: 'SQLInjection' }),
      ]),
    });
  });

  test('CloudWatch Dashboard Created', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });

  test('DNS Records Skipped', () => {
    // DNS records are skipped in test environment (no domain available)
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
    template.resourceCountIs('AWS::Route53::HostedZone', 0);
  });
});

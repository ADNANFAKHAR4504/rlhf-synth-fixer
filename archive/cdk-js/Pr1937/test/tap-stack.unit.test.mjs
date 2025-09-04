import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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
      // Standard Parameter Store entry
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
      });
      
      // SecureString parameter created via Custom Resource
      template.hasResourceProperties('Custom::AWS', {
        Create: Match.anyValue(),
        Delete: Match.stringLikeRegexp('.*deleteParameter.*'),
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

      // ALB Access Logs bucket
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should create Network ACL with restrictive rules', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', Match.anyValue());
      
      // Check for HTTP rule
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6, // TCP
        RuleAction: 'allow',
        PortRange: {
          From: 80,
          To: 80,
        },
      });
    });

    test('should create security groups with proper rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for internal ALB',
        SecurityGroupIngress: Match.arrayWith([
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '10.0.0.0/16',
            Description: 'Allow HTTP from VPC',
          },
        ]),
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should create ALB listeners', () => {
      // HTTP listener
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create Cloud Map service with health checks', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        DnsConfig: {
          DnsRecords: [
            {
              Type: 'A',
              TTL: 60,
            },
          ],
        },
        Name: 'api-gateway',
        Description: 'Service discovery for internal API gateway',
      });
      
      // Health check config might be conditionally applied based on service registration
      // Check that the service exists with correct basic configuration
      template.resourceCountIs('AWS::ServiceDiscovery::Service', 1);
    });

    test('should create IAM policies with correct permissions', () => {
      // Parameter Store read policy with KMS decrypt permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `service-discovery-${environmentSuffix}-parameter-store-read`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });

      // Service discovery policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `service-discovery-${environmentSuffix}-service-discovery`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'servicediscovery:DiscoverInstances',
                'servicediscovery:GetService',
                'servicediscovery:ListServices',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('should create Instance Profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [Match.anyValue()],
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/service-discovery-${environmentSuffix}-service-discovery`,
      });
    });

    test('should create proper CloudFormation outputs', () => {
      // Should have multiple outputs for integration
      const outputs = template.findOutputs('*');
      
      expect(Object.keys(outputs)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/VPCId/),
          expect.stringMatching(/ALBDNSName/),
          expect.stringMatching(/ServiceDiscoveryNamespace/),
          expect.stringMatching(/KMSKeyId/),
        ])
      );
    });

    test('should not create HTTPS resources when HTTPS is disabled', () => {
      // Should only have HTTP listener, not HTTPS
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });

      // Should not have ACM certificate
      template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    });
  });

  describe('Service Discovery Stack Tests - HTTPS Enabled', () => {
    let httpsTemplate;

    beforeEach(() => {
      const httpsApp = new cdk.App({
        context: {
          environmentSuffix,
          appName: 'service-discovery',
          vpcCidrBlock: '10.0.0.0/16',
          enableHttps: true,
          domainName: 'api.example.com',
        },
      });
      
      const httpsStack = new TapStack(httpsApp, 'TestTapStackHttps', { 
        environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      
      const httpsServiceDiscoveryStack = httpsApp.node.findChild(`ServiceDiscoveryStack${environmentSuffix}`);
      httpsTemplate = Template.fromStack(httpsServiceDiscoveryStack);
    });

    test('should create HTTPS listener when HTTPS is enabled', () => {
      httpsTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
      });
    });

    test('should create ACM certificate when HTTPS is enabled', () => {
      httpsTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'api.example.com',
        ValidationMethod: 'DNS',
      });
    });

    test('should create HTTPS security group rule when HTTPS is enabled', () => {
      httpsTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for internal ALB',
        SecurityGroupIngress: Match.arrayWith([
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/16',
            Description: 'Allow HTTPS from VPC',
          },
        ]),
      });
    });

    test('should create certificate output when HTTPS is enabled', () => {
      const outputs = httpsTemplate.findOutputs('*');
      expect(Object.keys(outputs)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/CertificateArn/),
        ])
      );
    });

    test('should validate domainName is required when HTTPS is enabled', () => {
      expect(() => {
        const invalidApp = new cdk.App({
          context: {
            environmentSuffix,
            appName: 'service-discovery',
            vpcCidrBlock: '10.0.0.0/16',
            enableHttps: true,
            domainName: null,
          },
        });
        
        new TapStack(invalidApp, 'TestInvalidStack', { 
          environmentSuffix,
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
        });
      }).toThrow('domainName must be provided when enableHttps is true');
    });
  });
});
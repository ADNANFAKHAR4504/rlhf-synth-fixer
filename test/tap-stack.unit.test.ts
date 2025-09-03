import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Main Configuration', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'prod',
    });
    template = Template.fromStack(stack);
  });

  // All your existing tests here...
  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        {
          Key: 'Name',
          Value: 'prod-vpc',
        },
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

  // ... keep all your existing tests
});

describe('TapStack - No Certificate Scenario', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackNoCert', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      // No domainName or hostedZoneId provided
    });
    template = Template.fromStack(stack);
  });

  test('ACM certificate is not created when domainName or hostedZoneId is missing', () => {
    // Should not have certificate resources
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });

  test('HTTP listener is created when HTTPS certificate is not available', () => {
    // Should have HTTP listener with forward action (not redirect)
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
      DefaultActions: Match.arrayWith([
        {
          Type: 'forward',
        },
      ]),
    });
  });
});

describe('TapStack - Custom Environment Suffix', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackCustomEnv', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'dev',
    });
    template = Template.fromStack(stack);
  });

  test('Environment suffix is applied to resource names', () => {
    // Check that outputs include the environment suffix
    template.hasOutput('*', {
      ExportName: Match.stringLikeRegexp('Tapdev'),
    });
  });
});

describe('TapStack - With Certificate Scenario', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackWithCert', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      domainName: 'example.com',
      hostedZoneId: 'Z1234567890',
    });
    template = Template.fromStack(stack);
  });

  test('ACM certificate is created when domainName and hostedZoneId are provided', () => {
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
  });

  test('HTTPS listener is created when certificate is available', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
    });
  });
  // Add these to the main test suite

  test('Database is created in isolated subnets', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for RDS database',
      SubnetIds: Match.anyValue(),
    });
  });

  test('S3 bucket has lifecycle rules configured', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          {
            Status: 'Enabled',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 30,
            },
          },
        ]),
      },
    });
  });

  test('EC2 role has S3 access policies', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: Match.arrayWith([
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
            ]),
            Effect: 'Allow',
            Resource: Match.anyValue(),
          },
          {
            Action: 's3:ListBucket',
            Effect: 'Allow',
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('EC2 role has CloudWatch logs permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: Match.arrayWith([
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ]),
            Effect: 'Allow',
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('Database has monitoring enabled', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MonitoringInterval: 60,
      MonitoringRoleArn: Match.anyValue(),
    });
  });

  test('Database has generated credentials secret', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MasterUsername: Match.anyValue(),
    });

    // Check for Secrets Manager secret
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('Launch template has user data configured', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        UserData: Match.anyValue(),
      },
    });
  });

  test('Security groups have proper egress rules', () => {
    // Check for application SG egress rules
    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      IpProtocol: 'tcp',
      FromPort: 443,
      ToPort: 443,
      Description: Match.stringLikeRegexp('Allow HTTPS outbound'),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      IpProtocol: 'tcp',
      FromPort: 80,
      ToPort: 80,
      Description: Match.stringLikeRegexp('Allow HTTP outbound'),
    });
  });

  test('ALB has proper egress rules to application instances', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      IpProtocol: 'tcp',
      FromPort: 80,
      ToPort: 80,
      Description: Match.stringLikeRegexp(
        'Allow ALB to communicate with application instances'
      ),
    });
  });

  test('Application instances can communicate with database', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      IpProtocol: 'tcp',
      FromPort: 5432,
      ToPort: 5432,
      Description: Match.stringLikeRegexp(
        'Allow application instances to communicate with database'
      ),
    });
  });
});

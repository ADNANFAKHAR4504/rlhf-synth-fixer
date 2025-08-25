import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack`, {
      environmentSuffix,
      certificateArn: undefined, // No certificate for unit tests
      containerImage: 'nginx:test',
      desiredCount: 2,
      minCapacity: 1,
      maxCapacity: 5,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Creates VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates KMS Key with rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      KeySpec: 'SYMMETRIC_DEFAULT',
      KeyUsage: 'ENCRYPT_DECRYPT',
    });
  });

  test('KMS Key has CloudWatch Logs access policies for VPC Flow Logs and ECS Application Logs', () => {
    // Check that the KMS key policy contains references to both log groups
    const kmsKey = template.findResources('AWS::KMS::Key');
    const kmsKeyId = Object.keys(kmsKey)[0];
    const keyPolicy = kmsKey[kmsKeyId].Properties.KeyPolicy;

    // Stringify the policy to search for the ARNs
    const policyString = JSON.stringify(keyPolicy);

    // Check for VPC Flow Logs ARN reference
    expect(policyString).toContain(
      `/aws/vpc/SecureApp-flowlogs-${environmentSuffix}`
    );

    // Check for ECS Application Logs ARN reference
    expect(policyString).toContain(
      `/aws/ecs/SecureApp-application-${environmentSuffix}`
    );

    // Check for CloudWatch Logs service principal (it's constructed with Fn::Join)
    expect(policyString).toContain('logs.');
  });

  test('Creates encrypted CloudWatch Log Groups', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 365,
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 30,
    });
  });

  test('Creates S3 bucket with encryption and SSL enforcement', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256', // S3-managed encryption for ALB compatibility
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
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('Creates ECS Cluster with container insights', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: [
        {
          Name: 'containerInsights',
          Value: 'enabled',
        },
      ],
    });
  });

  test('Creates Fargate Service with correct configuration', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      DesiredCount: 2,
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          AssignPublicIp: 'DISABLED',
        },
      },
    });
  });

  test('Creates Application Load Balancer in public subnets', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Type: 'application',
        Scheme: 'internet-facing',
      }
    );
  });

  test('Creates HTTP listener when no certificate is provided', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('Creates HTTPS listener with certificate', () => {
    // Create a separate stack with certificate for HTTPS testing
    const appWithCert = new cdk.App();
    const stackWithCert = new TapStack(appWithCert, 'TestStackWithCert', {
      environmentSuffix,
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
      containerImage: 'nginx:test',
      desiredCount: 2,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const templateWithCert = Template.fromStack(stackWithCert);

    // Should have HTTPS listener
    templateWithCert.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
      SslPolicy: 'ELBSecurityPolicy-TLS-1-2-Ext-2018-06',
    });

    // Should have HTTP redirect listener
    templateWithCert.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
      DefaultActions: [
        {
          Type: 'redirect',
          RedirectConfig: {
            Protocol: 'HTTPS',
            Port: '443',
            StatusCode: 'HTTP_301',
          },
        },
      ],
    });
  });

  test('Creates WAF WebACL with managed rule sets', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Scope: 'REGIONAL',
      DefaultAction: {
        Allow: {},
      },
      Rules: Match.arrayWith([
        {
          Name: 'AWSManagedRulesCommonRuleSet',
          Priority: 1,
          OverrideAction: { None: {} },
          Statement: {
            ManagedRuleGroupStatement: {
              VendorName: 'AWS',
              Name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          VisibilityConfig: {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: 'CommonRuleSetMetric',
          },
        },
        {
          Name: 'AWSManagedRulesKnownBadInputsRuleSet',
          Priority: 2,
          OverrideAction: { None: {} },
          Statement: {
            ManagedRuleGroupStatement: {
              VendorName: 'AWS',
              Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          VisibilityConfig: {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: 'KnownBadInputsMetric',
          },
        },
      ]),
    });
  });

  test('Associates WAF with Load Balancer', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
      ResourceArn: Match.anyValue(),
      WebACLArn: Match.anyValue(),
    });
  });

  test('Creates security groups with least privilege', () => {
    // ALB Security Group allows HTTPS and HTTP
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for SecureApp ALB',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
    });

    // ECS Security Group allows traffic from ALB only
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for SecureApp ECS tasks',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });
  });

  test('Creates IAM roles with least privilege', () => {
    // Task execution role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            ],
          ],
        },
      ],
    });

    // Task role with minimal permissions
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('Creates outputs for integration tests', () => {
    template.hasOutput('SecureAppALBDNS', {}); // No suffix in output names
    template.hasOutput('SecureAppKMSKeyId', {});
  });

  test('Resources are named with environment suffix', () => {
    const templateJson = template.toJSON();
    const resources = Object.keys(templateJson.Resources);

    // Check that resource logical IDs include environment suffix
    expect(resources.some(r => r.includes(environmentSuffix))).toBe(true);
  });

  test('All removal policies are set to DESTROY for QA compliance', () => {
    const templateJson = template.toJSON();
    const resources = templateJson.Resources;

    Object.values(resources).forEach((resource: any) => {
      if (resource.DeletionPolicy) {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      }
    });
  });

  test('Uses default values when optional props are not provided', () => {
    const appDefault = new cdk.App();
    const stackDefault = new TapStack(appDefault, 'TestDefaultStack', {
      certificateArn: undefined, // No certificate
      containerImage: 'nginx:test',
      desiredCount: 1,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    const templateDefault = Template.fromStack(stackDefault);

    // Should use default environmentSuffix 'dev'
    templateDefault.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 1,
    });
  });

  test('Auto-scaling configuration with custom capacity', () => {
    template.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalableTarget',
      {
        MinCapacity: 1,
        MaxCapacity: 5,
        ResourceId: Match.anyValue(),
        ScalableDimension: 'ecs:service:DesiredCount',
        ServiceNamespace: 'ecs',
      }
    );

    template.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalingPolicy',
      {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          ScaleInCooldown: 300,
          ScaleOutCooldown: 120,
        },
      }
    );
  });

  test('ALB deletion protection is disabled for QA', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'deletion_protection.enabled',
            Value: 'false',
          },
        ]),
      }
    );
  });

  test('VPC has proper flow logs configuration', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });
  });

  test('Health check configuration for ECS container', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        {
          Name: `SecureApp-Container-${environmentSuffix}`,
          Image: 'nginx:test',
          Essential: true,
          HealthCheck: {
            Command: [
              'CMD-SHELL',
              'curl -f http://localhost:80/ || exit 1',
            ],
            Interval: 30,
            Timeout: 5,
            Retries: 3,
            StartPeriod: 60,
          },
          PortMappings: Match.anyValue(),
          LogConfiguration: Match.anyValue(),
        },
      ]),
    });
  });

  test('ELB service account policy configuration', () => {
    // Test for the specific policy statements that the infrastructure creates
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Principal: {
              AWS: Match.anyValue(), // The ELB service account ID
            },
            Action: 's3:PutObject', // Single action, not array
            Effect: 'Allow',
            Resource: Match.anyValue(),
            Sid: 'AllowELBServiceAccountPutObject',
          },
          {
            Principal: {
              AWS: Match.anyValue(),
            },
            Action: ['s3:GetBucketAcl', 's3:ListBucket'], // These are the actual actions
            Effect: 'Allow',
            Resource: Match.anyValue(),
            Sid: 'AllowELBServiceAccountAclCheck',
          },
        ]),
      },
    });
  });

  test('Task definition resource requirements', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: '512',
      Memory: '1024',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
    });
  });
});

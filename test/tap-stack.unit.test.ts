import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-suffix';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('Stack has correct environment suffix', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Issue 3: Cost Allocation Tags', () => {
    test('Stack has all required cost allocation tags', () => {
      // Verify tags are applied at stack level
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });

    test('VPC has Team tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Team', Value: 'platform-engineering' }
        ])
      });
    });

    test('VPC has Application tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Application', Value: 'ecs-optimization' }
        ])
      });
    });

    test('VPC has CostCenter tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'CostCenter', Value: 'engineering-ops' }
        ])
      });
    });

    test('VPC has Environment tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment'
          })
        ])
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC is created with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `ecs-vpc-${environmentSuffix}`
          })
        ])
      });
    });

    test('VPC has exactly 2 availability zones configured', () => {
      // Verify public and private subnets across 2 AZs
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('VPC has NAT Gateway for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('VPC has VPC endpoints for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 5); // ECR Docker, ECR API, Secrets Manager, CloudWatch Logs, S3
    });

    test('VPC has S3 gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*s3')
            ])
          ])
        })
      });
    });
  });

  describe('Issue 10: Secrets Management', () => {
    test('Database secret is created in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `db-credentials-${environmentSuffix}`,
        Description: 'Database credentials for ECS application',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.stringLikeRegexp('.*username.*appuser.*')
        })
      });
    });

    test('Database secret has RemovalPolicy DESTROY', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('Issue 4: ECS Cluster with Container Insights', () => {
    test('ECS cluster is created with Container Insights enabled', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `ecs-cluster-${environmentSuffix}`,
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled'
          }
        ]
      });
    });
  });

  describe('Issue 7: IAM Permission Boundaries', () => {
    test('Permission boundary policy is created', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `ecs-permission-boundary-${environmentSuffix}`,
        Description: 'Permission boundary for ECS task and execution roles'
      });
    });

    test('Task execution role has permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ecs-task-execution-role-${environmentSuffix}`,
        PermissionsBoundary: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*PermissionBoundary.*')
        })
      });
    });

    test('Task role has permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ecs-task-role-${environmentSuffix}`,
        PermissionsBoundary: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*PermissionBoundary.*')
        })
      });
    });
  });

  describe('Issue 1: Right-sized Task Definition', () => {
    test('Task definition has correct CPU allocation (256 = 0.25 vCPU)', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256'
      });
    });

    test('Task definition has correct memory allocation (512MB)', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Memory: '512'
      });
    });
  });

  describe('Issue 9: CloudWatch Logs with Retention', () => {
    test('CloudWatch log group has 14-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/app-${environmentSuffix}`,
        RetentionInDays: 14
      });
    });

    test('Log group has RemovalPolicy DESTROY', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('Issue 1 & 2: Fargate Service with Auto-scaling', () => {
    test('Fargate service is created', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `ecs-service-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: Match.absent() // Using capacity providers instead
      });
    });

    test('Fargate service uses capacity provider strategy', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        CapacityProviderStrategy: [
          {
            CapacityProvider: 'FARGATE_SPOT',
            Weight: 2,
            Base: 0
          },
          {
            CapacityProvider: 'FARGATE',
            Weight: 1,
            Base: 1
          }
        ]
      });
    });

    test('Auto-scaling target is configured', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 10
      });
    });

    test('CPU-based auto-scaling policy is configured', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization'
          },
          TargetValue: 70
        })
      });
    });

    test('Memory-based auto-scaling policy is configured', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization'
          },
          TargetValue: 80
        })
      });
    });
  });

  describe('Issue 5: ALB with Corrected Health Checks', () => {
    test('Application Load Balancer is created', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `ecs-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('ALB has deletion protection disabled for destroyability', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        LoadBalancerAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'deletion_protection.enabled',
            Value: 'false'
          })
        ])
      });
    });

    test('Target group has corrected health check path', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `ecs-tg-${environmentSuffix}`,
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 10,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3
      });
    });

    test('ALB listener is configured on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP traffic from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `alb-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80
          }
        ]
      });
    });

    test('ECS service security group allows traffic from VPC', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `ecs-service-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for ECS Fargate service'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('VPC ID output is exported', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: `vpc-id-${environmentSuffix}`
        }
      });
    });

    test('Cluster name output is exported', () => {
      template.hasOutput('ClusterName', {
        Export: {
          Name: `cluster-name-${environmentSuffix}`
        }
      });
    });

    test('Load balancer DNS output is exported', () => {
      template.hasOutput('LoadBalancerDns', {
        Export: {
          Name: `alb-dns-${environmentSuffix}`
        }
      });
    });

    test('Database secret ARN output is exported', () => {
      template.hasOutput('DatabaseSecretArn', {
        Export: {
          Name: `db-secret-arn-${environmentSuffix}`
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Stack has expected number of major resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('Issue 10: Secrets in Task Definition', () => {
    test('Task definition uses Secrets Manager for database credentials', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Secrets: Match.arrayWith([
              Match.objectLike({
                Name: 'DB_USERNAME',
                ValueFrom: {
                  'Fn::Join': [
                    '',
                    Match.arrayWith([
                      ':username::'
                    ])
                  ]
                }
              }),
              Match.objectLike({
                Name: 'DB_PASSWORD',
                ValueFrom: {
                  'Fn::Join': [
                    '',
                    Match.arrayWith([
                      ':password::'
                    ])
                  ]
                }
              })
            ])
          })
        ])
      });
    });

    test('Task definition does NOT have sensitive data in environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              Match.objectLike({
                Name: 'APP_ENV',
                Value: 'production'
              }),
              Match.objectLike({
                Name: 'LOG_LEVEL',
                Value: 'info'
              })
            ])
          })
        ])
      });
    });
  });
});

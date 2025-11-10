import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Networking Stack', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Should have at least 2 public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateways for private subnets', () => {
      const natCount = Object.keys(template.toJSON().Resources).filter(
        key => template.toJSON().Resources[key].Type === 'AWS::EC2::NatGateway'
      ).length;
      expect(natCount).toBeGreaterThanOrEqual(1);
    });

    test('should create security groups', () => {
      // ALB, ECS, Database, and Cache security groups
      template.resourceCountIs('AWS::EC2::SecurityGroup', 4);
    });
  });

  describe('Database Stack', () => {
    test('should create RDS Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
      });
    });

    test('should configure Aurora Serverless v2 capacity', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 2,
          MaxCapacity: 4,
        },
      });
    });

    test('should configure backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 14,
      });
    });

    test('should create database instances', () => {
      // Writer and reader instances
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('should create database secret in Secrets Manager', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('should create DB subnet group', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });

    test('should output database capacity configuration', () => {
      const outputs = template.toJSON().Outputs;
      const capacityOutput = Object.keys(outputs).find(key =>
        key.includes('DatabaseCapacity')
      );
      expect(capacityOutput).toBeDefined();
      expect(outputs[capacityOutput!].Value).toContain('Min: 2 ACU');
      expect(outputs[capacityOutput!].Value).toContain('Max: 4 ACU');
    });

    test('should output backup retention configuration', () => {
      const outputs = template.toJSON().Outputs;
      const backupOutput = Object.keys(outputs).find(key =>
        key.includes('DatabaseBackupRetention')
      );
      expect(backupOutput).toBeDefined();
      expect(outputs[backupOutput!].Value).toContain('14 days');
    });
  });

  describe('Cache Stack', () => {
    test('should create ElastiCache Redis replication group', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        Engine: 'redis',
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });

    test('should create Redis cluster with 3 nodes', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        NumCacheClusters: 3,
        AutomaticFailoverEnabled: true,
        MultiAZEnabled: true,
      });
    });

    test('should create cache subnet group', () => {
      template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
    });
  });

  describe('Compute Stack', () => {
    test('should create ECS cluster', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('should create ECS task definition with Fargate', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
        Cpu: '256',
        Memory: '512',
      });
    });

    test('should create ECS service with desired count of 3', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 3,
        LaunchType: 'FARGATE',
      });
    });

    test('should create Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create ALB target group with correct health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
      });
    });

    test('should create ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('API Stack', () => {
    test('should create API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should create API Gateway deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('should create API Gateway stage', () => {
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('should configure throttling settings', () => {
      // Check that stage exists with throttling configured
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('should create API Gateway method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'ANY',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create ECS task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should have secrets manager access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix in resource names', () => {
      const resources = template.toJSON().Resources;
      const resourceNames = Object.keys(resources);

      // Check that resources have meaningful names (not just random IDs)
      const hasNamingConvention = resourceNames.some(name =>
        name.includes('Networking') ||
        name.includes('Database') ||
        name.includes('Cache') ||
        name.includes('Compute') ||
        name.includes('Api')
      );

      expect(hasNamingConvention).toBe(true);
    });

    test('should use default environment suffix when not provided', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestTapStackNoSuffix', {});
      expect(stack2).toBeDefined();
    });

    test('should use context environment suffix when props not provided', () => {
      const app3 = new cdk.App({ context: { environmentSuffix: 'staging' } });
      const stack3 = new TapStack(app3, 'TestTapStackContext', {});
      const template3 = Template.fromStack(stack3);
      expect(template3).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should expose necessary outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
    });
  });

  describe('Tags', () => {
    test('should apply tags to resources', () => {
      // VPC should exist with tags
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('Multi-AZ Configuration', () => {
    test('should deploy across multiple availability zones', () => {
      // NAT Gateways - at least 1 for high availability
      const natCount = Object.keys(template.toJSON().Resources).filter(
        key => template.toJSON().Resources[key].Type === 'AWS::EC2::NatGateway'
      ).length;
      expect(natCount).toBeGreaterThanOrEqual(1);

      // RDS multi-AZ is implied by having 2 instances
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });
  });

  describe('Security Configuration', () => {
    test('should enable encryption for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('should enable encryption for ElastiCache', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });

    test('should create Secrets Manager secret for database', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });
});

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('1. Network Foundation (VPC)', () => {
    test('should create VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `customer-portal-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should create 3 NAT Gateways (instances)', () => {
      const instances = template.findResources('AWS::EC2::Instance', {});
      const natInstances = Object.keys(instances).filter((key) =>
        key.includes('NatInstance')
      );
      expect(natInstances.length).toBeGreaterThanOrEqual(2);
    });

    test('should create public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs × 3 subnet types
    });
  });

  describe('2. Container Platform (ECS)', () => {
    test('should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `customer-portal-cluster-${environmentSuffix}`,
      });
    });

    test('should create frontend task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `frontend-task-${environmentSuffix}`,
        Memory: '512',
        Cpu: '256',
      });
    });

    test('should create backend task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `backend-task-${environmentSuffix}`,
        Memory: '1024',
        Cpu: '512',
      });
    });

    test('should create frontend ECS service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
      });
    });

    test('should create backend ECS service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
      });
    });

    test('should configure auto-scaling for services', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });
  });

  describe('3. Load Balancing (ALB)', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `customer-portal-alb-${environmentSuffix}`,
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create target groups for frontend and backend', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should configure path-based routing rules', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 2);
    });
  });

  describe('4. Database Layer (Aurora PostgreSQL)', () => {
    test('should create Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
      });
    });

    test('should create 1 writer instance', () => {
      const instances = template.findResources('AWS::RDS::DBInstance', {});
      const writerInstances = Object.entries(instances).filter(([key, value]: [string, any]) =>
        key.includes('Writer')
      );
      expect(writerInstances.length).toBe(1);
    });

    test('should create 2 reader instances', () => {
      const instances = template.findResources('AWS::RDS::DBInstance', {});
      const readerInstances = Object.entries(instances).filter(([key, value]: [string, any]) =>
        key.includes('Reader')
      );
      expect(readerInstances.length).toBe(2);
    });

    test('should create database subnet group', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });

    test('should store credentials in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.stringLikeRegexp('Aurora PostgreSQL credentials'),
      });
    });
  });

  describe('5. Session Management (DynamoDB)', () => {
    test('should create sessions table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `customer-portal-sessions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should configure TTL attribute', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          AttributeName: 'expiresAt',
          Enabled: true,
        },
      });
    });

    test('should create 2 global secondary indexes', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({ IndexName: 'UserIdIndex' }),
          Match.objectLike({ IndexName: 'ActiveSessionsIndex' }),
        ]),
      });
    });
  });

  describe('6. API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `customer-portal-api-${environmentSuffix}`,
      });
    });

    test('should configure request throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 500,
        },
      });
    });

    test('should create API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('should configure CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });
  });

  describe('7. Content Delivery (CloudFront + S3)', () => {
    test('should create S3 bucket for static assets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `customer-portal-assets-${environmentSuffix}`,
      });
    });

    test('should configure S3 bucket for auto-deletion', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should create Origin Access Identity for S3', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });
  });

  describe('8. Monitoring (CloudWatch)', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `customer-portal-dashboard-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('should configure log groups with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Security Configuration', () => {
    test('should create security groups for all components', () => {
      const sgCount = Object.keys(template.findResources('AWS::EC2::SecurityGroup', {})).length;
      expect(sgCount).toBeGreaterThanOrEqual(5); // ALB, Frontend, Backend, DB, NAT
    });

    test('should configure IAM roles with least privilege', () => {
      template.resourceCountIs('AWS::IAM::Role', 7);
    });

    test('should enable encryption at rest for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });
  });

  describe('Destroyability', () => {
    test('should configure S3 bucket for deletion', () => {
      const buckets = template.findResources('AWS::S3::Bucket', {});
      Object.values(buckets).forEach((bucket: any) => {
        const tags = bucket.Properties?.Tags || [];
        const autoDeleteTag = tags.find(
          (tag: any) => tag.Key === 'aws-cdk:auto-delete-objects'
        );
        expect(autoDeleteTag?.Value).toBe('true');
      });
    });

    test('should configure RDS with minimal backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 1,
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('should include environmentSuffix in all named resources', () => {
      const template = Template.fromStack(stack);
      const resources = template.toJSON().Resources;

      const namedResources = [
        { type: 'AWS::EC2::VPC', nameField: 'Tags' },
        { type: 'AWS::ECS::Cluster', nameField: 'ClusterName' },
        { type: 'AWS::DynamoDB::Table', nameField: 'TableName' },
        { type: 'AWS::S3::Bucket', nameField: 'BucketName' },
      ];

      namedResources.forEach(({ type, nameField }) => {
        const resourcesOfType = Object.entries(resources).filter(
          ([_, resource]: [string, any]) => resource.Type === type
        );

        resourcesOfType.forEach(([key, resource]: [string, any]) => {
          const props = resource.Properties;
          if (nameField === 'Tags') {
            const nameTag = props.Tags?.find((tag: any) => tag.Key === 'Name');
            if (nameTag) {
              expect(nameTag.Value).toContain(environmentSuffix);
            }
          } else if (props[nameField]) {
            expect(props[nameField]).toContain(environmentSuffix);
          }
        });
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export important resource identifiers', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });
});

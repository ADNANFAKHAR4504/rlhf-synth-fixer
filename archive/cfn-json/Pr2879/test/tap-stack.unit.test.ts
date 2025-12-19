import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Unit Tests', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    template = Template.fromJSON(templateContent);
  });

  describe('VPC and Network Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: [{
          Key: 'Environment',
          Value: 'Production'
        }]
      });
    });

    test('should create public subnets in different AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);

      // Test Public Subnet 1
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
        Tags: [
          {
            Key: 'Environment',
            Value: 'Production'
          },
          {
            Key: 'Name',
            Value: 'Public Subnet 1'
          }
        ]
      });

      // Test Public Subnet 2
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: true,
        Tags: [
          {
            Key: 'Environment',
            Value: 'Production'
          },
          {
            Key: 'Name',
            Value: 'Public Subnet 2'
          }
        ]
      });
    });

    test('should create security group for ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [{
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0'
        }]
      });
    });
  });

  describe('Storage Resources', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        Tags: [{
          Key: 'Environment',
          Value: 'Production'
        }]
      });
    });

    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [{
          AttributeName: 'id',
          AttributeType: 'S'
        }],
        KeySchema: [{
          AttributeName: 'id',
          KeyType: 'HASH'
        }],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });
  });

  describe('Compute Resources', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Tags: [{
          Key: 'Environment',
          Value: 'Production'
        }]
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create HTTPS listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS'
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });
    });
  });

  describe('API Resources', () => {
    test('should create API Gateway with regional endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'MicroservicesAPI',
        Description: 'API Gateway for microservices',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });
  });

  describe('CI/CD Resources', () => {
    test('should create CodePipeline with required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          {
            Name: 'Source',
            Actions: [{
              Name: 'Source',
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Version: '1',
                Provider: 'CodeCommit'
              }
            }]
          },
          {
            Name: 'Build',
            Actions: [{
              Name: 'Build',
              ActionTypeId: {
                Category: 'Build',
                Owner: 'AWS',
                Version: '1',
                Provider: 'CodeBuild'
              }
            }]
          },
          {
            Name: 'Deploy',
            Actions: [{
              Name: 'Deploy',
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Version: '1',
                Provider: 'CodeDeploy'
              }
            }]
          }
        ]
      });
    });
  });

  describe('Monitoring Resources', () => {
    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have the correct number of resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    });
  });
});

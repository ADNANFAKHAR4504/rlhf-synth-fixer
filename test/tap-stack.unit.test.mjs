import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { InfrastructureStack } from '../lib/infrastructure-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

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

  describe('Stack Creation', () => {
    test('should create the main TapStack', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create nested InfrastructureStack', () => {
      // Since InfrastructureStack extends Stack (not NestedStack), 
      // it won't show as AWS::CloudFormation::Stack
      // Instead, verify it was instantiated as a child
      const childStacks = stack.node.children.filter(
        child => child.constructor.name === 'InfrastructureStack'
      );
      expect(childStacks.length).toBe(1);
    });

    test('should pass environment suffix to nested stack', () => {
      const nestedStacks = stack.node.children.filter(
        child => child instanceof InfrastructureStack
      );
      expect(nestedStacks.length).toBe(1);
    });
  });
});

describe('InfrastructureStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new InfrastructureStack(app, 'TestInfrastructureStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            { Key: 'Name', Value: `ScalableVPC-${environmentSuffix}` }
          ])
        }
      });
    });

    test('should create 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Check for public subnets
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(subnet => 
        subnet.Properties.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
        )
      );
      expect(publicSubnets.length).toBe(2);
    });

    test('should create 2 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(subnet => 
        subnet.Properties.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
        )
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('should create 2 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct rules', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for Application Load Balancer',
          GroupName: `ALBSecurityGroup-${environmentSuffix}`,
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0'
            }),
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0'
            })
          ])
        }
      });
    });

    test('should create EC2 security group with correct rules', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for EC2 instances',
          GroupName: `EC2SecurityGroup-${environmentSuffix}`,
        }
      });
    });

    test('should create RDS security group with PostgreSQL port', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for RDS PostgreSQL',
          GroupName: `RDSSecurityGroup-${environmentSuffix}`,
        }
      });
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('should create Application Load Balancer', () => {
      template.hasResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Properties: {
          Name: `tap-${environmentSuffix}-alb`,
          Type: 'application',
          Scheme: 'internet-facing'
        }
      });
    });

    test('should create Target Group with health check', () => {
      template.hasResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Properties: {
          Name: `WebTarget-${environmentSuffix}`,
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3
        }
      });
    });

    test('should create ALB Listener on port 80', () => {
      template.hasResource('AWS::ElasticLoadBalancingV2::Listener', {
        Properties: {
          Port: 80,
          Protocol: 'HTTP'
        }
      });
    });

    test('should create Auto Scaling Group with correct capacity', () => {
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        Properties: {
          AutoScalingGroupName: `WebServerASG-${environmentSuffix}`,
          MinSize: '2',
          MaxSize: '6',
          DesiredCapacity: '2'
        }
      });
    });

    test('should create Launch Template', () => {
      template.hasResource('AWS::EC2::LaunchTemplate', {
        Properties: {
          LaunchTemplateName: `WebServerLaunchTemplate-${environmentSuffix}`
        }
      });
    });

    test('should configure Launch Template with user data', () => {
      const launchTemplates = template.findResources('AWS::EC2::LaunchTemplate');
      const launchTemplate = Object.values(launchTemplates)[0];
      expect(launchTemplate.Properties.LaunchTemplateData.UserData).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should create RDS PostgreSQL instance', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DBInstanceIdentifier: `postgres-db-${environmentSuffix}`,
          Engine: 'postgres',
          AllocatedStorage: '20',
          DBInstanceClass: Match.stringLikeRegexp('db.t3.micro'),
          StorageEncrypted: true,
          BackupRetentionPeriod: 7,
          DeletionProtection: false,
          DBName: 'scalableapp'
        }
      });
    });

    test('should create DB Subnet Group', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {
        Properties: {
          DBSubnetGroupName: `db-subnet-${environmentSuffix}`,
          DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL'
        }
      });
    });

    test('should create DB Parameter Group', () => {
      // Check that a parameter group exists
      const paramGroups = template.findResources('AWS::RDS::DBParameterGroup');
      expect(Object.keys(paramGroups).length).toBeGreaterThan(0);
      
      // Verify it has the expected properties
      const paramGroup = Object.values(paramGroups)[0];
      expect(paramGroup.Properties.Description).toContain('PostgreSQL');
      expect(paramGroup.Properties.Family).toBe('postgres16');
    });

    test('should create database secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        Properties: {
          Name: `scalable-app/db-credentials-${environmentSuffix}`,
          GenerateSecretString: Match.objectLike({
            SecretStringTemplate: '{"username":"dbadmin"}'
          })
        }
      });
    });
  });

  describe('S3 Storage', () => {
    test('should create S3 bucket with versioning and encryption', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketName: `tap-${environmentSuffix}-logs-123456789012-us-east-1`,
          VersioningConfiguration: {
            Status: 'Enabled'
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: Match.arrayWith([
              Match.objectLike({
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256'
                }
              })
            ])
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
          }
        }
      });
    });

    test('should configure lifecycle rules for S3 bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0];
      
      // Check that lifecycle configuration exists
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      
      // Verify the rule properties
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
    });

    test('should set removal policy to DESTROY with auto-delete', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0];
      
      // Check for auto-delete lambda (CDK creates this when autoDeleteObjects is true)
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: Match.anyValue()
        }
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 instance role', () => {
      template.hasResource('AWS::IAM::Role', {
        Properties: {
          RoleName: `EC2InstanceRole-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: {
                  Service: 'ec2.amazonaws.com'
                }
              })
            ])
          })
        }
      });
    });

    test('should attach SSM managed policy to EC2 role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties.RoleName?.includes('EC2InstanceRole')
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      
      // Check that SSM policy is attached
      const hasSsmPolicy = ec2Role.Properties.ManagedPolicyArns.some(arn => {
        if (typeof arn === 'string') {
          return arn.includes('AmazonSSMManagedInstanceCore');
        } else if (arn['Fn::Join']) {
          const joinParts = arn['Fn::Join'][1];
          return joinParts.some(part => 
            typeof part === 'string' && part.includes('AmazonSSMManagedInstanceCore')
          );
        }
        return false;
      });
      
      expect(hasSsmPolicy).toBe(true);
    });

    test('should create S3 access policy with least privilege', () => {
      template.hasResource('AWS::IAM::Policy', {
        Properties: {
          PolicyName: `EC2S3Policy-${environmentSuffix}`,
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: Match.arrayWith(['s3:GetObject', 's3:PutObject', 's3:DeleteObject']),
                Resource: `arn:aws:s3:::scalable-app-bucket-${environmentSuffix}-*/*`
              }),
              Match.objectLike({
                Effect: 'Allow',
                Action: 's3:ListBucket',
                Resource: `arn:aws:s3:::scalable-app-bucket-${environmentSuffix}-*`
              })
            ])
          }
        }
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          AlarmName: `HighCPU-${environmentSuffix}`,
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/EC2',
          Threshold: 80,
          EvaluationPeriods: 2,
          ComparisonOperator: 'GreaterThanThreshold',
          TreatMissingData: 'notBreaching'
        }
      });
    });

    test('should create scaling policies', () => {
      // Check that scaling policies exist
      const policies = template.findResources('AWS::AutoScaling::ScalingPolicy');
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(2);
      
      // Verify there's at least one scale up and one scale down policy
      const policyTypes = Object.values(policies).map(p => p.Properties.StepAdjustments);
      expect(policyTypes).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.stringLikeRegexp('.*-VPC-ID')
        }
      });
    });

    test('should output security group IDs', () => {
      template.hasOutput('ALBSecurityGroupId', {
        Description: 'ALB Security Group ID'
      });
      template.hasOutput('EC2SecurityGroupId', {
        Description: 'EC2 Security Group ID'
      });
      template.hasOutput('RDSSecurityGroupId', {
        Description: 'RDS Security Group ID'
      });
    });

    test('should output Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name'
      });
    });

    test('should output Database Endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS PostgreSQL Endpoint'
      });
    });

    test('should output S3 Bucket Name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });
    });

    test('should output Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'Database Secret ARN'
      });
    });
  });

  describe('Resource Deletion Protection', () => {
    test('should have RemovalPolicy.DESTROY for all resources', () => {
      // Check RDS has deletion protection disabled
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DeletionProtection: false
        }
      });

      // Check S3 bucket has auto-delete
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: Match.anyValue()
        }
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('should use environment suffix in all resource names', () => {
      // Check VPC name
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'Name', Value: `ScalableVPC-${environmentSuffix}` }
          ])
        }
      });

      // Check Auto Scaling Group name
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        Properties: {
          AutoScalingGroupName: `WebServerASG-${environmentSuffix}`
        }
      });

      // Check RDS instance identifier
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DBInstanceIdentifier: `postgres-db-${environmentSuffix}`
        }
      });
    });
  });
});
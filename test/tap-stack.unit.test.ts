import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
      
      // Check VPC has the Name tag
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `scalable-vpc-${environmentSuffix}` })
        ])
      });
    });

    test('creates exactly 3 availability zones with subnets', () => {
      // Check for 3 public subnets
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });
      expect(Object.keys(publicSubnets).length).toBe(3);

      // Check for 3 private subnets
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' })
          ])
        }
      });
      expect(Object.keys(privateSubnets).length).toBe(3);

      // Check for 3 database subnets
      const databaseSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Isolated' })
          ])
        }
      });
      expect(Object.keys(databaseSubnets).length).toBe(3);
    });

    test('creates NAT gateways for high availability', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(1);
    });

    test('creates Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `app-logs-${environmentSuffix}-123456789012`,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('S3 bucket has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            Match.objectLike({
              Id: 'LogsLifecycle',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                })
              ]),
              ExpirationInDays: 365
            })
          ]
        }
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has destroy removal policy for testing', () => {
      const bucket = template.findResources('AWS::S3::Bucket', {
        Properties: {
          BucketName: `app-logs-${environmentSuffix}-123456789012`
        }
      });
      expect(Object.values(bucket)[0].DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket has proper tagging', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      const tags = bucketResource.Properties.Tags;
      
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('Project');
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ]
        })
      });
    });

    test('IAM role has CloudWatch and SSM policies attached', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-instance-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
          Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore')
        ])
      });
    });

    test('IAM role has least privilege custom policy for CloudWatch metrics', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics'
              ]),
              Resource: '*'
            })
          ])
        })
      });
    });

    test('IAM role has S3 permissions for logs bucket', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyFound = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        const hasS3Read = statements.some((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Action?.some((action: string) => action.includes('s3:GetObject'))
        );
        const hasS3Write = statements.some((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Action?.some((action: string) => action.includes('s3:PutObject'))
        );
        return hasS3Read && hasS3Write;
      });
      expect(policyFound).toBeTruthy();
    });
  });

  describe('RDS Database Configuration', () => {
    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `app-database-${environmentSuffix}`,
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100
      });
    });

    test('RDS has automated backups enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7
      });
    });

    test('RDS has encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('RDS has monitoring enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
        EnablePerformanceInsights: true
      });
    });

    test('RDS has deletion protection disabled for testing', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });

    test('RDS is deployed in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
        DBSubnetGroupDescription: 'Subnet group for RDS database'
      });
    });

    test('RDS has proper security group configuration', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database'
      });
    });

    test('RDS uses generated secret for credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"dbadmin"}',
          GenerateStringKey: 'password'
        })
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('creates Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `app-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '10',
        DesiredCapacity: '2'
      });
    });

    test('Auto Scaling Group uses launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `app-launch-template-${environmentSuffix}`
      });
    });

    test('Launch template has correct instance configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required'
          })
        })
      });
    });

    test('Auto Scaling Group has CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          }),
          TargetValue: 70
        })
      });
    });

    test('Auto Scaling Group has rolling update policy', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];
      expect(asgResource.UpdatePolicy).toBeDefined();
      expect(asgResource.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
      expect(asgResource.UpdatePolicy.AutoScalingRollingUpdate.MaxBatchSize).toBe(1);
      expect(asgResource.UpdatePolicy.AutoScalingRollingUpdate.MinInstancesInService).toBe(1);
    });

    test('Auto Scaling Group deployed in private subnets', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];
      expect(asgResource.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asgResource.Properties.VPCZoneIdentifier.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups Configuration', () => {
    test('ASG security group allows HTTP and HTTPS traffic', () => {
      const ingress = template.findResources('AWS::EC2::SecurityGroupIngress');
      const ingressRules = Object.values(ingress);
      
      const hasHttp = ingressRules.some((rule: any) => 
        rule.Properties?.IpProtocol === 'tcp' && 
        rule.Properties?.FromPort === 80 && 
        rule.Properties?.ToPort === 80
      );
      
      const hasHttps = ingressRules.some((rule: any) => 
        rule.Properties?.IpProtocol === 'tcp' && 
        rule.Properties?.FromPort === 443 && 
        rule.Properties?.ToPort === 443
      );
      
      expect(hasHttp).toBeTruthy();
      expect(hasHttps).toBeTruthy();
    });

    test('Database security group allows PostgreSQL access from ASG', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow PostgreSQL access from ASG instances'
      });
    });

    test('Database security group restricts outbound traffic', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSg = Object.values(securityGroups).find((sg: any) => 
        sg.Properties?.GroupDescription === 'Security group for RDS database'
      );
      
      expect(dbSg).toBeDefined();
      expect(dbSg?.Properties?.SecurityGroupEgress).toBeUndefined();
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources have proper tags', () => {
      // Check VPC has tags
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const vpcTags = vpcResource.Properties.Tags;
      const vpcTagKeys = vpcTags.map((tag: any) => tag.Key);
      expect(vpcTagKeys).toContain('Environment');
      expect(vpcTagKeys).toContain('CostCenter');
      expect(vpcTagKeys).toContain('Owner');
      expect(vpcTagKeys).toContain('Project');

      // Check S3 bucket has tags
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      const bucketTags = bucketResource.Properties.Tags;
      const bucketTagKeys = bucketTags.map((tag: any) => tag.Key);
      expect(bucketTagKeys).toContain('Environment');
      expect(bucketTagKeys).toContain('CostCenter');
      expect(bucketTagKeys).toContain('Owner');
      expect(bucketTagKeys).toContain('Project');
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the scalable environment'
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for application logs'
      });
    });

    test('exports RDS database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint'
      });
    });

    test('exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name'
      });
    });

    test('exports IAM role ARN', () => {
      template.hasOutput('IAMRoleArn', {
        Description: 'IAM role ARN for EC2 instances'
      });
    });
  });

  describe('High Availability', () => {
    test('resources span multiple availability zones', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });
      
      const azs = new Set();
      Object.values(publicSubnets).forEach(subnet => {
        azs.add(subnet.Properties.AvailabilityZone);
      });
      
      expect(azs.size).toBe(3);
    });
  });
});
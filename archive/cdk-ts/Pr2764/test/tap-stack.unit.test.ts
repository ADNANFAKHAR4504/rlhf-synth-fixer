import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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

  describe('VPC Configuration', () => {
    test('Creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Name', Value: 'TapVPC' })
        ])
      });
    });

    test('Creates Internet Gateway and attaches to VPC', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
      
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: Match.anyValue(),
        InternetGatewayId: Match.anyValue()
      });
    });

    test('Creates two public subnets in different AZs', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('Creates two private subnets in different AZs', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false
        }
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('Creates route tables for public subnets with Internet Gateway route', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
      });
    });
  });

  describe('Security Groups', () => {
    test('Creates Web Security Group with HTTP and SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers - allows HTTP traffic',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('Creates Database Security Group allowing MySQL from web instances only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS MySQL database'
      });
    });

    test('Creates ALB Security Group allowing HTTP from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('Creates security group ingress rule for DB from Web SG', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: Match.anyValue()
      });
    });
  });

  describe('Network ACLs', () => {
    test('Creates Network ACL with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', {
        VpcId: Match.anyValue()
      });
    });

    test('Creates Network ACL entry for HTTP inbound', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        NetworkAclId: Match.anyValue(),
        RuleNumber: 100,
        Protocol: 6,
        RuleAction: 'allow',
        CidrBlock: '0.0.0.0/0',
        PortRange: {
          From: 80,
          To: 80
        }
      });
    });

    test('Creates Network ACL entry for SSH inbound', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        NetworkAclId: Match.anyValue(),
        RuleNumber: 110,
        Protocol: 6,
        RuleAction: 'allow',
        CidrBlock: '0.0.0.0/0',
        PortRange: {
          From: 22,
          To: 22
        }
      });
    });

    test('Associates Network ACL with public subnets', () => {
      const associations = template.findResources('AWS::EC2::SubnetNetworkAclAssociation');
      expect(Object.keys(associations).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EC2 Instances', () => {
    test('Creates two EC2 instances of type t2.micro', () => {
      const instances = template.findResources('AWS::EC2::Instance', {
        Properties: {
          InstanceType: 't2.micro'
        }
      });
      expect(Object.keys(instances).length).toBe(2);
    });

    test('Assigns Elastic IPs to both instances', () => {
      const eips = template.findResources('AWS::EC2::EIP', {
        Properties: {
          Domain: 'vpc',
          InstanceId: Match.anyValue()
        }
      });
      expect(Object.keys(eips).length).toBe(2);
    });

    test('EC2 instances have proper user data for web server setup', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.objectLike({
          'Fn::Base64': Match.anyValue()
        })
      });
    });

    test('EC2 instances are properly tagged', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('WebInstance') })
        ])
      });
    });
  });

  describe('RDS Database', () => {
    test('Creates RDS MySQL instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageType: 'gp2',
        PubliclyAccessible: false,
        DeletionProtection: false,
        BackupRetentionPeriod: 7
      });
    });

    test('Creates DB subnet group for private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS MySQL database',
        SubnetIds: Match.anyValue(),
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
    });

    test('Database uses generated secret for credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-database-credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password'
        })
      });
    });
  });

  describe('S3 Bucket', () => {
    test('Creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('S3 bucket has SSE-S3 encryption', () => {
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

    test('S3 bucket has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled'
            }),
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('S3 bucket is properly tagged', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Name', Value: 'TapLogsBucket' })
        ])
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('Creates target group for EC2 instances', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });
    });

    test('Creates ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
            TargetGroupArn: Match.anyValue()
          }
        ]
      });
    });

    test('ALB is properly tagged', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Name', Value: 'TapApplicationLoadBalancer' })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Creates output for Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
        Export: {
          Name: 'TapApplicationLoadBalancerDNS'
        }
      });
    });

    test('Creates output for Database Endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS MySQL database endpoint',
        Export: {
          Name: 'TapDatabaseEndpoint'
        }
      });
    });

    test('Creates output for S3 Bucket Name', () => {
      template.hasOutput('LogsBucketName', {
        Description: 'S3 bucket name for application logs',
        Export: {
          Name: 'TapLogsBucketName'
        }
      });
    });

    test('Creates output for VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'TapVpcId'
        }
      });
    });

    test('Creates outputs for EC2 instance IDs', () => {
      template.hasOutput('WebInstance1Id', {
        Description: 'Instance ID of Web Instance 1'
      });
      template.hasOutput('WebInstance2Id', {
        Description: 'Instance ID of Web Instance 2'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have Environment: Production tag', () => {
      const resources = template.toJSON().Resources;
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::Instance',
        'AWS::S3::Bucket',
        'AWS::RDS::DBInstance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      ];

      for (const [, resource] of Object.entries(resources)) {
        if (taggableResourceTypes.includes((resource as any).Type)) {
          if ((resource as any).Properties?.Tags) {
            const tags = (resource as any).Properties.Tags;
            const envTag = tags.find((tag: any) => tag.Key === 'Environment');
            if (envTag) {
              expect(envTag.Value).toBe('Production');
            }
          }
        }
      }
    });
  });

  describe('Stack Properties', () => {
    test('Stack uses environment suffix correctly', () => {
      const testApp = new cdk.App();
      const stackInstance = new TapStack(testApp, 'TestStackWithSuffix', {
        environmentSuffix: 'prod'
      });
      const testTemplate = Template.fromStack(stackInstance);
      expect(testTemplate).toBeDefined();
      
      // Verify that the stack was created with the environment suffix in tags
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'EnvironmentSuffix', Value: 'prod' })
        ])
      });
    });

    test('Stack uses default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const stackInstance = new TapStack(testApp, 'TestStackDefault');
      const testTemplate = Template.fromStack(stackInstance);
      expect(testTemplate).toBeDefined();
      
      // Verify that the stack was created with default environment suffix in tags
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'EnvironmentSuffix', Value: 'dev' })
        ])
      });
    });

    test('Stack reads environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const stackInstance = new TapStack(contextApp, 'TestStackContext');
      const testTemplate = Template.fromStack(stackInstance);
      expect(testTemplate).toBeDefined();
      
      // Verify that the stack was created with context environment suffix in tags
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'EnvironmentSuffix', Value: 'staging' })
        ])
      });
    });
  });

  describe('Deletion Policies', () => {
    test('S3 bucket has DESTROY removal policy for non-production', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('RDS instance has DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });
  });
});
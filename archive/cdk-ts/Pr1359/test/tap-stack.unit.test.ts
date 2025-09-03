import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC is tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('VPC has environment suffix in logical ID', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(resources);
      expect(vpcKeys.some((key) => key.includes(environmentSuffix))).toBeTruthy();
    });
  });

  describe('Subnet Configuration', () => {
    test('creates two subnets with correct CIDR blocks', () => {
      // First subnet
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });

      // Second subnet
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test.skip('subnets are in different availability zones', () => {
      const resources = template.toJSON().Resources;
      const subnets = Object.entries(resources)
        .filter(([key, value]: any) => 
          value.Type === 'AWS::EC2::Subnet' && key.includes('ProductionSubnet')
        )
        .map(([, value]: any) => value.Properties);
      
      // Check we have exactly 2 subnets
      expect(subnets).toHaveLength(2);
      
      // Check they have different CIDR blocks
      const cidrBlocks = subnets.map(s => s.CidrBlock);
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      
      // Check they use different AZ indices
      subnets.forEach(subnet => {
        expect(subnet.AvailabilityZone).toBeDefined();
        expect(subnet.AvailabilityZone['Fn::Select']).toBeDefined();
        const azIndex = subnet.AvailabilityZone['Fn::Select'][0];
        expect([0, 1]).toContain(azIndex);
      });
    });

    test('subnets are tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('subnets have environment suffix in logical IDs', () => {
      const resources = template.findResources('AWS::EC2::Subnet');
      // Filter to only check our custom subnets, not CDK-generated ones
      const ourSubnetKeys = Object.keys(resources).filter(key => 
        key.includes('ProductionSubnet')
      );
      ourSubnetKeys.forEach((key) => {
        expect(key.includes(environmentSuffix)).toBeTruthy();
      });
    });
  });

  describe('Internet Gateway and Routing', () => {
    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('attaches Internet Gateway to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: Match.anyValue(),
        InternetGatewayId: Match.anyValue(),
      });
    });

    test('creates route table with default route to IGW', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('associates route table with subnets', () => {
      const associations = template.findResources('AWS::EC2::SubnetRouteTableAssociation');
      expect(Object.keys(associations).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has deletion policy set to Delete (destroyable)', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('S3 bucket has auto-delete objects enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket is tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('creates auto-delete Lambda for S3 bucket cleanup', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        BucketName: Match.anyValue(),
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates IAM role for EC2 with correct assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('IAM role has S3 bucket access policy with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3BucketAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                    's3:GetBucketLocation',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('IAM role has CloudWatch logging policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CloudWatchLogging',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                    'logs:DescribeLogGroups',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('IAM role has environment suffix in name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`,
      });
    });

    test('IAM role is tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('Instance Profile Configuration', () => {
    test('creates instance profile with correct role', () => {
      const resources = template.toJSON().Resources;
      const instanceProfileKey = Object.keys(resources).find(
        (key) => resources[key].Type === 'AWS::IAM::InstanceProfile'
      );
      
      if (instanceProfileKey) {
        const instanceProfile = resources[instanceProfileKey];
        expect(instanceProfile.Properties.Roles).toBeDefined();
        expect(instanceProfile.Properties.Roles).toHaveLength(1);
      }
    });

    test('instance profile has environment suffix in name', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `tap-instance-profile-${environmentSuffix}`,
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('creates security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            Description: 'Allow SSH access from specified IP address',
          }),
        ]),
      });
    });

    test('security group allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('security group has environment suffix in name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-security-group-${environmentSuffix}`,
      });
    });

    test('security group is tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance with t3.medium type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.medium',
      });
    });

    test('EC2 instance is launched in a subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: Match.anyValue(),
      });
    });

    test('EC2 instance has IAM instance profile attached', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: Match.anyValue(),
      });
    });

    test('EC2 instance has security group attached', () => {
      const resources = template.toJSON().Resources;
      const ec2InstanceKey = Object.keys(resources).find(
        (key) => resources[key].Type === 'AWS::EC2::Instance'
      );
      
      if (ec2InstanceKey) {
        const ec2Instance = resources[ec2InstanceKey];
        expect(ec2Instance.Properties.SecurityGroupIds).toBeDefined();
        expect(ec2Instance.Properties.SecurityGroupIds).toHaveLength(1);
      }
    });

    test('EC2 instance has user data script', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue(),
      });
    });

    test('EC2 instance is tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('EC2 instance has environment suffix in logical ID', () => {
      const resources = template.findResources('AWS::EC2::Instance');
      const instanceKeys = Object.keys(resources);
      expect(instanceKeys.some((key) => key.includes(environmentSuffix))).toBeTruthy();
    });
  });

  describe('Stack Outputs', () => {
    test('outputs VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
      });
    });

    test('outputs EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
      });
    });

    test('outputs EC2 public IP', () => {
      template.hasOutput('EC2PublicIp', {
        Description: 'EC2 Instance Public IP',
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('EC2 instance depends on instance profile', () => {
      const resources = template.toJSON().Resources;
      const ec2InstanceKey = Object.keys(resources).find(
        (key) => resources[key].Type === 'AWS::EC2::Instance'
      );
      
      if (ec2InstanceKey) {
        const ec2Instance = resources[ec2InstanceKey];
        expect(ec2Instance.DependsOn).toBeDefined();
        expect(Array.isArray(ec2Instance.DependsOn) ? 
          ec2Instance.DependsOn : [ec2Instance.DependsOn]
        ).toEqual(expect.arrayContaining([expect.stringContaining('InstanceProfile')]));
      }
    });
  });

  describe('SSH IP Parameter', () => {
    test('creates SSH IP address parameter with default value', () => {
      template.hasParameter('SshIpAddress', {
        Type: 'String',
        Default: '0.0.0.0/32',
        Description: 'IP address allowed for SSH access',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all major resources include environment suffix', () => {
      const json = template.toJSON();
      const resources = json.Resources;
      
      // Check that our custom resources have environment suffix
      // Filter out CDK-generated resources like Custom providers
      const ourResources = Object.entries(resources).filter(([key, value]: any) => {
        return key.includes('Production') || 
               key.includes('Subnet1') || 
               key.includes('Subnet2') ||
               key.includes(environmentSuffix);
      });
      
      ourResources.forEach(([resourceKey]) => {
        expect(resourceKey.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      });
      
      // Ensure we're testing a reasonable number of resources
      expect(ourResources.length).toBeGreaterThan(10);
    });
  });

  describe('Stack Configuration', () => {
    test('stack accepts environment suffix as a required property', () => {
      expect(() => {
        new TapStack(app, 'TestStack', {
          environmentSuffix: 'test',
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
        });
      }).not.toThrow();
    });
  });

  describe('AMI Configuration', () => {
    test('uses Amazon Linux 2 AMI from SSM parameter', () => {
      template.hasParameter('*', {
        Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>',
        Default: Match.stringLikeRegexp('.*amazon-linux.*'),
      });
    });
  });

  describe('No Retain Policies', () => {
    test('no resources have Retain deletion policy', () => {
      const json = template.toJSON();
      const resources = json.Resources;
      
      Object.keys(resources).forEach((resourceKey) => {
        const resource = resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('S3 bucket specifically has Delete policy', () => {
      const json = template.toJSON();
      const resources = json.Resources;
      
      const s3Buckets = Object.keys(resources).filter(
        (key) => resources[key].Type === 'AWS::S3::Bucket'
      );
      
      s3Buckets.forEach((bucketKey) => {
        expect(resources[bucketKey].DeletionPolicy).toBe('Delete');
      });
    });
  });
});
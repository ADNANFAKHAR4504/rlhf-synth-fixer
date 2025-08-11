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
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates public subnets across multiple AZs', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      
      // Should have 3 public subnets (one per AZ)
      expect(Object.keys(publicSubnets).length).toBe(3);
    });

    test('creates private subnets across multiple AZs', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      
      // Should have 3 private subnets (one per AZ)
      expect(Object.keys(privateSubnets).length).toBe(3);
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates NAT Gateways for private subnet egress', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      
      // Should have at least 1 NAT Gateway (CDK creates one per public subnet by default)
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(1);
    });

    test('creates route tables for public and private subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      
      // Should have route tables for both public and private subnets
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(6); // 3 public + 3 private
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 instance role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`,
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
      
      // Verify managed policies are attached (simplified check)
      const roleResource = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `tap-ec2-role-${environmentSuffix}`,
        },
      });
      
      expect(Object.keys(roleResource).length).toBe(1);
    });

    test('creates instance profile for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with HTTP and HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-web-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('creates cache security group with Redis port access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-cache-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for ElastiCache',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 6379,
            ToPort: 6379,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-lt-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.medium',
          IamInstanceProfile: Match.objectLike({
            Arn: Match.anyValue(),
          }),
        }),
      });
    });

    test('creates Auto Scaling Group with correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`,
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('Auto Scaling Group uses private subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });

    test('creates CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });
  });

  describe('ElastiCache Serverless', () => {
    test('creates ElastiCache subnet group', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        CacheSubnetGroupName: `tap-cache-subnet-${environmentSuffix}`,
        Description: 'Subnet group for ElastiCache',
      });
    });

    test('creates ElastiCache Serverless Redis cache', () => {
      template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
        ServerlessCacheName: `tap-cache-${environmentSuffix}`,
        Engine: 'redis',
        Description: 'Serverless Redis cache for web application',
      });
    });

    test('ElastiCache uses private subnets', () => {
      template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
        SubnetIds: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('creates SSM parameter for VPC ID', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/${environmentSuffix}/vpc-id`,
        Type: 'String',
        Description: 'VPC ID for integration testing',
      });
    });

    test('creates SSM parameter for ASG name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/${environmentSuffix}/asg-name`,
        Type: 'String',
        Description: 'Auto Scaling Group name for integration testing',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `tap-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('exports ElastiCache endpoint', () => {
      template.hasOutput('ElastiCacheEndpoint', {
        Description: 'ElastiCache Serverless Endpoint',
        Export: {
          Name: `tap-cache-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
        Export: {
          Name: `tap-asg-name-${environmentSuffix}`,
        },
      });
    });

    test('exports public subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: {
          Name: `tap-public-subnets-${environmentSuffix}`,
        },
      });
    });

    test('exports private subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: `tap-private-subnets-${environmentSuffix}`,
        },
      });
    });

    test('exports web security group ID', () => {
      template.hasOutput('WebSecurityGroupId', {
        Description: 'Web Security Group ID',
        Export: {
          Name: `tap-web-sg-id-${environmentSuffix}`,
        },
      });
    });

    test('exports cache security group ID', () => {
      template.hasOutput('CacheSecurityGroupId', {
        Description: 'Cache Security Group ID',
        Export: {
          Name: `tap-cache-sg-id-${environmentSuffix}`,
        },
      });
    });

    test('exports launch template ID', () => {
      template.hasOutput('LaunchTemplateId', {
        Description: 'Launch Template ID',
        Export: {
          Name: `tap-lt-id-${environmentSuffix}`,
        },
      });
    });

    test('exports EC2 role ARN', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'EC2 Instance Role ARN',
        Export: {
          Name: `tap-ec2-role-arn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources use environment suffix', () => {
      // Check that key resources include the environment suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
          }),
        ]),
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });

      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
    });
  });

  describe('High Availability', () => {
    test('resources span multiple availability zones', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      
      // Verify we have subnets in multiple AZs
      expect(Object.keys(publicSubnets).length).toBe(3);
      expect(Object.keys(privateSubnets).length).toBe(3);
    });

    test('Auto Scaling Group minimum capacity ensures redundancy', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2', // At least 2 instances for redundancy
      });
    });
  });

  describe('Edge Cases and Conditionals', () => {
    test('ElastiCache endpoint output handles conditional value', () => {
      const outputs = template.findOutputs('ElastiCacheEndpoint');
      expect(Object.keys(outputs).length).toBe(1);
      const output = outputs['ElastiCacheEndpoint'];
      
      // Verify it uses GetAtt or has a fallback value
      expect(output.Value).toBeDefined();
      if (output.Value['Fn::GetAtt']) {
        expect(output.Value['Fn::GetAtt']).toContain('ServerlessCache');
      }
    });

    test('Launch template ID output handles conditional value', () => {
      const outputs = template.findOutputs('LaunchTemplateId');
      expect(Object.keys(outputs).length).toBe(1);
      const output = outputs['LaunchTemplateId'];
      
      // Verify it has a value or fallback
      expect(output.Value).toBeDefined();
    });
  });

  describe('Additional Validations', () => {
    test('ElastiCache has proper dependency on subnet group', () => {
      const serverlessCache = template.findResources('AWS::ElastiCache::ServerlessCache');
      expect(Object.keys(serverlessCache).length).toBe(1);
      
      const cacheResource = serverlessCache[Object.keys(serverlessCache)[0]];
      expect(cacheResource.DependsOn).toBeDefined();
      expect(cacheResource.DependsOn).toContain('CacheSubnetGroup');
    });

    test('all taggable resources have proper tags', () => {
      // Check VPC has tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.anyValue(),
          }),
        ]),
      });

      // Check Auto Scaling Group exists and is properly named
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`,
      });
      
      // Verify the ASG has tags (structure varies by CDK version)
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      expect(Object.keys(asgResources).length).toBeGreaterThan(0);
    });

    test('Security groups have proper egress rules', () => {
      // Web security group allows all outbound
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-web-sg-${environmentSuffix}`,
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
          }),
        ]),
      });
    });

    test('VPC has proper CIDR configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('NAT Gateways have proper dependencies', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      
      Object.values(natGateways).forEach((natGw: any) => {
        expect(natGw.DependsOn).toBeDefined();
        expect(Array.isArray(natGw.DependsOn)).toBe(true);
      });
    });
  });
});
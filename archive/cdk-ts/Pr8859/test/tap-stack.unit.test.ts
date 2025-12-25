import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct tags', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpcResources);
      expect(vpcKeys.length).toBeGreaterThan(0);
      
      const tags = vpcResources[vpcKeys[0]].Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      const costCenterTag = tags.find((tag: any) => tag.Key === 'CostCenter');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`tap-${environmentSuffix}-vpc`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TapInfrastructure');
      expect(costCenterTag).toBeDefined();
      expect(costCenterTag.Value).toBe('Engineering');
      expect(ownerTag).toBeDefined();
      expect(ownerTag.Value).toBe('DevOps');
    });

    test('Exactly 2 public subnets are created', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('Exactly 2 private subnets are created', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('Public subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('Private subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('Internet Gateway is created and attached to VPC', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('NAT Gateway is created with Elastic IP', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
      template.hasResource('AWS::EC2::EIP', {
        Properties: {
          Domain: 'vpc',
        },
      });
    });

    test('Route tables are configured for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('Route tables are configured for private subnets with NAT', () => {
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          NatGatewayId: Match.anyValue(),
        },
      });
      expect(Object.keys(routes).length).toBe(2);
    });
  });

  describe('Security Group Configuration', () => {
    test('Security group is created with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-${environmentSuffix}-web-sg`,
        GroupDescription: 'Security group for web instances',
      });
    });

    test('SSH access is restricted to specific IP range', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.0/24',
            Description: 'Allow SSH access from specific IP range',
          }),
        ]),
      });
    });

    test('HTTP access is allowed from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP access',
          }),
        ]),
      });
    });

    test('Security group allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Security group has correct tags', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `tap-${environmentSuffix}-web-sg` }),
        ]),
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('EC2 instance role is created with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-ec2-role`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('Instance role has CloudWatch Agent policy attached', () => {
      const roleResources = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `tap-${environmentSuffix}-ec2-role`,
        },
      });
      const roleKeys = Object.keys(roleResources);
      expect(roleKeys.length).toBeGreaterThan(0);
      
      const managedPolicies = roleResources[roleKeys[0]].Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      expect(managedPolicies.length).toBeGreaterThanOrEqual(2);
      
      // Check if CloudWatch policy is included
      const hasCloudWatchPolicy = managedPolicies.some((policy: any) => {
        if (typeof policy === 'object' && policy['Fn::Join']) {
          const joinArray = policy['Fn::Join'][1];
          return joinArray.some((part: any) => 
            typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
          );
        }
        return false;
      });
      expect(hasCloudWatchPolicy).toBe(true);
    });

    test('Instance role has SSM policy attached', () => {
      const roleResources = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `tap-${environmentSuffix}-ec2-role`,
        },
      });
      const roleKeys = Object.keys(roleResources);
      expect(roleKeys.length).toBeGreaterThan(0);
      
      const managedPolicies = roleResources[roleKeys[0]].Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      expect(managedPolicies.length).toBeGreaterThanOrEqual(2);
      
      // Check if SSM policy is included
      const hasSSMPolicy = managedPolicies.some((policy: any) => {
        if (typeof policy === 'object' && policy['Fn::Join']) {
          const joinArray = policy['Fn::Join'][1];
          return joinArray.some((part: any) => 
            typeof part === 'string' && part.includes('AmazonSSMManagedInstanceCore')
          );
        }
        return false;
      });
      expect(hasSSMPolicy).toBe(true);
    });

    test('Compute Optimizer permissions are added', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'compute-optimizer:GetRecommendationSummaries',
                'compute-optimizer:GetAutoScalingGroupRecommendations',
              ]),
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('Instance profile is created', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('Launch Template Configuration', () => {
    test('Launch template is created with correct name', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-${environmentSuffix}-launch-template`,
      });
    });

    test('Launch template uses t3.micro instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      });
    });

    test('Launch template uses Amazon Linux 2 AMI', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: Match.objectLike({
            Ref: Match.stringLikeRegexp('SsmParameterValue.*'),
          }),
        }),
      });
    });

    test('Launch template has security group attached', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          SecurityGroupIds: Match.arrayWith([
            Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('WebSecurityGroup.*'),
                'GroupId',
              ]),
            }),
          ]),
        }),
      });
    });

    test('Launch template has IAM instance profile', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          IamInstanceProfile: Match.objectLike({
            Arn: Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('LaunchTemplateProfile.*'),
                'Arn',
              ]),
            }),
          }),
        }),
      });
    });

    test('Launch template has user data', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          UserData: Match.anyValue(),
        }),
      });
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('Auto Scaling Group is created with correct name', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-${environmentSuffix}-asg`,
      });
    });

    test('Auto Scaling Group has correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2',
      });
    });

    test('Auto Scaling Group uses launch template via MixedInstancesPolicy', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MixedInstancesPolicy: Match.objectLike({
          LaunchTemplate: Match.objectLike({
            LaunchTemplateSpecification: Match.objectLike({
              LaunchTemplateId: Match.objectLike({
                Ref: Match.stringLikeRegexp('LaunchTemplate.*'),
              }),
            }),
          }),
        }),
      });
    });

    test('Auto Scaling Group is deployed in public subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.arrayWith([
          Match.objectLike({ Ref: Match.stringLikeRegexp('.*PublicSubnet.*') }),
        ]),
      });
    });

    test('Auto Scaling Group has health check configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300,
      });
    });

    test('Auto Scaling Group has rolling update policy', () => {
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        UpdatePolicy: Match.objectLike({
          AutoScalingRollingUpdate: Match.objectLike({
            MinInstancesInService: 1,
          }),
        }),
      });
    });

    test('Auto Scaling Group has correct tags', () => {
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgKeys = Object.keys(asgResources);
      expect(asgKeys.length).toBeGreaterThan(0);
      
      const tags = asgResources[asgKeys[0]].Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`tap-${environmentSuffix}-asg`);
      expect(nameTag.PropagateAtLaunch).toBe(true);
      
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
      expect(envTag.PropagateAtLaunch).toBe(true);
    });

    test('CPU scaling policy is configured', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
          TargetValue: 70,
        }),
      });
    });

    test('Scaling policy has cooldown period', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        Cooldown: '300',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('VPC ID output is created', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-vpc-id`,
        }),
      });
    });

    test('VPC CIDR output is created', () => {
      template.hasOutput('VpcCidr', {
        Description: 'VPC CIDR Block',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-vpc-cidr`,
        }),
      });
    });

    test('Auto Scaling Group name output is created', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-asg-name`,
        }),
      });
    });

    test('Security Group ID output is created', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-sg-id`,
        }),
      });
    });

    test('Public subnet IDs output is created', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-public-subnet-ids`,
        }),
      });
    });

    test('Private subnet IDs output is created', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-private-subnet-ids`,
        }),
      });
    });

    test('NAT Gateway IDs output is created', () => {
      template.hasOutput('NatGatewayIds', {
        Description: 'NAT Gateway IDs',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-nat-gateway-ids`,
        }),
      });
    });

    test('Availability Zones output is created', () => {
      template.hasOutput('AvailabilityZones', {
        Description: 'Availability Zones',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-azs`,
        }),
      });
    });

    test('Instance Role ARN output is created', () => {
      template.hasOutput('InstanceRoleArn', {
        Description: 'EC2 Instance Role ARN',
        Export: Match.objectLike({
          Name: `tap-${environmentSuffix}-instance-role-arn`,
        }),
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow naming convention with environment suffix', () => {
      const namePrefix = `tap-${environmentSuffix}`;
      
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `${namePrefix}-vpc` }),
        ]),
      });

      // Check Security Group name
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${namePrefix}-web-sg`,
      });

      // Check IAM Role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${namePrefix}-ec2-role`,
      });

      // Check Launch Template name
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `${namePrefix}-launch-template`,
      });

      // Check Auto Scaling Group name
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `${namePrefix}-asg`,
      });
    });
  });

  describe('Cost Optimization and Tagging', () => {
    test('All major resources have cost tracking tags', () => {
      // Check VPC has essential tags
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpcResources);
      expect(vpcKeys.length).toBeGreaterThan(0);
      
      const vpcTags = vpcResources[vpcKeys[0]].Properties.Tags;
      const vpcEnvTag = vpcTags.find((tag: any) => tag.Key === 'Environment');
      const vpcProjectTag = vpcTags.find((tag: any) => tag.Key === 'Project');
      
      expect(vpcEnvTag).toBeDefined();
      expect(vpcEnvTag.Value).toBe(environmentSuffix);
      expect(vpcProjectTag).toBeDefined();
      expect(vpcProjectTag.Value).toBe('TapInfrastructure');
      
      // Check Security Group has essential tags
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const sgKeys = Object.keys(sgResources);
      expect(sgKeys.length).toBeGreaterThan(0);
      
      const sgTags = sgResources[sgKeys[0]].Properties.Tags;
      const sgEnvTag = sgTags.find((tag: any) => tag.Key === 'Environment');
      const sgProjectTag = sgTags.find((tag: any) => tag.Key === 'Project');
      
      expect(sgEnvTag).toBeDefined();
      expect(sgEnvTag.Value).toBe(environmentSuffix);
      expect(sgProjectTag).toBeDefined();
      expect(sgProjectTag.Value).toBe('TapInfrastructure');
      
      // Check Auto Scaling Group has essential tags
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgKeys = Object.keys(asgResources);
      expect(asgKeys.length).toBeGreaterThan(0);
      
      const asgTags = asgResources[asgKeys[0]].Properties.Tags;
      const asgEnvTag = asgTags.find((tag: any) => tag.Key === 'Environment');
      const asgProjectTag = asgTags.find((tag: any) => tag.Key === 'Project');
      
      expect(asgEnvTag).toBeDefined();
      expect(asgEnvTag.Value).toBe(environmentSuffix);
      expect(asgEnvTag.PropagateAtLaunch).toBe(true);
      expect(asgProjectTag).toBeDefined();
      expect(asgProjectTag.Value).toBe('TapInfrastructure');
      expect(asgProjectTag.PropagateAtLaunch).toBe(true);
    });

    test('Single NAT gateway is used for cost optimization', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(1);
    });

    test('Instance type is cost-optimized (t3.micro)', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      });
    });
  });

  describe('Stack Properties', () => {
    test('Stack accepts environment suffix parameter', () => {
      const customSuffix = 'custom';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customSuffix,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-${customSuffix}-web-sg`,
      });
    });

    test('Stack uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should use 'dev' as default
      defaultTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('tap-.*-web-sg'),
      });
    });
  });

  describe('LocalStack Configuration', () => {
    let localStackApp: cdk.App;
    let localStackStack: TapStack;
    let localStackTemplate: Template;
    const originalEnv = process.env;

    beforeEach(() => {
      // Set environment variable to simulate LocalStack
      process.env = { ...originalEnv, AWS_ENDPOINT_URL: 'http://localhost:4566' };
      localStackApp = new cdk.App();
      localStackStack = new TapStack(localStackApp, 'LocalStackTestStack', {
        environmentSuffix: 'local',
        env: {
          account: '000000000000',
          region: 'us-east-1',
        },
      });
      localStackTemplate = Template.fromStack(localStackStack);
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    test('VPC is created in LocalStack mode', () => {
      localStackTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has DESTROY removal policy in LocalStack mode', () => {
      const vpcResources = localStackTemplate.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpcResources);
      expect(vpcKeys.length).toBeGreaterThan(0);

      // In LocalStack mode, DeletionPolicy should be Delete (DESTROY)
      const vpc = vpcResources[vpcKeys[0]];
      expect(vpc.DeletionPolicy).toBe('Delete');
    });

    test('Security Group has DESTROY removal policy in LocalStack mode', () => {
      const sgResources = localStackTemplate.findResources('AWS::EC2::SecurityGroup');
      const sgKeys = Object.keys(sgResources);
      expect(sgKeys.length).toBeGreaterThan(0);

      // In LocalStack mode, DeletionPolicy should be Delete (DESTROY)
      const sg = sgResources[sgKeys[0]];
      expect(sg.DeletionPolicy).toBe('Delete');
    });

    test('IAM Role has DESTROY removal policy in LocalStack mode', () => {
      const roleResources = localStackTemplate.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roleResources);

      // Find the Ec2InstanceRole (not the custom resource handler role)
      const ec2RoleKey = roleKeys.find(key => key.includes('Ec2InstanceRole'));
      expect(ec2RoleKey).toBeDefined();

      const role = roleResources[ec2RoleKey!];
      expect(role.DeletionPolicy).toBe('Delete');
    });

    test('Launch Template has DESTROY removal policy in LocalStack mode', () => {
      const ltResources = localStackTemplate.findResources('AWS::EC2::LaunchTemplate');
      const ltKeys = Object.keys(ltResources);
      expect(ltKeys.length).toBeGreaterThan(0);

      const lt = ltResources[ltKeys[0]];
      expect(lt.DeletionPolicy).toBe('Delete');
    });

    test('Auto Scaling Group has DESTROY removal policy in LocalStack mode', () => {
      const asgResources = localStackTemplate.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgKeys = Object.keys(asgResources);
      expect(asgKeys.length).toBeGreaterThan(0);

      const asg = asgResources[asgKeys[0]];
      expect(asg.DeletionPolicy).toBe('Delete');
    });

    test('Auto Scaling Group uses $Latest version for launch template in LocalStack mode', () => {
      const asgResources = localStackTemplate.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgKeys = Object.keys(asgResources);
      expect(asgKeys.length).toBeGreaterThan(0);

      const asg = asgResources[asgKeys[0]];
      // In LocalStack mode, the version should be overridden to $Latest string
      // instead of Fn::GetAtt which LocalStack doesn't support
      const version = asg.Properties.MixedInstancesPolicy?.LaunchTemplate?.LaunchTemplateSpecification?.Version;
      expect(version).toBe('$Latest');
    });

    test('No NAT Gateway is created in LocalStack mode', () => {
      const natGateways = localStackTemplate.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(0);
    });

    test('Private subnets use PRIVATE_ISOLATED type in LocalStack mode', () => {
      // In LocalStack mode, private subnets should not have routes to NAT Gateway
      // They are PRIVATE_ISOLATED which means no outbound internet access
      const privateSubnets = localStackTemplate.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('IAM Role has no managed policies in LocalStack mode', () => {
      const roleResources = localStackTemplate.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roleResources);

      // Find the Ec2InstanceRole (not the custom resource handler role)
      const ec2RoleKey = roleKeys.find(key => key.includes('Ec2InstanceRole'));
      expect(ec2RoleKey).toBeDefined();

      const role = roleResources[ec2RoleKey!];
      // In LocalStack mode, ManagedPolicyArns should be undefined or empty
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('All resources have correct naming in LocalStack mode', () => {
      const namePrefix = 'tap-local';

      localStackTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${namePrefix}-web-sg`,
      });

      localStackTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${namePrefix}-ec2-role`,
      });

      localStackTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `${namePrefix}-launch-template`,
      });

      localStackTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `${namePrefix}-asg`,
      });
    });
  });
});
import fs from 'fs';
import path from 'path';
import { yamlParse } from 'yaml-cfn';

describe('TapStack CloudFormation Template - LocalStack Pro Compatible Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Load the YAML CloudFormation template using yaml-cfn which supports CloudFormation intrinsic functions
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yamlParse(templateContent);
  });

  describe('Template Structure and Format', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for LocalStack compatible infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'LocalStack Pro compatible infrastructure - VPC with public/private subnets, ALB, and Auto Scaling'
      );
    });

    test('should have metadata section with proper parameter organization', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      
      const ui = template.Metadata['AWS::CloudFormation::Interface'];
      expect(ui.ParameterGroups).toHaveLength(3);
      expect(ui.ParameterLabels).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Networking Infrastructure', () => {
    describe('VPC Configuration', () => {
      test('should create a VPC with proper configuration', () => {
        const vpc = template.Resources.VPC;
        expect(vpc).toBeDefined();
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      });

      test('should have VPC CIDR parameter with proper validation', () => {
        const vpcCidr = template.Parameters.VpcCidr;
        expect(vpcCidr).toBeDefined();
        expect(vpcCidr.Type).toBe('String');
        expect(vpcCidr.Default).toBe('10.0.0.0/16');
        expect(vpcCidr.AllowedPattern).toBeDefined();
      });

      test('should have Internet Gateway and attachment', () => {
        const igw = template.Resources.InternetGateway;
        const igwAttachment = template.Resources.InternetGatewayAttachment;
        
        expect(igw).toBeDefined();
        expect(igw.Type).toBe('AWS::EC2::InternetGateway');
        expect(igwAttachment).toBeDefined();
        expect(igwAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(igwAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(igwAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      });
    });

    describe('Two Availability Zones Requirement', () => {
      test('should create subnets across two availability zones', () => {
        const publicSubnet1 = template.Resources.PublicSubnet1;
        const publicSubnet2 = template.Resources.PublicSubnet2;
        const privateSubnet1 = template.Resources.PrivateSubnet1;
        const privateSubnet2 = template.Resources.PrivateSubnet2;

        // Check AZ selection for public subnets
        expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
        expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });

        // Check AZ selection for private subnets
        expect(privateSubnet1.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
        expect(privateSubnet2.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });
      });
    });

    describe('Public Subnets (2 per AZ)', () => {
      test('should create two public subnets with correct configuration', () => {
        const publicSubnet1 = template.Resources.PublicSubnet1;
        const publicSubnet2 = template.Resources.PublicSubnet2;

        expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');

        // Should enable public IP assignment
        expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);

        // Should reference VPC
        expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(publicSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });

        // Should have different CIDR blocks
        expect(publicSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1Cidr' });
        expect(publicSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2Cidr' });
      });

      test('should have public subnet CIDR parameters', () => {
        const pubSub1Cidr = template.Parameters.PublicSubnet1Cidr;
        const pubSub2Cidr = template.Parameters.PublicSubnet2Cidr;

        expect(pubSub1Cidr.Type).toBe('String');
        expect(pubSub1Cidr.Default).toBe('10.0.1.0/24');
        expect(pubSub2Cidr.Type).toBe('String');
        expect(pubSub2Cidr.Default).toBe('10.0.2.0/24');
      });

      test('should have public route table with internet gateway route', () => {
        const publicRouteTable = template.Resources.PublicRouteTable;
        const defaultPublicRoute = template.Resources.DefaultPublicRoute;

        expect(publicRouteTable).toBeDefined();
        expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
        expect(publicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

        expect(defaultPublicRoute).toBeDefined();
        expect(defaultPublicRoute.Type).toBe('AWS::EC2::Route');
        expect(defaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(defaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      test('should associate public subnets with public route table', () => {
        const pubAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
        const pubAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;

        expect(pubAssoc1).toBeDefined();
        expect(pubAssoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(pubAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
        expect(pubAssoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });

        expect(pubAssoc2).toBeDefined();
        expect(pubAssoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(pubAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        expect(pubAssoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });
    });

    describe('Private Subnets (2 per AZ)', () => {
      test('should create two private subnets with correct configuration', () => {
        const privateSubnet1 = template.Resources.PrivateSubnet1;
        const privateSubnet2 = template.Resources.PrivateSubnet2;

        expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');

        // Should NOT enable public IP assignment
        expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();

        // Should reference VPC
        expect(privateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(privateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });

        // Should have different CIDR blocks
        expect(privateSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1Cidr' });
        expect(privateSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2Cidr' });
      });

      test('should have private subnet CIDR parameters', () => {
        const privSub1Cidr = template.Parameters.PrivateSubnet1Cidr;
        const privSub2Cidr = template.Parameters.PrivateSubnet2Cidr;

        expect(privSub1Cidr.Type).toBe('String');
        expect(privSub1Cidr.Default).toBe('10.0.3.0/24');
        expect(privSub2Cidr.Type).toBe('String');
        expect(privSub2Cidr.Default).toBe('10.0.4.0/24');
      });

      test('should have private route tables', () => {
        const privateRouteTable1 = template.Resources.PrivateRouteTable1;
        const privateRouteTable2 = template.Resources.PrivateRouteTable2;

        expect(privateRouteTable1).toBeDefined();
        expect(privateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
        expect(privateRouteTable2).toBeDefined();
        expect(privateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
      });

      test('should associate private subnets with respective route tables', () => {
        const privAssoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
        const privAssoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

        expect(privAssoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
        expect(privAssoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });

        expect(privAssoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
        expect(privAssoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
      });
    });

    describe('Network ACLs', () => {
      test('should create public Network ACL with appropriate rules', () => {
        const publicNacl = template.Resources.PublicNetworkAcl;
        const publicInbound = template.Resources.PublicInboundRule;
        const publicOutbound = template.Resources.PublicOutboundRule;

        expect(publicNacl.Type).toBe('AWS::EC2::NetworkAcl');
        expect(publicNacl.Properties.VpcId).toEqual({ Ref: 'VPC' });

        expect(publicInbound.Type).toBe('AWS::EC2::NetworkAclEntry');
        expect(publicInbound.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
        expect(publicInbound.Properties.RuleNumber).toBe(100);
        expect(publicInbound.Properties.Protocol).toBe(-1);
        expect(publicInbound.Properties.RuleAction).toBe('allow');
        expect(publicInbound.Properties.CidrBlock).toBe('0.0.0.0/0');

        expect(publicOutbound.Type).toBe('AWS::EC2::NetworkAclEntry');
        expect(publicOutbound.Properties.Egress).toBe(true);
        expect(publicOutbound.Properties.CidrBlock).toBe('0.0.0.0/0');
      });

      test('should create private Network ACL with restrictive rules', () => {
        const privateNacl = template.Resources.PrivateNetworkAcl;
        const privateInbound = template.Resources.PrivateInboundRule;
        const privateOutbound = template.Resources.PrivateOutboundRule;

        expect(privateNacl.Type).toBe('AWS::EC2::NetworkAcl');
        expect(privateNacl.Properties.VpcId).toEqual({ Ref: 'VPC' });

        expect(privateInbound.Type).toBe('AWS::EC2::NetworkAclEntry');
        expect(privateInbound.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
        expect(privateInbound.Properties.RuleNumber).toBe(100);
        expect(privateInbound.Properties.Protocol).toBe(-1);
        expect(privateInbound.Properties.RuleAction).toBe('allow');
        // Private NACL inbound should only allow VPC traffic
        expect(privateInbound.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });

        expect(privateOutbound.Type).toBe('AWS::EC2::NetworkAclEntry');
        expect(privateOutbound.Properties.Egress).toBe(true);
        // Private NACL outbound should allow internet for updates
        expect(privateOutbound.Properties.CidrBlock).toBe('0.0.0.0/0');
      });

      test('should associate NACLs with correct subnets', () => {
        const pubAssoc1 = template.Resources.PublicSubnetNetworkAclAssociation1;
        const pubAssoc2 = template.Resources.PublicSubnetNetworkAclAssociation2;
        const privAssoc1 = template.Resources.PrivateSubnetNetworkAclAssociation1;
        const privAssoc2 = template.Resources.PrivateSubnetNetworkAclAssociation2;

        expect(pubAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
        expect(pubAssoc1.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
        expect(pubAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        expect(pubAssoc2.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });

        expect(privAssoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
        expect(privAssoc1.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
        expect(privAssoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
        expect(privAssoc2.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      });
    });

    describe('Security Groups', () => {
      test('should create ALB Security Group with HTTP access rules', () => {
        const albSg = template.Resources.ALBSecurityGroup;
        expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(albSg.Properties.VpcId).toEqual({ Ref: 'VPC' });
        
        const ingressRules = albSg.Properties.SecurityGroupIngress;
        const httpRule = ingressRules[0];
        
        // Should allow HTTP from internet
        expect(httpRule.IpProtocol).toBe('tcp');
        expect(httpRule.FromPort).toBe(80);
        expect(httpRule.ToPort).toBe(80);
        expect(httpRule.CidrIp).toBe('0.0.0.0/0');
        expect(httpRule.Description).toBe('HTTP from internet');
      });

      test('should create EC2 Security Group that only accepts ALB traffic', () => {
        const ec2Sg = template.Resources.EC2SecurityGroup;
        expect(ec2Sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(ec2Sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
        
        const ingressRules = ec2Sg.Properties.SecurityGroupIngress;
        const httpRule = ingressRules[0];
        
        // Should only accept traffic from ALB security group
        expect(httpRule.IpProtocol).toBe('tcp');
        expect(httpRule.FromPort).toBe(80);
        expect(httpRule.ToPort).toBe(80);
        expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
        expect(httpRule.Description).toBe('HTTP from ALB');

        // Should have outbound rules for internet access
        const egressRules = ec2Sg.Properties.SecurityGroupEgress;
        expect(egressRules).toHaveLength(4); // HTTP, HTTPS, DNS TCP, DNS UDP
        
        const httpEgress = egressRules[0];
        expect(httpEgress.IpProtocol).toBe('tcp');
        expect(httpEgress.FromPort).toBe(80);
        expect(httpEgress.ToPort).toBe(80);
        expect(httpEgress.CidrIp).toBe('0.0.0.0/0');
        expect(httpEgress.Description).toBe('HTTP to internet for updates');
      });
    });
  });

  describe('Environment Isolation', () => {
    test('should support prod/dev environments via Environment parameter', () => {
      const envParam = template.Parameters.Environment;

      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['prod', 'dev']);
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe('Environment (prod or dev)');
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envParam.ConstraintDescription).toBe('Must contain only alphanumeric characters.');
    });

    test('should have environment-specific mappings for scaling', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      
      expect(envConfig.dev).toBeDefined();
      expect(envConfig.prod).toBeDefined();
      
      // Dev environment should have smaller scale
      expect(envConfig.dev.MinSize).toBe('1');
      expect(envConfig.dev.MaxSize).toBe('3');
      expect(envConfig.dev.DesiredCapacity).toBe('1');
      
      // Prod environment should have larger scale
      expect(envConfig.prod.MinSize).toBe('2');
      expect(envConfig.prod.MaxSize).toBe('6');
      expect(envConfig.prod.DesiredCapacity).toBe('2');
    });

    test('should use Environment in resource naming for isolation', () => {
      const vpc = template.Resources.VPC;
      const asg = template.Resources.AutoScalingGroup;
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${Environment}-291431-vpc' }
      });
      
      expect(asg.Properties.AutoScalingGroupName).toEqual({
        'Fn::Sub': '${Environment}-291431-asg'
      });

      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': '${Environment}-291431-alb'
      });
    });

    test('should tag all resources with Environment', () => {
      const vpc = template.Resources.VPC;
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const albSg = template.Resources.ALBSecurityGroup;
      
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
      
      expect(publicSubnet1.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });

      expect(albSg.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
    });
  });

  describe('Compute in Private Subnets', () => {
    test('should deploy EC2 instances in private subnets only', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should ensure EC2 instances do not have public IPs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      // Private subnets should not map public IPs
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should use Launch Template with proper instance configuration', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateName).toEqual({
        'Fn::Sub': '${Environment}-291431-launch-template'
      });
      
      const ltData = launchTemplate.Properties.LaunchTemplateData;
      expect(ltData.ImageId).toEqual({ Ref: 'AmiId' });
      expect(ltData.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(ltData.SecurityGroupIds).toEqual([{ Ref: 'EC2SecurityGroup' }]);
      expect(ltData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('should have valid instance type parameter', () => {
      const instanceType = template.Parameters.InstanceType;
      
      expect(instanceType.Type).toBe('String');
      expect(instanceType.Default).toBe('t3.micro');
      expect(instanceType.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      expect(instanceType.Description).toBe('EC2 instance type');
    });

    test('should have AMI ID parameter for LocalStack compatibility', () => {
      const amiParam = template.Parameters.AmiId;
      
      expect(amiParam.Type).toBe('AWS::EC2::Image::Id');
      expect(amiParam.Default).toBe('ami-0c55b159cbfafe1f0');
      expect(amiParam.Description).toBe('AMI ID for EC2 instances (Amazon Linux 2 compatible)');
    });

    test('should have user data script for web server setup', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData;
      
      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toBeDefined();
      
      const userDataScript = userData['Fn::Base64']['Fn::Sub'];
      expect(userDataScript).toContain('yum update -y');
      expect(userDataScript).toContain('yum install -y httpd');
      expect(userDataScript).toContain('systemctl start httpd');
      expect(userDataScript).toContain('systemctl enable httpd');
    });

    test('should configure Auto Scaling Group with environment-specific scaling', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.MinSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MinSize']
      });
      expect(asg.Properties.MaxSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MaxSize']
      });
      expect(asg.Properties.DesiredCapacity).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'DesiredCapacity']
      });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should use $Latest version for Launch Template in Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toBe('$Latest');
    });
  });

  describe('Load Balancing', () => {
    test('should deploy ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
      expect(alb.Properties.SecurityGroups).toEqual([
        { Ref: 'ALBSecurityGroup' }
      ]);
    });

    test('should create Target Group with proper health checks', () => {
      const tg = template.Resources.TargetGroup;
      
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should create HTTP listener with proper configuration', () => {
      const httpListener = template.Resources.ALBListenerHTTP;
      
      expect(httpListener).toBeDefined();
      expect(httpListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpListener.Properties.Protocol).toBe('HTTP');
      expect(httpListener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(httpListener.Properties.DefaultActions).toEqual([
        {
          Type: 'forward',
          TargetGroupArn: { Ref: 'TargetGroup' }
        }
      ]);
    });

    test('should connect Auto Scaling Group to Target Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.TargetGroupARNs).toEqual([
        { Ref: 'TargetGroup' }
      ]);
    });
  });

  describe('Security Implementation', () => {
    test('should implement IAM roles with least privilege', () => {
      const ec2Role = template.Resources.EC2Role;
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
      
      // Check custom policy for minimal CloudWatch logs permissions
      const customPolicy = ec2Role.Properties.Policies[0];
      expect(customPolicy.PolicyName).toEqual({
        'Fn::Sub': '${Environment}-291431-ec2-policy'
      });
      expect(customPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(customPolicy.PolicyDocument.Statement[0].Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]);
    });

    test('should create instance profile for EC2 role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([
        { Ref: 'EC2Role' }
      ]);
    });
  });

  describe('Outputs and Exports', () => {
    test('should provide all essential infrastructure outputs', () => {
      const outputs = template.Outputs;
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id', 
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBDNSName',
        'ALBHostedZoneId',
        'AutoScalingGroupName',
        'ALBHttpUrl'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
    });

    test('should export outputs with environment-specific names', () => {
      const vpcOutput = template.Outputs.VPCId;
      const albOutput = template.Outputs.ALBDNSName;
      const asgOutput = template.Outputs.AutoScalingGroupName;
      
      expect(vpcOutput.Export.Name).toEqual({
        'Fn::Sub': '${Environment}-VPC-ID'
      });
      expect(albOutput.Export.Name).toEqual({
        'Fn::Sub': '${Environment}-ALB-DNSName'
      });
      expect(asgOutput.Export.Name).toEqual({
        'Fn::Sub': '${Environment}-ASG-Name'
      });
    });
  });

  describe('Template Resource Count and Completeness', () => {
    test('should have expected number of resources for LocalStack compatible infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      
      // Expected resources for LocalStack compatible infrastructure:
      // VPC, IGW, IGW Attachment, 4 subnets, 
      // 3 route tables, 1 route, 4 subnet route associations,
      // 2 NACLs, 4 NACL entries, 4 NACL subnet associations,
      // 2 security groups, IAM role, instance profile, launch template, 
      // ASG, ALB, target group, 1 listener = 30+ resources
      expect(resourceCount).toBeGreaterThanOrEqual(28);
    });

    test('should have expected number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(8); // Environment, VpcCidr, 4 subnet CIDRs, InstanceType, AmiId
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9); // Core infrastructure outputs
    });

    test('should have environment mappings', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });
  });

  describe('Template Best Practices', () => {
    test('should have comprehensive resource tagging', () => {
      const taggedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable',
        'PrivateRouteTable1', 'PrivateRouteTable2', 'PublicNetworkAcl',
        'PrivateNetworkAcl', 'ALBSecurityGroup', 'EC2SecurityGroup',
        'EC2Role', 'ApplicationLoadBalancer', 'TargetGroup'
      ];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          expect(resource.Properties.Tags).toContainEqual({
            Key: 'Environment',
            Value: { Ref: 'Environment' }
          });
        }
      });
    });

    test('should follow naming conventions with environment prefix', () => {
      const namedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'ApplicationLoadBalancer',
        'AutoScalingGroup', 'LaunchTemplate'
      ];
      
      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && (resource.Properties.Name || resource.Properties.Tags)) {
          // Check if resource name includes environment
          const nameProperty = resource.Properties.Name || 
            (resource.Properties.Tags && resource.Properties.Tags.find((tag: any) => tag.Key === 'Name')?.Value);
          
          if (nameProperty && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${Environment}');
            expect(nameProperty['Fn::Sub']).toContain('291431'); // Project identifier
          }
        }
      });
    });

    test('should use intrinsic functions properly for cross-region deployment', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      
      // Should use GetAZs for region-agnostic AZ selection
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');
    });

    test('should have proper dependencies defined', () => {
      const defaultPublicRoute = template.Resources.DefaultPublicRoute;
      
      // Public route should depend on IGW attachment
      expect(defaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });
  });
});

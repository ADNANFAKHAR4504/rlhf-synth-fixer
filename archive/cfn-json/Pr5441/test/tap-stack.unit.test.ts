import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template - Comprehensive Cloud Environment', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create VPC with correct tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'VPC-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('CloudEnvironmentSetup');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway with correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 1 in VPC', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public subnet 2 in VPC', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 1 in VPC', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private subnet 2 in VPC', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Dual NAT Gateway Configuration', () => {
    test('should create NAT Gateway 1 EIP with vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP1;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway 2 EIP with vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP2;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway 1 in public subnet 1', () => {
      const natGateway = template.Resources.NATGateway1;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP1', 'AllocationId']
      });
    });

    test('should create NAT Gateway 2 in public subnet 2', () => {
      const natGateway = template.Resources.NATGateway2;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP2', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to internet gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should associate public subnet 1 with public route table', () => {
      const association = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should associate public subnet 2 with public route table', () => {
      const association = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should create private route table 1 in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable1;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route table 2 in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable2;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route 1 to NAT gateway 1', () => {
      const route = template.Resources.PrivateRoute1;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    });

    test('should create private route 2 to NAT gateway 2', () => {
      const route = template.Resources.PrivateRoute2;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });

    test('should associate private subnet 1 with private route table 1', () => {
      const association = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    });

    test('should associate private subnet 2 with private route table 2', () => {
      const association = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  describe('Network ACL Configuration', () => {
    test('should create public Network ACL in VPC', () => {
      const nacl = template.Resources.PublicNetworkAcl;
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(nacl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public Network ACL with HTTP inbound rule', () => {
      const entry = template.Resources.PublicNetworkAclInboundHTTP;
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      expect(entry.Properties.RuleNumber).toBe(100);
      expect(entry.Properties.Protocol).toBe(6);
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.CidrBlock).toBe('0.0.0.0/0');
      expect(entry.Properties.PortRange.From).toBe(80);
      expect(entry.Properties.PortRange.To).toBe(80);
    });

    test('should create public Network ACL with HTTPS inbound rule', () => {
      const entry = template.Resources.PublicNetworkAclInboundHTTPS;
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.RuleNumber).toBe(110);
      expect(entry.Properties.Protocol).toBe(6);
      expect(entry.Properties.PortRange.From).toBe(443);
      expect(entry.Properties.PortRange.To).toBe(443);
    });

    test('should create public Network ACL with ephemeral inbound rule', () => {
      const entry = template.Resources.PublicNetworkAclInboundEphemeral;
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.RuleNumber).toBe(120);
      expect(entry.Properties.Protocol).toBe(6);
      expect(entry.Properties.PortRange.From).toBe(1024);
      expect(entry.Properties.PortRange.To).toBe(65535);
    });

    test('should create private Network ACL in VPC', () => {
      const nacl = template.Resources.PrivateNetworkAcl;
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(nacl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private Network ACL with VPC CIDR inbound rule', () => {
      const entry = template.Resources.PrivateNetworkAclInboundVPC;
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      expect(entry.Properties.RuleNumber).toBe(100);
      expect(entry.Properties.Protocol).toBe(-1);
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should associate public subnet 1 with public Network ACL', () => {
      const association = template.Resources.PublicSubnet1NetworkAclAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(association.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
    });

    test('should associate private subnet 1 with private Network ACL', () => {
      const association = template.Resources.PrivateSubnet1NetworkAclAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(association.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
    });
  });

  describe('ALB Security Group Configuration', () => {
    test('should create ALB security group in VPC', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create ALB security group with HTTP and HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('HTTP access from anywhere');

      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('HTTPS access from anywhere');
    });

    test('should create ALB security group with all outbound traffic allowed', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('Web Server Security Group Configuration', () => {
    test('should create web server security group in VPC', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create web server security group allowing traffic only from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(httpRule.Description).toBe('HTTP access from ALB');

      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(httpsRule.Description).toBe('HTTPS access from ALB');
    });

    test('should create web server security group with all outbound traffic allowed', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create Application Load Balancer in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.IpAddressType).toBe('ipv4');
    });

    test('should create ALB with correct security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toHaveLength(1);
      expect(alb.Properties.SecurityGroups[0]).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should create ALB spanning both public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create target group with correct health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should create HTTP listener forwarding to target group', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 IAM role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create EC2 IAM role with CloudWatch and SSM managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should create instance profile referencing EC2 role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Launch Template Configuration', () => {
    test('should create launch template with correct AMI and instance type', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
    });

    test('should create launch template with IAM instance profile', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('should create launch template with web server security group', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toHaveLength(1);
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds[0]).toEqual({
        Ref: 'WebServerSecurityGroup'
      });
    });

    test('should create launch template with monitoring enabled', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('should create launch template with correct UserData script', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();

      const userData = launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      const userDataString = userData['Fn::Join'][1].join('');
      expect(userDataString).toContain('yum update -y');
      expect(userDataString).toContain('yum install -y httpd');
      expect(userDataString).toContain('systemctl start httpd');
      expect(userDataString).toContain('systemctl enable httpd');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create Auto Scaling Group with correct launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({ 'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'] });
    });

    test('should create Auto Scaling Group with correct size configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('should create Auto Scaling Group spanning both private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should create Auto Scaling Group with ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should create Auto Scaling Group registered with target group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toHaveLength(1);
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('Auto Scaling Policies Configuration', () => {
    test('should create scale up policy with correct adjustment', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe(1);
      expect(policy.Properties.Cooldown).toBe(300);
      expect(policy.Properties.AutoScalingGroupName).toEqual({ Ref: 'AutoScalingGroup' });
    });

    test('should create scale down policy with correct adjustment', () => {
      const policy = template.Resources.ScaleDownPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe(-1);
      expect(policy.Properties.Cooldown).toBe(300);
      expect(policy.Properties.AutoScalingGroupName).toEqual({ Ref: 'AutoScalingGroup' });
    });
  });

  describe('CloudWatch Alarms for Auto Scaling', () => {
    test('should create CPU high alarm with 70% threshold', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create CPU high alarm monitoring Auto Scaling Group', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleUpPolicy' });
    });

    test('should create CPU low alarm with 30% threshold', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should create CPU low alarm monitoring Auto Scaling Group', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleDownPolicy' });
    });

    test('should create unhealthy target alarm for ALB', () => {
      const alarm = template.Resources.UnhealthyTargetAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should create NAT Gateway 1 error alarm', () => {
      const alarm = template.Resources.NATGatewayErrorAlarm1;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ErrorPortAllocation');
      expect(alarm.Properties.Namespace).toBe('AWS/NATGateway');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'NATGateway1' });
    });

    test('should create NAT Gateway 2 error alarm', () => {
      const alarm = template.Resources.NATGatewayErrorAlarm2;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ErrorPortAllocation');
      expect(alarm.Properties.Namespace).toBe('AWS/NATGateway');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'NATGateway2' });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log role with correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create VPC Flow Log role with CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogGroups');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogStreams');
    });

    test('should create VPC Flow Log Group with 7-day retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should create VPC Flow Log with correct configuration', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
      });
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail S3 bucket with encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create CloudTrail S3 bucket with public access blocked', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create CloudTrail with multi-region enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('should create CloudTrail with S3 bucket configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });
  });
});

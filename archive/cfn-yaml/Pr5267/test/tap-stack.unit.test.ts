import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template - Production Web Application Infrastructure', () => {
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

    test('should create VPC with prod- naming convention', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'prod-vpc-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('ProductionWebApp');
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
    test('should create public subnet 1 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with correct CIDR and AZ', () => {
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
    test('should create private subnet 1 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with correct CIDR and AZ', () => {
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
    test('should create NAT Gateway 1 EIP with vpc domain and dependency', () => {
      const eip = template.Resources.NATGatewayEIP1;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway 2 EIP with vpc domain and dependency', () => {
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

  describe('ALB Security Group Configuration', () => {
    test('should create ALB security group in VPC', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create ALB security group with HTTP and HTTPS access', () => {
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
      expect(egressRule.IpProtocol).toBe(-1);
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

    test('should create web server security group allowing HTTP only from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(httpRule.Description).toBe('HTTP access from ALB');
    });

    test('should create web server security group with all outbound traffic allowed', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe(-1);
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('RDS Security Group Configuration', () => {
    test('should create RDS security group in VPC', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create RDS security group allowing MySQL only from web servers', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(mysqlRule.Description).toBe('MySQL access from web servers');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 IAM role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
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

    test('should create EC2 IAM role with S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.Policies).toHaveLength(2);

      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(1);

      const s3Statement = s3Policy.PolicyDocument.Statement[0];
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
      expect(s3Statement.Resource).toHaveLength(2);
      expect(s3Statement.Resource[0]).toEqual({ 'Fn::GetAtt': ['S3LoggingBucket', 'Arn'] });
      expect(s3Statement.Resource[1]).toEqual({ 'Fn::Sub': '${S3LoggingBucket.Arn}/*' });
    });

    test('should create EC2 IAM role with Secrets Manager read access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const secretsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SecretsManagerReadAccess');

      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Version).toBe('2012-10-17');
      expect(secretsPolicy.PolicyDocument.Statement).toHaveLength(1);

      const secretsStatement = secretsPolicy.PolicyDocument.Statement[0];
      expect(secretsStatement.Effect).toBe('Allow');
      expect(secretsStatement.Action).toContain('secretsmanager:GetSecretValue');
      expect(secretsStatement.Action).toContain('secretsmanager:DescribeSecret');
      expect(secretsStatement.Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('should create instance profile referencing EC2 role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('ACM SSL Certificate Configuration', () => {
    test('should create ACM certificate with DNS validation', () => {
      const cert = template.Resources.SSLCertificate;
      expect(cert.Type).toBe('AWS::CertificateManager::Certificate');
      expect(cert.Condition).toBe('HasHostedZone');
      expect(cert.Properties.DomainName).toEqual({ Ref: 'DomainName' });
      expect(cert.Properties.ValidationMethod).toBe('DNS');
    });

    test('should create ACM certificate with domain validation options', () => {
      const cert = template.Resources.SSLCertificate;
      expect(cert.Properties.DomainValidationOptions).toHaveLength(1);
      expect(cert.Properties.DomainValidationOptions[0].DomainName).toEqual({ Ref: 'DomainName' });
      expect(cert.Properties.DomainValidationOptions[0].HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create ALB with correct configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.IpAddressType).toBe('ipv4');
    });

    test('should create ALB spanning both public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create ALB with ALB security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toHaveLength(1);
      expect(alb.Properties.SecurityGroups[0]).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('ALB Target Group Configuration', () => {
    test('should create target group with correct configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create target group with health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });
  });

  describe('ALB Listener Configuration', () => {
    test('should create HTTP listener with redirect to HTTPS', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('redirect');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.Protocol).toBe('HTTPS');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.Port).toBe('443');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('should create HTTPS listener with SSL certificate', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Condition).toBe('HasHostedZone');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS13-1-2-2021-06');
      expect(listener.Properties.Certificates).toHaveLength(1);
      expect(listener.Properties.Certificates[0].CertificateArn).toEqual({ Ref: 'SSLCertificate' });
    });

    test('should create HTTPS listener forwarding to target group', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
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

    test('should create launch template with UserData script', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();

      const userDataString = launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      expect(userDataString).toContain('yum update -y');
      expect(userDataString).toContain('yum install -y httpd mysql amazon-cloudwatch-agent amazon-ssm-agent');
      expect(userDataString).toContain('systemctl start httpd');
      expect(userDataString).toContain('systemctl enable httpd');
      expect(userDataString).toContain('systemctl enable amazon-ssm-agent');
      expect(userDataString).toContain('systemctl start amazon-ssm-agent');
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
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'MinSize' });
    });

    test('should create Auto Scaling Group spanning both public subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create Auto Scaling Group with target group ARN', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toHaveLength(1);
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should create Auto Scaling Group with ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
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
    test('should create CPU high alarm with correct configuration', () => {
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

    test('should create CPU low alarm with correct configuration', () => {
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
  });

  describe('ALB 5xx Error CloudWatch Alarm', () => {
    test('should create ALB 5xx error alarm with correct configuration', () => {
      const alarm = template.Resources.ALB5xxErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('HTTPCode_Target_5XX_Count');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create ALB 5xx error alarm monitoring load balancer', () => {
      const alarm = template.Resources.ALB5xxErrorAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('LoadBalancer');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'LoadBalancerFullName']
      });
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create DB secret for RDS credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should create DB secret with auto-generated password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('should create DB secret with prod- naming convention', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'prod-rds-credentials-${EnvironmentSuffix}'
      });
      expect(secret.Properties.Description).toBe('RDS MySQL database master credentials');
    });
  });

  describe('DB Subnet Group Configuration', () => {
    test('should create DB subnet group spanning both private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should create DB subnet group with correct description', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS instance');
    });
  });

  describe('RDS Instance Configuration', () => {
    test('should create RDS instance with correct engine configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceClass' });
    });

    test('should create RDS instance with credentials from Secrets Manager', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toBe('admin');
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
      expect(rds.Properties.DBName).toEqual({ Ref: 'DBName' });
    });

    test('should create RDS instance with storage encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('should create RDS instance with Multi-AZ deployment enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should create RDS instance not publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should create RDS instance with 7-day backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should create RDS instance in DB subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('should create RDS instance with RDS security group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toHaveLength(1);
      expect(rds.Properties.VPCSecurityGroups[0]).toEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('should create RDS instance with Delete deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 logging bucket with prod- naming convention', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'prod-app-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      });
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with access logging configured', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'S3AccessLogsBucket'
      });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('app-bucket-logs/');
    });

    test('should create S3 bucket with public access blocked', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with server-side encryption', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('S3 Access Logs Bucket Configuration', () => {
    test('should create S3 access logs bucket with correct configuration', () => {
      const bucket = template.Resources.S3AccessLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'prod-access-logs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      });
    });

    test('should create S3 access logs bucket with lifecycle policy', () => {
      const bucket = template.Resources.S3AccessLogsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Id).toBe('DeleteOldLogs');
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should create S3 access logs bucket with ownership controls', () => {
      const bucket = template.Resources.S3AccessLogsBucket;
      expect(bucket.Properties.OwnershipControls.Rules).toHaveLength(1);
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });
  });
});
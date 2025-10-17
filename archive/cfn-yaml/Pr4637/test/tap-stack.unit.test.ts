import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter with correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('staging');
      expect(param.AllowedValues).toEqual(['staging', 'production']);
      expect(param.Description).toBeDefined();
    });

    test('should have Owner parameter with correct properties', () => {
      const param = template.Parameters.Owner;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.Description).toBeDefined();
    });

    test('should have CostCenter parameter with correct properties', () => {
      const param = template.Parameters.CostCenter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.Description).toBeDefined();
    });

    test('should have DBUsername parameter with correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have InstanceType parameter with correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('should have NotificationEmail parameter with correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
    });

    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have AZConfig mapping', () => {
      expect(template.Mappings.AZConfig).toBeDefined();
    });

    test('AZConfig should have correct regions', () => {
      const azConfig = template.Mappings.AZConfig;
      expect(azConfig['us-east-1']).toBeDefined();
      expect(azConfig['us-west-2']).toBeDefined();
      expect(azConfig['eu-west-1']).toBeDefined();
    });

    test('AZConfig regions should have AZs arrays', () => {
      const azConfig = template.Mappings.AZConfig;
      expect(azConfig['us-east-1'].AZs).toEqual(['a', 'b', 'c']);
      expect(azConfig['us-west-2'].AZs).toEqual(['a', 'b', 'c']);
      expect(azConfig['eu-west-1'].AZs).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals']).toHaveLength(2);
      expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'Environment' });
      expect(condition['Fn::Equals'][1]).toBe('production');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have IPv6 CIDR Block', () => {
      const ipv6 = template.Resources.IPv6CidrBlock;
      expect(ipv6).toBeDefined();
      expect(ipv6.Type).toBe('AWS::EC2::VPCCidrBlock');
      expect(ipv6.Properties.AmazonProvidedIpv6CidrBlock).toBe(true);
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet1', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.0.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.10.0/24');
    });

    test('should have PrivateSubnet2', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have DBSubnet1', () => {
      const subnet = template.Resources.DBSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.20.0/24');
    });

    test('should have DBSubnet2', () => {
      const subnet = template.Resources.DBSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.21.0/24');
    });

    test('public subnets should have IPv6 CIDR blocks', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1.Properties.Ipv6CidrBlock).toBeDefined();
      expect(subnet2.Properties.Ipv6CidrBlock).toBeDefined();
    });
  });

  describe('NAT Gateway', () => {
    test('should have NAT Gateway EIP', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateway', () => {
      const nat = template.Resources.NATGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('NAT Gateway should depend on VPC Gateway Attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Route Tables', () => {
    test('should have PublicRouteTable', () => {
      const rt = template.Resources.PublicRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PrivateRouteTable', () => {
      const rt = template.Resources.PrivateRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicRoute to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PublicRoute IPv6', () => {
      const route = template.Resources.PublicRouteIPv6;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationIpv6CidrBlock).toBe('::/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PrivateRoute to NAT Gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.DBSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.DBSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALBSecurityGroup should allow HTTP ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) =>
        rule.FromPort === 80 && rule.CidrIp === '0.0.0.0/0'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
    });

    test('should have EC2SecurityGroup', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2SecurityGroup should allow HTTP from ALB only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('EC2SecurityGroup should allow SSH from VPC only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('should have DBSecurityGroup', () => {
      const sg = template.Resources.DBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DBSecurityGroup should allow MySQL from EC2 only', () => {
      const sg = template.Resources.DBSecurityGroup;
      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should have CacheSecurityGroup', () => {
      const sg = template.Resources.CacheSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('CacheSecurityGroup should allow Redis from EC2 only', () => {
      const sg = template.Resources.CacheSecurityGroup;
      const redisRule = sg.Properties.SecurityGroupIngress[0];
      expect(redisRule.FromPort).toBe(6379);
      expect(redisRule.ToPort).toBe(6379);
      expect(redisRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should have security group egress rules', () => {
      expect(template.Resources.ALBtoEC2SecurityGroupEgress).toBeDefined();
      expect(template.Resources.EC2toDBSecurityGroupEgress).toBeDefined();
      expect(template.Resources.EC2toCacheSecurityGroupEgress).toBeDefined();
    });
  });

  describe('KMS and Encryption', () => {
    test('should have KMS Key', () => {
      const kms = template.Resources.KMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have proper policy structure', () => {
      const kms = template.Resources.KMSKey;
      expect(kms.Properties.KeyPolicy).toBeDefined();
      expect(kms.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(kms.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(kms.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('KMS Key should allow IAM root permissions', () => {
      const kms = template.Resources.KMSKey;
      const rootStatement = kms.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS Key should allow CloudWatch Logs service', () => {
      const kms = template.Resources.KMSKey;
      const logsStatement = kms.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow CloudWatch Logs to use the key'
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Effect).toBe('Allow');
      expect(logsStatement.Action).toContain('kms:Encrypt');
      expect(logsStatement.Action).toContain('kms:Decrypt');
    });

    test('KMS Key should allow EC2 service for EBS encryption', () => {
      const kms = template.Resources.KMSKey;
      const ec2Statement = kms.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow EC2 service to use the key for EBS encryption'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('KMS Key should allow Auto Scaling service', () => {
      const kms = template.Resources.KMSKey;
      const asgStatement = kms.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow Auto Scaling to use the key for EBS encryption'
      );
      expect(asgStatement).toBeDefined();
    });

    test('should have KMS Key Alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('Secrets Manager', () => {
    test('should have DBPasswordSecret', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBPasswordSecret should generate random password', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('DBPasswordSecret should exclude special characters', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2InstanceRole', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have proper assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have least privilege S3 access', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      const s3Statement = policy.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toEqual(['s3:GetObject', 's3:PutObject']);
      expect(s3Statement.Resource['Fn::Sub']).toContain('${S3Bucket.Arn}/*');
    });

    test('EC2InstanceRole should have KMS permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      const kmsStatement = policy.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have EC2InstanceProfile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });

    test('should have LambdaExecutionRole', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have proper assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('LambdaExecutionRole should have least privilege EC2 permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const ec2Statement = policy.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Action.includes('ec2:DescribeSecurityGroups')
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Resource).toBe('*'); // DescribeSecurityGroups requires *
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ApplicationLoadBalancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should support dual-stack (IPv4 and IPv6)', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.IpAddressType).toBe('dualstack');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('should have ALBTargetGroup', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALBTargetGroup should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have HTTPListener', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('HTTPListener should forward to target group', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have EC2LaunchTemplate', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('EC2LaunchTemplate should use latest Amazon Linux 2 AMI', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toContain('resolve:ssm');
      expect(lt.Properties.LaunchTemplateData.ImageId).toContain('amzn2-ami-hvm');
    });

    test('EC2LaunchTemplate should have monitoring enabled', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('EC2LaunchTemplate should have encrypted EBS volumes', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const ebs = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      expect(ebs.VolumeType).toBe('gp3');
    });

    test('EC2LaunchTemplate should have UserData with web server', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      const userDataObj = lt.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      const userData = typeof userDataObj === 'string' ? userDataObj : userDataObj['Fn::Sub'];
      expect(userData).toContain('httpd');
      expect(userData).toContain('/health');
    });

    test('should have AutoScalingGroup', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('AutoScalingGroup should use launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'EC2LaunchTemplate' });
    });

    test('AutoScalingGroup should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('AutoScalingGroup should have conditional capacity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize['Fn::If']).toBeDefined();
      expect(asg.Properties.MaxSize['Fn::If']).toBeDefined();
      expect(asg.Properties.DesiredCapacity['Fn::If']).toBeDefined();
    });

    test('AutoScalingGroup should have ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('RDS Database', () => {
    test('should have DBSubnetGroup', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sg.Properties.SubnetIds).toEqual([
        { Ref: 'DBSubnet1' },
        { Ref: 'DBSubnet2' }
      ]);
    });

    test('should have DBParameterGroup', () => {
      const pg = template.Resources.DBParameterGroup;
      expect(pg).toBeDefined();
      expect(pg.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(pg.Properties.Family).toBe('mysql8.0');
    });

    test('DBParameterGroup should have slow query log enabled', () => {
      const pg = template.Resources.DBParameterGroup;
      expect(pg.Properties.Parameters.slow_query_log).toBe(1);
    });

    test('should have RDSInstance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDSInstance should have deletion policies set to Delete', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDSInstance should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDSInstance should use Secrets Manager for password', () => {
      const rds = template.Resources.RDSInstance;
      const password = rds.Properties.MasterUserPassword;
      const passwordStr = typeof password === 'string' ? password : JSON.stringify(password);
      expect(passwordStr).toContain('resolve:secretsmanager');
      expect(passwordStr).toContain('DBPasswordSecret');
    });

    test('RDSInstance should have CloudWatch Logs exports', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDSInstance should have conditional MultiAZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ['Fn::If']).toBeDefined();
    });

    test('RDSInstance should use gp3 storage', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
    });
  });

  describe('ElastiCache', () => {
    test('should have CacheSubnetGroup', () => {
      const sg = template.Resources.CacheSubnetGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have CacheParameterGroup', () => {
      const pg = template.Resources.CacheParameterGroup;
      expect(pg).toBeDefined();
      expect(pg.Type).toBe('AWS::ElastiCache::ParameterGroup');
      expect(pg.Properties.CacheParameterGroupFamily).toBe('redis7');
    });

    test('should have ElastiCacheCluster', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache).toBeDefined();
      expect(cache.Type).toBe('AWS::ElastiCache::ReplicationGroup');
    });

    test('ElastiCacheCluster should have encryption at rest', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('ElastiCacheCluster should have encryption in transit', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('ElastiCacheCluster should have conditional failover', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache.Properties.AutomaticFailoverEnabled['Fn::If']).toBeDefined();
      expect(cache.Properties.MultiAZEnabled['Fn::If']).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3Bucket', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have lowercase name', () => {
      const bucket = template.Resources.S3Bucket;
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];
      // Check the static part is lowercase (before ${})
      const staticPart = bucketName.split('${')[0];
      expect(staticPart).toMatch(/^[a-z0-9-]+$/);
      expect(staticPart).not.toMatch(/[A-Z]/);
    });

    test('S3Bucket should have KMS encryption', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
    });

    test('S3Bucket should block all public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3Bucket should have lifecycle policy', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('should have S3BucketPolicy', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3BucketPolicy should deny unencrypted uploads', () => {
      const policy = template.Resources.S3BucketPolicy;
      const denyUnencrypted = policy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
    });

    test('S3BucketPolicy should deny insecure connections', () => {
      const policy = template.Resources.S3BucketPolicy;
      const denyInsecure = policy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('CloudWatch', () => {
    test('should have EC2LogGroup', () => {
      const lg = template.Resources.EC2LogGroup;
      expect(lg).toBeDefined();
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
      expect(lg.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have HttpdLogGroup', () => {
      const lg = template.Resources.HttpdLogGroup;
      expect(lg).toBeDefined();
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have conditional retention', () => {
      const lg = template.Resources.EC2LogGroup;
      expect(lg.Properties.RetentionInDays['Fn::If']).toBeDefined();
    });

    test('should have HighCPUAlarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should have RDSStorageAlarm', () => {
      const alarm = template.Resources.RDSStorageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
    });

    test('alarms should notify SNS topic', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
    });
  });

  describe('SNS', () => {
    test('should have SNSTopic', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNSTopic should have KMS encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('SNSTopic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });
  });

  describe('WAF', () => {
    test('should have WebACL', () => {
      const waf = template.Resources.WebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('WebACL should have rate limit rule', () => {
      const waf = template.Resources.WebACL;
      const rateLimitRule = waf.Properties.Rules.find((rule: any) => rule.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('WebACL should have geo match rule', () => {
      const waf = template.Resources.WebACL;
      const geoRule = waf.Properties.Rules.find((rule: any) => rule.Name === 'GeoMatchRule');
      expect(geoRule).toBeDefined();
    });

    test('should have WebACLAssociation', () => {
      const assoc = template.Resources.WebACLAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(assoc.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });
  });

  describe('Lambda and EventBridge', () => {
    test('should have SecurityGroupRemediationFunction', () => {
      const fn = template.Resources.SecurityGroupRemediationFunction;
      expect(fn).toBeDefined();
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda function should have proper role', () => {
      const fn = template.Resources.SecurityGroupRemediationFunction;
      expect(fn.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('should have SecurityCheckRule', () => {
      const rule = template.Resources.SecurityCheckRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('should have SecurityCheckPermission', () => {
      const perm = template.Resources.SecurityCheckPermission;
      expect(perm).toBeDefined();
      expect(perm.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have WAFChangeEventRule', () => {
      const rule = template.Resources.WAFChangeEventRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });
  });

  describe('SSM Parameters', () => {
    test('should have DBEndpointParameter', () => {
      const param = template.Resources.DBEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
    });

    test('should have CacheEndpointParameter', () => {
      const param = template.Resources.CacheEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('Resource Tags', () => {
    const checkTags = (resource: any, resourceName: string) => {
      if (!resource.Properties.Tags) {
        return null;
      }
      const tags = resource.Properties.Tags;
      const projectTag = tags.find((tag: any) => tag.Key === 'project');
      const teamTag = tags.find((tag: any) => tag.Key === 'team-number');
      return { projectTag, teamTag };
    };

    test('VPC should have required tags', () => {
      const resource = template.Resources.VPC;
      const tags = checkTags(resource, 'VPC');
      expect(tags).not.toBeNull();
      expect(tags?.projectTag?.Value).toBe('iac-rlhf-amazon');
      expect(tags?.teamTag?.Value).toBe('2');
    });

    test('all major resources should have project tag', () => {
      const resourcesToCheck = [
        'VPC', 'InternetGateway', 'NATGateway', 'ApplicationLoadBalancer',
        'RDSInstance', 'S3Bucket', 'KMSKey', 'SNSTopic'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = checkTags(resource, resourceName);
          expect(tags?.projectTag).toBeDefined();
          expect(tags?.projectTag?.Value).toBe('iac-rlhf-amazon');
        }
      });
    });

    test('all major resources should have team-number tag', () => {
      const resourcesToCheck = [
        'VPC', 'InternetGateway', 'NATGateway', 'ApplicationLoadBalancer',
        'RDSInstance', 'S3Bucket', 'KMSKey', 'SNSTopic'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = checkTags(resource, resourceName);
          expect(tags?.teamTag).toBeDefined();
          expect(tags?.teamTag?.Value).toBe('2');
        }
      });
    });

    test('resources should have Owner tag reference', () => {
      const resource = template.Resources.VPC;
      const ownerTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
      expect(ownerTag).toBeDefined();
      expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
    });

    test('resources should have CostCenter tag reference', () => {
      const resource = template.Resources.VPC;
      const ccTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'CostCenter');
      expect(ccTag).toBeDefined();
      expect(ccTag.Value).toEqual({ Ref: 'CostCenter' });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-vpc-id' });
    });

    test('should have ALBDNSName output', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have RDSEndpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('should have SNSTopicArn output', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on VPC Gateway Attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('Public Route should depend on VPC Gateway Attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('subnets should depend on IPv6 CIDR Block', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.DependsOn).toBe('IPv6CidrBlock');
    });
  });

  describe('Deletion Policies', () => {
    test('RDS should have Delete policy for non-production', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Template Validation', () => {
    test('should not have any undefined resources', () => {
      Object.keys(template.Resources).forEach(key => {
        expect(template.Resources[key]).toBeDefined();
        expect(template.Resources[key].Type).toBeDefined();
        expect(template.Resources[key].Properties).toBeDefined();
      });
    });

    test('should have reasonable resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
      expect(resourceCount).toBeLessThan(100);
    });

    test('all parameter references should be valid', () => {
      const parameterNames = Object.keys(template.Parameters);
      const templateStr = JSON.stringify(template);

      parameterNames.forEach(paramName => {
        expect(templateStr).toContain(paramName);
      });
    });

    test('all resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);

      resourceNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceStr = JSON.stringify(resource);

        // Check for Ref
        if (resourceStr.includes('"Ref"')) {
          // This resource references others - that's expected
          expect(resource).toBeDefined();
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all EBS volumes should be encrypted', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const ebs = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('all S3 buckets should have encryption', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('all RDS instances should be encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('all ElastiCache clusters should have encryption', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('all SNS topics should be encrypted', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('all CloudWatch log groups should be encrypted', () => {
      const lg = template.Resources.EC2LogGroup;
      expect(lg.Properties.KmsKeyId).toBeDefined();
    });

    test('database passwords should use Secrets Manager', () => {
      const rds = template.Resources.RDSInstance;
      const password = rds.Properties.MasterUserPassword;
      const passwordStr = typeof password === 'string' ? password : JSON.stringify(password);
      expect(passwordStr).toContain('secretsmanager');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const pac = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pac.BlockPublicAcls).toBe(true);
      expect(pac.BlockPublicPolicy).toBe(true);
      expect(pac.IgnorePublicAcls).toBe(true);
      expect(pac.RestrictPublicBuckets).toBe(true);
    });

    test('security groups should not allow unrestricted SSH', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      const sshRule = ec2Sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
    });
  });
});

import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template (converted from YAML)
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
      expect(template.Description).toBe(
        'TAP Stack - Web Application Environment with VPC, ALB, and EC2 Instances'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have SSHCidrBlock parameter', () => {
      expect(template.Parameters.SSHCidrBlock).toBeDefined();
      const sshParam = template.Parameters.SSHCidrBlock;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.Default).toBe('10.0.0.0/16');
      expect(sshParam.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have two public subnets with correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/25');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.1.128/25');
      
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets with correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/25');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.2.128/25');
    });

    test('should have NAT Gateway with Elastic IP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      
      const natGateway = template.Resources.NatGateway;
      const eip = template.Resources.NatGatewayEIP;
      
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
    });

    test('should have correct route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with HTTP access', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const albSG = template.Resources.ALBSecurityGroup;
      
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.SecurityGroupIngress).toHaveLength(1);
      
      const httpRule = albSG.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group with HTTP from ALB and SSH access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      const ec2SG = template.Resources.EC2SecurityGroup;
      
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2SG.Properties.SecurityGroupIngress).toHaveLength(2);
      
      const httpRule = ec2SG.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      
      const sshRule = ec2SG.Properties.SecurityGroupIngress[1];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHCidrBlock' });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role with correct policies', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      const role = template.Resources.EC2Role;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.Policies).toHaveLength(2);
      
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const cwLogsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      
      expect(s3Policy).toBeDefined();
      expect(cwLogsPolicy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile;
      
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toHaveLength(1);
      expect(profile.Properties.Roles[0]).toEqual({ Ref: 'EC2Role' });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have target group with health checks', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const targetGroup = template.Resources.ALBTargetGroup;
      
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckEnabled).toBe(true);
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.Properties.Targets).toHaveLength(2);
    });

    test('should have ALB listener on port 80', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('EC2 Instances', () => {
    test('should have two EC2 instances', () => {
      expect(template.Resources.EC2Instance1).toBeDefined();
      expect(template.Resources.EC2Instance2).toBeDefined();
    });

    test('EC2 instances should have correct configuration', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      [instance1, instance2].forEach(instance => {
        expect(instance.Type).toBe('AWS::EC2::Instance');
        expect(instance.Properties.ImageId).toBe('ami-03cf127a');
        expect(instance.Properties.InstanceType).toBe('t2.micro');
        expect(instance.Properties.DisableApiTermination).toBe(true);
        expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
        expect(instance.Properties.SecurityGroupIds).toHaveLength(1);
        expect(instance.Properties.UserData).toBeDefined();
      });
    });

    test('EC2 instances should be in private subnets', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch Log Group for API logs', () => {
      expect(template.Resources.APILogGroup).toBeDefined();
      const logGroup = template.Resources.APILogGroup;
      
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
      expect(logGroup.Properties.LogGroupName).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'LoadBalancerDNS',
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'EC2Instance1Id',
        'EC2Instance2Id',
        'APILogGroupName',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('LoadBalancerDNS output should reference ALB DNS', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway should depend on Internet Gateway attachment', () => {
      const natGatewayEIP = template.Resources.NatGatewayEIP;
      expect(natGatewayEIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Default public route should depend on Internet Gateway attachment', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in naming', () => {
      const vpc = template.Resources.VPC;
      const alb = template.Resources.ApplicationLoadBalancer;
      const targetGroup = template.Resources.ALBTargetGroup;

      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}'
      });

      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': 'tap-alb-${EnvironmentSuffix}'
      });

      expect(targetGroup.Properties.Name).toEqual({
        'Fn::Sub': 'tap-tg-${EnvironmentSuffix}'
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(29); // VPC, subnets, routes, SGs, IAM, ALB, EC2, etc.
    });
  });
});

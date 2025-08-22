import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  //
  // ===== BASIC STRUCTURE TESTS =====
  //
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  //
  // ===== PARAMETERS =====
  //
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct defaults', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix.Type).toBe('String');
      expect(envSuffix.Default).toBe('dev');
      expect(envSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have LatestAmiId parameter for Launch Template', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam.Type).toContain('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toContain('/aws/service/ami-amazon-linux-latest/');
    });
  });

  //
  // ===== CONDITIONS =====
  //
  describe('Conditions', () => {
    test('should have IsUsWest2 region restriction', () => {
      expect(template.Conditions.IsUsWest2).toBeDefined();
    });
  });

  //
  // ===== VPC & NETWORKING =====
  //
  describe('VPC Networking', () => {
    test('should have VPC with correct CIDR block', () => {
      expect(template.Resources.WebAppVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have 2 public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should attach Internet Gateway to VPC', () => {
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId.Ref).toBe('WebAppVPC');
    });

    test('should have a default public route to IGW', () => {
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  //
  // ===== SECURITY GROUPS =====
  //
  describe('Security Groups', () => {
    test('WebServerSecurityGroup should allow HTTP and SSH', () => {
      const ingress = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      const ports = ingress.map((r: any) => r.FromPort);
      expect(ports).toEqual(expect.arrayContaining([80, 22]));
    });

    test('LoadBalancerSecurityGroup should allow HTTP from anywhere', () => {
      const ingress = template.Resources.LoadBalancerSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  //
  // ===== IAM ROLE =====
  //
  describe('IAM Role', () => {
    test('WebAppEC2Role should have S3 read-only access', () => {
      const policies = template.Resources.WebAppEC2Role.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
    });
  });

  //
  // ===== EC2 LAUNCH TEMPLATE =====
  //
  describe('EC2 Launch Template', () => {
    test('should reference LatestAmiId parameter', () => {
      expect(template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData.ImageId.Ref).toBe('LatestAmiId');
    });

    test('should have instance type t2.micro', () => {
      expect(template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData.InstanceType).toBe('t2.micro');
    });
  });

  //
  // ===== LOAD BALANCER =====
  //
  describe('Load Balancer', () => {
    test('should be internet-facing ALB with IPv4', () => {
      const lb = template.Resources.WebAppLoadBalancer.Properties;
      expect(lb.Scheme).toBe('internet-facing');
      expect(lb.Type).toBe('application');
      expect(lb.IpAddressType).toBe('ipv4');
    });

    test('Outputs should include LoadBalancerDNS and LoadBalancerURL', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
    });
  });

  //
  // ===== AUTO SCALING =====
  //
  describe('Auto Scaling', () => {
    test('should have ASG with min 2, max 5', () => {
      const asg = template.Resources.WebAppAutoScalingGroup.Properties;
      expect(asg.MinSize).toBe('2');
      expect(asg.MaxSize).toBe('5');
    });

    test('should have scale up and scale down policies', () => {
      expect(template.Resources.WebAppScaleUpPolicy).toBeDefined();
      expect(template.Resources.WebAppScaleDownPolicy).toBeDefined();
    });
  });

  //
  // ===== CLOUDWATCH ALARMS =====
  //
  describe('CloudWatch Alarms', () => {
    test('CPUAlarmHigh should trigger above 70%', () => {
      expect(template.Resources.CPUAlarmHigh.Properties.Threshold).toBe('70');
      expect(template.Resources.CPUAlarmHigh.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CPUAlarmLow should trigger below 25%', () => {
      expect(template.Resources.CPUAlarmLow.Properties.Threshold).toBe('25');
      expect(template.Resources.CPUAlarmLow.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });
});

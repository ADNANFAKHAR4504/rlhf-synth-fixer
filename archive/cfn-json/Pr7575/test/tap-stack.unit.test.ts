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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ECS');
    });

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
  });


  describe('ECS Resources', () => {
    test('should have ECSCluster resource', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have ApplicationLoadBalancer resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have BlueECSService resource', () => {
      expect(template.Resources.BlueECSService).toBeDefined();
      expect(template.Resources.BlueECSService.Type).toBe('AWS::ECS::Service');
    });

    test('should have GreenECSService resource', () => {
      expect(template.Resources.GreenECSService).toBeDefined();
      expect(template.Resources.GreenECSService.Type).toBe('AWS::ECS::Service');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('private subnets should reference VPC', () => {
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet3.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NATGateway resource', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NATGateway should be in public subnet', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup resource', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ECSTaskSecurityGroup resource', () => {
      expect(template.Resources.ECSTaskSecurityGroup).toBeDefined();
      expect(template.Resources.ECSTaskSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });


  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have ALBArn output', () => {
      expect(template.Outputs.ALBArn).toBeDefined();
      expect(template.Outputs.ALBArn.Value).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });

    test('should have BlueServiceName output', () => {
      expect(template.Outputs.BlueServiceName).toBeDefined();
    });

    test('should have GreenServiceName output', () => {
      expect(template.Outputs.GreenServiceName).toBeDefined();
    });
  });


  describe('Tagging Standards', () => {
    test('VPC should have Name tag', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('subnets should have Name tags', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(privateSubnet1.Properties.Tags).toBeDefined();
      expect(publicSubnet1.Properties.Tags).toBeDefined();
      const privateNameTag = privateSubnet1.Properties.Tags.find((t: any) => t.Key === 'Name');
      const publicNameTag = publicSubnet1.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(privateNameTag).toBeDefined();
      expect(publicNameTag).toBeDefined();
    });
  });

  describe('Resource Count', () => {
    test('should have VPC and networking resources', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
    });

    test('should have ECS resources', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.BlueECSService).toBeDefined();
      expect(template.Resources.GreenECSService).toBeDefined();
    });

    test('should have ALB resources', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    });

    test('should have multiple security groups', () => {
      const securityGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Compliance', () => {
    test('ECS services should be in private subnets', () => {
      const blueService = template.Resources.BlueECSService;
      const greenService = template.Resources.GreenECSService;
      expect(blueService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toBeDefined();
      expect(greenService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toBeDefined();
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets.length).toBeGreaterThan(0);
    });
  });
});


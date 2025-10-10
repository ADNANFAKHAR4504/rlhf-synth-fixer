import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the YAML template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Multi-region infrastructure with VPC, ALB, Auto Scaling, S3, and security configurations'
      );
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionConfig).toBeDefined();
      expect(template.Mappings.RegionAMI).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('An environment name that is prefixed to resource names');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
    });

    test('should have Auto Scaling parameters', () => {
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();
      
      expect(template.Parameters.DesiredCapacity.Type).toBe('Number');
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      const param = template.Parameters.CertificateArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have EC2 KeyPair resource', () => {
      expect(template.Resources.EC2KeyPair).toBeDefined();
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways and EIPs', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      
      const eip = template.Resources.NATGateway1EIP;
      const nat = template.Resources.NATGateway1;
      
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(nat.Type).toBe('AWS::EC2::NatGateway');

    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Auto Scaling Group and Launch Template', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.LaunchTemplate).toBeDefined();
      
      const asg = template.Resources.AutoScalingGroup;
      const lt = template.Resources.LaunchTemplate;
      
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
    });

    test('should have security groups', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-VPC' });
    });

    test('should have ALB DNS output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-ALB-DNS' });
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-S3-Bucket' });
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      
      const subnet1Output = template.Outputs.PrivateSubnet1Id;
      expect(subnet1Output.Description).toBe('Private Subnet 1 ID');
      expect(subnet1Output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-PrivateSubnet1' });
    });

    test('should have RDS security group output', () => {
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
      const output = template.Outputs.RDSSecurityGroupId;
      expect(output.Description).toBe('Security Group ID for RDS');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-RDS-SG' });
    });

    test('should have EC2 KeyPair output', () => {
      expect(template.Outputs.EC2KeyPairId).toBeDefined();
      const output = template.Outputs.EC2KeyPairId;
      expect(output.Description).toBe('EC2 Key Pair ID');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-KeyPair' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Mappings).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have appropriate number of resources for infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Infrastructure should have many resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(5); // Should have several parameters
    });

    test('should have multiple outputs for infrastructure components', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(6); // Should export key infrastructure components
    });
  });

  describe('Mappings Validation', () => {
    test('RegionConfig should have VPC and subnet configurations', () => {
      const regionConfig = template.Mappings.RegionConfig;
      
      // Test us-east-1 configuration
      expect(regionConfig['us-east-1']).toBeDefined();
      expect(regionConfig['us-east-1'].VPCCidr).toBe('10.0.0.0/16');
      expect(regionConfig['us-east-1'].PublicSubnet1Cidr).toBe('10.0.10.0/24');
      expect(regionConfig['us-east-1'].PrivateSubnet1Cidr).toBe('10.0.20.0/24');
    });

    test('RegionAMI should have AMI IDs for supported regions', () => {
      const regionAMI = template.Mappings.RegionAMI;
      
      expect(regionAMI['us-east-1']).toBeDefined();
      expect(regionAMI['us-east-1'].AMI).toMatch(/^ami-[0-9a-f]{8,17}$/);
      
      expect(regionAMI['us-west-2']).toBeDefined();
      expect(regionAMI['eu-west-1']).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentName for naming', () => {
      const vpc = template.Resources.VPC;
      const keyPair = template.Resources.EC2KeyPair;
      
      expect(vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name').Value).toEqual({
        'Fn::Sub': '${EnvironmentName}-VPC'
      });
      
      expect(keyPair.Properties.Tags.find((tag: any) => tag.Key === 'Name').Value).toEqual({
        'Fn::Sub': '${EnvironmentName}-KeyPair'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${EnvironmentName}-${outputKey.replace('Id', '').replace('Name', '')}`
          });
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have security groups for ALB, EC2, and RDS', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });
});

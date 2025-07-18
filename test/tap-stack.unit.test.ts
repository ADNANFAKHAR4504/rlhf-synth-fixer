import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml'; // Import js-yaml for YAML parsing

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Assuming your CloudFormation template is a YAML file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    // Parse YAML content
    template = yaml.load(templateContent);
  });

  //----------------------------------------------------------------------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a Description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  //----------------------------------------------------------------------------
  describe('Parameters', () => {
    test('should have all defined parameters', () => {
      const params = [
        'ProjectName', 'Region1', 'Region2', 'VpcCidr1', 'VpcCidr2',
        'PublicSubnet1Cidr1', 'PrivateSubnet1Cidr1', 'PublicSubnet2Cidr1', 'PrivateSubnet2Cidr1',
        'PublicSubnet1Cidr2', 'PrivateSubnet1Cidr2', 'PublicSubnet2Cidr2', 'PrivateSubnet2Cidr2',
        'InstanceType', 'AMI', 'DBInstanceType', 'DBAllocatedStorage', 'DBUsername', 'DBPassword'
      ];
      params.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values for ProjectName and Regions', () => {
      expect(template.Parameters.ProjectName.Default).toBe('TapStack');
      expect(template.Parameters.Region1.Default).toBe('us-east-1');
      expect(template.Parameters.Region2.Default).toBe('us-west-2');
    });

    test('should have correct default values for VPC and subnet CIDRs', () => {
      expect(template.Parameters.VpcCidr1.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.VpcCidr2.Default).toBe('10.1.0.0/16');
      expect(template.Parameters.PublicSubnet1Cidr1.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr1.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PublicSubnet2Cidr1.Default).toBe('10.0.3.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr1.Default).toBe('10.0.4.0/24');
      expect(template.Parameters.PublicSubnet1Cidr2.Default).toBe('10.1.1.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr2.Default).toBe('10.1.2.0/24');
      expect(template.Parameters.PublicSubnet2Cidr2.Default).toBe('10.1.3.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr2.Default).toBe('10.1.4.0/24');
    });

    test('should have correct default values for InstanceType, AMI, DBInstanceType, and DBAllocatedStorage', () => {
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.AMI.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(template.Parameters.DBInstanceType.Default).toBe('db.t3.micro');
      expect(template.Parameters.DBAllocatedStorage.Default).toBe(20);
    });

    test('DBUsername and DBPassword should have NoEcho set to true', () => {
      expect(template.Parameters.DBUsername.NoEcho).toBe(true);
      expect(template.Parameters.DBPassword.NoEcho).toBe(true);
    });
  });

  //----------------------------------------------------------------------------
  describe('Resources', () => {
    test('should have VpcR1 and VpcR2 resources', () => {
      expect(template.Resources.VpcR1).toBeDefined();
      expect(template.Resources.VpcR2).toBeDefined();
      expect(template.Resources.VpcR1.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VpcR2.Type).toBe('AWS::EC2::VPC');
    });

    test('should have all subnet resources for both regions', () => {
      const subnets = [
        'PublicSubnet1R1', 'PublicSubnet2R1', 'PrivateSubnet1R1', 'PrivateSubnet2R1',
        'PublicSubnet1R2', 'PublicSubnet2R2', 'PrivateSubnet1R2', 'PrivateSubnet2R2'
      ];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have InternetGateways and attachments for both regions', () => {
      expect(template.Resources.IgwR1).toBeDefined();
      expect(template.Resources.IgwR2).toBeDefined();
      expect(template.Resources.IgwR1.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.IgwR2.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.IgwAttachmentR1).toBeDefined();
      expect(template.Resources.IgwAttachmentR2).toBeDefined();
      expect(template.Resources.IgwAttachmentR1.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.IgwAttachmentR2.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateways and EIPs for both regions', () => {
      expect(template.Resources.NatGwR1).toBeDefined();
      expect(template.Resources.NatGwR2).toBeDefined();
      expect(template.Resources.NatGwR1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGwR2.Type).toBe('AWS::EC2::NatGateway');

      expect(template.Resources.NatEipR1).toBeDefined();
      expect(template.Resources.NatEipR2).toBeDefined();
      expect(template.Resources.NatEipR1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatEipR2.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables and associations for both regions', () => {
      const routeTableAndAssociations = [
        'PublicRouteTableR1', 'PublicRouteTableR2', 'PrivateRouteTableR1', 'PrivateRouteTableR2',
        'PublicRouteR1', 'PublicRouteR2', 'PrivateRouteR1', 'PrivateRouteR2',
        'PublicSubnet1AssocR1', 'PublicSubnet2AssocR1',
        'PrivateSubnet1AssocR1', 'PrivateSubnet2AssocR1',
        'PublicSubnet1AssocR2', 'PublicSubnet2AssocR2',
        'PrivateSubnet1AssocR2', 'PrivateSubnet2AssocR2'
      ];
      routeTableAndAssociations.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have security groups for both regions', () => {
      const securityGroups = [
        'AlbSgR1', 'AppSgR1', 'DbSgR1',
        'AlbSgR2', 'AppSgR2', 'DbSgR2'
      ];
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('should have Application Load Balancers and related resources for both regions', () => {
      const albs = [
        'AlbR1', 'AlbListenerR1', 'AlbTargetGroupR1',
        'AlbR2', 'AlbListenerR2', 'AlbTargetGroupR2'
      ];
      albs.forEach(alb => {
        expect(template.Resources[alb]).toBeDefined();
      });
      expect(template.Resources.AlbR1.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.AlbListenerR1.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.AlbTargetGroupR1.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have IAM Role and Instance Profile', () => {
      expect(template.Resources.Ec2InstanceRole).toBeDefined();
      expect(template.Resources.Ec2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.Ec2InstanceProfile).toBeDefined();
      expect(template.Resources.Ec2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have EC2 instances for both regions', () => {
      const ec2Instances = [
        'AppInstance1R1', 'AppInstance2R1',
        'AppInstance1R2', 'AppInstance2R2'
      ];
      ec2Instances.forEach(instance => {
        expect(template.Resources[instance]).toBeDefined();
        expect(template.Resources[instance].Type).toBe('AWS::EC2::Instance');
      });
    });

    test('should have RDS instances and DBSubnetGroups for both regions', () => {
      expect(template.Resources.RdsInstanceR1).toBeDefined();
      expect(template.Resources.RdsInstanceR2).toBeDefined();
      expect(template.Resources.RdsInstanceR1.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RdsInstanceR2.Type).toBe('AWS::RDS::DBInstance');

      expect(template.Resources.DbSubnetGroupR1).toBeDefined();
      expect(template.Resources.DbSubnetGroupR2).toBeDefined();
      expect(template.Resources.DbSubnetGroupR1.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DbSubnetGroupR2.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  //----------------------------------------------------------------------------
  describe('Outputs', () => {
    test('should have ALB DNS name outputs for both regions', () => {
      expect(template.Outputs.AlbDnsNameR1).toBeDefined();
      expect(template.Outputs.AlbDnsNameR2).toBeDefined();
    });

    test('ALB DNS name outputs should reference correct resources', () => {
      expect(template.Outputs.AlbDnsNameR1.Value).toEqual({ 'Fn::GetAtt': ['AlbR1', 'DNSName'] });
      expect(template.Outputs.AlbDnsNameR2.Value).toEqual({ 'Fn::GetAtt': ['AlbR2', 'DNSName'] });
    });
  });

  //----------------------------------------------------------------------------
  describe('Template Validation', () => {
    test('should have valid JSON/YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // This test now explicitly expects a .json file.
    // If your CloudFormation template is in YAML, you'll need to convert it to JSON
    // (e.g., using a build step or a separate script) before running these tests.
    const templatePath = path.join(__dirname, '../TapStack.json'); // Assuming the JSON output file is named TapStack.json
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent); // Parse as JSON
  });

  //---## Template Structure
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

  //---## Parameters
  describe('Parameters', () => {
    test('should have all defined parameters', () => {
      const params = [
        'ProjectName', 'Region1', 'VpcCidr1',
        'PublicSubnet1Cidr1', 'PrivateSubnet1Cidr1', 'PublicSubnet2Cidr1', 'PrivateSubnet2Cidr1'
      ];
      params.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values for ProjectName and Region1', () => {
      expect(template.Parameters.ProjectName.Default).toBe('TapStack');
      expect(template.Parameters.Region1.Default).toBe('us-east-2'); // Updated to us-east-2
    });

    test('should have correct default values for VPC and subnet CIDRs', () => {
      expect(template.Parameters.VpcCidr1.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1Cidr1.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr1.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PublicSubnet2Cidr1.Default).toBe('10.0.3.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr1.Default).toBe('10.0.4.0/24');
    });
  });

  //---## Resources
  describe('Resources', () => {
    test('should have VpcR1 resource', () => {
      expect(template.Resources.VpcR1).toBeDefined();
      expect(template.Resources.VpcR1.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VpcR1.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr1' });
    });

    test('should have all subnet resources for Region 1', () => {
      const subnets = [
        'PublicSubnet1R1', 'PublicSubnet2R1', 'PrivateSubnet1R1', 'PrivateSubnet2R1',
      ];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.VpcId).toEqual({ Ref: 'VpcR1' });
        expect(template.Resources[subnet].Properties.CidrBlock).toEqual({ Ref: expect.stringContaining(subnet.replace('R1', 'Cidr1')) });
      });
      // Specific check for AvailabilityZone in Region 1 using Fn::Select
      expect(template.Resources.PublicSubnet1R1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
    });

    test('should have InternetGateway and attachment for Region 1', () => {
      expect(template.Resources.IgwR1).toBeDefined();
      expect(template.Resources.IgwR1.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.IgwAttachmentR1).toBeDefined();
      expect(template.Resources.IgwAttachmentR1.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.IgwAttachmentR1.Properties.VpcId).toEqual({ Ref: 'VpcR1' });
    });

    test('should have NAT EIP, but no NAT Gateway', () => {
      expect(template.Resources.NatEipR1).toBeDefined();
      expect(template.Resources.NatEipR1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatEipR1.Properties.Domain).toBe('vpc');
      // Ensure NatGwR1 is explicitly NOT defined
      expect(template.Resources.NatGwR1).toBeUndefined();
    });

    test('should have route tables and associations for Region 1', () => {
      const routeTableTypes = ['PublicRouteTableR1', 'PrivateRouteTableR1'];
      routeTableTypes.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
        expect(template.Resources[rt].Properties.VpcId).toBeDefined();
      });

      const routeTypes = ['PublicRouteR1'];
      routeTypes.forEach(route => {
        expect(template.Resources[route]).toBeDefined();
        expect(template.Resources[route].Type).toBe('AWS::EC2::Route');
        expect(template.Resources[route].Properties.RouteTableId).toBeDefined();
        expect(template.Resources[route].Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      });

      expect(template.Resources.PublicRouteR1.Properties.GatewayId).toEqual({ Ref: 'IgwR1' });

      const subnetAssocTypes = [
        'PublicSubnet1AssocR1', 'PublicSubnet2AssocR1', 'PrivateSubnet1AssocR1', 'PrivateSubnet2AssocR1',
      ];
      subnetAssocTypes.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(template.Resources[assoc].Properties.SubnetId).toBeDefined();
        expect(template.Resources[assoc].Properties.RouteTableId).toBeDefined();
      });
    });

    test('should have security groups for Region 1, with updated ingress rules', () => {
      const securityGroups = [
        'AlbSgR1', 'AppSgR1', 'DbSgR1',
      ];
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources[sg].Properties.VpcId).toBeDefined();
        expect(template.Resources[sg].Properties.SecurityGroupIngress).toBeDefined();
      });

      // AlbSgR1
      expect(template.Resources.AlbSgR1.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
        ])
      );
      // AppSgR1
      expect(template.Resources.AppSgR1.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: '0.0.0.0/0' })
        ])
      );
      // DbSgR1 - Expect no ingress rules or an empty array
      expect(template.Resources.DbSgR1.Properties.SecurityGroupIngress).toBeUndefined();
    });

    test('should NOT have Application Load Balancer and related resources', () => {
      expect(template.Resources.AlbR1).toBeUndefined();
      expect(template.Resources.AlbListenerR1).toBeUndefined();
      expect(template.Resources.AlbTargetGroupR1).toBeUndefined();
    });

    test('should have IAM Role, but NOT Instance Profile', () => {
      expect(template.Resources.Ec2InstanceRole).toBeDefined();
      expect(template.Resources.Ec2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.Ec2InstanceProfile).toBeUndefined();

      expect(template.Resources.Ec2InstanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(template.Resources.Ec2InstanceRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(template.Resources.Ec2InstanceRole.Properties.Policies[0].PolicyName).toBe('S3AccessPolicy');
    });

    test('should NOT have EC2 instances', () => {
      expect(template.Resources.AppInstance1R1).toBeUndefined();
      expect(template.Resources.AppInstance2R1).toBeUndefined();
    });

    test('should have DBSubnetGroup, but NOT RDS instance', () => {
      expect(template.Resources.RdsInstanceR1).toBeUndefined();
      expect(template.Resources.DbSubnetGroupR1).toBeDefined();
      expect(template.Resources.DbSubnetGroupR1.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DbSubnetGroupR1.Properties.SubnetIds.length).toBe(2);
    });
  });

  //--- Outputs
  describe('Outputs', () => {
    test('should have NAT EIP public IP output', () => {
      expect(template.Outputs.NatEipR1PublicIp).toBeDefined();
      expect(template.Outputs.NatEipR1PublicIp.Description).toBe('The Public IP Address of the NAT Gateway Elastic IP');
      expect(template.Outputs.NatEipR1PublicIp.Value).toEqual({ 'Fn::GetAtt': ['NatEipR1', 'PublicIp'] });
    });

    test('should have NAT EIP allocation ID output', () => {
      expect(template.Outputs.NatEipR1AllocationId).toBeDefined();
      expect(template.Outputs.NatEipR1AllocationId.Description).toBe('The Allocation ID of the NAT Gateway Elastic IP');
      expect(template.Outputs.NatEipR1AllocationId.Value).toEqual({ 'Fn::GetAtt': ['NatEipR1', 'AllocationId'] });
    });
  });

  //---Template Validation
  describe('Template Validation', () => {
    test('should have valid JSON structure', () => { // Changed description to JSON
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
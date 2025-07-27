import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Reading JSON template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure & Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a valid description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should be valid JSON syntax', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have correct resource count', () => {
      const expectedResourceCount = 18; // VPC, IGW, VPCGatewayAttachment, 4 subnets, NAT+EIP, 2 route tables, 2 routes, 4 associations, 1 security group
      expect(Object.keys(template.Resources)).toHaveLength(
        expectedResourceCount
      );
    });

    test('should follow consistent naming conventions', () => {
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/); // PascalCase naming
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource with correct properties', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');

      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('should have VPC with proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(Array.isArray(vpc.Properties.Tags)).toBe(true);

      const nameTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBeDefined();
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should have public subnets with correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have public subnets with auto-assign public IP enabled', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have public subnets in different availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('should have public subnets reference correct VPC', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(publicSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should have private subnets with correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have private subnets in different availability zones', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('should have private subnets reference correct VPC', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should not have auto-assign public IP for private subnets', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      // MapPublicIpOnLaunch should be undefined or false for private subnets
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should have Internet Gateway with correct type', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );

      const attachment = template.Resources.VPCGatewayAttachment.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have Internet Gateway with proper tags', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Properties.Tags).toBeDefined();
      expect(Array.isArray(igw.Properties.Tags)).toBe(true);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();

      const natGateway = template.Resources.NatGateway;
      const eip = template.Resources.NatGatewayEIP;

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.Type).toBe('AWS::EC2::EIP');
    });

    test('should have EIP configured for VPC domain', () => {
      const eip = template.Resources.NatGatewayEIP;
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateway deployed in public subnet', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should have NAT Gateway reference EIP allocation', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGatewayEIP', 'AllocationId'],
      });
    });
  });

  describe('Route Tables Configuration', () => {
    test('should have public and private route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();

      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have route tables reference correct VPC', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable;

      expect(publicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have route tables with proper tags', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable;

      expect(publicRouteTable.Properties.Tags).toBeDefined();
      expect(privateRouteTable.Properties.Tags).toBeDefined();
    });
  });

  describe('Routes Configuration', () => {
    test('should have public route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();

      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('should have private route to NAT Gateway', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();

      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });
    });

    test('should have public route with proper dependency', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Subnet Route Table Associations', () => {
    test('should have all subnet route table associations', () => {
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });

    test('should associate public subnets with public route table', () => {
      const publicSubnet1Assoc =
        template.Resources.PublicSubnet1RouteTableAssociation;
      const publicSubnet2Assoc =
        template.Resources.PublicSubnet2RouteTableAssociation;

      expect(publicSubnet1Assoc.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(publicSubnet1Assoc.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });

      expect(publicSubnet2Assoc.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet2',
      });
      expect(publicSubnet2Assoc.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });

    test('should associate private subnets with private route table', () => {
      const privateSubnet1Assoc =
        template.Resources.PrivateSubnet1RouteTableAssociation;
      const privateSubnet2Assoc =
        template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(privateSubnet1Assoc.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(privateSubnet1Assoc.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });

      expect(privateSubnet2Assoc.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet2',
      });
      expect(privateSubnet2Assoc.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should have public security group with correct type', () => {
      expect(template.Resources.PublicSecurityGroup).toBeDefined();

      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(securityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should allow HTTP traffic on port 80', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      const httpRule = securityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should allow SSH traffic on port 22 with proper restriction', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      const sshRule = securityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');

      // Note: Current template has 10.0.0.0/8, but PROMPT.md doesn't specify restrictions
      // This test verifies the current implementation
      expect(sshRule.CidrIp).toBe('10.0.0.0/8');
      expect(sshRule.Description).toBeDefined();
    });

    test('should have proper egress rules', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup.Properties.SecurityGroupEgress).toBeDefined();

      const egressRule = securityGroup.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe(-1); // All protocols
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have security group with proper description and tags', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup.Properties.GroupDescription).toBeDefined();
      expect(securityGroup.Properties.Tags).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'InternetGatewayId',
        'PublicSecurityGroupId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('should have VPC output with correct reference', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toContain('VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have subnet outputs with correct references', () => {
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(template.Outputs.PublicSubnet2Id.Value).toEqual({
        Ref: 'PublicSubnet2',
      });
      expect(template.Outputs.PrivateSubnet1Id.Value).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(template.Outputs.PrivateSubnet2Id.Value).toEqual({
        Ref: 'PrivateSubnet2',
      });
    });

    test('should have Internet Gateway output with correct reference', () => {
      const output = template.Outputs.InternetGatewayId;
      expect(output.Description).toContain('Internet Gateway');
      expect(output.Value).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have Security Group output with correct reference', () => {
      const output = template.Outputs.PublicSecurityGroupId;
      expect(output.Description).toContain('Security Group');
      expect(output.Value).toEqual({ Ref: 'PublicSecurityGroup' });
    });
  });

  describe('PROMPT.md Compliance Validation', () => {
    test('should comply with exact CIDR block requirements', () => {
      // VPC CIDR
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');

      // Public subnet CIDRs
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );

      // Private subnet CIDRs
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.3.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.4.0/24'
      );
    });

    test('should comply with port requirements for security groups', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      const ingressRules = securityGroup.Properties.SecurityGroupIngress;

      // Should have HTTP (port 80) and SSH (port 22) rules
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);

      expect(httpRule).toBeDefined();
      expect(sshRule).toBeDefined();

      expect(httpRule.ToPort).toBe(80);
      expect(sshRule.ToPort).toBe(22);

      expect(httpRule.IpProtocol).toBe('tcp');
      expect(sshRule.IpProtocol).toBe('tcp');
    });

    test('should have proper routing configuration', () => {
      // Public route should go to Internet Gateway
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });

      // Private route should go to NAT Gateway
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });

      // Both should route 0.0.0.0/0
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have NAT Gateway in public subnet as required', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });
});

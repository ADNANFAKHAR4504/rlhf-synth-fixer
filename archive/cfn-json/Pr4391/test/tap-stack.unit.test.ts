import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure Tests ====================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for HA web environment', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Highly Available Web Environment');
    });

    test('should have all major sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have 40 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(40);
    });
  });

  // ==================== Parameters Tests ====================
  describe('Parameters', () => {
    describe('EnvironmentSuffix Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      });

      test('should have description', () => {
        expect(template.Parameters.EnvironmentSuffix.Description).toBe('Environment suffix for unique resource naming');
      });

      test('should have validation pattern', () => {
        const pattern = template.Parameters.EnvironmentSuffix.AllowedPattern;
        expect(pattern).toBe('^[a-z0-9-]+$');
      });

      test('should have constraint description', () => {
        expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toBe('Must contain only lowercase letters, numbers, and hyphens');
      });
    });

    describe('InstanceType Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.InstanceType).toBeDefined();
        expect(template.Parameters.InstanceType.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      });

      test('should have allowed values', () => {
        const allowedValues = template.Parameters.InstanceType.AllowedValues;
        expect(allowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      });

      test('should have description', () => {
        expect(template.Parameters.InstanceType.Description).toBe('EC2 Instance Type');
      });
    });

    describe('LatestAmiId Parameter', () => {
      test('should exist and have correct SSM parameter type', () => {
        expect(template.Parameters.LatestAmiId).toBeDefined();
        expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      });

      test('should have correct default SSM path', () => {
        const defaultPath = template.Parameters.LatestAmiId.Default;
        expect(defaultPath).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      });

      test('should have description', () => {
        expect(template.Parameters.LatestAmiId.Description).toBe('Latest Amazon Linux 2 AMI ID');
      });
    });
  });

  // ==================== VPC and Networking Tests ====================
  describe('VPC and Networking Resources', () => {
    describe('VPC', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.VPC).toBeDefined();
        expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      });

      test('should have correct CIDR block', () => {
        const properties = template.Resources.VPC.Properties;
        expect(properties.CidrBlock).toBe('10.0.0.0/16');
      });

      test('should enable DNS hostnames and support', () => {
        const properties = template.Resources.VPC.Properties;
        expect(properties.EnableDnsHostnames).toBe(true);
        expect(properties.EnableDnsSupport).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.VPC.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'HA-Web-VPC' });
      });
    });

    describe('Internet Gateway', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.InternetGateway).toBeDefined();
        expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.InternetGateway.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'HA-Web-IGW' });
      });

      test('should be attached to VPC', () => {
        const attachment = template.Resources.AttachGateway;
        expect(attachment).toBeDefined();
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      });
    });

    describe('Public Subnets', () => {
      test('should have three public subnets defined', () => {
        expect(template.Resources.PublicSubnet1).toBeDefined();
        expect(template.Resources.PublicSubnet2).toBeDefined();
        expect(template.Resources.PublicSubnet3).toBeDefined();
      });

      test('PublicSubnet1 should have correct configuration', () => {
        const subnet = template.Resources.PublicSubnet1;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('PublicSubnet1 should be in first AZ', () => {
        const subnet = template.Resources.PublicSubnet1;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
      });

      test('PublicSubnet2 should have correct configuration', () => {
        const subnet = template.Resources.PublicSubnet2;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('PublicSubnet2 should be in second AZ', () => {
        const subnet = template.Resources.PublicSubnet2;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });
      });

      test('PublicSubnet3 should have correct configuration', () => {
        const subnet = template.Resources.PublicSubnet3;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('PublicSubnet3 should be in third AZ', () => {
        const subnet = template.Resources.PublicSubnet3;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [2, { 'Fn::GetAZs': '' }]
        });
      });

      test('public subnets should have correct tags', () => {
        const subnet1Tags = template.Resources.PublicSubnet1.Properties.Tags;
        const subnet2Tags = template.Resources.PublicSubnet2.Properties.Tags;
        const subnet3Tags = template.Resources.PublicSubnet3.Properties.Tags;

        expect(subnet1Tags).toContainEqual({ Key: 'Name', Value: 'Public-Subnet-AZ1' });
        expect(subnet2Tags).toContainEqual({ Key: 'Name', Value: 'Public-Subnet-AZ2' });
        expect(subnet3Tags).toContainEqual({ Key: 'Name', Value: 'Public-Subnet-AZ3' });
      });

      test('public subnet CIDR blocks should not overlap', () => {
        const cidr1 = template.Resources.PublicSubnet1.Properties.CidrBlock;
        const cidr2 = template.Resources.PublicSubnet2.Properties.CidrBlock;
        const cidr3 = template.Resources.PublicSubnet3.Properties.CidrBlock;

        expect(cidr1).not.toBe(cidr2);
        expect(cidr1).not.toBe(cidr3);
        expect(cidr2).not.toBe(cidr3);
      });
    });

    describe('Private Subnets', () => {
      test('should have three private subnets defined', () => {
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet2).toBeDefined();
        expect(template.Resources.PrivateSubnet3).toBeDefined();
      });

      test('PrivateSubnet1 should have correct configuration', () => {
        const subnet = template.Resources.PrivateSubnet1;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.11.0/24');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });

      test('PrivateSubnet1 should be in first AZ', () => {
        const subnet = template.Resources.PrivateSubnet1;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
      });

      test('PrivateSubnet2 should have correct configuration', () => {
        const subnet = template.Resources.PrivateSubnet2;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.12.0/24');
      });

      test('PrivateSubnet2 should be in second AZ', () => {
        const subnet = template.Resources.PrivateSubnet2;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });
      });

      test('PrivateSubnet3 should have correct configuration', () => {
        const subnet = template.Resources.PrivateSubnet3;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.13.0/24');
      });

      test('PrivateSubnet3 should be in third AZ', () => {
        const subnet = template.Resources.PrivateSubnet3;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [2, { 'Fn::GetAZs': '' }]
        });
      });

      test('private subnets should have correct tags', () => {
        const subnet1Tags = template.Resources.PrivateSubnet1.Properties.Tags;
        const subnet2Tags = template.Resources.PrivateSubnet2.Properties.Tags;
        const subnet3Tags = template.Resources.PrivateSubnet3.Properties.Tags;

        expect(subnet1Tags).toContainEqual({ Key: 'Name', Value: 'Private-Subnet-AZ1' });
        expect(subnet2Tags).toContainEqual({ Key: 'Name', Value: 'Private-Subnet-AZ2' });
        expect(subnet3Tags).toContainEqual({ Key: 'Name', Value: 'Private-Subnet-AZ3' });
      });

      test('private subnet CIDR blocks should not overlap', () => {
        const cidr1 = template.Resources.PrivateSubnet1.Properties.CidrBlock;
        const cidr2 = template.Resources.PrivateSubnet2.Properties.CidrBlock;
        const cidr3 = template.Resources.PrivateSubnet3.Properties.CidrBlock;

        expect(cidr1).not.toBe(cidr2);
        expect(cidr1).not.toBe(cidr3);
        expect(cidr2).not.toBe(cidr3);
      });

      test('private subnets should not enable public IP on launch', () => {
        expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    describe('NAT Gateways and EIPs', () => {
      test('should have three EIPs defined', () => {
        expect(template.Resources.NATGateway1EIP).toBeDefined();
        expect(template.Resources.NATGateway2EIP).toBeDefined();
        expect(template.Resources.NATGateway3EIP).toBeDefined();
      });

      test('NATGateway1EIP should have correct configuration', () => {
        const eip = template.Resources.NATGateway1EIP;
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });

      test('NATGateway2EIP should have correct configuration', () => {
        const eip = template.Resources.NATGateway2EIP;
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });

      test('NATGateway3EIP should have correct configuration', () => {
        const eip = template.Resources.NATGateway3EIP;
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });

      test('should have three NAT Gateways defined', () => {
        expect(template.Resources.NATGateway1).toBeDefined();
        expect(template.Resources.NATGateway2).toBeDefined();
        expect(template.Resources.NATGateway3).toBeDefined();
      });

      test('NATGateway1 should have correct configuration', () => {
        const nat = template.Resources.NATGateway1;
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId'] });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      });

      test('NATGateway1 should have correct tags', () => {
        const tags = template.Resources.NATGateway1.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'NAT-Gateway-AZ1' });
      });

      test('NATGateway2 should have correct configuration', () => {
        const nat = template.Resources.NATGateway2;
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId'] });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      });

      test('NATGateway2 should have correct tags', () => {
        const tags = template.Resources.NATGateway2.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'NAT-Gateway-AZ2' });
      });

      test('NATGateway3 should have correct configuration', () => {
        const nat = template.Resources.NATGateway3;
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGateway3EIP', 'AllocationId'] });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
      });

      test('NATGateway3 should have correct tags', () => {
        const tags = template.Resources.NATGateway3.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'NAT-Gateway-AZ3' });
      });

      test('NAT Gateways should be in public subnets', () => {
        expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
        expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
      });
    });

    describe('Route Tables', () => {
      test('should have public route table', () => {
        expect(template.Resources.PublicRouteTable).toBeDefined();
        expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      });

      test('public route table should be associated with VPC', () => {
        const properties = template.Resources.PublicRouteTable.Properties;
        expect(properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('public route table should have correct tags', () => {
        const tags = template.Resources.PublicRouteTable.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Public-Route-Table' });
      });

      test('should have route to Internet Gateway', () => {
        const route = template.Resources.PublicRoute;
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.DependsOn).toBe('AttachGateway');
        expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      test('public route table should be associated with all public subnets', () => {
        const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
        const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
        const assoc3 = template.Resources.PublicSubnet3RouteTableAssociation;

        expect(assoc1).toBeDefined();
        expect(assoc2).toBeDefined();
        expect(assoc3).toBeDefined();

        expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc3.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');

        expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
        expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        expect(assoc3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });

        expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
        expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
        expect(assoc3.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });

      test('should have three private route tables', () => {
        expect(template.Resources.PrivateRouteTable1).toBeDefined();
        expect(template.Resources.PrivateRouteTable2).toBeDefined();
        expect(template.Resources.PrivateRouteTable3).toBeDefined();
      });

      test('PrivateRouteTable1 should have correct configuration', () => {
        const routeTable = template.Resources.PrivateRouteTable1;
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

        const tags = routeTable.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Private-Route-Table-AZ1' });
      });

      test('PrivateRouteTable2 should have correct configuration', () => {
        const routeTable = template.Resources.PrivateRouteTable2;
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

        const tags = routeTable.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Private-Route-Table-AZ2' });
      });

      test('PrivateRouteTable3 should have correct configuration', () => {
        const routeTable = template.Resources.PrivateRouteTable3;
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

        const tags = routeTable.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Private-Route-Table-AZ3' });
      });

      test('PrivateRoute1 should route to NATGateway1', () => {
        const route = template.Resources.PrivateRoute1;
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      });

      test('PrivateRoute2 should route to NATGateway2', () => {
        const route = template.Resources.PrivateRoute2;
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      });

      test('PrivateRoute3 should route to NATGateway3', () => {
        const route = template.Resources.PrivateRoute3;
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
      });

      test('private route tables should be associated with correct private subnets', () => {
        const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
        const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
        const assoc3 = template.Resources.PrivateSubnet3RouteTableAssociation;

        expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
        expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });

        expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
        expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });

        expect(assoc3.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
        expect(assoc3.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
      });
    });
  });

  // ==================== Security Groups Tests ====================
  describe('Security Groups', () => {
    describe('Web Security Group', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.WebSecurityGroup).toBeDefined();
        expect(template.Resources.WebSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should be associated with VPC', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('should have description', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.GroupDescription).toBe('Security group for web servers');
      });

      test('should allow HTTP traffic from anywhere', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const httpRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

        expect(httpRule).toBeDefined();
        expect(httpRule.IpProtocol).toBe('tcp');
        expect(httpRule.FromPort).toBe(80);
        expect(httpRule.ToPort).toBe(80);
        expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      });

      test('should allow HTTPS traffic from anywhere', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const httpsRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);

        expect(httpsRule).toBeDefined();
        expect(httpsRule.IpProtocol).toBe('tcp');
        expect(httpsRule.FromPort).toBe(443);
        expect(httpsRule.ToPort).toBe(443);
        expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      });

      test('should have exactly 2 ingress rules', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.SecurityGroupIngress).toHaveLength(2);
      });

      test('should allow all outbound traffic', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const egressRule = properties.SecurityGroupEgress[0];

        expect(egressRule.IpProtocol).toBe('-1');
        expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.WebSecurityGroup.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Web-Security-Group' });
      });
    });
  });

  // ==================== IAM Resources Tests ====================
  describe('IAM Resources', () => {
    describe('EC2 Role', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2Role).toBeDefined();
        expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct trust policy for EC2', () => {
        const properties = template.Resources.EC2Role.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement).toHaveLength(1);

        const statement = assumePolicy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
        expect(statement.Action).toBe('sts:AssumeRole');
      });

      test('should have CloudWatch Agent managed policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      });

      test('should have SSM managed policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      });

      test('should have exactly 2 managed policies', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.ManagedPolicyArns).toHaveLength(2);
      });

      test('should have S3 access policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

        expect(s3Policy).toBeDefined();
        expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');
      });

      test('S3 policy should allow S3 operations', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
        const statements = s3Policy.PolicyDocument.Statement;

        const s3Statement = statements.find((s: any) =>
          s.Action.includes('s3:GetObject') ||
          s.Action.includes('s3:PutObject') ||
          s.Action.includes('s3:ListBucket')
        );

        expect(s3Statement).toBeDefined();
        expect(s3Statement.Effect).toBe('Allow');
        expect(s3Statement.Action).toContain('s3:GetObject');
        expect(s3Statement.Action).toContain('s3:PutObject');
        expect(s3Statement.Action).toContain('s3:ListBucket');
      });

      test('S3 policy should reference ApplicationS3Bucket', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
        const statements = s3Policy.PolicyDocument.Statement;

        const s3Statement = statements.find((s: any) =>
          JSON.stringify(s.Resource).includes('ApplicationS3Bucket')
        );

        expect(s3Statement).toBeDefined();
      });

      test('should have CloudWatch Logs policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
        const statements = s3Policy.PolicyDocument.Statement;

        const logsStatement = statements.find((s: any) =>
          s.Action.includes('logs:CreateLogGroup') ||
          s.Action.includes('logs:CreateLogStream') ||
          s.Action.includes('logs:PutLogEvents')
        );

        expect(logsStatement).toBeDefined();
        expect(logsStatement.Effect).toBe('Allow');
        expect(logsStatement.Action).toContain('logs:CreateLogGroup');
        expect(logsStatement.Action).toContain('logs:CreateLogStream');
        expect(logsStatement.Action).toContain('logs:PutLogEvents');
        expect(logsStatement.Action).toContain('logs:DescribeLogStreams');
      });

      test('CloudWatch Logs policy should allow all resources', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
        const statements = s3Policy.PolicyDocument.Statement;

        const logsStatement = statements.find((s: any) =>
          s.Action.includes('logs:CreateLogGroup')
        );

        expect(logsStatement.Resource).toBe('*');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.EC2Role.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'EC2-Instance-Role' });
      });
    });

    describe('EC2 Instance Profile', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2InstanceProfile).toBeDefined();
        expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      });

      test('should reference EC2 role', () => {
        const properties = template.Resources.EC2InstanceProfile.Properties;
        expect(properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
      });
    });
  });

  // ==================== S3 Buckets Tests ====================
  describe('S3 Buckets', () => {
    describe('Logging S3 Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.LoggingS3Bucket).toBeDefined();
        expect(template.Resources.LoggingS3Bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.LoggingS3Bucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'logging-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
        });
      });

      test('should have ownership controls', () => {
        const properties = template.Resources.LoggingS3Bucket.Properties;
        expect(properties.OwnershipControls).toBeDefined();
        expect(properties.OwnershipControls.Rules).toHaveLength(1);
        expect(properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
      });

      test('should block all public access', () => {
        const properties = template.Resources.LoggingS3Bucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have AES256 encryption', () => {
        const properties = template.Resources.LoggingS3Bucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should have lifecycle policy for log deletion', () => {
        const properties = template.Resources.LoggingS3Bucket.Properties;
        const lifecycleRules = properties.LifecycleConfiguration.Rules;

        expect(lifecycleRules).toHaveLength(1);
        expect(lifecycleRules[0].Id).toBe('DeleteOldLogs');
        expect(lifecycleRules[0].Status).toBe('Enabled');
        expect(lifecycleRules[0].ExpirationInDays).toBe(90);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.LoggingS3Bucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Logging-Bucket' });
      });
    });

    describe('Application S3 Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ApplicationS3Bucket).toBeDefined();
        expect(template.Resources.ApplicationS3Bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'app-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
        });
      });

      test('should have ownership controls', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        expect(properties.OwnershipControls).toBeDefined();
        expect(properties.OwnershipControls.Rules).toHaveLength(1);
        expect(properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
      });

      test('should block all public access', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have AES256 encryption', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should log to LoggingS3Bucket', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        const loggingConfig = properties.LoggingConfiguration;

        expect(loggingConfig.DestinationBucketName).toEqual({ Ref: 'LoggingS3Bucket' });
        expect(loggingConfig.LogFilePrefix).toBe('application-logs/');
      });

      test('should have versioning enabled', () => {
        const properties = template.Resources.ApplicationS3Bucket.Properties;
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.ApplicationS3Bucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Application-Bucket' });
      });
    });
  });

  // ==================== EC2 Instances Tests ====================
  describe('EC2 Instances', () => {
    describe('EC2Instance1', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2Instance1).toBeDefined();
        expect(template.Resources.EC2Instance1.Type).toBe('AWS::EC2::Instance');
      });

      test('should use AMI parameter', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      });

      test('should use instance type parameter', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      });

      test('should be in PrivateSubnet1', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      });

      test('should be associated with WebSecurityGroup', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.SecurityGroupIds).toEqual([{ Ref: 'WebSecurityGroup' }]);
      });

      test('should use EC2 instance profile', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      });

      test('should have monitoring enabled', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.Monitoring).toBe(true);
      });

      test('should have user data script', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        expect(properties.UserData).toBeDefined();
        expect(properties.UserData['Fn::Base64']).toBeDefined();
      });

      test('user data should contain httpd installation', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        const userData = JSON.stringify(properties.UserData['Fn::Base64']);
        expect(userData).toContain('yum install -y httpd');
      });

      test('user data should contain CloudWatch agent installation', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        const userData = JSON.stringify(properties.UserData['Fn::Base64']);
        expect(userData).toContain('amazon-cloudwatch-agent');
      });

      test('user data should start httpd service', () => {
        const properties = template.Resources.EC2Instance1.Properties;
        const userData = JSON.stringify(properties.UserData['Fn::Base64']);
        expect(userData).toContain('systemctl start httpd');
        expect(userData).toContain('systemctl enable httpd');
      });

      test('should have creation policy with timeout', () => {
        const instance = template.Resources.EC2Instance1;
        expect(instance.CreationPolicy).toBeDefined();
        expect(instance.CreationPolicy.ResourceSignal).toBeDefined();
        expect(instance.CreationPolicy.ResourceSignal.Timeout).toBe('PT10M');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.EC2Instance1.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Web-Server-AZ1' });
      });
    });

    describe('EC2Instance2', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2Instance2).toBeDefined();
        expect(template.Resources.EC2Instance2.Type).toBe('AWS::EC2::Instance');
      });

      test('should be in PrivateSubnet2', () => {
        const properties = template.Resources.EC2Instance2.Properties;
        expect(properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      });

      test('should have monitoring enabled', () => {
        const properties = template.Resources.EC2Instance2.Properties;
        expect(properties.Monitoring).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.EC2Instance2.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Web-Server-AZ2' });
      });
    });

    describe('EC2Instance3', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2Instance3).toBeDefined();
        expect(template.Resources.EC2Instance3.Type).toBe('AWS::EC2::Instance');
      });

      test('should be in PrivateSubnet3', () => {
        const properties = template.Resources.EC2Instance3.Properties;
        expect(properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
      });

      test('should have monitoring enabled', () => {
        const properties = template.Resources.EC2Instance3.Properties;
        expect(properties.Monitoring).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.EC2Instance3.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'Web-Server-AZ3' });
      });
    });

    test('all EC2 instances should be in private subnets', () => {
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(template.Resources.EC2Instance3.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
    });

    test('all EC2 instances should have the same security group', () => {
      expect(template.Resources.EC2Instance1.Properties.SecurityGroupIds).toEqual([{ Ref: 'WebSecurityGroup' }]);
      expect(template.Resources.EC2Instance2.Properties.SecurityGroupIds).toEqual([{ Ref: 'WebSecurityGroup' }]);
      expect(template.Resources.EC2Instance3.Properties.SecurityGroupIds).toEqual([{ Ref: 'WebSecurityGroup' }]);
    });

    test('all EC2 instances should have the same IAM instance profile', () => {
      expect(template.Resources.EC2Instance1.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(template.Resources.EC2Instance2.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(template.Resources.EC2Instance3.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });
  });

  // ==================== CloudWatch Alarms Tests ====================
  describe('CloudWatch Alarms', () => {
    describe('CPUAlarmInstance1', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CPUAlarmInstance1).toBeDefined();
        expect(template.Resources.CPUAlarmInstance1.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct description', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.AlarmDescription).toBe('Alarm when CPU exceeds 80% on Instance 1');
      });

      test('should monitor CPUUtilization metric', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.MetricName).toBe('CPUUtilization');
        expect(properties.Namespace).toBe('AWS/EC2');
      });

      test('should have correct threshold configuration', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.Statistic).toBe('Average');
        expect(properties.Period).toBe(300);
        expect(properties.EvaluationPeriods).toBe(2);
        expect(properties.Threshold).toBe(80);
        expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });

      test('should monitor EC2Instance1', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.Dimensions).toHaveLength(1);
        expect(properties.Dimensions[0].Name).toBe('InstanceId');
        expect(properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance1' });
      });

      test('should have empty alarm actions', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.AlarmActions).toEqual([]);
      });

      test('should treat missing data as not breaching', () => {
        const properties = template.Resources.CPUAlarmInstance1.Properties;
        expect(properties.TreatMissingData).toBe('notBreaching');
      });
    });

    describe('CPUAlarmInstance2', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CPUAlarmInstance2).toBeDefined();
        expect(template.Resources.CPUAlarmInstance2.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct description', () => {
        const properties = template.Resources.CPUAlarmInstance2.Properties;
        expect(properties.AlarmDescription).toBe('Alarm when CPU exceeds 80% on Instance 2');
      });

      test('should monitor EC2Instance2', () => {
        const properties = template.Resources.CPUAlarmInstance2.Properties;
        expect(properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance2' });
      });
    });

    describe('CPUAlarmInstance3', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CPUAlarmInstance3).toBeDefined();
        expect(template.Resources.CPUAlarmInstance3.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct description', () => {
        const properties = template.Resources.CPUAlarmInstance3.Properties;
        expect(properties.AlarmDescription).toBe('Alarm when CPU exceeds 80% on Instance 3');
      });

      test('should monitor EC2Instance3', () => {
        const properties = template.Resources.CPUAlarmInstance3.Properties;
        expect(properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance3' });
      });
    });

    test('all alarms should have the same threshold', () => {
      expect(template.Resources.CPUAlarmInstance1.Properties.Threshold).toBe(80);
      expect(template.Resources.CPUAlarmInstance2.Properties.Threshold).toBe(80);
      expect(template.Resources.CPUAlarmInstance3.Properties.Threshold).toBe(80);
    });

    test('all alarms should have the same evaluation period', () => {
      expect(template.Resources.CPUAlarmInstance1.Properties.EvaluationPeriods).toBe(2);
      expect(template.Resources.CPUAlarmInstance2.Properties.EvaluationPeriods).toBe(2);
      expect(template.Resources.CPUAlarmInstance3.Properties.EvaluationPeriods).toBe(2);
    });
  });

  // ==================== Outputs Tests ====================
  describe('Outputs', () => {
    test('should have 15 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15);
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-ID' });
    });

    test('PublicSubnet1Id output should be correct', () => {
      const output = template.Outputs.PublicSubnet1Id;
      expect(output.Description).toBe('Public Subnet 1 ID');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet1-ID' });
    });

    test('PublicSubnet2Id output should be correct', () => {
      const output = template.Outputs.PublicSubnet2Id;
      expect(output.Description).toBe('Public Subnet 2 ID');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet2' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet2-ID' });
    });

    test('PublicSubnet3Id output should be correct', () => {
      const output = template.Outputs.PublicSubnet3Id;
      expect(output.Description).toBe('Public Subnet 3 ID');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet3' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet3-ID' });
    });

    test('PrivateSubnet1Id output should be correct', () => {
      const output = template.Outputs.PrivateSubnet1Id;
      expect(output.Description).toBe('Private Subnet 1 ID');
      expect(output.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PrivateSubnet1-ID' });
    });

    test('PrivateSubnet2Id output should be correct', () => {
      const output = template.Outputs.PrivateSubnet2Id;
      expect(output.Description).toBe('Private Subnet 2 ID');
      expect(output.Value).toEqual({ Ref: 'PrivateSubnet2' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PrivateSubnet2-ID' });
    });

    test('PrivateSubnet3Id output should be correct', () => {
      const output = template.Outputs.PrivateSubnet3Id;
      expect(output.Description).toBe('Private Subnet 3 ID');
      expect(output.Value).toEqual({ Ref: 'PrivateSubnet3' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PrivateSubnet3-ID' });
    });

    test('NATGateway outputs should be correct', () => {
      const nat1 = template.Outputs.NATGateway1Id;
      const nat2 = template.Outputs.NATGateway2Id;
      const nat3 = template.Outputs.NATGateway3Id;

      expect(nat1.Description).toBe('NAT Gateway 1 ID');
      expect(nat1.Value).toEqual({ Ref: 'NATGateway1' });

      expect(nat2.Description).toBe('NAT Gateway 2 ID');
      expect(nat2.Value).toEqual({ Ref: 'NATGateway2' });

      expect(nat3.Description).toBe('NAT Gateway 3 ID');
      expect(nat3.Value).toEqual({ Ref: 'NATGateway3' });
    });

    test('ApplicationS3BucketName output should be correct', () => {
      const output = template.Outputs.ApplicationS3BucketName;
      expect(output.Description).toBe('Application S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'ApplicationS3Bucket' });
    });

    test('SecurityGroupId output should be correct', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe('Web Security Group ID');
      expect(output.Value).toEqual({ Ref: 'WebSecurityGroup' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-SecurityGroup-ID' });
    });

    test('EC2 instance outputs should be correct', () => {
      const instance1 = template.Outputs.EC2Instance1Id;
      const instance2 = template.Outputs.EC2Instance2Id;
      const instance3 = template.Outputs.EC2Instance3Id;

      expect(instance1.Description).toBe('EC2 Instance 1 ID');
      expect(instance1.Value).toEqual({ Ref: 'EC2Instance1' });

      expect(instance2.Description).toBe('EC2 Instance 2 ID');
      expect(instance2.Value).toEqual({ Ref: 'EC2Instance2' });

      expect(instance3.Description).toBe('EC2 Instance 3 ID');
      expect(instance3.Value).toEqual({ Ref: 'EC2Instance3' });
    });
  });

  // ==================== Security Best Practices Tests ====================
  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const loggingBucket = template.Resources.LoggingS3Bucket.Properties;
      const appBucket = template.Resources.ApplicationS3Bucket.Properties;

      expect(loggingBucket.BucketEncryption).toBeDefined();
      expect(appBucket.BucketEncryption).toBeDefined();
    });

    test('all S3 buckets should block public access', () => {
      const loggingBucket = template.Resources.LoggingS3Bucket.Properties;
      const appBucket = template.Resources.ApplicationS3Bucket.Properties;

      [loggingBucket, appBucket].forEach(bucket => {
        const publicAccessBlock = bucket.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('EC2 instances should be in private subnets', () => {
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(template.Resources.EC2Instance3.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
    });

    test('NAT gateways should be in public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });

    test('EC2 role should have SSM and CloudWatch managed policies', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 role should follow least privilege for S3 access', () => {
      const role = template.Resources.EC2Role.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const statements = s3Policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) =>
        JSON.stringify(s.Resource).includes('ApplicationS3Bucket')
      );

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).not.toBe('*');
    });

    test('security group should only allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(2);

      const ports = sg.SecurityGroupIngress.map((r: any) => r.FromPort);
      expect(ports).toEqual([80, 443]);
    });

    test('application bucket should have versioning enabled', () => {
      const appBucket = template.Resources.ApplicationS3Bucket.Properties;
      expect(appBucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('application bucket should have logging enabled', () => {
      const appBucket = template.Resources.ApplicationS3Bucket.Properties;
      expect(appBucket.LoggingConfiguration).toBeDefined();
      expect(appBucket.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LoggingS3Bucket' });
    });

    test('logging bucket should have lifecycle policy', () => {
      const loggingBucket = template.Resources.LoggingS3Bucket.Properties;
      expect(loggingBucket.LifecycleConfiguration).toBeDefined();
      expect(loggingBucket.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(loggingBucket.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
    });

    test('all resources should be properly tagged', () => {
      const resourcesWithTags = [
        'VPC', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
        'InternetGateway', 'NATGateway1', 'NATGateway2', 'NATGateway3',
        'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3',
        'WebSecurityGroup', 'EC2Role', 'LoggingS3Bucket', 'ApplicationS3Bucket',
        'EC2Instance1', 'EC2Instance2', 'EC2Instance3'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
          expect(resource.Properties.Tags.length).toBeGreaterThan(0);
        }
      });
    });

    test('EC2 instances should have monitoring enabled', () => {
      expect(template.Resources.EC2Instance1.Properties.Monitoring).toBe(true);
      expect(template.Resources.EC2Instance2.Properties.Monitoring).toBe(true);
      expect(template.Resources.EC2Instance3.Properties.Monitoring).toBe(true);
    });

    test('CloudWatch alarms should monitor all EC2 instances', () => {
      const alarm1 = template.Resources.CPUAlarmInstance1.Properties.Dimensions[0].Value;
      const alarm2 = template.Resources.CPUAlarmInstance2.Properties.Dimensions[0].Value;
      const alarm3 = template.Resources.CPUAlarmInstance3.Properties.Dimensions[0].Value;

      expect(alarm1).toEqual({ Ref: 'EC2Instance1' });
      expect(alarm2).toEqual({ Ref: 'EC2Instance2' });
      expect(alarm3).toEqual({ Ref: 'EC2Instance3' });
    });

    test('resources should be distributed across 3 availability zones', () => {
      // Verify subnets are in different AZs
      const publicSubnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const publicSubnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      const publicSubnet3AZ = template.Resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0];

      expect(publicSubnet1AZ).toBe(0);
      expect(publicSubnet2AZ).toBe(1);
      expect(publicSubnet3AZ).toBe(2);
    });

    test('EIPs should depend on gateway attachment', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway3EIP.DependsOn).toBe('AttachGateway');
    });

    test('public route should depend on gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });
  });

  // ==================== Resource Dependencies Tests ====================
  describe('Resource Dependencies', () => {
    test('NAT Gateways should depend on EIPs', () => {
      expect(template.Resources.NATGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId']
      });
      expect(template.Resources.NATGateway2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId']
      });
      expect(template.Resources.NATGateway3.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway3EIP', 'AllocationId']
      });
    });

    test('private routes should reference correct NAT gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
    });

    test('application bucket should reference logging bucket', () => {
      const appBucket = template.Resources.ApplicationS3Bucket.Properties;
      expect(appBucket.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LoggingS3Bucket' });
    });

    test('EC2 instances should reference correct resources', () => {
      expect(template.Resources.EC2Instance1.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(template.Resources.EC2Instance1.Properties.SecurityGroupIds).toEqual([{ Ref: 'WebSecurityGroup' }]);
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    });

    test('instance profile should reference EC2 role', () => {
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('CloudWatch alarms should reference correct EC2 instances', () => {
      expect(template.Resources.CPUAlarmInstance1.Properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance1' });
      expect(template.Resources.CPUAlarmInstance2.Properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance2' });
      expect(template.Resources.CPUAlarmInstance3.Properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance3' });
    });
  });
});

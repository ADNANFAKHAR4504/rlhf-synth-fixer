import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - VPC Migration', () => {
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

    test('should have a description for three-tier VPC', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Three-Tier VPC Architecture');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('migration');
    });

    test('should have EnvironmentType parameter with allowed values', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });
  });

  describe('VPC and Basic Networking', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'MigrationPhase')).toBeDefined();
    });
  });

  describe('Public Subnets', () => {
    test('should create public subnet in AZ1 with correct CIDR', () => {
      const subnet = template.Resources.PublicSubnetAZ1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public subnet in AZ2 with correct CIDR', () => {
      const subnet = template.Resources.PublicSubnetAZ2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should use different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnetAZ1;
      const subnet2 = template.Resources.PublicSubnetAZ2;
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('public subnets should have web tier tags', () => {
      const subnet = template.Resources.PublicSubnetAZ1;
      const tags = subnet.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Tier' && t.Value === 'web')).toBeDefined();
    });
  });

  describe('Private Subnets', () => {
    test('should create private subnet in AZ1 with correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnetAZ1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should create private subnet in AZ2 with correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnetAZ2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('private subnets should NOT map public IPs on launch', () => {
      const subnet1 = template.Resources.PrivateSubnetAZ1;
      const subnet2 = template.Resources.PrivateSubnetAZ2;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('private subnets should have application tier tags', () => {
      const subnet = template.Resources.PrivateSubnetAZ1;
      const tags = subnet.Properties.Tags;
      expect(
        tags.find((t: any) => t.Key === 'Tier' && t.Value === 'application')
      ).toBeDefined();
    });
  });

  describe('Isolated Database Subnets', () => {
    test('should create isolated subnet in AZ1 with correct CIDR', () => {
      const subnet = template.Resources.IsolatedSubnetAZ1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.21.0/24');
    });

    test('should create isolated subnet in AZ2 with correct CIDR', () => {
      const subnet = template.Resources.IsolatedSubnetAZ2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.22.0/24');
    });

    test('isolated subnets should have database tier tags', () => {
      const subnet = template.Resources.IsolatedSubnetAZ1;
      const tags = subnet.Properties.Tags;
      expect(
        tags.find((t: any) => t.Key === 'Tier' && t.Value === 'database')
      ).toBeDefined();
    });
  });

  describe('NAT Gateways and Elastic IPs', () => {
    test('should create Elastic IP for AZ1', () => {
      const eip = template.Resources.EIPAZ1;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should create Elastic IP for AZ2', () => {
      const eip = template.Resources.EIPAZ2;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should create NAT Gateway in AZ1', () => {
      const nat = template.Resources.NATGatewayAZ1;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPAZ1', 'AllocationId'],
      });
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
    });

    test('should create NAT Gateway in AZ2', () => {
      const nat = template.Resources.NATGatewayAZ2;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPAZ2', 'AllocationId'],
      });
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ2' });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should create public route table', () => {
      const rt = template.Resources.PublicRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create internet route in public route table', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should associate public subnets with public route table', () => {
      const assoc1 = template.Resources.PublicSubnetRouteTableAssociationAZ1;
      const assoc2 = template.Resources.PublicSubnetRouteTableAssociationAZ2;
      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ2' });
    });

    test('should create separate private route tables for each AZ', () => {
      const rt1 = template.Resources.PrivateRouteTableAZ1;
      const rt2 = template.Resources.PrivateRouteTableAZ2;
      expect(rt1).toBeDefined();
      expect(rt2).toBeDefined();
      expect(rt1.Type).toBe('AWS::EC2::RouteTable');
      expect(rt2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should create NAT routes in private route tables', () => {
      const route1 = template.Resources.PrivateRouteAZ1;
      const route2 = template.Resources.PrivateRouteAZ2;
      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NATGatewayAZ1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NATGatewayAZ2' });
      expect(route1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should create isolated route tables for database subnets', () => {
      const rt1 = template.Resources.IsolatedRouteTableAZ1;
      const rt2 = template.Resources.IsolatedRouteTableAZ2;
      expect(rt1).toBeDefined();
      expect(rt2).toBeDefined();
      expect(rt1.Type).toBe('AWS::EC2::RouteTable');
      expect(rt2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('isolated route tables should have NO internet routes', () => {
      const isolatedRoutes = Object.keys(template.Resources).filter(
        key =>
          key.startsWith('IsolatedRoute') &&
          template.Resources[key].Type === 'AWS::EC2::Route'
      );
      expect(isolatedRoutes.length).toBe(0);
    });

    test('should associate isolated subnets with isolated route tables', () => {
      const assoc1 = template.Resources.IsolatedSubnetRouteTableAssociationAZ1;
      const assoc2 = template.Resources.IsolatedSubnetRouteTableAssociationAZ2;
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'IsolatedSubnetAZ1' });
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'IsolatedSubnetAZ2' });
    });
  });

  describe('Security Groups', () => {
    test('should create web server security group', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('web server security group should allow HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(2);
      const http = ingress.find((r: any) => r.FromPort === 80);
      const https = ingress.find((r: any) => r.FromPort === 443);
      expect(http).toBeDefined();
      expect(https).toBeDefined();
      expect(http.CidrIp).toBe('0.0.0.0/0');
      expect(https.CidrIp).toBe('0.0.0.0/0');
    });

    test('should create app server security group', () => {
      const sg = template.Resources.AppServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('app server security group should allow port 8080 from web tier only', () => {
      const sg = template.Resources.AppServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(8080);
      expect(ingress[0].ToPort).toBe(8080);
      expect(ingress[0].SourceSecurityGroupId).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });

    test('should create database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should allow port 3306 from app tier only', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({
        Ref: 'AppServerSecurityGroup',
      });
    });

    test('security groups should have Environment and MigrationPhase tags', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      const appSg = template.Resources.AppServerSecurityGroup;
      const dbSg = template.Resources.DatabaseSecurityGroup;
      [webSg, appSg, dbSg].forEach(sg => {
        const tags = sg.Properties.Tags;
        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'MigrationPhase')).toBeDefined();
      });
    });
  });

  describe('Network ACLs', () => {
    test('should create public network ACL', () => {
      const nacl = template.Resources.PublicNetworkAcl;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(nacl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('public network ACL should allow HTTP ingress', () => {
      const entry = template.Resources.PublicNetworkAclIngressHTTP;
      expect(entry).toBeDefined();
      expect(entry.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      expect(entry.Properties.Protocol).toBe(6);
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.PortRange.From).toBe(80);
      expect(entry.Properties.PortRange.To).toBe(80);
    });

    test('public network ACL should allow HTTPS ingress', () => {
      const entry = template.Resources.PublicNetworkAclIngressHTTPS;
      expect(entry).toBeDefined();
      expect(entry.Properties.PortRange.From).toBe(443);
      expect(entry.Properties.PortRange.To).toBe(443);
    });

    test('public network ACL should allow ephemeral ports', () => {
      const entry = template.Resources.PublicNetworkAclIngressEphemeral;
      expect(entry).toBeDefined();
      expect(entry.Properties.PortRange.From).toBe(1024);
      expect(entry.Properties.PortRange.To).toBe(65535);
    });

    test('public network ACL should allow all egress', () => {
      const entry = template.Resources.PublicNetworkAclEgressAll;
      expect(entry).toBeDefined();
      expect(entry.Properties.Egress).toBe(true);
      expect(entry.Properties.Protocol).toBe(-1);
      expect(entry.Properties.RuleAction).toBe('allow');
    });

    test('should create private network ACL', () => {
      const nacl = template.Resources.PrivateNetworkAcl;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('private network ACL should allow port 8080 from VPC', () => {
      const entry = template.Resources.PrivateNetworkAclIngressApp;
      expect(entry).toBeDefined();
      expect(entry.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(entry.Properties.PortRange.From).toBe(8080);
      expect(entry.Properties.PortRange.To).toBe(8080);
    });

    test('should create isolated network ACL', () => {
      const nacl = template.Resources.IsolatedNetworkAcl;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('isolated network ACL should allow port 3306 from VPC only', () => {
      const entry = template.Resources.IsolatedNetworkAclIngressDB;
      expect(entry).toBeDefined();
      expect(entry.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(entry.Properties.PortRange.From).toBe(3306);
      expect(entry.Properties.PortRange.To).toBe(3306);
    });

    test('isolated network ACL egress should only allow VPC traffic', () => {
      const entry = template.Resources.IsolatedNetworkAclEgressAll;
      expect(entry).toBeDefined();
      expect(entry.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(entry.Properties.Egress).toBe(true);
    });

    test('should associate public subnets with public NACL', () => {
      const assoc1 = template.Resources.PublicSubnetNetworkAclAssociationAZ1;
      const assoc2 = template.Resources.PublicSubnetNetworkAclAssociationAZ2;
      expect(assoc1).toBeDefined();
      expect(assoc2).toBeDefined();
      expect(assoc1.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
    });

    test('should associate private subnets with private NACL', () => {
      const assoc1 = template.Resources.PrivateSubnetNetworkAclAssociationAZ1;
      const assoc2 = template.Resources.PrivateSubnetNetworkAclAssociationAZ2;
      expect(assoc1).toBeDefined();
      expect(assoc2).toBeDefined();
      expect(assoc1.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
    });

    test('should associate isolated subnets with isolated NACL', () => {
      const assoc1 = template.Resources.IsolatedSubnetNetworkAclAssociationAZ1;
      const assoc2 = template.Resources.IsolatedSubnetNetworkAclAssociationAZ2;
      expect(assoc1).toBeDefined();
      expect(assoc2).toBeDefined();
      expect(assoc1.Properties.NetworkAclId).toEqual({
        Ref: 'IsolatedNetworkAcl',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Description).toContain('VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should output all subnet IDs', () => {
      const expectedOutputs = [
        'PublicSubnetAZ1Id',
        'PublicSubnetAZ2Id',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'IsolatedSubnetAZ1Id',
        'IsolatedSubnetAZ2Id',
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should output all security group IDs', () => {
      const expectedOutputs = [
        'WebServerSecurityGroupId',
        'AppServerSecurityGroupId',
        'DatabaseSecurityGroupId',
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export).toBeDefined();
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming and Tags', () => {
    test('all resources should use EnvironmentSuffix in naming', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'PrivateSubnetAZ1',
        'IsolatedSubnetAZ1',
        'WebServerSecurityGroup',
        'AppServerSecurityGroup',
        'DatabaseSecurityGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('all major resources should have Environment tag', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'WebServerSecurityGroup',
        'PublicNetworkAcl',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
        }
      });
    });

    test('all major resources should have MigrationPhase tag', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'WebServerSecurityGroup',
        'PublicNetworkAcl',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const migrationTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'MigrationPhase'
          );
          expect(migrationTag).toBeDefined();
        }
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have exactly 3 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(3);
    });

    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::NetworkAcl');
    });

    test('should have exactly 10 outputs (1 VPC + 6 subnets + 3 security groups)', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });

    test('should have exactly 6 subnets (2 public + 2 private + 2 isolated)', () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBe(6);
    });

    test('should have exactly 3 security groups', () => {
      const securityGroups = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBe(3);
    });

    test('should have exactly 2 NAT Gateways', () => {
      const natGateways = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways.length).toBe(2);
    });

    test('should have exactly 3 network ACLs (public, private, isolated)', () => {
      const nacls = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::NetworkAcl'
      );
      expect(nacls.length).toBe(3);
    });
  });
});

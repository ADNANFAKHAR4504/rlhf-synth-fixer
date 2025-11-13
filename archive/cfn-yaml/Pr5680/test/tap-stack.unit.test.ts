import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation VPC Template', () => {
  let template: any;

  beforeAll(() => {
    // Template is in YAML format. run `pipenv run cfn-flip-to-json` to convert
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for VPC infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('PCI-DSS');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Default).toBe('development');
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Default).toBe('digital-banking');
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Default).toBe('platform-team');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(4);

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC gateway attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('gateway attachment should reference VPC and IGW', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnets', () => {
    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });
  });

  describe('Private Subnets', () => {
    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });
  });

  describe('NAT Gateways', () => {
    test('should have three NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();
    });

    test('should have three Elastic IPs', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP3).toBeDefined();
    });

    test('NAT Gateways should depend on gateway attachment', () => {
      expect(template.Resources.NATGateway1.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway3.DependsOn).toBe('AttachGateway');
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

    test('should have three private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('public route should point to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private routes should point to respective NAT Gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
    });
  });

  describe('Route Table Associations', () => {
    test('should have all three public subnet associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation3).toBeDefined();
    });

    test('should have all three private subnet associations', () => {
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation3).toBeDefined();
    });

    test('public subnets should be associated with public route table', () => {
      const assoc1 = template.Resources.PublicSubnetRouteTableAssociation1;
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('private subnets should be associated with respective private route tables', () => {
      const assoc1 = template.Resources.PrivateSubnetRouteTableAssociation1;
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    });
  });

  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DatabaseSecurityGroup', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web server SG should allow HTTPS from anywhere', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );

      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBeDefined();
    });

    test('web server SG should allow SSH only from VPC', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
      expect(sshRule.Description).toBeDefined();
    });

    test('database SG should only allow access from web server SG', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const pgRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 5432
      );

      expect(pgRule).toBeDefined();
      expect(pgRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(pgRule.CidrIp).toBeUndefined();
      expect(pgRule.Description).toContain('web servers');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have all public subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
    });

    test('should have all private subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      expect(template.Outputs.NATGateway1Id).toBeDefined();
      expect(template.Outputs.NATGateway2Id).toBeDefined();
      expect(template.Outputs.NATGateway3Id).toBeDefined();
    });

    test('should have Internet Gateway output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environmentSuffix parameter in names', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');

      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });

    test('security groups should use environmentSuffix in names', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg.Properties.GroupName).toEqual({
        'Fn::Sub': 'web-server-sg-${EnvironmentSuffix}'
      });

      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(dbSg.Properties.GroupName).toEqual({
        'Fn::Sub': 'database-sg-${EnvironmentSuffix}'
      });
    });
  });

  describe('PCI-DSS Compliance', () => {
    test('database SG should enforce network segmentation', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      // Should only have one rule allowing access from web servers
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({
        Ref: 'WebServerSecurityGroup'
      });
    });

    test('all security group rules should have descriptions', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      webSg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.Description).toBeDefined();
        expect(rule.Description.length).toBeGreaterThan(0);
      });

      const dbSg = template.Resources.DatabaseSecurityGroup;
      dbSg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.Description).toBeDefined();
        expect(rule.Description.length).toBeGreaterThan(0);
      });
    });

    test('private subnets should have dedicated route tables', () => {
      // Each private subnet should have its own route table
      const assoc1 = template.Resources.PrivateSubnetRouteTableAssociation1;
      const assoc2 = template.Resources.PrivateSubnetRouteTableAssociation2;
      const assoc3 = template.Resources.PrivateSubnetRouteTableAssociation3;

      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
      expect(assoc3.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  test('should have NAT Gateway in each AZ', () => {
    // NAT Gateway 1 in public subnet 1 (us-east-1a)
    expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    // NAT Gateway 2 in public subnet 2 (us-east-1b)
    expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    // NAT Gateway 3 in public subnet 3 (us-east-1c)
    expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
  });
});

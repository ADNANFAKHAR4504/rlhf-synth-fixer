import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation VPC Template', () => {
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
      expect(template.Description).toBe(
        'Multi-tier VPC infrastructure with public and private subnets across two availability zones'
      );
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

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('suffix');
    });

    test('should have BastionSSHCIDR parameter', () => {
      expect(template.Parameters.BastionSSHCIDR).toBeDefined();
      expect(template.Parameters.BastionSSHCIDR.Type).toBe('String');
      expect(template.Parameters.BastionSSHCIDR.AllowedPattern).toBeDefined();
    });

    test('should have tag parameters', () => {
      expect(template.Parameters.EnvironmentTag).toBeDefined();
      expect(template.Parameters.ProjectTag).toBeDefined();
      expect(template.Parameters.OwnerTag).toBeDefined();
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should be correct type', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostnames enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags including environment suffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });

    test('VPC should not have Retain deletion policy', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should be correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('InternetGateway should have proper tags', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Properties.Tags).toBeDefined();
      const nameTag = igw.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'igw-${EnvironmentSuffix}' });
    });
  });

  describe('Subnets', () => {
    test('should have exactly 4 subnets', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('all subnets should have proper tags with environment suffix', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.Tags).toBeDefined();
        const nameTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('all subnets should reference VPC', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });
  });

  describe('NAT Gateways', () => {
    test('should have 2 NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
    });

    test('NAT Gateways should be correct type', () => {
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have 2 Elastic IPs', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP2.Type).toBe('AWS::EC2::EIP');
    });

    test('EIPs should depend on VPCGatewayAttachment', () => {
      expect(template.Resources.EIP1.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.EIP2.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('EIPs should have domain VPC', () => {
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIP2.Properties.Domain).toBe('vpc');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('NAT Gateways should use EIP allocation IDs', () => {
      expect(template.Resources.NATGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIP1', 'AllocationId']
      });
      expect(template.Resources.NATGateway2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIP2', 'AllocationId']
      });
    });

    test('NAT Gateways should have proper tags', () => {
      ['NATGateway1', 'NATGateway2'].forEach(natGwName => {
        const natGw = template.Resources[natGwName];
        expect(natGw.Properties.Tags).toBeDefined();
        const nameTag = natGw.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Route Tables', () => {
    test('should have 3 route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('route tables should be correct type', () => {
      ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'].forEach(rtName => {
        expect(template.Resources[rtName].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('route tables should reference VPC', () => {
      ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'].forEach(rtName => {
        expect(template.Resources[rtName].Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('public route should point to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('private routes should point to NAT Gateways', () => {
      const privateRoute1 = template.Resources.PrivateRoute1;
      const privateRoute2 = template.Resources.PrivateRoute2;

      expect(privateRoute1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });

      expect(privateRoute2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];

      associations.forEach(assocName => {
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });

    test('public subnets should be associated with public route table', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('private subnets should be associated with respective private route tables', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });

    test('route tables should have proper tags', () => {
      ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'].forEach(rtName => {
        const rt = template.Resources[rtName];
        expect(rt.Properties.Tags).toBeDefined();
        const nameTag = rt.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have 3 security groups', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('security groups should be correct type', () => {
      ['BastionSecurityGroup', 'ApplicationSecurityGroup', 'DatabaseSecurityGroup'].forEach(sgName => {
        expect(template.Resources[sgName].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('security groups should reference VPC', () => {
      ['BastionSecurityGroup', 'ApplicationSecurityGroup', 'DatabaseSecurityGroup'].forEach(sgName => {
        expect(template.Resources[sgName].Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('security group names should not start with sg-', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const appSG = template.Resources.ApplicationSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      expect(bastionSG.Properties.GroupName['Fn::Sub']).not.toContain('sg-');
      expect(appSG.Properties.GroupName['Fn::Sub']).not.toContain('sg-');
      expect(dbSG.Properties.GroupName['Fn::Sub']).not.toContain('sg-');
    });

    test('bastion security group should allow SSH from parameter CIDR', () => {
      const sg = template.Resources.BastionSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress[0];

      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'BastionSSHCIDR' });
    });

    test('application security group should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('application security group should allow SSH from bastion', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) =>
        rule.FromPort === 22 && rule.SourceSecurityGroupId
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.SourceSecurityGroupId).toEqual({ Ref: 'BastionSecurityGroup' });
    });

    test('database security group should allow MySQL from application SG only', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const mysqlRule = sg.Properties.SecurityGroupIngress[0];

      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });

    test('security groups should have proper tags with environment suffix', () => {
      ['BastionSecurityGroup', 'ApplicationSecurityGroup', 'DatabaseSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.Tags).toBeDefined();
        const nameTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('security groups should have proper group names with environment suffix', () => {
      ['BastionSecurityGroup', 'ApplicationSecurityGroup', 'DatabaseSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toBeDefined();
        expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'BastionSecurityGroupId',
        'ApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'NATGateway1Id',
        'NATGateway2Id'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('VPC output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('subnet outputs should reference subnet resources', () => {
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.PublicSubnet2Id.Value).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Outputs.PrivateSubnet1Id.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Outputs.PrivateSubnet2Id.Value).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('security group outputs should reference security group resources', () => {
      expect(template.Outputs.BastionSecurityGroupId.Value).toEqual({ Ref: 'BastionSecurityGroup' });
      expect(template.Outputs.ApplicationSecurityGroupId.Value).toEqual({ Ref: 'ApplicationSecurityGroup' });
      expect(template.Outputs.DatabaseSecurityGroupId.Value).toEqual({ Ref: 'DatabaseSecurityGroup' });
    });

    test('NAT gateway outputs should reference NAT gateway resources', () => {
      expect(template.Outputs.NATGateway1Id.Value).toEqual({ Ref: 'NATGateway1' });
      expect(template.Outputs.NATGateway2Id.Value).toEqual({ Ref: 'NATGateway2' });
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 24 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(24);
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have exactly 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Tagging', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'Project', 'Owner'];
      const taggableResources = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        requiredTags.forEach(tagKey => {
          const tag = resource.Properties.Tags.find((t: any) => t.Key === tagKey);
          expect(tag).toBeDefined();
        });
      });
    });

    test('all taggable resources should have Name tag with environment suffix', () => {
      const taggableResources = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Deletion Policies', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('no resources should have deletion protection', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && 'DeletionProtectionEnabled' in resource.Properties) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Dependencies', () => {
    test('EIPs should depend on VPCGatewayAttachment', () => {
      expect(template.Resources.EIP1.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.EIP2.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('PublicRoute should depend on VPCGatewayAttachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });
});

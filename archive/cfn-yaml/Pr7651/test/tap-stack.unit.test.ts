import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Multi-AZ VPC Infrastructure', () => {
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
      expect(template.Description).toContain('Multi-AZ VPC Infrastructure');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });
  });

  describe('VPC Configuration', () => {
    test('should have TradingPlatformVPC resource', () => {
      expect(template.Resources.TradingPlatformVPC).toBeDefined();
      expect(template.Resources.TradingPlatformVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.TradingPlatformVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostnames enabled', () => {
      const vpc = template.Resources.TradingPlatformVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.TradingPlatformVPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.TradingPlatformVPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeInstanceOf(Array);

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value).toBe('Production');

      const projectTag = tags.find((t: any) => t.Key === 'Project');
      expect(projectTag.Value).toBe('TradingPlatform');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway resource', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('AttachGateway should reference VPC and InternetGateway', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('InternetGateway should have proper tags', () => {
      const igw = template.Resources.InternetGateway;
      const tags = igw.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
    });
  });

  describe('Public Subnets', () => {
    const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const expectedAZs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    test('should have all three public subnets', () => {
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have correct CIDR blocks', () => {
      publicSubnets.forEach((subnet, index) => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.CidrBlock).toBe(expectedCidrs[index]);
      });
    });

    test('public subnets should reference VPC', () => {
      publicSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      publicSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('public subnets should have proper tags', () => {
      publicSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        const tags = subnetResource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find((t: any) => t.Key === 'Type');
        expect(typeTag.Value).toBe('Public');
      });
    });
  });

  describe('Private Subnets', () => {
    const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
    const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
    const expectedAZs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    test('should have all three private subnets', () => {
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('private subnets should have correct CIDR blocks', () => {
      privateSubnets.forEach((subnet, index) => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.CidrBlock).toBe(expectedCidrs[index]);
      });
    });

    test('private subnets should reference VPC', () => {
      privateSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
      });
    });

    test('private subnets should have MapPublicIpOnLaunch disabled', () => {
      privateSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('private subnets should have proper tags', () => {
      privateSubnets.forEach(subnet => {
        const subnetResource = template.Resources[subnet];
        const tags = subnetResource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find((t: any) => t.Key === 'Type');
        expect(typeTag.Value).toBe('Private');
      });
    });
  });

  describe('Elastic IPs', () => {
    const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];

    test('should have all three Elastic IPs', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip]).toBeDefined();
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
      });
    });

    test('Elastic IPs should be in VPC domain', () => {
      eips.forEach(eip => {
        const eipResource = template.Resources[eip];
        expect(eipResource.Properties.Domain).toBe('vpc');
      });
    });

    test('Elastic IPs should depend on AttachGateway', () => {
      eips.forEach(eip => {
        const eipResource = template.Resources[eip];
        expect(eipResource.DependsOn).toBe('AttachGateway');
      });
    });

    test('Elastic IPs should have proper tags', () => {
      eips.forEach(eip => {
        const eipResource = template.Resources[eip];
        const tags = eipResource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
      });
    });
  });

  describe('NAT Gateways', () => {
    const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
    const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
    const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];

    test('should have all three NAT Gateways', () => {
      natGateways.forEach(natGw => {
        expect(template.Resources[natGw]).toBeDefined();
        expect(template.Resources[natGw].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('NAT Gateways should be in correct public subnets', () => {
      natGateways.forEach((natGw, index) => {
        const natGwResource = template.Resources[natGw];
        expect(natGwResource.Properties.SubnetId).toEqual({ Ref: publicSubnets[index] });
      });
    });

    test('NAT Gateways should reference correct Elastic IPs', () => {
      natGateways.forEach((natGw, index) => {
        const natGwResource = template.Resources[natGw];
        expect(natGwResource.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [eips[index], 'AllocationId']
        });
      });
    });

    test('NAT Gateways should have proper tags', () => {
      natGateways.forEach(natGw => {
        const natGwResource = template.Resources[natGw];
        const tags = natGwResource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
      });
    });
  });

  describe('Public Route Table', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PublicRouteTable should reference VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
    });

    test('should have PublicRoute resource', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PublicRoute should route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('PublicRoute should depend on AttachGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should have route table associations for all public subnets', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation'
      ];
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      associations.forEach((assoc, index) => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');

        const association = template.Resources[assoc];
        expect(association.Properties.SubnetId).toEqual({ Ref: subnets[index] });
        expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });
    });
  });

  describe('Private Route Tables', () => {
    const privateRouteTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];
    const privateRoutes = ['PrivateRoute1', 'PrivateRoute2', 'PrivateRoute3'];
    const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
    const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];

    test('should have all three private route tables', () => {
      privateRouteTables.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('private route tables should reference VPC', () => {
      privateRouteTables.forEach(rt => {
        const routeTable = template.Resources[rt];
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
      });
    });

    test('should have all three private routes', () => {
      privateRoutes.forEach(route => {
        expect(template.Resources[route]).toBeDefined();
        expect(template.Resources[route].Type).toBe('AWS::EC2::Route');
      });
    });

    test('private routes should route to correct NAT Gateways', () => {
      privateRoutes.forEach((route, index) => {
        const routeResource = template.Resources[route];
        expect(routeResource.Properties.RouteTableId).toEqual({ Ref: privateRouteTables[index] });
        expect(routeResource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(routeResource.Properties.NatGatewayId).toEqual({ Ref: natGateways[index] });
      });
    });

    test('should have route table associations for all private subnets', () => {
      const associations = [
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PrivateSubnet3RouteTableAssociation'
      ];

      associations.forEach((assoc, index) => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');

        const association = template.Resources[assoc];
        expect(association.Properties.SubnetId).toEqual({ Ref: privateSubnets[index] });
        expect(association.Properties.RouteTableId).toEqual({ Ref: privateRouteTables[index] });
      });
    });

    test('private route tables should have proper tags', () => {
      privateRouteTables.forEach(rt => {
        const routeTable = template.Resources[rt];
        const tags = routeTable.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
      });
    });
  });

  describe('Security Group', () => {
    test('should have HTTPSSecurityGroup resource', () => {
      expect(template.Resources.HTTPSSecurityGroup).toBeDefined();
      expect(template.Resources.HTTPSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should reference VPC', () => {
      const sg = template.Resources.HTTPSSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'TradingPlatformVPC' });
    });

    test('security group should have correct description', () => {
      const sg = template.Resources.HTTPSSecurityGroup;
      expect(sg.Properties.GroupDescription).toBe('Security group allowing HTTPS inbound and all outbound traffic');
    });

    test('security group should allow HTTPS inbound from anywhere', () => {
      const sg = template.Resources.HTTPSSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      expect(ingressRules).toBeInstanceOf(Array);
      expect(ingressRules.length).toBe(1);

      const httpsRule = ingressRules[0];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('Allow HTTPS from anywhere');
    });

    test('security group should allow all outbound traffic', () => {
      const sg = template.Resources.HTTPSSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;

      expect(egressRules).toBeInstanceOf(Array);
      expect(egressRules.length).toBe(1);

      const outboundRule = egressRules[0];
      expect(outboundRule.IpProtocol).toBe(-1);
      expect(outboundRule.CidrIp).toBe('0.0.0.0/0');
      expect(outboundRule.Description).toBe('Allow all outbound traffic');
    });

    test('security group should have proper tags', () => {
      const sg = template.Resources.HTTPSSecurityGroup;
      const tags = sg.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'TradingPlatformVPC' });
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should have all public subnet outputs', () => {
      const publicSubnetOutputs = ['PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id'];
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      publicSubnetOutputs.forEach((output, index) => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Value).toEqual({ Ref: publicSubnets[index] });
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('should have all private subnet outputs', () => {
      const privateSubnetOutputs = ['PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id'];
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];

      privateSubnetOutputs.forEach((output, index) => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Value).toEqual({ Ref: privateSubnets[index] });
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('should have HTTPSSecurityGroupId output', () => {
      expect(template.Outputs.HTTPSSecurityGroupId).toBeDefined();
      expect(template.Outputs.HTTPSSecurityGroupId.Value).toEqual({ Ref: 'HTTPSSecurityGroup' });
      expect(template.Outputs.HTTPSSecurityGroupId.Export).toBeDefined();
    });

    test('should have all NAT Gateway outputs', () => {
      const natGatewayOutputs = ['NATGateway1Id', 'NATGateway2Id', 'NATGateway3Id'];
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];

      natGatewayOutputs.forEach((output, index) => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Value).toEqual({ Ref: natGateways[index] });
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('should have VPCCidr output', () => {
      expect(template.Outputs.VPCCidr).toBeDefined();
      expect(template.Outputs.VPCCidr.Value).toEqual({
        'Fn::GetAtt': ['TradingPlatformVPC', 'CidrBlock']
      });
      expect(template.Outputs.VPCCidr.Export).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description).not.toBe('');
      });
    });

    test('output export names should use stack name', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          expect(exportName).toHaveProperty('Fn::Sub');
          expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include EnvironmentSuffix', () => {
      const resources = template.Resources;
      const resourcesWithNames = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && (
          resource.Properties.GroupName ||
          resource.Properties.Tags?.some((t: any) => t.Key === 'Name')
        );
      });

      resourcesWithNames.forEach(key => {
        const resource = resources[key];

        // Check GroupName
        if (resource.Properties.GroupName) {
          const name = resource.Properties.GroupName;
          if (typeof name === 'object' && name['Fn::Sub']) {
            expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }

        // Check Name tag
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && typeof nameTag.Value === 'object' && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('EIPs should depend on AttachGateway', () => {
      const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];
      eips.forEach(eip => {
        const eipResource = template.Resources[eip];
        expect(eipResource.DependsOn).toBe('AttachGateway');
      });
    });

    test('PublicRoute should depend on AttachGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateways should reference correct EIPs and Subnets', () => {
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
      const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      natGateways.forEach((natGw, index) => {
        const natGwResource = template.Resources[natGw];
        expect(natGwResource.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [eips[index], 'AllocationId']
        });
        expect(natGwResource.Properties.SubnetId).toEqual({ Ref: subnets[index] });
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('each AZ should have its own NAT Gateway for HA', () => {
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      natGateways.forEach((natGw, index) => {
        const natGwResource = template.Resources[natGw];
        expect(natGwResource.Properties.SubnetId).toEqual({ Ref: publicSubnets[index] });
      });
    });

    test('each private subnet should have its own route table with dedicated NAT Gateway', () => {
      const privateRouteTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];
      const privateRoutes = ['PrivateRoute1', 'PrivateRoute2', 'PrivateRoute3'];
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];

      privateRoutes.forEach((route, index) => {
        const routeResource = template.Resources[route];
        expect(routeResource.Properties.RouteTableId).toEqual({ Ref: privateRouteTables[index] });
        expect(routeResource.Properties.NatGatewayId).toEqual({ Ref: natGateways[index] });
      });
    });
  });

  describe('Network Segmentation', () => {
    test('public and private subnets should have different CIDR ranges', () => {
      const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

      // Verify public subnets
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach((subnet, index) => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.CidrBlock).toBe(publicCidrs[index]);
      });

      // Verify private subnets
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach((subnet, index) => {
        const subnetResource = template.Resources[subnet];
        expect(subnetResource.Properties.CidrBlock).toBe(privateCidrs[index]);
      });
    });

    test('public subnets should route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private subnets should route to NAT Gateways', () => {
      const privateRoutes = ['PrivateRoute1', 'PrivateRoute2', 'PrivateRoute3'];
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];

      privateRoutes.forEach((route, index) => {
        const routeResource = template.Resources[route];
        expect(routeResource.Properties.NatGatewayId).toEqual({ Ref: natGateways[index] });
        expect(routeResource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    });
  });

  describe('Resource Tagging Compliance', () => {
    const requiredTags = ['Environment', 'Project'];
    const resourceTypesWithTags = [
      'AWS::EC2::VPC',
      'AWS::EC2::InternetGateway',
      'AWS::EC2::Subnet',
      'AWS::EC2::EIP',
      'AWS::EC2::NatGateway',
      'AWS::EC2::RouteTable',
      'AWS::EC2::SecurityGroup'
    ];

    test('all taggable resources should have Environment tag', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resourceTypesWithTags.includes(resource.Type)) {
          const tags = resource.Properties.Tags;
          expect(tags).toBeDefined();

          const tagKeys = tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Environment');

          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('all taggable resources should have Project tag', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resourceTypesWithTags.includes(resource.Type)) {
          const tags = resource.Properties.Tags;
          expect(tags).toBeDefined();

          const tagKeys = tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Project');

          const projectTag = tags.find((t: any) => t.Key === 'Project');
          expect(projectTag.Value).toBe('TradingPlatform');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all required resources', () => {
      const requiredResources = [
        'TradingPlatformVPC',
        'InternetGateway',
        'AttachGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'NATGateway1EIP',
        'NATGateway2EIP',
        'NATGateway3EIP',
        'NATGateway1',
        'NATGateway2',
        'NATGateway3',
        'PublicRouteTable',
        'PublicRoute',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'PrivateRouteTable3',
        'PrivateRoute1',
        'PrivateRoute2',
        'PrivateRoute3',
        'HTTPSSecurityGroup'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have minimum required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'HTTPSSecurityGroupId'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
  });
});

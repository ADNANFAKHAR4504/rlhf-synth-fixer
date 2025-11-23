import { TemplateLoader } from '../lib/template-loader';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - VPC Infrastructure', () => {
  let template: any;
  let loader: TemplateLoader;

  beforeAll(() => {
    loader = new TemplateLoader();
    template = loader.loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('VPC');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toContain('Environment suffix');
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

    test('VPC should use EnvironmentSuffix in name', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'payment-vpc-${EnvironmentSuffix}' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnet 1', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have public subnet 2', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnet 1', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnet 2', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('public subnets should map public IPs on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not map public IPs on launch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('subnets should use dynamic availability zones', () => {
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway 1', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have NAT Gateway 2', () => {
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IP 1 for NAT Gateway 1', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
    });

    test('should have Elastic IP 2 for NAT Gateway 2', () => {
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP2.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP2.Properties.Domain).toBe('vpc');
    });

    test('EIPs should depend on VPC Gateway Attachment', () => {
      expect(template.Resources.EIP1.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.EIP2.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table 1', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table 2', () => {
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have private route 1 to NAT Gateway 1', () => {
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute1.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });

    test('should have private route 2 to NAT Gateway 2', () => {
      expect(template.Resources.PrivateRoute2).toBeDefined();
      expect(template.Resources.PrivateRoute2.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });
  });

  describe('Route Table Associations', () => {
    test('should have public subnet 1 route table association', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have public subnet 2 route table association', () => {
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have private subnet 1 route table association', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have private subnet 2 route table association', () => {
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Tagging', () => {
    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Project')?.Value).toBe('payment-platform');
      expect(tags.find((t: any) => t.Key === 'ManagedBy')?.Value).toBe('cloudformation');
      expect(tags.find((t: any) => t.Key === 'EnvironmentSuffix')).toBeDefined();
    });

    test('all named resources should use EnvironmentSuffix', () => {
      const namedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'EIP1', 'EIP2',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable',
        'PrivateRouteTable1', 'PrivateRouteTable2'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags?.find((t: any) => t.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have subnet ID outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      expect(template.Outputs.NatGateway1Id).toBeDefined();
      expect(template.Outputs.NatGateway2Id).toBeDefined();
      expect(template.Outputs.NatGateway1Eip).toBeDefined();
      expect(template.Outputs.NatGateway2Eip).toBeDefined();
    });

    test('should have route table outputs', () => {
      expect(template.Outputs.PublicRouteTableId).toBeDefined();
      expect(template.Outputs.PrivateRouteTable1Id).toBeDefined();
      expect(template.Outputs.PrivateRouteTable2Id).toBeDefined();
    });

    test('should have Internet Gateway output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
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

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(21);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have 15 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15);
    });
  });

  describe('Template Loader Helper Functions', () => {
    test('getResourceCount should return correct count', () => {
      expect(loader.getResourceCount()).toBe(21);
    });

    test('getParameterCount should return correct count', () => {
      expect(loader.getParameterCount()).toBe(1);
    });

    test('getOutputCount should return correct count', () => {
      expect(loader.getOutputCount()).toBe(15);
    });

    test('validateResourceExists should work correctly', () => {
      expect(loader.validateResourceExists('VPC')).toBe(true);
      expect(loader.validateResourceExists('NonExistentResource')).toBe(false);
    });

    test('validateParameterExists should work correctly', () => {
      expect(loader.validateParameterExists('EnvironmentSuffix')).toBe(true);
      expect(loader.validateParameterExists('NonExistentParam')).toBe(false);
    });

    test('validateOutputExists should work correctly', () => {
      expect(loader.validateOutputExists('VpcId')).toBe(true);
      expect(loader.validateOutputExists('NonExistentOutput')).toBe(false);
    });

    test('getResourcesByType should filter resources correctly', () => {
      const subnets = loader.getResourcesByType('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(4);
    });

    test('getResourceProperty should return correct property', () => {
      const cidr = loader.getResourceProperty('VPC', 'CidrBlock');
      expect(cidr).toBe('10.0.0.0/16');
    });

    test('getResourceProperty should return undefined for non-existent resource', () => {
      const result = loader.getResourceProperty('NonExistentResource', 'SomeProperty');
      expect(result).toBeUndefined();
    });

    test('getResourceProperty should return undefined for invalid property path', () => {
      const result = loader.getResourceProperty('VPC', 'NonExistent.Property.Path');
      expect(result).toBeUndefined();
    });

    test('getResourceProperty should handle nested properties', () => {
      const tags = loader.getResourceTags('VPC');
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
    });

    test('getResourceProperty should handle resource without Properties', () => {
      const result = loader.getResourceProperty('VPCGatewayAttachment', 'SomeProperty');
      expect(result).toBeUndefined();
    });

    test('getResourceTags should return tags array', () => {
      const tags = loader.getResourceTags('VPC');
      expect(tags.length).toBeGreaterThan(0);
    });

    test('getResourceTags should return empty array for resource without tags', () => {
      const tags = loader.getResourceTags('VPCGatewayAttachment');
      expect(tags).toEqual([]);
    });

    test('getResourceTags should handle non-existent resource', () => {
      const tags = loader.getResourceTags('NonExistentResource');
      expect(tags).toEqual([]);
    });

    test('hasTag should detect tag presence', () => {
      expect(loader.hasTag('VPC', 'Name')).toBe(true);
      expect(loader.hasTag('VPC', 'NonExistentTag')).toBe(false);
    });

    test('getTagValue should return tag value', () => {
      const nameTag = loader.getTagValue('VPC', 'Project');
      expect(nameTag).toBe('payment-platform');
    });

    test('usesEnvironmentSuffix should detect parameter usage', () => {
      expect(loader.usesEnvironmentSuffix('VPC')).toBe(true);
      expect(loader.usesEnvironmentSuffix('VPCGatewayAttachment')).toBe(false);
    });

    test('getResource should return resource definition', () => {
      const vpc = loader.getResource('VPC');
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('getParameter should return parameter definition', () => {
      const param = loader.getParameter('EnvironmentSuffix');
      expect(param.Type).toBe('String');
    });

    test('getOutput should return output definition', () => {
      const output = loader.getOutput('VpcId');
      expect(output.Description).toContain('VPC');
    });
  });
});

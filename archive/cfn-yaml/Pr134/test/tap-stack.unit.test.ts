import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('VPC CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
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
        'Production-ready VPC with public subnets and internet access'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toBeDefined();
      expect(parameterGroups).toHaveLength(1);
      expect(parameterGroups[0].Label.default).toBe('Network Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['Environment', 'VpcCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.Description).toBe('Environment name (e.g., Production, Dev)');
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(envParam.ConstraintDescription).toBe('Must contain only alphanumeric characters and hyphens');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.Description).toBe('CIDR block for the VPC');
      expect(vpcCidrParam.AllowedPattern).toMatch(/^\^.*\$$/);
    });

    test('subnet CIDR parameters should have correct defaults', () => {
      expect(template.Parameters.PublicSubnet1Cidr.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2Cidr.Default).toBe('10.0.2.0/24');
    });
  });

  describe('Mappings', () => {
    test('should have AZ mappings for us-east-1', () => {
      expect(template.Mappings.AZMappings).toBeDefined();
      expect(template.Mappings.AZMappings['us-east-1']).toBeDefined();
      expect(template.Mappings.AZMappings['us-east-1'].AZ1).toBe('us-east-1a');
      expect(template.Mappings.AZMappings['us-east-1'].AZ2).toBe('us-east-1b');
    });
  });

  describe('VPC Resources', () => {
    test('should have MainVPC resource', () => {
      expect(template.Resources.MainVPC).toBeDefined();
      expect(template.Resources.MainVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('MainVPC should have correct properties', () => {
      const vpc = template.Resources.MainVPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('MainVPC should have correct tags', () => {
      const vpc = template.Resources.MainVPC;
      const tags = vpc.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${Environment}-VPC-Main' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should reference VPC correctly', () => {
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'MainVPC' });
      expect(template.Resources.PublicSubnet2.Properties.VpcId).toEqual({ Ref: 'MainVPC' });
    });

    test('subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1Cidr' });
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2Cidr' });
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ).toEqual({
        'Fn::FindInMap': ['AZMappings', { Ref: 'AWS::Region' }, 'AZ1']
      });
      expect(subnet2AZ).toEqual({
        'Fn::FindInMap': ['AZMappings', { Ref: 'AWS::Region' }, 'AZ2']
      });
    });

    test('subnets should auto-assign public IPs', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should have correct naming tags', () => {
      const subnet1Tags = template.Resources.PublicSubnet1.Properties.Tags;
      const subnet2Tags = template.Resources.PublicSubnet2.Properties.Tags;

      const subnet1NameTag = subnet1Tags.find((tag: any) => tag.Key === 'Name');
      const subnet2NameTag = subnet2Tags.find((tag: any) => tag.Key === 'Name');

      expect(subnet1NameTag.Value).toEqual({ 'Fn::Sub': '${Environment}-Subnet-Public1' });
      expect(subnet2NameTag.Value).toEqual({ 'Fn::Sub': '${Environment}-Subnet-Public2' });
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment resource', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('VPCGatewayAttachment should connect VPC and IGW correctly', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MainVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
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
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'InternetGatewayId',
        'PublicRouteTableId',
        'StackName',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'MainVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('subnet outputs should be correct', () => {
      const subnet1Output = template.Outputs.PublicSubnet1Id;
      const subnet2Output = template.Outputs.PublicSubnet2Id;

      expect(subnet1Output.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(subnet2Output.Value).toEqual({ Ref: 'PublicSubnet2' });
      
      expect(subnet1Output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PublicSubnet1Id'
      });
      expect(subnet2Output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PublicSubnet2Id'
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName'
      });
    });

    test('Environment output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBe('Environment name used for this deployment');
      expect(output.Value).toEqual({ Ref: 'Environment' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Environment'
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(9); // VPC, 2 subnets, IGW, attachment, route table, route, 2 associations
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // Environment, VpcCidr, PublicSubnet1Cidr, PublicSubnet2Cidr
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7); // VPCId, 2 subnet IDs, IGW ID, route table ID, stack name, environment
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should follow naming convention', () => {
      const vpc = template.Resources.MainVPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${Environment}-VPC-Main'
      });
    });

    test('subnet names should follow naming convention', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      const subnet1NameTag = subnet1.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const subnet2NameTag = subnet2.Properties.Tags.find((tag: any) => tag.Key === 'Name');

      expect(subnet1NameTag.Value).toEqual({
        'Fn::Sub': '${Environment}-Subnet-Public1'
      });
      expect(subnet2NameTag.Value).toEqual({
        'Fn::Sub': '${Environment}-Subnet-Public2'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });
  });
});
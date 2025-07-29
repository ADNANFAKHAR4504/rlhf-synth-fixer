import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - VPC Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'VPC Infrastructure - Secure, scalable, and cost-effective AWS Virtual Private Cloud infrastructure for multi-AZ environment'
      );
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'vpc-${EnvironmentSuffix}' }
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
      expect(tags).toContainEqual({
        Key: 'Project',
        Value: 'VPC-Infrastructure'
      });
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('Internet Gateway should be correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('public subnets should have correct properties', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should have correct properties', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have two NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('should have two Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('NAT Gateways should have correct properties', () => {
      const natGW1 = template.Resources.NatGateway1;
      const natGW2 = template.Resources.NatGateway2;

      expect(natGW1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGW2.Type).toBe('AWS::EC2::NatGateway');
      
      expect(natGW1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
      expect(natGW2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId']
      });
      
      expect(natGW1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGW2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('Elastic IPs should have correct properties', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');
      
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');
      expect(eip2.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have two private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      
      const routeTable1 = template.Resources.PrivateRouteTable1;
      const routeTable2 = template.Resources.PrivateRouteTable2;
      
      expect(routeTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have default public route', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      const route = template.Resources.DefaultPublicRoute;
      
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have default private routes', () => {
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
      
      const route1 = template.Resources.DefaultPrivateRoute1;
      const route2 = template.Resources.DefaultPrivateRoute2;
      
      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required VPC outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VPCCidrBlock',
        'InternetGatewayId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NatGateway1Id',
        'NatGateway2Id',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'AvailabilityZones',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC outputs should be correct', () => {
      const vpcIdOutput = template.Outputs.VPCId;
      expect(vpcIdOutput.Description).toBe('ID of the VPC');
      expect(vpcIdOutput.Value).toEqual({ Ref: 'VPC' });
      expect(vpcIdOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('subnet outputs should be correct', () => {
      const publicSubnet1Output = template.Outputs.PublicSubnet1Id;
      expect(publicSubnet1Output.Value).toEqual({ Ref: 'PublicSubnet1' });
      
      const privateSubnet1Output = template.Outputs.PrivateSubnet1Id;
      expect(privateSubnet1Output.Value).toEqual({ Ref: 'PrivateSubnet1' });
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
      expect(resourceCount).toBe(25); // VPC, IGW, IGW attachment, 4 subnets, 2 EIPs, 2 NAT GWs, 3 route tables, 3 routes, 4 associations, IAM role, IAM profile, S3 bucket, IAM user
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have eighteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(18);
    });
  });

  describe('Cost Optimization and Tagging', () => {
    test('all resources should have proper tags for cost tracking', () => {
      const taggedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway2EIP',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          
          expect(tags).toContainEqual({
            Key: 'Environment',
            Value: { Ref: 'EnvironmentSuffix' }
          });
          expect(tags).toContainEqual({
            Key: 'Project',
            Value: 'VPC-Infrastructure'
          });
          expect(tags).toContainEqual({
            Key: 'Owner',
            Value: 'DevOps-Team'
          });
          expect(tags).toContainEqual({
            Key: 'BillingCode',
            Value: 'INFRA-001'
          });
        }
      });
    });
  });

  describe('Multi-AZ Requirements', () => {
    test('should deploy across multiple availability zones', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
      
      // Verify different AZs are used
      const publicSubnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const publicSubnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(publicSubnet1AZ['Fn::Select'][0]).toBe(0);
      expect(publicSubnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('should have high availability NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      
      // NAT Gateways should be in different subnets
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });
});
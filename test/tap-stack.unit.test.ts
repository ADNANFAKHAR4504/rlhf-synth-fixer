import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON using `pipenv run cfn-flip-to-json`
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
        'VPC Infrastructure with Public and Private Subnets across Two Availability Zones'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'ProjectName', 
        'Owner',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
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

    test('VPC CIDR parameters should have correct validation patterns', () => {
      const cidrPattern = '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$';
      
      ['VpcCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr'].forEach(param => {
        expect(template.Parameters[param].AllowedPattern).toBe(cidrPattern);
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.TapVPC).toBeDefined();
      expect(template.Resources.TapVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.TapVPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.TapInternetGateway).toBeDefined();
      expect(template.Resources.TapInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.TapInternetGatewayAttachment).toBeDefined();
      expect(template.Resources.TapInternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have all required subnets', () => {
      const expectedSubnets = [
        'TapPublicSubnet1',
        'TapPublicSubnet2',
        'TapPrivateSubnet1',
        'TapPrivateSubnet2'
      ];

      expectedSubnets.forEach(subnetName => {
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      ['TapPublicSubnet1', 'TapPublicSubnet2'].forEach(subnetName => {
        expect(template.Resources[subnetName].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      ['TapPrivateSubnet1', 'TapPrivateSubnet2'].forEach(subnetName => {
        expect(template.Resources[subnetName].Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.TapPublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.TapPublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway Elastic IPs', () => {
      ['TapNatGateway1EIP', 'TapNatGateway2EIP'].forEach(eipName => {
        expect(template.Resources[eipName]).toBeDefined();
        expect(template.Resources[eipName].Type).toBe('AWS::EC2::EIP');
        expect(template.Resources[eipName].Properties.Domain).toBe('vpc');
        expect(template.Resources[eipName].DependsOn).toBe('TapInternetGatewayAttachment');
      });
    });

    test('should have NAT Gateways', () => {
      ['TapNatGateway1', 'TapNatGateway2'].forEach(natName => {
        expect(template.Resources[natName]).toBeDefined();
        expect(template.Resources[natName].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('NAT Gateways should be properly configured', () => {
      const nat1 = template.Resources.TapNatGateway1;
      const nat2 = template.Resources.TapNatGateway2;
      
      expect(nat1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['TapNatGateway1EIP', 'AllocationId'] });
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'TapPublicSubnet1' });
      
      expect(nat2.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['TapNatGateway2EIP', 'AllocationId'] });
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'TapPublicSubnet2' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have all required route tables', () => {
      const expectedRouteTables = [
        'TapPublicRouteTable',
        'TapPrivateRouteTable1',
        'TapPrivateRouteTable2'
      ];

      expectedRouteTables.forEach(rtName => {
        expect(template.Resources[rtName]).toBeDefined();
        expect(template.Resources[rtName].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have correct routes', () => {
      // Public route to Internet Gateway
      const publicRoute = template.Resources.TapPublicRoute;
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'TapInternetGateway' });

      // Private routes to NAT Gateways
      const privateRoute1 = template.Resources.TapPrivateRoute1;
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'TapNatGateway1' });

      const privateRoute2 = template.Resources.TapPrivateRoute2;
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'TapNatGateway2' });
    });

    test('should have route table associations', () => {
      const expectedAssociations = [
        'TapPublicSubnet1RouteTableAssociation',
        'TapPublicSubnet2RouteTableAssociation',
        'TapPrivateSubnet1RouteTableAssociation',
        'TapPrivateSubnet2RouteTableAssociation'
      ];

      expectedAssociations.forEach(assocName => {
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Group Resources', () => {
    test('should have ICMP security group', () => {
      expect(template.Resources.TapICMPSecurityGroup).toBeDefined();
      expect(template.Resources.TapICMPSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ICMP security group should allow ICMP traffic', () => {
      const sg = template.Resources.TapICMPSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      const egress = sg.Properties.SecurityGroupEgress[0];

      expect(ingress.IpProtocol).toBe('icmp');
      expect(ingress.FromPort).toBe(-1);
      expect(ingress.ToPort).toBe(-1);
      expect(ingress.CidrIp).toBe('0.0.0.0/0');

      expect(egress.IpProtocol).toBe('icmp');
      expect(egress.FromPort).toBe(-1);
      expect(egress.ToPort).toBe(-1);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper tags', () => {
      const expectedTags = ['Name', 'Environment', 'Project', 'Owner'];
      
      // Check a few key resources for proper tagging
      const resourcesToCheck = [
        'TapVPC',
        'TapInternetGateway', 
        'TapPublicSubnet1',
        'TapNatGateway1',
        'TapICMPSecurityGroup'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        expectedTags.forEach(expectedTag => {
          expect(tagKeys).toContain(expectedTag);
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'VpcCidr',
        'InternetGatewayId',
        'PublicSubnet1Id',
        'PublicSubnet1AZ',
        'PublicSubnet2Id',
        'PublicSubnet2AZ',
        'PrivateSubnet1Id',
        'PrivateSubnet1AZ',
        'PrivateSubnet2Id',
        'PrivateSubnet2AZ',
        'NatGateway1Id',
        'NatGateway1EIP',
        'NatGateway2Id',
        'NatGateway2EIP',
        'ICMPSecurityGroupId',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
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
      // VPC + IGW + IGW Attachment + 4 Subnets + 2 EIPs + 2 NAT Gateways + 3 Route Tables + 3 Routes + 4 RT Associations + 1 Security Group = 22
      expect(resourceCount).toBe(22);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(21);
    });
  });

  describe('Resource Dependencies', () => {
    test('EIPs should depend on Internet Gateway attachment', () => {
      ['TapNatGateway1EIP', 'TapNatGateway2EIP'].forEach(eipName => {
        expect(template.Resources[eipName].DependsOn).toBe('TapInternetGatewayAttachment');
      });
    });

    test('public route should depend on Internet Gateway attachment', () => {
      expect(template.Resources.TapPublicRoute.DependsOn).toBe('TapInternetGatewayAttachment');
    });
  });
});
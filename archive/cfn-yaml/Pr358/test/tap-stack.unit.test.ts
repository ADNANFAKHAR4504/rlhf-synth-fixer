import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('VPC Infrastructure CloudFormation Template', () => {
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
      expect(template.Description).toContain('secure and scalable network infrastructure');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('subnets should use dynamic availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      // Check that AZ selection uses Fn::Select and Fn::GetAZs
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, { 'Fn::GetAZs': '' }]);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, { 'Fn::GetAZs': '' }]);
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, { 'Fn::GetAZs': '' }]);
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, { 'Fn::GetAZs': '' }]);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGatewayEIP.Properties.Domain).toBe('vpc');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have routes', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
      
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
      
      // Check route destinations
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PrivateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];
      
      associations.forEach(assoc => {
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });

    test('should have SSH security group', () => {
      expect(template.Resources.SSHSecurityGroup).toBeDefined();
      expect(template.Resources.SSHSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const securityGroup = template.Resources.SSHSecurityGroup;
      expect(securityGroup.Properties.GroupDescription).toBe('Allow SSH access from specific IPs');
      expect(securityGroup.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(securityGroup.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(securityGroup.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(securityGroup.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
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
        'NatGatewayId',
        'InternetGatewayId',
        'SSHSecurityGroupId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('The ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('subnet outputs should be correct', () => {
      const subnetOutputs = [
        { name: 'PublicSubnet1Id', resource: 'PublicSubnet1', description: 'The ID of the first public subnet' },
        { name: 'PublicSubnet2Id', resource: 'PublicSubnet2', description: 'The ID of the second public subnet' },
        { name: 'PrivateSubnet1Id', resource: 'PrivateSubnet1', description: 'The ID of the first private subnet' },
        { name: 'PrivateSubnet2Id', resource: 'PrivateSubnet2', description: 'The ID of the second private subnet' }
      ];

      subnetOutputs.forEach(subnet => {
        const output = template.Outputs[subnet.name];
        expect(output.Description).toBe(subnet.description);
        expect(output.Value).toEqual({ Ref: subnet.resource });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${subnet.name}`,
        });
      });
    });

    test('gateway outputs should be correct', () => {
      const natGatewayOutput = template.Outputs.NatGatewayId;
      expect(natGatewayOutput.Description).toBe('The ID of the NAT Gateway');
      expect(natGatewayOutput.Value).toEqual({ Ref: 'NatGateway' });

      const internetGatewayOutput = template.Outputs.InternetGatewayId;
      expect(internetGatewayOutput.Description).toBe('The ID of the Internet Gateway');
      expect(internetGatewayOutput.Value).toEqual({ Ref: 'InternetGateway' });
    });

    test('security group output should be correct', () => {
      const output = template.Outputs.SSHSecurityGroupId;
      expect(output.Description).toBe('The ID of the SSH Security Group');
      expect(output.Value).toEqual({ Ref: 'SSHSecurityGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SSHSecurityGroupId',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18); // Total VPC infrastructure resources
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // All VPC component outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });

    test('resources should have appropriate tags', () => {
      const taggedResources = ['VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 
                               'InternetGateway', 'PublicRouteTable', 'PrivateRouteTable', 'NatGateway', 'SSHSecurityGroup'];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
        
        // Check for Name tag
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toBeDefined();
      });
    });
  });

  describe('Dependencies and References', () => {
    test('subnets should reference VPC', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('route tables should reference VPC', () => {
      const routeTables = ['PublicRouteTable', 'PrivateRouteTable'];
      routeTables.forEach(routeTableName => {
        const routeTable = template.Resources[routeTableName];
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('should have proper dependencies', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.NatGatewayEIP.DependsOn).toBe('VPCGatewayAttachment');
    });
  });
});
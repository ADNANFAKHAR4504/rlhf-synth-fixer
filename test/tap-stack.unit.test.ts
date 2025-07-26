import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
        'CloudFormation template to create a secure and scalable network infrastructure in us-west-2.'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have MyVPC resource', () => {
      expect(template.Resources.MyVPC).toBeDefined();
      expect(template.Resources.MyVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('MyVPC should have correct CIDR block', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('MyVPC should have correct tags', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: 'DevelopmentVPC'
      });
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet1 resource', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PublicSubnet2 resource', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet1 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('PublicSubnet2 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('subnets should have correct tags', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: 'PublicSubnet1'
      });
      
      expect(subnet2.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: 'PublicSubnet2'
      });
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

    test('VPCGatewayAttachment should have correct properties', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('InternetGateway should have correct tags', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: 'DevelopmentIGW'
      });
    });
  });

  describe('Routing Resources', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PublicRoute resource', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PublicRouteTable should reference VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
    });

    test('PublicRoute should have correct properties', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      
      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });
  });

  describe('Security Group Resources', () => {
    test('should have DevSecurityGroup resource', () => {
      expect(template.Resources.DevSecurityGroup).toBeDefined();
      expect(template.Resources.DevSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DevSecurityGroup should have correct properties', () => {
      const sg = template.Resources.DevSecurityGroup;
      expect(sg.Properties.GroupDescription).toBe('Allow SSH access from anywhere');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
    });

    test('DevSecurityGroup should allow SSH access from anywhere', () => {
      const sg = template.Resources.DevSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      expect(ingressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('DevSecurityGroup should have correct tags', () => {
      const sg = template.Resources.DevSecurityGroup;
      expect(sg.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: 'DevSecurityGroup'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'InternetGatewayId',
        'SecurityGroupId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('The ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'MyVPC' });
    });

    test('PublicSubnet1Id output should be correct', () => {
      const output = template.Outputs.PublicSubnet1Id;
      expect(output.Description).toBe('The ID of the first public subnet');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('PublicSubnet2Id output should be correct', () => {
      const output = template.Outputs.PublicSubnet2Id;
      expect(output.Description).toBe('The ID of the second public subnet');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('InternetGatewayId output should be correct', () => {
      const output = template.Outputs.InternetGatewayId;
      expect(output.Description).toBe('The ID of the Internet Gateway');
      expect(output.Value).toEqual({ Ref: 'InternetGateway' });
    });

    test('SecurityGroupId output should be correct', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe('The ID of the Security Group');
      expect(output.Value).toEqual({ Ref: 'DevSecurityGroup' });
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const expectedResourceCount = 10; // VPC, 2 subnets, IGW, attachment, route table, route, security group, 2 associations
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResourceCount);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });

    test('should not have parameters section', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Intrinsic Functions', () => {
    test('should use Ref function for resource references', () => {
      // Check that VPC is referenced properly in subnets
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(template.Resources.PublicSubnet2.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      
      // Check that IGW is referenced properly in attachment
      expect(template.Resources.VPCGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should use GetAZs and Select functions for availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });
});
/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "Production-ready VPC with public/private subnets, NAT Gateway, and EC2 instance"
 * CloudFormation template (TapStack.json only).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please ensure TapStack.json exists.`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Production-ready VPC with public/private subnets, NAT Gateway, and EC2 instance'
      );
    });

    test('parameters KeyPairName, InstanceType, and AMIId exist', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.AMIId).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('KeyPairName parameter has correct schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
      expect(p.Description).toBe('Name of an existing EC2 KeyPair for SSH access to the instance (leave empty to disable SSH key)');
      expect(p.ConstraintDescription).toBe('Must be the name of an existing EC2 KeyPair or empty string');
    });

    test('InstanceType parameter has correct schema', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.micro');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
      expect(p.Description).toBe('EC2 instance type for the web server');
      expect(p.ConstraintDescription).toBe('Must be a valid EC2 instance type');
    });

    test('AMIId parameter has correct schema', () => {
      const p = template.Parameters.AMIId;
      expect(p.Type).toBe('AWS::EC2::Image::Id');
      expect(p.Default).toBe('ami-03cf127a');
      expect(p.Description).toBe('AMI ID for the EC2 instance (use LocalStack default AMI for testing)');
      expect(p.ConstraintDescription).toBe('Must be a valid AMI ID');
    });

    test('template defines exactly three parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(3);
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Consistent AZ indices: 0, 1
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('private subnets are configured correctly', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
      
      // Same AZ distribution as public subnets
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NAT Gateway has EIP and correct subnet placement', () => {
      const natGw = template.Resources.NATGateway;
      const eip = template.Resources.NATGatewayEIP;

      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');

      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
    });

    test('route tables are properly configured', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute = template.Resources.DefaultPrivateRoute;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');

      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('subnet route table associations are correct', () => {
      const pubSub1Assoc = template.Resources.PublicSubnet1RouteTableAssociation;
      const pubSub2Assoc = template.Resources.PublicSubnet2RouteTableAssociation;
      const privSub1Assoc = template.Resources.PrivateSubnet1RouteTableAssociation;
      const privSub2Assoc = template.Resources.PrivateSubnet2RouteTableAssociation;

      // Public subnet associations
      expect(pubSub1Assoc.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(pubSub1Assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(pubSub2Assoc.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(pubSub2Assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });

      // Private subnet associations
      expect(privSub1Assoc.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(privSub1Assoc.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(privSub2Assoc.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(privSub2Assoc.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups', () => {
    test('web security group allows SSH and HTTP access', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSG.Properties.GroupDescription).toBe('Security group allowing SSH and HTTP access');
      
      const sshRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      const httpRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
      expect(sshRule.Description).toBe('SSH access from anywhere');

      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('HTTP access from anywhere');
    });

    test('security group is associated with VPC', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('security group does not have explicit name', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Properties.GroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* EC2 Instance Tests                                                   */
  /* -------------------------------------------------------------------- */
  describe('EC2 Instance', () => {
    test('EC2 instance has correct configuration', () => {
      const instance = template.Resources.WebServerInstance;

      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'AMIId' });
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(instance.Properties.KeyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { 'Ref': 'KeyPairName' },
          { 'Ref': 'AWS::NoValue' }
        ]
      });
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(instance.Properties.SecurityGroupIds).toContainEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('EC2 instance has proper UserData script', () => {
      const instance = template.Resources.WebServerInstance;
      const userData = instance.Properties.UserData;
      
      expect(userData['Fn::Base64']).toBeDefined();
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('#!/bin/bash');
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('yum update -y');
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('yum install -y httpd');
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('systemctl start httpd');
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('Hello from ${AWS::StackName}');
    });

    test('EC2 instance has proper tags', () => {
      const instance = template.Resources.WebServerInstance;
      const nameTag = instance.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-WebServer' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Critical resources present                                           */
  /* -------------------------------------------------------------------- */
  describe('Key Resources', () => {
    const criticalResources = [
      'VPC', 'PublicSubnet1', 'PublicSubnet2',
      'PrivateSubnet1', 'PrivateSubnet2',
      'InternetGateway', 'InternetGatewayAttachment',
      'NATGateway', 'NATGatewayEIP',
      'PublicRouteTable', 'PrivateRouteTable',
      'DefaultPublicRoute', 'DefaultPrivateRoute',
      'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation',
      'PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation',
      'WebServerSecurityGroup', 'WebServerInstance'
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('template has expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(criticalResources.length);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs validation                                                   */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    const outputKeys = [
      'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id',
      'PrivateSubnet1Id', 'PrivateSubnet2Id', 'EC2InstanceId',
      'SecurityGroupId', 'NATGatewayId', 'WebServerPublicIP', 'WebServerURL'
    ];

    test('template exposes exactly ten outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(10);
    });

    outputKeys.forEach(key => {
      test(`output ${key} is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
      });

      test(`output ${key} has description`, () => {
        expect(template.Outputs[key].Description).toBeDefined();
        expect(typeof template.Outputs[key].Description).toBe('string');
        expect(template.Outputs[key].Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs with exports have proper export names', () => {
      const outputsWithExports = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'EC2InstanceId',
        'SecurityGroupId', 'NATGatewayId'
      ];

      outputsWithExports.forEach(key => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') });
      });
    });

    test('outputs have meaningful descriptions', () => {
      expect(template.Outputs.VPCId.Description).toContain('VPC');
      expect(template.Outputs.PublicSubnet1Id.Description).toContain('Public Subnet 1');
      expect(template.Outputs.EC2InstanceId.Description).toContain('EC2 Web Server Instance');
      expect(template.Outputs.WebServerPublicIP.Description).toContain('Public IP');
      expect(template.Outputs.WebServerURL.Description).toContain('URL');
    });

    test('outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.EC2InstanceId.Value).toEqual({ Ref: 'WebServerInstance' });
      expect(template.Outputs.SecurityGroupId.Value).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(template.Outputs.NATGatewayId.Value).toEqual({ Ref: 'NATGateway' });
      expect(template.Outputs.WebServerPublicIP.Value).toEqual({ 'Fn::GetAtt': ['WebServerInstance', 'PublicIp'] });
      expect(template.Outputs.WebServerURL.Value).toEqual({ 'Fn::Sub': 'http://${WebServerInstance.PublicIp}' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Overall structure sanity                                             */
  /* -------------------------------------------------------------------- */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Resources', 'Outputs', 'Conditions'].forEach(
        section => expect(template[section]).toBeDefined()
      );
    });

    test('format version is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [
              { 'Ref': 'KeyPairName' },
              ''
            ]
          }
        ]
      });
    });

    test('all resources have proper tagging where applicable', () => {
      const resourcesWithTags = [
        'VPC', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2',
        'InternetGateway', 'NATGatewayEIP', 'NATGateway',
        'PublicRouteTable', 'PrivateRouteTable',
        'WebServerSecurityGroup', 'WebServerInstance'
      ];

      resourcesWithTags.forEach(resourceId => {
        const resource = template.Resources[resourceId];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') });
      });
    });

    test('no resources have explicit names that could cause conflicts', () => {
      const resourcesWithoutExplicitNames = [
        'VPC', 'PublicSubnet1', 'PrivateSubnet1',
        'WebServerSecurityGroup', 'WebServerInstance'
      ];

      resourcesWithoutExplicitNames.forEach(resourceId => {
        const resource = template.Resources[resourceId];
        
        // Check for common explicit name properties
        expect(resource.Properties.Name).toBeUndefined();
        expect(resource.Properties.GroupName).toBeUndefined();
      });
    });

    test('dependencies are properly configured', () => {
      const natEip = template.Resources.NATGatewayEIP;
      const publicRoute = template.Resources.DefaultPublicRoute;
      
      expect(natEip.DependsOn).toBe('InternetGatewayAttachment');
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('CIDR blocks follow required specification', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });
  });

  /* -------------------------------------------------------------------- */
  /* AWS Best Practices Validation                                        */
  /* -------------------------------------------------------------------- */
  describe('AWS Best Practices', () => {
    test('subnets are distributed across different AZs', () => {
      const publicSub1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const publicSub2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      const privateSub1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const privateSub2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;

      // All should use Select with different indices
      expect(publicSub1AZ['Fn::Select'][0]).toBe(0);
      expect(publicSub2AZ['Fn::Select'][0]).toBe(1);
      expect(privateSub1AZ['Fn::Select'][0]).toBe(0);
      expect(privateSub2AZ['Fn::Select'][0]).toBe(1);
    });

    test('NAT Gateway is placed in public subnet for internet access', () => {
      const natGw = template.Resources.NATGateway;
      expect(natGw.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('EC2 instance is deployed in public subnet as per requirements', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('security group follows principle of least privilege with specific ports', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const ingressRules = webSG.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(2); // Only SSH and HTTP
      
      const portNumbers = ingressRules.map((rule: any) => rule.FromPort);
      expect(portNumbers).toContain(22); // SSH
      expect(portNumbers).toContain(80); // HTTP
    });
  });
});

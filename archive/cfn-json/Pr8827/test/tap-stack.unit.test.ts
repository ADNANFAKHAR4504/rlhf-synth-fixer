import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - VPC Migration Infrastructure', () => {
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
      expect(template.Description).toContain('Multi-AZ VPC');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('172.16.0.0/16');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'development',
        'staging',
        'production'
      ]);
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Default).toBe('payment-migration');
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Type).toBe('String');
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support and hostnames enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('VPC should use VpcCidr parameter', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toEqual({
        Ref: 'VpcCidr'
      });
    });

    test('VPC should have proper tags with EnvironmentSuffix', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });
  });

  describe('Subnet Resources', () => {
    const subnetNames = [
      'PublicSubnetA',
      'PublicSubnetB',
      'PublicSubnetC',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'PrivateSubnetC'
    ];

    test('should have all 6 subnets defined', () => {
      subnetNames.forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(template.Resources[name].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      ['PublicSubnetA', 'PublicSubnetB', 'PublicSubnetC'].forEach(name => {
        expect(template.Resources[name].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      ['PrivateSubnetA', 'PrivateSubnetB', 'PrivateSubnetC'].forEach(name => {
        const subnet = template.Resources[name].Properties;
        expect(subnet.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('subnets should be in different availability zones', () => {
      const azIndexes = new Set();
      subnetNames.forEach(name => {
        const azConfig = template.Resources[name].Properties.AvailabilityZone;
        expect(azConfig['Fn::Select']).toBeDefined();
        azIndexes.add(azConfig['Fn::Select'][0]);
      });
      // Should have at least 3 different AZ indexes (0, 1, 2)
      expect(azIndexes.size).toBeGreaterThanOrEqual(3);
    });

    test('subnets should have proper naming with EnvironmentSuffix', () => {
      subnetNames.forEach(name => {
        const tags = template.Resources[name].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
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
      expect(template.Resources.AttachGateway.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.AttachGateway.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway'
      });
    });
  });

  describe('NAT Gateways', () => {
    const natGateways = ['NATGatewayA', 'NATGatewayB', 'NATGatewayC'];
    const eips = ['EIPA', 'EIPB', 'EIPC'];

    test('should have 3 NAT Gateways', () => {
      natGateways.forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(template.Resources[name].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have 3 Elastic IPs for NAT Gateways', () => {
      eips.forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(template.Resources[name].Type).toBe('AWS::EC2::EIP');
        expect(template.Resources[name].Properties.Domain).toBe('vpc');
      });
    });

    test('EIPs should depend on gateway attachment', () => {
      eips.forEach(name => {
        expect(template.Resources[name].DependsOn).toBe('AttachGateway');
      });
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NATGatewayA.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnetA'
      });
      expect(template.Resources.NATGatewayB.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnetB'
      });
      expect(template.Resources.NATGatewayC.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnetC'
      });
    });

    test('NAT Gateways should use correct EIP allocations', () => {
      expect(template.Resources.NATGatewayA.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPA', 'AllocationId']
      });
      expect(template.Resources.NATGatewayB.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPB', 'AllocationId']
      });
      expect(template.Resources.NATGatewayC.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPC', 'AllocationId']
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have 3 private route tables', () => {
      ['PrivateRouteTableA', 'PrivateRouteTableB', 'PrivateRouteTableC'].forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(template.Resources[name].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('public route should point to internet gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway'
      });
    });

    test('private routes should point to respective NAT gateways', () => {
      expect(template.Resources.PrivateRouteA.Properties.NatGatewayId).toEqual({
        Ref: 'NATGatewayA'
      });
      expect(template.Resources.PrivateRouteB.Properties.NatGatewayId).toEqual({
        Ref: 'NATGatewayB'
      });
      expect(template.Resources.PrivateRouteC.Properties.NatGatewayId).toEqual({
        Ref: 'NATGatewayC'
      });
    });

    test('should have all subnet route table associations', () => {
      const associations = [
        'PublicSubnetARouteTableAssociation',
        'PublicSubnetBRouteTableAssociation',
        'PublicSubnetCRouteTableAssociation',
        'PrivateSubnetARouteTableAssociation',
        'PrivateSubnetBRouteTableAssociation',
        'PrivateSubnetCRouteTableAssociation'
      ];

      associations.forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(template.Resources[name].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have WebTierSecurityGroup', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      expect(template.Resources.WebTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DatabaseTierSecurityGroup', () => {
      expect(template.Resources.DatabaseTierSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web tier should allow HTTPS from internet', () => {
      const ingress = template.Resources.WebTierSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('database tier should only allow PostgreSQL from web tier', () => {
      const ingress = template.Resources.DatabaseTierSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
    });

    test('security groups should have proper naming with EnvironmentSuffix', () => {
      expect(template.Resources.WebTierSecurityGroup.Properties.GroupName).toEqual({
        'Fn::Sub': 'web-tier-sg-${EnvironmentSuffix}'
      });
      expect(template.Resources.DatabaseTierSecurityGroup.Properties.GroupName).toEqual({
        'Fn::Sub': 'database-tier-sg-${EnvironmentSuffix}'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should have MigrationLogsBucket', () => {
      expect(template.Resources.MigrationLogsBucket).toBeDefined();
      expect(template.Resources.MigrationLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('bucket should have versioning enabled', () => {
      const versioning = template.Resources.MigrationLogsBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('bucket should have encryption enabled', () => {
      const encryption = template.Resources.MigrationLogsBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('bucket should block public access', () => {
      const publicAccess = template.Resources.MigrationLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('bucket should have proper naming with EnvironmentSuffix', () => {
      expect(template.Resources.MigrationLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'migration-logs-${EnvironmentSuffix}'
      });
    });
  });

  describe('VPC Endpoint', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('VPC endpoint should be gateway type for S3', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('VPC endpoint should be associated with private route tables', () => {
      const routeTables = template.Resources.S3VPCEndpoint.Properties.RouteTableIds;
      expect(routeTables).toHaveLength(3);
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTableA' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTableB' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTableC' });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnetAId',
      'PublicSubnetBId',
      'PublicSubnetCId',
      'PrivateSubnetAId',
      'PrivateSubnetBId',
      'PrivateSubnetCId',
      'WebTierSecurityGroupId',
      'DatabaseTierSecurityGroupId',
      'MigrationLogsBucketName',
      'MigrationLogsBucketArn',
      'S3VPCEndpointId'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should export VPC reference', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('bucket outputs should reference bucket correctly', () => {
      expect(template.Outputs.MigrationLogsBucketName.Value).toEqual({
        Ref: 'MigrationLogsBucket'
      });
      expect(template.Outputs.MigrationLogsBucketArn.Value).toEqual({
        'Fn::GetAtt': ['MigrationLogsBucket', 'Arn']
      });
    });

    test('all outputs should have descriptions', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tags', () => {
    const taggedResources = [
      'VPC',
      'InternetGateway',
      'PublicSubnetA',
      'PublicSubnetB',
      'PublicSubnetC',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'PrivateSubnetC',
      'EIPA',
      'EIPB',
      'EIPC',
      'NATGatewayA',
      'NATGatewayB',
      'NATGatewayC',
      'PublicRouteTable',
      'PrivateRouteTableA',
      'PrivateRouteTableB',
      'PrivateRouteTableC',
      'WebTierSecurityGroup',
      'DatabaseTierSecurityGroup',
      'MigrationLogsBucket'
    ];

    test('all resources should have required tags', () => {
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
      });
    });

    test('tags should reference parameters correctly', () => {
      const vpc = template.Resources.VPC.Properties.Tags;
      const envTag = vpc.find((t: any) => t.Key === 'Environment');
      const projectTag = vpc.find((t: any) => t.Key === 'Project');
      const ownerTag = vpc.find((t: any) => t.Key === 'Owner');

      expect(envTag.Value).toEqual({ Ref: 'Environment' });
      expect(projectTag.Value).toEqual({ Ref: 'Project' });
      expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('S3 bucket should not have Retain policy', () => {
      expect(template.Resources.MigrationLogsBucket.DeletionPolicy).toBeUndefined();
      expect(template.Resources.MigrationLogsBucket.UpdateReplacePolicy).toBeUndefined();
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties?.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // VPC, IGW, Attach, 6 Subnets, 3 EIPs, 3 NAT GWs, 4 Route Tables,
      // 4 Routes, 6 Associations, 2 SGs, 1 Bucket, 1 VPC Endpoint
      expect(resourceCount).toBeGreaterThanOrEqual(31);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // VpcCidr, EnvironmentSuffix, Environment, Project, Owner
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});

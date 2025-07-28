import * as fs from 'fs';
import * as path from 'path';

// Load the CloudFormation template
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('TapStack CloudFormation Template Unit Tests', () => {
  
  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('Secure and scalable network infrastructure');
    });

    test('should have all required top-level sections', () => {
      expect(template).toHaveProperty('Metadata');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Conditions');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });
  });

  describe('Metadata Section Validation', () => {
    test('should have CloudFormation Interface metadata', () => {
      expect(template.Metadata).toHaveProperty('AWS::CloudFormation::Interface');
      
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface).toHaveProperty('ParameterGroups');
      expect(cfnInterface).toHaveProperty('ParameterLabels');
    });

    test('should have correct parameter groups', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toHaveLength(2);
      
      const networkGroup = parameterGroups.find((group: { Label: { default: string; }; }) => group.Label.default === 'Network Configuration');
      const securityGroup = parameterGroups.find((group: { Label: { default: string; }; }) => group.Label.default === 'Security Configuration');
      
      expect(networkGroup).toBeDefined();
      expect(securityGroup).toBeDefined();
      
      expect(networkGroup.Parameters).toContain('EnvironmentSuffix');
      expect(networkGroup.Parameters).toContain('VpcCIDR');
      expect(securityGroup.Parameters).toContain('SSHLocation');
      expect(securityGroup.Parameters).toContain('EnableS3Versioning');
    });
  });

  describe('Parameters Section Validation', () => {
    const expectedParameters = [
      'EnvironmentSuffix',
      'VpcCIDR',
      'PublicSubnet1CIDR',
      'PublicSubnet2CIDR',
      'PublicSubnet3CIDR',
      'PrivateSubnet1CIDR',
      'PrivateSubnet2CIDR',
      'PrivateSubnet3CIDR',
      'SSHLocation',
      'EnableS3Versioning'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters).toHaveProperty(param);
      });
    });

    test('should have correct EnvironmentSuffix parameter configuration', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Description).toContain('environment');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envParam.ConstraintDescription).toContain('alphanumeric');
    });

    test('should have valid CIDR parameters with patterns', () => {
      const cidrParams = [
        'VpcCIDR',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PublicSubnet3CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'PrivateSubnet3CIDR'
      ];

      const cidrPattern = /^\^\(\(\[0-9\]/; // Should start with CIDR regex pattern

      cidrParams.forEach(param => {
        const parameter = template.Parameters[param];
        expect(parameter.Type).toBe('String');
        expect(parameter.AllowedPattern).toMatch(cidrPattern);
        if (param === 'VpcCIDR') {
          expect(parameter.Default).toBe('10.0.0.0/16');
          expect(parameter.ConstraintDescription).toContain('valid IP CIDR');
        }
      });
    });

    test('should have valid SSH location parameter', () => {
      const sshParam = template.Parameters.SSHLocation;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.MinLength).toBe('9');
      expect(sshParam.MaxLength).toBe('18');
      expect(sshParam.Default).toBe('10.0.0.0/16');
      expect(sshParam.AllowedPattern).toMatch(/^\^\(\(\[0-9\]/);
    });

    test('should have valid S3 versioning parameter', () => {
      const s3Param = template.Parameters.EnableS3Versioning;
      expect(s3Param.Type).toBe('String');
      expect(s3Param.Default).toBe('Enabled');
      expect(s3Param.AllowedValues).toEqual(['Enabled', 'Suspended']);
    });
  });

  describe('Conditions Section Validation', () => {
    test('should have EnableVersioning condition', () => {
      expect(template.Conditions).toHaveProperty('EnableVersioning');
      
      const condition = template.Conditions.EnableVersioning;
      expect(condition).toHaveProperty('Fn::Equals');
      expect(condition['Fn::Equals']).toEqual([
        { 'Ref': 'EnableS3Versioning' },
        'Enabled'
      ]);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ 'Ref': 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      
      // Check tags
      const nameTag = vpc.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Name');
      const envTag = vpc.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Environment');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-VPC' });
      expect(envTag.Value).toEqual({ 'Ref': 'EnvironmentSuffix' });
    });

    test('should have Internet Gateway with proper attachment', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({ 'Ref': 'InternetGateway' });
      expect(attachment.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
    });

    test('should have 3 public subnets in different AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      
      publicSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        
        // Check AZ selection
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
        
        // Check CIDR reference
        expect(subnet.Properties.CidrBlock).toEqual({ 'Ref': `PublicSubnet${index + 1}CIDR` });
        
        // Check tags
        const typeTag = subnet.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Type');
        expect(typeTag.Value).toBe('Public');
      });
    });

    test('should have 3 private subnets in different AZs', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      
      privateSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
        
        // Check AZ selection
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
        
        // Check CIDR reference
        expect(subnet.Properties.CidrBlock).toEqual({ 'Ref': `PrivateSubnet${index + 1}CIDR` });
        
        // Check tags
        const typeTag = subnet.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Type');
        expect(typeTag.Value).toBe('Private');
      });
    });

    test('should have 3 NAT Gateways with EIPs', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      const eips = ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'];
      
      natGateways.forEach((natName, index) => {
        const nat = template.Resources[natName];
        const eip = template.Resources[eips[index]];
        
        // Check EIP
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('InternetGatewayAttachment');
        expect(eip.Properties.Domain).toBe('vpc');
        
        // Check NAT Gateway
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [eips[index], 'AllocationId']
        });
        expect(nat.Properties.SubnetId).toEqual({ 'Ref': `PublicSubnet${index + 1}` });
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.DefaultPublicRoute;
      
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
      
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
      expect(route.Properties.RouteTableId).toEqual({ 'Ref': 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ 'Ref': 'InternetGateway' });
    });

    test('should have separate private route tables for each AZ', () => {
      const privateTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];
      const privateRoutes = ['DefaultPrivateRoute1', 'DefaultPrivateRoute2', 'DefaultPrivateRoute3'];
      
      privateTables.forEach((tableName, index) => {
        const table = template.Resources[tableName];
        const route = template.Resources[privateRoutes[index]];
        
        expect(table.Type).toBe('AWS::EC2::RouteTable');
        expect(table.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
        
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ 'Ref': tableName });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ 'Ref': `NatGateway${index + 1}` });
      });
    });

    test('should have route table associations for all subnets', () => {
      // Public subnet associations
      for (let i = 1; i <= 3; i++) {
        const association = template.Resources[`PublicSubnet${i}RouteTableAssociation`];
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Properties.RouteTableId).toEqual({ 'Ref': 'PublicRouteTable' });
        expect(association.Properties.SubnetId).toEqual({ 'Ref': `PublicSubnet${i}` });
      }
      
      // Private subnet associations
      for (let i = 1; i <= 3; i++) {
        const association = template.Resources[`PrivateSubnet${i}RouteTableAssociation`];
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Properties.RouteTableId).toEqual({ 'Ref': `PrivateRouteTable${i}` });
        expect(association.Properties.SubnetId).toEqual({ 'Ref': `PrivateSubnet${i}` });
      }
    });
  });

  describe('Security Groups', () => {
    test('should have WebServer security group with HTTP/HTTPS rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-WebServer-SG' });
      
      // Check ingress rules
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      const httpRule = ingress.find((rule: { FromPort: number; }) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: { FromPort: number; }) => rule.FromPort === 443);
      
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      
      // Check egress rules
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe(-1);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Bastion security group with SSH rule', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-Bastion-SG' });
      
      // Check SSH ingress rule
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(22);
      expect(ingress[0].ToPort).toBe(22);
      expect(ingress[0].CidrIp).toEqual({ 'Ref': 'SSHLocation' });
    });

    test('should have Database security group with MySQL rule from WebServer', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-Database-SG' });
      
      // Check MySQL ingress rule
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ 'Ref': 'WebServerSecurityGroup' });
    });
  });

  describe('Network ACLs', () => {
    test('should have Network ACL with proper configuration', () => {
      const nacl = template.Resources.NetworkAcl;
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(nacl.Properties.VpcId).toEqual({ 'Ref': 'VPC' });
    });

    test('should have correct inbound NACL entries', () => {
      const httpEntry = template.Resources.InboundHTTPNetworkAclEntry;
      const httpsEntry = template.Resources.InboundHTTPSNetworkAclEntry;
      const sshEntry = template.Resources.InboundSSHNetworkAclEntry;
      const returnTrafficEntry = template.Resources.InboundReturnTrafficNetworkAclEntry;
      
      // HTTP entry
      expect(httpEntry.Properties.RuleNumber).toBe(100);
      expect(httpEntry.Properties.Protocol).toBe(6);
      expect(httpEntry.Properties.RuleAction).toBe('allow');
      expect(httpEntry.Properties.Egress).toBe(false);
      expect(httpEntry.Properties.PortRange).toEqual({ From: 80, To: 80 });
      
      // HTTPS entry
      expect(httpsEntry.Properties.RuleNumber).toBe(110);
      expect(httpsEntry.Properties.PortRange).toEqual({ From: 443, To: 443 });
      
      // SSH entry
      expect(sshEntry.Properties.RuleNumber).toBe(120);
      expect(sshEntry.Properties.PortRange).toEqual({ From: 22, To: 22 });
      expect(sshEntry.Properties.CidrBlock).toEqual({ 'Ref': 'SSHLocation' });
      
      // Return traffic entry
      expect(returnTrafficEntry.Properties.RuleNumber).toBe(130);
      expect(returnTrafficEntry.Properties.PortRange).toEqual({ From: 1024, To: 65535 });
    });

    test('should have outbound NACL entry', () => {
      const outboundEntry = template.Resources.OutboundNetworkAclEntry;
      expect(outboundEntry.Properties.RuleNumber).toBe(100);
      expect(outboundEntry.Properties.Protocol).toBe(-1);
      expect(outboundEntry.Properties.Egress).toBe(true);
      expect(outboundEntry.Properties.RuleAction).toBe('allow');
    });

    test('should have NACL associations for public subnets', () => {
      for (let i = 1; i <= 3; i++) {
        const association = template.Resources[`PublicSubnet${i}NetworkAclAssociation`];
        expect(association.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
        expect(association.Properties.SubnetId).toEqual({ 'Ref': `PublicSubnet${i}` });
        expect(association.Properties.NetworkAclId).toEqual({ 'Ref': 'NetworkAcl' });
      }
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with comprehensive security configuration', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
      
      const props = s3Bucket.Properties;
      
      // Check bucket name
      expect(props.BucketName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-secure-data-${AWS::AccountId}-${AWS::Region}'
      });
      
      // Check encryption
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      
      // Check versioning
      expect(props.VersioningConfiguration.Status).toEqual({
        'Fn::If': ['EnableVersioning', 'Enabled', 'Suspended']
      });
      
      // Check public access block
      const publicBlock = props.PublicAccessBlockConfiguration;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have lifecycle configuration rules', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const lifecycleRules = s3Bucket.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(2);
      
      const deleteRule = lifecycleRules.find((rule: { Id: string; }) => rule.Id === 'DeleteIncompleteMultipartUploads');
      const transitionRule = lifecycleRules.find((rule: { Id: string; }) => rule.Id === 'TransitionToIA');
      
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(7);
      
      expect(transitionRule.Status).toBe('Enabled');
      expect(transitionRule.Transitions).toHaveLength(1);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
    });
  });

  describe('Outputs Section Validation', () => {
    const expectedOutputs = [
      'VPC', 'VPCCidr', 'PublicSubnets', 'PrivateSubnets',
      'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
      'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
      'WebServerSecurityGroup', 'BastionSecurityGroup', 'DatabaseSecurityGroup',
      'S3BucketName', 'S3BucketArn'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs).toHaveProperty(output);
      });
    });

    test('should have VPC outputs with proper exports', () => {
      const vpcOutput = template.Outputs.VPC;
      expect(vpcOutput.Description).toContain('VPC');
      expect(vpcOutput.Value).toEqual({ 'Ref': 'VPC' });
      expect(vpcOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCID' });
      
      const vpcCidrOutput = template.Outputs.VPCCidr;
      expect(vpcCidrOutput.Value).toEqual({ 'Ref': 'VpcCIDR' });
      expect(vpcCidrOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-CIDR' });
    });

    test('should have subnet list outputs', () => {
      const publicSubnets = template.Outputs.PublicSubnets;
      expect(publicSubnets.Value).toEqual({
        'Fn::Join': [',', [
          { 'Ref': 'PublicSubnet1' },
          { 'Ref': 'PublicSubnet2' },
          { 'Ref': 'PublicSubnet3' }
        ]]
      });
      
      const privateSubnets = template.Outputs.PrivateSubnets;
      expect(privateSubnets.Value).toEqual({
        'Fn::Join': [',', [
          { 'Ref': 'PrivateSubnet1' },
          { 'Ref': 'PrivateSubnet2' },
          { 'Ref': 'PrivateSubnet3' }
        ]]
      });
    });

    test('should have security group outputs', () => {
      const webSGOutput = template.Outputs.WebServerSecurityGroup;
      expect(webSGOutput.Value).toEqual({ 'Ref': 'WebServerSecurityGroup' });
      expect(webSGOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-WebServerSecurityGroup' });
      
      const bastionSGOutput = template.Outputs.BastionSecurityGroup;
      expect(bastionSGOutput.Value).toEqual({ 'Ref': 'BastionSecurityGroup' });
      
      const dbSGOutput = template.Outputs.DatabaseSecurityGroup;
      expect(dbSGOutput.Value).toEqual({ 'Ref': 'DatabaseSecurityGroup' });
    });

    test('should have S3 outputs', () => {
      const bucketNameOutput = template.Outputs.S3BucketName;
      expect(bucketNameOutput.Value).toEqual({ 'Ref': 'S3Bucket' });
      expect(bucketNameOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-S3BucketName' });
      
      const bucketArnOutput = template.Outputs.S3BucketArn;
      expect(bucketArnOutput.Value).toEqual({ 'Fn::GetAtt': ['S3Bucket', 'Arn'] });
      expect(bucketArnOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-S3BucketArn' });
    });
  });

  describe('Resource Naming and Tagging Validation', () => {
    test('should use consistent environment-based naming', () => {
      const resourcesWithEnvNaming = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1',
        'NatGateway1EIP', 'NatGateway1', 'PublicRouteTable', 'PrivateRouteTable1',
        'WebServerSecurityGroup', 'BastionSecurityGroup', 'DatabaseSecurityGroup',
        'NetworkAcl', 'S3Bucket'
      ];
      
      resourcesWithEnvNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Environment');
          expect(envTag.Value).toEqual({ 'Ref': 'EnvironmentSuffix' });
        }
        
        if (resource.Properties.GroupName) {
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        
        if (resource.Properties.BucketName) {
          expect(resource.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have consistent tagging strategy', () => {
      const taggedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1',
        'NatGateway1EIP', 'NatGateway1', 'PublicRouteTable', 'PrivateRouteTable1',
        'WebServerSecurityGroup', 'BastionSecurityGroup', 'DatabaseSecurityGroup',
        'NetworkAcl', 'S3Bucket'
      ];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        
        const nameTag = resource.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Name');
        const envTag = resource.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ 'Ref': 'EnvironmentSuffix' });
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should implement defense in depth with Security Groups and NACLs', () => {
      // Security Groups exist
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      
      // Network ACLs exist
      expect(template.Resources.NetworkAcl).toBeDefined();
      expect(template.Resources.InboundHTTPNetworkAclEntry).toBeDefined();
      expect(template.Resources.InboundHTTPSNetworkAclEntry).toBeDefined();
      expect(template.Resources.OutboundNetworkAclEntry).toBeDefined();
    });

    test('should follow principle of least privilege for database access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress[0];
      
      // Database only accessible from WebServer security group, not from internet
      expect(ingress.SourceSecurityGroupId).toEqual({ 'Ref': 'WebServerSecurityGroup' });
      expect(ingress.CidrIp).toBeUndefined();
    });

    test('should restrict SSH access to specified CIDR', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const sshRule = bastionSG.Properties.SecurityGroupIngress[0];
      
      expect(sshRule.CidrIp).toEqual({ 'Ref': 'SSHLocation' });
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
    });

    test('should have S3 bucket with security best practices', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const props = s3Bucket.Properties;
      
      // Encryption enabled
      expect(props.BucketEncryption).toBeDefined();
      
      // Public access blocked
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      
      // Deletion protection
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('High Availability and Fault Tolerance', () => {
    test('should distribute resources across 3 availability zones', () => {
      // Public subnets in 3 AZs
      for (let i = 1; i <= 3; i++) {
        const subnet = template.Resources[`PublicSubnet${i}`];
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [i - 1, { 'Fn::GetAZs': '' }]
        });
      }
      
      // Private subnets in 3 AZs
      for (let i = 1; i <= 3; i++) {
        const subnet = template.Resources[`PrivateSubnet${i}`];
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [i - 1, { 'Fn::GetAZs': '' }]
        });
      }
    });

    test('should have separate NAT Gateways for each AZ', () => {
      for (let i = 1; i <= 3; i++) {
        const natGateway = template.Resources[`NatGateway${i}`];
        expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
        expect(natGateway.Properties.SubnetId).toEqual({ 'Ref': `PublicSubnet${i}` });
      }
    });

    test('should have separate route tables for private subnets', () => {
      for (let i = 1; i <= 3; i++) {
        const routeTable = template.Resources[`PrivateRouteTable${i}`];
        const route = template.Resources[`DefaultPrivateRoute${i}`];
        
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(route.Properties.NatGatewayId).toEqual({ 'Ref': `NatGateway${i}` });
      }
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of each resource type', () => {
      const resourceCounts = {
        'AWS::EC2::VPC': 1,
        'AWS::EC2::InternetGateway': 1,
        'AWS::EC2::Subnet': 6, // 3 public + 3 private
        'AWS::EC2::EIP': 3,
        'AWS::EC2::NatGateway': 3,
        'AWS::EC2::RouteTable': 4, // 1 public + 3 private
        'AWS::EC2::Route': 4, // 1 public + 3 private
        'AWS::EC2::SubnetRouteTableAssociation': 6,
        'AWS::EC2::SecurityGroup': 3,
        'AWS::EC2::NetworkAcl': 1,
        'AWS::EC2::NetworkAclEntry': 5, // 4 inbound + 1 outbound
        'AWS::EC2::SubnetNetworkAclAssociation': 3, // Only public subnets
        'AWS::S3::Bucket': 1
      };
      
      Object.entries(resourceCounts).forEach(([resourceType, expectedCount]) => {
        const actualCount = Object.values(template.Resources).filter(
          resource => (resource as { Type?: string }).Type === resourceType
        ).length;
        expect(actualCount).toBe(expectedCount);
      });
    });
  });
});

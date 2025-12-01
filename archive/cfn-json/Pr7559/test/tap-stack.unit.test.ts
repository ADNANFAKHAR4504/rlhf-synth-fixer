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
      expect(template.Description).toContain('VPC infrastructure');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.Default).toBe('production');
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });

    test('should have CostCenter parameter', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Type).toBe('String');
      expect(template.Parameters.CostCenter.Default).toBe('digital-banking');
      expect(template.Parameters.CostCenter.AllowedValues).toEqual([
        'digital-banking',
        'core-banking',
        'platform-services',
      ]);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '[a-z0-9-]+'
      );
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('banking-platform');
    });
  });

  describe('Mappings', () => {
    test('should have AmazonLinux2AMI mapping', () => {
      expect(template.Mappings.AmazonLinux2AMI).toBeDefined();
    });

    test('should have us-east-1 AMI', () => {
      expect(template.Mappings.AmazonLinux2AMI['us-east-1']).toBeDefined();
      expect(template.Mappings.AmazonLinux2AMI['us-east-1'].AMI).toBeDefined();
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostnames enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have Delete deletion policy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('VPC should have correct name tag with environmentSuffix', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'vpc-${EnvironmentSuffix}',
      });
    });

    test('VPC should have required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPCGatewayAttachment resource', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('InternetGateway should have Delete deletion policy', () => {
      expect(template.Resources.InternetGateway.DeletionPolicy).toBe('Delete');
    });

    test('InternetGateway should have correct name tag with environmentSuffix', () => {
      const nameTag = template.Resources.InternetGateway.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'igw-${EnvironmentSuffix}',
      });
    });
  });

  describe('Public Subnets', () => {
    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('PublicSubnet1 should have correct CIDR block', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
    });

    test('PublicSubnet2 should have correct CIDR block', () => {
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
    });

    test('PublicSubnet3 should have correct CIDR block', () => {
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe(
        '10.0.3.0/24'
      );
    });

    test('public subnets should enable public IP assignment', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should span different AZs', () => {
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
      expect(template.Resources.PublicSubnet3.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [2, { 'Fn::GetAZs': '' }],
      });
    });

    test('public subnets should have Delete deletion policy', () => {
      expect(template.Resources.PublicSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnet2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnet3.DeletionPolicy).toBe('Delete');
    });

    test('public subnets should have correct name tags with environmentSuffix', () => {
      const subnet1NameTag = template.Resources.PublicSubnet1.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet1NameTag.Value).toEqual({
        'Fn::Sub': 'public-subnet-1-${EnvironmentSuffix}',
      });

      const subnet2NameTag = template.Resources.PublicSubnet2.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet2NameTag.Value).toEqual({
        'Fn::Sub': 'public-subnet-2-${EnvironmentSuffix}',
      });

      const subnet3NameTag = template.Resources.PublicSubnet3.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet3NameTag.Value).toEqual({
        'Fn::Sub': 'public-subnet-3-${EnvironmentSuffix}',
      });
    });
  });

  describe('Private Subnets', () => {
    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('PrivateSubnet1 should have correct CIDR block', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.11.0/24'
      );
    });

    test('PrivateSubnet2 should have correct CIDR block', () => {
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.12.0/24'
      );
    });

    test('PrivateSubnet3 should have correct CIDR block', () => {
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe(
        '10.0.13.0/24'
      );
    });

    test('private subnets should not enable public IP assignment', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('private subnets should span different AZs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
      expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [2, { 'Fn::GetAZs': '' }],
      });
    });

    test('private subnets should have Delete deletion policy', () => {
      expect(template.Resources.PrivateSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet3.DeletionPolicy).toBe('Delete');
    });

    test('private subnets should have correct name tags with environmentSuffix', () => {
      const subnet1NameTag = template.Resources.PrivateSubnet1.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet1NameTag.Value).toEqual({
        'Fn::Sub': 'private-subnet-1-${EnvironmentSuffix}',
      });

      const subnet2NameTag = template.Resources.PrivateSubnet2.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet2NameTag.Value).toEqual({
        'Fn::Sub': 'private-subnet-2-${EnvironmentSuffix}',
      });

      const subnet3NameTag = template.Resources.PrivateSubnet3.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(subnet3NameTag.Value).toEqual({
        'Fn::Sub': 'private-subnet-3-${EnvironmentSuffix}',
      });
    });
  });

  describe('NAT Instance Security Group', () => {
    test('should have NAT instance security group', () => {
      expect(template.Resources.NATInstanceSecurityGroup).toBeDefined();
      expect(template.Resources.NATInstanceSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Delete deletion policy', () => {
      expect(template.Resources.NATInstanceSecurityGroup.DeletionPolicy).toBe('Delete');
    });

    test('should allow HTTP from private subnet 1', () => {
      const httpRules = template.Resources.NATInstanceSecurityGroup.Properties.SecurityGroupIngress.filter(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpRules.length).toBeGreaterThanOrEqual(3);
      const privateCidrs = httpRules.map((rule: any) => rule.CidrIp);
      expect(privateCidrs).toContain('10.0.11.0/24');
      expect(privateCidrs).toContain('10.0.12.0/24');
      expect(privateCidrs).toContain('10.0.13.0/24');
    });

    test('should allow HTTPS from private subnet 1', () => {
      const httpsRules = template.Resources.NATInstanceSecurityGroup.Properties.SecurityGroupIngress.filter(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpsRules.length).toBeGreaterThanOrEqual(3);
      const privateCidrs = httpsRules.map((rule: any) => rule.CidrIp);
      expect(privateCidrs).toContain('10.0.11.0/24');
      expect(privateCidrs).toContain('10.0.12.0/24');
      expect(privateCidrs).toContain('10.0.13.0/24');
    });

    test('should allow all outbound traffic', () => {
      const egressRules = template.Resources.NATInstanceSecurityGroup.Properties.SecurityGroupEgress;
      expect(egressRules.length).toBeGreaterThanOrEqual(1);
      expect(egressRules[0].IpProtocol).toBe('-1');
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have correct name tag with environmentSuffix', () => {
      const nameTag = template.Resources.NATInstanceSecurityGroup.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'nat-sg-${EnvironmentSuffix}',
      });
    });
  });

  describe('NAT Instance IAM Role', () => {
    test('should have NAT instance IAM role', () => {
      expect(template.Resources.NATInstanceRole).toBeDefined();
      expect(template.Resources.NATInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Delete deletion policy', () => {
      expect(template.Resources.NATInstanceRole.DeletionPolicy).toBe('Delete');
    });

    test('should have SSM managed policy', () => {
      const managedPolicies = template.Resources.NATInstanceRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have instance profile', () => {
      expect(template.Resources.NATInstanceProfile).toBeDefined();
      expect(template.Resources.NATInstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });
  });

  describe('NAT Instances', () => {
    test('should have 3 NAT instances', () => {
      expect(template.Resources.NATInstance1).toBeDefined();
      expect(template.Resources.NATInstance2).toBeDefined();
      expect(template.Resources.NATInstance3).toBeDefined();
    });

    test('NAT instances should be t3.micro', () => {
      expect(template.Resources.NATInstance1.Properties.InstanceType).toBe('t3.micro');
      expect(template.Resources.NATInstance2.Properties.InstanceType).toBe('t3.micro');
      expect(template.Resources.NATInstance3.Properties.InstanceType).toBe('t3.micro');
    });

    test('NAT instances should use Amazon Linux 2 AMI from mapping', () => {
      expect(template.Resources.NATInstance1.Properties.ImageId).toEqual({
        'Fn::FindInMap': ['AmazonLinux2AMI', { Ref: 'AWS::Region' }, 'AMI'],
      });
    });

    test('NAT instances should have source/dest check disabled', () => {
      expect(template.Resources.NATInstance1.Properties.SourceDestCheck).toBe(false);
      expect(template.Resources.NATInstance2.Properties.SourceDestCheck).toBe(false);
      expect(template.Resources.NATInstance3.Properties.SourceDestCheck).toBe(false);
    });

    test('NAT instances should have Delete deletion policy', () => {
      expect(template.Resources.NATInstance1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATInstance2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATInstance3.DeletionPolicy).toBe('Delete');
    });

    test('NAT instances should have UserData for NAT configuration', () => {
      expect(template.Resources.NATInstance1.Properties.UserData).toBeDefined();
      expect(template.Resources.NATInstance2.Properties.UserData).toBeDefined();
      expect(template.Resources.NATInstance3.Properties.UserData).toBeDefined();
    });

    test('NAT instances should have correct name tags with environmentSuffix', () => {
      const instance1NameTag = template.Resources.NATInstance1.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(instance1NameTag.Value).toEqual({
        'Fn::Sub': 'nat-instance-1-${EnvironmentSuffix}',
      });

      const instance2NameTag = template.Resources.NATInstance2.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(instance2NameTag.Value).toEqual({
        'Fn::Sub': 'nat-instance-2-${EnvironmentSuffix}',
      });

      const instance3NameTag = template.Resources.NATInstance3.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(instance3NameTag.Value).toEqual({
        'Fn::Sub': 'nat-instance-3-${EnvironmentSuffix}',
      });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have 3 private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('public route should point to internet gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe(
        '0.0.0.0/0'
      );
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('private routes should point to NAT instances', () => {
      expect(template.Resources.PrivateRoute1.Properties.InstanceId).toEqual({
        Ref: 'NATInstance1',
      });
      expect(template.Resources.PrivateRoute2.Properties.InstanceId).toEqual({
        Ref: 'NATInstance2',
      });
      expect(template.Resources.PrivateRoute3.Properties.InstanceId).toEqual({
        Ref: 'NATInstance3',
      });
    });

    test('route tables should have Delete deletion policy', () => {
      expect(template.Resources.PublicRouteTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTable1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTable2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTable3.DeletionPolicy).toBe('Delete');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('VPC Flow Logs (Optional)', () => {
    test('should have VPC flow logs S3 bucket', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('flow logs bucket should have encryption enabled', () => {
      const encryption = template.Resources.FlowLogsBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('flow logs bucket should block public access', () => {
      const publicAccess = template.Resources.FlowLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('flow logs bucket should have lifecycle policy', () => {
      const lifecycle = template.Resources.FlowLogsBucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have VPC flow log resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('flow logs bucket should have Delete deletion policy', () => {
      expect(template.Resources.FlowLogsBucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('CloudWatch Alarms (Optional)', () => {
    test('should have CloudWatch alarms for NAT instances', () => {
      expect(template.Resources.NATInstanceAlarm1).toBeDefined();
      expect(template.Resources.NATInstanceAlarm2).toBeDefined();
      expect(template.Resources.NATInstanceAlarm3).toBeDefined();
    });

    test('NAT instance alarms should monitor status check', () => {
      expect(template.Resources.NATInstanceAlarm1.Properties.MetricName).toBe(
        'StatusCheckFailed'
      );
      expect(template.Resources.NATInstanceAlarm1.Properties.Namespace).toBe('AWS/EC2');
    });

    test('alarms should have Delete deletion policy', () => {
      expect(template.Resources.NATInstanceAlarm1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATInstanceAlarm2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATInstanceAlarm3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have public subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
    });

    test('should have private subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have NAT instance outputs', () => {
      expect(template.Outputs.NATInstance1Id).toBeDefined();
      expect(template.Outputs.NATInstance2Id).toBeDefined();
      expect(template.Outputs.NATInstance3Id).toBeDefined();
    });

    test('should have security group output', () => {
      expect(template.Outputs.NATSecurityGroupId).toBeDefined();
    });

    test('should have flow logs bucket output', () => {
      expect(template.Outputs.FlowLogsBucketName).toBeDefined();
    });

    test('outputs should have export names', () => {
      expect(template.Outputs.VPCId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete deletion policy', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        // Routes and associations don't have DeletionPolicy
        if (!resourceKey.includes('Route') && !resourceKey.includes('Association') && !resourceKey.includes('Attachment') && !resourceKey.includes('Policy')) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should include environmentSuffix', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'vpc-${EnvironmentSuffix}',
      });
    });

    test('all subnet names should include environmentSuffix', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];

      subnets.forEach(subnetKey => {
        const nameTag = template.Resources[subnetKey].Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('all NAT instance names should include environmentSuffix', () => {
      const instances = ['NATInstance1', 'NATInstance2', 'NATInstance3'];

      instances.forEach(instanceKey => {
        const nameTag = template.Resources[instanceKey].Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have expected minimum number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});

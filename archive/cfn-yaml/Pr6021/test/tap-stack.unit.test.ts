import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE TESTS
  // ===================================================================

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure and Scalable VPC Infrastructure with EC2 instances and S3 bucket'
      );
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(typeof template.Mappings).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  // ===================================================================
  // PARAMETERS TESTS
  // ===================================================================

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('securevpc');
      expect(param.Description).toBe(
        'Project name to be used for resource naming (lowercase only for S3 compatibility)'
      );
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('should have SSHAllowedIP parameter', () => {
      expect(template.Parameters.SSHAllowedIP).toBeDefined();
    });

    test('SSHAllowedIP parameter should have correct properties', () => {
      const param = template.Parameters.SSHAllowedIP;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('LatestAmiId parameter should use SSM parameter store', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
    });

    test('should have CreateNATGateways parameter', () => {
      expect(template.Parameters.CreateNATGateways).toBeDefined();
    });

    test('CreateNATGateways parameter should have correct properties', () => {
      const param = template.Parameters.CreateNATGateways;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have exactly 6 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(6);
    });
  });

  // ===================================================================
  // CONDITIONS TESTS
  // ===================================================================

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have HasSSHAccess condition', () => {
      expect(template.Conditions.HasSSHAccess).toBeDefined();
    });

    test('should have ShouldCreateNATGateways condition', () => {
      expect(template.Conditions.ShouldCreateNATGateways).toBeDefined();
    });

    test('should have exactly 3 conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(3);
    });
  });

  // ===================================================================
  // MAPPINGS TESTS
  // ===================================================================

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have VPC CIDR configuration', () => {
      expect(template.Mappings.SubnetConfig.VPC).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('SubnetConfig should have public subnet configurations', () => {
      expect(template.Mappings.SubnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet3.CIDR).toBe('10.0.3.0/24');
    });

    test('SubnetConfig should have private subnet configurations', () => {
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.0.11.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.0.12.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet3.CIDR).toBe('10.0.13.0/24');
    });
  });

  // ===================================================================
  // VPC RESOURCES TESTS
  // ===================================================================

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should be of type AWS::EC2::VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have EnableDnsHostnames and EnableDnsSupport enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct CIDR block mapping', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR'],
      });
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(vpc.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  // ===================================================================
  // INTERNET GATEWAY TESTS
  // ===================================================================

  describe('Internet Gateway Resources', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should be of type AWS::EC2::InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway resource', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('AttachGateway should be of type AWS::EC2::VPCGatewayAttachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('AttachGateway should reference VPC and InternetGateway', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });
  });

  // ===================================================================
  // PUBLIC SUBNET TESTS
  // ===================================================================

  describe('Public Subnet Resources', () => {
    test('should have PublicSubnet1 resource', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
    });

    test('should have PublicSubnet2 resource', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have PublicSubnet3 resource', () => {
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('all public subnets should be of type AWS::EC2::Subnet', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('all public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('all public subnets should reference VPC', () => {
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PublicSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PublicSubnet3.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('public subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      const subnet3AZ = template.Resources.PublicSubnet3.Properties.AvailabilityZone;

      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3AZ).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });
  });

  // ===================================================================
  // PRIVATE SUBNET TESTS
  // ===================================================================

  describe('Private Subnet Resources', () => {
    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have PrivateSubnet3 resource', () => {
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('all private subnets should be of type AWS::EC2::Subnet', () => {
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('all private subnets should NOT have MapPublicIpOnLaunch', () => {
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });

    test('all private subnets should reference VPC', () => {
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet3.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('private subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      const subnet3AZ = template.Resources.PrivateSubnet3.Properties.AvailabilityZone;

      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3AZ).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });
  });

  // ===================================================================
  // NAT GATEWAY TESTS
  // ===================================================================

  describe('NAT Gateway Resources', () => {
    test('should have NATGateway1EIP resource', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
    });

    test('should have NATGateway2EIP resource', () => {
      expect(template.Resources.NATGateway2EIP).toBeDefined();
    });

    test('should have NATGateway3EIP resource', () => {
      expect(template.Resources.NATGateway3EIP).toBeDefined();
    });

    test('all NAT Gateway EIPs should be conditional on ShouldCreateNATGateways', () => {
      expect(template.Resources.NATGateway1EIP.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NATGateway2EIP.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NATGateway3EIP.Condition).toBe('ShouldCreateNATGateways');
    });

    test('all NAT Gateway EIPs should be of type AWS::EC2::EIP', () => {
      expect(template.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGateway2EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGateway3EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('all NAT Gateway EIPs should have Domain vpc', () => {
      expect(template.Resources.NATGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NATGateway2EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NATGateway3EIP.Properties.Domain).toBe('vpc');
    });

    test('all NAT Gateway EIPs should depend on AttachGateway', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway3EIP.DependsOn).toBe('AttachGateway');
    });

    test('should have NATGateway1 resource', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
    });

    test('should have NATGateway2 resource', () => {
      expect(template.Resources.NATGateway2).toBeDefined();
    });

    test('should have NATGateway3 resource', () => {
      expect(template.Resources.NATGateway3).toBeDefined();
    });

    test('all NAT Gateways should be conditional on ShouldCreateNATGateways', () => {
      expect(template.Resources.NATGateway1.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NATGateway2.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NATGateway3.Condition).toBe('ShouldCreateNATGateways');
    });

    test('all NAT Gateways should be of type AWS::EC2::NatGateway', () => {
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet2',
      });
      expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet3',
      });
    });

    test('NAT Gateways should reference their respective EIPs', () => {
      expect(template.Resources.NATGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId'],
      });
      expect(template.Resources.NATGateway2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId'],
      });
      expect(template.Resources.NATGateway3.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway3EIP', 'AllocationId'],
      });
    });
  });

  // ===================================================================
  // ROUTE TABLE TESTS
  // ===================================================================

  describe('Route Table Resources', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('PublicRouteTable should be of type AWS::EC2::RouteTable', () => {
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PublicRouteTable should reference VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicRoute resource', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
    });

    test('PublicRoute should be of type AWS::EC2::Route', () => {
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PublicRoute should route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe(
        '0.0.0.0/0'
      );
    });

    test('should have all public subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
    });

    test('should have PrivateRouteTable1 resource', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
    });

    test('should have PrivateRouteTable2 resource', () => {
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have PrivateRouteTable3 resource', () => {
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('all private route tables should be of type AWS::EC2::RouteTable', () => {
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable3.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PrivateRoute1 resource', () => {
      expect(template.Resources.PrivateRoute1).toBeDefined();
    });

    test('should have PrivateRoute2 resource', () => {
      expect(template.Resources.PrivateRoute2).toBeDefined();
    });

    test('should have PrivateRoute3 resource', () => {
      expect(template.Resources.PrivateRoute3).toBeDefined();
    });

    test('all private routes should be conditional on ShouldCreateNATGateways', () => {
      expect(template.Resources.PrivateRoute1.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.PrivateRoute2.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.PrivateRoute3.Condition).toBe('ShouldCreateNATGateways');
    });

    test('private routes should route to their respective NAT Gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({
        Ref: 'NATGateway1',
      });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({
        Ref: 'NATGateway2',
      });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({
        Ref: 'NATGateway3',
      });
    });

    test('should have all private subnet route table associations', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  // ===================================================================
  // S3 BUCKET TESTS
  // ===================================================================

  describe('S3 Bucket Resources', () => {
    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
    });

    test('S3Bucket should be of type AWS::S3::Bucket', () => {
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have versioning enabled', () => {
      expect(
        template.Resources.S3Bucket.Properties.VersioningConfiguration.Status
      ).toBe('Enabled');
    });

    test('S3Bucket should have encryption enabled', () => {
      const encryption =
        template.Resources.S3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3Bucket should block all public access', () => {
      const publicAccessBlock =
        template.Resources.S3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3Bucket should have lifecycle configuration', () => {
      const lifecycleRules =
        template.Resources.S3Bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toBeDefined();
      expect(lifecycleRules.length).toBeGreaterThan(0);

      const deleteOldVersionsRule = lifecycleRules.find(
        (rule: any) => rule.Id === 'DeleteOldVersions'
      );
      expect(deleteOldVersionsRule).toBeDefined();
      expect(deleteOldVersionsRule.Status).toBe('Enabled');
      expect(deleteOldVersionsRule.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('should have S3BucketPolicy resource', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
    });

    test('S3BucketPolicy should be of type AWS::S3::BucketPolicy', () => {
      expect(template.Resources.S3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3BucketPolicy should enforce SSL/TLS', () => {
      const policy = template.Resources.S3BucketPolicy.Properties.PolicyDocument;
      const denyInsecureStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );

      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  // ===================================================================
  // IAM RESOURCES TESTS
  // ===================================================================

  describe('IAM Resources', () => {
    test('should have EC2Role resource', () => {
      expect(template.Resources.EC2Role).toBeDefined();
    });

    test('EC2Role should be of type AWS::IAM::Role', () => {
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2Role should have correct assume role policy', () => {
      const assumeRolePolicy =
        template.Resources.EC2Role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Version).toBe('2012-10-17');

      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(statement.Action).toContain('sts:AssumeRole');
    });

    test('EC2Role should have SSM managed policy attached', () => {
      const managedPolicies = template.Resources.EC2Role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('EC2Role should have S3 access policy', () => {
      const policies = template.Resources.EC2Role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');

      const statements = s3Policy.PolicyDocument.Statement;
      const s3AccessStatement = statements.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3AccessStatement).toBeDefined();
    });

    test('should have EC2InstanceProfile resource', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });

    test('EC2InstanceProfile should be of type AWS::IAM::InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('EC2InstanceProfile should reference EC2Role', () => {
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toEqual([
        { Ref: 'EC2Role' },
      ]);
    });

    test('should have VPCFlowLogsRole resource', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
    });

    test('VPCFlowLogsRole should be of type AWS::IAM::Role', () => {
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('VPCFlowLogsRole should have CloudWatch Logs permissions', () => {
      const policies = template.Resources.VPCFlowLogsRole.Properties.Policies;
      const cloudWatchPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogPolicy'
      );

      expect(cloudWatchPolicy).toBeDefined();

      const statement = cloudWatchPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });
  });

  // ===================================================================
  // SECURITY GROUP TESTS
  // ===================================================================

  describe('Security Group Resources', () => {
    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
    });

    test('EC2SecurityGroup should be of type AWS::EC2::SecurityGroup', () => {
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2SecurityGroup should reference VPC', () => {
      expect(template.Resources.EC2SecurityGroup.Properties.VpcId).toEqual({
        Ref: 'VPC',
      });
    });

    test('EC2SecurityGroup should have ingress rules', () => {
      expect(template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress).toBeDefined();
    });

    test('EC2SecurityGroup should have egress rules', () => {
      const egressRules = template.Resources.EC2SecurityGroup.Properties.SecurityGroupEgress;
      expect(egressRules).toBeDefined();
      expect(egressRules.length).toBeGreaterThan(0);

      // Check for HTTPS egress
      const httpsEgress = egressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsEgress).toBeDefined();
      expect(httpsEgress.IpProtocol).toBe('tcp');
    });

    test('EC2SecurityGroup ingress should be conditional based on SSH access', () => {
      const ingressRules = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules['Fn::If']).toBeDefined();
      expect(ingressRules['Fn::If'][0]).toBe('HasSSHAccess');
    });
  });

  // ===================================================================
  // EC2 INSTANCE TESTS
  // ===================================================================

  describe('EC2 Instance Resources', () => {
    test('should have EC2LaunchTemplate resource', () => {
      expect(template.Resources.EC2LaunchTemplate).toBeDefined();
    });

    test('EC2LaunchTemplate should be of type AWS::EC2::LaunchTemplate', () => {
      expect(template.Resources.EC2LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('EC2LaunchTemplate should use t2.micro instance type', () => {
      expect(
        template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData.InstanceType
      ).toBe('t2.micro');
    });

    test('EC2LaunchTemplate should reference IAM instance profile', () => {
      expect(
        template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData.IamInstanceProfile
          .Arn
      ).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });

    test('EC2LaunchTemplate should reference security group', () => {
      const securityGroups =
        template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData.SecurityGroupIds;
      expect(securityGroups).toContainEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('EC2LaunchTemplate should have user data', () => {
      expect(
        template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData.UserData
      ).toBeDefined();
    });

    test('should have EC2Instance1 resource', () => {
      expect(template.Resources.EC2Instance1).toBeDefined();
    });

    test('should have EC2Instance2 resource', () => {
      expect(template.Resources.EC2Instance2).toBeDefined();
    });

    test('should have EC2Instance3 resource', () => {
      expect(template.Resources.EC2Instance3).toBeDefined();
    });

    test('all EC2 instances should be of type AWS::EC2::Instance', () => {
      expect(template.Resources.EC2Instance1.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.EC2Instance2.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.EC2Instance3.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instances should be in private subnets', () => {
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet2',
      });
      expect(template.Resources.EC2Instance3.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet3',
      });
    });

    test('EC2 instances should use launch template', () => {
      expect(
        template.Resources.EC2Instance1.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
      expect(
        template.Resources.EC2Instance2.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
      expect(
        template.Resources.EC2Instance3.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
    });
  });

  // ===================================================================
  // VPC FLOW LOGS TESTS
  // ===================================================================

  describe('VPC Flow Logs Resources', () => {
    test('should have VPCFlowLogsLogGroup resource', () => {
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
    });

    test('VPCFlowLogsLogGroup should be of type AWS::Logs::LogGroup', () => {
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('VPCFlowLogsLogGroup should have retention period', () => {
      expect(template.Resources.VPCFlowLogsLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have VPCFlowLogs resource', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
    });

    test('VPCFlowLogs should be of type AWS::EC2::FlowLog', () => {
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLogs should reference VPC', () => {
      expect(template.Resources.VPCFlowLogs.Properties.ResourceId).toEqual({
        Ref: 'VPC',
      });
    });

    test('VPCFlowLogs should capture all traffic', () => {
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('VPCFlowLogs should log to CloudWatch Logs', () => {
      expect(template.Resources.VPCFlowLogs.Properties.LogDestinationType).toBe(
        'cloud-watch-logs'
      );
    });

    test('VPCFlowLogs should reference log group', () => {
      expect(template.Resources.VPCFlowLogs.Properties.LogGroupName).toEqual({
        Ref: 'VPCFlowLogsLogGroup',
      });
    });

    test('VPCFlowLogs should reference IAM role', () => {
      expect(template.Resources.VPCFlowLogs.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogsRole', 'Arn'],
      });
    });
  });

  // ===================================================================
  // OUTPUTS TESTS
  // ===================================================================

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have VPCCidr output', () => {
      expect(template.Outputs.VPCCidr).toBeDefined();
      expect(template.Outputs.VPCCidr.Value).toEqual({
        'Fn::GetAtt': ['VPC', 'CidrBlock'],
      });
    });

    test('should have PublicSubnetIds output', () => {
      expect(template.Outputs.PublicSubnetIds).toBeDefined();
    });

    test('should have PrivateSubnetIds output', () => {
      expect(template.Outputs.PrivateSubnetIds).toBeDefined();
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('should have S3BucketArn output', () => {
      expect(template.Outputs.S3BucketArn).toBeDefined();
      expect(template.Outputs.S3BucketArn.Value).toEqual({
        'Fn::GetAtt': ['S3Bucket', 'Arn'],
      });
    });

    test('should have EC2SecurityGroupId output', () => {
      expect(template.Outputs.EC2SecurityGroupId).toBeDefined();
      expect(template.Outputs.EC2SecurityGroupId.Value).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });

    test('should have EC2Instance outputs', () => {
      expect(template.Outputs.EC2Instance1Id).toBeDefined();
      expect(template.Outputs.EC2Instance2Id).toBeDefined();
      expect(template.Outputs.EC2Instance3Id).toBeDefined();
    });

    test('should have EC2RoleArn output', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.EC2RoleArn.Value).toEqual({
        'Fn::GetAtt': ['EC2Role', 'Arn'],
      });
    });

    test('should have VPCFlowLogsLogGroup output', () => {
      expect(template.Outputs.VPCFlowLogsLogGroup).toBeDefined();
    });

    test('should have subnet ID outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have InternetGatewayId output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
    });

    test('should have route table outputs', () => {
      expect(template.Outputs.PublicRouteTableId).toBeDefined();
      expect(template.Outputs.PrivateRouteTable1Id).toBeDefined();
      expect(template.Outputs.PrivateRouteTable2Id).toBeDefined();
      expect(template.Outputs.PrivateRouteTable3Id).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs with Export should follow naming convention', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  // ===================================================================
  // RESOURCE COUNT VALIDATION
  // ===================================================================

  describe('Resource Count Validation', () => {
    test('should have correct total number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have 1 VPC', () => {
      const vpcs = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpcs.length).toBe(1);
    });

    test('should have 6 subnets (3 public + 3 private)', () => {
      const subnets = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBe(6);
    });

    test('should have 3 NAT Gateways', () => {
      const natGateways = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways.length).toBe(3);
    });

    test('should have 3 EC2 instances', () => {
      const instances = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::Instance'
      );
      expect(instances.length).toBe(3);
    });

    test('should have 1 S3 bucket', () => {
      const buckets = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      expect(buckets.length).toBe(1);
    });

    test('should have 2 IAM roles', () => {
      const roles = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(roles.length).toBe(2);
    });

    test('should have 1 security group', () => {
      const securityGroups = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBe(1);
    });
  });

  // ===================================================================
  // RESOURCE DEPENDENCIES VALIDATION
  // ===================================================================

  describe('Resource Dependencies Validation', () => {
    test('AttachGateway should depend on InternetGateway and VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('NAT Gateway EIPs should depend on AttachGateway', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway3EIP.DependsOn).toBe('AttachGateway');
    });

    test('PublicRoute should depend on AttachGateway', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('EC2 instances should reference launch template', () => {
      expect(
        template.Resources.EC2Instance1.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
      expect(
        template.Resources.EC2Instance2.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
      expect(
        template.Resources.EC2Instance3.Properties.LaunchTemplate.LaunchTemplateId
      ).toEqual({ Ref: 'EC2LaunchTemplate' });
    });

    test('S3BucketPolicy should reference S3Bucket', () => {
      expect(template.Resources.S3BucketPolicy.Properties.Bucket).toEqual({
        Ref: 'S3Bucket',
      });
    });

    test('VPCFlowLogs should reference VPC and log group', () => {
      expect(template.Resources.VPCFlowLogs.Properties.ResourceId).toEqual({
        Ref: 'VPC',
      });
      expect(template.Resources.VPCFlowLogs.Properties.LogGroupName).toEqual({
        Ref: 'VPCFlowLogsLogGroup',
      });
    });
  });

  // ===================================================================
  // SECURITY BEST PRACTICES VALIDATION
  // ===================================================================

  describe('Security Best Practices Validation', () => {
    test('S3 bucket should have encryption enabled', () => {
      expect(
        template.Resources.S3Bucket.Properties.BucketEncryption
      ).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const publicAccessBlock =
        template.Resources.S3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy should enforce SSL', () => {
      const policy = template.Resources.S3BucketPolicy.Properties.PolicyDocument;
      const denyInsecureStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
    });

    test('EC2 instances should be in private subnets', () => {
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet2',
      });
      expect(template.Resources.EC2Instance3.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet3',
      });
    });

    test('EC2 role should have least privilege S3 access', () => {
      const policies = template.Resources.EC2Role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();

      const statements = s3Policy.PolicyDocument.Statement;
      const bucketSpecificStatement = statements.find((stmt: any) =>
        stmt.Resource.some((r: any) => r['Fn::Sub'])
      );
      expect(bucketSpecificStatement).toBeDefined();
    });

    test('VPC Flow Logs should be enabled', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('Security group egress should allow HTTPS', () => {
      const egressRules = template.Resources.EC2SecurityGroup.Properties.SecurityGroupEgress;
      const httpsEgress = egressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsEgress).toBeDefined();
    });
  });

  // ===================================================================
  // HIGH AVAILABILITY VALIDATION
  // ===================================================================

  describe('High Availability Validation', () => {
    test('should have resources across multiple availability zones', () => {
      // Public subnets across 3 AZs
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

    test('should have NAT Gateways in different public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet2',
      });
      expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet3',
      });
    });

    test('should have EC2 instances in different private subnets', () => {
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet2',
      });
      expect(template.Resources.EC2Instance3.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet3',
      });
    });
  });
});

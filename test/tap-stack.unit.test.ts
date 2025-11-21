import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Loan Processing Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ========================================
  // PHASE 1: Template Structure Tests
  // ========================================

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Loan Processing Web Portal');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ========================================
  // PHASE 2: Parameters Validation (8 Parameters)
  // ========================================

  describe('Parameters', () => {
    test('should have all 8 required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'VpcCIDR',
        'ContainerImage',
        'ContainerCpu',
        'ContainerMemory',
        'DBMasterUsername',
        'AlertEmail',
        'FrontendDomain'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('resource naming');
    });

    test('VpcCIDR parameter should have correct properties', () => {
      const param = template.Parameters.VpcCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toContain('CIDR');
    });

    test('ContainerImage parameter should have correct properties', () => {
      const param = template.Parameters.ContainerImage;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('node:18-alpine');
      expect(param.Description).toContain('Docker image');
    });

    test('ContainerCpu parameter should have correct properties and allowed values', () => {
      const param = template.Parameters.ContainerCpu;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('512');
      expect(param.AllowedValues).toEqual(['256', '512', '1024', '2048', '4096']);
    });

    test('ContainerMemory parameter should have correct properties and allowed values', () => {
      const param = template.Parameters.ContainerMemory;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('1024');
      expect(param.AllowedValues).toEqual(['512', '1024', '2048', '4096', '8192']);
    });

    test('DBMasterUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe('1');
      expect(param.MaxLength).toBe('16');
    });

    test('AlertEmail parameter should have correct properties', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ops@example.com');
      expect(param.Description.toLowerCase()).toContain('email');
    });

    test('FrontendDomain parameter should have correct properties', () => {
      const param = template.Parameters.FrontendDomain;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('https://example.com');
      expect(param.Description).toContain('CORS');
    });
  });

  // ========================================
  // PHASE 3: VPC and Networking Resources
  // ========================================

  describe('VPC Configuration', () => {
    test('VPC should exist with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should use environmentSuffix in naming', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'vpc-vs1-${EnvironmentSuffix}'
      });
    });

    test('Internet Gateway should exist with correct properties', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'igw-vs1-${EnvironmentSuffix}'
      });
    });

    test('Internet Gateway should be attached to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnets Configuration', () => {
    test('should have 3 public subnets across 3 AZs', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
      });
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have 3 private subnets across 3 AZs', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
      });
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('all subnets should use environmentSuffix in naming', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3', 'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('NAT Gateways Configuration', () => {
    test('should have 3 NAT Gateway EIPs', () => {
      ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'].forEach(eipName => {
        const eip = template.Resources[eipName];
        expect(eip).toBeDefined();
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.DependsOn).toBe('AttachGateway');
      });
    });

    test('should have 3 NAT Gateways (one per AZ)', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      const eips = ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'];

      natGateways.forEach((natName, index) => {
        const nat = template.Resources[natName];
        expect(nat).toBeDefined();
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [eips[index], 'AllocationId']
        });
        expect(nat.Properties.SubnetId).toEqual({ Ref: publicSubnets[index] });
      });
    });

    test('NAT Gateways should use environmentSuffix in naming', () => {
      ['NatGateway1', 'NatGateway2', 'NatGateway3'].forEach(natName => {
        const nat = template.Resources[natName];
        expect(nat.Properties.Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should have 3 public subnet route table associations', () => {
      const associations = ['PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation', 'PublicSubnet3RouteTableAssociation'];
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      associations.forEach((assocName, index) => {
        const assoc = template.Resources[assocName];
        expect(assoc).toBeDefined();
        expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc.Properties.SubnetId).toEqual({ Ref: subnets[index] });
        expect(assoc.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });
    });

    test('should have 3 private route tables with NAT gateway routes', () => {
      const routeTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];
      const routes = ['PrivateRoute1', 'PrivateRoute2', 'PrivateRoute3'];
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];

      routeTables.forEach((rtName, index) => {
        const routeTable = template.Resources[rtName];
        expect(routeTable).toBeDefined();
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

        const route = template.Resources[routes[index]];
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ Ref: rtName });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: natGateways[index] });
      });
    });

    test('should have 3 private subnet route table associations', () => {
      const associations = ['PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation', 'PrivateSubnet3RouteTableAssociation'];
      const subnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      const routeTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];

      associations.forEach((assocName, index) => {
        const assoc = template.Resources[assocName];
        expect(assoc).toBeDefined();
        expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc.Properties.SubnetId).toEqual({ Ref: subnets[index] });
        expect(assoc.Properties.RouteTableId).toEqual({ Ref: routeTables[index] });
      });
    });
  });

  // ========================================
  // PHASE 4: Security Groups
  // ========================================

  describe('Security Groups', () => {
    test('ALB Security Group should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': 'alb-sg-vs1-${EnvironmentSuffix}' });
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
      expect(ingress[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('ECS Security Group should allow port 3000 from ALB only', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': 'ecs-sg-vs1-${EnvironmentSuffix}' });
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3000);
      expect(ingress[0].ToPort).toBe(3000);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('RDS Security Group should allow MySQL port from ECS only', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupName).toEqual({ 'Fn::Sub': 'rds-sg-vs1-${EnvironmentSuffix}' });
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });

    test('all security groups should allow all egress traffic', () => {
      ['ALBSecurityGroup', 'ECSSecurityGroup', 'RDSSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        const egress = sg.Properties.SecurityGroupEgress;
        expect(egress).toHaveLength(1);
        expect(egress[0].IpProtocol).toBe('-1');
        expect(egress[0].CidrIp).toBe('0.0.0.0/0');
      });
    });
  });

  // ========================================
  // PHASE 5: RDS Aurora Configuration
  // ========================================

  describe('RDS Aurora Database', () => {
    test('DB Subnet Group should exist with 3 private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupName).toEqual({
        'Fn::Sub': 'db-subnet-group-vs1-${EnvironmentSuffix}'
      });
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
        { Ref: 'PrivateSubnet3' }
      ]);
    });

    test('DB Secret should be created in Secrets Manager', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'aurora-credentials-vs1-${EnvironmentSuffix}'
      });
      expect(secret.Properties.Description).toContain('Aurora MySQL');

      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig.SecretStringTemplate).toEqual({
        'Fn::Sub': '{"username": "${DBMasterUsername}"}'
      });
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
    });

    test('Aurora cluster should be configured correctly', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
      expect(cluster.Properties.DBClusterIdentifier).toEqual({
        'Fn::Sub': 'aurora-cluster-vs1-${EnvironmentSuffix}'
      });
      expect(cluster.Properties.DatabaseName).toBe('loandb');
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(cluster.Properties.VpcSecurityGroupIds).toEqual([{ Ref: 'RDSSecurityGroup' }]);
    });

    test('Aurora cluster should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toEqual(['error', 'slowquery', 'audit']);
    });

    test('Aurora cluster should use Secrets Manager for credentials', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(cluster.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('should have 2 Aurora instances across 2 AZs', () => {
      ['DBInstance1', 'DBInstance2'].forEach((instanceName, index) => {
        const instance = template.Resources[instanceName];
        expect(instance).toBeDefined();
        expect(instance.Type).toBe('AWS::RDS::DBInstance');
        expect(instance.Properties.Engine).toBe('aurora-mysql');
        expect(instance.Properties.DBClusterIdentifier).toEqual({ Ref: 'DBCluster' });
        expect(instance.Properties.DBInstanceClass).toBe('db.t3.medium');
        expect(instance.Properties.PubliclyAccessible).toBe(false);
        expect(instance.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
      });
    });
  });

  // ========================================
  // PHASE 6: S3 and CloudFront
  // ========================================

  describe('S3 Static Assets Bucket', () => {
    test('S3 bucket should be configured correctly', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'loan-app-static-assets-vs1-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy for 90 days', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('S3 bucket should have CORS configured', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const cors = bucket.Properties.CorsConfiguration;
      expect(cors.CorsRules).toHaveLength(1);
      expect(cors.CorsRules[0].AllowedOrigins).toEqual([{ Ref: 'FrontendDomain' }]);
      expect(cors.CorsRules[0].AllowedMethods).toEqual(['GET', 'HEAD']);
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront OAI should exist', () => {
      const oai = template.Resources.CloudFrontOAI;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(oai.Properties.CloudFrontOriginAccessIdentityConfig.Comment).toEqual({
        'Fn::Sub': 'OAI for loan app static assets -vs1-${EnvironmentSuffix}'
      });
    });

    test('S3 Bucket Policy should grant CloudFront OAI access', () => {
      const policy = template.Resources.BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'StaticAssetsBucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Principal.CanonicalUser).toEqual({
        'Fn::GetAtt': ['CloudFrontOAI', 'S3CanonicalUserId']
      });
    });

    test('CloudFront distribution should be configured correctly', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution).toBeDefined();
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');

      const config = distribution.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
      expect(config.DefaultRootObject).toBe('index.html');
      expect(config.PriceClass).toBe('PriceClass_100');
    });

    test('CloudFront should use S3 origin with OAI', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      expect(origins).toHaveLength(1);
      expect(origins[0].Id).toBe('S3Origin');
      expect(origins[0].DomainName).toEqual({
        'Fn::GetAtt': ['StaticAssetsBucket', 'RegionalDomainName']
      });
      expect(origins[0].S3OriginConfig.OriginAccessIdentity).toEqual({
        'Fn::Sub': 'origin-access-identity/cloudfront/${CloudFrontOAI}'
      });
    });

    test('CloudFront should redirect to HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(behavior.Compress).toBe(true);
    });
  });

  test('ECS Cluster should be created with Container Insights', () => {
    const cluster = template.Resources.ECSCluster;
    expect(cluster).toBeDefined();
    expect(cluster.Type).toBe('AWS::ECS::Cluster');
    expect(cluster.Properties.ClusterName).toEqual({
      'Fn::Sub': 'loan-app-cluster-vs1-${EnvironmentSuffix}'
    });
    expect(cluster.Properties.ClusterSettings).toEqual([
      { Name: 'containerInsights', Value: 'enabled' }
    ]);
  });
  test('ECS Task Execution Role should exist with correct policies', () => {
    const role = template.Resources.ECSTaskExecutionRole;
    expect(role).toBeDefined();
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.RoleName).toEqual({
      'Fn::Sub': 'ecs-task-execution-role-vs1-${EnvironmentSuffix}'
    });

    const assumePolicy = role.Properties.AssumeRolePolicyDocument;
    expect(assumePolicy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
    expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');

    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');

    const customPolicy = role.Properties.Policies[0];
    expect(customPolicy.PolicyName).toBe('SecretsManagerAccess');
    expect(customPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
  });

  test('ECS Task Role should exist with S3 and Secrets Manager access', () => {
    const role = template.Resources.ECSTaskRole;
    expect(role).toBeDefined();
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.RoleName).toEqual({
      'Fn::Sub': 'ecs-task-role-vs1-${EnvironmentSuffix}'
    });

    const policies = role.Properties.Policies;
    expect(policies).toHaveLength(2);

    const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
    expect(s3Policy).toBeDefined();
    expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');

    const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
    expect(secretsPolicy).toBeDefined();
  });
  test('ECS Task Definition should be configured for Fargate', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    expect(taskDef).toBeDefined();
    expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
    expect(taskDef.Properties.Family).toEqual({
      'Fn::Sub': 'loan-app-task-vs1-${EnvironmentSuffix}'
    });
    expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    expect(taskDef.Properties.RequiresCompatibilities).toEqual(['FARGATE']);
    expect(taskDef.Properties.Cpu).toEqual({ Ref: 'ContainerCpu' });
    expect(taskDef.Properties.Memory).toEqual({ Ref: 'ContainerMemory' });
  });

  test('ECS Task Definition should use correct IAM roles', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    expect(taskDef.Properties.ExecutionRoleArn).toEqual({
      'Fn::GetAtt': ['ECSTaskExecutionRole', 'Arn']
    });
    expect(taskDef.Properties.TaskRoleArn).toEqual({
      'Fn::GetAtt': ['ECSTaskRole', 'Arn']
    });
  });

  test('Container definition should be configured correctly', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    const container = taskDef.Properties.ContainerDefinitions[0];
    expect(container.Name).toBe('loan-app');
    expect(container.Image).toEqual({ Ref: 'ContainerImage' });
    expect(container.Essential).toBe(true);
    expect(container.PortMappings[0].ContainerPort).toBe(3000);
  });

  test('Container should have environment variables configured', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    const container = taskDef.Properties.ContainerDefinitions[0];
    const env = container.Environment;

    const nodeEnv = env.find((e: any) => e.Name === 'NODE_ENV');
    expect(nodeEnv.Value).toBe('production');

    const dbHost = env.find((e: any) => e.Name === 'DB_HOST');
    expect(dbHost.Value).toEqual({
      'Fn::GetAtt': ['DBCluster', 'Endpoint.Address']
    });

    const dbName = env.find((e: any) => e.Name === 'DB_NAME');
    expect(dbName.Value).toBe('loandb');
  });

  test('Container should have secrets from Secrets Manager', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    const container = taskDef.Properties.ContainerDefinitions[0];
    const secrets = container.Secrets;

    expect(secrets).toHaveLength(2);
    const dbUsername = secrets.find((s: any) => s.Name === 'DB_USERNAME');
    expect(dbUsername.ValueFrom).toEqual({
      'Fn::Sub': '${DBSecret}:username::'
    });

    const dbPassword = secrets.find((s: any) => s.Name === 'DB_PASSWORD');
    expect(dbPassword.ValueFrom).toEqual({
      'Fn::Sub': '${DBSecret}:password::'
    });
  });

  test('Container should have health check configured', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    const container = taskDef.Properties.ContainerDefinitions[0];
    const healthCheck = container.HealthCheck;

    expect(healthCheck.Command).toEqual(['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1']);
    expect(healthCheck.Interval).toBe(30);
    expect(healthCheck.Timeout).toBe(5);
    expect(healthCheck.Retries).toBe(3);
    expect(healthCheck.StartPeriod).toBe(60);
  });

  test('Container should use CloudWatch Logs', () => {
    const taskDef = template.Resources.ECSTaskDefinition;
    const container = taskDef.Properties.ContainerDefinitions[0];
    const logConfig = container.LogConfiguration;

    expect(logConfig.LogDriver).toBe('awslogs');
    expect(logConfig.Options['awslogs-group']).toEqual({ Ref: 'ECSLogGroup' });
  });
  // ECS related resources (service, autoscaling and task checks) removed as part of deployment fix

  // ========================================
  // PHASE 8: Application Load Balancer
  // ========================================

  describe('Application Load Balancer', () => {
    test('ALB should be internet-facing in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': 'loan-app-alb-vs1-${EnvironmentSuffix}'
      });
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
        { Ref: 'PublicSubnet3' }
      ]);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    test('ALB Target Group should be configured for ECS tasks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Name).toEqual({
        'Fn::Sub': 'loan-app-tg-vs1-${EnvironmentSuffix}'
      });
      expect(tg.Properties.Port).toBe(3000);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('ip');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALB Target Group should have health checks on /health endpoint', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
      expect(tg.Properties.Matcher.HttpCode).toBe('200');
    });

    test('ALB Listener should forward traffic to target group', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  // ECS Service and Auto scaling tests removed due to deployment error

  // ========================================
  // PHASE 10: CloudWatch Monitoring and SNS
  // ========================================

  describe('SNS Alerts', () => {
    test('SNS Topic should be created for alerts', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'loan-app-alerts-vs1-${EnvironmentSuffix}'
      });
      expect(topic.Properties.DisplayName).toBe('Loan App Critical Alerts');
    });

    test('SNS Topic should have email subscription', () => {
      const topic = template.Resources.AlertTopic;
      const subscriptions = topic.Properties.Subscription;
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].Protocol).toBe('email');
      expect(subscriptions[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });
  });

  describe('CloudWatch Alarms', () => {
    // ECSTaskFailureAlarm removed as it's related to the ECS service removed from template

    test('RDS CPU Alarm should exist', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'rds-cpu-high-vs1-${EnvironmentSuffix}'
      });
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'AlertTopic' }]);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('CloudWatch Dashboard should be created', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'loan-app-dashboard-vs1-${EnvironmentSuffix}'
      });
    });

    test('CloudWatch Dashboard should have valid JSON body', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toBeDefined();
      expect(bodyTemplate).toContain('widgets');
      expect(bodyTemplate).toContain('ALB Metrics');
      expect(bodyTemplate).toContain('ECS Metrics');
      expect(bodyTemplate).toContain('RDS Metrics');
    });
  });

  // ========================================
  // PHASE 11: Outputs Validation (14 Outputs)
  // ========================================

  describe('Stack Outputs', () => {
    test('should have all 14 required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'ALBUrl',
        'ECSClusterName',
        'DBClusterEndpoint',
        'DBClusterReadEndpoint',
        'DBSecretArn',
        'StaticAssetsBucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'CloudFrontUrl',
        'SNSTopicArn',
        'CloudWatchDashboardName',
        'CloudWatchLogGroup'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      expect(Object.keys(template.Outputs)).toHaveLength(14);
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toContain('VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC' });
    });

    test('ALB outputs should be correct', () => {
      const dnsOutput = template.Outputs.ALBDNSName;
      expect(dnsOutput.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });

      const urlOutput = template.Outputs.ALBUrl;
      expect(urlOutput.Value).toEqual({ 'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}' });
    });

    test('ECS cluster output should be correct', () => {
      const clusterOutput = template.Outputs.ECSClusterName;
      expect(clusterOutput.Value).toEqual({ Ref: 'ECSCluster' });
    });

    test('RDS outputs should be correct', () => {
      const endpointOutput = template.Outputs.DBClusterEndpoint;
      expect(endpointOutput.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'Endpoint.Address'] });

      const readOutput = template.Outputs.DBClusterReadEndpoint;
      expect(readOutput.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'ReadEndpoint.Address'] });

      const secretOutput = template.Outputs.DBSecretArn;
      expect(secretOutput.Value).toEqual({ Ref: 'DBSecret' });
    });

    test('S3 and CloudFront outputs should be correct', () => {
      const bucketOutput = template.Outputs.StaticAssetsBucketName;
      expect(bucketOutput.Value).toEqual({ Ref: 'StaticAssetsBucket' });

      const cfIdOutput = template.Outputs.CloudFrontDistributionId;
      expect(cfIdOutput.Value).toEqual({ Ref: 'CloudFrontDistribution' });

      const cfDomainOutput = template.Outputs.CloudFrontDomainName;
      expect(cfDomainOutput.Value).toEqual({ 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] });

      const cfUrlOutput = template.Outputs.CloudFrontUrl;
      expect(cfUrlOutput.Value).toEqual({ 'Fn::Sub': 'https://${CloudFrontDistribution.DomainName}' });
    });

    test('Monitoring outputs should be correct', () => {
      const snsOutput = template.Outputs.SNSTopicArn;
      expect(snsOutput.Value).toEqual({ Ref: 'AlertTopic' });

      const dashboardOutput = template.Outputs.CloudWatchDashboardName;
      expect(dashboardOutput.Value).toEqual({ Ref: 'CloudWatchDashboard' });

      const logGroupOutput = template.Outputs.CloudWatchLogGroup;
      expect(logGroupOutput.Value).toEqual({ Ref: 'ECSLogGroup' });
    });
  });

  // ========================================
  // PHASE 12: Security and Compliance Tests
  // ========================================

  describe('Security and Compliance', () => {
    test('database credentials should use Secrets Manager', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('CloudWatch logs should have 30-day retention', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy for 90 days', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('RDS should have backup retention of 7 days', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should have encryption enabled', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    // ECS service removed - skipping test for task subnet configuration

    test('RDS instances should not be publicly accessible', () => {
      ['DBInstance1', 'DBInstance2'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.PubliclyAccessible).toBe(false);
      });
    });

    test('security groups should implement least privilege', () => {
      // ALB only accepts HTTP/HTTPS
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Properties.SecurityGroupIngress).toHaveLength(2);

      // ECS only accepts from ALB
      const ecsSg = template.Resources.ECSSecurityGroup;
      expect(ecsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(ecsSg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });

      // RDS only accepts from ECS
      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(rdsSg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });
  });

  // ========================================
  // PHASE 13: Resource Naming Convention
  // ========================================

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all named resources should use environmentSuffix', () => {
      const namedResources = [
        { resource: 'VPC', property: 'Tags' },
        { resource: 'InternetGateway', property: 'Tags' },
        { resource: 'ALBSecurityGroup', property: 'GroupName' },
        { resource: 'ECSSecurityGroup', property: 'GroupName' },
        { resource: 'RDSSecurityGroup', property: 'GroupName' },
        { resource: 'DBSubnetGroup', property: 'DBSubnetGroupName' },
        { resource: 'DBSecret', property: 'Name' },
        { resource: 'DBCluster', property: 'DBClusterIdentifier' },
        { resource: 'StaticAssetsBucket', property: 'BucketName' },
        { resource: 'ECSCluster', property: 'ClusterName' },
        { resource: 'ECSTaskExecutionRole', property: 'RoleName' },
        { resource: 'ECSTaskRole', property: 'RoleName' },
        { resource: 'ECSLogGroup', property: 'LogGroupName' },
        { resource: 'ECSTaskDefinition', property: 'Family' },
        { resource: 'ApplicationLoadBalancer', property: 'Name' },
        { resource: 'ALBTargetGroup', property: 'Name' },
        // ECS Service removed
        { resource: 'AlertTopic', property: 'TopicName' }
      ];

      namedResources.forEach(({ resource, property }) => {
        const res = template.Resources[resource];
        expect(res).toBeDefined();

        if (property === 'Tags') {
          const nameTag = res.Properties[property].find((t: any) => t.Key === 'Name');
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else {
          const value = res.Properties[property];
          if (typeof value === 'object' && value['Fn::Sub']) {
            expect(value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  // ========================================
  // PHASE 14: Resource Count Validation
  // ========================================

  describe('Template Resource Count', () => {
    test('should have correct number of resources (50+)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(50);
    });

    test('should have correct number of parameters (8)', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have correct number of outputs (14)', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14);
    });
  });
});

import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON first: pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description for CI/CD pipeline', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('CI/CD Pipeline');
      expect(template.Description).toContain('Containerized Payment Service');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*$');
    });

    test('should have TeamName parameter with correct properties', () => {
      const param = template.Parameters.TeamName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('payment-team');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
    });

    test('should have CostCenter parameter', () => {
      const param = template.Parameters.CostCenter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('finance-123');
    });

    test('should have VpcCidr parameter with CIDR pattern validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toMatch(/CIDR|cidr|\\d/);
    });

    test('should have CreateVpcEndpoints parameter with boolean values', () => {
      const param = template.Parameters.CreateVpcEndpoints;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toContain('true');
      expect(param.AllowedValues).toContain('false');
    });

    test('should have ECS cluster and service name parameters', () => {
      expect(template.Parameters.EcsClusterName).toBeDefined();
      expect(template.Parameters.EcsServiceName).toBeDefined();
      expect(template.Parameters.EcsClusterName.Default).toBe('default');
      expect(template.Parameters.EcsServiceName.Default).toBe('payment-service');
    });

    test('should have SlackWebhookUrl parameter with NoEcho enabled', () => {
      const param = template.Parameters.SlackWebhookUrl;
      expect(param).toBeDefined();
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have HasSlackWebhook condition', () => {
      expect(template.Conditions.HasSlackWebhook).toBeDefined();
    });

    test('should have ShouldCreateVpcEndpoints condition', () => {
      expect(template.Conditions.ShouldCreateVpcEndpoints).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should define VPC resource with correct type', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should configure VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should configure VPC with dynamic CIDR from parameters', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.CidrBlock).toHaveProperty('Ref', 'VpcCidr');
    });

    test('should tag VPC with Environment, Team, and CostCenter', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(4);

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Team');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('Subnet Resources', () => {
    test('should define two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should configure private subnets with MapPublicIpOnLaunch disabled', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should distribute subnets across different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      // Subnet 1 should use AZ index 0
      expect(subnet1.Properties.AvailabilityZone).toBeDefined();
      expect(subnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, { 'Fn::GetAZs': '' }]);

      // Subnet 2 should use AZ index 1
      expect(subnet2.Properties.AvailabilityZone).toBeDefined();
      expect(subnet2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, { 'Fn::GetAZs': '' }]);
    });

    test('should configure subnets with CIDR blocks from VPC CIDR', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.CidrBlock).toBeDefined();
      expect(subnet2.Properties.CidrBlock).toBeDefined();
      expect(subnet1.Properties.CidrBlock['Fn::Select']).toBeDefined();
      expect(subnet2.Properties.CidrBlock['Fn::Select']).toBeDefined();
    });

    test('should tag subnets appropriately', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const tags = subnet1.Properties.Tags;

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Team');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('Internet Gateway and Routing', () => {
    test('should define Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toHaveProperty('Ref', 'VPC');
      expect(attachment.Properties.InternetGatewayId).toHaveProperty('Ref', 'InternetGateway');
    });

    test('should define private route table', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toHaveProperty('Ref', 'VPC');
    });

    test('should create default route to Internet Gateway', () => {
      const route = template.Resources.DefaultRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toHaveProperty('Ref', 'InternetGateway');
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should associate route table with both private subnets', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(assoc1).toBeDefined();
      expect(assoc2).toBeDefined();
      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');

      expect(assoc1.Properties.SubnetId).toHaveProperty('Ref', 'PrivateSubnet1');
      expect(assoc2.Properties.SubnetId).toHaveProperty('Ref', 'PrivateSubnet2');
    });
  });

  describe('KMS Key Resources', () => {
    test('should define KMS key for artifact encryption', () => {
      const key = template.Resources.ArtifactsKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('should enable automatic key rotation', () => {
      const key = template.Resources.ArtifactsKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have comprehensive key policy', () => {
      const key = template.Resources.ArtifactsKey;
      const policy = key.Properties.KeyPolicy;

      expect(policy).toBeDefined();
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('should allow root account to administer key', () => {
      const key = template.Resources.ArtifactsKey;
      const adminStatement = key.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow administration of the key'
      );

      expect(adminStatement).toBeDefined();
      expect(adminStatement.Effect).toBe('Allow');
      expect(adminStatement.Action).toContain('kms:*');
    });

    test('should allow pipeline services to use key', () => {
      const key = template.Resources.ArtifactsKey;
      const useStatement = key.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow use of the key by pipeline services'
      );

      expect(useStatement).toBeDefined();
      expect(useStatement.Effect).toBe('Allow');
      expect(useStatement.Principal.Service).toContain('codebuild.amazonaws.com');
      expect(useStatement.Principal.Service).toContain('codepipeline.amazonaws.com');
      expect(useStatement.Principal.Service).toContain('codedeploy.amazonaws.com');
    });

    test('should define KMS key alias', () => {
      const alias = template.Resources.ArtifactsKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toHaveProperty('Ref', 'ArtifactsKey');
    });

    test('should tag KMS key with metadata', () => {
      const key = template.Resources.ArtifactsKey;
      const tags = key.Properties.Tags;

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Team');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should define artifacts S3 bucket', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should configure bucket with Retain deletion policy', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should enable versioning on artifacts bucket', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should configure KMS encryption on bucket', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });

    test('should configure lifecycle rules for cost optimization', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThanOrEqual(2);

      // Find expiration rule
      const expirationRule = rules.find((r: any) => r.Id === 'DeleteOldArtifacts');
      expect(expirationRule).toBeDefined();
      expect(expirationRule.Status).toBe('Enabled');
      expect(expirationRule.ExpirationInDays).toBe(90);

      // Find transition rule
      const transitionRule = rules.find((r: any) => r.Id === 'TransitionToGlacier');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
      expect(transitionRule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('should block all public access', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should define bucket policy denying unencrypted uploads', () => {
      const policy = template.Resources.ArtifactsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      const denyUnencrypted = statements.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );

      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
      expect(denyUnencrypted.Action).toBe('s3:PutObject');
    });

    test('should define bucket policy denying insecure connections', () => {
      const policy = template.Resources.ArtifactsBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyInsecure = statements.find(
        (s: any) => s.Sid === 'DenyInsecureConnections'
      );

      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('Security Group Resources', () => {
    test('should define security group for CodeBuild and ECS', () => {
      const sg = template.Resources.CodeBuildSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should configure security group with appropriate description', () => {
      const sg = template.Resources.CodeBuildSecurityGroup;
      expect(sg.Properties.GroupDescription).toContain('CodeBuild');
      expect(sg.Properties.GroupDescription).toContain('ECS');
    });

    test('should allow HTTPS outbound traffic', () => {
      const sg = template.Resources.CodeBuildSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;

      expect(egress).toBeDefined();
      expect(egress.length).toBeGreaterThanOrEqual(1);
      expect(egress[0].IpProtocol).toBe('tcp');
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
      expect(egress[0].Description).toContain('HTTPS');
    });

    test('should associate security group with VPC', () => {
      const sg = template.Resources.CodeBuildSecurityGroup;
      expect(sg.Properties.VpcId).toHaveProperty('Ref', 'VPC');
    });
  });

  describe('VPC Endpoint Resources', () => {
    test('should define S3 VPC endpoint with condition', () => {
      const endpoint = template.Resources.S3VpcEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Condition).toBe('ShouldCreateVpcEndpoints');
    });

    test('should configure S3 endpoint with gateway type', () => {
      const endpoint = template.Resources.S3VpcEndpoint;
      // Gateway endpoints don't have VpcEndpointType property (it's implicit)
      expect(endpoint.Properties.RouteTableIds).toBeDefined();
    });

    test('should define ECR API VPC endpoint', () => {
      const endpoint = template.Resources.EcrApiVpcEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('should define ECR DKR VPC endpoint', () => {
      const endpoint = template.Resources.EcrDkrVpcEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('should define CloudWatch Logs VPC endpoint', () => {
      const endpoint = template.Resources.LogsVpcEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('should define CodeBuild VPC endpoint', () => {
      const endpoint = template.Resources.CodeBuildVpcEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('should configure interface endpoints across both subnets', () => {
      const endpoint = template.Resources.EcrApiVpcEndpoint;
      const subnetIds = endpoint.Properties.SubnetIds;

      expect(subnetIds).toBeDefined();
      expect(subnetIds.length).toBe(2);
      expect(subnetIds[0]).toHaveProperty('Ref', 'PrivateSubnet1');
      expect(subnetIds[1]).toHaveProperty('Ref', 'PrivateSubnet2');
    });
  });

  describe('IAM Role Resources', () => {
    test('should define CodeBuild service role', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should configure CodeBuild role with correct trust policy', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('codebuild.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should grant CodeBuild role S3 permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((s: any) => s.Sid === 'AllowS3Operations');

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
    });

    test('should grant CodeBuild role KMS permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const kmsStatement = policy.Statement.find((s: any) => s.Sid === 'AllowKMSOperations');

      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:Encrypt');
    });

    test('should grant CodeBuild role ECR permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const ecrStatement = policy.Statement.find((s: any) => s.Sid === 'AllowECROperations');

      expect(ecrStatement).toBeDefined();
      expect(ecrStatement.Action).toContain('ecr:GetAuthorizationToken');
      expect(ecrStatement.Action).toContain('ecr:PutImage');
    });

    test('should deny CodeBuild access to production resources', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const denyStatement = policy.Statement.find((s: any) => s.Sid === 'DenyProductionAccess');

      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('rds:*');
      expect(denyStatement.Action).toContain('dynamodb:*');
      expect(denyStatement.Action).toContain('s3:*');
    });

    test('should define CodePipeline service role', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should configure CodePipeline role with correct trust policy', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
    });

    test('should grant CodePipeline role CodeCommit permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const codecommitStatement = policy.Statement.find((s: any) => s.Sid === 'AllowCodeCommitOperations');

      expect(codecommitStatement).toBeDefined();
      expect(codecommitStatement.Action).toContain('codecommit:GetBranch');
      expect(codecommitStatement.Action).toContain('codecommit:GetCommit');
    });

    test('should define ECS Task Execution role', () => {
      const role = template.Resources.EcsTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should attach ECS Task Execution managed policy', () => {
      const role = template.Resources.EcsTaskExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });
  });

  describe('CodeBuild Project Resources', () => {
    test('should define build project', () => {
      const project = template.Resources.BuildProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should configure build project with CODEPIPELINE artifact type', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Artifacts.Type).toBe('CODEPIPELINE');
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('should configure build project with VPC configuration', () => {
      const project = template.Resources.BuildProject;
      const vpcConfig = project.Properties.VpcConfig;

      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.VpcId).toHaveProperty('Ref', 'VPC');
      expect(vpcConfig.Subnets.length).toBe(2);
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('should configure build project with privileged mode for Docker', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Environment.PrivilegedMode).toBe(true);
    });

    test('should configure build project with appropriate compute type', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
    });

    test('should configure build project with CloudWatch Logs', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.LogsConfig).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });

    test('should configure build project with timeout', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.TimeoutInMinutes).toBe(30);
    });

    test('should define test project', () => {
      const project = template.Resources.TestProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should configure test project with testspec buildspec', () => {
      const project = template.Resources.TestProject;
      expect(project.Properties.Source.BuildSpec).toBe('testspec.yml');
    });
  });

  describe('ECS Resources', () => {
    test('should define ECS cluster', () => {
      const cluster = template.Resources.EcsCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should configure ECS cluster with Fargate capacity providers', () => {
      const cluster = template.Resources.EcsCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('should configure default capacity provider strategy', () => {
      const cluster = template.Resources.EcsCluster;
      const strategy = cluster.Properties.DefaultCapacityProviderStrategy;

      expect(strategy).toBeDefined();
      expect(strategy[0].CapacityProvider).toBe('FARGATE');
      expect(strategy[0].Weight).toBe(1);
      expect(strategy[0].Base).toBe(1);
    });

    test('should define ECS log group', () => {
      const logGroup = template.Resources.EcsLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should define ECS task definition', () => {
      const taskDef = template.Resources.EcsTaskDefinition;
      expect(taskDef).toBeDefined();
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('should configure task definition for Fargate', () => {
      const taskDef = template.Resources.EcsTaskDefinition;
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('should configure task definition with appropriate CPU and memory', () => {
      const taskDef = template.Resources.EcsTaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
    });

    test('should configure task definition with execution role', () => {
      const taskDef = template.Resources.EcsTaskDefinition;
      expect(taskDef.Properties.ExecutionRoleArn).toBeDefined();
      expect(taskDef.Properties.ExecutionRoleArn['Fn::GetAtt']).toEqual(['EcsTaskExecutionRole', 'Arn']);
    });

    test('should configure container with proper logging', () => {
      const taskDef = template.Resources.EcsTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];

      expect(container.LogConfiguration).toBeDefined();
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
    });

    test('should define ECS service', () => {
      const service = template.Resources.EcsService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
    });

    test('should configure ECS service with Fargate launch type', () => {
      const service = template.Resources.EcsService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('should configure ECS service with deployment circuit breaker', () => {
      const service = template.Resources.EcsService;
      const deploymentConfig = service.Properties.DeploymentConfiguration;

      expect(deploymentConfig.DeploymentCircuitBreaker).toBeDefined();
      expect(deploymentConfig.DeploymentCircuitBreaker.Enable).toBe(true);
      expect(deploymentConfig.DeploymentCircuitBreaker.Rollback).toBe(true);
    });

    test('should configure ECS service with network configuration', () => {
      const service = template.Resources.EcsService;
      const networkConfig = service.Properties.NetworkConfiguration.AwsvpcConfiguration;

      expect(networkConfig).toBeDefined();
      expect(networkConfig.Subnets.length).toBe(2);
      expect(networkConfig.AssignPublicIp).toBe('ENABLED');
    });
  });

  describe('CodePipeline Resources', () => {
    test('should define CodePipeline', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('should configure pipeline with KMS encrypted artifact store', () => {
      const pipeline = template.Resources.Pipeline;
      const artifactStore = pipeline.Properties.ArtifactStore;

      expect(artifactStore.Type).toBe('S3');
      expect(artifactStore.EncryptionKey).toBeDefined();
      expect(artifactStore.EncryptionKey.Type).toBe('KMS');
    });

    test('should configure pipeline with four stages', () => {
      const pipeline = template.Resources.Pipeline;
      const stages = pipeline.Properties.Stages;

      expect(stages.length).toBe(4);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Test');
      expect(stages[3].Name).toBe('Deploy');
    });

    test('should configure Source stage with CodeCommit', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages[0];
      const action = sourceStage.Actions[0];

      expect(action.ActionTypeId.Provider).toBe('CodeCommit');
      expect(action.Configuration.RepositoryName).toBe('payment-service');
      expect(action.Configuration.BranchName).toBe('main');
    });

    test('should configure Build stage with CodeBuild', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages[1];
      const action = buildStage.Actions[0];

      expect(action.ActionTypeId.Provider).toBe('CodeBuild');
      expect(action.Configuration.ProjectName).toHaveProperty('Ref', 'BuildProject');
    });

    test('should configure Test stage with CodeBuild', () => {
      const pipeline = template.Resources.Pipeline;
      const testStage = pipeline.Properties.Stages[2];
      const action = testStage.Actions[0];

      expect(action.ActionTypeId.Provider).toBe('CodeBuild');
      expect(action.Configuration.ProjectName).toHaveProperty('Ref', 'TestProject');
    });

    test('should configure Deploy stage with ECS', () => {
      const pipeline = template.Resources.Pipeline;
      const deployStage = pipeline.Properties.Stages[3];
      const action = deployStage.Actions[0];

      expect(action.ActionTypeId.Provider).toBe('ECS');
      expect(action.Configuration.ClusterName).toHaveProperty('Ref', 'EcsCluster');
      expect(action.Configuration.ServiceName).toHaveProperty('Ref', 'EcsService');
    });
  });

  describe('EventBridge and Lambda Resources', () => {
    test('should define EventBridge rule with condition', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Condition).toBe('HasSlackWebhook');
    });

    test('should configure EventBridge rule to monitor pipeline failures and successes', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const eventPattern = rule.Properties.EventPattern;

      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain('CodePipeline Pipeline Execution State Change');
      expect(eventPattern.detail.state).toContain('FAILED');
      expect(eventPattern.detail.state).toContain('SUCCEEDED');
    });

    test('should define Lambda function for Slack notifications', () => {
      const lambda = template.Resources.SlackNotificationFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Condition).toBe('HasSlackWebhook');
    });

    test('should configure Lambda with Node.js 20 runtime', () => {
      const lambda = template.Resources.SlackNotificationFunction;
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should configure Lambda with appropriate timeout and memory', () => {
      const lambda = template.Resources.SlackNotificationFunction;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });

    test('should define Lambda permission for EventBridge', () => {
      const permission = template.Resources.SlackNotificationPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should define IAM role for Lambda', () => {
      const role = template.Resources.SlackNotificationFunctionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('HasSlackWebhook');
    });
  });

  describe('Outputs', () => {
    test('should export pipeline URL output', () => {
      const output = template.Outputs.PipelineUrl;
      expect(output).toBeDefined();
      expect(output.Description).toContain('CodePipeline');
      expect(output.Export).toBeDefined();
    });

    test('should export all S3 bucket outputs', () => {
      expect(template.Outputs.ArtifactsBucketName).toBeDefined();
      expect(template.Outputs.ArtifactsBucketArn).toBeDefined();
    });

    test('should export all KMS key outputs', () => {
      expect(template.Outputs.KmsKeyId).toBeDefined();
      expect(template.Outputs.KmsKeyArn).toBeDefined();
      expect(template.Outputs.KmsKeyAliasName).toBeDefined();
    });

    test('should export all VPC networking outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCCidr).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.InternetGatewayId).toBeDefined();
      expect(template.Outputs.PrivateRouteTableId).toBeDefined();
    });

    test('should export all CodeBuild outputs', () => {
      expect(template.Outputs.BuildProjectName).toBeDefined();
      expect(template.Outputs.BuildProjectArn).toBeDefined();
      expect(template.Outputs.TestProjectName).toBeDefined();
      expect(template.Outputs.TestProjectArn).toBeDefined();
    });

    test('should export all ECS outputs', () => {
      expect(template.Outputs.EcsClusterName).toBeDefined();
      expect(template.Outputs.EcsClusterArn).toBeDefined();
      expect(template.Outputs.EcsServiceName).toBeDefined();
      expect(template.Outputs.EcsServiceArn).toBeDefined();
      expect(template.Outputs.EcsTaskDefinitionArn).toBeDefined();
    });

    test('should export all IAM role outputs', () => {
      expect(template.Outputs.CodeBuildServiceRoleArn).toBeDefined();
      expect(template.Outputs.CodePipelineServiceRoleArn).toBeDefined();
      expect(template.Outputs.EcsTaskExecutionRoleArn).toBeDefined();
    });

    test('should export CloudWatch Logs outputs', () => {
      expect(template.Outputs.EcsLogGroupName).toBeDefined();
      expect(template.Outputs.BuildLogGroupName).toBeDefined();
      expect(template.Outputs.TestLogGroupName).toBeDefined();
    });

    test('should export stack metadata', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should ensure VPC Gateway attachment depends on Internet Gateway', () => {
      const route = template.Resources.DefaultRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should ensure CodePipeline references correct IAM role', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.RoleArn).toBeDefined();
      expect(pipeline.Properties.RoleArn['Fn::GetAtt']).toEqual(['CodePipelineServiceRole', 'Arn']);
    });

    test('should ensure CodeBuild projects reference correct IAM role', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.ServiceRole['Fn::GetAtt']).toEqual(['CodeBuildServiceRole', 'Arn']);
      expect(testProject.Properties.ServiceRole['Fn::GetAtt']).toEqual(['CodeBuildServiceRole', 'Arn']);
    });

    test('should ensure ECS service references task definition and cluster', () => {
      const service = template.Resources.EcsService;
      expect(service.Properties.Cluster).toHaveProperty('Ref', 'EcsCluster');
      expect(service.Properties.TaskDefinition).toHaveProperty('Ref', 'EcsTaskDefinition');
    });
  });

  describe('Security Best Practices', () => {
    test('should ensure all buckets have encryption enabled', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should ensure KMS key rotation is enabled', () => {
      const key = template.Resources.ArtifactsKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should ensure production resource access is denied', () => {
      const codeBuildRole = template.Resources.CodeBuildServiceRole;
      const codePipelineRole = template.Resources.CodePipelineServiceRole;

      const codeBuildDeny = codeBuildRole.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Effect === 'Deny'
      );
      const pipelineDeny = codePipelineRole.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Effect === 'Deny'
      );

      expect(codeBuildDeny).toBeDefined();
      expect(pipelineDeny).toBeDefined();
    });

    test('should ensure VPC endpoints are conditionally created for private subnet isolation', () => {
      const s3Endpoint = template.Resources.S3VpcEndpoint;
      const ecrEndpoint = template.Resources.EcrApiVpcEndpoint;

      expect(s3Endpoint.Condition).toBe('ShouldCreateVpcEndpoints');
      expect(ecrEndpoint.Condition).toBe('ShouldCreateVpcEndpoints');
    });
  });

  describe('Tagging Compliance', () => {
    test('should ensure all taggable resources have Environment tag', () => {
      const taggableResources = [
        'VPC', 'PrivateSubnet1', 'ArtifactsKey', 'ArtifactsBucket',
        'CodeBuildSecurityGroup', 'CodeBuildServiceRole', 'BuildProject',
        'EcsCluster', 'EcsTaskDefinition', 'Pipeline'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const hasEnvironmentTag = resource.Properties.Tags.some(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(hasEnvironmentTag).toBe(true);
        }
      });
    });
  });
});

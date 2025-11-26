import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Secure SaaS Application Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with parameterized CIDR block', () => {
      const vpc = template.Resources['xyzAppVPCMain'];
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support and hostnames enabled', () => {
      const vpc = template.Resources['xyzAppVPCMain'];
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway', () => {
      const igw = template.Resources['xyzAppIGWMain'];
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.xyzAppVPCGatewayAttachment;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'xyzAppIGWMain' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetPublic1'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetPublic2'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnets in VPC', () => {
      const subnet1 = template.Resources['xyzAppSubnetPublic1'];
      const subnet2 = template.Resources['xyzAppSubnetPublic2'];
      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetPrivate1'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetPrivate2'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnets in VPC', () => {
      const subnet1 = template.Resources['xyzAppSubnetPrivate1'];
      const subnet2 = template.Resources['xyzAppSubnetPrivate2'];
      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
    });
  });

  describe('Database Subnet Configuration', () => {
    test('should create database subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetDatabase1'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'DatabaseSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create database subnet 2 with dynamic AZ selection', () => {
      const subnet = template.Resources['xyzAppSubnetDatabase2'];
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'DatabaseSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create database subnets in VPC', () => {
      const subnet1 = template.Resources['xyzAppSubnetDatabase1'];
      const subnet2 = template.Resources['xyzAppSubnetDatabase2'];
      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway 1 EIP with vpc domain', () => {
      const eip = template.Resources['xyzAppEIPNAT1'];
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('xyzAppVPCGatewayAttachment');
    });

    test('should create NAT Gateway 2 EIP with vpc domain', () => {
      const eip = template.Resources['xyzAppEIPNAT2'];
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('xyzAppVPCGatewayAttachment');
    });

    test('should create NAT Gateway 1 in public subnet 1', () => {
      const natGateway = template.Resources['xyzAppNATGateway1'];
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'xyzAppSubnetPublic1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['xyzAppEIPNAT1', 'AllocationId']
      });
    });

    test('should create NAT Gateway 2 in public subnet 2', () => {
      const natGateway = template.Resources['xyzAppNATGateway2'];
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'xyzAppSubnetPublic2' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['xyzAppEIPNAT2', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources['xyzAppRouteTablePublic'];
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
    });

    test('should create public route to internet gateway', () => {
      const route = template.Resources['xyzAppRoutePublicInternet'];
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'xyzAppIGWMain' });
      expect(route.DependsOn).toBe('xyzAppVPCGatewayAttachment');
    });

    test('should associate public subnets with public route table', () => {
      const assoc1 = template.Resources['xyzAppSubnetRouteTableAssocPublic1'];
      const assoc2 = template.Resources['xyzAppSubnetRouteTableAssocPublic2'];

      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'xyzAppSubnetPublic1' });

      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'xyzAppSubnetPublic2' });
    });

    test('should create private route tables with NAT gateway routes', () => {
      const route1 = template.Resources['xyzAppRoutePrivate1NAT'];
      const route2 = template.Resources['xyzAppRoutePrivate2NAT'];

      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'xyzAppNATGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'xyzAppNATGateway2' });
    });

    test('should create database route table without internet access', () => {
      const routeTable = template.Resources['xyzAppRouteTableDatabase'];
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'xyzAppVPCMain' });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create EC2 security group with HTTP and HTTPS access', () => {
      const sg = template.Resources['xyzAppSGEC2'];
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = sg.Properties.SecurityGroupIngress[1];
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should create Lambda security group with outbound access only', () => {
      const sg = template.Resources['xyzAppSGLambda'];
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with automatic rotation enabled', () => {
      const kmsKey = template.Resources['xyzAppKMSKeyMain'];
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key with correct IAM permissions', () => {
      const kmsKey = template.Resources['xyzAppKMSKeyMain'];
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);
    });

    test('should create KMS key with service permissions', () => {
      const kmsKey = template.Resources['xyzAppKMSKeyMain'];
      const serviceStatement = kmsKey.Properties.KeyPolicy.Statement[1];

      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('should create KMS key alias', () => {
      const alias = template.Resources['xyzAppKMSKeyAliasMain'];
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/xyzApp-main-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'xyzAppKMSKeyMain' });
    });
  });

  describe('S3 Data Bucket Configuration', () => {
    test('should create S3 data bucket with KMS encryption', () => {
      const bucket = template.Resources['xyzAppS3BucketData'];
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['xyzAppKMSKeyMain', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should create S3 data bucket with DeletionPolicy set to Retain', () => {
      const bucket = template.Resources['xyzAppS3BucketData'];
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 data bucket with public access blocked', () => {
      const bucket = template.Resources['xyzAppS3BucketData'];
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 data bucket with versioning enabled', () => {
      const bucket = template.Resources['xyzAppS3BucketData'];
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 data bucket with logging to logs bucket', () => {
      const bucket = template.Resources['xyzAppS3BucketData'];
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'xyzAppS3BucketLogs'
      });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('access-logs/');
    });

    test('should create S3 data bucket policy denying insecure transport', () => {
      const policy = template.Resources['xyzAppS3BucketPolicyData'];
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('S3 Logs Bucket Configuration', () => {
    test('should create S3 logs bucket with AES256 encryption', () => {
      const bucket = template.Resources['xyzAppS3BucketLogs'];
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 logs bucket with DeletionPolicy set to Retain', () => {
      const bucket = template.Resources['xyzAppS3BucketLogs'];
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 logs bucket with 90-day lifecycle policy', () => {
      const bucket = template.Resources['xyzAppS3BucketLogs'];
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(90);
    });

    test('should create S3 logs bucket with versioning enabled', () => {
      const bucket = template.Resources['xyzAppS3BucketLogs'];
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Lambda IAM Role Configuration', () => {
    test('should create Lambda execution role with correct service principal', () => {
      const role = template.Resources['xyzAppIAMRoleLambdaExecution'];
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create Lambda execution role with VPC access policy', () => {
      const role = template.Resources['xyzAppIAMRoleLambdaExecution'];
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should create Lambda execution role with CloudWatch Logs policy', () => {
      const role = template.Resources['xyzAppIAMRoleLambdaExecution'];
      const logsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'xyzApp-Policy-LambdaCloudWatchLogs'
      );

      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should create Lambda execution role with S3 read-only policy', () => {
      const role = template.Resources['xyzAppIAMRoleLambdaExecution'];
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'xyzApp-Policy-LambdaS3ReadOnly'
      );

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('should create Lambda execution role with KMS decrypt policy', () => {
      const role = template.Resources['xyzAppIAMRoleLambdaExecution'];
      const kmsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'xyzApp-Policy-LambdaKMSDecrypt'
      );

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with Python 3.11 runtime', () => {
      const lambda = template.Resources['xyzAppLambdaProcessData'];
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should create Lambda function with execution role', () => {
      const lambda = template.Resources['xyzAppLambdaProcessData'];
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['xyzAppIAMRoleLambdaExecution', 'Arn']
      });
    });

    test('should create Lambda function with 256 MB memory and 30 second timeout', () => {
      const lambda = template.Resources['xyzAppLambdaProcessData'];
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should create Lambda function in VPC with private subnets', () => {
      const lambda = template.Resources['xyzAppLambdaProcessData'];
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds[0]).toEqual({ Ref: 'xyzAppSGLambda' });
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SubnetIds[0]).toEqual({ Ref: 'xyzAppSubnetPrivate1' });
      expect(lambda.Properties.VpcConfig.SubnetIds[1]).toEqual({ Ref: 'xyzAppSubnetPrivate2' });
    });

    test('should create Lambda function with environment variables', () => {
      const lambda = template.Resources['xyzAppLambdaProcessData'];
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBe('Production');
      expect(lambda.Properties.Environment.Variables.S3_BUCKET).toEqual({
        Ref: 'xyzAppS3BucketData'
      });
    });

    test('should create Lambda log group with 30-day retention', () => {
      const logGroup = template.Resources.xyzAppLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.LogGroupName).toBe('/aws/lambda/xyzApp-Lambda-ProcessData');
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway REST API with REGIONAL endpoint', () => {
      const api = template.Resources['xyzAppAPIGatewayRestAPI'];
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should create API Gateway Account with CloudWatch role', () => {
      const account = template.Resources.xyzAppAPIGatewayAccount;
      expect(account.Type).toBe('AWS::ApiGateway::Account');
      expect(account.Properties.CloudWatchRoleArn).toEqual({
        'Fn::GetAtt': ['xyzAppIAMRoleAPIGateway', 'Arn']
      });
    });

    test('should create API Gateway request validator', () => {
      const validator = template.Resources.xyzAppAPIGatewayRequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
    });

    test('should create API Gateway resource with data path', () => {
      const resource = template.Resources['xyzAppAPIGatewayResourceData'];
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('data');
    });

    test('should create API Gateway GET method with Lambda integration', () => {
      const method = template.Resources['xyzAppAPIGatewayMethodGetData'];
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should create Lambda invoke permission for API Gateway', () => {
      const permission = template.Resources['xyzAppLambdaPermissionAPIGateway'];
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should create API Gateway prod stage with logging enabled', () => {
      const stage = template.Resources.xyzAppAPIGatewayStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });

    test('should create API Gateway log group with 30-day retention', () => {
      const logGroup = template.Resources.xyzAppAPIGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('API Gateway Usage Plan Configuration', () => {
    test('should create API Gateway usage plan with throttling and quotas', () => {
      const usagePlan = template.Resources.xyzAppAPIGatewayUsagePlan;
      expect(usagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      expect(usagePlan.Properties.Throttle.RateLimit).toBe(100);
      expect(usagePlan.Properties.Throttle.BurstLimit).toBe(500);
      expect(usagePlan.Properties.Quota.Limit).toBe(10000);
      expect(usagePlan.Properties.Quota.Period).toBe('DAY');
    });

    test('should create API Gateway usage plan associated with prod stage', () => {
      const usagePlan = template.Resources.xyzAppAPIGatewayUsagePlan;
      expect(usagePlan.Properties.ApiStages[0].ApiId).toEqual({
        Ref: 'xyzAppAPIGatewayRestAPI'
      });
      expect(usagePlan.Properties.ApiStages[0].Stage).toBe('prod');
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    test('should create CloudFront distribution with API Gateway origin', () => {
      const distribution = template.Resources.xyzAppCloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');

      const origin = distribution.Properties.DistributionConfig.Origins[0];
      expect(origin.DomainName).toEqual({
        'Fn::Sub': '${xyzAppAPIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com'
      });
      expect(origin.OriginPath).toBe('/prod');
      expect(origin.CustomOriginConfig.OriginProtocolPolicy).toBe('https-only');
    });

    test('should create CloudFront distribution with HTTPS redirect policy', () => {
      const distribution = template.Resources.xyzAppCloudFrontDistribution;
      const cacheBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(cacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should create CloudFront distribution with logging to S3', () => {
      const distribution = template.Resources.xyzAppCloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Logging.Bucket).toEqual({
        'Fn::GetAtt': ['xyzAppS3BucketLogs', 'DomainName']
      });
      expect(distribution.Properties.DistributionConfig.Logging.Prefix).toBe('cloudfront/');
    });

    test('should create CloudFront distribution with PriceClass_100', () => {
      const distribution = template.Resources.xyzAppCloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.PriceClass).toBe('PriceClass_100');
    });
  });

  describe('ECS Fargate Configuration', () => {
    test('should create ECS cluster with Fargate capacity providers', () => {
      const cluster = template.Resources.xyzAppECSCluster;
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('should create ECS cluster with Container Insights enabled', () => {
      const cluster = template.Resources.xyzAppECSCluster;
      expect(cluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should create ECS task execution role with correct service principal', () => {
      const role = template.Resources['xyzAppIAMRoleECSTaskExecution'];
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
    });

    test('should create ECS task execution role with ECS managed policy', () => {
      const role = template.Resources['xyzAppIAMRoleECSTaskExecution'];
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    test('should create ECS task definition with Fargate compatibility', () => {
      const taskDef = template.Resources.xyzAppECSTaskDefinition;
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('should create ECS task definition with 256 CPU and 512 memory', () => {
      const taskDef = template.Resources.xyzAppECSTaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
    });

    test('should create ECS task definition with nginx container', () => {
      const taskDef = template.Resources.xyzAppECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];

      expect(container.Name).toBe('xyzApp-Container-Main');
      expect(container.Image).toBe('nginx:latest');
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
    });

    test('should create ECS service with desired count of 2', () => {
      const service = template.Resources.xyzAppECSService;
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.DesiredCount).toBe(2);
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('should create ECS service in private subnets without public IP', () => {
      const service = template.Resources.xyzAppECSService;
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toHaveLength(2);
    });

    test('should create ECS log group with 30-day retention', () => {
      const logGroup = template.Resources.xyzAppECSLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log role with correct service principal', () => {
      const role = template.Resources.xyzAppVPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('should create VPC Flow Log role with CloudWatch Logs permissions', () => {
      const role = template.Resources.xyzAppVPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('xyzApp-Policy-CloudWatchLog');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should create VPC Flow Log Group with 30-day retention', () => {
      const logGroup = template.Resources.xyzAppVPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create VPC Flow Log with ALL traffic type', () => {
      const flowLog = template.Resources.xyzAppVPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail S3 bucket with AES256 encryption', () => {
      const bucket = template.Resources.xyzAppCloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create CloudTrail S3 bucket with DeletionPolicy set to Retain', () => {
      const bucket = template.Resources.xyzAppCloudTrailBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create CloudTrail S3 bucket with 365-day lifecycle policy', () => {
      const bucket = template.Resources.xyzAppCloudTrailBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(365);
    });

    test('should create CloudTrail bucket policy allowing CloudTrail service', () => {
      const policy = template.Resources.xyzAppCloudTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheckStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclCheckStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclCheckStatement.Action).toBe('s3:GetBucketAcl');
    });

    test('should create CloudTrail with multi-region trail enabled', () => {
      const trail = template.Resources.xyzAppCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('should create CloudTrail with management events configured', () => {
      const trail = template.Resources.xyzAppCloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];

      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create Lambda duration alarm with correct threshold', () => {
      const alarm = template.Resources.xyzAppLambdaCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(25000);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should create Lambda error alarm with correct threshold', () => {
      const alarm = template.Resources.xyzAppLambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(5);
    });

    test('should create API Gateway 4XX error alarm', () => {
      const alarm = template.Resources.xyzAppAPIGateway4XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('should create API Gateway 5XX error alarm', () => {
      const alarm = template.Resources.xyzAppAPIGateway5XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Threshold).toBe(5);
    });
  });

  describe('EC2 IAM Role Configuration', () => {
    test('should create EC2 IAM role with SSM managed policy', () => {
      const role = template.Resources.xyzAppIAMRoleEC2;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should create EC2 IAM role with S3 logs read permissions', () => {
      const role = template.Resources.xyzAppIAMRoleEC2;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'xyzApp-Policy-EC2Minimal');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });
  });

  describe('EC2 Launch Template Configuration', () => {
    test('should create EC2 launch template with parameterized instance type', () => {
      const launchTemplate = template.Resources.xyzAppEC2LaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({
        Ref: 'InstanceType'
      });
    });

    test('should create EC2 launch template with placeholder AMI ID', () => {
      const launchTemplate = template.Resources.xyzAppEC2LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBe('ami-12345678');
    });

    test('should create EC2 launch template with IMDSv2 required', () => {
      const launchTemplate = template.Resources.xyzAppEC2LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
    });

    test('should create EC2 launch template with encrypted EBS volume', () => {
      const launchTemplate = template.Resources.xyzAppEC2LaunchTemplate;
      const blockDevice = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];

      expect(blockDevice.DeviceName).toBe('/dev/xvda');
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.VolumeSize).toBe(20);
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });
  });
});

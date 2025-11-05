import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Serverless Security Configuration', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with parameterized CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway with correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet with dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create public subnet with MapPublicIpOnLaunch enabled', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet in VPC', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet with dynamic AZ selection', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create private subnet with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet in VPC', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway EIP with vpc domain and gateway dependency', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway in public subnet with EIP allocation', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to internet gateway with 0.0.0.0/0', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should associate public subnet with public route table', () => {
      const association = template.Resources.PublicSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should create private route table in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route to NAT gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });

    test('should associate private subnet with private route table', () => {
      const association = template.Resources.PrivateSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('should create EC2 security group in VPC', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create EC2 security group with SSH access from parameterized CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
      expect(sshRule.Description).toBe('SSH access from specific IP address');
    });

    test('should create EC2 security group with all outbound traffic allowed', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('Lambda Security Group Configuration', () => {
    test('should create Lambda security group in VPC', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create Lambda security group with all outbound traffic allowed', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with automatic rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key with IAM root permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);

      const rootStatement = keyPolicy.Statement[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test('should create KMS key with service permissions for S3, Lambda, and Logs', () => {
      const kmsKey = template.Resources.KMSKey;
      const serviceStatement = kmsKey.Properties.KeyPolicy.Statement[1];

      expect(serviceStatement.Sid).toBe('Allow services to use the key');
      expect(serviceStatement.Effect).toBe('Allow');
      expect(serviceStatement.Principal.Service).toHaveLength(3);
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('should create KMS key alias with environment suffix', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/serverless-security-${EnvironmentSuffix}'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with KMS encryption using customer-managed key', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should create S3 bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 bucket with public access completely blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with logging configuration to separate logging bucket', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'S3LoggingBucket'
      });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('access-logs/');
    });

    test('should create S3 bucket policy denying insecure transport', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'S3Bucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:*');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('S3 Logging Bucket Configuration', () => {
    test('should create separate S3 logging bucket', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should create S3 logging bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 logging bucket with AES256 encryption', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 logging bucket with 90-day lifecycle policy', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(90);
    });

    test('should create S3 logging bucket with public access completely blocked', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda IAM Role Configuration', () => {
    test('should create Lambda execution role with correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create Lambda execution role with VPC access managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(1);
      expect(role.Properties.ManagedPolicyArns[0]).toBe(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should create Lambda execution role with CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaCloudWatchLogsPolicy');

      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toHaveLength(3);
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(logsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      });
    });

    test('should create Lambda execution role with S3 read-only policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaS3ReadOnlyPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('should create Lambda execution role with KMS decrypt policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaKMSDecryptPolicy');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with parameterized runtime and handler', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should create Lambda function with execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should create Lambda function with parameterized memory size and 30 second timeout', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should create Lambda function in VPC with private subnet and Lambda security group', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds[0]).toEqual({
        Ref: 'LambdaSecurityGroup'
      });
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet' });
    });

    test('should create Lambda function with environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(lambda.Properties.Environment.Variables.S3_BUCKET).toEqual({ Ref: 'S3Bucket' });
    });

    test('should create Lambda function with inline Python code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join'][0]).toBe('\n');

      const codeLines = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      expect(codeLines).toContain('import json');
      expect(codeLines).toContain('def lambda_handler(event, context):');
    });
  });

  describe('Lambda Log Group Configuration', () => {
    test('should create Lambda log group with 30-day retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create Lambda log group with correct name pattern', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/ServerlessAppFunction-${EnvironmentSuffix}'
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway REST API with REGIONAL endpoint', () => {
      const api = template.Resources.APIGatewayRestAPI;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toHaveLength(1);
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('should create API Gateway REST API with resource policy', () => {
      const api = template.Resources.APIGatewayRestAPI;
      expect(api.Properties.Policy).toBeDefined();
      expect(api.Properties.Policy.Version).toBe('2012-10-17');
      expect(api.Properties.Policy.Statement[0].Effect).toBe('Allow');
      expect(api.Properties.Policy.Statement[0].Action).toBe('execute-api:Invoke');
    });

    test('should create API Gateway request validator for body and parameters', () => {
      const validator = template.Resources.APIGatewayRequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
      expect(validator.Properties.RestApiId).toEqual({ Ref: 'APIGatewayRestAPI' });
    });

    test('should create API Gateway resource with app path', () => {
      const resource = template.Resources.APIGatewayResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('app');
      expect(resource.Properties.ParentId).toEqual({
        'Fn::GetAtt': ['APIGatewayRestAPI', 'RootResourceId']
      });
    });

    test('should create API Gateway GET method with request validation', () => {
      const method = template.Resources.APIGatewayMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.RequestValidatorId).toEqual({
        Ref: 'APIGatewayRequestValidator'
      });
    });

    test('should create API Gateway method with AWS_PROXY Lambda integration', () => {
      const method = template.Resources.APIGatewayMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      expect(method.Properties.Integration.Uri).toEqual({
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
      });
    });

    test('should create API Gateway deployment with method dependency', () => {
      const deployment = template.Resources.APIGatewayDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toBe('APIGatewayMethod');
      expect(deployment.Properties.RestApiId).toEqual({ Ref: 'APIGatewayRestAPI' });
    });

    test('should create API Gateway prod stage with logging enabled', () => {
      const stage = template.Resources.APIGatewayStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.MethodSettings[0].ResourcePath).toBe('/*');
      expect(stage.Properties.MethodSettings[0].HttpMethod).toBe('*');
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });

    test('should create API Gateway log group with 30-day retention', () => {
      const logGroup = template.Resources.APIGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create Lambda invoke permission for API Gateway', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'LambdaFunction' });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log role with correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create VPC Flow Log role with CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogGroups');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogStreams');
    });

    test('should create VPC Flow Log Group with 30-day retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create VPC Flow Log with ALL traffic type', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail S3 bucket with AES256 encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create CloudTrail S3 bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create CloudTrail S3 bucket with public access completely blocked', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create CloudTrail S3 bucket with 365-day lifecycle policy', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldTrailLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(365);
    });

    test('should create CloudTrail bucket policy allowing CloudTrail service ACL check', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheckStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclCheckStatement.Effect).toBe('Allow');
      expect(aclCheckStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclCheckStatement.Action).toBe('s3:GetBucketAcl');
    });

    test('should create CloudTrail bucket policy allowing CloudTrail service to write logs', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(writeStatement.Effect).toBe('Allow');
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });

    test('should create CloudTrail with multi-region and global service events enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('should create CloudTrail with management events only without DataResources', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];

      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
      expect(eventSelectors.DataResources).toBeUndefined();
    });

    test('should create CloudTrail with S3 bucket and policy dependency', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create Lambda CPU alarm monitoring high duration with 25-second threshold', () => {
      const alarm = template.Resources.LambdaCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(25000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create Lambda CPU alarm monitoring correct Lambda function', () => {
      const alarm = template.Resources.LambdaCPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('FunctionName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'LambdaFunction' });
    });

    test('should create Lambda error alarm with 5-error threshold', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create API Gateway 4XX error alarm with 10-error threshold', () => {
      const alarm = template.Resources.APIGateway4XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create API Gateway 5XX error alarm with 5-error threshold', () => {
      const alarm = template.Resources.APIGateway5XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });
});

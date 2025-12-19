import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Serverless Python Application with RDS PostgreSQL', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with parameterized CIDR block', () => {
      const vpc = template.Resources.projXVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.projXVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway with correct type', () => {
      const igw = template.Resources.projXInternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.projXAttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'projXVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'projXInternetGateway' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources.projXPublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });

    test('should create public subnet 1 with MapPublicIpOnLaunch enabled', () => {
      const subnet = template.Resources.projXPublicSubnet1;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with dynamic AZ selection in second AZ', () => {
      const subnet = template.Resources.projXPublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });

    test('should create public subnet 2 with MapPublicIpOnLaunch enabled', () => {
      const subnet = template.Resources.projXPublicSubnet2;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources.projXPrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });

    test('should create private subnet 1 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.projXPrivateSubnet1;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with dynamic AZ selection in second AZ', () => {
      const subnet = template.Resources.projXPrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });

    test('should create private subnet 2 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.projXPrivateSubnet2;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway EIP with vpc domain and gateway dependency', () => {
      const eip = template.Resources.projXNATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('projXAttachGateway');
    });

    test('should create NAT Gateway in public subnet 1 with EIP allocation', () => {
      const natGateway = template.Resources.projXNATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'projXPublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['projXNATGatewayEIP', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources.projXPublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'projXVPC' });
    });

    test('should create public route to internet gateway with 0.0.0.0/0', () => {
      const route = template.Resources.projXPublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'projXInternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'projXPublicRouteTable' });
      expect(route.DependsOn).toBe('projXAttachGateway');
    });

    test('should associate public subnet 1 with public route table', () => {
      const association = template.Resources.projXPublicSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'projXPublicSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'projXPublicRouteTable' });
    });

    test('should associate public subnet 2 with public route table', () => {
      const association = template.Resources.projXPublicSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'projXPublicSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'projXPublicRouteTable' });
    });

    test('should create private route table in VPC', () => {
      const routeTable = template.Resources.projXPrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'projXVPC' });
    });

    test('should create private route to NAT gateway', () => {
      const route = template.Resources.projXPrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'projXNATGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'projXPrivateRouteTable' });
    });

    test('should associate private subnet 1 with private route table', () => {
      const association = template.Resources.projXPrivateSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'projXPrivateSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'projXPrivateRouteTable' });
    });

    test('should associate private subnet 2 with private route table', () => {
      const association = template.Resources.projXPrivateSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'projXPrivateSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'projXPrivateRouteTable' });
    });
  });

  describe('Lambda Security Group Configuration', () => {
    test('should create Lambda security group in VPC', () => {
      const sg = template.Resources.projXLambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'projXVPC' });
    });

    test('should create Lambda security group with all outbound traffic allowed', () => {
      const sg = template.Resources.projXLambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('RDS Security Group Configuration', () => {
    test('should create RDS security group in VPC', () => {
      const sg = template.Resources.projXRDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'projXVPC' });
    });

    test('should create RDS security group with PostgreSQL access from Lambda only', () => {
      const sg = template.Resources.projXRDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'projXLambdaSecurityGroup' });
      expect(ingressRule.Description).toBe('PostgreSQL access from Lambda functions');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create Secrets Manager secret with auto-generated password', () => {
      const secret = template.Resources.projXDBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should create secret with correct password generation settings', () => {
      const secret = template.Resources.projXDBSecret;
      const generateConfig = secret.Properties.GenerateSecretString;

      expect(generateConfig.SecretStringTemplate).toBe('{"username": "projxadmin"}');
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.ExcludeCharacters).toBe('"@/\\');
      expect(generateConfig.RequireEachIncludedType).toBe(true);
    });
  });

  describe('RDS Subnet Group Configuration', () => {
    test('should create RDS subnet group with private subnets', () => {
      const subnetGroup = template.Resources.projXDBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'projXPrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'projXPrivateSubnet2' });
    });
  });

  describe('RDS Instance Configuration', () => {
    test('should create RDS instance with PostgreSQL engine', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toBe('15.10');
    });

    test('should create RDS instance with parameterized instance class', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceClass' });
    });

    test('should create RDS instance with storage encryption configured', () => {
      const rds = template.Resources.projXRDSInstance;
      // StorageEncrypted set to false for LocalStack compatibility
      expect(rds.Properties.StorageEncrypted).toBe(false);
    });

    test('should create RDS instance in private subnet group', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'projXDBSubnetGroup' });
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should create RDS instance with Secrets Manager credentials', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${projXDBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${projXDBSecret}:SecretString:password}}'
      });
    });

    test('should create RDS instance with backup and maintenance windows', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('mon:04:00-mon:05:00');
    });

    test('should create RDS instance without CloudWatch Logs exports for LocalStack compatibility', () => {
      const rds = template.Resources.projXRDSInstance;
      // EnableCloudwatchLogsExports removed for LocalStack compatibility
      expect(rds.Properties.EnableCloudwatchLogsExports).toBeUndefined();
    });

    test('should create RDS instance with correct security group', () => {
      const rds = template.Resources.projXRDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toHaveLength(1);
      expect(rds.Properties.VPCSecurityGroups[0]).toEqual({ Ref: 'projXRDSSecurityGroup' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with AES256 encryption', () => {
      const bucket = template.Resources.projXS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.projXS3Bucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 bucket with public access completely blocked', () => {
      const bucket = template.Resources.projXS3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.projXS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with 90-day noncurrent version expiration lifecycle policy', () => {
      const bucket = template.Resources.projXS3Bucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldVersions');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('should create S3 bucket policy denying insecure transport', () => {
      const policy = template.Resources.projXS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'projXS3Bucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:*');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('Lambda IAM Role Configuration', () => {
    test('should create Lambda execution role with correct assume role policy', () => {
      const role = template.Resources.projXLambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create Lambda execution role with VPC access managed policy', () => {
      const role = template.Resources.projXLambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(1);
      expect(role.Properties.ManagedPolicyArns[0]).toBe(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should create Lambda execution role with scoped CloudWatch Logs policy', () => {
      const role = template.Resources.projXLambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'projXLambdaCloudWatchLogsPolicy');

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

    test('should create Lambda execution role with S3 access policy', () => {
      const role = template.Resources.projXLambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'projXLambdaS3AccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('should create Lambda execution role with Secrets Manager access policy', () => {
      const role = template.Resources.projXLambdaExecutionRole;
      const secretsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'projXLambdaSecretsManagerPolicy');

      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:DescribeSecret');
      expect(secretsPolicy.PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'projXDBSecret' });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with parameterized runtime and correct handler', () => {
      const lambda = template.Resources.projXLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should create Lambda function with execution role', () => {
      const lambda = template.Resources.projXLambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['projXLambdaExecutionRole', 'Arn']
      });
    });

    test('should create Lambda function with parameterized memory size and 30 second timeout', () => {
      const lambda = template.Resources.projXLambdaFunction;
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should create Lambda function in VPC with private subnets and Lambda security group', () => {
      const lambda = template.Resources.projXLambdaFunction;
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds[0]).toEqual({
        Ref: 'projXLambdaSecurityGroup'
      });
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'projXPrivateSubnet1' });
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'projXPrivateSubnet2' });
    });

    test('should create Lambda function with environment variables for database connection', () => {
      const lambda = template.Resources.projXLambdaFunction;
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(lambda.Properties.Environment.Variables.S3_BUCKET).toEqual({ Ref: 'projXS3Bucket' });
      expect(lambda.Properties.Environment.Variables.DB_SECRET_ARN).toEqual({ Ref: 'projXDBSecret' });
      expect(lambda.Properties.Environment.Variables.DB_HOST).toEqual({
        'Fn::GetAtt': ['projXRDSInstance', 'Endpoint.Address']
      });
      expect(lambda.Properties.Environment.Variables.DB_PORT).toEqual({
        'Fn::GetAtt': ['projXRDSInstance', 'Endpoint.Port']
      });
      expect(lambda.Properties.Environment.Variables.DB_NAME).toEqual({ Ref: 'DBName' });
    });

    test('should create Lambda function with inline Python code', () => {
      const lambda = template.Resources.projXLambdaFunction;
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
      const logGroup = template.Resources.projXLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create Lambda log group with correct name pattern', () => {
      const logGroup = template.Resources.projXLambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/projX-AppFunction-${EnvironmentSuffix}'
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway REST API with REGIONAL endpoint', () => {
      const api = template.Resources.projXAPIGatewayRestAPI;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toHaveLength(1);
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('should create API Gateway REST API with resource policy', () => {
      const api = template.Resources.projXAPIGatewayRestAPI;
      expect(api.Properties.Policy).toBeDefined();
      expect(api.Properties.Policy.Version).toBe('2012-10-17');
      expect(api.Properties.Policy.Statement[0].Effect).toBe('Allow');
      expect(api.Properties.Policy.Statement[0].Action).toBe('execute-api:Invoke');
    });

    test('should create API Gateway request validator for body and parameters', () => {
      const validator = template.Resources.projXAPIGatewayRequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
      expect(validator.Properties.RestApiId).toEqual({ Ref: 'projXAPIGatewayRestAPI' });
    });

    test('should create API Gateway resource with app path', () => {
      const resource = template.Resources.projXAPIGatewayResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('app');
      expect(resource.Properties.ParentId).toEqual({
        'Fn::GetAtt': ['projXAPIGatewayRestAPI', 'RootResourceId']
      });
    });

    test('should create API Gateway GET method with request validation', () => {
      const method = template.Resources.projXAPIGatewayMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.RequestValidatorId).toEqual({
        Ref: 'projXAPIGatewayRequestValidator'
      });
    });

    test('should create API Gateway method with AWS_PROXY Lambda integration', () => {
      const method = template.Resources.projXAPIGatewayMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      expect(method.Properties.Integration.Uri).toEqual({
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${projXLambdaFunction.Arn}/invocations'
      });
    });

    test('should create API Gateway deployment with method dependency', () => {
      const deployment = template.Resources.projXAPIGatewayDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toBe('projXAPIGatewayMethod');
      expect(deployment.Properties.RestApiId).toEqual({ Ref: 'projXAPIGatewayRestAPI' });
    });

    test('should create API Gateway prod stage with access logging enabled', () => {
      const stage = template.Resources.projXAPIGatewayStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.AccessLogSetting).toBeDefined();
      expect(stage.Properties.AccessLogSetting.DestinationArn).toEqual({
        'Fn::GetAtt': ['projXAPIGatewayLogGroup', 'Arn']
      });
    });

    test('should create API Gateway stage with method settings for logging and metrics', () => {
      const stage = template.Resources.projXAPIGatewayStage;
      expect(stage.Properties.MethodSettings[0].ResourcePath).toBe('/*');
      expect(stage.Properties.MethodSettings[0].HttpMethod).toBe('*');
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });

    test('should create API Gateway log group with 30-day retention', () => {
      const logGroup = template.Resources.projXAPIGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create Lambda invoke permission for API Gateway', () => {
      const permission = template.Resources.projXLambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'projXLambdaFunction' });
    });
  });

  describe('API Gateway CloudWatch Role Configuration', () => {
    test('should create API Gateway CloudWatch role with correct assume role policy', () => {
      const role = template.Resources.projXAPIGatewayCloudWatchRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('apigateway.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create API Gateway CloudWatch role with push to logs managed policy', () => {
      const role = template.Resources.projXAPIGatewayCloudWatchRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      );
    });

    test('should create API Gateway account with CloudWatch role', () => {
      const account = template.Resources.projXAPIGatewayAccount;
      expect(account.Type).toBe('AWS::ApiGateway::Account');
      expect(account.Properties.CloudWatchRoleArn).toEqual({
        'Fn::GetAtt': ['projXAPIGatewayCloudWatchRole', 'Arn']
      });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create Lambda duration alarm with 25-second threshold', () => {
      const alarm = template.Resources.projXLambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(25000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create Lambda duration alarm monitoring correct Lambda function', () => {
      const alarm = template.Resources.projXLambdaDurationAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('FunctionName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'projXLambdaFunction' });
    });

    test('should create Lambda error alarm with 5-error threshold', () => {
      const alarm = template.Resources.projXLambdaErrorAlarm;
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
      const alarm = template.Resources.projXAPIGateway4XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create API Gateway 5XX error alarm with 5-error threshold', () => {
      const alarm = template.Resources.projXAPIGateway5XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create RDS CPU alarm with 80% threshold', () => {
      const alarm = template.Resources.projXRDSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create RDS CPU alarm monitoring correct RDS instance', () => {
      const alarm = template.Resources.projXRDSCPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'projXRDSInstance' });
    });

    test('should create RDS storage alarm with 2GB threshold', () => {
      const alarm = template.Resources.projXRDSStorageAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(2000000000);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should create RDS storage alarm monitoring correct RDS instance', () => {
      const alarm = template.Resources.projXRDSStorageAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'projXRDSInstance' });
    });
  });
});
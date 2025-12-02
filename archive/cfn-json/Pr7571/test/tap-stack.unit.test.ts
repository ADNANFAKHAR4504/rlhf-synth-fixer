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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('payment processing');
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBeDefined();
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have EncryptionKey resource', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have key rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('EncryptionKey should allow root account access', () => {
      const key = template.Resources.EncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Principal.AWS['Fn::Sub']).toContain('${AWS::AccountId}:root');
    });

    test('EncryptionKey should allow CloudWatch Logs access', () => {
      const key = template.Resources.EncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service['Fn::Sub']).toContain('logs');
    });

    test('should have EncryptionKeyAlias resource', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('EncryptionKeyAlias should reference EncryptionKey', () => {
      const alias = template.Resources.EncryptionKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'EncryptionKey' });
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('payment-processing-${EnvironmentSuffix}');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should reference VPC', () => {
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet3.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have 1 public subnet', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnet should have correct CIDR block', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NATGateway resource', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NATGateway should be in public subnet', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should have VPC endpoints for S3 and DynamoDB', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
    });

    test('VPC endpoints should be Gateway type', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('VPC endpoints should reference private route table', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      const dynamoEndpoint = template.Resources.DynamoDBVPCEndpoint;
      expect(s3Endpoint.Properties.RouteTableIds[0]).toEqual({ Ref: 'PrivateRouteTable' });
      expect(dynamoEndpoint.Properties.RouteTableIds[0]).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('Security Groups', () => {
    test('should have LambdaSecurityGroup resource', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('LambdaSecurityGroup should reference VPC', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('LambdaSecurityGroup should allow HTTPS egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe('tcp');
      expect(egress.FromPort).toBe(443);
      expect(egress.ToPort).toBe(443);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('S3 Buckets', () => {
    test('should have PaymentBucket resource', () => {
      expect(template.Resources.PaymentBucket).toBeDefined();
      expect(template.Resources.PaymentBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('PaymentBucket should have KMS encryption', () => {
      const bucket = template.Resources.PaymentBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'EncryptionKey' });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('PaymentBucket should have versioning enabled', () => {
      const bucket = template.Resources.PaymentBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('PaymentBucket should block public access', () => {
      const bucket = template.Resources.PaymentBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have PaymentBucketPolicy resource', () => {
      expect(template.Resources.PaymentBucketPolicy).toBeDefined();
      expect(template.Resources.PaymentBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('PaymentBucketPolicy should deny unencrypted uploads', () => {
      const policy = template.Resources.PaymentBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyUnencrypted = statements.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
      expect(denyUnencrypted.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });

    test('PaymentBucketPolicy should deny insecure transport', () => {
      const policy = template.Resources.PaymentBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have CloudTrailBucket resource', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CloudTrailBucket should have KMS encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'EncryptionKey' });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should have correct key schema', () => {
      const table = template.Resources.TransactionTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TransactionTable should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have KMS encryption', () => {
      const table = template.Resources.TransactionTable;
      const sse = table.Properties.SSESpecification;
      expect(sse.SSEEnabled).toBe(true);
      expect(sse.SSEType).toBe('KMS');
      expect(sse.KMSMasterKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('TransactionTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('should have PaymentProcessorFunction resource', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      expect(template.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('PaymentProcessorFunction should use Python 3.11 runtime', () => {
      const func = template.Resources.PaymentProcessorFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Handler).toBe('payment_processor.lambda_handler');
    });

    test('PaymentProcessorFunction should have correct timeout and memory', () => {
      const func = template.Resources.PaymentProcessorFunction;
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(512);
    });

    test('PaymentProcessorFunction should be in VPC with private subnets', () => {
      const func = template.Resources.PaymentProcessorFunction;
      const vpcConfig = func.Properties.VpcConfig;
      expect(vpcConfig.SubnetIds).toHaveLength(3);
      expect(vpcConfig.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcConfig.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(vpcConfig.SubnetIds[2]).toEqual({ Ref: 'PrivateSubnet3' });
      expect(vpcConfig.SecurityGroupIds[0]).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('PaymentProcessorFunction should have environment variables', () => {
      const func = template.Resources.PaymentProcessorFunction;
      const env = func.Properties.Environment.Variables;
      expect(env.DYNAMODB_TABLE).toEqual({ Ref: 'TransactionTable' });
      expect(env.S3_BUCKET).toEqual({ Ref: 'PaymentBucket' });
      expect(env.KMS_KEY_ID).toEqual({ Ref: 'EncryptionKey' });
    });

    test('PaymentProcessorFunction should depend on log group', () => {
      const func = template.Resources.PaymentProcessorFunction;
      expect(func.DependsOn).toBe('PaymentProcessorLogGroup');
    });

    test('should have PaymentProcessorLogGroup resource', () => {
      expect(template.Resources.PaymentProcessorLogGroup).toBeDefined();
      expect(template.Resources.PaymentProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('PaymentProcessorLogGroup should have KMS encryption', () => {
      const logGroup = template.Resources.PaymentProcessorLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['EncryptionKey', 'Arn']
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have VPC access managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('LambdaExecutionRole should have S3 permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });

    test('LambdaExecutionRole should have DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const dynamoStatement = statements.find((s: any) => s.Action.includes('dynamodb:PutItem'));
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
    });

    test('LambdaExecutionRole should have KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const kmsStatement = statements.find((s: any) => s.Action.includes('kms:Decrypt'));
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:DescribeKey');
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
    });
  });

  describe('CloudTrail', () => {
    test('should have PaymentProcessingTrail resource', () => {
      expect(template.Resources.PaymentProcessingTrail).toBeDefined();
      expect(template.Resources.PaymentProcessingTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('PaymentProcessingTrail should have correct configuration', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(false);
    });

    test('PaymentProcessingTrail should use CloudTrailBucket', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
    });

    test('PaymentProcessingTrail should use KMS encryption', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('should have CloudTrailBucketPolicy resource', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('CloudTrailBucketPolicy should allow CloudTrail service access', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const write = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(aclCheck).toBeDefined();
      expect(write).toBeDefined();
      expect(aclCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(write.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have PaymentBucketName output', () => {
      expect(template.Outputs.PaymentBucketName).toBeDefined();
      expect(template.Outputs.PaymentBucketName.Value).toEqual({ Ref: 'PaymentBucket' });
    });

    test('should have TransactionTableName output', () => {
      expect(template.Outputs.TransactionTableName).toBeDefined();
      expect(template.Outputs.TransactionTableName.Value).toEqual({ Ref: 'TransactionTable' });
    });

    test('should have PaymentProcessorFunctionArn output', () => {
      expect(template.Outputs.PaymentProcessorFunctionArn).toBeDefined();
      expect(template.Outputs.PaymentProcessorFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['PaymentProcessorFunction', 'Arn']
      });
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'EncryptionKey' });
    });

    test('should have CloudTrailName output', () => {
      expect(template.Outputs.CloudTrailName).toBeDefined();
      expect(template.Outputs.CloudTrailName.Value).toEqual({ Ref: 'PaymentProcessingTrail' });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC should include EnvironmentSuffix in name', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('LambdaExecutionRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('PaymentProcessorFunction should include EnvironmentSuffix in name', () => {
      const func = template.Resources.PaymentProcessorFunction;
      expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('TransactionTable should include EnvironmentSuffix in name', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('PaymentBucket should include EnvironmentSuffix in name', () => {
      const bucket = template.Resources.PaymentBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CloudTrailBucket should include EnvironmentSuffix in name', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('PaymentProcessingTrail should include EnvironmentSuffix in name', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.TrailName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Tagging Standards', () => {
    test('VPC should have Name tag', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('subnets should have Name tags', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(privateSubnet1.Properties.Tags).toBeDefined();
      expect(publicSubnet1.Properties.Tags).toBeDefined();
      const privateNameTag = privateSubnet1.Properties.Tags.find((t: any) => t.Key === 'Name');
      const publicNameTag = publicSubnet1.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(privateNameTag).toBeDefined();
      expect(publicNameTag).toBeDefined();
    });

    test('LambdaExecutionRole should have Name tag', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Tags).toBeDefined();
      const nameTag = role.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('PaymentProcessorFunction should have Name tag', () => {
      const func = template.Resources.PaymentProcessorFunction;
      expect(func.Properties.Tags).toBeDefined();
      const nameTag = func.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('S3 buckets should have Name tags', () => {
      const paymentBucket = template.Resources.PaymentBucket;
      const cloudTrailBucket = template.Resources.CloudTrailBucket;
      expect(paymentBucket.Properties.Tags).toBeDefined();
      expect(cloudTrailBucket.Properties.Tags).toBeDefined();
      const paymentNameTag = paymentBucket.Properties.Tags.find((t: any) => t.Key === 'Name');
      const cloudTrailNameTag = cloudTrailBucket.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(paymentNameTag).toBeDefined();
      expect(cloudTrailNameTag).toBeDefined();
    });

    test('TransactionTable should have Name tag', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.Tags).toBeDefined();
      const nameTag = table.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('PaymentProcessingTrail should have Name tag', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.Tags).toBeDefined();
      const nameTag = trail.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });
  });

  describe('Resource Count', () => {
    test('should have all required resources', () => {
      const requiredResources = [
        'EncryptionKey',
        'EncryptionKeyAlias',
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'PublicSubnet1',
        'InternetGateway',
        'AttachGateway',
        'PublicRouteTable',
        'PublicRoute',
        'PublicSubnetRouteTableAssociation',
        'NATGatewayEIP',
        'NATGateway',
        'PrivateRouteTable',
        'PrivateRoute',
        'PrivateSubnetRouteTableAssociation1',
        'PrivateSubnetRouteTableAssociation2',
        'PrivateSubnetRouteTableAssociation3',
        'LambdaSecurityGroup',
        'S3VPCEndpoint',
        'DynamoDBVPCEndpoint',
        'PaymentBucket',
        'PaymentBucketPolicy',
        'TransactionTable',
        'LambdaExecutionRole',
        'PaymentProcessorLogGroup',
        'PaymentProcessorFunction',
        'CloudTrailBucket',
        'CloudTrailBucketPolicy',
        'PaymentProcessingTrail'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have 1 IAM role', () => {
      const roles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::Role');
      expect(roles.length).toBe(1);
    });

    test('should have 1 Lambda function', () => {
      const functions = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::Lambda::Function');
      expect(functions.length).toBe(1);
    });

    test('should have 2 S3 buckets', () => {
      const buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket');
      expect(buckets.length).toBe(2);
    });

    test('should have 1 DynamoDB table', () => {
      const tables = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::DynamoDB::Table');
      expect(tables.length).toBe(1);
    });

    test('should have 1 CloudTrail trail', () => {
      const trails = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::CloudTrail::Trail');
      expect(trails.length).toBe(1);
    });

    test('should have 1 KMS key', () => {
      const keys = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::KMS::Key');
      expect(keys.length).toBe(1);
    });

    test('should have 1 security group', () => {
      const securityGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBe(1);
    });

    test('should have 2 VPC endpoints', () => {
      const endpoints = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::VPCEndpoint');
      expect(endpoints.length).toBe(2);
    });
  });

  describe('Security and Compliance', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket')
        .map(key => template.Resources[key]);

      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket')
        .map(key => template.Resources[key]);

      buckets.forEach(bucket => {
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('CloudTrail should have encryption enabled', () => {
      const trail = template.Resources.PaymentProcessingTrail;
      expect(trail.Properties.KMSKeyId).toBeDefined();
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('Lambda function should be in private subnets', () => {
      const func = template.Resources.PaymentProcessorFunction;
      const subnetIds = func.Properties.VpcConfig.SubnetIds;
      expect(subnetIds.length).toBe(3);
      // All subnets should be private (no public subnet references)
      const publicSubnetRef = { Ref: 'PublicSubnet1' };
      expect(subnetIds).not.toContainEqual(publicSubnetRef);
    });
  });
});
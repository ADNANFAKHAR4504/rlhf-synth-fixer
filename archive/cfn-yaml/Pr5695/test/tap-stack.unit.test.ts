import fs from 'fs';
import path from 'path';

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
      expect(template.Description).toContain('Payment Processing System');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.Description).toContain('Environment suffix');
    });

    test('should have DeploymentColor parameter for blue-green deployment', () => {
      expect(template.Parameters.DeploymentColor).toBeDefined();
      const param = template.Parameters.DeploymentColor;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('blue');
      expect(param.AllowedValues).toContain('blue');
      expect(param.AllowedValues).toContain('green');
    });

    test('should have TrafficWeight parameter for gradual traffic shifting', () => {
      expect(template.Parameters.TrafficWeight).toBeDefined();
      const param = template.Parameters.TrafficWeight;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBe(0);
      expect(param.MaxValue).toBe(100);
    });

    test('should have EnableBlueGreenDeployment parameter', () => {
      expect(template.Parameters.EnableBlueGreenDeployment).toBeDefined();
      const param = template.Parameters.EnableBlueGreenDeployment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toContain('true');
      expect(param.AllowedValues).toContain('false');
    });

    test('should have optional DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have optional HostedZoneId parameter', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      const param = template.Parameters.HostedZoneId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
    });

    test('DBMasterUsername should have correct properties', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
    });

    test('AlertEmail should have correct properties', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('alerts@example.com');
      expect(param.AllowedPattern).toBe('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Description).toBeDefined();
      });
    });

    test('all parameters should have default values', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Default).toBeDefined();
      });
    });

    test('should NOT have DBMasterPassword parameter', () => {
      expect(template.Parameters.DBMasterPassword).toBeUndefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should have MasterKMSKey resource', () => {
      expect(template.Resources.MasterKMSKey).toBeDefined();
      expect(template.Resources.MasterKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('MasterKMSKey should have rotation enabled', () => {
      const key = template.Resources.MasterKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('MasterKMSKey should have proper key policy', () => {
      const keyPolicy = template.Resources.MasterKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('MasterKMSKey should allow root account permissions', () => {
      const keyPolicy = template.Resources.MasterKMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
    });

    test('MasterKMSKey should have ViaService conditions', () => {
      const keyPolicy = template.Resources.MasterKMSKey.Properties.KeyPolicy;
      const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Condition).toBeDefined();
      expect(serviceStatement.Condition.StringEquals['kms:ViaService']).toBeDefined();
    });

    test('should have MasterKMSKeyAlias', () => {
      expect(template.Resources.MasterKMSKeyAlias).toBeDefined();
      expect(template.Resources.MasterKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('MasterKMSKey should have DeletionPolicy Delete', () => {
      expect(template.Resources.MasterKMSKey.DeletionPolicy).toBe('Delete');
    });

    test('MasterKMSKey should have required tags', () => {
      const tags = template.Resources.MasterKMSKey.Properties.Tags;
      expect(tags).toBeDefined();
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Secrets Manager', () => {
    test('should have DBMasterSecret resource', () => {
      expect(template.Resources.DBMasterSecret).toBeDefined();
      expect(template.Resources.DBMasterSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBMasterSecret should use KMS encryption', () => {
      expect(template.Resources.DBMasterSecret.Properties.KmsKeyId).toBeDefined();
    });

    test('DBMasterSecret should have automatic password generation', () => {
      const generateConfig = template.Resources.DBMasterSecret.Properties.GenerateSecretString;
      expect(generateConfig).toBeDefined();
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.GenerateStringKey).toBe('password');
    });

    test('DBMasterSecret should have DeletionPolicy Delete', () => {
      expect(template.Resources.DBMasterSecret.DeletionPolicy).toBe('Delete');
    });

    test('should have SecretRDSAttachment', () => {
      expect(template.Resources.SecretRDSAttachment).toBeDefined();
      expect(template.Resources.SecretRDSAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });

    test('DBMasterSecret should have required tags', () => {
      const tags = template.Resources.DBMasterSecret.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 2 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have 2 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('subnets should use GetAZs for availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      expect(subnet1AZ).toBeDefined();
      expect(subnet1AZ['Fn::Select']).toBeDefined();
    });

    test('should have PublicRouteTable', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('should have PublicRoute with InternetGateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('VPC resources should have DeletionPolicy Delete', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet1.DeletionPolicy).toBe('Delete');
    });

    test('VPC should have required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Security Groups', () => {
    test('should have LambdaSecurityGroup', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DBSecurityGroup', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DBSecurityGroup should allow MySQL from Lambda', () => {
      const ingress = template.Resources.DBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });

    test('LambdaSecurityGroup should allow all outbound', () => {
      const egress = template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress[0].IpProtocol).toBe(-1);
    });

    test('security groups should have required tags', () => {
      const tags = template.Resources.LambdaSecurityGroup.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('RDS Aurora', () => {
    test('should have AuroraCluster resource', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('AuroraCluster should use Secrets Manager for credentials', () => {
      const username = template.Resources.AuroraCluster.Properties.MasterUsername;
      const password = template.Resources.AuroraCluster.Properties.MasterUserPassword;
      expect(JSON.stringify(username)).toContain('resolve:secretsmanager');
      expect(JSON.stringify(password)).toContain('resolve:secretsmanager');
    });

    test('AuroraCluster should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.AuroraCluster.Properties.KmsKeyId).toBeDefined();
    });

    test('AuroraCluster should have CloudWatch logs exports', () => {
      const logsExports = template.Resources.AuroraCluster.Properties.EnableCloudwatchLogsExports;
      expect(logsExports).toContain('error');
      expect(logsExports).toContain('general');
      expect(logsExports).toContain('slowquery');
    });

    test('AuroraCluster should use Aurora MySQL 5.7', () => {
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-mysql');
      expect(template.Resources.AuroraCluster.Properties.EngineVersion).toContain('5.7');
    });

    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have DBClusterParameterGroup with UTF8MB4', () => {
      expect(template.Resources.DBClusterParameterGroup).toBeDefined();
      const params = template.Resources.DBClusterParameterGroup.Properties.Parameters;
      expect(params.character_set_server).toBe('utf8mb4');
      expect(params.collation_server).toBe('utf8mb4_unicode_ci');
    });

    test('should have AuroraInstance1', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('AuroraInstance1 should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('AuroraCluster should have DeletionPolicy Delete', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstance1.DeletionPolicy).toBe('Delete');
    });

    test('Aurora resources should have required tags', () => {
      const tags = template.Resources.AuroraCluster.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('DynamoDB', () => {
    test('should have SessionTable resource', () => {
      expect(template.Resources.SessionTable).toBeDefined();
      expect(template.Resources.SessionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionTable should use PAY_PER_REQUEST billing', () => {
      expect(template.Resources.SessionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('SessionTable should have point-in-time recovery enabled', () => {
      const pitr = template.Resources.SessionTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('SessionTable should have KMS encryption', () => {
      const sse = template.Resources.SessionTable.Properties.SSESpecification;
      expect(sse.SSEEnabled).toBe(true);
      expect(sse.SSEType).toBe('KMS');
    });

    test('SessionTable should have correct key schema', () => {
      const keySchema = template.Resources.SessionTable.Properties.KeySchema;
      expect(keySchema[0].AttributeName).toBe('sessionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('SessionTable should have GSI', () => {
      const gsi = template.Resources.SessionTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi[0].IndexName).toBe('UserIdIndex');
    });

    test('SessionTable should have streams enabled', () => {
      const stream = template.Resources.SessionTable.Properties.StreamSpecification;
      expect(stream.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('SessionTable should have DeletionPolicy Delete', () => {
      expect(template.Resources.SessionTable.DeletionPolicy).toBe('Delete');
    });

    test('SessionTable should have required tags', () => {
      const tags = template.Resources.SessionTable.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('S3 Bucket', () => {
    test('should have TransactionLogsBucket resource', () => {
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TransactionLogsBucket should have versioning enabled', () => {
      const versioning = template.Resources.TransactionLogsBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('TransactionLogsBucket should have KMS encryption', () => {
      const encryption = template.Resources.TransactionLogsBucket.Properties.BucketEncryption;
      const sse = encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(sse.SSEAlgorithm).toBe('aws:kms');
    });

    test('TransactionLogsBucket should have lifecycle policy', () => {
      const lifecycle = template.Resources.TransactionLogsBucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });

    test('TransactionLogsBucket should block public access', () => {
      const publicAccess = template.Resources.TransactionLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('TransactionLogsBucket should have DeletionPolicy Delete', () => {
      expect(template.Resources.TransactionLogsBucket.DeletionPolicy).toBe('Delete');
    });

    test('TransactionLogsBucket should have required tags', () => {
      const tags = template.Resources.TransactionLogsBucket.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('TransactionLogsBucket should NOT have explicit BucketName', () => {
      expect(template.Resources.TransactionLogsBucket.Properties.BucketName).toBeUndefined();
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have Lambda assume role policy', () => {
      const assumePolicy = template.Resources.LambdaExecutionRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('LambdaExecutionRole should have VPC access policy', () => {
      const managedPolicies = template.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('LambdaExecutionRole should have scoped CloudWatch Logs permissions', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const logsStatement = policies[0].PolicyDocument.Statement.find((s: any) => s.Sid === 'CloudWatchLogs');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Resource).toBeDefined();
    });

    test('LambdaExecutionRole should have scoped DynamoDB permissions', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const dynamoStatement = policies[0].PolicyDocument.Statement.find((s: any) => s.Sid === 'DynamoDBAccess');
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
    });

    test('LambdaExecutionRole should have scoped S3 permissions', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const s3Statement = policies[0].PolicyDocument.Statement.find((s: any) => s.Sid === 'S3Access');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
    });

    test('LambdaExecutionRole should have KMS permissions with ViaService condition', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const kmsStatement = policies[0].PolicyDocument.Statement.find((s: any) => s.Sid === 'KMSAccess');
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Condition).toBeDefined();
      expect(kmsStatement.Condition.StringEquals['kms:ViaService']).toBeDefined();
    });

    test('LambdaExecutionRole should have Secrets Manager permissions', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const secretsStatement = policies[0].PolicyDocument.Statement.find((s: any) => s.Sid === 'SecretsManagerAccess');
      expect(secretsStatement).toBeDefined();
    });

    test('LambdaExecutionRole should have required tags', () => {
      const tags = template.Resources.LambdaExecutionRole.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Lambda Function', () => {
    test('should have PaymentValidationFunction', () => {
      expect(template.Resources.PaymentValidationFunction).toBeDefined();
      expect(template.Resources.PaymentValidationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('PaymentValidationFunction should use Python 3.9', () => {
      expect(template.Resources.PaymentValidationFunction.Properties.Runtime).toBe('python3.9');
    });

    test('PaymentValidationFunction should be in VPC', () => {
      const vpcConfig = template.Resources.PaymentValidationFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SubnetIds).toBeDefined();
    });

    test('PaymentValidationFunction should have environment variables', () => {
      const env = template.Resources.PaymentValidationFunction.Properties.Environment.Variables;
      expect(env.ENVIRONMENT).toBeDefined();
      expect(env.DB_ENDPOINT).toBeDefined();
      expect(env.SESSION_TABLE).toBeDefined();
      expect(env.TRANSACTION_BUCKET).toBeDefined();
    });

    test('PaymentValidationFunction should have appropriate timeout', () => {
      expect(template.Resources.PaymentValidationFunction.Properties.Timeout).toBe(60);
    });

    test('PaymentValidationFunction should have DeletionPolicy Delete', () => {
      expect(template.Resources.PaymentValidationFunction.DeletionPolicy).toBe('Delete');
    });

    test('PaymentValidationFunction should have required tags', () => {
      const tags = template.Resources.PaymentValidationFunction.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Blue-Green Deployment - Lambda Versioning', () => {
    test('should have PaymentValidationVersion for Lambda versioning', () => {
      expect(template.Resources.PaymentValidationVersion).toBeDefined();
      expect(template.Resources.PaymentValidationVersion.Type).toBe('AWS::Lambda::Version');
    });

    test('PaymentValidationVersion should reference the Lambda function', () => {
      const version = template.Resources.PaymentValidationVersion.Properties;
      expect(version.FunctionName).toBeDefined();
      expect(version.FunctionName.Ref).toBe('PaymentValidationFunction');
    });

    test('should have PaymentValidationAlias for traffic management', () => {
      expect(template.Resources.PaymentValidationAlias).toBeDefined();
      expect(template.Resources.PaymentValidationAlias.Type).toBe('AWS::Lambda::Alias');
    });

    test('PaymentValidationAlias should reference function and version', () => {
      const alias = template.Resources.PaymentValidationAlias.Properties;
      expect(alias.FunctionName).toBeDefined();
      expect(alias.FunctionVersion).toBeDefined();
    });

    test('PaymentValidationAlias name should be conditional on EnableBlueGreen', () => {
      const alias = template.Resources.PaymentValidationAlias.Properties;
      expect(alias.Name).toBeDefined();
      // Should use Fn::If to conditionally set name based on EnableBlueGreen
      expect(alias.Name['Fn::If']).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have ApiGateway resource', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.ApiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('ApiGateway should be REGIONAL', () => {
      const endpoint = template.Resources.ApiGateway.Properties.EndpointConfiguration;
      expect(endpoint.Types).toContain('REGIONAL');
    });

    test('should have ApiResource', () => {
      expect(template.Resources.ApiResource).toBeDefined();
      expect(template.Resources.ApiResource.Properties.PathPart).toBe('payment');
    });

    test('should have ApiMethod', () => {
      expect(template.Resources.ApiMethod).toBeDefined();
      expect(template.Resources.ApiMethod.Properties.HttpMethod).toBe('POST');
    });

    test('ApiMethod should integrate with Lambda alias for blue-green deployment', () => {
      const integration = template.Resources.ApiMethod.Properties.Integration;
      expect(integration.Uri).toBeDefined();
      // Should reference PaymentValidationAlias, not direct function
      expect(JSON.stringify(integration.Uri)).toContain('PaymentValidationAlias');
    });

    test('should have ApiDeployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
    });

    test('should have LambdaApiGatewayPermission', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('LambdaApiGatewayPermission should grant permission to Lambda alias', () => {
      const permission = template.Resources.LambdaApiGatewayPermission.Properties;
      expect(permission.FunctionName).toBeDefined();
      // Should reference PaymentValidationAlias
      expect(permission.FunctionName.Ref).toBe('PaymentValidationAlias');
    });

    test('ApiGateway should have required tags', () => {
      const tags = template.Resources.ApiGateway.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('CloudFront Distribution', () => {
    test('should have CloudFrontDistribution resource', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should be enabled', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
    });

    test('CloudFrontDistribution should have API Gateway as origin', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.Origins).toBeDefined();
      expect(config.Origins[0].Id).toBe('ApiGatewayOrigin');
      expect(config.Origins[0].DomainName).toBeDefined();
    });

    test('CloudFrontDistribution should use HTTPS only for origin', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      const origin = config.Origins[0];
      expect(origin.CustomOriginConfig.OriginProtocolPolicy).toBe('https-only');
      expect(origin.CustomOriginConfig.HTTPSPort).toBe(443);
    });

    test('CloudFrontDistribution should redirect HTTP to HTTPS', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFrontDistribution should use default CloudFront certificate', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.ViewerCertificate.CloudFrontDefaultCertificate).toBe(true);
    });

    test('CloudFrontDistribution should have no caching for API responses', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      const cacheBehavior = config.DefaultCacheBehavior;
      expect(cacheBehavior.DefaultTTL).toBe(0);
      expect(cacheBehavior.MinTTL).toBe(0);
      expect(cacheBehavior.MaxTTL).toBe(0);
    });

    test('CloudFrontDistribution should forward required headers', () => {
      const config = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      const forwardedValues = config.DefaultCacheBehavior.ForwardedValues;
      expect(forwardedValues.Headers).toContain('Authorization');
      expect(forwardedValues.Headers).toContain('Content-Type');
    });

    test('CloudFrontDistribution should have DeletionPolicy Delete', () => {
      expect(template.Resources.CloudFrontDistribution.DeletionPolicy).toBe('Delete');
    });

    test('CloudFrontDistribution should have required tags', () => {
      const tags = template.Resources.CloudFrontDistribution.Properties.Tags;
      expect(tags).toBeDefined();
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag).toBeDefined();
      expect(teamTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Route53 Health Check and DNS (Conditional)', () => {
    test('should have HealthCheck resource', () => {
      expect(template.Resources.HealthCheck).toBeDefined();
      expect(template.Resources.HealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('HealthCheck should have CreateRoute53 condition', () => {
      expect(template.Resources.HealthCheck.Condition).toBe('CreateRoute53');
    });

    test('HealthCheck should monitor HTTPS endpoint', () => {
      const config = template.Resources.HealthCheck.Properties.HealthCheckConfig;
      expect(config.Type).toBe('HTTPS');
      expect(config.Port).toBe(443);
    });

    test('HealthCheck should have appropriate intervals and thresholds', () => {
      const config = template.Resources.HealthCheck.Properties.HealthCheckConfig;
      expect(config.RequestInterval).toBe(30);
      expect(config.FailureThreshold).toBe(3);
    });

    test('should have RecordSet resource for weighted routing', () => {
      expect(template.Resources.RecordSet).toBeDefined();
      expect(template.Resources.RecordSet.Type).toBe('AWS::Route53::RecordSet');
    });

    test('RecordSet should have CreateRoute53 condition', () => {
      expect(template.Resources.RecordSet.Condition).toBe('CreateRoute53');
    });

    test('RecordSet should be an alias to CloudFront', () => {
      const properties = template.Resources.RecordSet.Properties;
      expect(properties.Type).toBe('A');
      expect(properties.AliasTarget).toBeDefined();
      expect(properties.AliasTarget.DNSName).toBeDefined();
    });

    test('RecordSet should use weighted routing for traffic control', () => {
      const properties = template.Resources.RecordSet.Properties;
      expect(properties.Weight).toBeDefined();
      expect(properties.SetIdentifier).toBeDefined();
    });

    test('RecordSet should reference HealthCheck', () => {
      const properties = template.Resources.RecordSet.Properties;
      expect(properties.HealthCheckId).toBeDefined();
      expect(properties.HealthCheckId.Ref).toBe('HealthCheck');
    });
  });

  describe('Conditions', () => {
    test('should have EnableBlueGreen condition', () => {
      expect(template.Conditions.EnableBlueGreen).toBeDefined();
    });

    test('EnableBlueGreen should check EnableBlueGreenDeployment parameter', () => {
      const condition = template.Conditions.EnableBlueGreen;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0].Ref).toBe('EnableBlueGreenDeployment');
      expect(condition['Fn::Equals'][1]).toBe('true');
    });

    test('should have CreateRoute53 condition', () => {
      expect(template.Conditions.CreateRoute53).toBeDefined();
    });

    test('CreateRoute53 should require EnableBlueGreen and domain parameters', () => {
      const condition = template.Conditions.CreateRoute53;
      expect(condition['Fn::And']).toBeDefined();
      // Should check EnableBlueGreen, DomainName, and HostedZoneId
      expect(condition['Fn::And'].length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNSTopic resource', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNSTopic should have KMS encryption', () => {
      expect(template.Resources.SNSTopic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('SNSTopic should have email subscription', () => {
      const subscription = template.Resources.SNSTopic.Properties.Subscription;
      expect(subscription).toBeDefined();
      expect(subscription[0].Protocol).toBe('email');
    });

    test('SNSTopic should have DeletionPolicy Delete', () => {
      expect(template.Resources.SNSTopic.DeletionPolicy).toBe('Delete');
    });

    test('SNSTopic should have required tags', () => {
      const tags = template.Resources.SNSTopic.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have RDSHighCPUAlarm', () => {
      expect(template.Resources.RDSHighCPUAlarm).toBeDefined();
      expect(template.Resources.RDSHighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('RDSHighCPUAlarm should monitor correct metric', () => {
      const alarm = template.Resources.RDSHighCPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
    });

    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
    });

    test('LambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });

    test('alarms should have SNS actions', () => {
      expect(template.Resources.RDSHighCPUAlarm.Properties.AlarmActions).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Properties.AlarmActions).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EnvironmentSuffix',
        'VPCId',
        'ApiEndpoint',
        'RDSEndpoint',
        'SessionTableName',
        'TransactionLogsBucketName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'MasterKMSKeyId',
        'DBMasterSecretArn',
        'DeploymentColor',
        'TrafficWeight',
        'LambdaAliasArn',
        'LambdaVersionNumber',
        'CloudFrontDistributionId',
        'CloudFrontDomainName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional Route53 outputs', () => {
      expect(template.Outputs.HealthCheckId).toBeDefined();
      expect(template.Outputs.Route53RecordName).toBeDefined();
      // These should have CreateRoute53 condition
      expect(template.Outputs.HealthCheckId.Condition).toBe('CreateRoute53');
      expect(template.Outputs.Route53RecordName.Condition).toBe('CreateRoute53');
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('EnvironmentSuffix output should reference parameter', () => {
      expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe('EnvironmentSuffix');
    });

    test('DeploymentColor output should reference parameter', () => {
      expect(template.Outputs.DeploymentColor.Value.Ref).toBe('DeploymentColor');
    });

    test('TrafficWeight output should reference parameter', () => {
      expect(template.Outputs.TrafficWeight.Value.Ref).toBe('TrafficWeight');
    });

    test('LambdaAliasArn output should reference alias', () => {
      expect(template.Outputs.LambdaAliasArn.Value.Ref).toBe('PaymentValidationAlias');
    });

    test('CloudFrontDistributionId output should reference CloudFront', () => {
      expect(template.Outputs.CloudFrontDistributionId.Value.Ref).toBe('CloudFrontDistribution');
    });

    test('CloudFrontDomainName should use GetAtt', () => {
      expect(template.Outputs.CloudFrontDomainName.Value['Fn::GetAtt']).toBeDefined();
      expect(template.Outputs.CloudFrontDomainName.Value['Fn::GetAtt'][0]).toBe('CloudFrontDistribution');
    });

    test('RDSEndpoint should use GetAtt', () => {
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });
  });

  describe('Deletion Policies', () => {
    const resourcesWithDeletionPolicy = [
      'MasterKMSKey', 'DBMasterSecret', 'VPC', 'InternetGateway',
      'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
      'PublicRouteTable', 'LambdaSecurityGroup', 'DBSecurityGroup',
      'DBSubnetGroup', 'DBClusterParameterGroup', 'AuroraCluster', 'AuroraInstance1',
      'SessionTable', 'TransactionLogsBucket', 'PaymentValidationFunction', 'SNSTopic'
    ];

    resourcesWithDeletionPolicy.forEach(resourceName => {
      test(`${resourceName} should have DeletionPolicy Delete`, () => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Required Tags Validation', () => {
    const resourcesWithTags = [
      'MasterKMSKey', 'DBMasterSecret', 'VPC', 'InternetGateway',
      'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
      'PublicRouteTable', 'LambdaSecurityGroup', 'DBSecurityGroup',
      'DBSubnetGroup', 'DBClusterParameterGroup', 'AuroraCluster', 'AuroraInstance1',
      'SessionTable', 'TransactionLogsBucket', 'LambdaExecutionRole',
      'PaymentValidationFunction', 'ApiGateway', 'SNSTopic'
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have project tag`, () => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const projectTag = tags.find((t: any) => t.Key === 'project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('iac-rlhf-amazon');
        }
      });

      test(`${resourceName} should have team-number tag`, () => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const teamTag = tags.find((t: any) => t.Key === 'team-number');
          expect(teamTag).toBeDefined();
          expect(teamTag.Value).toBe(2);
        }
      });
    });
  });

  describe('Region Agnostic Configuration', () => {
    test('template should use AWS::Region pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::Region');
    });

    test('template should use AWS::AccountId pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::AccountId');
    });

    test('template should use AWS::StackName pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::StackName');
    });

    test('subnets should use GetAZs for region-agnostic AZ selection', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      expect(subnet1AZ['Fn::Select']).toBeDefined();
      expect(subnet1AZ['Fn::Select'][1]['Fn::GetAZs']).toBe('');
    });
  });

  describe('Encryption At Rest', () => {
    test('RDS should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('DynamoDB should have encryption enabled', () => {
      expect(template.Resources.SessionTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('S3 should have encryption enabled', () => {
      const encryption = template.Resources.TransactionLogsBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
    });

    test('SNS should have KMS encryption', () => {
      expect(template.Resources.SNSTopic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Increased with blue-green features
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // Updated: 3 original + 5 blue-green parameters
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(18); // Updated: 10 original + 8 blue-green outputs
    });

    test('should have conditions defined', () => {
      expect(template.Conditions).toBeDefined();
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(2); // EnableBlueGreen and CreateRoute53
    });
  });

  describe('CloudFormation Schema Compliance', () => {
    test('all resources should have valid Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have Properties object', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        // Some resources like VPCGatewayAttachment may not have Properties
        if (resource.Type !== 'AWS::EC2::VPCGatewayAttachment' &&
            resource.Type !== 'AWS::EC2::Route' &&
            resource.Type !== 'AWS::EC2::SubnetRouteTableAssociation' &&
            resource.Type !== 'AWS::KMS::Alias' &&
            resource.Type !== 'AWS::SecretsManager::SecretTargetAttachment') {
          expect(resource.Properties).toBeDefined();
        }
      });
    });

    test('template should not have any null values in critical sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('S3 bucket should have public access blocked', () => {
      const publicAccess = template.Resources.TransactionLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });

    test('all encryption should use customer-managed KMS keys', () => {
      expect(template.Resources.AuroraCluster.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.SessionTable.Properties.SSESpecification.KMSMasterKeyId).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });

    test('KMS key should have automatic rotation enabled', () => {
      expect(template.Resources.MasterKMSKey.Properties.EnableKeyRotation).toBe(true);
    });
  });

  describe('Backup and Recovery', () => {
    test('RDS should have automated backups configured', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('DynamoDB should have point-in-time recovery', () => {
      const pitr = template.Resources.SessionTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const versioning = template.Resources.TransactionLogsBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });
  });
});

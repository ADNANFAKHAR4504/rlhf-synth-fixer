import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Patient API CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/cfn-template.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('HIPAA');
      expect(template.Description).toContain('Patient Records API');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
    });
  });

  describe('VPC and Network Resources', () => {
    test('should create VPC with correct properties', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');

      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.CidrBlock).toBe('10.0.0.0/16');
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should create two private subnets for RDS', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should create two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should create VPC endpoint for Secrets Manager', () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
      expect(template.Resources.SecretsManagerVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');

      const endpointProps = template.Resources.SecretsManagerVPCEndpoint.Properties;
      expect(endpointProps.VpcEndpointType).toBe('Interface');
      expect(endpointProps.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should create Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should create RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should create VPC endpoint security group', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have security group ingress rules', () => {
      expect(template.Resources.RDSFromLambdaIngress).toBeDefined();
      expect(template.Resources.RDSFromLambdaIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');

      const ingressProps = template.Resources.RDSFromLambdaIngress.Properties;
      expect(ingressProps.FromPort).toBe(5432);
      expect(ingressProps.ToPort).toBe(5432);
    });

    test('should have security group egress rules', () => {
      expect(template.Resources.LambdaToRDSEgress).toBeDefined();
      expect(template.Resources.LambdaToVPCEndpointEgress).toBeDefined();
    });
  });

  describe('KMS Encryption Keys - HIPAA Compliance', () => {
    test('should create KMS key for RDS encryption', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');

      const keyProps = template.Resources.RDSKMSKey.Properties;
      expect(keyProps.EnableKeyRotation).toBe(true);
      expect(keyProps.Description).toContain('RDS');
    });

    test('should create KMS key for CloudWatch Logs encryption', () => {
      expect(template.Resources.LogsKMSKey).toBeDefined();
      expect(template.Resources.LogsKMSKey.Type).toBe('AWS::KMS::Key');

      const keyProps = template.Resources.LogsKMSKey.Properties;
      expect(keyProps.EnableKeyRotation).toBe(true);
      expect(keyProps.Description).toContain('CloudWatch Logs');
    });

    test('should create KMS key aliases', () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.LogsKMSKeyAlias).toBeDefined();
    });

    test('KMS keys should have proper key policies', () => {
      const rdsKeyPolicy = template.Resources.RDSKMSKey.Properties.KeyPolicy;
      expect(rdsKeyPolicy.Version).toBe('2012-10-17');
      expect(rdsKeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(rdsKeyPolicy.Statement)).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('should create secrets for database password', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secret should have proper password generation configuration', () => {
      const secretProps = template.Resources.DBPasswordSecret.Properties;
      expect(secretProps.GenerateSecretString).toBeDefined();

      const genConfig = secretProps.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.GenerateStringKey).toBe('password');
    });

    test('secret name should use EnvironmentSuffix', () => {
      const secretProps = template.Resources.DBPasswordSecret.Properties;
      expect(secretProps.Name).toEqual({
        'Fn::Sub': 'patient-db-password-${EnvironmentSuffix}'
      });
    });
  });

  describe('RDS Database - HIPAA Compliance', () => {
    test('should create RDS DB instance', () => {
      expect(template.Resources.PatientDatabase).toBeDefined();
      expect(template.Resources.PatientDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should create DB subnet group with private subnets', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('RDS should have encryption enabled with KMS', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.StorageEncrypted).toBe(true);
      expect(dbProps.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });

    test('RDS should NOT be publicly accessible', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.PubliclyAccessible).toBe(false);
    });

    test('RDS should have deletion protection disabled for testing', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.DeletionProtection).toBe(false);
    });

    test('RDS should have DeletionPolicy set to Delete', () => {
      expect(template.Resources.PatientDatabase.DeletionPolicy).toBe('Delete');
    });

    test('RDS should have CloudWatch logs enabled', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.EnableCloudwatchLogsExports).toBeDefined();
      expect(Array.isArray(dbProps.EnableCloudwatchLogsExports)).toBe(true);
      expect(dbProps.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('RDS should have backup retention configured', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
    });

    test('RDS should use cost-optimized instance class', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDS engine should be PostgreSQL', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.Engine).toBe('postgres');
    });

    test('RDS database name should be patientdb', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.DBName).toBe('patientdb');
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function', () => {
      expect(template.Resources.PatientAPIFunction).toBeDefined();
      expect(template.Resources.PatientAPIFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should create Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should create CloudWatch log group for Lambda', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Lambda should use Python 3.11 runtime', () => {
      const funcProps = template.Resources.PatientAPIFunction.Properties;
      expect(funcProps.Runtime).toBe('python3.11');
    });

    test('Lambda should be in VPC', () => {
      const funcProps = template.Resources.PatientAPIFunction.Properties;
      expect(funcProps.VpcConfig).toBeDefined();
      expect(funcProps.VpcConfig.SubnetIds).toBeDefined();
      expect(funcProps.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('Lambda should have environment variables for DB connection', () => {
      const funcProps = template.Resources.PatientAPIFunction.Properties;
      expect(funcProps.Environment).toBeDefined();
      expect(funcProps.Environment.Variables).toBeDefined();

      const envVars = funcProps.Environment.Variables;
      expect(envVars.DB_SECRET_ARN).toBeDefined();
      expect(envVars.DB_HOST).toBeDefined();
      expect(envVars.DB_PORT).toBeDefined();
      expect(envVars.DB_NAME).toBeDefined();
    });

    test('Lambda execution role should have Secrets Manager access', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      expect(roleProps.Policies).toBeDefined();

      const policies = roleProps.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
    });

    test('Lambda log group should be encrypted', () => {
      const logGroupProps = template.Resources.LambdaLogGroup.Properties;
      expect(logGroupProps.KmsKeyId).toBeDefined();
    });

    test('Lambda log group should have retention period', () => {
      const logGroupProps = template.Resources.LambdaLogGroup.Properties;
      expect(logGroupProps.RetentionInDays).toBe(7);
    });
  });

  describe('API Gateway - HIPAA Compliance', () => {
    test('should create REST API', () => {
      expect(template.Resources.PatientAPI).toBeDefined();
      expect(template.Resources.PatientAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should create API Gateway resource', () => {
      expect(template.Resources.ApiGatewayResource).toBeDefined();
      expect(template.Resources.ApiGatewayResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should create API Gateway method with IAM authorization', () => {
      expect(template.Resources.ApiGatewayMethodANY).toBeDefined();
      expect(template.Resources.ApiGatewayMethodANY.Type).toBe('AWS::ApiGateway::Method');

      const methodProps = template.Resources.ApiGatewayMethodANY.Properties;
      expect(methodProps.AuthorizationType).toBe('AWS_IAM');
    });

    test('should create API Gateway deployment', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should create API Gateway stage with logging', () => {
      expect(template.Resources.ApiGatewayStage).toBeDefined();
      expect(template.Resources.ApiGatewayStage.Type).toBe('AWS::ApiGateway::Stage');

      const stageProps = template.Resources.ApiGatewayStage.Properties;
      expect(stageProps.AccessLogSetting).toBeDefined();
      expect(stageProps.MethodSettings).toBeDefined();
    });

    test('should create CloudWatch log group for API Gateway', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('API Gateway stage should have logging level INFO', () => {
      const stageProps = template.Resources.ApiGatewayStage.Properties;
      const methodSettings = stageProps.MethodSettings;
      expect(methodSettings[0].LoggingLevel).toBe('INFO');
    });

    test('API Gateway stage should have data trace enabled', () => {
      const stageProps = template.Resources.ApiGatewayStage.Properties;
      const methodSettings = stageProps.MethodSettings;
      expect(methodSettings[0].DataTraceEnabled).toBe(true);
    });

    test('should create Lambda invoke permission for API Gateway', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('API Gateway log group should be encrypted', () => {
      const logGroupProps = template.Resources.ApiGatewayLogGroup.Properties;
      expect(logGroupProps.KmsKeyId).toBeDefined();
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VPC name should include EnvironmentSuffix', () => {
      const vpcTags = template.Resources.VPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'patient-api-vpc-${EnvironmentSuffix}'
      });
    });

    test('RDS instance identifier should include EnvironmentSuffix', () => {
      const dbProps = template.Resources.PatientDatabase.Properties;
      expect(dbProps.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'patient-db-${EnvironmentSuffix}'
      });
    });

    test('Lambda function name should include EnvironmentSuffix', () => {
      const funcProps = template.Resources.PatientAPIFunction.Properties;
      expect(funcProps.FunctionName).toEqual({
        'Fn::Sub': 'patient-api-function-${EnvironmentSuffix}'
      });
    });

    test('API Gateway name should include EnvironmentSuffix', () => {
      const apiProps = template.Resources.PatientAPI.Properties;
      expect(apiProps.Name).toEqual({
        'Fn::Sub': 'patient-api-${EnvironmentSuffix}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have API endpoint output', () => {
      expect(template.Outputs.APIEndpoint).toBeDefined();
      expect(template.Outputs.APIEndpoint.Description).toContain('API Gateway endpoint');
    });

    test('should have RDS endpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Description).toContain('RDS');
    });

    test('should have Lambda function ARN output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('should have security group IDs output', () => {
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
      expect(template.Outputs.LambdaSecurityGroupId).toBeDefined();
    });

    test('should have DB secret ARN output', () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
    });

    test('outputs should have export names with EnvironmentSuffix', () => {
      const apiEndpointOutput = template.Outputs.APIEndpoint;
      expect(apiEndpointOutput.Export).toBeDefined();
      expect(apiEndpointOutput.Export.Name).toEqual({
        'Fn::Sub': 'patient-api-endpoint-${EnvironmentSuffix}'
      });
    });
  });

  describe('HIPAA Compliance Validation', () => {
    test('should have encryption at rest for all data stores', () => {
      expect(template.Resources.PatientDatabase.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.LambdaLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have audit logging enabled', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.PatientDatabase.Properties.EnableCloudwatchLogsExports).toBeDefined();
    });

    test('should have network isolation for database', () => {
      expect(template.Resources.PatientDatabase.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.DBSubnetGroup).toBeDefined();
    });

    test('should have IAM authorization for API access', () => {
      expect(template.Resources.ApiGatewayMethodANY.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    test('should use customer-managed KMS keys', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.LogsKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
      expect(template.Resources.LogsKMSKey.Properties.EnableKeyRotation).toBe(true);
    });
  });

  describe('Cost Optimization', () => {
    test('should use VPC endpoints instead of NAT Gateway', () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
      expect(template.Resources.SecretsManagerVPCEndpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('should use small RDS instance class', () => {
      expect(template.Resources.PatientDatabase.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('should have reasonable log retention', () => {
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(7);
      expect(template.Resources.ApiGatewayLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });
});

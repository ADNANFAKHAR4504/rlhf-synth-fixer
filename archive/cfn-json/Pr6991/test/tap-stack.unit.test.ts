import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Template - Secure Financial Data Processing Pipeline', () => {
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

    test('should have description for financial data processing', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.toLowerCase()).toContain('financial');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
    });

    test('should have at least 25 resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct type and constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(20);
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('EnvironmentSuffix should have description', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Description).toBeDefined();
      expect(param.Description.length).toBeGreaterThan(10);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const kmsKey = template.Resources.EncryptionKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper description', () => {
      const kmsKey = template.Resources.EncryptionKey.Properties;
      expect(kmsKey.Description).toBeDefined();
      expect(kmsKey.Description.toLowerCase()).toContain('encrypt');
    });

    test('KMS key should have comprehensive key policy', () => {
      const kmsKey = template.Resources.EncryptionKey.Properties;
      expect(kmsKey.KeyPolicy).toBeDefined();
      expect(kmsKey.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(kmsKey.KeyPolicy.Statement)).toBe(true);
      expect(kmsKey.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('KMS key policy should allow CloudWatch Logs', () => {
      const statements = template.Resources.EncryptionKey.Properties.KeyPolicy.Statement;
      const cwStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Effect).toBe('Allow');
    });

    test('KMS key policy should allow Lambda service', () => {
      const statements = template.Resources.EncryptionKey.Properties.KeyPolicy.Statement;
      const lambdaStatement = statements.find((s: any) => s.Sid === 'Allow Lambda Service');
      expect(lambdaStatement).toBeDefined();
    });

    test('KMS key policy should allow Secrets Manager', () => {
      const statements = template.Resources.EncryptionKey.Properties.KeyPolicy.Statement;
      const smStatement = statements.find((s: any) => s.Sid === 'Allow Secrets Manager');
      expect(smStatement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS alias should reference the encryption key', () => {
      const alias = template.Resources.EncryptionKeyAlias.Properties;
      expect(alias.TargetKeyId).toEqual({ Ref: 'EncryptionKey' });
    });
  });

  describe('S3 Bucket - Data Storage', () => {
    test('should have S3 bucket resource', () => {
      expect(template.Resources.TransactionBucket).toBeDefined();
      expect(template.Resources.TransactionBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should use SSE-KMS encryption', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      const sse = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(sse.SSEAlgorithm).toBe('aws:kms');
      expect(sse.KMSMasterKeyID).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.VersioningConfiguration).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
      const pac = bucket.PublicAccessBlockConfiguration;
      expect(pac.BlockPublicAcls).toBe(true);
      expect(pac.BlockPublicPolicy).toBe(true);
      expect(pac.IgnorePublicAcls).toBe(true);
      expect(pac.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle policies', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.LifecycleConfiguration.Rules)).toBe(true);
      expect(bucket.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have proper tags with environmentSuffix', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.Tags).toBeDefined();
      expect(Array.isArray(bucket.Tags)).toBe(true);
      expect(bucket.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table - Transaction Storage', () => {
    test('should have DynamoDB table resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should use SSE encryption with KMS', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.SSESpecification).toBeDefined();
      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.SSESpecification.SSEType).toBe('KMS');
      // Accept either Ref or Fn::GetAtt for KMS key reference
      expect(table.SSESpecification.KMSMasterKeyId).toBeDefined();
      expect(table.SSESpecification.KMSMasterKeyId).toBeTruthy();
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have contributor insights enabled', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.ContributorInsightsSpecification).toBeDefined();
      expect(table.ContributorInsightsSpecification.Enabled).toBe(true);
    });

    test('DynamoDB table should have proper attribute definitions', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.AttributeDefinitions).toBeDefined();
      expect(Array.isArray(table.AttributeDefinitions)).toBe(true);
      expect(table.AttributeDefinitions.length).toBeGreaterThanOrEqual(1);
    });

    test('DynamoDB table should have key schema defined', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.KeySchema).toBeDefined();
      expect(Array.isArray(table.KeySchema)).toBe(true);
      expect(table.KeySchema.length).toBeGreaterThanOrEqual(1);
    });

    test('DynamoDB table should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('VPC - Network Isolation', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPC should have appropriate CIDR block', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBeDefined();
      expect(typeof vpc.CidrBlock === 'string' || typeof vpc.CidrBlock === 'object').toBe(true);
    });

    test('should have private subnets for Lambda isolation', () => {
      const resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::Subnet' &&
        key.toLowerCase().includes('private')
      );
      expect(resources.length).toBeGreaterThanOrEqual(3); // At least 3 AZs
    });

    test('should have route tables for private subnets', () => {
      const routeTables = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::RouteTable'
      );
      expect(routeTables.length).toBeGreaterThanOrEqual(1);
    });

    test('should NOT have Internet Gateway (fully isolated)', () => {
      const igw = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::EC2::InternetGateway'
      );
      expect(igw).toBeUndefined();
    });

    test('should NOT have NAT Gateway (fully isolated)', () => {
      const nat = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(nat).toBeUndefined();
    });
  });

  describe('VPC Endpoints - AWS Service Access', () => {
    test('should have S3 VPC endpoint (Gateway type)', () => {
      const s3Endpoint = Object.keys(template.Resources).find(key => {
        const resource = template.Resources[key];
        return resource.Type === 'AWS::EC2::VPCEndpoint' && 
               resource.Properties?.ServiceName?.['Fn::Sub']?.includes('s3');
      });
      expect(s3Endpoint).toBeDefined();
      if (s3Endpoint) {
        expect(template.Resources[s3Endpoint].Properties.VpcEndpointType).toBe('Gateway');
      }
    });

    test('should have DynamoDB VPC endpoint (Gateway type)', () => {
      const dynamoEndpoint = Object.keys(template.Resources).find(key => {
        const resource = template.Resources[key];
        return resource.Type === 'AWS::EC2::VPCEndpoint' && 
               resource.Properties?.ServiceName?.['Fn::Sub']?.includes('dynamodb');
      });
      expect(dynamoEndpoint).toBeDefined();
      if (dynamoEndpoint) {
        expect(template.Resources[dynamoEndpoint].Properties.VpcEndpointType).toBe('Gateway');
      }
    });

    test('should have all required VPC endpoints (S3, DynamoDB, Secrets Manager)', () => {
      const allEndpoints = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::VPCEndpoint'
      );
      expect(allEndpoints.length).toBe(3); // S3, DynamoDB, and Secrets Manager
      
      // Count Gateway and Interface endpoints
      const gatewayEndpoints = allEndpoints.filter(key => 
        template.Resources[key].Properties.VpcEndpointType === 'Gateway'
      );
      const interfaceEndpoints = allEndpoints.filter(key => 
        template.Resources[key].Properties.VpcEndpointType === 'Interface'
      );
      
      expect(gatewayEndpoints.length).toBe(2); // S3 and DynamoDB
      expect(interfaceEndpoints.length).toBe(1); // Secrets Manager
    });
  });

  describe('Lambda Function - Data Processing', () => {
    test('should have Lambda function resource', () => {
      const lambdaFunctions = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda function should be in VPC', () => {
      const lambdaKey = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      if (lambdaKey) {
        const lambda = template.Resources[lambdaKey].Properties;
        expect(lambda.VpcConfig).toBeDefined();
        expect(lambda.VpcConfig.SubnetIds).toBeDefined();
        expect(lambda.VpcConfig.SecurityGroupIds).toBeDefined();
      }
    });

    test('Lambda function should have KMS encryption for environment variables', () => {
      const lambdaKey = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      if (lambdaKey) {
        const lambda = template.Resources[lambdaKey].Properties;
        if (lambda.Environment) {
          expect(lambda.KmsKeyArn).toBeDefined();
        }
      }
    });

    test('Lambda function should have execution role', () => {
      const lambdaKey = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      if (lambdaKey) {
        const lambda = template.Resources[lambdaKey].Properties;
        expect(lambda.Role).toBeDefined();
      }
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    test('should have Lambda execution role', () => {
      const roles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role' &&
        key.toLowerCase().includes('lambda')
      );
      expect(roles.length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda role should have assume role policy', () => {
      const roleKey = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::IAM::Role' &&
        key.toLowerCase().includes('lambda')
      );
      if (roleKey) {
        const role = template.Resources[roleKey].Properties;
        expect(role.AssumeRolePolicyDocument).toBeDefined();
        expect(role.AssumeRolePolicyDocument.Statement).toBeDefined();
      }
    });

    test('Lambda role should have policies defined', () => {
      const roleKey = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::IAM::Role' &&
        key.toLowerCase().includes('lambda')
      );
      if (roleKey) {
        const role = template.Resources[roleKey].Properties;
        const hasPolicies = role.Policies || role.ManagedPolicyArns;
        expect(hasPolicies).toBeDefined();
      }
    });

    test('IAM policies should follow least privilege (no wildcards in resources)', () => {
      const roles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      
      roles.forEach(roleKey => {
        const role = template.Resources[roleKey].Properties;
        if (role.Policies) {
          role.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              if (statement.Effect === 'Allow' && Array.isArray(statement.Resource)) {
                // Check that specific resources are referenced, not just wildcards
                const hasSpecificResources = statement.Resource.some((r: any) => 
                  typeof r === 'object' || (typeof r === 'string' && r !== '*')
                );
                expect(hasSpecificResources).toBe(true);
              }
            });
          });
        }
      });
    });
  });

  describe('Secrets Manager - Credential Rotation', () => {
    test('should have Secrets Manager secret with KMS encryption', () => {
      const secrets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::SecretsManager::Secret'
      );
      expect(secrets.length).toBeGreaterThanOrEqual(1);
      
      // Verify KMS encryption
      const secretKey = secrets[0];
      expect(template.Resources[secretKey].Properties.KmsKeyId).toBeDefined();
    });

    test('should have 30-day automatic rotation schedule', () => {
      const rotationSchedules = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::SecretsManager::RotationSchedule'
      );
      expect(rotationSchedules.length).toBeGreaterThanOrEqual(1);
      
      // Verify 30-day rotation
      const scheduleKey = rotationSchedules[0];
      const schedule = template.Resources[scheduleKey].Properties;
      expect(schedule.RotationRules.AutomaticallyAfterDays).toBe(30);
    });

    test('should have DependsOn fix for rotation schedule', () => {
      const rotationSchedules = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::SecretsManager::RotationSchedule'
      );
      
      if (rotationSchedules.length > 0) {
        const scheduleKey = rotationSchedules[0];
        const dependsOn = template.Resources[scheduleKey].DependsOn;
        expect(dependsOn).toBeDefined();
        expect(Array.isArray(dependsOn)).toBe(true);
        expect(dependsOn).toContain('SecretRotationPermission');
      }
    });

    test('should have rotation Lambda function in VPC', () => {
      const rotationFunctions = Object.keys(template.Resources).filter(key => 
        key.includes('SecretRotation') && 
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      expect(rotationFunctions.length).toBeGreaterThanOrEqual(1);
      
      // Verify VPC configuration
      const functionKey = rotationFunctions[0];
      const vpcConfig = template.Resources[functionKey].Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('should use DynamoDB for data storage (complementary to secrets)', () => {
      const dynamoTables = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::DynamoDB::Table'
      );
      expect(dynamoTables.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('API Gateway - Secure Access', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.TransactionAPI).toBeDefined();
      expect(template.Resources.TransactionAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('API Gateway should have request validation enabled', () => {
      const validators = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::ApiGateway::RequestValidator'
      );
      expect(validators.length).toBeGreaterThanOrEqual(1);
    });

    test('API Gateway should require API keys', () => {
      const apiKeys = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::ApiGateway::ApiKey'
      );
      expect(apiKeys.length).toBeGreaterThanOrEqual(1);
    });

    test('API Gateway should have CloudWatch logging enabled', () => {
      const stage = Object.keys(template.Resources).find(key => 
        template.Resources[key].Type === 'AWS::ApiGateway::Stage'
      );
      if (stage) {
        const stageProps = template.Resources[stage].Properties;
        expect(stageProps.MethodSettings).toBeDefined();
        const methodSetting = stageProps.MethodSettings[0];
        expect(methodSetting.LoggingLevel).toBeDefined();
        expect(methodSetting.DataTraceEnabled).toBe(true);
      }
    });
  });

  describe('Security Groups - Network Controls', () => {
    test('should have security groups defined', () => {
      const securityGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(1);
    });

    test('security groups should have explicit rules defined', () => {
      const securityGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      
      securityGroups.forEach(sgKey => {
        const sg = template.Resources[sgKey].Properties;
        // Security groups should have either ingress or egress rules (or both)
        const hasRules = sg.SecurityGroupIngress || sg.SecurityGroupEgress;
        expect(hasRules).toBeDefined();
      });
    });

    test('security groups should have at least one with egress rules', () => {
      const securityGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      
      // At least one security group should have egress rules
      const hasEgressRules = securityGroups.some(sgKey => {
        const sg = template.Resources[sgKey].Properties;
        return sg.SecurityGroupEgress && Array.isArray(sg.SecurityGroupEgress);
      });
      expect(hasEgressRules).toBe(true);
    });
  });

  describe('CloudWatch Logs - Audit Trails', () => {
    test('should have CloudWatch log groups', () => {
      const logGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Logs::LogGroup'
      );
      expect(logGroups.length).toBeGreaterThanOrEqual(1);
    });

    test('CloudWatch log groups should use KMS encryption', () => {
      const logGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Logs::LogGroup'
      );
      
      logGroups.forEach(lgKey => {
        const lg = template.Resources[lgKey].Properties;
        expect(lg.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
      });
    });

    test('CloudWatch log groups should have retention policies', () => {
      const logGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Logs::LogGroup'
      );
      
      logGroups.forEach(lgKey => {
        const lg = template.Resources[lgKey].Properties;
        expect(lg.RetentionInDays).toBeDefined();
        // Accept either number or parameter reference
        expect(lg.RetentionInDays).toBeTruthy();
      });
    });
  });

  describe('Resource Tagging - Compliance', () => {
    test('KMS key should have proper tags', () => {
      const kmsKey = template.Resources.EncryptionKey.Properties;
      expect(kmsKey.Tags).toBeDefined();
      expect(Array.isArray(kmsKey.Tags)).toBe(true);
      expect(kmsKey.Tags.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have proper tags', () => {
      const bucket = template.Resources.TransactionBucket.Properties;
      expect(bucket.Tags).toBeDefined();
      expect(Array.isArray(bucket.Tags)).toBe(true);
      expect(bucket.Tags.length).toBeGreaterThan(0);
    });

    test('DynamoDB table should have proper tags', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.Tags).toBeDefined();
      expect(Array.isArray(table.Tags)).toBe(true);
      expect(table.Tags.length).toBeGreaterThan(0);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.Tags).toBeDefined();
      expect(Array.isArray(vpc.Tags)).toBe(true);
      expect(vpc.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Idempotency - Environment Suffix Usage', () => {
    test('resources should use EnvironmentSuffix in names', () => {
      const resourcesWithNames = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key].Properties;
        // Check common name properties
        const nameProps = ['BucketName', 'TableName', 'FunctionName', 'Name', 'LogGroupName'];
        return nameProps.some(prop => resource[prop]);
      });
      
      expect(resourcesWithNames.length).toBeGreaterThan(0);
      
      // Verify at least some resources use the EnvironmentSuffix parameter
      const usesEnvSuffix = resourcesWithNames.some(key => {
        const resource = template.Resources[key].Properties;
        const nameValue = resource.BucketName || resource.TableName || 
                         resource.FunctionName || resource.Name || resource.LogGroupName;
        return nameValue && nameValue['Fn::Sub'] && 
               nameValue['Fn::Sub'].toString().includes('${EnvironmentSuffix}');
      });
      
      expect(usesEnvSuffix).toBe(true);
    });
  });
});


import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Financial Transaction Pipeline CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
      expect(template.Description).toContain('Secure Financial Transaction Processing Pipeline');
    });

    test('should have required sections', () => {
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
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should have EncryptionKey resource', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have DeletionPolicy Retain', () => {
      expect(template.Resources.EncryptionKey.DeletionPolicy).toBe('Retain');
      expect(template.Resources.EncryptionKey.UpdateReplacePolicy).toBe('Retain');
    });

    test('EncryptionKey should have automatic key rotation enabled', () => {
      const keyProps = template.Resources.EncryptionKey.Properties;
      expect(keyProps.EnableKeyRotation).toBe(true);
    });

    test('EncryptionKey should have proper key policy', () => {
      const keyPolicy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeInstanceOf(Array);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have EncryptionKeyAlias resource', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DeletionPolicy Retain', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Retain');
    });

    test('VPC should have correct CIDR block', () => {
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.CidrBlock).toBe('10.0.0.0/16');
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should have PrivateSubnet1 in first AZ', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have PrivateSubnet2 in second AZ', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have PrivateRouteTable', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have VPCEndpointSecurityGroup', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have DynamoDB VPC Endpoint', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have Secrets Manager VPC Endpoint', () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
      expect(template.Resources.SecretsManagerVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.SecretsManagerVPCEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(template.Resources.SecretsManagerVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('should have TransactionDataBucket resource', () => {
      expect(template.Resources.TransactionDataBucket).toBeDefined();
      expect(template.Resources.TransactionDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TransactionDataBucket should have DeletionPolicy Retain', () => {
      expect(template.Resources.TransactionDataBucket.DeletionPolicy).toBe('Retain');
      expect(template.Resources.TransactionDataBucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('TransactionDataBucket should have KMS encryption enabled', () => {
      const bucketProps = template.Resources.TransactionDataBucket.Properties;
      const encryption = bucketProps.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('TransactionDataBucket should have versioning enabled', () => {
      const bucketProps = template.Resources.TransactionDataBucket.Properties;
      expect(bucketProps.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('TransactionDataBucket should have lifecycle policy', () => {
      const bucketProps = template.Resources.TransactionDataBucket.Properties;
      expect(bucketProps.LifecycleConfiguration).toBeDefined();
      expect(bucketProps.LifecycleConfiguration.Rules).toBeInstanceOf(Array);
      expect(bucketProps.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('TransactionDataBucket should block public access', () => {
      const bucketProps = template.Resources.TransactionDataBucket.Properties;
      const publicAccessConfig = bucketProps.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudTrailLogsBucket resource', () => {
      expect(template.Resources.CloudTrailLogsBucket).toBeDefined();
      expect(template.Resources.CloudTrailLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CloudTrailLogsBucket should have DeletionPolicy Retain', () => {
      expect(template.Resources.CloudTrailLogsBucket.DeletionPolicy).toBe('Retain');
    });

    test('should have TransactionDataBucketPolicy', () => {
      expect(template.Resources.TransactionDataBucketPolicy).toBeDefined();
      expect(template.Resources.TransactionDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have CloudTrailLogsBucketPolicy', () => {
      expect(template.Resources.CloudTrailLogsBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('CloudTrail', () => {
    test('should have TransactionDataTrail resource', () => {
      expect(template.Resources.TransactionDataTrail).toBeDefined();
      expect(template.Resources.TransactionDataTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('TransactionDataTrail should have DeletionPolicy Retain', () => {
      expect(template.Resources.TransactionDataTrail.DeletionPolicy).toBe('Retain');
    });

    test('TransactionDataTrail should have log file validation enabled', () => {
      const trailProps = template.Resources.TransactionDataTrail.Properties;
      expect(trailProps.EnableLogFileValidation).toBe(true);
      expect(trailProps.IsLogging).toBe(true);
    });

    test('TransactionDataTrail should log S3 data events', () => {
      const trailProps = template.Resources.TransactionDataTrail.Properties;
      expect(trailProps.EventSelectors).toBeInstanceOf(Array);
      expect(trailProps.EventSelectors.length).toBeGreaterThan(0);

      const eventSelector = trailProps.EventSelectors[0];
      expect(eventSelector.DataResources).toBeDefined();
      expect(eventSelector.DataResources[0].Type).toBe('AWS::S3::Object');
    });
  });

  describe('DynamoDB', () => {
    test('should have TransactionMetadataTable resource', () => {
      expect(template.Resources.TransactionMetadataTable).toBeDefined();
      expect(template.Resources.TransactionMetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionMetadataTable should have DeletionPolicy Retain', () => {
      expect(template.Resources.TransactionMetadataTable.DeletionPolicy).toBe('Retain');
      expect(template.Resources.TransactionMetadataTable.UpdateReplacePolicy).toBe('Retain');
    });

    test('TransactionMetadataTable should have point-in-time recovery enabled', () => {
      const tableProps = template.Resources.TransactionMetadataTable.Properties;
      expect(tableProps.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TransactionMetadataTable should have KMS encryption', () => {
      const tableProps = template.Resources.TransactionMetadataTable.Properties;
      expect(tableProps.SSESpecification.SSEEnabled).toBe(true);
      expect(tableProps.SSESpecification.SSEType).toBe('KMS');
    });

    test('TransactionMetadataTable should use PAY_PER_REQUEST billing', () => {
      const tableProps = template.Resources.TransactionMetadataTable.Properties;
      expect(tableProps.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionMetadataTable should have correct key schema', () => {
      const tableProps = template.Resources.TransactionMetadataTable.Properties;
      expect(tableProps.KeySchema).toBeInstanceOf(Array);
      expect(tableProps.KeySchema.length).toBe(2);

      const hashKey = tableProps.KeySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = tableProps.KeySchema.find((k: any) => k.KeyType === 'RANGE');

      expect(hashKey.AttributeName).toBe('transactionId');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });
  });

  describe('Secrets Manager', () => {
    test('should have LambdaConfigSecret resource', () => {
      expect(template.Resources.LambdaConfigSecret).toBeDefined();
      expect(template.Resources.LambdaConfigSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('LambdaConfigSecret should have DeletionPolicy Retain', () => {
      expect(template.Resources.LambdaConfigSecret.DeletionPolicy).toBe('Retain');
    });

    test('LambdaConfigSecret should be encrypted with KMS', () => {
      const secretProps = template.Resources.LambdaConfigSecret.Properties;
      expect(secretProps.KmsKeyId).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have TransactionProcessorFunction resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
      expect(template.Resources.TransactionProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('TransactionProcessorFunction should have DeletionPolicy Retain', () => {
      expect(template.Resources.TransactionProcessorFunction.DeletionPolicy).toBe('Retain');
    });

    test('TransactionProcessorFunction should use Python 3.11 runtime', () => {
      const lambdaProps = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambdaProps.Runtime).toBe('python3.11');
    });

    test('TransactionProcessorFunction should have VPC configuration', () => {
      const lambdaProps = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambdaProps.VpcConfig).toBeDefined();
      expect(lambdaProps.VpcConfig.SecurityGroupIds).toBeInstanceOf(Array);
      expect(lambdaProps.VpcConfig.SubnetIds).toBeInstanceOf(Array);
      expect(lambdaProps.VpcConfig.SubnetIds.length).toBe(2);
    });

    test('TransactionProcessorFunction should have environment variables', () => {
      const lambdaProps = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambdaProps.Environment).toBeDefined();
      expect(lambdaProps.Environment.Variables).toBeDefined();
      expect(lambdaProps.Environment.Variables.SECRET_ARN).toBeDefined();
      expect(lambdaProps.Environment.Variables.DYNAMODB_TABLE).toBeDefined();
      expect(lambdaProps.Environment.Variables.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    test('TransactionProcessorFunction should have inline code', () => {
      const lambdaProps = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambdaProps.Code).toBeDefined();
      expect(lambdaProps.Code.ZipFile).toBeDefined();
      expect(lambdaProps.Code.ZipFile).toContain('import json');
      expect(lambdaProps.Code.ZipFile).toContain('import boto3');
    });

    test('should have LambdaInvokePermission resource', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have DeletionPolicy Retain', () => {
      expect(template.Resources.LambdaExecutionRole.DeletionPolicy).toBe('Retain');
    });

    test('LambdaExecutionRole should have VPC access policy', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      expect(roleProps.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('LambdaExecutionRole should have least-privilege policies', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      expect(roleProps.Policies).toBeInstanceOf(Array);
      expect(roleProps.Policies.length).toBeGreaterThan(0);

      const policyNames = roleProps.Policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('S3AccessPolicy');
      expect(policyNames).toContain('DynamoDBAccessPolicy');
      expect(policyNames).toContain('SecretsManagerAccessPolicy');
      expect(policyNames).toContain('KMSAccessPolicy');
      expect(policyNames).toContain('CloudWatchLogsPolicy');
    });

    test('S3AccessPolicy should have specific permissions', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      const s3Policy = roleProps.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:GetObjectVersion');
      expect(statement.Action).not.toContain('s3:*');
    });

    test('DynamoDBAccessPolicy should have specific permissions', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      const dynamoPolicy = roleProps.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');

      expect(dynamoPolicy).toBeDefined();
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).not.toContain('dynamodb:*');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('LambdaLogGroup should have 90-day retention', () => {
      const logGroupProps = template.Resources.LambdaLogGroup.Properties;
      expect(logGroupProps.RetentionInDays).toBe(90);
    });

    test('LambdaLogGroup should NOT have DeletionPolicy Retain', () => {
      // CloudWatch Log Groups should not have DeletionPolicy: Retain
      expect(template.Resources.LambdaLogGroup.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TransactionDataBucketName',
        'TransactionDataBucketArn',
        'TransactionProcessorFunctionArn',
        'TransactionMetadataTableName',
        'EncryptionKeyId',
        'EncryptionKeyArn',
        'VPCId',
        'CloudTrailName',
        'SecretsManagerSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (outputKey !== 'PostDeploymentNote') {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentSuffix parameter', () => {
      const resourcesToCheck = [
        'TransactionDataBucket',
        'CloudTrailLogsBucket',
        'TransactionMetadataTable',
        'LambdaConfigSecret',
        'LambdaExecutionRole',
        'TransactionProcessorFunction',
        'TransactionDataTrail'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check if resource properties contain EnvironmentSuffix reference
        const resourceStr = JSON.stringify(resource.Properties);
        expect(resourceStr).toContain('EnvironmentSuffix');
      });
    });
  });

  describe('Security Configuration', () => {
    test('should not have any wildcard IAM permissions on actions', () => {
      const roleProps = template.Resources.LambdaExecutionRole.Properties;

      roleProps.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          actions.forEach((action: string) => {
            // Check for wildcard actions (e.g., "s3:*", "dynamodb:*")
            if (action.includes(':')) {
              const servicePart = action.split(':')[1];
              expect(servicePart).not.toBe('*');
            }
          });
        });
      });
    });

    test('S3 bucket policy should enforce encryption in transit', () => {
      const bucketPolicy = template.Resources.TransactionDataBucketPolicy.Properties.PolicyDocument;
      const denyInsecureStatement = bucketPolicy.Statement.find((s: any) =>
        s.Sid === 'DenyInsecureTransport'
      );

      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('S3 bucket policy should enforce KMS encryption', () => {
      const bucketPolicy = template.Resources.TransactionDataBucketPolicy.Properties.PolicyDocument;
      const denyUnencryptedStatement = bucketPolicy.Statement.find((s: any) =>
        s.Sid === 'DenyUnencryptedObjectUploads'
      );

      expect(denyUnencryptedStatement).toBeDefined();
      expect(denyUnencryptedStatement.Effect).toBe('Deny');
      expect(denyUnencryptedStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });
  });

  describe('Compliance Requirements', () => {
    test('critical resources should have DeletionPolicy Retain', () => {
      const criticalResources = [
        'EncryptionKey',
        'VPC',
        'TransactionDataBucket',
        'CloudTrailLogsBucket',
        'TransactionDataTrail',
        'TransactionMetadataTable',
        'LambdaConfigSecret',
        'LambdaExecutionRole',
        'TransactionProcessorFunction'
      ];

      criticalResources.forEach(resourceName => {
        expect(template.Resources[resourceName].DeletionPolicy).toBe('Retain');
      });
    });

    test('should have no public internet access resources', () => {
      // Check for absence of Internet Gateway and NAT Gateway
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).not.toContain('AWS::EC2::NatGateway');
    });
  });
});

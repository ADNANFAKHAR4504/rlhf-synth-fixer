
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
      expect(template.Description).toBe(
        'Regulatory Reporting Platform - Orchestrates ~2000 daily reports with validation, audit, and 10-year S3 retention. Uses Aurora Serverless V2 and Secrets Manager.'
      );
    });
  });

  describe('Parameters', () => {
    const expectedParameters = {
      Environment: {
        Type: 'String',
        Default: 'prod',
        AllowedValues: ['prod', 'staging', 'dev'],
        Description: 'Deployment environment.',
      },
      NotificationEmail: {
        Type: 'String',
        Description: 'Email for CloudWatch alarm notifications (e.g., failed report delivery).',
        Default: 'govardhan.y@turing.com',
      },
      DatabaseMasterUsername: {
        Type: 'String',
        Default: 'reportadmin',
        NoEcho: true,
        Description: 'Master username for Aurora database.',
      },
      DatabaseMasterPassword: {
        Type: 'String',
        NoEcho: true,
        MinLength: 8,
        Default: 'TempPassword123!',
        Description: 'Master password for Aurora database.',
      },
      DailyScheduleExpression: {
        Type: 'String',
        Default: 'cron(0 10 * * ? *)',
        Description: 'Cron expression for daily report generation (e.g., 10:00 AM UTC).',
      },
      SenderEmailAddress: {
        Type: 'String',
        Description: 'SES verified email address for sending reports and notifications.',
        Default: 'govardhan.y@turing.com',
      },
      BucketNamePrefix: {
        Type: 'String',
        Default: 'tap-stack',
        Description: 'Prefix for S3 bucket names. Must be lowercase.',
      },
    };

    test('should have all required parameters', () => {
      Object.keys(expectedParameters).forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    Object.entries(expectedParameters).forEach(([paramName, paramProps]) => {
      test(`${paramName} parameter should have correct properties`, () => {
        const param = template.Parameters[paramName];
        expect(param).toEqual(paramProps);
      });
    });
  });

  describe('Resources', () => {
    describe('KMSKey', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.KMSKey;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::KMS::Key');
        expect(resource.Properties.KeyUsage).toBe('ENCRYPT_DECRYPT');
      });

      test('should have a key policy that allows root access and account-wide use', () => {
        const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
        expect(keyPolicy.Statement).toHaveLength(2);
        expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
        expect(keyPolicy.Statement[0].Effect).toBe('Allow');
        expect(keyPolicy.Statement[0].Principal.AWS).toEqual({
          'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
        });
        expect(keyPolicy.Statement[0].Action).toBe('kms:*');
        expect(keyPolicy.Statement[0].Resource).toBe('*');

        expect(keyPolicy.Statement[1].Sid).toBe('Allow Key Use By Account Resources');
        expect(keyPolicy.Statement[1].Effect).toBe('Allow');
        expect(keyPolicy.Statement[1].Principal.AWS).toBe('*');
        expect(keyPolicy.Statement[1].Action).toEqual([
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ]);
        expect(keyPolicy.Statement[1].Resource).toBe('*');
        expect(keyPolicy.Statement[1].Condition.StringEquals['kms:CallerAccount']).toEqual({ Ref: 'AWS::AccountId' });
      });
    });

    describe('ReportsBucket', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.ReportsBucket;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::Bucket');
        expect(resource.Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(resource.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(3650);
        expect(resource.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    describe('ReportsBucketPolicy', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.ReportsBucketPolicy;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should allow Lambda access and deny unencrypted uploads', () => {
        const policy = template.Resources.ReportsBucketPolicy.Properties.PolicyDocument;
        expect(policy.Statement).toHaveLength(2);

        const lambdaAccessStatement = policy.Statement[0];
        expect(lambdaAccessStatement.Sid).toBe('AllowLambdaAccess');
        expect(lambdaAccessStatement.Effect).toBe('Allow');
        expect(lambdaAccessStatement.Principal).toEqual({ 'AWS': { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] } });
        expect(lambdaAccessStatement.Action).toEqual(['s3:GetObject', 's3:PutObject', 's3:DeleteObject']);
        expect(lambdaAccessStatement.Resource).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${ReportsBucket}/*' });

        const denyUnencryptedStatement = policy.Statement[1];
        expect(denyUnencryptedStatement.Sid).toBe('DenyUnencryptedObjectUploads');
        expect(denyUnencryptedStatement.Effect).toBe('Deny');
        expect(denyUnencryptedStatement.Principal).toBe('*');
        expect(denyUnencryptedStatement.Action).toBe('s3:PutObject');
        expect(denyUnencryptedStatement.Resource).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${ReportsBucket}/*' });
        expect(denyUnencryptedStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
      });
    });

    describe('AuroraSecret', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuroraSecret;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::SecretsManager::Secret');
        expect(resource.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      });
    });

    describe('AuroraCluster', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuroraCluster;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::RDS::DBCluster');
        expect(resource.Properties.Engine).toBe('aurora-postgresql');
        expect(resource.Properties.EngineMode).toBe('provisioned');
        expect(resource.Properties.StorageEncrypted).toBe(true);
        expect(resource.Properties.BackupRetentionPeriod).toBe(7);
        expect(resource.Properties.ServerlessV2ScalingConfiguration).toEqual({ MinCapacity: 0.5, MaxCapacity: 4.0 });
      });
    });

    describe('AuroraInstance', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuroraInstance;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::RDS::DBInstance');
        expect(resource.Properties.DBInstanceClass).toBe('db.serverless');
      });
    });

    describe('VPC', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.VPC;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::EC2::VPC');
        expect(resource.Properties.CidrBlock).toBe('10.0.0.0/16');
      });
    });

    describe('Subnets', () => {
      test('should have SubnetA defined with correct properties', () => {
        const resource = template.Resources.SubnetA;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::EC2::Subnet');
        expect(resource.Properties.CidrBlock).toBe('10.0.1.0/24');
      });

      test('should have SubnetB defined with correct properties', () => {
        const resource = template.Resources.SubnetB;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::EC2::Subnet');
        expect(resource.Properties.CidrBlock).toBe('10.0.2.0/24');
      });
    });

    describe('AuroraDBSubnetGroup', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuroraDBSubnetGroup;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::RDS::DBSubnetGroup');
        expect(resource.Properties.SubnetIds).toHaveLength(2);
      });
    });

    describe('AuroraSecurityGroup', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuroraSecurityGroup;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
        const ingressRule = resource.Properties.SecurityGroupIngress[0];
        expect(ingressRule.IpProtocol).toBe('tcp');
        expect(ingressRule.FromPort).toBe(5432);
        expect(ingressRule.ToPort).toBe(5432);
        expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
      });
    });

    describe('LambdaSecurityGroup', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.LambdaSecurityGroup;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    describe('LambdaExecutionRole', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.LambdaExecutionRole;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::IAM::Role');
        expect(resource.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      });

      test('should have a policy with correct permissions', () => {
        const policy = template.Resources.LambdaExecutionRole.Properties.Policies[0].PolicyDocument;
        expect(policy.Statement).toHaveLength(6);

        const logStatement = policy.Statement[0];
        expect(logStatement.Effect).toBe('Allow');
        expect(logStatement.Action).toEqual(['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents']);
        expect(logStatement.Resource).toBe('arn:aws:logs:*:*:*');

        const s3Statement = policy.Statement[1];
        expect(s3Statement.Effect).toBe('Allow');
        expect(s3Statement.Action).toEqual(['s3:PutObject', 's3:GetObject']);

        const sesStatement = policy.Statement[2];
        expect(sesStatement.Effect).toBe('Allow');
        expect(sesStatement.Action).toBe('ses:SendEmail');

        const kmsStatement = policy.Statement[3];
        expect(kmsStatement.Effect).toBe('Allow');
        expect(kmsStatement.Action).toBe('kms:Decrypt');

        const rdsStatement = policy.Statement[4];
        expect(rdsStatement.Effect).toBe('Allow');
        expect(rdsStatement.Action).toBe('rds-data:*');

        const secretsManagerStatement = policy.Statement[5];
        expect(secretsManagerStatement.Effect).toBe('Allow');
        expect(secretsManagerStatement.Action).toBe('secretsmanager:GetSecretValue');
      });
    });

    describe('StepFunctionsExecutionRole', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.StepFunctionsExecutionRole;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::IAM::Role');
      });

      test('should have a policy that allows invoking Lambda functions', () => {
        const policy = template.Resources.StepFunctionsExecutionRole.Properties.Policies[0].PolicyDocument;
        const statement = policy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBe('lambda:InvokeFunction');
        expect(statement.Resource).toHaveLength(6);
      });
    });

    describe('Lambdas', () => {
      test('should have GenerateReportLambda defined with correct properties', () => {
        const resource = template.Resources.GenerateReportLambda;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Lambda::Function');
        expect(resource.Properties.Runtime).toBe('python3.12');
      });

      test('should have ValidateReportLambda defined with correct properties', () => {
        const resource = template.Resources.ValidateReportLambda;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Lambda::Function');
        expect(resource.Properties.Runtime).toBe('python3.12');
      });

      test('should have DeliverReportLambda defined with correct properties', () => {
        const resource = template.Resources.DeliverReportLambda;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Lambda::Function');
        expect(resource.Properties.Runtime).toBe('python3.12');
      });
    });

    describe('ReportingStateMachine', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.ReportingStateMachine;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::StepFunctions::StateMachine');
      });

      test('should have a valid state machine definition', () => {
        const definitionString = template.Resources.ReportingStateMachine.Properties.DefinitionString['Fn::Sub'][0];
        const definition = JSON.parse(definitionString.replace(/\n/g, ''));
        expect(definition.StartAt).toBe('GenerateReport');
        expect(Object.keys(definition.States)).toHaveLength(7);
      });
    });

    describe('DailyScheduler', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.DailyScheduler;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Events::Rule');
        expect(resource.Properties.State).toBe('ENABLED');
      });
    });

    describe('EventBridgeRole', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.EventBridgeRole;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::IAM::Role');
        const statement = resource.Properties.Policies[0].PolicyDocument.Statement[0];
        expect(statement.Action).toBe('states:StartExecution');
      });
    });

    describe('SNSTopic', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.SNSTopic;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::SNS::Topic');
      });
    });

    describe('FailureAlarm', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.FailureAlarm;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
        expect(resource.Properties.Namespace).toBe('AWS/States');
        expect(resource.Properties.MetricName).toBe('ExecutionsFailed');
        expect(resource.Properties.Threshold).toBe('200');
      });
    });

    describe('AuditTrailBucket', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuditTrailBucket;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::Bucket');
      });
    });

    describe('AuditTrailBucketPolicy', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuditTrailBucketPolicy;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::BucketPolicy');
        const policy = resource.Properties.PolicyDocument;
        expect(policy.Statement).toHaveLength(3);
        const statement1 = policy.Statement[0];
        expect(statement1.Action).toBe('s3:GetBucketAcl');
        const statement2 = policy.Statement[1];
        expect(statement2.Action).toBe('s3:ListBucket');
        const statement3 = policy.Statement[2];
        expect(statement3.Action).toBe('s3:PutObject');
      });
    });

    describe('AuditingTrail', () => {
      test('should be defined and have correct properties', () => {
        const resource = template.Resources.AuditingTrail;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::CloudTrail::Trail');
        expect(resource.Properties.IsLogging).toBe(true);
        expect(resource.Properties.IncludeGlobalServiceEvents).toBe(true);
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'ReportsBucketName',
      'StateMachineArn',
      'AuroraClusterEndpoint',
      'SNSTopicArn',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ReportsBucketName output should be correct', () => {
      const output = template.Outputs.ReportsBucketName;
      expect(output.Description).toBe('S3 bucket for storing regulatory reports (versioned, 10-year retention)');
      expect(output.Value).toEqual({ Ref: 'ReportsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ReportsBucket',
      });
    });

    test('StateMachineArn output should be correct', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Description).toBe('ARN of the regulatory reporting Step Functions state machine');
      expect(output.Value).toEqual({ Ref: 'ReportingStateMachine' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StateMachineArn',
      });
    });

    test('AuroraClusterEndpoint output should be correct', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output.Description).toBe('Aurora Serverless v2 cluster endpoint for read/write access');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DBEndpoint',
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('SNS topic for CloudWatch failure alerts');
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopicArn',
      });
    });
  });

  describe('Template Validation', () => {
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });
});

// Additional Comprehensive Unit Tests
describe('TapStack CloudFormation Template - Comprehensive Coverage', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Metadata and Structure Validation', () => {
    test('should have regulatory reporting description with key requirements', () => {
      const description = template.Description;
      expect(description).toContain('Regulatory Reporting Platform');
      expect(description).toContain('~2000 daily reports');
      expect(description).toContain('10-year S3 retention');
      expect(description).toContain('Aurora Serverless V2');
      expect(description).toContain('Secrets Manager');
    });

    test('should have exactly 25 resources defined', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25);
    });

    test('should have exactly 7 parameters defined', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have exactly 7 outputs defined', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Enhanced Parameters Validation', () => {
    test('Environment parameter should have correct configuration', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['prod', 'staging', 'dev']);
      expect(param.Description).toContain('Deployment environment');
    });

    test('DatabaseMasterPassword parameter should have security and validation', () => {
      const param = template.Parameters.DatabaseMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.Default).toBe('TempPassword123!');
      expect(param.Description).toContain('Master password for Aurora database');
    });

    test('DailyScheduleExpression parameter should have cron configuration', () => {
      const param = template.Parameters.DailyScheduleExpression;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cron(0 10 * * ? *)');
      expect(param.Description).toContain('10:00 AM UTC');
    });

    test('SenderEmailAddress parameter should have SES configuration', () => {
      const param = template.Parameters.SenderEmailAddress;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('govardhan.y@turing.com');
      expect(param.Description).toContain('SES verified email address');
    });

    test('BucketNamePrefix parameter should have S3 naming rules', () => {
      const param = template.Parameters.BucketNamePrefix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tap-stack');
      expect(param.Description).toContain('lowercase');
    });
  });

  describe('Enhanced S3 Storage Resources', () => {
    test('ReportsBucket should have regulatory compliance configuration', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      // Bucket naming
      expect(bucket.Properties.BucketName['Fn::Sub']).toBe('${BucketNamePrefix}-reports-${Environment}-${AWS::AccountId}');

      // Encryption configuration
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });

      // Versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Lifecycle - 10 year retention (3650 days)
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycleRule.Id).toBe('RetentionRule');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(3650);
      expect(lifecycleRule.NoncurrentVersionExpirationInDays).toBe(3650);
      expect(lifecycleRule.AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(7);

      // Security
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      });

      // Ownership
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerEnforced');
    });
  });

  describe('Enhanced Database Resources', () => {
    test('AuroraSecret should be properly configured with KMS encryption', () => {
      const secret = template.Resources.AuroraSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Description).toEqual({
        'Fn::Sub': '${AWS::StackName}-Aurora-Master-Credentials'
      });
      expect(secret.Properties.SecretString).toEqual({
        'Fn::Sub': '{"username":"${DatabaseMasterUsername}","password":"${DatabaseMasterPassword}"}'
      });
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('AuroraCluster should have Serverless V2 and security configuration', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');

      // Engine configuration
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
      expect(cluster.Properties.DBClusterParameterGroupName).toBe('default.aurora-postgresql17');

      // Master user configuration
      expect(cluster.Properties.MasterUsername).toEqual({ Ref: 'DatabaseMasterUsername' });
      expect(cluster.Properties.MasterUserSecret).toEqual({
        SecretArn: { Ref: 'AuroraSecret' }
      });
      expect(cluster.Properties.ManageMasterUserPassword).toBe(true);

      // Database
      expect(cluster.Properties.DatabaseName).toBe('reportingdb');

      // Serverless V2 scaling
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toEqual({
        MinCapacity: 0.5,
        MaxCapacity: 4.0
      });

      // Security
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);

      // Networking
      expect(cluster.Properties.VpcSecurityGroupIds).toEqual([{ Ref: 'AuroraSecurityGroup' }]);
      expect(cluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'AuroraDBSubnetGroup' });
    });
  });

  describe('Enhanced Networking Resources', () => {
    test('VPC should have DNS support and hostnames enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags[0].Key).toBe('Name');
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC'
      });
    });

    test('Subnets should be in different AZs with correct CIDR blocks', () => {
      const subnetA = template.Resources.SubnetA;
      const subnetB = template.Resources.SubnetB;

      // SubnetA configuration
      expect(subnetA.Type).toBe('AWS::EC2::Subnet');
      expect(subnetA.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnetA.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });

      // SubnetB configuration
      expect(subnetB.Type).toBe('AWS::EC2::Subnet');
      expect(subnetB.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnetB.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });

      // Both should reference the VPC
      expect(subnetA.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnetB.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Security groups should have proper ingress rules', () => {
      const auroraSecurityGroup = template.Resources.AuroraSecurityGroup;
      const lambdaSecurityGroup = template.Resources.LambdaSecurityGroup;

      // Aurora security group
      expect(auroraSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(auroraSecurityGroup.Properties.GroupDescription).toBe('Security group for Aurora');
      expect(auroraSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const auroraIngressRule = auroraSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(auroraIngressRule.IpProtocol).toBe('tcp');
      expect(auroraIngressRule.FromPort).toBe(5432);
      expect(auroraIngressRule.ToPort).toBe(5432);
      expect(auroraIngressRule.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });

      // Lambda security group
      expect(lambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lambdaSecurityGroup.Properties.GroupDescription).toBe('Security group for Lambda functions (to access Aurora)');
      expect(lambdaSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Enhanced Lambda Functions', () => {
    const testLambdaFunction = (resourceName: string, handler: string) => {
      const lambda = template.Resources[resourceName];
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Handler).toBe(handler);
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });

      // VPC Configuration
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toEqual([{ Ref: 'LambdaSecurityGroup' }]);
      expect(lambda.Properties.VpcConfig.SubnetIds).toEqual([{ Ref: 'SubnetA' }, { Ref: 'SubnetB' }]);

      // Code should be defined
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile.length).toBeGreaterThan(0);
    };

    test('GenerateReportLambda should have correct configuration', () => {
      testLambdaFunction('GenerateReportLambda', 'index.handler');

      // Verify code contains key functionality
      const code = template.Resources.GenerateReportLambda.Properties.Code.ZipFile;
      expect(code).toContain('report_id');
      expect(code).toContain('jurisdiction');
      expect(code).toContain('REG_FORM_49');
    });

    test('ValidateReportLambda should have correct configuration', () => {
      testLambdaFunction('ValidateReportLambda', 'index.handler');

      // Verify code contains validation logic
      const code = template.Resources.ValidateReportLambda.Properties.Code.ZipFile;
      expect(code).toContain('validation_errors');
      expect(code).toContain('entity_name');
      expect(code).toContain('transaction_count');
      expect(code).toContain('total_value');
    });

    test('DeliverReportLambda should have correct configuration and environment variables', () => {
      testLambdaFunction('DeliverReportLambda', 'index.handler');

      const lambda = template.Resources.DeliverReportLambda;

      // Environment variables
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.REPORTS_BUCKET_NAME).toEqual({ Ref: 'ReportsBucket' });
      expect(envVars.SENDER_EMAIL).toEqual({ Ref: 'SenderEmailAddress' });
      expect(envVars.DB_CLUSTER_ARN).toEqual({
        'Fn::Sub': 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}'
      });
      expect(envVars.DB_SECRET_ARN).toEqual({ Ref: 'AuroraSecret' });
      expect(envVars.DB_NAME).toBe('reportingdb');

      // Verify code contains delivery logic
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('s3.put_object');
      expect(code).toContain('ses.send_email');
      expect(code).toContain('rds_data');
    });
  });

  describe('Enhanced Step Functions State Machine', () => {
    test('State machine definition should have correct workflow structure', () => {
      const definitionString = template.Resources.ReportingStateMachine.Properties.DefinitionString['Fn::Sub'][0];
      const definition = JSON.parse(definitionString.replace(/\n/g, ''));

      expect(definition.Comment).toBe('Regulatory Report Generation and Delivery Workflow');
      expect(definition.StartAt).toBe('GenerateReport');

      // Verify all required states exist
      const expectedStates = [
        'GenerateReport',
        'ValidateReport',
        'ValidationChoice',
        'DeliverReport',
        'ValidationFailedNotification',
        'DeliveryFailedNotification',
        'ReportGenerationSuccess'
      ];

      expectedStates.forEach(stateName => {
        expect(definition.States).toHaveProperty(stateName);
      });

      // Verify state types
      expect(definition.States.GenerateReport.Type).toBe('Task');
      expect(definition.States.ValidateReport.Type).toBe('Task');
      expect(definition.States.ValidationChoice.Type).toBe('Choice');
      expect(definition.States.DeliverReport.Type).toBe('Task');
      expect(definition.States.ValidationFailedNotification.Type).toBe('Fail');
      expect(definition.States.DeliveryFailedNotification.Type).toBe('Fail');
      expect(definition.States.ReportGenerationSuccess.Type).toBe('Succeed');

      // Verify retry configuration
      expect(definition.States.GenerateReport.Retry).toHaveLength(1);
      expect(definition.States.GenerateReport.Retry[0].MaxAttempts).toBe(6);

      // Verify choice logic
      expect(definition.States.ValidationChoice.Choices[0].Variable).toBe('$.validationResult.isValid');
      expect(definition.States.ValidationChoice.Choices[0].BooleanEquals).toBe(true);

      // Verify error handling
      expect(definition.States.DeliverReport.Catch).toHaveLength(1);
      expect(definition.States.DeliverReport.Catch[0].ErrorEquals).toEqual(['States.ALL']);
    });
  });

  describe('Enhanced Event Scheduling and Monitoring', () => {
    test('DailyScheduler should have correct EventBridge configuration', () => {
      const scheduler = template.Resources.DailyScheduler;
      expect(scheduler.Type).toBe('AWS::Events::Rule');
      expect(scheduler.Properties.Description).toBe('Triggers the regulatory reporting state machine daily.');
      expect(scheduler.Properties.ScheduleExpression).toEqual({ Ref: 'DailyScheduleExpression' });
      expect(scheduler.Properties.State).toBe('ENABLED');

      // Target configuration
      const target = scheduler.Properties.Targets[0];
      expect(target.Arn).toEqual({ Ref: 'ReportingStateMachine' });
      expect(target.Id).toBe('StepFunctionsTarget');
      expect(target.RoleArn).toEqual({
        'Fn::GetAtt': ['EventBridgeRole', 'Arn']
      });
    });

    test('FailureAlarm should have correct CloudWatch configuration', () => {
      const alarm = template.Resources.FailureAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmDescription).toBe('Alarm when 10% or more of daily reports fail.');
      expect(alarm.Properties.Namespace).toBe('AWS/States');
      expect(alarm.Properties.MetricName).toBe('ExecutionsFailed');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(86400); // 24 hours
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe('200'); // 10% of 2000
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');

      // Dimension configuration
      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('StateMachineArn');
      expect(dimension.Value).toEqual({ Ref: 'ReportingStateMachine' });

      // Alarm actions
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
    });
  });

  describe('Enhanced Audit Trail Resources', () => {
    test('AuditTrailBucket should have proper configuration', () => {
      const bucket = template.Resources.AuditTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${BucketNamePrefix}-cloudtrail-logs-${AWS::AccountId}'
      });

      // Security configuration
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      });

      // Ownership
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });

    test('AuditingTrail should have proper CloudTrail configuration', () => {
      const trail = template.Resources.AuditingTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toBe('AuditTrailBucketPolicy');
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'AuditTrailBucket' });
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  describe('Resource Dependencies and References Validation', () => {
    test('All resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);

      // Function to check if a reference exists
      const checkRef = (ref: any) => {
        if (ref && typeof ref === 'object') {
          if (ref.Ref && !template.Parameters[ref.Ref] && !resourceNames.includes(ref.Ref) && !ref.Ref.startsWith('AWS::')) {
            throw new Error(`Invalid Ref: ${ref.Ref}`);
          }
          if (ref['Fn::GetAtt'] && Array.isArray(ref['Fn::GetAtt'])) {
            const resourceName = ref['Fn::GetAtt'][0];
            if (!resourceNames.includes(resourceName)) {
              throw new Error(`Invalid Fn::GetAtt reference: ${resourceName}`);
            }
          }
        }
      };

      // Recursively check all references in the template
      const checkReferences = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(checkReferences);
        } else if (obj && typeof obj === 'object') {
          checkRef(obj);
          Object.values(obj).forEach(checkReferences);
        }
      };

      checkReferences(template.Resources);
    });

    test('Lambda functions should reference correct execution role', () => {
      const lambdaFunctions = ['GenerateReportLambda', 'ValidateReportLambda', 'DeliverReportLambda'];

      lambdaFunctions.forEach(functionName => {
        const lambda = template.Resources[functionName];
        expect(lambda.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
        });
      });
    });

    test('Aurora cluster should reference all required resources', () => {
      const cluster = template.Resources.AuroraCluster;

      // Should reference security group, subnet group, KMS key, and secret
      expect(cluster.Properties.VpcSecurityGroupIds).toEqual([{ Ref: 'AuroraSecurityGroup' }]);
      expect(cluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'AuroraDBSubnetGroup' });
      expect(cluster.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(cluster.Properties.MasterUserSecret.SecretArn).toEqual({ Ref: 'AuroraSecret' });
    });
  });

  describe('CloudFormation Template Advanced Validation', () => {
    test('Resource logical IDs should follow naming conventions', () => {
      const resourceNames = Object.keys(template.Resources);

      resourceNames.forEach(name => {
        // Should not contain spaces or special characters except for allowed ones
        expect(name).toMatch(/^[a-zA-Z0-9]+$/);
        // Should start with capital letter
        expect(name).toMatch(/^[A-Z]/);
      });
    });

    test('All string parameters should have descriptions', () => {
      Object.entries(template.Parameters).forEach(([paramName, param]: [string, any]) => {
        if (param.Type === 'String') {
          expect(param.Description).toBeDefined();
          expect(param.Description.length).toBeGreaterThan(0);
        }
      });
    });

    test('All outputs should have descriptions', () => {
      Object.entries(template.Outputs).forEach(([outputName, output]: [string, any]) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });
});

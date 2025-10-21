import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Metadata and Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion', '2010-09-09');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

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

    test('should have exactly 4 outputs defined', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Parameters Validation', () => {
    test('Environment parameter should have correct configuration', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['prod', 'staging', 'dev']);
      expect(param.Description).toContain('Deployment environment');
    });

    test('NotificationEmail parameter should have email configuration', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('govardhan.y@turing.com');
      expect(param.Description).toContain('CloudWatch alarm notifications');
    });

    test('DatabaseMasterUsername parameter should have security settings', () => {
      const param = template.Parameters.DatabaseMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('reportadmin');
      expect(param.NoEcho).toBe(true);
      expect(param.Description).toContain('Master username for Aurora database');
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

  describe('KMS and Encryption Resources', () => {
    test('KMSKey should have comprehensive key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyUsage).toBe('ENCRYPT_DECRYPT');
      
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(2);
      
      // Root access statement
      expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(keyPolicy.Statement[0].Effect).toBe('Allow');
      expect(keyPolicy.Statement[0].Action).toBe('kms:*');
      
      // Account resource access statement
      expect(keyPolicy.Statement[1].Sid).toBe('Allow Key Use By Account Resources');
      expect(keyPolicy.Statement[1].Effect).toBe('Allow');
      expect(keyPolicy.Statement[1].Action).toContain('kms:Encrypt');
      expect(keyPolicy.Statement[1].Action).toContain('kms:Decrypt');
      expect(keyPolicy.Statement[1].Condition.StringEquals['kms:CallerAccount']).toEqual({ Ref: 'AWS::AccountId' });
    });
  });

  describe('S3 Storage Resources', () => {
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

    test('ReportsBucketPolicy should enforce security and Lambda access', () => {
      const bucketPolicy = template.Resources.ReportsBucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const policy = bucketPolicy.Properties.PolicyDocument;
      expect(policy.Statement).toHaveLength(2);
      
      // Lambda access statement
      const lambdaAccessStatement = policy.Statement[0];
      expect(lambdaAccessStatement.Sid).toBe('AllowLambdaAccess');
      expect(lambdaAccessStatement.Effect).toBe('Allow');
      expect(lambdaAccessStatement.Principal.AWS).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      expect(lambdaAccessStatement.Action).toEqual(['s3:GetObject', 's3:PutObject', 's3:DeleteObject']);
      expect(lambdaAccessStatement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ReportsBucket}/*'
      });
      
      // Encryption enforcement statement
      const encryptionStatement = policy.Statement[1];
      expect(encryptionStatement.Sid).toBe('DenyUnencryptedObjectUploads');
      expect(encryptionStatement.Effect).toBe('Deny');
      expect(encryptionStatement.Principal).toBe('*');
      expect(encryptionStatement.Action).toBe('s3:PutObject');
      expect(encryptionStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });
  });

  describe('Database Resources', () => {
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

    test('AuroraInstance should use Serverless instance class', () => {
      const instance = template.Resources.AuroraInstance;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.DBInstanceClass).toBe('db.serverless');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
      expect(instance.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
    });
  });

  describe('Networking Resources', () => {
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

    test('AuroraDBSubnetGroup should include both subnets', () => {
      const subnetGroup = template.Resources.AuroraDBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnets for Aurora Serverless v2');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'SubnetA' },
        { Ref: 'SubnetB' }
      ]);
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

  describe('IAM Roles and Policies', () => {
    test('LambdaExecutionRole should have comprehensive permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Trust policy
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
      
      // Managed policy
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      
      // Custom policy
      const customPolicy = role.Properties.Policies[0];
      expect(customPolicy.PolicyName).toBe('ReportingPlatformLambdaPolicy');
      
      const statements = customPolicy.PolicyDocument.Statement;
      expect(statements).toHaveLength(6);
      
      // CloudWatch Logs permissions
      expect(statements[0].Action).toEqual(['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents']);
      
      // S3 permissions
      expect(statements[1].Action).toEqual(['s3:PutObject', 's3:GetObject']);
      expect(statements[1].Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ReportsBucket}/*'
      });
      
      // SES permissions
      expect(statements[2].Action).toBe('ses:SendEmail');
      
      // KMS permissions
      expect(statements[3].Action).toBe('kms:Decrypt');
      
      // RDS Data API permissions
      expect(statements[4].Action).toBe('rds-data:*');
      
      // Secrets Manager permissions
      expect(statements[5].Action).toBe('secretsmanager:GetSecretValue');
    });

    test('StepFunctionsExecutionRole should allow Lambda invocation', () => {
      const role = template.Resources.StepFunctionsExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Trust policy
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('states.amazonaws.com');
      
      // Custom policy
      const customPolicy = role.Properties.Policies[0];
      expect(customPolicy.PolicyName).toBe('StepFunctionsLambdaExecutionPolicy');
      
      const statement = customPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toBe('lambda:InvokeFunction');
      expect(statement.Resource).toHaveLength(6); // 3 Lambda ARNs + 3 versioned ARNs
    });

    test('EventBridgeRole should allow Step Functions execution', () => {
      const role = template.Resources.EventBridgeRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Trust policy
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('events.amazonaws.com');
      
      // Custom policy
      const statement = role.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toBe('states:StartExecution');
      expect(statement.Resource).toEqual({ Ref: 'ReportingStateMachine' });
    });
  });

  describe('Lambda Functions', () => {
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
      testLambdaFunction('GenerateReportLambda', 'lambda_generate_report.handler');
      
      // Verify code contains key functionality
      const code = template.Resources.GenerateReportLambda.Properties.Code.ZipFile;
      expect(code).toContain('report_id');
      expect(code).toContain('jurisdiction');
      expect(code).toContain('REG_FORM_49');
    });

    test('ValidateReportLambda should have correct configuration', () => {
      testLambdaFunction('ValidateReportLambda', 'lambda_validate_report.handler');
      
      // Verify code contains validation logic
      const code = template.Resources.ValidateReportLambda.Properties.Code.ZipFile;
      expect(code).toContain('validation_errors');
      expect(code).toContain('entity_name');
      expect(code).toContain('transaction_count');
      expect(code).toContain('total_value');
    });

    test('DeliverReportLambda should have correct configuration and environment variables', () => {
      testLambdaFunction('DeliverReportLambda', 'lambda_deliver_report.handler');
      
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

  describe('Step Functions State Machine', () => {
    test('ReportingStateMachine should have correct configuration', () => {
      const stateMachine = template.Resources.ReportingStateMachine;
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
      expect(stateMachine.Properties.StateMachineName).toEqual({
        'Fn::Sub': '${AWS::StackName}-ReportingOrchestrator'
      });
      expect(stateMachine.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['StepFunctionsExecutionRole', 'Arn']
      });
    });

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

  describe('Event Scheduling and Monitoring', () => {
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

    test('SNSTopic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toHaveLength(1);
      
      const subscription = topic.Properties.Subscription[0];
      expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
      expect(subscription.Protocol).toBe('email');
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

  describe('Audit Trail Resources', () => {
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

    test('AuditTrailBucketPolicy should allow CloudTrail access', () => {
      const policy = template.Resources.AuditTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);
      
      // ACL check statement
      expect(statements[0].Sid).toBe('AWSCloudTrailAclCheck');
      expect(statements[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(statements[0].Action).toBe('s3:GetBucketAcl');
      
      // Bucket existence check statement
      expect(statements[1].Sid).toBe('AWSCloudTrailBucketExistenceCheck');
      expect(statements[1].Action).toBe('s3:ListBucket');
      
      // Write statement
      expect(statements[2].Sid).toBe('AWSCloudTrailWrite');
      expect(statements[2].Action).toBe('s3:PutObject');
      expect(statements[2].Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${AuditTrailBucket}/AWSLogs/${AWS::AccountId}/*'
      });
      
      // All statements should have account condition
      statements.forEach(statement => {
        expect(statement.Condition.StringEquals['aws:SourceAccount']).toEqual({
          Ref: 'AWS::AccountId'
        });
      });
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

  describe('Stack Outputs', () => {
    test('ReportsBucketName output should be properly configured', () => {
      const output = template.Outputs.ReportsBucketName;
      expect(output.Description).toBe('S3 bucket for storing regulatory reports (versioned, 10-year retention)');
      expect(output.Value).toEqual({ Ref: 'ReportsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ReportsBucket'
      });
    });

    test('StateMachineArn output should be properly configured', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Description).toBe('ARN of the regulatory reporting Step Functions state machine');
      expect(output.Value).toEqual({ Ref: 'ReportingStateMachine' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StateMachineArn'
      });
    });

    test('AuroraClusterEndpoint output should be properly configured', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output.Description).toBe('Aurora Serverless v2 cluster endpoint for read/write access');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DBEndpoint'
      });
    });

    test('SNSTopicArn output should be properly configured', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('SNS topic for CloudWatch failure alerts');
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopicArn'
      });
    });
  });

  describe('Resource Dependencies and References', () => {
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

    test('Security groups should have valid VPC references', () => {
      const securityGroups = ['AuroraSecurityGroup', 'LambdaSecurityGroup'];
      
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
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

  describe('CloudFormation Template Validation', () => {
    test('Template should not have any syntax errors', () => {
      // If we got this far, JSON parsing was successful
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('All required sections should be present and non-empty', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

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
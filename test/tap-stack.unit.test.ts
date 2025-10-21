
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
        expect(lambdaAccessStatement.Principal).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
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
      expect(outputCount).toBe(4);
    });
  });
});

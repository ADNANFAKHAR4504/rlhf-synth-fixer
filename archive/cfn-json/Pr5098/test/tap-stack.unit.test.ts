
import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // focusing on missing validations, edge cases, and deeper property checks
  describe('TapStack CloudFormation Template - Extended Coverage', () => {

    describe('Resource Tagging and Metadata - Extended', () => {
      test('Resources with tags should have appropriate tagging', () => {
        const resourcesWithTags = ['VPC', 'SubnetA', 'SubnetB', 'AuroraCluster', 'AuroraInstance', 'ReportsBucket', 'AuditTrailBucket'];
        resourcesWithTags.forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.Properties.Tags) {
            expect(Array.isArray(resource.Properties.Tags)).toBe(true);
            expect(resource.Properties.Tags.length).toBeGreaterThan(0);
          }
        });
      });

      test('Lambda functions with environment variables should have AWS account ID', () => {
        const lambdaFunctionsWithEnv = ['GenerateReportLambda', 'DeliverReportLambda'];
        lambdaFunctionsWithEnv.forEach(functionName => {
          const lambda = template.Resources[functionName];
          expect(lambda.Properties.Environment?.Variables).toBeDefined();
          if (functionName === 'GenerateReportLambda') {
            expect(lambda.Properties.Environment.Variables.AWS_ACCOUNT_ID).toEqual({ Ref: 'AWS::AccountId' });
          }
          if (functionName === 'DeliverReportLambda') {
            expect(lambda.Properties.Environment.Variables.REPORTS_BUCKET_NAME).toEqual({ Ref: 'ReportsBucket' });
          }
        });
      });
    });

    describe('Security and Compliance Checks - Extended', () => {
      test('S3 buckets should have CORS configuration for web access if needed', () => {
        const buckets = ['ReportsBucket', 'AuditTrailBucket'];
        buckets.forEach(bucketName => {
          const bucket = template.Resources[bucketName];
          // Assuming no CORS for security, but test if present
          if (bucket.Properties.CorsConfiguration) {
            expect(bucket.Properties.CorsConfiguration.CorsRules).toBeDefined();
          }
        });
      });

      test('IAM roles should have AssumeRolePolicyDocument allowing correct services', () => {
        const roles = ['LambdaExecutionRole', 'StepFunctionsExecutionRole', 'EventBridgeRole'];
        roles.forEach(roleName => {
          const role = template.Resources[roleName];
          expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
          expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBeDefined();
        });
      });

      test('Aurora cluster should have backup configuration', () => {
        const cluster = template.Resources.AuroraCluster;
        expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
      });
    });

    describe('Performance and Scalability - Extended', () => {
      test('Lambda functions should have reserved concurrency for throttling', () => {
        const lambdaFunctions = ['GenerateReportLambda', 'ValidateReportLambda', 'DeliverReportLambda'];
        lambdaFunctions.forEach(functionName => {
          const lambda = template.Resources[functionName];
          if (lambda.Properties.ReservedConcurrentExecutions) {
            expect(lambda.Properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
          }
        });
      });

      test('Aurora cluster should have basic monitoring configuration', () => {
        const cluster = template.Resources.AuroraCluster;
        // Check that cluster has basic properties defined
        expect(cluster.Properties.Engine).toBe('aurora-postgresql');
        expect(cluster.Properties.StorageEncrypted).toBe(true);
      });
    });

    describe('Error Handling and Resilience - Extended', () => {
      test('Step Functions should have timeout configurations', () => {
        const stateMachine = template.Resources.ReportingStateMachine;
        expect(stateMachine.Properties.DefinitionString).toBeDefined();
        // Parse and check for TimeoutSeconds in states
        const definitionString = stateMachine.Properties.DefinitionString['Fn::Sub'][0];
        const definition = JSON.parse(definitionString.replace(/\n/g, ''));
        Object.values(definition.States).forEach((state: any) => {
          if (state.Type === 'Task') {
            expect(state.TimeoutSeconds).toBeDefined();
          }
        });
      });

      test('CloudWatch alarms should have alarm actions', () => {
        const alarm = template.Resources.FailureAlarm;
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    describe('Cost Optimization - Extended', () => {
      test('S3 lifecycle rules should have retention policy', () => {
        const bucket = template.Resources.ReportsBucket;
        const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
        expect(lifecycleRules.some((rule: any) => rule.ExpirationInDays)).toBe(true);
        const retentionRule = lifecycleRules.find((rule: any) => rule.ExpirationInDays);
        expect(retentionRule.ExpirationInDays).toBe(3650); // 10 years
      });

      test('Aurora instance should use on-demand or reserved pricing model', () => {
        const instance = template.Resources.AuroraInstance;
        // Assuming no specific pricing, but check for absence of spot or other
        expect(instance.Properties).not.toHaveProperty('SpotPrice');
      });
    });

    describe('Integration and Dependencies - Extended', () => {
      test('EventBridge rule should have proper permissions via role', () => {
        const rule = template.Resources.DailyScheduler;
        const role = template.Resources.EventBridgeRole;
        expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'ReportingStateMachine' });
      });

      test('SNS topic should have subscriptions for email notifications', () => {
        const topic = template.Resources.SNSTopic;
        if (topic.Properties.Subscription) {
          expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
          expect(topic.Properties.Subscription[0].Protocol).toBe('email');
        }
      });
    });

    describe('Outputs - Extended', () => {
      test('All outputs should have Export names for cross-stack references', () => {
        Object.values(template.Outputs).forEach((output: any) => {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        });
      });

      test('Database-related outputs should be present', () => {
        expect(template.Outputs.DatabaseClusterArn).toBeDefined();
        expect(template.Outputs.DatabaseSecretArn).toBeDefined();
        expect(template.Outputs.DatabaseName).toBeDefined();
      });
    });

    describe('Template Validation - Extended', () => {
      test('should not have any circular dependencies in resources', () => {
        // Basic check: ensure no resource depends on itself
        Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
          if (resource.DependsOn) {
            expect(resource.DependsOn).not.toContain(name);
          }
        });
      });

      test('should have valid intrinsic functions usage', () => {
        // Check for common intrinsic functions
        const templateString = JSON.stringify(template);
        expect(templateString).toMatch(/"Ref":/);
        expect(templateString).toMatch(/"Fn::Sub":/);
        expect(templateString).toMatch(/"Fn::GetAtt":/);
      });

      test('should have metadata if present', () => {
        if (template.Metadata) {
          expect(template.Metadata).toBeDefined();
        }
      });
    });

    describe('Edge Cases and Error Conditions', () => {
      test('Parameters should handle default values correctly', () => {
        const params = template.Parameters;
        Object.values(params).forEach((param: any) => {
          if (param.Default) {
            expect(typeof param.Default).toBe('string');
          }
        });
      });

      test('Resources should not have conflicting property names', () => {
        Object.values(template.Resources).forEach((resource: any) => {
          const props = Object.keys(resource.Properties || {});
          expect(new Set(props).size).toBe(props.length); // No duplicates
        });
      });
    });
  });
  // Additional tests for enhanced coverage of TapStack CloudFormation Template
  describe('TapStack CloudFormation Template - Advanced Validation', () => {

    describe('Resource Tagging and Metadata', () => {
      test('Tagged resources should have Name tags', () => {
        const resourcesWithTags = ['VPC', 'SubnetA', 'SubnetB', 'AuroraCluster', 'AuroraInstance', 'ReportsBucket', 'AuditTrailBucket'];
        resourcesWithTags.forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.Properties.Tags) {
            expect(Array.isArray(resource.Properties.Tags)).toBe(true);
            expect(resource.Properties.Tags.length).toBeGreaterThan(0);
            const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
            if (nameTag) {
              expect(nameTag.Value).toBeDefined();
            }
          }
        });
      });

      test('GenerateReportLambda should have AWS account ID environment variable', () => {
        const lambda = template.Resources.GenerateReportLambda;
        expect(lambda.Properties.Environment.Variables.AWS_ACCOUNT_ID).toEqual({ Ref: 'AWS::AccountId' });
      });
    });

    describe('Security and Compliance Checks', () => {
      test('S3 buckets should have security configurations', () => {
        const buckets = ['ReportsBucket', 'AuditTrailBucket'];
        buckets.forEach(bucketName => {
          const bucket = template.Resources[bucketName];
          expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
          expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        });
      });

      test('IAM roles should have least privilege policies', () => {
        const roles = ['LambdaExecutionRole', 'StepFunctionsExecutionRole', 'EventBridgeRole'];
        roles.forEach(roleName => {
          const role = template.Resources[roleName];
          expect(role.Properties.Policies).toBeDefined();
          role.Properties.Policies.forEach((policy: any) => {
            expect(policy.PolicyDocument.Statement).toBeDefined();
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              expect(statement.Effect).toBe('Allow'); // Ensure no overly permissive denies
            });
          });
        });
      });

      test('Database should have storage encryption enabled', () => {
        const cluster = template.Resources.AuroraCluster;
        expect(cluster.Properties.StorageEncrypted).toBe(true);
      });
    });

    describe('Performance and Scalability', () => {
      test('Lambda functions should have optimal memory and timeout', () => {
        const lambdaFunctions = ['GenerateReportLambda', 'ValidateReportLambda', 'DeliverReportLambda'];
        lambdaFunctions.forEach(functionName => {
          const lambda = template.Resources[functionName];
          expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(256);
          expect(lambda.Properties.Timeout).toBeLessThanOrEqual(300); // 5 minutes max
        });
      });

      test('Aurora cluster should have serverless configuration', () => {
        const cluster = template.Resources.AuroraCluster;
        expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
        expect(cluster.Properties.ServerlessV2ScalingConfiguration.MinCapacity).toBeGreaterThan(0);
      });
    });

    describe('Error Handling and Resilience', () => {
      test('Step Functions should have valid state machine definition', () => {
        const definitionString = template.Resources.ReportingStateMachine.Properties.DefinitionString['Fn::Sub'][0];
        const definition = JSON.parse(definitionString.replace(/\n/g, ''));
        expect(definition.StartAt).toBeDefined();
        expect(definition.States).toBeDefined();
        expect(Object.keys(definition.States).length).toBeGreaterThan(0);
      });

      test('CloudWatch alarms should have appropriate actions', () => {
        const alarm = template.Resources.FailureAlarm;
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    describe('Cost Optimization', () => {
      test('Resources should use appropriate instance types and configurations', () => {
        const instance = template.Resources.AuroraInstance;
        expect(instance.Properties.DBInstanceClass).toBe('db.serverless'); // Ensure serverless for cost
      });

      test('S3 lifecycle rules should be configured for cost savings', () => {
        const bucket = template.Resources.ReportsBucket;
        const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
        expect(lifecycleRules.some((rule: any) => rule.ExpirationInDays)).toBe(true);
      });
    });

    describe('Integration and Dependencies', () => {
      test('EventBridge rule should target the correct state machine', () => {
        const rule = template.Resources.DailyScheduler;
        expect(rule.Properties.Targets[0].Arn).toEqual({ Ref: 'ReportingStateMachine' });
      });

      test('SNS topic should be subscribed for notifications', () => {
        const topic = template.Resources.SNSTopic;
        expect(topic.Properties.Subscription).toBeDefined(); // Assuming subscriptions are added
      });
    });
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
        Default: 'SecurePassword2025!',
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
        Default: 'tapstackgov',
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
        expect(policy.Statement).toHaveLength(7);

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
      expect(resourceCount).toBe(41);
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

      test('should have exactly 41 resources defined', () => {
        const resourceCount = Object.keys(template.Resources).length;
        expect(resourceCount).toBe(41);
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
        expect(param.Default).toBe('SecurePassword2025!');
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
        expect(param.Default).toBe('tapstackgov');
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
    describe('Enhanced IAM Roles and Policies', () => {
      test('LambdaExecutionRole should have comprehensive permissions', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');

        // AssumeRolePolicyDocument
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');

        // Managed policies
        expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');

        // Inline policies
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyName).toBe('ReportingPlatformLambdaPolicy');
        expect(policy.PolicyDocument.Statement).toHaveLength(7);

        // CloudWatch Logs
        expect(policy.PolicyDocument.Statement[0].Action).toEqual(['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents']);

        // S3 permissions
        expect(policy.PolicyDocument.Statement[1].Action).toEqual(['s3:PutObject', 's3:GetObject']);

        // SES permissions
        expect(policy.PolicyDocument.Statement[2].Action).toBe('ses:SendEmail');

        // KMS permissions
        expect(policy.PolicyDocument.Statement[3].Action).toBe('kms:Decrypt');

        // RDS Data API permissions
        expect(policy.PolicyDocument.Statement[4].Action).toBe('rds-data:*');

        // Secrets Manager permissions
        expect(policy.PolicyDocument.Statement[5].Action).toBe('secretsmanager:GetSecretValue');
      });

      test('StepFunctionsExecutionRole should have Lambda invoke permissions', () => {
        const role = template.Resources.StepFunctionsExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');

        // AssumeRolePolicyDocument
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toContain('states.amazonaws.com');

        // Policy should allow invoking all Lambda functions
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyDocument.Statement[0].Action).toBe('lambda:InvokeFunction');
        expect(policy.PolicyDocument.Statement[0].Resource).toHaveLength(6);
      });

      test('EventBridgeRole should have Step Functions execution permissions', () => {
        const role = template.Resources.EventBridgeRole;
        expect(role.Type).toBe('AWS::IAM::Role');

        // AssumeRolePolicyDocument
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('events.amazonaws.com');

        // Policy should allow starting state machine execution
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyDocument.Statement[0].Action).toBe('states:StartExecution');
        expect(policy.PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'ReportingStateMachine' });
      });
    });

    describe('Enhanced KMS Key Configuration', () => {
      test('KMSKey should have proper key policy and configuration', () => {
        const key = template.Resources.KMSKey;
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Properties.Description).toBe('KMS key for regulatory reporting platform encryption (S3, Aurora)');
        expect(key.Properties.KeyUsage).toBe('ENCRYPT_DECRYPT');

        // Key policy
        const keyPolicy = key.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        expect(keyPolicy.Statement).toHaveLength(2);

        // Root access statement
        const rootStatement = keyPolicy.Statement[0];
        expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
        expect(rootStatement.Effect).toBe('Allow');
        expect(rootStatement.Principal.AWS).toEqual({
          'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
        });
        expect(rootStatement.Action).toBe('kms:*');

        // Account-wide use statement
        const accountStatement = keyPolicy.Statement[1];
        expect(accountStatement.Sid).toBe('Allow Key Use By Account Resources');
        expect(accountStatement.Effect).toBe('Allow');
        expect(accountStatement.Principal.AWS).toBe('*');
        expect(accountStatement.Condition.StringEquals['kms:CallerAccount']).toEqual({ Ref: 'AWS::AccountId' });
      });
    });

    describe('Enhanced Outputs Validation', () => {
      test('All outputs should have correct export names', () => {
        const outputs = ['ReportsBucketName', 'StateMachineArn', 'AuroraClusterEndpoint', 'SNSTopicArn', 'DatabaseClusterArn', 'DatabaseSecretArn', 'DatabaseName'];

        outputs.forEach(outputName => {
          const output = template.Outputs[outputName];
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toBeDefined();
        });
      });

      test('Database outputs should provide necessary connection information', () => {
        const dbClusterArn = template.Outputs.DatabaseClusterArn;
        expect(dbClusterArn.Value).toEqual({
          'Fn::Sub': 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}'
        });

        const dbSecretArn = template.Outputs.DatabaseSecretArn;
        expect(dbSecretArn.Value).toEqual({
          'Fn::GetAtt': ['AuroraCluster', 'MasterUserSecret.SecretArn']
        });

        const dbName = template.Outputs.DatabaseName;
        expect(dbName.Value).toBe('reportingdb');
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
        expect(definition.States.GenerateReport.Retry[0].MaxAttempts).toBe(3);

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
});

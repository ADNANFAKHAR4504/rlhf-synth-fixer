import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should have proper key policy with root access', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('should restrict CloudWatch Logs access with conditions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Condition: Match.objectLike({
                ArnLike: Match.objectLike({
                  'kms:EncryptionContext:aws:logs:arn': Match.stringLikeRegexp(
                    'arn:aws:logs:.*'
                  ),
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should have explicit deny for key deletion', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Deny Key Deletion',
              Effect: 'Deny',
            }),
          ]),
        }),
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/iam-security-test-ap-northeast-1-logs',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create security audit log group with 90-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/security/iam-security-test-ap-northeast-1-audit',
        RetentionInDays: 90,
      });
    });

    test('should create policy analyzer log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName:
          '/aws/lambda/iam-security-test-ap-northeast-1-policy-analyzer',
        RetentionInDays: 90,
      });
    });

    test('should create daily auditor log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName:
          '/aws/lambda/iam-security-test-ap-northeast-1-daily-auditor',
        RetentionInDays: 90,
      });
    });

    test('should encrypt all log groups with KMS', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);

      expect(logGroupKeys.length).toBeGreaterThanOrEqual(3);

      logGroupKeys.forEach((key) => {
        expect(logGroups[key].Properties).toHaveProperty('KmsKeyId');
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create security alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'IAM Security Alerts (test)',
      });
    });

    test('should encrypt SNS topic with KMS', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Key.*')]),
        }),
      });
    });
  });

  describe('Dead Letter Queue', () => {
    test('should create DLQ with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should encrypt DLQ with KMS', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Key.*')]),
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'iam-security-test-ap-northeast-1-lambda-execution',
        MaxSessionDuration: 3600,
      });
    });

    test('should have explicit deny statements in Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'DenySensitiveActions',
                  Effect: 'Deny',
                  Action: Match.arrayWith([
                    'iam:DeleteRole',
                    'iam:DeleteUser',
                    'kms:ScheduleKeyDeletion',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should allow IAM read access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'AllowIAMReadAccess',
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'iam:GetPolicy',
                    'iam:ListPolicies',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should create cross-account audit role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'iam-security-test-ap-northeast-1-cross-account-audit',
        MaxSessionDuration: 3600,
      });
    });

    test('should have external ID on cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'sts:ExternalId': 'iam-security-audit-test',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should have explicit deny in cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'DenyAllModifications',
                  Effect: 'Deny',
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create policy analyzer Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'iam-security-test-ap-northeast-1-policy-analyzer',
        Runtime: 'nodejs22.x',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('should create daily auditor Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'iam-security-test-ap-northeast-1-daily-auditor',
        Runtime: 'nodejs22.x',
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should set environment variables for policy analyzer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            SNS_TOPIC_ARN: Match.anyValue(),
            LOG_GROUP_NAME: Match.anyValue(),
            ENVIRONMENT: 'test',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        }),
      });
    });

    test('should attach Lambda to correct log groups', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties).toHaveProperty('LoggingConfig');
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create IAM policy change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'iam-security-test-ap-northeast-1-policy-changes',
        EventPattern: Match.objectLike({
          source: ['aws.iam'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: Match.objectLike({
            eventSource: ['iam.amazonaws.com'],
            eventName: Match.arrayWith([
              'CreatePolicy',
              'PutUserPolicy',
              'AttachRolePolicy',
            ]),
          }),
        }),
      });
    });

    test('should create daily audit rule with cron schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'iam-security-test-ap-northeast-1-daily-audit',
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should configure DLQ for event rule targets', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.objectLike({
              Arn: Match.anyValue(),
            }),
            RetryPolicy: Match.objectLike({
              MaximumEventAgeInSeconds: 7200,
              MaximumRetryAttempts: 2,
            }),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unusual activity alarm with correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-unusual-activity',
        Threshold: 5,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create policy analyzer error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-policy-analyzer-errors',
        Threshold: 1,
      });
    });

    test('should create daily auditor error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-daily-auditor-errors',
        Threshold: 1,
      });
    });

    test('should configure SNS actions for all alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);

      expect(alarmKeys.length).toBeGreaterThanOrEqual(3);

      alarmKeys.forEach((key) => {
        expect(alarms[key].Properties).toHaveProperty('AlarmActions');
        expect(alarms[key].Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export SecurityAlertsTopicArn', () => {
      template.hasOutput('SecurityAlertsTopicArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-alerts-topic-arn',
        },
      });
    });

    test('should export CrossAccountAuditRoleArn', () => {
      template.hasOutput('CrossAccountAuditRoleArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-audit-role-arn',
        },
      });
    });

    test('should export KMSKeyArn', () => {
      template.hasOutput('KMSKeyArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-kms-key-arn',
        },
      });
    });

    test('should export all required outputs', () => {
      const outputs = [
        'SecurityAlertsTopicArn',
        'CrossAccountAuditRoleArn',
        'KMSKeyArn',
        'KMSKeyId',
        'DLQUrl',
        'PolicyAnalyzerLambdaArn',
        'DailyAuditorLambdaArn',
        'SecurityLogGroupName',
        'IAMPolicyChangeRuleName',
        'UnusualActivityAlarmName',
      ];

      outputs.forEach((outputName) => {
        const output = template.findOutputs(outputName);
        expect(Object.keys(output)).toHaveLength(1);
      });
    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in all resource names', () => {
      const resourcePrefix = 'iam-security-test-ap-northeast-1';

      // Check Lambda functions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`^${resourcePrefix}-.*`),
      });

      // Check Log groups
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`.*${resourcePrefix}.*`),
      });

      // Check EventBridge rules
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: Match.stringLikeRegexp(`^${resourcePrefix}-.*`),
      });
    });

    test('should use region in resource naming', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('.*ap-northeast-1.*'),
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      // Count specific resource types
      expect(
        resourceTypes.filter((t) => t === 'AWS::Lambda::Function').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Logs::LogGroup').length
      ).toBe(3);
      expect(resourceTypes.filter((t) => t === 'AWS::IAM::Role').length).toBe(
        2
      );
      expect(resourceTypes.filter((t) => t === 'AWS::KMS::Key').length).toBe(
        1
      );
      expect(
        resourceTypes.filter((t) => t === 'AWS::Events::Rule').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::CloudWatch::Alarm').length
      ).toBe(3);
      expect(resourceTypes.filter((t) => t === 'AWS::SNS::Topic').length).toBe(
        1
      );
      expect(resourceTypes.filter((t) => t === 'AWS::SQS::Queue').length).toBe(
        1
      );
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public access', () => {
      const resources = template.toJSON().Resources;

      Object.values(resources).forEach((resource: any) => {
        // Check no S3 buckets have public read/write
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties?.PublicAccessBlockConfiguration).toBeDefined();
        }

        // Check no security groups allow 0.0.0.0/0
        if (resource.Type === 'AWS::EC2::SecurityGroup') {
          const ingress = resource.Properties?.SecurityGroupIngress || [];
          ingress.forEach((rule: any) => {
            expect(rule.CidrIp).not.toBe('0.0.0.0/0');
          });
        }
      });
    });

    test('should use encryption for all data at rest', () => {
      // All log groups should have KMS encryption
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.Properties).toHaveProperty('KmsKeyId');
      });

      // SNS topic should have KMS encryption
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });

      // SQS queue should have KMS encryption
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('should have timeouts configured for all Lambdas', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Timeout).toBeLessThanOrEqual(60);
        expect(func.Properties.Timeout).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Environment Support', () => {
    test('should work with different environment suffixes', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('iam-security-dev-us-east-1.*'),
      });

      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('iam-security-prod-us-west-2.*'),
      });
    });
  });
});

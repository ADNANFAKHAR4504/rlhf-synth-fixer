import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption Key', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates KMS alias with correct name', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/compliance-key-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `codebuild-compliance-reports-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has encryption with KMS', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            },
          ],
        },
      });
    });
  });

  describe('SNS Topics', () => {
    test('creates critical violations topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `codebuild-critical-violations-${environmentSuffix}`,
        DisplayName: 'CodeBuild Critical Compliance Violations',
      });
    });

    test('creates weekly reports topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `codebuild-weekly-reports-${environmentSuffix}`,
        DisplayName: 'CodeBuild Weekly Compliance Reports',
      });
    });

    test('weekly reports topic has email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com',
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates scanner role for CodeBuild', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `codebuild-scanner-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('scanner role has CodeBuild read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'codebuild:ListProjects',
                'codebuild:BatchGetProjects',
                'codebuild:ListBuildsForProject',
                'codebuild:BatchGetBuilds',
              ],
              Effect: 'Allow',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('creates report generator role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `compliance-report-generator-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('creates remediation role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `compliance-remediation-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('remediation role has CodeBuild update permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['codebuild:UpdateProject', 'codebuild:BatchGetProjects'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('creates compliance scanner project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `compliance-scanner-${environmentSuffix}`,
        Description: 'Scans CodeBuild projects for compliance issues',
      });
    });

    test('scanner uses STANDARD_7_0 image', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          Image: 'aws/codebuild/standard:7.0',
          ComputeType: 'BUILD_GENERAL1_SMALL',
        }),
      });
    });

    test('scanner has required environment variables', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({ Name: 'REPORTS_BUCKET' }),
            Match.objectLike({ Name: 'ENVIRONMENT_SUFFIX' }),
            Match.objectLike({ Name: 'SNS_TOPIC_ARN' }),
          ]),
        }),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates report generator function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-report-generator-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('creates auto-remediation function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-auto-remediation-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda functions have required environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            REPORTS_BUCKET: Match.anyValue(),
          }),
        },
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates CodeBuild change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `codebuild-change-scanner-${environmentSuffix}`,
        Description: 'Trigger compliance scan when CodeBuild projects change',
        EventPattern: {
          source: ['aws.codebuild'],
          'detail-type': ['CodeBuild Project State Change'],
        },
      });
    });

    test('creates daily scan rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `codebuild-daily-scan-${environmentSuffix}`,
        Description: 'Run compliance scan daily',
        ScheduleExpression: 'cron(0 9 * * ? *)',
      });
    });

    test('creates weekly report rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `codebuild-weekly-report-${environmentSuffix}`,
        Description: 'Generate weekly compliance report',
        ScheduleExpression: 'cron(0 10 ? * MON *)',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates scanner failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `codebuild-scanner-failures-${environmentSuffix}`,
        AlarmDescription: 'Alert when compliance scanner fails',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('creates report generator error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `report-generator-errors-${environmentSuffix}`,
        AlarmDescription: 'Alert when report generator fails',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 1,
      });
    });

    test('creates remediation error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `auto-remediation-errors-${environmentSuffix}`,
        AlarmDescription: 'Alert when auto-remediation fails',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 1,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates compliance dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `codebuild-compliance-${environmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates scanner log group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/compliance-scanner-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('Resource Count', () => {
    test('creates expected number of resources', () => {
      // KMS (1 key + 1 alias) + S3 (1 bucket) + SNS (2 topics + 1 subscription) +
      // IAM (3 roles + multiple policies) + CodeBuild (1 project) +
      // Lambda (2 functions) + EventBridge (3 rules + permissions) +
      // CloudWatch (3 alarms + 1 dashboard) + Log Groups (3)
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(20);
    });
  });

  describe('Stack Outputs', () => {
    test('exports reports bucket name', () => {
      template.hasOutput('ReportsBucketName', {
        Export: {
          Name: `compliance-reports-bucket-${environmentSuffix}`,
        },
      });
    });

    test('exports scanner project name', () => {
      template.hasOutput('ScannerProjectName', {
        Export: {
          Name: `compliance-scanner-project-${environmentSuffix}`,
        },
      });
    });

    test('exports report generator function name', () => {
      template.hasOutput('ReportGeneratorFunctionName', {
        Export: {
          Name: `report-generator-function-${environmentSuffix}`,
        },
      });
    });

    test('exports auto-remediation function name', () => {
      template.hasOutput('AutoRemediationFunctionName', {
        Export: {
          Name: `auto-remediation-function-${environmentSuffix}`,
        },
      });
    });

    test('exports SNS topic ARNs', () => {
      template.hasOutput('CriticalViolationsTopicArn', {
        Export: {
          Name: `critical-violations-topic-${environmentSuffix}`,
        },
      });

      template.hasOutput('WeeklyReportsTopicArn', {
        Export: {
          Name: `weekly-reports-topic-${environmentSuffix}`,
        },
      });
    });

    test('exports dashboard name', () => {
      template.hasOutput('DashboardName', {
        Export: {
          Name: `compliance-dashboard-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all resources use environmentSuffix in names', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.entries(resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Properties?.Name ||
          resource.Properties?.FunctionName ||
          resource.Properties?.ProjectName ||
          resource.Properties?.BucketName ||
          resource.Properties?.TopicName ||
          resource.Properties?.RoleName ||
          resource.Properties?.AlarmName ||
          resource.Properties?.DashboardName ||
          resource.Properties?.LogGroupName,
      );

      namedResources.forEach(([logicalId, resource]: [string, any]) => {
        const name =
          resource.Properties?.Name ||
          resource.Properties?.FunctionName ||
          resource.Properties?.ProjectName ||
          resource.Properties?.BucketName ||
          resource.Properties?.TopicName ||
          resource.Properties?.RoleName ||
          resource.Properties?.AlarmName ||
          resource.Properties?.DashboardName ||
          resource.Properties?.LogGroupName;

        if (typeof name === 'string' && !name.includes('${Token[')) {
          expect(name).toContain(environmentSuffix);
        }
      });
    });

    test('no hardcoded AWS account IDs in IAM policies', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const policyDoc = JSON.stringify(policy.Properties.PolicyDocument);
        expect(policyDoc).not.toMatch(/\d{12}/);
      });
    });

    test('S3 bucket has removal policy DESTROY', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });
});

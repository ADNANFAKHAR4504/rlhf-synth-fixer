// Integration tests for Zero-Trust Security Architecture
// Uses actual AWS resources deployed via CDK

import fs from 'fs';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthq4r92';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS clients
const iamClient = new IAMClient({ region });
const snsClient = new SNSClient({ region });
const configClient = new ConfigServiceClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

describe('Zero-Trust Security Architecture Integration Tests', () => {
  describe('IAM Roles - Department Specific', () => {
    test('Finance role exists with correct configuration', async () => {
      const roleArn = outputs.FinanceRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`finance-role-${environmentSuffix}`);

      const roleName = `finance-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600); // 1 hour
      expect(response.Role?.Description).toContain('Finance department');

      // Check assume role policy has MFA and IP conditions
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statements = assumeRolePolicy.Statement;

      // Should have a statement with MFA and IP conditions
      const mfaStatement = statements.find(
        (s: any) =>
          s.Condition?.Bool?.['aws:MultiFactorAuthPresent'] === 'true' &&
          s.Condition?.IpAddress?.['aws:SourceIp']
      );
      expect(mfaStatement).toBeDefined();
      expect(mfaStatement.Condition.IpAddress['aws:SourceIp']).toContain(
        '10.0.0.0/8'
      );
    });

    test('Marketing role exists with correct configuration', async () => {
      const roleArn = outputs.MarketingRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`marketing-role-${environmentSuffix}`);

      const roleName = `marketing-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
      expect(response.Role?.Description).toContain('Marketing department');
    });

    test('Analytics role exists with correct configuration', async () => {
      const roleArn = outputs.AnalyticsRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`analytics-role-${environmentSuffix}`);

      const roleName = `analytics-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
      expect(response.Role?.Description).toContain('Analytics department');
    });
  });

  describe('IAM Roles - Cross-Department', () => {
    test('Finance to Marketing role has external ID requirement', async () => {
      const roleArn = outputs.FinanceToMarketingRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`finance-to-marketing-${environmentSuffix}`);

      const roleName = `finance-to-marketing-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.Description).toContain('Read-only access');

      // Check external ID is required
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statements = assumeRolePolicy.Statement;

      const externalIdStatement = statements.find(
        (s: any) => s.Condition?.StringEquals?.['sts:ExternalId']
      );
      expect(externalIdStatement).toBeDefined();
      expect(externalIdStatement.Condition.StringEquals['sts:ExternalId']).toBe(
        outputs.ExternalId
      );

      // Check IP restrictions
      expect(externalIdStatement.Condition.IpAddress?.['aws:SourceIp']).toContain(
        '10.0.0.0/8'
      );
    });

    test('Marketing to Analytics role has correct configuration', async () => {
      const roleArn = outputs.MarketingToAnalyticsRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`marketing-to-analytics-${environmentSuffix}`);

      const roleName = `marketing-to-analytics-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
    });

    test('Analytics to Finance role has correct configuration', async () => {
      const roleArn = outputs.AnalyticsToFinanceRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`analytics-to-finance-${environmentSuffix}`);

      const roleName = `analytics-to-finance-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
    });
  });

  describe('IAM Policies - Least Privilege', () => {
    test('Finance role policy is scoped to finance resources only', async () => {
      const roleName = `finance-role-${environmentSuffix}`;

      // Get inline policies
      const policiesResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'FinanceRoleDefaultPolicy',
        })
      );

      const policyDocument = JSON.parse(
        decodeURIComponent(policiesResponse.PolicyDocument || '{}')
      );
      const statements = policyDocument.Statement;

      // Find S3 statement
      const s3Statement = statements.find((s: any) => s.Sid === 'FinanceS3Access');
      expect(s3Statement).toBeDefined();

      // Verify S3 actions are limited
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).not.toContain('s3:*');

      // Find DynamoDB statement
      const dynamoStatement = statements.find(
        (s: any) => s.Sid === 'FinanceDynamoDBAccess'
      );
      expect(dynamoStatement).toBeDefined();

      // Verify DynamoDB actions are limited
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).not.toContain('dynamodb:*');
    }, 30000);

    test('Cross-department roles have read-only access', async () => {
      const roleName = `finance-to-marketing-${environmentSuffix}`;

      const policiesResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'FinanceToMarketingRoleDefaultPolicy',
        })
      );

      const policyDocument = JSON.parse(
        decodeURIComponent(policiesResponse.PolicyDocument || '{}')
      );
      const statements = policyDocument.Statement;

      // Should only have GetObject and ListBucket (read-only)
      const s3Statement = statements.find(
        (s: any) => s.Sid === 'ReadOnlyMarketingSharedData'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toEqual(
        expect.arrayContaining(['s3:GetObject', 's3:ListBucket'])
      );
      expect(s3Statement.Action).not.toContain('s3:PutObject');
      expect(s3Statement.Action).not.toContain('s3:DeleteObject');
    }, 30000);
  });

  describe('SNS Topics for Security Alerting', () => {
    test('Security alerts topic exists and is configured', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(`security-alerts-${environmentSuffix}`);

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.DisplayName).toBe('Security Alerts');

      // Check KMS encryption is enabled
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('Security alerts topic has email subscription', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;

      const response = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);

      const emailSubscription = response.Subscriptions?.find(
        (sub) => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription?.Endpoint).toContain('example.com');
    });

    test('Compliance topic exists and is configured', async () => {
      const topicArn = outputs.ComplianceTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(`compliance-violations-${environmentSuffix}`);

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.DisplayName).toBe('Compliance Violations');

      // Check KMS encryption is enabled
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('AWS Config Rules for Compliance', () => {
    test('IAM password policy config rule exists', async () => {
      const ruleName = `iam-password-policy-${environmentSuffix}`;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].Source?.Owner).toBe('AWS');
      expect(response.ConfigRules?.[0].Source?.SourceIdentifier).toBe(
        'IAM_PASSWORD_POLICY'
      );
    });

    test('S3 encryption config rule exists', async () => {
      const ruleName = `s3-encryption-${environmentSuffix}`;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].Source?.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    test('MFA enabled config rule exists', async () => {
      const ruleName = `mfa-enabled-for-iam-console-${environmentSuffix}`;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].Source?.SourceIdentifier).toBe(
        'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS'
      );
    });

    test('CloudTrail enabled config rule exists', async () => {
      const ruleName = `cloudtrail-enabled-${environmentSuffix}`;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].Source?.SourceIdentifier).toBe(
        'CLOUD_TRAIL_ENABLED'
      );
    });

    test('No admin access config rule exists', async () => {
      const ruleName = `iam-policy-no-admin-${environmentSuffix}`;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].Source?.SourceIdentifier).toBe(
        'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS'
      );
    });
  });

  describe('CloudWatch Alarms for Security Monitoring', () => {
    test('Unauthorized API calls alarm exists', async () => {
      const alarmName = `unauthorized-api-calls-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('UnauthorizedApiCalls');
      expect(response.MetricAlarms?.[0].Namespace).toBe('SecurityMetrics');
      expect(response.MetricAlarms?.[0].Threshold).toBe(1);

      // Check alarm is connected to SNS
      expect(response.MetricAlarms?.[0].AlarmActions).toBeDefined();
      expect(response.MetricAlarms?.[0].AlarmActions?.length).toBeGreaterThan(0);
    });

    test('IAM policy changes alarm exists', async () => {
      const alarmName = `iam-policy-changes-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('IamPolicyChanges');
      expect(response.MetricAlarms?.[0].AlarmActions?.length).toBeGreaterThan(0);
    });

    test('Root account usage alarm exists', async () => {
      const alarmName = `root-account-usage-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('RootAccountUsage');
    });

    test('Failed console logins alarm exists with correct threshold', async () => {
      const alarmName = `failed-console-logins-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('FailedConsoleLogins');
      expect(response.MetricAlarms?.[0].Threshold).toBe(3);
    });

    test('S3 bucket policy changes alarm exists', async () => {
      const alarmName = `s3-bucket-policy-changes-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('S3BucketPolicyChanges');
    });
  });

  describe('External ID for Cross-Department Access', () => {
    test('External ID is configured and matches expected pattern', () => {
      const externalId = outputs.ExternalId;
      expect(externalId).toBeDefined();
      expect(externalId).toBe(`zero-trust-${environmentSuffix}-external-id`);
    });
  });

  describe('Zero-Trust Verification', () => {
    test('All roles have session duration limited to 1 hour or less', async () => {
      const roleNames = [
        `finance-role-${environmentSuffix}`,
        `marketing-role-${environmentSuffix}`,
        `analytics-role-${environmentSuffix}`,
        `finance-to-marketing-${environmentSuffix}`,
        `marketing-to-analytics-${environmentSuffix}`,
        `analytics-to-finance-${environmentSuffix}`,
      ];

      for (const roleName of roleNames) {
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(response.Role?.MaxSessionDuration).toBeLessThanOrEqual(3600);
      }
    }, 30000);

    test('Cross-department roles all require external ID', async () => {
      const crossDeptRoles = [
        `finance-to-marketing-${environmentSuffix}`,
        `marketing-to-analytics-${environmentSuffix}`,
        `analytics-to-finance-${environmentSuffix}`,
      ];

      for (const roleName of crossDeptRoles) {
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
        );

        const hasExternalId = assumeRolePolicy.Statement.some(
          (s: any) => s.Condition?.StringEquals?.['sts:ExternalId']
        );

        expect(hasExternalId).toBe(true);
      }
    }, 30000);
  });
});

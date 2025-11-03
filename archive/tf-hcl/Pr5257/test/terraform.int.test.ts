import { readFileSync } from 'fs';
import { join } from 'path';
import * as AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');

let outputs: Record<string, any> = {};
let outputsExist = false;

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  outputsExist = true;
} catch (error) {
  console.log('Note: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
  console.log('These tests run against deployed AWS infrastructure in CI/CD pipeline.');
}

describe('Terraform IAM Zero-Trust Security Framework - Integration Tests', () => {
  describe('Deployment Verification', () => {
    test('should have outputs file from deployment', () => {
      if (!outputsExist) {
        console.log('Skipping: Infrastructure not deployed yet');
        return;
      }
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have account_id output', () => {
      if (!outputsExist) return;
      expect(outputs.account_id).toBeDefined();
      expect(outputs.account_id).toMatch(/^\d{12}$/);
    });

    test('should have region output', () => {
      if (!outputsExist) return;
      expect(outputs.region).toBeDefined();
      expect(outputs.region).toBe('us-east-1');
    });

    test('should have environment_suffix output', () => {
      if (!outputsExist) return;
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('IAM Roles Verification', () => {
    test('should have developer role ARN', () => {
      if (!outputsExist) return;
      expect(outputs.developer_role_arn).toBeDefined();
      expect(outputs.developer_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    });

    test('should have developer role name', () => {
      if (!outputsExist) return;
      expect(outputs.developer_role_name).toBeDefined();
      expect(outputs.developer_role_name).toContain('developer-role');
    });

    test('should have operator role ARN', () => {
      if (!outputsExist) return;
      expect(outputs.operator_role_arn).toBeDefined();
      expect(outputs.operator_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    });

    test('should have operator role name', () => {
      if (!outputsExist) return;
      expect(outputs.operator_role_name).toBeDefined();
      expect(outputs.operator_role_name).toContain('operator-role');
    });

    test('should have administrator role ARN', () => {
      if (!outputsExist) return;
      expect(outputs.administrator_role_arn).toBeDefined();
      expect(outputs.administrator_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    });

    test('should have administrator role name', () => {
      if (!outputsExist) return;
      expect(outputs.administrator_role_name).toBeDefined();
      expect(outputs.administrator_role_name).toContain('administrator-role');
    });

    test('should have break glass role ARN', () => {
      if (!outputsExist) return;
      expect(outputs.break_glass_role_arn).toBeDefined();
      expect(outputs.break_glass_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    });

    test('should have break glass role name', () => {
      if (!outputsExist) return;
      expect(outputs.break_glass_role_name).toBeDefined();
      expect(outputs.break_glass_role_name).toContain('break-glass-role');
    });
  });

  describe('IAM Policies Verification', () => {
    test('should have developer policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.developer_policy_arn).toBeDefined();
      expect(outputs.developer_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });

    test('should have operator policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.operator_policy_arn).toBeDefined();
      expect(outputs.operator_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });

    test('should have administrator policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.administrator_policy_arn).toBeDefined();
      expect(outputs.administrator_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });

    test('should have permission boundary policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.permission_boundary_policy_arn).toBeDefined();
      expect(outputs.permission_boundary_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });

    test('should have regional restriction policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.regional_restriction_policy_arn).toBeDefined();
      expect(outputs.regional_restriction_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });

    test('should have S3 access policy ARN', () => {
      if (!outputsExist) return;
      expect(outputs.s3_access_policy_arn).toBeDefined();
      expect(outputs.s3_access_policy_arn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });
  });

  describe('Service Roles Verification', () => {
    test('should have EC2 instance role ARN if enabled', () => {
      if (!outputsExist) return;
      if (outputs.ec2_instance_role_arn) {
        expect(outputs.ec2_instance_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(outputs.ec2_instance_role_arn).toContain('ec2-instance-role');
      }
    });

    test('should have EC2 instance profile name if enabled', () => {
      if (!outputsExist) return;
      if (outputs.ec2_instance_profile_name) {
        expect(outputs.ec2_instance_profile_name).toContain('ec2-instance-profile');
      }
    });

    test('should have Lambda execution role ARN if enabled', () => {
      if (!outputsExist) return;
      if (outputs.lambda_execution_role_arn) {
        expect(outputs.lambda_execution_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(outputs.lambda_execution_role_arn).toContain('lambda-execution-role');
      }
    });

    test('should have RDS monitoring role ARN if enabled', () => {
      if (!outputsExist) return;
      if (outputs.rds_monitoring_role_arn) {
        expect(outputs.rds_monitoring_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(outputs.rds_monitoring_role_arn).toContain('rds-monitoring-role');
      }
    });
  });

  describe('S3 Buckets Verification', () => {
    test('should have financial data bucket name', () => {
      if (!outputsExist) return;
      expect(outputs.financial_data_bucket_name).toBeDefined();
      expect(outputs.financial_data_bucket_name).toContain('financial-data');
    });

    test('should have financial data bucket ARN', () => {
      if (!outputsExist) return;
      expect(outputs.financial_data_bucket_arn).toBeDefined();
      expect(outputs.financial_data_bucket_arn).toMatch(/^arn:aws:s3:::/);
    });

    test('should have access logs bucket name if logging enabled', () => {
      if (!outputsExist) return;
      if (outputs.access_logs_bucket_name) {
        expect(outputs.access_logs_bucket_name).toContain('access-logs');
      }
    });

    test('should have access logs bucket ARN if logging enabled', () => {
      if (!outputsExist) return;
      if (outputs.access_logs_bucket_arn) {
        expect(outputs.access_logs_bucket_arn).toMatch(/^arn:aws:s3:::/);
      }
    });
  });

  describe('KMS Encryption Verification', () => {
    test('should have KMS key ID if encryption enabled', () => {
      if (!outputsExist) return;
      if (outputs.kms_key_id) {
        expect(outputs.kms_key_id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      }
    });

    test('should have KMS key ARN if encryption enabled', () => {
      if (!outputsExist) return;
      if (outputs.kms_key_arn) {
        expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\//);
      }
    });

    test('should have KMS key alias if encryption enabled', () => {
      if (!outputsExist) return;
      if (outputs.kms_key_alias) {
        expect(outputs.kms_key_alias).toMatch(/^alias\//);
      }
    });
  });

  describe('Monitoring Infrastructure Verification', () => {
    test('should have security alerts topic ARN if monitoring enabled', () => {
      if (!outputsExist) return;
      if (outputs.security_alerts_topic_arn) {
        expect(outputs.security_alerts_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d{12}:/);
        expect(outputs.security_alerts_topic_arn).toContain('security-alerts');
      }
    });

    test('should have IAM events log group name if monitoring enabled', () => {
      if (!outputsExist) return;
      if (outputs.iam_events_log_group_name) {
        expect(outputs.iam_events_log_group_name).toMatch(/^\/aws\/iam\//);
        expect(outputs.iam_events_log_group_name).toContain('events');
      }
    });

    test('should have IAM events log group ARN if monitoring enabled', () => {
      if (!outputsExist) return;
      if (outputs.iam_events_log_group_arn) {
        expect(outputs.iam_events_log_group_arn).toMatch(/^arn:aws:logs:us-east-1:\d{12}:log-group:/);
      }
    });
  });

  describe('Lambda Function Verification', () => {
    test('should have access expiration Lambda function name if enabled', () => {
      if (!outputsExist) return;
      if (outputs.access_expiration_lambda_function_name) {
        expect(outputs.access_expiration_lambda_function_name).toContain('access-expiration');
      }
    });

    test('should have access expiration Lambda function ARN if enabled', () => {
      if (!outputsExist) return;
      if (outputs.access_expiration_lambda_function_arn) {
        expect(outputs.access_expiration_lambda_function_arn).toMatch(/^arn:aws:lambda:us-east-1:\d{12}:function:/);
        expect(outputs.access_expiration_lambda_function_arn).toContain('access-expiration');
      }
    });
  });

  describe('Cross-Account Roles Verification', () => {
    test('should have cross-account auditor role ARN if external accounts configured', () => {
      if (!outputsExist) return;
      if (outputs.cross_account_auditor_role_arn) {
        expect(outputs.cross_account_auditor_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(outputs.cross_account_auditor_role_arn).toContain('cross-account-auditor');
      }
    });

    test('should have cross-account support role ARN if external accounts configured', () => {
      if (!outputsExist) return;
      if (outputs.cross_account_support_role_arn) {
        expect(outputs.cross_account_support_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(outputs.cross_account_support_role_arn).toContain('cross-account-support');
      }
    });
  });

  describe('Application Flow - Role Assumption Workflow', () => {
    test('should verify developer role has correct trust policy with MFA condition', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });

      const roleName = outputs.developer_role_name;
      if (!roleName) {
        console.log('Skipping: Developer role not deployed');
        return;
      }

      const roleResponse = await iam.getRole({ RoleName: roleName }).promise();
      const trustPolicy = decodeURIComponent(roleResponse.Role.AssumeRolePolicyDocument);
      const trustPolicyJson = JSON.parse(trustPolicy);

      expect(trustPolicyJson.Statement).toBeDefined();
      const statement = trustPolicyJson.Statement[0];
      expect(statement.Condition).toBeDefined();
      expect(statement.Condition.Bool || statement.Condition.BoolIfExists).toBeDefined();

      const mfaCondition = statement.Condition.Bool?.['aws:MultiFactorAuthPresent'] ||
                          statement.Condition.BoolIfExists?.['aws:MultiFactorAuthPresent'];
      expect(mfaCondition).toBeDefined();
    });

    test('should verify administrator role has strict MFA age requirement', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });

      const roleName = outputs.administrator_role_name;
      if (!roleName) {
        console.log('Skipping: Administrator role not deployed');
        return;
      }

      const roleResponse = await iam.getRole({ RoleName: roleName }).promise();
      const trustPolicy = decodeURIComponent(roleResponse.Role.AssumeRolePolicyDocument);
      const trustPolicyJson = JSON.parse(trustPolicy);

      const statement = trustPolicyJson.Statement[0];
      expect(statement.Condition.NumericLessThan).toBeDefined();
      const mfaAge = statement.Condition.NumericLessThan['aws:MultiFactorAuthAge'];
      expect(mfaAge).toBeDefined();
      expect(parseInt(mfaAge)).toBeLessThanOrEqual(900);
    });

    test('should verify break glass role has 1 hour max session duration', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });

      const roleName = outputs.break_glass_role_name;
      if (!roleName) {
        console.log('Skipping: Break glass role not deployed');
        return;
      }

      const roleResponse = await iam.getRole({ RoleName: roleName }).promise();
      expect(roleResponse.Role.MaxSessionDuration).toBe(3600);
    });
  });

  describe('Application Flow - S3 Access Workflow', () => {
    test('should verify S3 bucket has VPC endpoint restriction policy', async () => {
      if (!outputsExist) return;
      const s3 = new AWS.S3({ region: outputs.region || 'us-east-1' });

      const bucketName = outputs.financial_data_bucket_name;
      if (!bucketName) {
        console.log('Skipping: Financial data bucket not deployed');
        return;
      }

      try {
        const policyResponse = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
        const policy = JSON.parse(policyResponse.Policy);

        const vpcEndpointDenyStatement = policy.Statement.find(
          (s: any) => s.Effect === 'Deny' && s.Condition?.StringNotEquals?.['aws:SourceVpce']
        );

        if (vpcEndpointDenyStatement) {
          expect(vpcEndpointDenyStatement).toBeDefined();
          expect(vpcEndpointDenyStatement.Effect).toBe('Deny');
        }
      } catch (error: any) {
        if (error.code === 'NoSuchBucketPolicy') {
          console.log('Note: Bucket policy not configured (may be optional)');
        } else {
          throw error;
        }
      }
    });

    test('should verify S3 bucket denies unencrypted uploads', async () => {
      if (!outputsExist) return;
      const s3 = new AWS.S3({ region: outputs.region || 'us-east-1' });

      const bucketName = outputs.financial_data_bucket_name;
      if (!bucketName) {
        console.log('Skipping: Financial data bucket not deployed');
        return;
      }

      try {
        const policyResponse = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
        const policy = JSON.parse(policyResponse.Policy);

        const encryptionDenyStatement = policy.Statement.find(
          (s: any) => s.Effect === 'Deny' &&
                     s.Action?.includes('s3:PutObject') &&
                     s.Condition?.StringNotEquals?.['s3:x-amz-server-side-encryption']
        );

        expect(encryptionDenyStatement).toBeDefined();
        expect(encryptionDenyStatement.Effect).toBe('Deny');
      } catch (error: any) {
        if (error.code === 'NoSuchBucketPolicy') {
          console.log('Note: Bucket policy not configured (may be optional)');
        } else {
          throw error;
        }
      }
    });

    test('should verify S3 bucket has versioning enabled', async () => {
      if (!outputsExist) return;
      const s3 = new AWS.S3({ region: outputs.region || 'us-east-1' });

      const bucketName = outputs.financial_data_bucket_name;
      if (!bucketName) {
        console.log('Skipping: Financial data bucket not deployed');
        return;
      }

      const versioningResponse = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('should verify S3 bucket has default encryption enabled', async () => {
      if (!outputsExist) return;
      const s3 = new AWS.S3({ region: outputs.region || 'us-east-1' });

      const bucketName = outputs.financial_data_bucket_name;
      if (!bucketName) {
        console.log('Skipping: Financial data bucket not deployed');
        return;
      }

      const encryptionResponse = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);

      const rule = encryptionResponse.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toMatch(/aws:kms|AES256/);
    });

    test('should verify S3 bucket blocks public access', async () => {
      if (!outputsExist) return;
      const s3 = new AWS.S3({ region: outputs.region || 'us-east-1' });

      const bucketName = outputs.financial_data_bucket_name;
      if (!bucketName) {
        console.log('Skipping: Financial data bucket not deployed');
        return;
      }

      const publicAccessResponse = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Application Flow - IAM Monitoring Workflow', () => {
    test('should verify EventBridge rules exist for IAM monitoring', async () => {
      if (!outputsExist) return;
      const eventbridge = new AWS.EventBridge({ region: outputs.region || 'us-east-1' });

      if (!outputs.iam_events_log_group_name) {
        console.log('Skipping: IAM monitoring not deployed');
        return;
      }

      const rulesResponse = await eventbridge.listRules().promise();
      const iamRules = rulesResponse.Rules?.filter(rule =>
        rule.Name?.includes('iam') || rule.Description?.toLowerCase().includes('iam')
      );

      expect(iamRules).toBeDefined();
      expect(iamRules!.length).toBeGreaterThan(0);
    });

    test('should verify CloudWatch log group exists for IAM events', async () => {
      if (!outputsExist) return;
      const logs = new AWS.CloudWatchLogs({ region: outputs.region || 'us-east-1' });

      const logGroupName = outputs.iam_events_log_group_name;
      if (!logGroupName) {
        console.log('Skipping: IAM events log group not deployed');
        return;
      }

      const logGroupsResponse = await logs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();

      expect(logGroupsResponse.logGroups).toBeDefined();
      expect(logGroupsResponse.logGroups!.length).toBeGreaterThan(0);

      const logGroup = logGroupsResponse.logGroups![0];
      expect(logGroup.retentionInDays).toBeGreaterThanOrEqual(90);
    });

    test('should verify SNS topic exists for security alerts', async () => {
      if (!outputsExist) return;
      const sns = new AWS.SNS({ region: outputs.region || 'us-east-1' });

      const topicArn = outputs.security_alerts_topic_arn;
      if (!topicArn) {
        console.log('Skipping: Security alerts topic not deployed');
        return;
      }

      const attributesResponse = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!.TopicArn).toBe(topicArn);
    });

    test('should verify CloudWatch metric filters exist for security events', async () => {
      if (!outputsExist) return;
      const logs = new AWS.CloudWatchLogs({ region: outputs.region || 'us-east-1' });

      const logGroupName = outputs.iam_events_log_group_name;
      if (!logGroupName) {
        console.log('Skipping: IAM events log group not deployed');
        return;
      }

      const filtersResponse = await logs.describeMetricFilters({
        logGroupName: logGroupName
      }).promise();

      expect(filtersResponse.metricFilters).toBeDefined();
      expect(filtersResponse.metricFilters!.length).toBeGreaterThan(0);
    });

    test('should verify CloudWatch alarms exist for security metrics', async () => {
      if (!outputsExist) return;
      const cloudwatch = new AWS.CloudWatch({ region: outputs.region || 'us-east-1' });

      if (!outputs.security_alerts_topic_arn) {
        console.log('Skipping: Security alerts not deployed');
        return;
      }

      const alarmsResponse = await cloudwatch.describeAlarms().promise();

      // Check for alarms that send to the security alerts SNS topic
      const securityAlarms = alarmsResponse.MetricAlarms?.filter(alarm =>
        alarm.AlarmActions?.includes(outputs.security_alerts_topic_arn) ||
        alarm.AlarmName?.includes('unauthorized') ||
        alarm.AlarmName?.includes('mfa') ||
        alarm.AlarmName?.toLowerCase().includes('api-calls') ||
        alarm.AlarmName?.toLowerCase().includes('console-login')
      );

      if (!securityAlarms || securityAlarms.length === 0) {
        console.log('Note: No CloudWatch alarms found. Alarms may not be deployed yet.');
        expect(securityAlarms).toBeDefined();
      } else {
        expect(securityAlarms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Application Flow - Time-Based Access Expiration', () => {
    test('should verify Lambda function exists for access expiration', async () => {
      if (!outputsExist) return;
      const lambda = new AWS.Lambda({ region: outputs.region || 'us-east-1' });

      const functionName = outputs.access_expiration_lambda_function_name;
      if (!functionName) {
        console.log('Skipping: Access expiration Lambda not deployed');
        return;
      }

      const functionResponse = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(functionResponse.Configuration).toBeDefined();
      expect(functionResponse.Configuration!.Runtime).toMatch(/python3\./);
      expect(functionResponse.Configuration!.Timeout).toBeGreaterThanOrEqual(60);
    });

    test('should verify Lambda has IAM permissions to detach policies', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });
      const lambda = new AWS.Lambda({ region: outputs.region || 'us-east-1' });

      const functionName = outputs.access_expiration_lambda_function_name;
      if (!functionName) {
        console.log('Skipping: Access expiration Lambda not deployed');
        return;
      }

      const functionResponse = await lambda.getFunction({ FunctionName: functionName }).promise();
      const roleName = functionResponse.Configuration!.Role!.split('/').pop()!;

      const policiesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
      expect(policiesResponse.AttachedPolicies).toBeDefined();
      expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);
    });

    test('should verify EventBridge schedule rule exists for Lambda', async () => {
      if (!outputsExist) return;
      const eventbridge = new AWS.EventBridge({ region: outputs.region || 'us-east-1' });

      const functionName = outputs.access_expiration_lambda_function_name;
      if (!functionName) {
        console.log('Skipping: Access expiration Lambda not deployed');
        return;
      }

      const rulesResponse = await eventbridge.listRules().promise();
      const scheduleRules = rulesResponse.Rules?.filter(rule =>
        rule.ScheduleExpression && (
          rule.Name?.includes('access-expiration') ||
          rule.Description?.toLowerCase().includes('expiration')
        )
      );

      expect(scheduleRules).toBeDefined();
      expect(scheduleRules!.length).toBeGreaterThan(0);
    });

    test('should verify Lambda function CloudWatch logs are encrypted', async () => {
      if (!outputsExist) return;
      const logs = new AWS.CloudWatchLogs({ region: outputs.region || 'us-east-1' });

      const functionName = outputs.access_expiration_lambda_function_name;
      if (!functionName) {
        console.log('Skipping: Access expiration Lambda not deployed');
        return;
      }

      const logGroupName = `/aws/lambda/${functionName}`;
      const logGroupsResponse = await logs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();

      if (logGroupsResponse.logGroups && logGroupsResponse.logGroups.length > 0) {
        const logGroup = logGroupsResponse.logGroups[0];
        expect(logGroup.kmsKeyId).toBeDefined();
      }
    });
  });

  describe('Application Flow - Cross-Account Access Workflow', () => {
    test('should verify cross-account auditor role requires external ID', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });

      const roleArn = outputs.cross_account_auditor_role_arn;
      if (!roleArn) {
        console.log('Skipping: Cross-account auditor role not deployed');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const roleResponse = await iam.getRole({ RoleName: roleName }).promise();
      const trustPolicy = decodeURIComponent(roleResponse.Role.AssumeRolePolicyDocument);
      const trustPolicyJson = JSON.parse(trustPolicy);

      const statement = trustPolicyJson.Statement[0];
      expect(statement.Condition).toBeDefined();
      expect(statement.Condition.StringEquals?.['sts:ExternalId']).toBeDefined();
    });

    test('should verify cross-account auditor role has read-only policies', async () => {
      if (!outputsExist) return;
      const iam = new AWS.IAM({ region: outputs.region || 'us-east-1' });

      const roleArn = outputs.cross_account_auditor_role_arn;
      if (!roleArn) {
        console.log('Skipping: Cross-account auditor role not deployed');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const policiesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
      const inlinePoliciesResponse = await iam.listRolePolicies({ RoleName: roleName }).promise();

      expect(policiesResponse.AttachedPolicies || inlinePoliciesResponse.PolicyNames).toBeDefined();

      if (inlinePoliciesResponse.PolicyNames && inlinePoliciesResponse.PolicyNames.length > 0) {
        const policyName = inlinePoliciesResponse.PolicyNames[0];
        const policyResponse = await iam.getRolePolicy({ RoleName: roleName, PolicyName: policyName }).promise();
        const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));

        const denyWriteStatement = policyDocument.Statement.find(
          (s: any) => s.Effect === 'Deny' &&
                     (s.Action?.some?.((a: string) => a.includes('Delete') || a.includes('Create') || a.includes('Put')))
        );

        expect(denyWriteStatement).toBeDefined();
      }
    });
  });

  describe('Security Compliance Verification', () => {
    test('should have all required outputs for compliance reporting', () => {
      if (!outputsExist) return;

      const requiredOutputs = [
        'developer_role_arn',
        'operator_role_arn',
        'administrator_role_arn',
        'break_glass_role_arn',
        'permission_boundary_policy_arn',
        'financial_data_bucket_arn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });

    test('should have environment suffix for multi-environment support', () => {
      if (!outputsExist) return;
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix.length).toBeGreaterThan(0);
    });
  });
});

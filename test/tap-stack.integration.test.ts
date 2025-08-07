import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS SDK clients
const s3 = new AWS.S3({ region: 'us-east-1' });
const kms = new AWS.KMS({ region: 'us-east-1' });
const cloudtrail = new AWS.CloudTrail({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const wafv2 = new AWS.WAFV2({ region: 'us-east-1' });
const iam = new AWS.IAM({ region: 'us-east-1' });
const cloudwatchlogs = new AWS.CloudWatchLogs({ region: 'us-east-1' });
const eventbridge = new AWS.EventBridge({ region: 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('KMS Key', () => {
    it('should have KMS key with automatic rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const keyRotationStatus = await kms
        .getKeyRotationStatus({ KeyId: keyId })
        .promise();
      expect(keyRotationStatus.KeyRotationEnabled).toBe(true);
    });

    it('should have KMS key metadata configured', async () => {
      const keyId = outputs.KMSKeyId;
      const keyMetadata = await kms
        .describeKey({ KeyId: keyId })
        .promise();

      expect(keyMetadata.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.KeyMetadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(keyMetadata.KeyMetadata?.Description).toContain(
        'KMS key for secure architecture encryption'
      );
    });
  });

  describe('S3 Buckets', () => {
    it('should have CloudTrail bucket with versioning enabled', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      expect(bucketName).toBeDefined();

      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');
    });

    it('should have CloudTrail bucket with encryption enabled', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      const encryption = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(
        1
      );
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have CloudTrail bucket with public access blocked', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      const publicAccessBlock = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    it('should have Config bucket with versioning enabled', async () => {
      const bucketName = outputs.ConfigBucketName;
      expect(bucketName).toBeDefined();

      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');
    });

    it('should have Config bucket with encryption enabled', async () => {
      const bucketName = outputs.ConfigBucketName;
      const encryption = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(
        1
      );
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('CloudTrail', () => {
    it('should have multi-region trail configured', async () => {
      const trails = await cloudtrail.describeTrails().promise();
      const stackTrail = trails.trailList?.find((trail) =>
        trail.Name?.includes('SecurityAuditTrail')
      );

      expect(stackTrail).toBeDefined();
      expect(stackTrail?.IsMultiRegionTrail).toBe(true);
      expect(stackTrail?.LogFileValidationEnabled).toBe(true);
      expect(stackTrail?.IncludeGlobalServiceEvents).toBe(true);
    });

    it('should have CloudTrail logging to CloudWatch', async () => {
      const trails = await cloudtrail.describeTrails().promise();
      const stackTrail = trails.trailList?.find((trail) =>
        trail.Name?.includes('SecurityAuditTrail')
      );

      expect(stackTrail?.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(stackTrail?.CloudWatchLogsRoleArn).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    it('should have Lambda function with encrypted environment variables', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const functionConfig = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(functionConfig.KMSKeyArn).toBeDefined();
      expect(functionConfig.Environment?.Variables).toBeDefined();
      expect(functionConfig.Environment?.Variables?.DATABASE_URL).toBe(
        'encrypted-database-connection'
      );
      expect(functionConfig.Environment?.Variables?.API_KEY).toBe(
        'encrypted-api-key'
      );
    });

    it('should have Lambda function with proper runtime', async () => {
      const functionName = outputs.LambdaFunctionName;
      const functionConfig = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(functionConfig.Runtime).toBe('nodejs18.x');
      expect(functionConfig.Handler).toBe('index.handler');
    });
  });

  describe('WAF Web ACL', () => {
    it('should have WAF Web ACL configured for CloudFront', async () => {
      const webAclArn = outputs.WebACLArn;
      expect(webAclArn).toBeDefined();

      // WAFv2 ARN format: arn:aws:wafv2:region:account:scope/resource/name/id
      expect(webAclArn).toContain(':global/');  // Verify it's global scope for CloudFront

      const webAclId = webAclArn.split('/').pop();
      const webAcl = await wafv2
        .getWebACL({
          Scope: 'CLOUDFRONT',
          Id: webAclId!,
          Name: webAclArn.split('/')[2],
        })
        .promise();

      expect(webAcl.WebACL?.DefaultAction?.Allow).toBeDefined();
    });

    it('should have AWS managed rules configured', async () => {
      const webAclArn = outputs.WebACLArn;
      const webAclId = webAclArn.split('/').pop();
      const webAclName = webAclArn.split('/')[2];

      const webAcl = await wafv2
        .getWebACL({
          Scope: 'CLOUDFRONT',
          Id: webAclId!,
          Name: webAclName,
        })
        .promise();

      const managedRule = webAcl.WebACL?.Rules?.find(
        (rule) => rule.Name === 'AWSManagedRulesCommonRuleSet'
      );

      expect(managedRule).toBeDefined();
      expect(
        managedRule?.Statement?.ManagedRuleGroupStatement?.VendorName
      ).toBe('AWS');
      expect(managedRule?.Statement?.ManagedRuleGroupStatement?.Name).toBe(
        'AWSManagedRulesCommonRuleSet'
      );
    });
  });

  describe('Security Group Change Monitoring', () => {
    it('should have CloudWatch log group for security group changes', async () => {
      const logGroups = await cloudwatchlogs
        .describeLogGroups({
          logGroupNamePrefix: '/aws/events/sg-changes',
        })
        .promise();

      const sgLogGroup = logGroups.logGroups?.find((lg) =>
        lg.logGroupName?.includes('sg-changes')
      );

      expect(sgLogGroup).toBeDefined();
      expect(sgLogGroup?.retentionInDays).toBe(365);
    });

    it('should have EventBridge rule for security group changes', async () => {
      const rules = await eventbridge.listRules().promise();
      const sgRule = rules.Rules?.find((rule) =>
        rule.Name?.includes('SecurityGroupChangeRule')
      );

      expect(sgRule).toBeDefined();
      expect(sgRule?.State).toBe('ENABLED');

      if (sgRule?.Name) {
        const ruleDetail = await eventbridge
          .describeRule({ Name: sgRule.Name })
          .promise();

        const eventPattern = JSON.parse(ruleDetail.EventPattern || '{}');
        expect(eventPattern.source).toContain('aws.ec2');
        expect(eventPattern['detail-type']).toContain(
          'AWS API Call via CloudTrail'
        );
        expect(eventPattern.detail?.eventName).toContain(
          'AuthorizeSecurityGroupIngress'
        );
      }
    });
  });

  describe('MFA Enforcement', () => {
    it('should have MFA-enabled IAM group', async () => {
      const groups = await iam.listGroups().promise();
      const mfaGroup = groups.Groups?.find((group) =>
        group.GroupName?.includes('MFAUsers')
      );

      expect(mfaGroup).toBeDefined();
    });

    it('should have MFA enforcement policy attached', async () => {
      const groups = await iam.listGroups().promise();
      const mfaGroup = groups.Groups?.find((group) =>
        group.GroupName?.includes('MFAUsers')
      );

      if (mfaGroup?.GroupName) {
        const policies = await iam
          .listGroupPolicies({ GroupName: mfaGroup.GroupName })
          .promise();

        const mfaPolicy = policies.PolicyNames?.find((policy) =>
          policy.includes('MFAEnforcement')
        );

        expect(mfaPolicy).toBeDefined();

        if (mfaPolicy) {
          const policyDocument = await iam
            .getGroupPolicy({
              GroupName: mfaGroup.GroupName,
              PolicyName: mfaPolicy,
            })
            .promise();

          const policy = JSON.parse(
            decodeURIComponent(policyDocument.PolicyDocument!)
          );
          const denyStatement = policy.Statement?.find(
            (stmt: any) => stmt.Sid === 'DenyAllExceptListedIfNoMFA'
          );

          expect(denyStatement).toBeDefined();
          expect(denyStatement?.Effect).toBe('Deny');
          expect(
            denyStatement?.Condition?.BoolIfExists?.[
              'aws:MultiFactorAuthPresent'
            ]
          ).toBe('false');
        }
      }
    });
  });

  describe('Resource Connectivity', () => {
    it('should have CloudTrail using the correct S3 bucket', async () => {
      const trails = await cloudtrail.describeTrails().promise();
      const stackTrail = trails.trailList?.find((trail) =>
        trail.Name?.includes('SecurityAuditTrail')
      );

      expect(stackTrail?.S3BucketName).toBe(outputs.CloudTrailBucketName);
    });

    it('should have Lambda function using the correct KMS key', async () => {
      const functionName = outputs.LambdaFunctionName;
      const functionConfig = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      const kmsKeyArn = functionConfig.KMSKeyArn;
      if (kmsKeyArn) {
        const keyMetadata = await kms
          .describeKey({ KeyId: kmsKeyArn })
          .promise();
        expect(keyMetadata.KeyMetadata?.KeyId).toBe(outputs.KMSKeyId);
      }
    });
  });
});
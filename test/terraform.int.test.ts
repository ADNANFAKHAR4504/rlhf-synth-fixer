import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Initialize AWS SDK
const region = 'us-east-1';
AWS.config.update({ region });

const iam = new AWS.IAM();
const ec2 = new AWS.EC2();
const secretsManager = new AWS.SecretsManager();
const cloudTrail = new AWS.CloudTrail();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const sns = new AWS.SNS();
const cloudWatch = new AWS.CloudWatch();
const cloudWatchLogs = new AWS.CloudWatchLogs();

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('Terraform Infrastructure Integration Tests', () => {
  const testTimeout = 30000;

  describe('IAM Resources', () => {
    test('Web application IAM role exists and has correct policies', async () => {
      const roleArn = outputs.web_app_role_arn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const role = await iam.getRole({ RoleName: roleName }).promise();
      
      expect(role.Role).toBeDefined();
      expect(role.Role.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
      
      // Check attached policies
      const policies = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
      expect(policies.AttachedPolicies).toBeDefined();
      expect(policies.AttachedPolicies?.length).toBeGreaterThan(0);
    }, testTimeout);

    test('Instance profile exists and is associated with role', async () => {
      const profileName = outputs.web_app_instance_profile_name;
      expect(profileName).toBeDefined();
      
      const profile = await iam.getInstanceProfile({ InstanceProfileName: profileName }).promise();
      
      expect(profile.InstanceProfile).toBeDefined();
      expect(profile.InstanceProfile.Roles.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('Security Groups', () => {
    test('Web tier security group exists with correct rules', async () => {
      const sgId = outputs.web_security_group_id;
      expect(sgId).toBeDefined();
      
      const sg = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups?.length).toBe(1);
      
      const group = sg.SecurityGroups?.[0];
      expect(group).toBeDefined();
      
      // Check ingress rules
      const httpIngress = group?.IpPermissions?.find(rule => rule.FromPort === 80);
      const httpsIngress = group?.IpPermissions?.find(rule => rule.FromPort === 443);
      
      expect(httpIngress).toBeDefined();
      expect(httpsIngress).toBeDefined();
    }, testTimeout);

    test('App tier security group exists', async () => {
      const sgId = outputs.app_security_group_id;
      expect(sgId).toBeDefined();
      
      const sg = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups?.length).toBe(1);
    }, testTimeout);

    test('Database tier security group exists with restricted access', async () => {
      const sgId = outputs.db_security_group_id;
      expect(sgId).toBeDefined();
      
      const sg = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups?.length).toBe(1);
      
      const group = sg.SecurityGroups?.[0];
      expect(group).toBeDefined();
      
      // Check that DB only allows access from app and web tiers
      const dbIngress = group?.IpPermissions?.find(rule => rule.FromPort === 3306);
      expect(dbIngress).toBeDefined();
      
      // Should only have security group references, not CIDR blocks
      expect(dbIngress?.IpRanges?.length || 0).toBe(0);
      expect(dbIngress?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('Secrets Manager', () => {
    test('Database credentials secret exists with proper configuration', async () => {
      const secretArn = outputs.db_credentials_secret_arn;
      expect(secretArn).toBeDefined();
      
      const secret = await secretsManager.describeSecret({ SecretId: secretArn }).promise();
      
      expect(secret).toBeDefined();
      expect(secret.Name).toContain('db-credentials');
      expect(secret.RotationEnabled).toBeDefined();
      
      // Check for replication
      expect(secret.ReplicationStatus).toBeDefined();
      expect(secret.ReplicationStatus?.length).toBeGreaterThan(0);
      
      const usWest2Replica = secret.ReplicationStatus?.find(r => r.Region === 'us-west-2');
      expect(usWest2Replica).toBeDefined();
    }, testTimeout);

    test('API key secret exists', async () => {
      const secretArn = outputs.api_key_secret_arn;
      expect(secretArn).toBeDefined();
      
      const secret = await secretsManager.describeSecret({ SecretId: secretArn }).promise();
      
      expect(secret).toBeDefined();
      expect(secret.Name).toContain('api-key');
      
      // Check for replication
      expect(secret.ReplicationStatus).toBeDefined();
      expect(secret.ReplicationStatus?.length).toBeGreaterThan(0);
    }, testTimeout);

    test('Secrets have version and are not empty', async () => {
      const dbSecretArn = outputs.db_credentials_secret_arn;
      const apiSecretArn = outputs.api_key_secret_arn;
      
      // Check DB credentials secret has a version
      const dbVersions = await secretsManager.listSecretVersionIds({ 
        SecretId: dbSecretArn 
      }).promise();
      
      expect(dbVersions.Versions).toBeDefined();
      expect(dbVersions.Versions?.length).toBeGreaterThan(0);
      
      // Check API key secret has a version
      const apiVersions = await secretsManager.listSecretVersionIds({ 
        SecretId: apiSecretArn 
      }).promise();
      
      expect(apiVersions.Versions).toBeDefined();
      expect(apiVersions.Versions?.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail is enabled and logging', async () => {
      const trailArn = outputs.cloudtrail_arn;
      expect(trailArn).toBeDefined();
      
      const trailName = trailArn.split('/').pop();
      const trail = await cloudTrail.getTrail({ Name: trailName! }).promise();
      
      expect(trail.Trail).toBeDefined();
      expect(trail.Trail?.IsMultiRegionTrail).toBe(true);
      expect(trail.Trail?.IncludeGlobalServiceEvents).toBe(true);
      
      // Check logging status
      const status = await cloudTrail.getTrailStatus({ Name: trailName! }).promise();
      expect(status.IsLogging).toBe(true);
    }, testTimeout);

    test('CloudTrail S3 bucket exists with encryption', async () => {
      const bucketName = outputs.cloudtrail_s3_bucket;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const bucket = await s3.getBucketLocation({ Bucket: bucketName }).promise();
      expect(bucket).toBeDefined();
      
      // Check encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, testTimeout);

    test('CloudTrail S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.cloudtrail_s3_bucket;
      
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
    }, testTimeout);

    test('CloudTrail S3 bucket blocks public access', async () => {
      const bucketName = outputs.cloudtrail_s3_bucket;
      
      const publicAccess = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, testTimeout);
  });

  describe('KMS Encryption', () => {
    test('CloudTrail KMS key exists with rotation enabled', async () => {
      const keyArn = outputs.cloudtrail_kms_key_arn;
      expect(keyArn).toBeDefined();
      
      const keyId = keyArn.split('/').pop();
      const key = await kms.describeKey({ KeyId: keyId! }).promise();
      
      expect(key.KeyMetadata).toBeDefined();
      expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyMetadata?.Enabled).toBe(true);
      
      // Check rotation status
      const rotation = await kms.getKeyRotationStatus({ KeyId: keyId! }).promise();
      expect(rotation.KeyRotationEnabled).toBe(true);
    }, testTimeout);
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch log group exists for CloudTrail', async () => {
      const logGroupName = outputs.cloudwatch_log_group_name;
      expect(logGroupName).toBeDefined();
      
      const logGroups = await cloudWatchLogs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();
      
      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    }, testTimeout);

    test('SNS topic exists for security alerts', async () => {
      const topicArn = outputs.security_alerts_topic_arn;
      expect(topicArn).toBeDefined();
      
      const topic = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      
      expect(topic.Attributes).toBeDefined();
      expect(topic.Attributes?.DisplayName).toContain('security-alerts');
    }, testTimeout);

    test('CloudWatch alarm exists for unauthorized access', async () => {
      const alarms = await cloudWatch.describeAlarms({
        AlarmNamePrefix: 'securitydemo-synthtrainr867-unauthorized'
      }).promise();
      
      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
      
      const unauthorizedAlarm = alarms.MetricAlarms?.[0];
      expect(unauthorizedAlarm).toBeDefined();
      expect(unauthorizedAlarm?.MetricName).toBe('UnauthorizedSecretAccess');
      expect(unauthorizedAlarm?.Threshold).toBe(0);
    }, testTimeout);
  });

  describe('Resource Tagging', () => {
    test('Resources have proper tags', async () => {
      // Check tags on S3 bucket
      const bucketName = outputs.cloudtrail_s3_bucket;
      const tags = await s3.getBucketTagging({ Bucket: bucketName }).promise();
      
      expect(tags.TagSet).toBeDefined();
      
      const projectTag = tags.TagSet?.find(tag => tag.Key === 'Project');
      const managedByTag = tags.TagSet?.find(tag => tag.Key === 'ManagedBy');
      
      expect(projectTag?.Value).toBe('SecurityDemo');
      expect(managedByTag?.Value).toBe('Terraform');
    }, testTimeout);
  });

  describe('Security Compliance', () => {
    test('No resources use default VPC security settings', async () => {
      const webSgId = outputs.web_security_group_id;
      const appSgId = outputs.app_security_group_id;
      const dbSgId = outputs.db_security_group_id;
      
      const sgs = await ec2.describeSecurityGroups({
        GroupIds: [webSgId, appSgId, dbSgId]
      }).promise();
      
      sgs.SecurityGroups?.forEach(sg => {
        // Check that none of the security groups allow unrestricted inbound access
        sg.IpPermissions?.forEach(rule => {
          const hasUnrestrictedAccess = rule.IpRanges?.some(range => 
            range.CidrIp === '0.0.0.0/0' && rule.FromPort !== 80 && rule.FromPort !== 443
          );
          expect(hasUnrestrictedAccess).toBeFalsy();
        });
      });
    }, testTimeout);

    test('IAM policies follow least privilege', async () => {
      const roleArn = outputs.web_app_role_arn;
      const roleName = roleArn.split('/').pop();
      
      const policies = await iam.listRolePolicies({ RoleName: roleName! }).promise();
      
      // Get inline policies
      for (const policyName of policies.PolicyNames || []) {
        const policy = await iam.getRolePolicy({
          RoleName: roleName!,
          PolicyName: policyName
        }).promise();
        
        const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument || '{}'));
        
        // Check that no statement has Resource: "*" with dangerous actions
        policyDoc.Statement?.forEach((statement: any) => {
          if (statement.Resource === '*') {
            // Only allow specific read-only or log-related actions on all resources
            const allowedActions = ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'];
            statement.Action?.forEach((action: string) => {
              expect(allowedActions).toContain(action);
            });
          }
        });
      }
    }, testTimeout);
  });

  describe('End-to-End Workflows', () => {
    test('CloudTrail to S3 workflow is functional', async () => {
      const bucketName = outputs.cloudtrail_s3_bucket;
      const trailArn = outputs.cloudtrail_arn;
      const trailName = trailArn.split('/').pop();
      
      // Check that CloudTrail is configured to write to the S3 bucket
      const trail = await cloudTrail.getTrail({ Name: trailName! }).promise();
      expect(trail.Trail?.S3BucketName).toBe(bucketName);
      
      // Check that there are CloudTrail logs in the bucket (may be empty for new trail)
      try {
        const objects = await s3.listObjectsV2({
          Bucket: bucketName,
          Prefix: 'cloudtrail-logs/',
          MaxKeys: 1
        }).promise();
        
        // It's okay if no logs exist yet, but bucket should be accessible
        expect(objects).toBeDefined();
      } catch (error: any) {
        // If we get access denied, that's a problem
        expect(error.code).not.toBe('AccessDenied');
      }
    }, testTimeout);

    test('Security group connectivity allows proper traffic flow', async () => {
      const webSgId = outputs.web_security_group_id;
      const appSgId = outputs.app_security_group_id;
      const dbSgId = outputs.db_security_group_id;
      
      const sgs = await ec2.describeSecurityGroups({
        GroupIds: [webSgId, appSgId, dbSgId]
      }).promise();
      
      const webSg = sgs.SecurityGroups?.find(sg => sg.GroupId === webSgId);
      const appSg = sgs.SecurityGroups?.find(sg => sg.GroupId === appSgId);
      const dbSg = sgs.SecurityGroups?.find(sg => sg.GroupId === dbSgId);
      
      // Web tier should have HTTP/HTTPS ingress
      const webHasHttp = webSg?.IpPermissions?.some(rule => rule.FromPort === 80);
      const webHasHttps = webSg?.IpPermissions?.some(rule => rule.FromPort === 443);
      expect(webHasHttp).toBe(true);
      expect(webHasHttps).toBe(true);
      
      // App tier should accept traffic from web tier
      const appAcceptsFromWeb = appSg?.IpPermissions?.some(rule => 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === webSgId)
      );
      expect(appAcceptsFromWeb).toBe(true);
      
      // DB tier should accept traffic from both web and app tiers
      const dbAcceptsFromWeb = dbSg?.IpPermissions?.some(rule => 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === webSgId)
      );
      const dbAcceptsFromApp = dbSg?.IpPermissions?.some(rule => 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === appSgId)
      );
      expect(dbAcceptsFromWeb).toBe(true);
      expect(dbAcceptsFromApp).toBe(true);
    }, testTimeout);
  });
});
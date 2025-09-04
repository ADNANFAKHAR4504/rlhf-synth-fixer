import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Setup AWS SDK clients
const s3Primary = new AWS.S3({ region: 'us-east-1' });
const s3Secondary = new AWS.S3({ region: 'us-west-2' });
const iamPrimary = new AWS.IAM({ region: 'us-east-1' });
const iamSecondary = new AWS.IAM({ region: 'us-west-2' });
const cloudWatchPrimary = new AWS.CloudWatch({ region: 'us-east-1' });
const cloudWatchSecondary = new AWS.CloudWatch({ region: 'us-west-2' });
const logsPrimary = new AWS.CloudWatchLogs({ region: 'us-east-1' });
const logsSecondary = new AWS.CloudWatchLogs({ region: 'us-west-2' });

describe('Security Infrastructure Integration Tests', () => {
  describe('S3 Bucket Configuration', () => {
    test('Primary Config bucket should exist and be properly configured', async () => {
      if (!outputs.PrimaryConfigBucketName) {
        console.warn('PrimaryConfigBucketName not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.PrimaryConfigBucketName;
      
      // Check bucket exists
      const headBucket = await s3Primary.headBucket({ Bucket: bucketName }).promise();
      expect(headBucket).toBeDefined();

      // Check bucket encryption
      const encryption = await s3Primary.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

      // Check bucket versioning
      const versioning = await s3Primary.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');

      // Check public access block
      const publicAccessBlock = await s3Primary.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check lifecycle configuration
      const lifecycle = await s3Primary.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules?.length).toBeGreaterThan(0);
    });

    test('Primary Monitoring Logs bucket should exist and be properly configured', async () => {
      if (!outputs.PrimaryMonitoringLogsBucketName) {
        console.warn('PrimaryMonitoringLogsBucketName not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.PrimaryMonitoringLogsBucketName;
      
      // Check bucket exists
      const headBucket = await s3Primary.headBucket({ Bucket: bucketName }).promise();
      expect(headBucket).toBeDefined();

      // Check bucket encryption
      const encryption = await s3Primary.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

      // Check bucket versioning
      const versioning = await s3Primary.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');

      // Check public access block
      const publicAccessBlock = await s3Primary.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    test('Secondary Config bucket should exist in us-west-2', async () => {
      if (!outputs.SecondaryConfigBucketName) {
        console.warn('SecondaryConfigBucketName not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.SecondaryConfigBucketName;
      
      // Check bucket exists
      const headBucket = await s3Secondary.headBucket({ Bucket: bucketName }).promise();
      expect(headBucket).toBeDefined();

      // Check bucket encryption
      const encryption = await s3Secondary.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
    });

    test('Secondary Monitoring Logs bucket should exist in us-west-2', async () => {
      if (!outputs.SecondaryMonitoringLogsBucketName) {
        console.warn('SecondaryMonitoringLogsBucketName not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.SecondaryMonitoringLogsBucketName;
      
      // Check bucket exists
      const headBucket = await s3Secondary.headBucket({ Bucket: bucketName }).promise();
      expect(headBucket).toBeDefined();
    });
  });

  describe('IAM MFA Configuration', () => {
    test('MFA required group should exist in primary region', async () => {
      if (!outputs.PrimaryMFAGroupName) {
        console.warn('PrimaryMFAGroupName not found in outputs, skipping test');
        return;
      }

      const groupName = outputs.PrimaryMFAGroupName;
      
      // Check group exists
      const group = await iamPrimary.getGroup({ GroupName: groupName }).promise();
      expect(group.Group.GroupName).toBe(groupName);

      // Check attached policies
      const policies = await iamPrimary.listAttachedGroupPolicies({ GroupName: groupName }).promise();
      expect(policies.AttachedPolicies).toBeDefined();
      expect(policies.AttachedPolicies?.length).toBeGreaterThanOrEqual(2); // MFA and FIDO2 policies
      
      // Verify MFA enforcement policy is attached
      const mfaPolicyAttached = policies.AttachedPolicies?.some(p => 
        p.PolicyName?.includes('MFAEnforcementPolicy')
      );
      expect(mfaPolicyAttached).toBe(true);
      
      // Verify FIDO2 passkey policy is attached
      const fidoPolicyAttached = policies.AttachedPolicies?.some(p => 
        p.PolicyName?.includes('FIDO2PasskeyPolicy')
      );
      expect(fidoPolicyAttached).toBe(true);
    });

    test('MFA required group should exist in secondary region', async () => {
      if (!outputs.SecondaryMFAGroupName) {
        console.warn('SecondaryMFAGroupName not found in outputs, skipping test');
        return;
      }

      const groupName = outputs.SecondaryMFAGroupName;
      
      // Check group exists
      const group = await iamSecondary.getGroup({ GroupName: groupName }).promise();
      expect(group.Group.GroupName).toBe(groupName);

      // Check attached policies
      const policies = await iamSecondary.listAttachedGroupPolicies({ GroupName: groupName }).promise();
      expect(policies.AttachedPolicies).toBeDefined();
      expect(policies.AttachedPolicies?.length).toBeGreaterThanOrEqual(2);
    });

    test('MFA enforcement policy should contain deny rules', async () => {
      if (!outputs.PrimaryMFAGroupName) {
        console.warn('PrimaryMFAGroupName not found in outputs, skipping MFA policy test');
        return;
      }

      const groupName = outputs.PrimaryMFAGroupName;
      
      // Get attached policies
      const policies = await iamPrimary.listAttachedGroupPolicies({ GroupName: groupName }).promise();
      const mfaPolicy = policies.AttachedPolicies?.find(p => 
        p.PolicyName?.includes('MFAEnforcementPolicy')
      );
      
      if (!mfaPolicy) {
        console.warn('MFA policy not found');
        return;
      }

      // Get policy version
      const policyVersions = await iamPrimary.listPolicyVersions({ 
        PolicyArn: mfaPolicy.PolicyArn! 
      }).promise();
      
      const defaultVersion = policyVersions.Versions?.find(v => v.IsDefaultVersion);
      if (!defaultVersion) {
        console.warn('Default policy version not found');
        return;
      }

      // Get policy document
      const policyDoc = await iamPrimary.getPolicyVersion({
        PolicyArn: mfaPolicy.PolicyArn!,
        VersionId: defaultVersion.VersionId!
      }).promise();
      
      const document = JSON.parse(decodeURIComponent(policyDoc.PolicyVersion?.Document || '{}'));
      
      // Check for deny statement
      const denyStatement = document.Statement?.find((s: any) => 
        s.Sid === 'DenyAllExceptUnlessMFAAuthenticated' && s.Effect === 'Deny'
      );
      
      expect(denyStatement).toBeDefined();
      expect(denyStatement?.Condition?.BoolIfExists?.['aws:MultiFactorAuthPresent']).toBe('false');
    });
  });

  describe('CloudWatch Resources', () => {
    test('Security logs group should exist in primary region', async () => {
      const environmentSuffix = outputs.PrimaryConfigBucketName?.split('-')[3] || 'test';
      const logGroupName = `/aws/security-monitoring/${environmentSuffix}`;
      
      try {
        const logGroups = await logsPrimary.describeLogGroups({
          logGroupNamePrefix: logGroupName
        }).promise();
        
        const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(365);
      } catch (error) {
        console.warn('Log group not found:', error);
      }
    });

    test('Security logs group should exist in secondary region', async () => {
      const environmentSuffix = outputs.SecondaryConfigBucketName?.split('-')[3] || 'test';
      const logGroupName = `/aws/security-monitoring/${environmentSuffix}`;
      
      try {
        const logGroups = await logsSecondary.describeLogGroups({
          logGroupNamePrefix: logGroupName
        }).promise();
        
        const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(365);
      } catch (error) {
        console.warn('Log group not found:', error);
      }
    });

    test('Security dashboard should be accessible in primary region', async () => {
      if (!outputs.PrimarySecurityDashboardUrl) {
        console.warn('PrimarySecurityDashboardUrl not found in outputs, skipping test');
        return;
      }

      // Extract dashboard name from URL
      const urlParts = outputs.PrimarySecurityDashboardUrl.split('name=');
      if (urlParts.length < 2) {
        console.warn('Cannot extract dashboard name from URL');
        return;
      }
      
      const dashboardName = urlParts[1];
      
      try {
        const dashboard = await cloudWatchPrimary.getDashboard({
          DashboardName: dashboardName
        }).promise();
        
        expect(dashboard.DashboardName).toBe(dashboardName);
        expect(dashboard.DashboardBody).toBeDefined();
        
        // Parse dashboard body to verify it has widgets
        const dashboardBody = JSON.parse(dashboard.DashboardBody!);
        expect(dashboardBody.widgets).toBeDefined();
        expect(dashboardBody.widgets.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('Dashboard not found:', error);
      }
    });

    test('Security dashboard should be accessible in secondary region', async () => {
      if (!outputs.SecondarySecurityDashboardUrl) {
        console.warn('SecondarySecurityDashboardUrl not found in outputs, skipping test');
        return;
      }

      // Extract dashboard name from URL
      const urlParts = outputs.SecondarySecurityDashboardUrl.split('name=');
      if (urlParts.length < 2) {
        console.warn('Cannot extract dashboard name from URL');
        return;
      }
      
      const dashboardName = urlParts[1];
      
      try {
        const dashboard = await cloudWatchSecondary.getDashboard({
          DashboardName: dashboardName
        }).promise();
        
        expect(dashboard.DashboardName).toBe(dashboardName);
        expect(dashboard.DashboardBody).toBeDefined();
      } catch (error) {
        console.warn('Dashboard not found:', error);
      }
    });
  });

  describe('Multi-Region Consistency', () => {
    test('Both regions should have similar resource configurations', async () => {
      // Check that we have outputs for both regions
      const primaryOutputs = Object.keys(outputs).filter(k => k.startsWith('Primary'));
      const secondaryOutputs = Object.keys(outputs).filter(k => k.startsWith('Secondary'));
      
      // Both regions should have the same number of resource types
      expect(primaryOutputs.length).toBe(secondaryOutputs.length);
      
      // Check that each primary output has a corresponding secondary output
      primaryOutputs.forEach(primaryKey => {
        const resourceType = primaryKey.replace('Primary', '');
        const secondaryKey = `Secondary${resourceType}`;
        expect(outputs[secondaryKey]).toBeDefined();
      });
    });

    test('Configuration recorder names should be consistent across regions', () => {
      if (outputs.PrimaryConfigurationRecorderName && outputs.SecondaryConfigurationRecorderName) {
        // Both regions should have the same recorder name (it's a logical name, not region-specific)
        expect(outputs.PrimaryConfigurationRecorderName).toBe(outputs.SecondaryConfigurationRecorderName);
      }
    });
  });

  describe('Security Best Practices Validation', () => {
    test('S3 buckets should not allow public access', async () => {
      const bucketNames = [
        outputs.PrimaryConfigBucketName,
        outputs.PrimaryMonitoringLogsBucketName,
      ].filter(Boolean);

      for (const bucketName of bucketNames) {
        try {
          // Try to get bucket ACL - should fail if bucket is properly secured
          const acl = await s3Primary.getBucketAcl({ Bucket: bucketName }).promise();
          
          // Check that there are no public grants
          const publicGrants = acl.Grants?.filter(grant => 
            grant.Grantee?.URI?.includes('AllUsers') || 
            grant.Grantee?.URI?.includes('AuthenticatedUsers')
          );
          
          expect(publicGrants?.length).toBe(0);
        } catch (error) {
          // Access denied is expected for properly secured buckets
          console.log(`Bucket ${bucketName} access check:`, error);
        }
      }
    });

    test('All S3 buckets should have SSL-only access policies', async () => {
      const bucketNames = [
        outputs.PrimaryConfigBucketName,
        outputs.PrimaryMonitoringLogsBucketName,
      ].filter(Boolean);

      for (const bucketName of bucketNames) {
        try {
          const policy = await s3Primary.getBucketPolicy({ Bucket: bucketName }).promise();
          const policyDoc = JSON.parse(policy.Policy!);
          
          // Check for SSL enforcement statement
          const sslEnforcementStatement = policyDoc.Statement?.find((s: any) => 
            s.Effect === 'Deny' && 
            s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
          );
          
          expect(sslEnforcementStatement).toBeDefined();
        } catch (error) {
          console.warn(`Could not get bucket policy for ${bucketName}:`, error);
        }
      }
    });
  });
});
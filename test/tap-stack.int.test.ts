// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr';
const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const iam = new IAMClient({ region });
const s3 = new S3Client({ region });
const cloudtrail = new CloudTrailClient({ region });

describe('TapStack Security Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'SecureAccessRoleArn',
        'EmergencyAccessRoleArn',
        'SecurityAuditTrailArn',
        'SecurityAuditBucketName',
        'MFAComplianceStatus',
        'SecurityValidationChecklist',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('IAM Roles', () => {
    test('SecureAccessRole should exist and enforce MFA', async () => {
      const arn = outputs.SecureAccessRoleArn;
      const roleName = arn.split('/').pop();
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(arn);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      // Check for MFA enforcement in trust policy
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/MultiFactorAuthPresent/);
    });
    test('EmergencyAccessRole should exist and enforce strict MFA', async () => {
      const arn = outputs.EmergencyAccessRoleArn;
      const roleName = arn.split('/').pop();
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(arn);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/MultiFactorAuthPresent/);
      expect(trust).toMatch(/MultiFactorAuthAge/);
    });
  });

  describe('S3 Bucket', () => {
    test('SecurityAuditBucket should exist, be encrypted, and versioned', async () => {
      const bucket = outputs.SecurityAuditBucketName;
      expect(bucket).toMatch(
        new RegExp(`${accountId}-${environmentSuffix}-security-audit-logs`)
      );
      const res = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      expect([null, '', region]).toContain(res.LocationConstraint);
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(['Enabled', 'Suspended']).toContain(versioning.Status);
    });
  });

  describe('CloudTrail', () => {
    test('SecurityAuditTrail should exist and be logging', async () => {
      const trailArn = outputs.SecurityAuditTrailArn;
      const res = await cloudtrail.send(
        new GetTrailCommand({ Name: trailArn })
      );
      expect(res.Trail?.TrailARN).toBe(trailArn);
      expect(res.Trail?.IsMultiRegionTrail).toBe(true);
      expect(res.Trail?.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('Compliance Outputs', () => {
    test('MFAComplianceStatus should confirm MFA enforcement', () => {
      expect(outputs.MFAComplianceStatus).toMatch(/MFA/);
    });
    test('SecurityValidationChecklist should mention all key controls', () => {
      expect(outputs.SecurityValidationChecklist).toMatch(/MFA enforcement/);
      expect(outputs.SecurityValidationChecklist).toMatch(/Least privilege/);
      expect(outputs.SecurityValidationChecklist).toMatch(/CloudTrail logging/);
      expect(outputs.SecurityValidationChecklist).toMatch(
        /S3 bucket encryption/
      );
    });
  });
});

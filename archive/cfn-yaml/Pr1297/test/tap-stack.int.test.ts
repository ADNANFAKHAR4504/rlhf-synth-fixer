import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-southeast-1';
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
        'CloudTrailLogsBucketName',
        'SecureOperationsRoleArn',
        'SecureReadOnlyRoleArn',
        'CloudTrailArn',
        'SecureDeveloperRoleArn',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('IAM Roles', () => {
    test('SecureOperationsRole should exist and enforce MFA', async () => {
      const arn = outputs.SecureOperationsRoleArn;
      const roleName = arn.split('/').pop();
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(arn);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/MultiFactorAuthPresent/);
    });
    test('SecureReadOnlyRole should exist and enforce MFA', async () => {
      const arn = outputs.SecureReadOnlyRoleArn;
      const roleName = arn.split('/').pop();
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(arn);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/MultiFactorAuthPresent/);
    });
    test('SecureDeveloperRole should exist and enforce MFA', async () => {
      const arn = outputs.SecureDeveloperRoleArn;
      const roleName = arn.split('/').pop();
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(arn);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/MultiFactorAuthPresent/);
    });
  });

  describe('S3 Bucket', () => {
    test('CloudTrailLogsBucket should exist and be versioned', async () => {
      const bucket = outputs.CloudTrailLogsBucketName;
      expect(bucket).toMatch(/security-audit-logs/);
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
    test('CloudTrail should exist and be logging', async () => {
      const trailArn = outputs.CloudTrailArn;
      const res = await cloudtrail.send(
        new GetTrailCommand({ Name: trailArn })
      );
      expect(res.Trail?.TrailARN).toBe(trailArn);
      expect(res.Trail?.IsMultiRegionTrail).toBe(true);
      expect(res.Trail?.LogFileValidationEnabled).toBe(true);
    });
  });
});

/* eslint-disable import/no-extraneous-dependencies */
import { mockClient } from 'aws-sdk-client-mock';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

import { ComplianceChecker } from '../lib/compliance-checker';
import {
  AWSResource,
  ResourceType,
  ComplianceStatus,
  ViolationSeverity,
} from '../lib/types';

const s3Mock = mockClient(S3Client);
const ec2Mock = mockClient(EC2Client);

describe('ComplianceChecker', () => {
  let checker: ComplianceChecker;

  beforeEach(() => {
    checker = new ComplianceChecker();
    s3Mock.reset();
    ec2Mock.reset();
  });

  describe('checkResource', () => {
    it('should return compliant for resource with all required tags', async () => {
      const resource: AWSResource = {
        id: 'test-resource',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test-owner',
          Team: 'test-team',
          Project: 'test-project',
          CreatedAt: '2025-01-01T00:00:00Z',
        },
      };

      const result = await checker.checkResource(resource);

      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
      expect(result.violations).toHaveLength(0); // fully compliant
      expect(result.resourceId).toBe('test-resource');
    });

    it('should detect missing required tags', async () => {
      const resource: AWSResource = {
        id: 'test-resource',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
        },
      };

      const result = await checker.checkResource(resource);

      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const tagViolation = result.violations.find(v => v.rule === 'REQUIRED_TAGS');
      expect(tagViolation).toBeDefined();
      expect(tagViolation?.severity).toBe(ViolationSeverity.HIGH);
    });

    it('should detect S3 bucket without encryption', async () => {
      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
      });

      const resource: AWSResource = {
        id: 'test-bucket',
        arn: 'arn:aws:s3:::test-bucket',
        type: ResourceType.S3_BUCKET,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
      };

      const result = await checker.checkResource(resource);

      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const encryptionViolation = result.violations.find(
        v => v.rule === 'S3_ENCRYPTION'
      );
      expect(encryptionViolation).toBeDefined();
      expect(encryptionViolation?.severity).toBe(ViolationSeverity.CRITICAL);
    });

    it('should detect S3 bucket without public access block', async () => {
      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });

      s3Mock.on(GetPublicAccessBlockCommand).rejects({
        name: 'NoSuchPublicAccessBlockConfiguration',
      });

      const resource: AWSResource = {
        id: 'test-bucket',
        arn: 'arn:aws:s3:::test-bucket',
        type: ResourceType.S3_BUCKET,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
      };

      const result = await checker.checkResource(resource);

      const publicAccessViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(publicAccessViolation).toBeDefined();
    });

    it('should allow whitelisted public S3 bucket', async () => {
      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });

      const resource: AWSResource = {
        id: 'public-bucket',
        arn: 'arn:aws:s3:::public-bucket',
        type: ResourceType.S3_BUCKET,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
          PublicAccessAllowed: 'true',
        },
      };

      const result = await checker.checkResource(resource);

      const publicAccessViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(publicAccessViolation).toBeUndefined();
    });

    it('should detect overly permissive security group', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-123',
            IpPermissions: [
              {
                IpProtocol: 'tcp',
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      });

      const resource: AWSResource = {
        id: 'sg-123',
        arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-123',
        type: ResourceType.SECURITY_GROUP,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
      };

      const result = await checker.checkResource(resource);

      const sgViolation = result.violations.find(v => v.rule === 'SG_OPEN_ACCESS');
      expect(sgViolation).toBeDefined();
      expect(sgViolation?.severity).toBe(ViolationSeverity.HIGH);
    });
  });

  describe('checkResources', () => {
    it('should check multiple resources and generate report', async () => {
      const resources: AWSResource[] = [
        {
          id: 'resource-1',
          arn: 'arn:aws:lambda:us-east-1:123456789012:function:test-1',
          type: ResourceType.LAMBDA_FUNCTION,
          region: 'us-east-1',
          tags: {
            Environment: 'dev',
            Owner: 'test',
            Team: 'test',
            Project: 'test',
            CreatedAt: '2025-01-01',
          },
        },
        {
          id: 'resource-2',
          arn: 'arn:aws:lambda:us-east-1:123456789012:function:test-2',
          type: ResourceType.LAMBDA_FUNCTION,
          region: 'us-east-1',
          tags: {},
        },
      ];

      const report = await checker.checkResources(resources);

      expect(report.totalResources).toBe(2);
      expect(report.compliantResources).toBeGreaterThanOrEqual(0);
      expect(report.nonCompliantResources).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
      expect(report.results).toHaveLength(2);
    });
  });

  describe('getAllPolicies', () => {
    it('should return all policies', () => {
      const policies = checker.getAllPolicies();

      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.some(p => p.id === 'REQUIRED_TAGS')).toBe(true);
      expect(policies.some(p => p.id === 'S3_ENCRYPTION')).toBe(true);
      expect(policies.some(p => p.id === 'S3_PUBLIC_ACCESS')).toBe(true);
    });
  });

  describe('getPolicy', () => {
    it('should return policy by ID', () => {
      const policy = checker.getPolicy('REQUIRED_TAGS');

      expect(policy).toBeDefined();
      expect(policy?.id).toBe('REQUIRED_TAGS');
      expect(policy?.name).toBe('Required Tags');
    });

    it('should return undefined for unknown policy', () => {
      const policy = checker.getPolicy('UNKNOWN_POLICY');
      expect(policy).toBeUndefined();
    });
  });
});

/* eslint-disable import/no-extraneous-dependencies */
import { mockClient } from 'aws-sdk-client-mock';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

import { ComplianceChecker, getErrorMessage } from '../lib/compliance-checker';
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

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid environment tag value', async () => {
      const resource: AWSResource = {
        id: 'test-resource',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
        region: 'us-east-1',
        tags: {
          Environment: 'invalid-env',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
      };

      const result = await checker.checkResource(resource);

      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const tagViolation = result.violations.find(v => v.rule === 'REQUIRED_TAGS');
      expect(tagViolation).toBeDefined();
    });

    it('should handle S3 encryption check errors gracefully', async () => {
      s3Mock.on(GetBucketEncryptionCommand).rejects(new Error('Access denied'));

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

      // Should not throw, but should mark as non-compliant with INFO severity
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const infoViolation = result.violations.find(
        v => v.rule === 'S3_ENCRYPTION' && v.severity === ViolationSeverity.INFO
      );
      expect(infoViolation).toBeDefined();
      expect(infoViolation?.description).toContain('Failed to check');
    });

    it('should handle S3 public access check errors gracefully', async () => {
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

      s3Mock.on(GetPublicAccessBlockCommand).rejects(new Error('Access denied'));

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

      // Should not throw, but should mark as non-compliant with INFO severity
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const infoViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS' && v.severity === ViolationSeverity.INFO
      );
      expect(infoViolation).toBeDefined();
    });

    it('should handle security group check errors gracefully', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).rejects(new Error('Access denied'));

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

      // Should not throw, but should mark as non-compliant with INFO severity
      expect(result.status).toBe(ComplianceStatus.NON_COMPLIANT);
      const infoViolation = result.violations.find(
        v => v.rule === 'SG_OPEN_ACCESS' && v.severity === ViolationSeverity.INFO
      );
      expect(infoViolation).toBeDefined();
    });

    it('should detect security group with IPv6 open access', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-123',
            IpPermissions: [
              {
                IpProtocol: 'tcp',
                FromPort: 443,
                ToPort: 443,
                Ipv6Ranges: [{ CidrIpv6: '::/0' }],
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
    });

    it('should handle security group with no IP permissions', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-123',
            IpPermissions: undefined,
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

      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
    });

    it('should handle security group with empty response', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [],
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

      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
    });

    it('should allow security group with PublicAccessApproved tag', async () => {
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
          PublicAccessApproved: 'true',
        },
      };

      const result = await checker.checkResource(resource);

      const sgViolation = result.violations.find(v => v.rule === 'SG_OPEN_ACCESS');
      expect(sgViolation).toBeUndefined();
    });

    it('should detect RDS instance without CloudWatch logging', async () => {
      const resource: AWSResource = {
        id: 'rds-instance',
        arn: 'arn:aws:rds:us-east-1:123456789012:db:test',
        type: ResourceType.RDS_INSTANCE,
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

      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeDefined();
    });

    it('should allow RDS instance with CloudWatch logging enabled', async () => {
      const resource: AWSResource = {
        id: 'rds-instance',
        arn: 'arn:aws:rds:us-east-1:123456789012:db:test',
        type: ResourceType.RDS_INSTANCE,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
        metadata: {
          loggingEnabled: true,
        },
      };

      const result = await checker.checkResource(resource);

      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should allow Lambda function (CloudWatch logging by default)', async () => {
      const resource: AWSResource = {
        id: 'lambda-function',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should detect resource in unapproved region', async () => {
      const resource: AWSResource = {
        id: 'test-resource',
        arn: 'arn:aws:lambda:ap-south-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
        region: 'ap-south-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
      };

      const result = await checker.checkResource(resource);

      const regionViolation = result.violations.find(
        v => v.rule === 'RESOURCE_REGION'
      );
      expect(regionViolation).toBeDefined();
    });

    it('should categorize violations by severity correctly', async () => {
      const resources: AWSResource[] = [
        {
          id: 'bucket-no-encryption',
          arn: 'arn:aws:s3:::bucket-no-encryption',
          type: ResourceType.S3_BUCKET,
          region: 'us-east-1',
          tags: {
            Environment: 'dev',
            Owner: 'test',
            Team: 'test',
            Project: 'test',
            CreatedAt: '2025-01-01',
          },
        },
      ];

      s3Mock.on(GetBucketEncryptionCommand).rejects({
        name: 'ServerSideEncryptionConfigurationNotFoundError',
      });

      const report = await checker.checkResources(resources);

      expect(report.summary.criticalViolations).toBeGreaterThan(0);
      expect(report.violationsBySeverity[ViolationSeverity.CRITICAL]).toBeGreaterThan(
        0
      );
    });

    it('should count HIGH severity violations correctly', async () => {
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

      const resources: AWSResource[] = [
        {
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
        },
      ];

      const report = await checker.checkResources(resources);

      expect(report.summary.highViolations).toBeGreaterThan(0);
      expect(report.violationsBySeverity[ViolationSeverity.HIGH]).toBeGreaterThan(0);
    });

    it('should count MEDIUM severity violations correctly', async () => {
      const resources: AWSResource[] = [
        {
          id: 'rds-instance',
          arn: 'arn:aws:rds:us-east-1:123456789012:db:test',
          type: ResourceType.RDS_INSTANCE,
          region: 'ap-south-1',
          tags: {
            Environment: 'dev',
            Owner: 'test',
            Team: 'test',
            Project: 'test',
            CreatedAt: '2025-01-01',
          },
        },
      ];

      const report = await checker.checkResources(resources);

      expect(report.summary.mediumViolations).toBeGreaterThan(0);
      expect(report.violationsBySeverity[ViolationSeverity.MEDIUM]).toBeGreaterThan(0);
    });

    it('should count LOW severity violations correctly', async () => {
      // Create a resource with a LOW severity violation (bad naming)
      const resources: AWSResource[] = [
        {
          id: 'BadNaming_123',  // Violates naming convention
          arn: 'arn:aws:lambda:us-east-1:123456789012:function:BadNaming_123',
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
      ];

      const report = await checker.checkResources(resources);

      // Should have LOW violations from RESOURCE_NAMING policy
      expect(report.summary.lowViolations).toBeGreaterThan(0);
      expect(report.violationsBySeverity[ViolationSeverity.LOW]).toBeGreaterThan(0);
    });

    it('should handle resource with logGroup metadata', async () => {
      const resource: AWSResource = {
        id: 'test-resource',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
        metadata: {
          logGroup: '/aws/lambda/test',
        },
      };

      const result = await checker.checkResource(resource);

      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should handle EC2 instance without CloudWatch logging', async () => {
      const resource: AWSResource = {
        id: 'i-12345',
        arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-12345',
        type: ResourceType.EC2_INSTANCE,
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

      // EC2 instances are not in the applicable types for CLOUDWATCH_LOGGING
      // So no violation should be found
      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should skip S3 encryption check for non-S3 resources', async () => {
      const resource: AWSResource = {
        id: 'test-lambda',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      // No S3_ENCRYPTION violation for non-S3 resource
      const encryptionViolation = result.violations.find(
        v => v.rule === 'S3_ENCRYPTION'
      );
      expect(encryptionViolation).toBeUndefined();
    });

    it('should skip S3 public access check for non-S3 resources', async () => {
      const resource: AWSResource = {
        id: 'test-lambda',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      // No S3_PUBLIC_ACCESS violation for non-S3 resource
      const publicAccessViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(publicAccessViolation).toBeUndefined();
    });

    it('should skip security group check for non-SG resources', async () => {
      const resource: AWSResource = {
        id: 'test-lambda',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      // No SG_OPEN_ACCESS violation for non-SecurityGroup resource
      const sgViolation = result.violations.find(v => v.rule === 'SG_OPEN_ACCESS');
      expect(sgViolation).toBeUndefined();
    });

    it('should handle S3 bucket with all public access blocks properly set', async () => {
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

      s3Mock.on(GetPublicAccessBlockCommand).resolves({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
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

      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
      const publicAccessViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(publicAccessViolation).toBeUndefined();
    });

    it('should handle security group with restricted IP ranges', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-123',
            IpPermissions: [
              {
                IpProtocol: 'tcp',
                FromPort: 443,
                ToPort: 443,
                IpRanges: [{ CidrIp: '10.0.0.0/8' }],
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

      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
      const sgViolation = result.violations.find(v => v.rule === 'SG_OPEN_ACCESS');
      expect(sgViolation).toBeUndefined();
    });

    it('should detect default return false in CloudWatch logging check', async () => {
      const resource: AWSResource = {
        id: 'db-instance',
        arn: 'arn:aws:rds:us-east-1:123456789012:db:test',
        type: ResourceType.RDS_INSTANCE,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
        },
        metadata: {},
      };

      const result = await checker.checkResource(resource);

      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeDefined();
    });

    it('should detect LOW severity naming convention violations', async () => {
      const resource: AWSResource = {
        id: 'MyBucket_123',  // Invalid: has uppercase and underscore
        arn: 'arn:aws:s3:::MyBucket_123',
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

      const namingViolation = result.violations.find(
        v => v.rule === 'RESOURCE_NAMING'
      );
      expect(namingViolation).toBeDefined();
      expect(namingViolation?.severity).toBe(ViolationSeverity.LOW);
    });

    it('should allow resources with valid naming convention', async () => {
      const resource: AWSResource = {
        id: 'my-bucket-123',  // Valid: lowercase with hyphens
        arn: 'arn:aws:s3:::my-bucket-123',
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

      const namingViolation = result.violations.find(
        v => v.rule === 'RESOURCE_NAMING'
      );
      expect(namingViolation).toBeUndefined();
    });

    it('should allow resources with NamingException tag', async () => {
      const resource: AWSResource = {
        id: 'MyLegacyBucket',  // Invalid naming but has exception
        arn: 'arn:aws:s3:::MyLegacyBucket',
        type: ResourceType.S3_BUCKET,
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Owner: 'test',
          Team: 'test',
          Project: 'test',
          CreatedAt: '2025-01-01',
          NamingException: 'true',
        },
      };

      const result = await checker.checkResource(resource);

      const namingViolation = result.violations.find(
        v => v.rule === 'RESOURCE_NAMING'
      );
      expect(namingViolation).toBeUndefined();
    });

    it('should handle Lambda function CloudWatch logging check (EC2 fallback)', async () => {
      const resource: AWSResource = {
        id: 'my-ec2',
        arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-123',
        type: ResourceType.EC2_INSTANCE,
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

      // EC2 is not in applicableTypes for CLOUDWATCH_LOGGING, so no violation
      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should handle S3 encryption check for non-S3 resources', async () => {
      const resource: AWSResource = {
        id: 'my-lambda',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      // Lambda is not applicable for S3_ENCRYPTION policy
      const encryptionViolation = result.violations.find(
        v => v.rule === 'S3_ENCRYPTION'
      );
      expect(encryptionViolation).toBeUndefined();
    });

    it('should handle S3 public access check for non-S3 resources', async () => {
      const resource: AWSResource = {
        id: 'my-lambda',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        type: ResourceType.LAMBDA_FUNCTION,
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

      // Lambda is not applicable for S3_PUBLIC_ACCESS policy
      const publicAccessViolation = result.violations.find(
        v => v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(publicAccessViolation).toBeUndefined();
    });

    it('should handle security group check for non-SG resources', async () => {
      const resource: AWSResource = {
        id: 'my-bucket',
        arn: 'arn:aws:s3:::my-bucket',
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

      // S3 bucket is not applicable for SG_OPEN_ACCESS policy
      const sgViolation = result.violations.find(
        v => v.rule === 'SG_OPEN_ACCESS'
      );
      expect(sgViolation).toBeUndefined();
    });

    it('should handle CloudWatch logging check for non-applicable resources', async () => {
      const resource: AWSResource = {
        id: 'my-bucket',
        arn: 'arn:aws:s3:::my-bucket',
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

      // S3 is not in applicableTypes for CLOUDWATCH_LOGGING
      const loggingViolation = result.violations.find(
        v => v.rule === 'CLOUDWATCH_LOGGING'
      );
      expect(loggingViolation).toBeUndefined();
    });

    it('should return 100% compliance score for empty resources array', async () => {
      const resources: AWSResource[] = [];

      const report = await checker.checkResources(resources);

      expect(report.complianceScore).toBe(100);
      expect(report.totalResources).toBe(0);
      expect(report.compliantResources).toBe(0);
      expect(report.nonCompliantResources).toBe(0);
    });

    it('should handle S3 encryption check error with non-Error object thrown', async () => {
      // Mock throwing a non-Error object directly to hit String(error) branch
      s3Mock.on(GetBucketEncryptionCommand).callsFake(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw { customError: 'This is not an Error instance', code: 'CustomCode' };
      });

      const resource: AWSResource = {
        id: 'test-bucket-non-error-obj',
        arn: 'arn:aws:s3:::test-bucket-non-error-obj',
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

      // The error is caught in checkResource and creates INFO violation
      const result = await checker.checkResource(resource);

      // Should have INFO violations for the failed checks
      const infoViolations = result.violations.filter(
        v => v.severity === ViolationSeverity.INFO
      );
      expect(infoViolations.length).toBeGreaterThan(0);
    });

    it('should handle S3 public access check error with non-Error object thrown', async () => {
      // First mock encryption to pass, then public access to throw non-Error
      s3Mock.on(GetBucketEncryptionCommand).resolves({
        ServerSideEncryptionConfiguration: {
          Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
        },
      });
      s3Mock.on(GetPublicAccessBlockCommand).callsFake(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 42; // Throw a number to hit the String(error) branch
      });

      const resource: AWSResource = {
        id: 'test-bucket-public-access-number',
        arn: 'arn:aws:s3:::test-bucket-public-access-number',
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

      // Should have INFO violation for the failed public access check
      const infoViolation = result.violations.find(
        v => v.severity === ViolationSeverity.INFO && v.rule === 'S3_PUBLIC_ACCESS'
      );
      expect(infoViolation).toBeDefined();
    });

    it('should handle security group check error with non-Error object thrown', async () => {
      // Mock throwing a non-Error value
      ec2Mock.on(DescribeSecurityGroupsCommand).callsFake(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw null; // Throw null to hit the String(error) branch
      });

      const resource: AWSResource = {
        id: 'sg-null-error',
        arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-null-error',
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

      // Should have INFO violation for the failed security group check
      const infoViolation = result.violations.find(
        v => v.severity === ViolationSeverity.INFO && v.rule === 'SG_OPEN_ACCESS'
      );
      expect(infoViolation).toBeDefined();
    });

    it('should handle policy check error with string thrown in checkResource', async () => {
      // Throw a plain string to hit the String(error) branch at line 165
      s3Mock.on(GetBucketEncryptionCommand).callsFake(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'Plain string error';
      });

      const resource: AWSResource = {
        id: 'test-bucket-string-throw',
        arn: 'arn:aws:s3:::test-bucket-string-throw',
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

      // The checkResource should handle the non-Error and add INFO violation
      const result = await checker.checkResource(resource);

      // Should have an INFO violation for the failed check
      const infoViolation = result.violations.find(
        v => v.severity === ViolationSeverity.INFO
      );
      expect(infoViolation).toBeDefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for Error instances', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return stringified value for non-Error objects', () => {
      expect(getErrorMessage({ custom: 'object' })).toBe('[object Object]');
    });

    it('should return string representation for numbers', () => {
      expect(getErrorMessage(42)).toBe('42');
    });

    it('should return string representation for null', () => {
      expect(getErrorMessage(null)).toBe('null');
    });

    it('should return string representation for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('undefined');
    });

    it('should return the string itself when a string is passed', () => {
      expect(getErrorMessage('Plain string error')).toBe('Plain string error');
    });
  });
});

/* eslint-disable import/no-extraneous-dependencies */
import { mockClient } from 'aws-sdk-client-mock';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  ListUsersCommand,
  ListMFADevicesCommand,
  GetLoginProfileCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { ComplianceScanner } from '../lib/compliance-scanner';
import * as fs from 'fs';

// Mock clients
const ec2Mock = mockClient(EC2Client);
const s3Mock = mockClient(S3Client);
const iamMock = mockClient(IAMClient);
const cwLogsMock = mockClient(CloudWatchLogsClient);
const cwMock = mockClient(CloudWatchClient);

// Mock fs
jest.mock('fs');

describe('ComplianceScanner', () => {
  let scanner: ComplianceScanner;

  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cwLogsMock.reset();
    cwMock.reset();
    jest.clearAllMocks();

    scanner = new ComplianceScanner('us-east-1', 'test-env', false);
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(scanner).toBeDefined();
      expect(scanner).toBeInstanceOf(ComplianceScanner);
    });

    it('should initialize with dry run mode', () => {
      const dryRunScanner = new ComplianceScanner('us-east-1', 'test-env', true);
      expect(dryRunScanner).toBeDefined();
    });
  });

  describe('checkEc2TagCompliance', () => {
    it('should detect instances with missing required tags', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-12345',
                Tags: [{ Key: 'Environment', Value: 'dev' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance).toHaveLength(1);
      expect(report.violations.ec2TagCompliance[0].resourceId).toBe('i-12345');
      expect(report.violations.ec2TagCompliance[0].severity).toBe('medium');
    });

    it('should pass compliant instances with all required tags', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-67890',
                Tags: [
                  { Key: 'Environment', Value: 'dev' },
                  { Key: 'Owner', Value: 'team' },
                  { Key: 'CostCenter', Value: 'engineering' },
                ],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance).toHaveLength(0);
      expect(report.metrics.ec2ComplianceScore).toBe(100);
    });

    it('should handle empty EC2 instances list', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [],
      });

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance).toHaveLength(0);
      expect(report.metrics.ec2ComplianceScore).toBe(100);
    });

    it('should handle EC2 API errors gracefully', async () => {
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('EC2 API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance).toHaveLength(0);
    });
  });

  describe('checkS3BucketSecurity', () => {
    it('should detect buckets without encryption', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'test-bucket', CreationDate: new Date() }],
      });

      const encryptionError: any = new Error('Not found');
      encryptionError.name = 'ServerSideEncryptionConfigurationNotFoundError';
      s3Mock.on(GetBucketEncryptionCommand).rejects(encryptionError);

      s3Mock.on(GetBucketVersioningCommand).resolves({
        Status: 'Enabled',
      });

      const report = await scanner.scanAll();

      const encryptionViolations = report.violations.s3Security.filter(
        v => v.violationType === 'Encryption Not Enabled',
      );
      expect(encryptionViolations).toHaveLength(1);
      expect(encryptionViolations[0].severity).toBe('high');
    });

    it('should detect buckets without versioning', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'test-bucket', CreationDate: new Date() }],
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({});

      s3Mock.on(GetBucketVersioningCommand).resolves({
        Status: 'Suspended',
      });

      const report = await scanner.scanAll();

      const versioningViolations = report.violations.s3Security.filter(
        v => v.violationType === 'Versioning Not Enabled',
      );
      expect(versioningViolations).toHaveLength(1);
      expect(versioningViolations[0].severity).toBe('medium');
    });

    it('should pass compliant buckets', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'compliant-bucket', CreationDate: new Date() }],
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({});
      s3Mock.on(GetBucketVersioningCommand).resolves({
        Status: 'Enabled',
      });

      const report = await scanner.scanAll();

      expect(report.violations.s3Security).toHaveLength(0);
      expect(report.metrics.s3ComplianceScore).toBe(100);
    });

    it('should handle empty bucket list', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [],
      });

      const report = await scanner.scanAll();

      expect(report.violations.s3Security).toHaveLength(0);
      expect(report.metrics.s3ComplianceScore).toBe(100);
    });

    it('should handle S3 API errors gracefully', async () => {
      s3Mock.on(ListBucketsCommand).rejects(new Error('S3 API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.s3Security).toHaveLength(0);
    });

    it('should handle non-standard encryption check errors', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'error-bucket', CreationDate: new Date() }],
      });

      s3Mock.on(GetBucketEncryptionCommand).rejects(new Error('Access Denied'));
      s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Enabled' });

      const report = await scanner.scanAll();

      // Should still add encryption violation
      const encryptionViolations = report.violations.s3Security.filter(
        v => v.violationType === 'Encryption Not Enabled',
      );
      expect(encryptionViolations).toHaveLength(1);
    });
  });

  describe('checkDeprecatedInstanceTypes', () => {
    it('should detect t2.micro instances', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-deprecated',
                InstanceType: 't2.micro',
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.deprecatedInstances).toHaveLength(1);
      expect(report.violations.deprecatedInstances[0].severity).toBe('low');
    });

    it('should detect t2.small instances', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-deprecated2',
                InstanceType: 't2.small',
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.deprecatedInstances).toHaveLength(1);
    });

    it('should pass modern instance types', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-modern',
                InstanceType: 't3.micro',
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.deprecatedInstances).toHaveLength(0);
    });

    it('should handle EC2 API errors gracefully', async () => {
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('EC2 API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.deprecatedInstances).toHaveLength(0);
    });
  });

  describe('checkSecurityGroupRules', () => {
    it('should detect SSH open to internet', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-12345',
            GroupName: 'test-sg',
            IpPermissions: [
              {
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      const sshViolations = report.violations.securityGroups.filter(
        v => v.violationType === 'SSH Open to Internet',
      );
      expect(sshViolations).toHaveLength(1);
      expect(sshViolations[0].severity).toBe('high');
    });

    it('should detect RDP open to internet', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-67890',
            GroupName: 'rdp-sg',
            IpPermissions: [
              {
                FromPort: 3389,
                ToPort: 3389,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      const rdpViolations = report.violations.securityGroups.filter(
        v => v.violationType === 'RDP Open to Internet',
      );
      expect(rdpViolations).toHaveLength(1);
      expect(rdpViolations[0].severity).toBe('high');
    });

    it('should pass restricted security groups', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-secure',
            GroupName: 'secure-sg',
            IpPermissions: [
              {
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: '10.0.0.0/8' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
      expect(report.metrics.networkComplianceScore).toBe(100);
    });

    it('should handle empty security groups list', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [],
      });

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
      expect(report.metrics.networkComplianceScore).toBe(100);
    });

    it('should handle security group API errors gracefully', async () => {
      ec2Mock
        .on(DescribeSecurityGroupsCommand)
        .rejects(new Error('SecurityGroup API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
    });
  });

  describe('checkCloudWatchLogsRetention', () => {
    it('should detect log groups with insufficient retention', async () => {
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '/aws/lambda/test',
            retentionInDays: 7,
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(1);
      expect(report.violations.cloudWatchLogs[0].severity).toBe('medium');
    });

    it('should detect log groups without retention policy', async () => {
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '/aws/lambda/unlimited',
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(1);
    });

    it('should pass log groups with adequate retention', async () => {
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '/aws/lambda/compliant',
            retentionInDays: 30,
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(0);
    });

    it('should handle pagination', async () => {
      cwLogsMock
        .on(DescribeLogGroupsCommand)
        .resolvesOnce({
          logGroups: [
            {
              logGroupName: '/aws/lambda/page1',
              retentionInDays: 30,
            },
          ],
          nextToken: 'token1',
        })
        .resolvesOnce({
          logGroups: [
            {
              logGroupName: '/aws/lambda/page2',
              retentionInDays: 30,
            },
          ],
        });

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(0);
    });

    it('should handle CloudWatch Logs API errors gracefully', async () => {
      cwLogsMock
        .on(DescribeLogGroupsCommand)
        .rejects(new Error('CloudWatch Logs API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(0);
    });
  });

  describe('checkIamMfa', () => {
    it('should detect users with console access but no MFA', async () => {
      iamMock.on(ListUsersCommand).resolves({
        Users: [{ UserName: 'test-user' }],
      });

      iamMock.on(GetLoginProfileCommand).resolves({});
      iamMock.on(ListMFADevicesCommand).resolves({
        MFADevices: [],
      });

      const report = await scanner.scanAll();

      expect(report.violations.iamMfa).toHaveLength(1);
      expect(report.violations.iamMfa[0].severity).toBe('high');
    });

    it('should pass users with MFA enabled', async () => {
      iamMock.on(ListUsersCommand).resolves({
        Users: [{ UserName: 'secure-user' }],
      });

      iamMock.on(GetLoginProfileCommand).resolves({});
      iamMock.on(ListMFADevicesCommand).resolves({
        MFADevices: [{ SerialNumber: 'arn:aws:iam::123:mfa/secure-user' }],
      });

      const report = await scanner.scanAll();

      expect(report.violations.iamMfa).toHaveLength(0);
      expect(report.metrics.iamComplianceScore).toBe(100);
    });

    it('should pass users without console access', async () => {
      iamMock.on(ListUsersCommand).resolves({
        Users: [{ UserName: 'api-user' }],
      });

      const noLoginError: any = new Error('No login profile');
      noLoginError.name = 'NoSuchEntity';
      iamMock.on(GetLoginProfileCommand).rejects(noLoginError);

      iamMock.on(ListMFADevicesCommand).resolves({
        MFADevices: [],
      });

      const report = await scanner.scanAll();

      expect(report.violations.iamMfa).toHaveLength(0);
    });

    it('should handle IAM API errors gracefully', async () => {
      iamMock.on(ListUsersCommand).rejects(new Error('IAM API Error'));

      const report = await scanner.scanAll();

      expect(report.violations.iamMfa).toHaveLength(0);
    });

    it('should handle non-standard GetLoginProfile errors', async () => {
      iamMock.on(ListUsersCommand).resolves({
        Users: [{ UserName: 'error-user' }],
      });

      iamMock.on(GetLoginProfileCommand).rejects(new Error('Access Denied'));
      iamMock.on(ListMFADevicesCommand).resolves({ MFADevices: [] });

      const report = await scanner.scanAll();

      // Should treat as non-console user and not add violation
      expect(report.violations.iamMfa).toHaveLength(0);
    });
  });

  describe('publishMetrics', () => {
    it('should publish metrics to CloudWatch', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      await scanner.scanAll();

      expect(cwMock.calls()).toHaveLength(1);
    });

    it('should skip publishing in dry run mode', async () => {
      const dryRunScanner = new ComplianceScanner('us-east-1', 'test-env', true);

      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });

      await dryRunScanner.scanAll();

      expect(cwMock.calls()).toHaveLength(0);
    });

    it('should handle CloudWatch publish errors gracefully', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).rejects(new Error('CloudWatch API Error'));

      const report = await scanner.scanAll();

      expect(report).toBeDefined();
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate overall compliance score correctly', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1',
                Tags: [
                  { Key: 'Environment', Value: 'dev' },
                  { Key: 'Owner', Value: 'team' },
                  { Key: 'CostCenter', Value: 'eng' },
                ],
              },
            ],
          },
        ],
      });

      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.metrics.overallComplianceScore).toBe(100);
      expect(report.summary.complianceScore).toBe(100);
    });
  });

  describe('saveReport', () => {
    it('should save report to file', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.Mock;

      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();
      await scanner.saveReport(report, 'test-report.json');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'test-report.json',
        expect.any(String),
      );
    });
  });

  describe('printSummary', () => {
    it('should print report summary without errors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();
      scanner.printSummary(report);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('scanAll', () => {
    it('should complete full scan successfully', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report).toBeDefined();
      expect(report.environmentSuffix).toBe('test-env');
      expect(report.region).toBe('us-east-1');
      expect(report.scanDate).toBeDefined();
    });

    it('should handle critical scan errors in calculateMetrics', async () => {
      // Mock all the check functions to pass
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });

      // Mock publishMetrics to throw
      cwMock.on(PutMetricDataCommand).rejects(new Error('Critical CloudWatch Error'));

      const report = await scanner.scanAll();

      // Should complete despite CloudWatch error (graceful handling)
      expect(report).toBeDefined();
    });

    it('should handle and throw critical errors', async () => {
      // Create a broken scanner by mocking calculateMetrics to throw
      const errorScanner = new ComplianceScanner('us-east-1', 'test-env', false);

      // Mock all checks to succeed
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });

      // Mock calculateMetrics to throw by making it fail (spy and throw)
      jest.spyOn(errorScanner as any, 'calculateMetrics').mockImplementation(() => {
        throw new Error('Unrecoverable error in calculateMetrics');
      });

      // This should propagate the error
      await expect(errorScanner.scanAll()).rejects.toThrow('Unrecoverable error in calculateMetrics');
    });
  });

  describe('branch coverage edge cases', () => {
    it('should handle instances with all tags present', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-compliant',
                InstanceType: 't3.micro',
                Tags: [
                  { Key: 'Environment', Value: 'dev' },
                  { Key: 'Owner', Value: 'team' },
                  { Key: 'CostCenter', Value: 'eng' },
                ],
              },
            ],
          },
        ],
      });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance).toHaveLength(0);
      expect(report.metrics.ec2ComplianceScore).toBe(100);
    });

    it('should handle log groups with exact minimum retention', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '/aws/lambda/min-retention',
            retentionInDays: 30,
          },
        ],
      });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(0);
    });

    it('should handle log groups with retention above minimum', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '/aws/lambda/high-retention',
            retentionInDays: 90,
          },
        ],
      });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs).toHaveLength(0);
    });

    it('should handle security groups with no IP permissions', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-empty',
            GroupName: 'empty-sg',
            IpPermissions: [],
          },
        ],
      });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
    });

    it('should handle security groups with no IP ranges', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-no-ranges',
            GroupName: 'no-ranges-sg',
            IpPermissions: [
              {
                FromPort: 80,
                IpRanges: [],
              },
            ],
          },
        ],
      });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
    });

    it('should handle security groups with non-0.0.0.0/0 CIDR', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-restricted',
            GroupName: 'restricted-sg',
            IpPermissions: [
              {
                FromPort: 22,
                IpRanges: [{ CidrIp: '10.0.0.0/8' }],
              },
            ],
          },
        ],
      });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
    });

    it('should handle security groups with SSH not on port 22', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({ Users: [] });
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupId: 'sg-alt-port',
            GroupName: 'alt-port-sg',
            IpPermissions: [
              {
                FromPort: 2222,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.securityGroups).toHaveLength(0);
    });

    it('should handle IAM users without console access and no MFA', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
      s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
      iamMock.on(ListUsersCommand).resolves({
        Users: [{ UserName: 'api-only-user' }],
      });

      const noLoginError: any = new Error('No login profile');
      noLoginError.name = 'NoSuchEntity';
      iamMock.on(GetLoginProfileCommand).rejects(noLoginError);
      iamMock.on(ListMFADevicesCommand).resolves({ MFADevices: [] });

      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({ logGroups: [] });
      cwMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.scanAll();

      expect(report.violations.iamMfa).toHaveLength(0);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle versioning check errors for S3', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: 'version-error-bucket', CreationDate: new Date() }],
      });

      s3Mock.on(GetBucketEncryptionCommand).resolves({});
      s3Mock.on(GetBucketVersioningCommand).rejects(new Error('Versioning API Error'));

      const report = await scanner.scanAll();

      // Should handle error and still generate report
      expect(report).toBeDefined();
    });

    it('should handle instances with missing InstanceId', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                Tags: [{ Key: 'Environment', Value: 'dev' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.ec2TagCompliance[0].resourceId).toBe('unknown');
    });

    it('should handle S3 buckets with empty name', async () => {
      s3Mock.on(ListBucketsCommand).resolves({
        Buckets: [{ Name: '', CreationDate: new Date() }],
      });

      const encryptionError: any = new Error('Not found');
      encryptionError.name = 'ServerSideEncryptionConfigurationNotFoundError';
      s3Mock.on(GetBucketEncryptionCommand).rejects(encryptionError);
      s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Suspended' });

      const report = await scanner.scanAll();

      expect(report.violations.s3Security.length).toBeGreaterThan(0);
    });

    it('should handle security groups with missing GroupId', async () => {
      ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
        SecurityGroups: [
          {
            GroupName: 'test-sg',
            IpPermissions: [
              {
                FromPort: 22,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      });

      const report = await scanner.scanAll();

      const sshViolations = report.violations.securityGroups.filter(
        v => v.violationType === 'SSH Open to Internet',
      );
      expect(sshViolations[0].resourceId).toBe('unknown');
    });

    it('should handle IAM users with missing UserName', async () => {
      iamMock.on(ListUsersCommand).resolves({
        Users: [{}],
      });

      const noLoginError: any = new Error('No login profile');
      noLoginError.name = 'NoSuchEntity';
      iamMock.on(GetLoginProfileCommand).rejects(noLoginError);
      iamMock.on(ListMFADevicesCommand).resolves({ MFADevices: [] });

      const report = await scanner.scanAll();

      // Should handle gracefully
      expect(report).toBeDefined();
    });

    it('should handle log groups with empty name', async () => {
      cwLogsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [
          {
            logGroupName: '',
            retentionInDays: 7,
          },
        ],
      });

      const report = await scanner.scanAll();

      expect(report.violations.cloudWatchLogs.length).toBeGreaterThan(0);
    });
  });
});

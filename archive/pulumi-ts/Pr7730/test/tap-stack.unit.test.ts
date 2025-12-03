import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
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
  ListRolesCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ec2Mock = mockClient(EC2Client);
const s3Mock = mockClient(S3Client);
const iamMock = mockClient(IAMClient);
const cloudwatchMock = mockClient(CloudWatchClient);
const snsMock = mockClient(SNSClient);

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const state = {
      ...args.inputs,
    };

    // Mock SNS topic ARN
    if (args.type === 'aws:sns/topic:Topic') {
      state.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
    }

    return {
      id: `${args.name}-id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): { outputs: any; failures?: any } => {
    return {
      outputs: {},
    };
  },
});

describe('TapStack - EC2 Tag Compliance', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should detect missing required tags on EC2 instances', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              Tags: [{ Key: 'Environment', Value: 'dev' }],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    expect(violationsArray).toHaveLength(1);
    expect(violationsArray[0]).toMatchObject({
      resourceId: 'i-1234567890abcdef0',
      resourceType: 'EC2Instance',
      violationType: 'MissingRequiredTags',
      severity: 'medium',
    });
    expect(violationsArray[0].details).toContain('Owner');
    expect(violationsArray[0].details).toContain('CostCenter');
  });

  it('should not report violations for properly tagged EC2 instances', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              Tags: [
                { Key: 'Environment', Value: 'dev' },
                { Key: 'Owner', Value: 'team-a' },
                { Key: 'CostCenter', Value: 'engineering' },
              ],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const ec2TagViolations = violationsArray.filter(
      (v: any) => v.violationType === 'MissingRequiredTags'
    );
    expect(ec2TagViolations).toHaveLength(0);
  });

  it('should handle empty EC2 instances gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    expect(violationsArray).toHaveLength(0);
  });

  it('should handle EC2 API errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).rejects(new Error('EC2 API Error'));
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should not throw and return empty violations for EC2
    expect(Array.isArray(violationsArray)).toBe(true);
  });
});

describe('TapStack - S3 Bucket Compliance', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should detect S3 buckets without encryption', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [
        { Name: 'test-bucket-1', CreationDate: new Date() },
        { Name: 'test-bucket-2', CreationDate: new Date() },
      ],
    });

    s3Mock
      .on(GetBucketEncryptionCommand)
      .rejects({ name: 'ServerSideEncryptionConfigurationNotFoundError' });

    s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Enabled' });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const encryptionViolations = violationsArray.filter(
      (v: any) => v.violationType === 'EncryptionNotEnabled'
    );

    expect(encryptionViolations).toHaveLength(2);
    expect(encryptionViolations[0]).toMatchObject({
      resourceType: 'S3Bucket',
      violationType: 'EncryptionNotEnabled',
      severity: 'critical',
    });
  });

  it('should detect S3 buckets without versioning', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'test-bucket', CreationDate: new Date() }],
    });

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

    s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Suspended' });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const versioningViolations = violationsArray.filter(
      (v: any) => v.violationType === 'VersioningNotEnabled'
    );

    expect(versioningViolations).toHaveLength(1);
    expect(versioningViolations[0]).toMatchObject({
      resourceId: 'test-bucket',
      resourceType: 'S3Bucket',
      violationType: 'VersioningNotEnabled',
      severity: 'medium',
    });
  });

  it('should not report violations for compliant S3 buckets', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'compliant-bucket', CreationDate: new Date() }],
    });

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

    s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Enabled' });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const s3Violations = violationsArray.filter((v: any) =>
      ['EncryptionNotEnabled', 'VersioningNotEnabled'].includes(v.violationType)
    );

    expect(s3Violations).toHaveLength(0);
  });

  it('should handle S3 versioning check errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'test-bucket', CreationDate: new Date() }],
    });

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

    s3Mock
      .on(GetBucketVersioningCommand)
      .rejects(new Error('Versioning check error'));

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });

  it('should handle S3 API errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    s3Mock.on(ListBucketsCommand).rejects(new Error('S3 API Error'));

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });
});

describe('TapStack - AMI Compliance', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should detect unapproved AMIs', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              ImageId: 'ami-unapproved123',
              Tags: [],
            },
            {
              InstanceId: 'i-0987654321fedcba0',
              ImageId: 'ami-approved456',
              Tags: [],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: ['ami-approved456', 'ami-approved789'],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const amiViolations = violationsArray.filter(
      (v: any) => v.violationType === 'UnapprovedAMI'
    );

    expect(amiViolations).toHaveLength(1);
    expect(amiViolations[0]).toMatchObject({
      resourceId: 'i-1234567890abcdef0',
      resourceType: 'EC2Instance',
      violationType: 'UnapprovedAMI',
      severity: 'high',
    });
    expect(amiViolations[0].details).toContain('ami-unapproved123');
  });

  it('should skip AMI check when no approved AMIs configured', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              ImageId: 'ami-whatever123',
              Tags: [],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const amiViolations = violationsArray.filter(
      (v: any) => v.violationType === 'UnapprovedAMI'
    );

    expect(amiViolations).toHaveLength(0);
  });

  it('should handle AMI check errors gracefully', async () => {
    ec2Mock
      .on(DescribeInstancesCommand)
      .rejectsOnce(new Error('AMI check error'))
      .resolves({ Reservations: [] });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: ['ami-test'],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });

  it('should handle AMI check errors when approved AMIs are configured', async () => {
    const mockError = new Error('EC2 API Error during AMI check');
    ec2Mock.on(DescribeInstancesCommand).rejects(mockError);

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: ['ami-approved123'],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully and continue
    expect(Array.isArray(violationsArray)).toBe(true);
  });
});

describe('TapStack - Security Group Compliance', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should detect open SSH port (22) from 0.0.0.0/0', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-12345678',
          GroupName: 'open-ssh-sg',
          IpPermissions: [
            {
              FromPort: 22,
              ToPort: 22,
              IpProtocol: 'tcp',
              IpRanges: [{ CidrIp: '0.0.0.0/0' }],
            },
          ],
        },
      ],
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const sshViolations = violationsArray.filter(
      (v: any) => v.violationType === 'OpenSSHPort'
    );

    expect(sshViolations).toHaveLength(1);
    expect(sshViolations[0]).toMatchObject({
      resourceId: 'sg-12345678',
      resourceType: 'SecurityGroup',
      violationType: 'OpenSSHPort',
      severity: 'critical',
    });
  });

  it('should detect open SSH port (22) from ::/0 (IPv6)', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-ipv6-ssh',
          GroupName: 'open-ssh-ipv6-sg',
          IpPermissions: [
            {
              FromPort: 22,
              ToPort: 22,
              IpProtocol: 'tcp',
              Ipv6Ranges: [{ CidrIpv6: '::/0' }],
            },
          ],
        },
      ],
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const sshViolations = violationsArray.filter(
      (v: any) => v.violationType === 'OpenSSHPort'
    );

    expect(sshViolations).toHaveLength(1);
    expect(sshViolations[0]).toMatchObject({
      resourceId: 'sg-ipv6-ssh',
      resourceType: 'SecurityGroup',
      violationType: 'OpenSSHPort',
      severity: 'critical',
    });
  });

  it('should detect open RDP port (3389) from 0.0.0.0/0 (IPv4)', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-rdp-ipv4',
          GroupName: 'open-rdp-ipv4-sg',
          IpPermissions: [
            {
              FromPort: 3389,
              ToPort: 3389,
              IpProtocol: 'tcp',
              IpRanges: [{ CidrIp: '0.0.0.0/0' }],
            },
          ],
        },
      ],
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const rdpViolations = violationsArray.filter(
      (v: any) => v.violationType === 'OpenRDPPort'
    );

    expect(rdpViolations).toHaveLength(1);
    expect(rdpViolations[0]).toMatchObject({
      resourceId: 'sg-rdp-ipv4',
      resourceType: 'SecurityGroup',
      violationType: 'OpenRDPPort',
      severity: 'critical',
    });
  });

  it('should detect open RDP port (3389) from ::/0 (IPv6)', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-87654321',
          GroupName: 'open-rdp-sg',
          IpPermissions: [
            {
              FromPort: 3389,
              ToPort: 3389,
              IpProtocol: 'tcp',
              Ipv6Ranges: [{ CidrIpv6: '::/0' }],
            },
          ],
        },
      ],
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const rdpViolations = violationsArray.filter(
      (v: any) => v.violationType === 'OpenRDPPort'
    );

    expect(rdpViolations).toHaveLength(1);
    expect(rdpViolations[0]).toMatchObject({
      resourceId: 'sg-87654321',
      resourceType: 'SecurityGroup',
      violationType: 'OpenRDPPort',
      severity: 'critical',
    });
  });

  it('should not report violations for restricted security groups', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-secure',
          GroupName: 'secure-sg',
          IpPermissions: [
            {
              FromPort: 22,
              ToPort: 22,
              IpProtocol: 'tcp',
              IpRanges: [{ CidrIp: '10.0.0.0/8' }],
            },
          ],
        },
      ],
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const sgViolations = violationsArray.filter((v: any) =>
      ['OpenSSHPort', 'OpenRDPPort'].includes(v.violationType)
    );

    expect(sgViolations).toHaveLength(0);
  });

  it('should handle security group API errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });

    ec2Mock
      .on(DescribeSecurityGroupsCommand)
      .rejects(new Error('SecurityGroup API Error'));

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });
});

describe('TapStack - IAM Role Compliance', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should detect IAM roles with wildcard permissions in attached policies', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).resolves({
      Roles: [{ RoleName: 'AdminRole' }],
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [
        {
          PolicyName: 'AdminPolicy',
          PolicyArn: 'arn:aws:iam::123456789012:policy/AdminPolicy',
        },
      ],
    });

    iamMock.on(GetPolicyCommand).resolves({
      Policy: {
        DefaultVersionId: 'v1',
      },
    });

    iamMock.on(GetPolicyVersionCommand).resolves({
      PolicyVersion: {
        Document: encodeURIComponent(
          JSON.stringify({
            Statement: [
              {
                Effect: 'Allow',
                Action: '*',
                Resource: '*',
              },
            ],
          })
        ),
      },
    });

    iamMock.on(ListRolePoliciesCommand).resolves({ PolicyNames: [] });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const iamViolations = violationsArray.filter(
      (v: any) => v.violationType === 'WildcardPermissions'
    );

    expect(iamViolations).toHaveLength(1);
    expect(iamViolations[0]).toMatchObject({
      resourceId: 'AdminRole',
      resourceType: 'IAMRole',
      violationType: 'WildcardPermissions',
      severity: 'high',
    });
  });

  it('should detect IAM roles with wildcard permissions in inline policies', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).resolves({
      Roles: [{ RoleName: 'ServiceRole' }],
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [],
    });

    iamMock.on(ListRolePoliciesCommand).resolves({
      PolicyNames: ['InlinePolicy'],
    });

    iamMock.on(GetRolePolicyCommand).resolves({
      PolicyDocument: encodeURIComponent(
        JSON.stringify({
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:*'],
              Resource: '*',
            },
          ],
        })
      ),
    });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const iamViolations = violationsArray.filter(
      (v: any) => v.violationType === 'WildcardPermissions'
    );

    expect(iamViolations).toHaveLength(1);
    expect(iamViolations[0]).toMatchObject({
      resourceId: 'ServiceRole',
      resourceType: 'IAMRole',
      violationType: 'WildcardPermissions',
      severity: 'high',
    });
  });

  it('should not report violations for properly scoped IAM roles', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).resolves({
      Roles: [{ RoleName: 'LimitedRole' }],
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [
        {
          PolicyName: 'S3ReadOnlyPolicy',
          PolicyArn: 'arn:aws:iam::123456789012:policy/S3ReadOnlyPolicy',
        },
      ],
    });

    iamMock.on(GetPolicyCommand).resolves({
      Policy: {
        DefaultVersionId: 'v1',
      },
    });

    iamMock.on(GetPolicyVersionCommand).resolves({
      PolicyVersion: {
        Document: encodeURIComponent(
          JSON.stringify({
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: 'arn:aws:s3:::my-bucket/*',
              },
            ],
          })
        ),
      },
    });

    iamMock.on(ListRolePoliciesCommand).resolves({ PolicyNames: [] });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    const iamViolations = violationsArray.filter(
      (v: any) => v.violationType === 'WildcardPermissions'
    );

    expect(iamViolations).toHaveLength(0);
  });

  it('should handle IAM policy fetch errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).resolves({
      Roles: [{ RoleName: 'TestRole' }],
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [
        {
          PolicyName: 'TestPolicy',
          PolicyArn: 'arn:aws:iam::123456789012:policy/TestPolicy',
        },
      ],
    });

    iamMock.on(GetPolicyCommand).rejects(new Error('Policy fetch error'));
    iamMock.on(ListRolePoliciesCommand).resolves({ PolicyNames: [] });

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });

  it('should handle IAM inline policy errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).resolves({
      Roles: [{ RoleName: 'TestRole' }],
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [],
    });

    iamMock
      .on(ListRolePoliciesCommand)
      .rejects(new Error('Inline policy error'));

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });

  it('should handle IAM API errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    iamMock.on(ListRolesCommand).rejects(new Error('IAM API Error'));

    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();
    const violationsArray = JSON.parse(violations);

    // Should handle error gracefully
    expect(Array.isArray(violationsArray)).toBe(true);
  });
});

describe('TapStack - CloudWatch Metrics', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should publish CloudWatch metrics for violations', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              Tags: [],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    await pulumi.output(stack.violationsReport).promise();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(cloudwatchMock.calls()).toHaveLength(2);
    expect(
      cloudwatchMock.commandCalls(PutMetricDataCommand)[0].args[0].input
    ).toMatchObject({
      Namespace: 'ComplianceMonitoring-test123',
    });
  });

  it('should handle CloudWatch metric errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              Tags: [],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock
      .on(PutMetricDataCommand)
      .rejects(new Error('CloudWatch error'));

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not throw and still return violations
    expect(JSON.parse(violations)).toHaveLength(1);
  });
});

describe('TapStack - SNS Notifications', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should send SNS notification for critical violations', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'unencrypted-bucket', CreationDate: new Date() }],
    });

    s3Mock
      .on(GetBucketEncryptionCommand)
      .rejects({ name: 'ServerSideEncryptionConfigurationNotFoundError' });

    s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Enabled' });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    await pulumi.output(stack.violationsReport).promise();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(snsMock.calls()).toHaveLength(1);
    const publishCall = snsMock.commandCalls(PublishCommand)[0];
    expect(publishCall.args[0].input.Subject).toContain(
      'Critical Compliance Violations'
    );
  });

  it('should not send SNS notification when no critical violations', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    await pulumi.output(stack.violationsReport).promise();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(snsMock.calls()).toHaveLength(0);
  });

  it('should handle SNS publish errors gracefully', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [{ Name: 'unencrypted-bucket', CreationDate: new Date() }],
    });

    s3Mock
      .on(GetBucketEncryptionCommand)
      .rejects({ name: 'ServerSideEncryptionConfigurationNotFoundError' });

    s3Mock.on(GetBucketVersioningCommand).resolves({ Status: 'Enabled' });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});
    snsMock.on(PublishCommand).rejects(new Error('SNS error'));

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const violations = await pulumi.output(stack.violationsReport).promise();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not throw and still return violations
    expect(JSON.parse(violations).length).toBeGreaterThan(0);
  });
});

describe('TapStack - Stack Outputs', () => {
  beforeEach(() => {
    ec2Mock.reset();
    s3Mock.reset();
    iamMock.reset();
    cloudwatchMock.reset();
    snsMock.reset();
  });

  it('should export violations report as JSON', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const report = await pulumi.output(stack.violationsReport).promise();

    expect(() => JSON.parse(report)).not.toThrow();
    expect(Array.isArray(JSON.parse(report))).toBe(true);
  });

  it('should export violation count', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890abcdef0',
              Tags: [],
            },
          ],
        },
      ],
    });

    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const count = await pulumi.output(stack.violationCount).promise();

    expect(count).toBe(1);
  });

  it('should export SNS topic ARN', async () => {
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });
    iamMock.on(ListRolesCommand).resolves({ Roles: [] });
    cloudwatchMock.on(PutMetricDataCommand).resolves({});

    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      approvedAmiIds: [],
    });

    const arn = await pulumi.output(stack.snsTopic.arn).promise();

    expect(arn).toContain('arn');
  });
});

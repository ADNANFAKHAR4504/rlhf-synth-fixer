/* eslint-disable @typescript-eslint/no-var-requires */
// Note: Lambda function is JavaScript, so we test it as such

describe('Compliance Scanner Lambda Function', () => {
  let handler: (event: unknown) => Promise<{
    statusCode: number;
    body: string;
  }>;

  // Mock AWS SDK clients
  const mockEC2Send = jest.fn();
  const mockIAMSend = jest.fn();
  const mockS3Send = jest.fn();
  const mockCloudWatchSend = jest.fn();

  beforeAll(() => {
    // Mock AWS SDK v3 modules
    jest.mock('@aws-sdk/client-ec2', () => ({
      EC2Client: jest.fn().mockImplementation(() => ({
        send: mockEC2Send,
      })),
      DescribeInstancesCommand: jest.fn(),
      DescribeVolumesCommand: jest.fn(),
      DescribeSecurityGroupsCommand: jest.fn(),
      DescribeVpcsCommand: jest.fn(),
      DescribeFlowLogsCommand: jest.fn(),
    }));

    jest.mock('@aws-sdk/client-iam', () => ({
      IAMClient: jest.fn().mockImplementation(() => ({
        send: mockIAMSend,
      })),
      ListRolesCommand: jest.fn(),
      ListAttachedRolePoliciesCommand: jest.fn(),
    }));

    jest.mock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({
        send: mockS3Send,
      })),
      PutObjectCommand: jest.fn(),
    }));

    jest.mock('@aws-sdk/client-cloudwatch', () => ({
      CloudWatchClient: jest.fn().mockImplementation(() => ({
        send: mockCloudWatchSend,
      })),
      PutMetricDataCommand: jest.fn(),
    }));

    // Load the Lambda function
    const lambdaModule = require('../lib/lambda/compliance-scanner.js');
    handler = lambdaModule.handler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REPORT_BUCKET = 'test-bucket';
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';
  });

  it('should successfully scan with no violations', async () => {
    // Mock responses for all AWS API calls
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] }) // DescribeInstances
      .mockResolvedValueOnce({ SecurityGroups: [] }) // DescribeSecurityGroups
      .mockResolvedValueOnce({ Vpcs: [] }) // DescribeVpcs
      .mockResolvedValueOnce({ FlowLogs: [] }); // DescribeFlowLogs

    mockIAMSend.mockResolvedValueOnce({ Roles: [] }); // ListRoles

    mockS3Send.mockResolvedValueOnce({}); // PutObject
    mockCloudWatchSend.mockResolvedValueOnce({}); // PutMetricData

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Compliance scan completed');
    expect(body.summary).toEqual({
      unencryptedVolumes: 0,
      permissiveSecurityGroups: 0,
      missingTags: 0,
      iamViolations: 0,
      missingFlowLogs: 0,
    });
  });

  it('should detect unencrypted volumes', async () => {
    mockEC2Send
      .mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-123456',
                State: { Name: 'running' },
                Tags: [
                  { Key: 'Environment', Value: 'test' },
                  { Key: 'Owner', Value: 'admin' },
                  { Key: 'CostCenter', Value: '12345' },
                ],
                BlockDeviceMappings: [
                  {
                    Ebs: { VolumeId: 'vol-123456' },
                  },
                ],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        Volumes: [{ VolumeId: 'vol-123456', Encrypted: false }],
      })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.unencryptedVolumes).toBe(1);
  });

  it('should detect missing tags', async () => {
    mockEC2Send
      .mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-123456',
                State: { Name: 'running' },
                Tags: [{ Key: 'Environment', Value: 'test' }], // Missing Owner and CostCenter
                BlockDeviceMappings: [],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.missingTags).toBe(1);
  });

  it('should detect permissive security groups', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({
        SecurityGroups: [
          {
            GroupId: 'sg-123456',
            GroupName: 'test-sg',
            Description: 'Test security group',
            IpPermissions: [
              {
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.permissiveSecurityGroups).toBeGreaterThan(0);
  });

  it('should allow 0.0.0.0/0 on ports 80 and 443', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({
        SecurityGroups: [
          {
            GroupId: 'sg-123456',
            GroupName: 'web-sg',
            Description: 'Web security group',
            IpPermissions: [
              {
                FromPort: 80,
                ToPort: 80,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
              {
                FromPort: 443,
                ToPort: 443,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    // Should not flag ports 80/443 with 0.0.0.0/0
    expect(body.summary.permissiveSecurityGroups).toBe(0);
  });

  it('should detect IAM roles with no policies', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend
      .mockResolvedValueOnce({
        Roles: [
          {
            RoleName: 'test-role',
            Arn: 'arn:aws:iam::123456789012:role/test-role',
          },
        ],
      })
      .mockResolvedValueOnce({ AttachedPolicies: [] });

    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.iamViolations).toBeGreaterThan(0);
  });

  it('should detect IAM roles with overly broad permissions', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend
      .mockResolvedValueOnce({
        Roles: [
          {
            RoleName: 'admin-role',
            Arn: 'arn:aws:iam::123456789012:role/admin-role',
          },
        ],
      })
      .mockResolvedValueOnce({
        AttachedPolicies: [
          {
            PolicyName: 'AdministratorAccess',
            PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          },
        ],
      });

    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.iamViolations).toBeGreaterThan(0);
  });

  it('should detect VPCs without flow logs', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({
        Vpcs: [{ VpcId: 'vpc-123456' }],
      })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.summary.missingFlowLogs).toBe(1);
  });

  it('should skip terminated instances', async () => {
    mockEC2Send
      .mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-terminated',
                State: { Name: 'terminated' },
                Tags: [],
                BlockDeviceMappings: [],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({ Roles: [] });
    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    // Terminated instance should not be flagged
    expect(body.summary.missingTags).toBe(0);
  });

  it('should skip AWS service roles', async () => {
    mockEC2Send
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ SecurityGroups: [] })
      .mockResolvedValueOnce({ Vpcs: [] })
      .mockResolvedValueOnce({ FlowLogs: [] });

    mockIAMSend.mockResolvedValueOnce({
      Roles: [
        {
          RoleName: 'AWSServiceRoleForECS',
          Arn: 'arn:aws:iam::123456789012:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
        },
        {
          RoleName: 'aws-elasticbeanstalk-service-role',
          Arn: 'arn:aws:iam::123456789012:role/aws-elasticbeanstalk-service-role',
        },
      ],
    });

    mockS3Send.mockResolvedValueOnce({});
    mockCloudWatchSend.mockResolvedValueOnce({});

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    // AWS service roles should be skipped
    expect(body.summary.iamViolations).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    mockEC2Send.mockRejectedValueOnce(new Error('EC2 API error'));

    await expect(handler({})).rejects.toThrow('EC2 API error');
  });
});

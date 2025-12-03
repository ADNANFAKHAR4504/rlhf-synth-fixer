import { ComplianceScanner } from '../lib/lambda/compliance-scanner';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  SSMClient,
  DescribeInstanceInformationCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { mockClient } from 'aws-sdk-client-mock';

const ec2Mock = mockClient(EC2Client);
const ssmMock = mockClient(SSMClient);
const cloudWatchMock = mockClient(CloudWatchClient);

describe('ComplianceScanner', () => {
  let scanner: ComplianceScanner;

  beforeEach(() => {
    ec2Mock.reset();
    ssmMock.reset();
    cloudWatchMock.reset();
    scanner = new ComplianceScanner('us-east-1', 'test', [
      'ami-approved1',
      'ami-approved2',
    ]);
  });

  describe('checkEbsEncryption', () => {
    it('should detect unencrypted EBS volumes', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                BlockDeviceMappings: [{ Ebs: { VolumeId: 'vol-test123' } }],
              },
            ],
          },
        ],
      });

      ec2Mock.on(DescribeVolumesCommand).resolves({
        Volumes: [{ VolumeId: 'vol-test123', Encrypted: false }],
      });

      await scanner.checkEbsEncryption();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe('UnencryptedEBSVolume');
      expect(report.violations[0].severity).toBe('HIGH');
    });

    it('should not flag encrypted EBS volumes', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                BlockDeviceMappings: [{ Ebs: { VolumeId: 'vol-test123' } }],
              },
            ],
          },
        ],
      });

      ec2Mock.on(DescribeVolumesCommand).resolves({
        Volumes: [{ VolumeId: 'vol-test123', Encrypted: true }],
      });

      await scanner.checkEbsEncryption();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle instances with no block device mappings', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                BlockDeviceMappings: [],
              },
            ],
          },
        ],
      });

      await scanner.checkEbsEncryption();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('API Error'));

      await scanner.checkEbsEncryption();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });

  describe('checkSecurityGroups', () => {
    it('should detect unrestricted SSH access', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
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

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe(
        'UnrestrictedInboundRule'
      );
      expect(report.violations[0].severity).toBe('HIGH');
      expect(report.violations[0].details).toContain('port 22');
    });

    it('should detect unrestricted RDP access', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
              GroupName: 'test-sg',
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

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].details).toContain('port 3389');
    });

    it('should detect unrestricted MySQL access', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
              GroupName: 'test-sg',
              IpPermissions: [
                {
                  FromPort: 3306,
                  ToPort: 3306,
                  IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                },
              ],
            },
          ],
        });

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].details).toContain('port 3306');
    });

    it('should detect IPv6 unrestricted access', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
              GroupName: 'test-sg',
              IpPermissions: [
                {
                  FromPort: 22,
                  ToPort: 22,
                  Ipv6Ranges: [{ CidrIpv6: '::/0' }],
                },
              ],
            },
          ],
        });

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
    });

    it('should not flag restricted security groups', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
              GroupName: 'test-sg',
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

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle port ranges', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test123',
                  SecurityGroups: [{ GroupId: 'sg-test123' }],
                },
              ],
            },
          ],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test123',
              GroupName: 'test-sg',
              IpPermissions: [
                {
                  FromPort: 20,
                  ToPort: 3400,
                  IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                },
              ],
            },
          ],
        });

      await scanner.checkSecurityGroups();
      const report = await scanner.generateReport();

      // Should detect all 3 sensitive ports in the range
      expect(report.violations.length).toBe(3);
    });
  });

  describe('checkRequiredTags', () => {
    it('should detect missing Environment tag', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                Tags: [
                  { Key: 'Owner', Value: 'test' },
                  { Key: 'CostCenter', Value: 'test' },
                ],
              },
            ],
          },
        ],
      });

      await scanner.checkRequiredTags();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe('MissingRequiredTags');
      expect(report.violations[0].details).toContain('Environment');
    });

    it('should detect missing Owner tag', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'CostCenter', Value: 'test' },
                ],
              },
            ],
          },
        ],
      });

      await scanner.checkRequiredTags();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].details).toContain('Owner');
    });

    it('should detect missing CostCenter tag', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'Owner', Value: 'test' },
                ],
              },
            ],
          },
        ],
      });

      await scanner.checkRequiredTags();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].details).toContain('CostCenter');
    });

    it('should detect multiple missing tags', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                Tags: [{ Key: 'Name', Value: 'test' }],
              },
            ],
          },
        ],
      });

      await scanner.checkRequiredTags();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].details).toContain('Environment');
      expect(report.violations[0].details).toContain('Owner');
      expect(report.violations[0].details).toContain('CostCenter');
    });

    it('should pass when all required tags are present', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'Owner', Value: 'test' },
                  { Key: 'CostCenter', Value: 'test' },
                ],
              },
            ],
          },
        ],
      });

      await scanner.checkRequiredTags();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });

  describe('checkApprovedAmis', () => {
    it('should detect unapproved AMI', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                ImageId: 'ami-unapproved',
              },
            ],
          },
        ],
      });

      await scanner.checkApprovedAmis();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe('UnapprovedAMI');
      expect(report.violations[0].details).toContain('ami-unapproved');
    });

    it('should pass when AMI is approved', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
                ImageId: 'ami-approved1',
              },
            ],
          },
        ],
      });

      await scanner.checkApprovedAmis();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle instances without ImageId', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
              },
            ],
          },
        ],
      });

      await scanner.checkApprovedAmis();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });

  describe('checkSsmAgentStatus', () => {
    it('should detect disconnected SSM agent', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
              },
            ],
          },
        ],
      });

      ssmMock.on(DescribeInstanceInformationCommand).resolves({
        InstanceInformationList: [],
      });

      await scanner.checkSsmAgentStatus();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe('SSMAgentNotConnected');
    });

    it('should pass when SSM agent is connected', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-test123',
              },
            ],
          },
        ],
      });

      ssmMock.on(DescribeInstanceInformationCommand).resolves({
        InstanceInformationList: [{ InstanceId: 'i-test123' }],
      });

      await scanner.checkSsmAgentStatus();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle no instances', async () => {
      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [],
      });

      await scanner.checkSsmAgentStatus();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });

  describe('checkVpcFlowLogs', () => {
    it('should detect VPC without flow logs', async () => {
      ec2Mock
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [{ VpcId: 'vpc-test123' }],
        })
        .on(DescribeFlowLogsCommand)
        .resolves({
          FlowLogs: [],
        });

      await scanner.checkVpcFlowLogs();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(1);
      expect(report.violations[0].violationType).toBe('FlowLogsDisabled');
      expect(report.violations[0].resourceType).toBe('EC2::VPC');
    });

    it('should pass when VPC has flow logs', async () => {
      ec2Mock
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [{ VpcId: 'vpc-test123' }],
        })
        .on(DescribeFlowLogsCommand)
        .resolves({
          FlowLogs: [{ FlowLogId: 'fl-test123' }],
        });

      await scanner.checkVpcFlowLogs();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle no VPCs', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [],
      });

      await scanner.checkVpcFlowLogs();
      const report = await scanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate report with correct structure', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [],
        })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [],
        });

      const report = await scanner.generateReport();

      expect(report).toHaveProperty('scanTimestamp');
      expect(report).toHaveProperty('region');
      expect(report).toHaveProperty('environmentSuffix');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('violations');
      expect(report.region).toBe('us-east-1');
      expect(report.environmentSuffix).toBe('test');
    });

    it('should calculate compliance rate correctly with zero resources', async () => {
      // Create a new scanner for this test
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ssmMock.reset();
      cloudWatchMock.reset();

      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({ Reservations: [] })
        .on(DescribeVpcsCommand)
        .resolves({ Vpcs: [] });

      const report = await testScanner.generateReport();

      expect(report.summary.totalResourcesScanned).toBe(0);
      expect(report.summary.totalViolations).toBe(0);
      expect(report.summary.complianceRate).toBe(100);
    });

    it('should count violations by type', async () => {
      // Create a new scanner for this test to avoid state from previous tests
      const testScanner = new ComplianceScanner('us-east-1', 'test', [
        'ami-approved1',
      ]);

      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test1',
                  BlockDeviceMappings: [{ Ebs: { VolumeId: 'vol-test1' } }],
                  Tags: [],
                  SecurityGroups: [{ GroupId: 'sg-test1' }],
                },
              ],
            },
          ],
        })
        .on(DescribeVolumesCommand)
        .resolves({
          Volumes: [{ VolumeId: 'vol-test1', Encrypted: false }],
        })
        .on(DescribeSecurityGroupsCommand)
        .resolves({
          SecurityGroups: [
            {
              GroupId: 'sg-test1',
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
        })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [],
        });

      await testScanner.checkEbsEncryption();
      await testScanner.checkSecurityGroups();
      await testScanner.checkRequiredTags();

      const report = await testScanner.generateReport();

      expect(report.summary.violationsByType).toHaveProperty(
        'UnencryptedEBSVolume'
      );
      expect(report.summary.violationsByType).toHaveProperty(
        'UnrestrictedInboundRule'
      );
      expect(report.summary.violationsByType).toHaveProperty(
        'MissingRequiredTags'
      );
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics to CloudWatch', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [],
        })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [],
        });

      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.generateReport();
      await scanner.exportMetrics(report);

      expect(cloudWatchMock.calls().length).toBeGreaterThan(0);
    });

    it('should handle CloudWatch API errors gracefully', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [],
        })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [],
        });

      cloudWatchMock.on(PutMetricDataCommand).rejects(new Error('API Error'));

      const report = await scanner.generateReport();
      await expect(scanner.exportMetrics(report)).resolves.not.toThrow();
    });
  });

  describe('runAllChecks', () => {
    it('should run all compliance checks', async () => {
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [],
        })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [],
        })
        .on(DescribeFlowLogsCommand)
        .resolves({
          FlowLogs: [],
        });

      ssmMock.on(DescribeInstanceInformationCommand).resolves({
        InstanceInformationList: [],
      });

      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const report = await scanner.runAllChecks();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('violations');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle checkSecurityGroups errors gracefully', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('API Error'));

      await testScanner.checkSecurityGroups();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle checkRequiredTags errors gracefully', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('API Error'));

      await testScanner.checkRequiredTags();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle checkApprovedAmis errors gracefully', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('API Error'));

      await testScanner.checkApprovedAmis();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle checkSsmAgentStatus errors gracefully', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock.on(DescribeInstancesCommand).rejects(new Error('API Error'));

      await testScanner.checkSsmAgentStatus();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle checkVpcFlowLogs errors gracefully', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock.on(DescribeVpcsCommand).rejects(new Error('API Error'));

      await testScanner.checkVpcFlowLogs();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle empty or undefined responses in checkEbsEncryption', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: null as any,
                  BlockDeviceMappings: [{ Ebs: { VolumeId: 'vol-test' } }],
                },
              ],
            },
          ],
        })
        .on(DescribeVpcsCommand)
        .resolves({ Vpcs: [] });

      await testScanner.checkEbsEncryption();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle instances with undefined security groups', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-test',
                  SecurityGroups: undefined,
                },
              ],
            },
          ],
        })
        .on(DescribeVpcsCommand)
        .resolves({ Vpcs: [] });

      await testScanner.checkSecurityGroups();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle instances without InstanceId in checkSsmAgentStatus', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({
          Reservations: [
            {
              Instances: [{ InstanceId: null as any }],
            },
          ],
        })
        .on(DescribeVpcsCommand)
        .resolves({ Vpcs: [] });

      ssmMock.reset();
      ssmMock.on(DescribeInstanceInformationCommand).resolves({
        InstanceInformationList: [],
      });

      await testScanner.checkSsmAgentStatus();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });

    it('should handle VPC without VpcId', async () => {
      const testScanner = new ComplianceScanner('us-east-1', 'test', []);

      ec2Mock.reset();
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves({ Reservations: [] })
        .on(DescribeVpcsCommand)
        .resolves({
          Vpcs: [{ VpcId: null as any }],
        });

      await testScanner.checkVpcFlowLogs();
      const report = await testScanner.generateReport();

      expect(report.violations.length).toBe(0);
    });
  });
});

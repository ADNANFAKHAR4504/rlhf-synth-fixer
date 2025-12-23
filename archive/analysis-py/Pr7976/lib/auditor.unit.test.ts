import { SecurityAuditor, Finding, AuditResult } from './auditor';
import { LocalWorkspace } from '@pulumi/pulumi/automation';
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { IAMClient, ListRolesCommand, GetRolePolicyCommand, ListRolePoliciesCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';

// Mock all AWS SDK clients
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-rds');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-iam');
jest.mock('@pulumi/pulumi/automation');

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditor;
  let mockEC2Client: jest.Mocked<EC2Client>;
  let mockRDSClient: jest.Mocked<RDSClient>;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockIAMClient: jest.Mocked<IAMClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    auditor = new SecurityAuditor('us-east-1', 'test');

    // Get mocked instances
    mockEC2Client = (EC2Client as jest.MockedClass<typeof EC2Client>).mock.instances[0] as jest.Mocked<EC2Client>;
    mockRDSClient = (RDSClient as jest.MockedClass<typeof RDSClient>).mock.instances[0] as jest.Mocked<RDSClient>;
    mockS3Client = (S3Client as jest.MockedClass<typeof S3Client>).mock.instances[0] as jest.Mocked<S3Client>;
    mockIAMClient = (IAMClient as jest.MockedClass<typeof IAMClient>).mock.instances[0] as jest.Mocked<IAMClient>;
  });

  describe('constructor', () => {
    it('should initialize SecurityAuditor with region and environmentSuffix', () => {
      expect(auditor).toBeDefined();
      expect(EC2Client).toHaveBeenCalledWith({ region: 'us-east-1' });
      expect(RDSClient).toHaveBeenCalledWith({ region: 'us-east-1' });
      expect(S3Client).toHaveBeenCalledWith({ region: 'us-east-1' });
      expect(IAMClient).toHaveBeenCalledWith({ region: 'us-east-1' });
    });
  });

  describe('analyzeStacks', () => {
    beforeEach(() => {
      // Mock AWS SDK send methods to return empty results
      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockResolvedValue({ DBInstances: [] });
      mockS3Client.send = jest.fn().mockResolvedValue({});
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });

      // Mock Pulumi LocalWorkspace
      const mockWorkspace = {
        selectStack: jest.fn().mockResolvedValue(undefined),
      };
      (LocalWorkspace.create as jest.Mock).mockResolvedValue(mockWorkspace);
    });

    it('should analyze all stacks and return audit result', async () => {
      const result = await auditor.analyzeStacks(['test-stack']);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.timestamp).toBeDefined();
      expect(result.environment).toBe('test');
      expect(result.region).toBe('us-east-1');
    });

    it('should handle stack connection errors gracefully', async () => {
      const mockWorkspace = {
        selectStack: jest.fn().mockRejectedValue(new Error('Stack not found')),
      };
      (LocalWorkspace.create as jest.Mock).mockResolvedValue(mockWorkspace);

      const result = await auditor.analyzeStacks(['invalid-stack']);
      expect(result).toBeDefined();
    });

    it('should analyze EC2 instances with IMDSv2 not enforced', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-1234567890',
                    MetadataOptions: {
                      HttpTokens: 'optional',
                    },
                    Tags: [{ Key: 'Name', Value: 'test-instance' }],
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result.findings.length).toBeGreaterThan(0);
      const imdsFindings = result.findings.filter(f => f.id.includes('imds'));
      expect(imdsFindings.length).toBe(1);
      expect(imdsFindings[0].severity).toBe('High');
      expect(imdsFindings[0].category).toBe('EC2 Security');
    });

    it('should detect EC2 instances with public IPs', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-public',
                    PublicIpAddress: '1.2.3.4',
                    MetadataOptions: { HttpTokens: 'required' },
                    Tags: [{ Key: 'Name', Value: 'public-instance' }],
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const publicIPFindings = result.findings.filter(f => f.id.includes('public'));
      expect(publicIPFindings.length).toBe(1);
      expect(publicIPFindings[0].severity).toBe('Medium');
    });

    it('should detect unencrypted EBS volumes', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-with-ebs',
                    MetadataOptions: { HttpTokens: 'required' },
                    BlockDeviceMappings: [
                      {
                        Ebs: {
                          VolumeId: 'vol-unencrypted',
                        },
                      },
                    ],
                    Tags: [{ Key: 'Name', Value: 'ebs-instance' }],
                  },
                ],
              },
            ],
          });
        } else if (command instanceof DescribeVolumesCommand) {
          return Promise.resolve({
            Volumes: [
              {
                VolumeId: 'vol-unencrypted',
                Encrypted: false,
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const ebsFindings = result.findings.filter(f => f.id.includes('ebs-encryption'));
      expect(ebsFindings.length).toBe(1);
      expect(ebsFindings[0].severity).toBe('High');
    });

    it('should analyze RDS instances without encryption', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'test-db',
            StorageEncrypted: false,
            BackupRetentionPeriod: 5,
            MultiAZ: false,
            DeletionProtection: false,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const rdsFindings = result.findings.filter(f => f.resourceType === 'RDS Instance');
      expect(rdsFindings.length).toBeGreaterThan(0);

      const encryptionFinding = rdsFindings.find(f => f.id.includes('encryption'));
      expect(encryptionFinding).toBeDefined();
      expect(encryptionFinding?.severity).toBe('Critical');
    });

    it('should detect RDS instances with insufficient backup retention', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'backup-db',
            StorageEncrypted: true,
            BackupRetentionPeriod: 3,
            MultiAZ: true,
            DeletionProtection: true,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const backupFindings = result.findings.filter(f => f.id.includes('backup'));
      expect(backupFindings.length).toBe(1);
      expect(backupFindings[0].severity).toBe('Medium');
    });

    it('should detect RDS instances without Multi-AZ', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'single-az-db',
            StorageEncrypted: true,
            BackupRetentionPeriod: 7,
            MultiAZ: false,
            DeletionProtection: true,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const multiAZFindings = result.findings.filter(f => f.id.includes('multiaz'));
      expect(multiAZFindings.length).toBe(1);
      expect(multiAZFindings[0].severity).toBe('Medium');
      expect(multiAZFindings[0].category).toBe('RDS Availability');
    });

    it('should detect RDS instances without deletion protection', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'unprotected-db',
            StorageEncrypted: true,
            BackupRetentionPeriod: 7,
            MultiAZ: true,
            DeletionProtection: false,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const deletionFindings = result.findings.filter(f => f.id.includes('deletion'));
      expect(deletionFindings.length).toBe(1);
      expect(deletionFindings[0].severity).toBe('Low');
    });

    it('should detect IAM roles with AdministratorAccess', async () => {
      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({
            Roles: [{ RoleName: 'admin-role' }],
          });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: [] });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({
            AttachedPolicies: [
              {
                PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
                PolicyName: 'AdministratorAccess',
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const adminFindings = result.findings.filter(f => f.id.includes('iam-admin'));
      expect(adminFindings.length).toBe(1);
      expect(adminFindings[0].severity).toBe('Critical');
    });

    it('should detect IAM policies with wildcard actions', async () => {
      const policyDoc = encodeURIComponent(JSON.stringify({
        Statement: [{
          Effect: 'Allow',
          Action: '*',
          Resource: 'arn:aws:s3:::mybucket/*'
        }]
      }));

      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({
            Roles: [{ RoleName: 'wildcard-role' }],
          });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: ['wildcard-policy'] });
        } else if (command instanceof GetRolePolicyCommand) {
          return Promise.resolve({
            PolicyDocument: policyDoc,
          });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({ AttachedPolicies: [] });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const wildcardActionFindings = result.findings.filter(f => f.id.includes('wildcard-action'));
      expect(wildcardActionFindings.length).toBe(1);
      expect(wildcardActionFindings[0].severity).toBe('Critical');
    });

    it('should detect IAM policies with wildcard resources', async () => {
      const policyDoc = encodeURIComponent(JSON.stringify({
        Statement: [{
          Effect: 'Allow',
          Action: 's3:GetObject',
          Resource: '*'
        }]
      }));

      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({
            Roles: [{ RoleName: 'wildcard-resource-role' }],
          });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: ['wildcard-resource-policy'] });
        } else if (command instanceof GetRolePolicyCommand) {
          return Promise.resolve({
            PolicyDocument: policyDoc,
          });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({ AttachedPolicies: [] });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const wildcardResourceFindings = result.findings.filter(f => f.id.includes('wildcard-resource'));
      expect(wildcardResourceFindings.length).toBe(1);
      expect(wildcardResourceFindings[0].severity).toBe('High');
    });

    it('should analyze security groups', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-sg-test',
                    MetadataOptions: { HttpTokens: 'required' },
                    SecurityGroups: [
                      {
                        GroupId: 'sg-12345',
                        GroupName: 'test-sg',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const sgFindings = result.findings.filter(f => f.resourceType === 'Security Group');
      expect(sgFindings.length).toBe(1);
      expect(sgFindings[0].severity).toBe('Low');
    });

    it('should calculate compliance score correctly', async () => {
      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'test-db',
            StorageEncrypted: false, // Critical: -10
            BackupRetentionPeriod: 5, // Medium: -2
            MultiAZ: false, // Medium: -2
            DeletionProtection: false, // Low: -1
          },
        ],
      });
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });

      const result = await auditor.analyzeStacks([]);
      // Total penalty: 10 + 2 + 2 + 1 = 15
      // Compliance score: 100 - 15 = 85
      expect(result.summary.complianceScore).toBe(85);
      expect(result.summary.bySeverity.critical).toBe(1);
      expect(result.summary.bySeverity.medium).toBe(2);
      expect(result.summary.bySeverity.low).toBe(1);
    });

    it('should handle EC2 API errors gracefully', async () => {
      mockEC2Client.send = jest.fn().mockRejectedValue(new Error('EC2 API Error'));
      mockRDSClient.send = jest.fn().mockResolvedValue({ DBInstances: [] });
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
      expect(result.summary.totalFindings).toBe(0);
    });

    it('should handle RDS API errors gracefully', async () => {
      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockRejectedValue(new Error('RDS API Error'));
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should handle IAM API errors gracefully', async () => {
      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockResolvedValue({ DBInstances: [] });
      mockIAMClient.send = jest.fn().mockRejectedValue(new Error('IAM API Error'));

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should handle malformed IAM policy documents', async () => {
      const malformedPolicyDoc = 'not-valid-json';

      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({
            Roles: [{ RoleName: 'malformed-role' }],
          });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: ['malformed-policy'] });
        } else if (command instanceof GetRolePolicyCommand) {
          return Promise.resolve({
            PolicyDocument: malformedPolicyDoc,
          });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({ AttachedPolicies: [] });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should deduplicate security groups', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-1',
                    MetadataOptions: { HttpTokens: 'required' },
                    SecurityGroups: [{ GroupId: 'sg-shared', GroupName: 'shared-sg' }],
                  },
                  {
                    InstanceId: 'i-2',
                    MetadataOptions: { HttpTokens: 'required' },
                    SecurityGroups: [{ GroupId: 'sg-shared', GroupName: 'shared-sg' }],
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const sgFindings = result.findings.filter(f => f.id === 'sg-review-sg-shared');
      expect(sgFindings.length).toBe(1);
    });

    it('should group findings by service', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'test-db',
            StorageEncrypted: false,
            BackupRetentionPeriod: 7,
            MultiAZ: true,
            DeletionProtection: true,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      expect(result.summary.byService['RDS Security']).toBe(1);
    });

    it('should include remediation code for findings', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-remediation-test',
                    MetadataOptions: { HttpTokens: 'optional' },
                    Tags: [{ Key: 'Name', Value: 'test-instance' }],
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const imdsFindings = result.findings.filter(f => f.id.includes('imds'));
      expect(imdsFindings[0].remediationCode).toBeDefined();
      expect(imdsFindings[0].remediationCode).toContain('httpTokens');
    });

    it('should include AWS documentation links', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'doc-test-db',
            StorageEncrypted: false,
            BackupRetentionPeriod: 7,
            MultiAZ: true,
            DeletionProtection: true,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const encryptionFinding = result.findings.find(f => f.id.includes('encryption'));
      expect(encryptionFinding?.awsDocLink).toBeDefined();
      expect(encryptionFinding?.awsDocLink).toContain('aws.amazon.com');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockResolvedValue({ DBInstances: [] });
      mockS3Client.send = jest.fn().mockResolvedValue({});
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });
    });

    it('should handle instances without tags', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-no-tags',
                    MetadataOptions: { HttpTokens: 'optional' },
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      const finding = result.findings.find(f => f.id.includes('imds'));
      expect(finding?.resourceName).toBe('i-no-tags');
    });

    it('should handle instances without block device mappings', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-no-bdm',
                    MetadataOptions: { HttpTokens: 'required' },
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should handle RDS instances with undefined backup retention', async () => {
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'no-backup-db',
            StorageEncrypted: true,
            MultiAZ: true,
            DeletionProtection: true,
          },
        ],
      });

      const result = await auditor.analyzeStacks([]);
      const backupFindings = result.findings.filter(f => f.id.includes('backup'));
      expect(backupFindings.length).toBe(1);
    });

    it('should handle IAM policy with single statement (not array)', async () => {
      const policyDoc = encodeURIComponent(JSON.stringify({
        Statement: {
          Effect: 'Allow',
          Action: '*',
          Resource: '*'
        }
      }));

      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({ Roles: [{ RoleName: 'single-stmt-role' }] });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: ['single-stmt-policy'] });
        } else if (command instanceof GetRolePolicyCommand) {
          return Promise.resolve({ PolicyDocument: policyDoc });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({ AttachedPolicies: [] });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should handle IAM policy with single action (not array)', async () => {
      const policyDoc = encodeURIComponent(JSON.stringify({
        Statement: [{
          Effect: 'Allow',
          Action: 's3:GetObject',
          Resource: 'arn:aws:s3:::bucket/*'
        }]
      }));

      mockIAMClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof ListRolesCommand) {
          return Promise.resolve({ Roles: [{ RoleName: 'single-action-role' }] });
        } else if (command instanceof ListRolePoliciesCommand) {
          return Promise.resolve({ PolicyNames: ['single-action-policy'] });
        } else if (command instanceof GetRolePolicyCommand) {
          return Promise.resolve({ PolicyDocument: policyDoc });
        } else if (command instanceof ListAttachedRolePoliciesCommand) {
          return Promise.resolve({ AttachedPolicies: [] });
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should return compliance score of 0 when penalty exceeds 100', async () => {
      // Create many critical findings
      mockRDSClient.send = jest.fn().mockResolvedValue({
        DBInstances: Array.from({ length: 15 }, (_, i) => ({
          DBInstanceIdentifier: `db-${i}`,
          StorageEncrypted: false,
          BackupRetentionPeriod: 7,
          MultiAZ: true,
          DeletionProtection: true,
        })),
      });

      const result = await auditor.analyzeStacks([]);
      expect(result.summary.complianceScore).toBe(0);
    });

    it('should handle EBS volume check errors gracefully', async () => {
      mockEC2Client.send = jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve({
            Reservations: [
              {
                Instances: [
                  {
                    InstanceId: 'i-ebs-error',
                    MetadataOptions: { HttpTokens: 'required' },
                    BlockDeviceMappings: [
                      {
                        Ebs: {
                          VolumeId: 'vol-error',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          });
        } else if (command instanceof DescribeVolumesCommand) {
          return Promise.reject(new Error('Volume not found'));
        }
        return Promise.resolve({});
      });

      const result = await auditor.analyzeStacks([]);
      expect(result).toBeDefined();
    });

    it('should handle stack analysis errors gracefully', async () => {
      const mockWorkspace = {
        selectStack: jest.fn().mockImplementation(() => {
          throw new Error('Stack error');
        }),
      };
      (LocalWorkspace.create as jest.Mock).mockResolvedValue(mockWorkspace);

      mockEC2Client.send = jest.fn().mockResolvedValue({ Reservations: [] });
      mockRDSClient.send = jest.fn().mockResolvedValue({ DBInstances: [] });
      mockIAMClient.send = jest.fn().mockResolvedValue({ Roles: [] });

      const result = await auditor.analyzeStacks(['error-stack']);
      expect(result).toBeDefined();
    });
  });
});

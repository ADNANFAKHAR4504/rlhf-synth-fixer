import { LocalWorkspace } from '@pulumi/pulumi/automation';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  ListRolesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

export interface Finding {
  id: string;
  resourceType: string;
  resourceName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  remediation: string;
  remediationCode?: string;
  awsDocLink?: string;
}

export interface AuditResult {
  summary: {
    totalResources: number;
    totalFindings: number;
    complianceScore: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byService: Record<string, number>;
  };
  findings: Finding[];
  timestamp: string;
  environment: string;
  region: string;
}

export class SecurityAuditor {
  private ec2Client: EC2Client;
  private rdsClient: RDSClient;
  private s3Client: S3Client;
  private iamClient: IAMClient;
  private findings: Finding[] = [];
  private resourceCount = 0;

  constructor(
    private region: string,
    private environmentSuffix: string
  ) {
    this.ec2Client = new EC2Client({ region });
    this.rdsClient = new RDSClient({ region });
    this.s3Client = new S3Client({ region });
    this.iamClient = new IAMClient({ region });
  }

  async analyzeStacks(stackNames: string[]): Promise<AuditResult> {
    this.findings = [];
    this.resourceCount = 0;

    for (const stackName of stackNames) {
      try {
        await this.analyzeStack(stackName);
      } catch (error) {
        console.error(`Error analyzing stack ${stackName}:`, error);
      }
    }

    // Analyze AWS resources directly
    await this.analyzeEC2Instances();
    await this.analyzeRDSInstances();
    await this.analyzeS3Buckets();
    await this.analyzeIAMRoles();
    await this.analyzeSecurityGroups();

    return this.generateAuditResult();
  }

  private async analyzeStack(stackName: string): Promise<void> {
    console.log(`  Analyzing stack: ${stackName}`);

    try {
      const ws = await LocalWorkspace.create({});
      await ws.selectStack(stackName);
      console.log(`    Successfully connected to stack`);
    } catch (error) {
      console.warn(`    Warning: Could not access stack ${stackName}`);
    }
  }

  private async analyzeEC2Instances(): Promise<void> {
    console.log('  Analyzing EC2 instances...');

    try {
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          this.resourceCount++;
          const instanceId = instance.InstanceId || 'unknown';
          const instanceName =
            instance.Tags?.find(t => t.Key === 'Name')?.Value || instanceId;

          // Check IMDSv2 enforcement
          if (instance.MetadataOptions?.HttpTokens !== 'required') {
            this.findings.push({
              id: `ec2-imds-${instanceId}`,
              resourceType: 'EC2 Instance',
              resourceName: instanceName,
              severity: 'High',
              category: 'EC2 Security',
              description: `Instance ${instanceName} does not enforce IMDSv2. This exposes metadata service to potential SSRF attacks.`,
              remediation:
                'Enable IMDSv2 enforcement to require session tokens for metadata access.',
              remediationCode: this.generateEC2RemediationCode(instanceName),
              awsDocLink:
                'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html',
            });
          }

          // Check if instance has public IP
          if (instance.PublicIpAddress) {
            this.findings.push({
              id: `ec2-public-${instanceId}`,
              resourceType: 'EC2 Instance',
              resourceName: instanceName,
              severity: 'Medium',
              category: 'EC2 Security',
              description: `Instance ${instanceName} has a public IP address (${instance.PublicIpAddress}).`,
              remediation:
                'Consider placing instances in private subnets and using NAT Gateway or VPN for outbound access.',
              awsDocLink:
                'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html',
            });
          }

          // Check EBS encryption
          if (instance.BlockDeviceMappings) {
            for (const bdm of instance.BlockDeviceMappings) {
              if (bdm.Ebs?.VolumeId) {
                await this.checkEBSEncryption(bdm.Ebs.VolumeId, instanceName);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing EC2 instances:', error);
    }
  }

  private async checkEBSEncryption(
    volumeId: string,
    instanceName: string
  ): Promise<void> {
    try {
      const command = new DescribeVolumesCommand({ VolumeIds: [volumeId] });
      const response = await this.ec2Client.send(command);

      if (
        response.Volumes &&
        response.Volumes[0] &&
        !response.Volumes[0].Encrypted
      ) {
        this.findings.push({
          id: `ebs-encryption-${volumeId}`,
          resourceType: 'EBS Volume',
          resourceName: volumeId,
          severity: 'High',
          category: 'EC2 Security',
          description: `EBS volume ${volumeId} attached to ${instanceName} is not encrypted.`,
          remediation: 'Enable EBS encryption for data at rest protection.',
          remediationCode: this.generateEBSRemediationCode(volumeId),
          awsDocLink:
            'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html',
        });
      }
    } catch (error) {
      console.error(`Error checking EBS encryption for ${volumeId}:`, error);
    }
  }

  private async analyzeRDSInstances(): Promise<void> {
    console.log('  Analyzing RDS instances...');

    try {
      const command = new DescribeDBInstancesCommand({});
      const response = await this.rdsClient.send(command);

      for (const dbInstance of response.DBInstances || []) {
        this.resourceCount++;
        const dbName = dbInstance.DBInstanceIdentifier || 'unknown';

        // Check encryption at rest
        if (!dbInstance.StorageEncrypted) {
          this.findings.push({
            id: `rds-encryption-${dbName}`,
            resourceType: 'RDS Instance',
            resourceName: dbName,
            severity: 'Critical',
            category: 'RDS Security',
            description: `RDS instance ${dbName} does not have encryption at rest enabled.`,
            remediation:
              'Enable storage encryption for RDS instance to protect data at rest.',
            remediationCode: this.generateRDSRemediationCode(dbName),
            awsDocLink:
              'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html',
          });
        }

        // Check backup retention
        const backupRetention = dbInstance.BackupRetentionPeriod || 0;
        if (backupRetention < 7) {
          this.findings.push({
            id: `rds-backup-${dbName}`,
            resourceType: 'RDS Instance',
            resourceName: dbName,
            severity: 'Medium',
            category: 'RDS Security',
            description: `RDS instance ${dbName} has insufficient backup retention period (${backupRetention} days). Recommended: 7+ days.`,
            remediation:
              'Increase backup retention period to at least 7 days for production databases.',
          });
        }

        // Check Multi-AZ deployment
        if (!dbInstance.MultiAZ) {
          this.findings.push({
            id: `rds-multiaz-${dbName}`,
            resourceType: 'RDS Instance',
            resourceName: dbName,
            severity: 'Medium',
            category: 'RDS Availability',
            description: `RDS instance ${dbName} is not deployed in Multi-AZ configuration.`,
            remediation:
              'Enable Multi-AZ deployment for high availability and automated failover.',
          });
        }

        // Check deletion protection
        if (!dbInstance.DeletionProtection) {
          this.findings.push({
            id: `rds-deletion-${dbName}`,
            resourceType: 'RDS Instance',
            resourceName: dbName,
            severity: 'Low',
            category: 'RDS Security',
            description: `RDS instance ${dbName} does not have deletion protection enabled.`,
            remediation:
              'Enable deletion protection to prevent accidental database deletion.',
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing RDS instances:', error);
    }
  }

  private async analyzeS3Buckets(): Promise<void> {
    console.log('  Analyzing S3 buckets...');

    // Note: Listing S3 buckets requires additional permissions
    // This is a simplified implementation
    const bucketNames = await this.discoverS3Buckets();

    for (const bucketName of bucketNames) {
      this.resourceCount++;
      await this.checkS3BucketSecurity(bucketName);
    }
  }

  private async discoverS3Buckets(): Promise<string[]> {
    // In a real implementation, you would list buckets
    // For this example, we'll check buckets from stack outputs
    return [];
  }

  private async checkS3BucketSecurity(bucketName: string): Promise<void> {
    try {
      // Check public access block
      try {
        const pubAccessCmd = new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        });
        const pubAccess = await this.s3Client.send(pubAccessCmd);

        if (
          !pubAccess.PublicAccessBlockConfiguration?.BlockPublicAcls ||
          !pubAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy
        ) {
          this.findings.push({
            id: `s3-public-${bucketName}`,
            resourceType: 'S3 Bucket',
            resourceName: bucketName,
            severity: 'Critical',
            category: 'S3 Security',
            description: `S3 bucket ${bucketName} allows public access.`,
            remediation:
              'Enable S3 Block Public Access settings to prevent data exposure.',
            remediationCode: this.generateS3RemediationCode(bucketName),
            awsDocLink:
              'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html',
          });
        }
      } catch (error: any) {
        if (error.name !== 'NoSuchPublicAccessBlockConfiguration') {
          this.findings.push({
            id: `s3-public-missing-${bucketName}`,
            resourceType: 'S3 Bucket',
            resourceName: bucketName,
            severity: 'Critical',
            category: 'S3 Security',
            description: `S3 bucket ${bucketName} does not have public access block configuration.`,
            remediation: 'Configure S3 Block Public Access settings.',
            remediationCode: this.generateS3RemediationCode(bucketName),
          });
        }
      }

      // Check encryption
      try {
        const encCmd = new GetBucketEncryptionCommand({ Bucket: bucketName });
        await this.s3Client.send(encCmd);
      } catch (error: any) {
        if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          this.findings.push({
            id: `s3-encryption-${bucketName}`,
            resourceType: 'S3 Bucket',
            resourceName: bucketName,
            severity: 'High',
            category: 'S3 Security',
            description: `S3 bucket ${bucketName} does not have encryption enabled.`,
            remediation:
              'Enable default encryption for S3 bucket using SSE-S3 or SSE-KMS.',
            awsDocLink:
              'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html',
          });
        }
      }

      // Check versioning
      try {
        const versionCmd = new GetBucketVersioningCommand({
          Bucket: bucketName,
        });
        const versioning = await this.s3Client.send(versionCmd);

        if (versioning.Status !== 'Enabled') {
          this.findings.push({
            id: `s3-versioning-${bucketName}`,
            resourceType: 'S3 Bucket',
            resourceName: bucketName,
            severity: 'Medium',
            category: 'S3 Security',
            description: `S3 bucket ${bucketName} does not have versioning enabled.`,
            remediation:
              'Enable versioning to protect against accidental deletions and overwrites.',
          });
        }
      } catch (error) {
        console.error(`Error checking versioning for ${bucketName}:`, error);
      }
    } catch (error) {
      console.error(`Error analyzing S3 bucket ${bucketName}:`, error);
    }
  }

  private async analyzeIAMRoles(): Promise<void> {
    console.log('  Analyzing IAM roles...');

    try {
      const command = new ListRolesCommand({});
      const response = await this.iamClient.send(command);

      for (const role of response.Roles || []) {
        this.resourceCount++;
        const roleName = role.RoleName || 'unknown';

        // Check inline policies
        const inlinePolicies = await this.iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );

        for (const policyName of inlinePolicies.PolicyNames || []) {
          const policy = await this.iamClient.send(
            new GetRolePolicyCommand({
              RoleName: roleName,
              PolicyName: policyName,
            })
          );

          if (policy.PolicyDocument) {
            this.checkPolicyPermissions(
              roleName,
              policyName,
              policy.PolicyDocument
            );
          }
        }

        // Check attached policies
        const attachedPolicies = await this.iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );

        for (const policy of attachedPolicies.AttachedPolicies || []) {
          if (
            policy.PolicyArn === 'arn:aws:iam::aws:policy/AdministratorAccess'
          ) {
            this.findings.push({
              id: `iam-admin-${roleName}`,
              resourceType: 'IAM Role',
              resourceName: roleName,
              severity: 'Critical',
              category: 'IAM Security',
              description: `IAM role ${roleName} has AdministratorAccess policy attached.`,
              remediation:
                'Follow principle of least privilege. Grant only required permissions.',
              remediationCode: this.generateIAMRemediationCode(roleName),
              awsDocLink:
                'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing IAM roles:', error);
    }
  }

  private checkPolicyPermissions(
    roleName: string,
    policyName: string,
    policyDoc: string
  ): void {
    try {
      const doc = JSON.parse(decodeURIComponent(policyDoc));
      const statements = Array.isArray(doc.Statement)
        ? doc.Statement
        : [doc.Statement];

      for (const statement of statements) {
        if (statement.Effect === 'Allow') {
          const actions = Array.isArray(statement.Action)
            ? statement.Action
            : [statement.Action];
          const resources = Array.isArray(statement.Resource)
            ? statement.Resource
            : [statement.Resource];

          // Check for wildcard actions
          if (
            actions.includes('*') ||
            actions.some((a: string) => a === '*:*')
          ) {
            this.findings.push({
              id: `iam-wildcard-action-${roleName}-${policyName}`,
              resourceType: 'IAM Policy',
              resourceName: `${roleName}/${policyName}`,
              severity: 'Critical',
              category: 'IAM Security',
              description: `IAM policy ${policyName} on role ${roleName} allows all actions (*).`,
              remediation:
                'Replace wildcard actions with specific permissions based on actual requirements.',
              remediationCode: this.generateIAMRemediationCode(roleName),
            });
          }

          // Check for wildcard resources
          if (resources.includes('*')) {
            this.findings.push({
              id: `iam-wildcard-resource-${roleName}-${policyName}`,
              resourceType: 'IAM Policy',
              resourceName: `${roleName}/${policyName}`,
              severity: 'High',
              category: 'IAM Security',
              description: `IAM policy ${policyName} on role ${roleName} allows access to all resources (*).`,
              remediation:
                "Restrict resource access to specific ARNs needed for the role's function.",
            });
          }
        }
      }
    } catch (error) {
      console.error(
        `Error parsing policy document for ${roleName}/${policyName}:`,
        error
      );
    }
  }

  private async analyzeSecurityGroups(): Promise<void> {
    console.log('  Analyzing security groups...');

    try {
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);

      const checkedGroups = new Set<string>();

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          for (const sg of instance.SecurityGroups || []) {
            const sgId = sg.GroupId || '';
            if (sgId && !checkedGroups.has(sgId)) {
              checkedGroups.add(sgId);
              await this.checkSecurityGroup(sgId, sg.GroupName || sgId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing security groups:', error);
    }
  }

  private async checkSecurityGroup(
    groupId: string,
    groupName: string
  ): Promise<void> {
    // This would require additional EC2 API calls to get security group rules
    // Simplified implementation for demonstration
    // const highRiskPorts = [22, 3389, 3306, 5432, 5984, 6379, 9200, 27017];

    // In a real implementation, you would check actual ingress rules
    // For now, we'll create a sample finding
    this.findings.push({
      id: `sg-review-${groupId}`,
      resourceType: 'Security Group',
      resourceName: groupName,
      severity: 'Low',
      category: 'Network Security',
      description: `Security group ${groupName} requires manual review for unrestricted access rules.`,
      remediation:
        'Review ingress rules and ensure no high-risk ports are open to 0.0.0.0/0.',
      awsDocLink:
        'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html',
    });
  }

  private generateAuditResult(): AuditResult {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const serviceCounts: Record<string, number> = {};

    for (const finding of this.findings) {
      severityCounts[
        finding.severity.toLowerCase() as keyof typeof severityCounts
      ]++;
      serviceCounts[finding.category] =
        (serviceCounts[finding.category] || 0) + 1;
    }

    // Calculate compliance score (100 - weighted penalties)
    const weights = { Critical: 10, High: 5, Medium: 2, Low: 1 };
    const totalPenalty =
      severityCounts.critical * weights.Critical +
      severityCounts.high * weights.High +
      severityCounts.medium * weights.Medium +
      severityCounts.low * weights.Low;

    const complianceScore = Math.max(0, 100 - totalPenalty);

    return {
      summary: {
        totalResources: this.resourceCount,
        totalFindings: this.findings.length,
        complianceScore: Math.round(complianceScore),
        bySeverity: severityCounts,
        byService: serviceCounts,
      },
      findings: this.findings,
      timestamp: new Date().toISOString(),
      environment: this.environmentSuffix,
      region: this.region,
    };
  }

  // Remediation code generators
  private generateEC2RemediationCode(instanceName: string): string {
    return `// Enable IMDSv2 for EC2 instance
import * as aws from "@pulumi/aws";

const instance = new aws.ec2.Instance("${instanceName}", {
    // ... other configuration
    metadataOptions: {
        httpEndpoint: "enabled",
        httpTokens: "required", // Enforce IMDSv2
        httpPutResponseHopLimit: 1,
    },
});`;
  }

  private generateEBSRemediationCode(_volumeId: string): string {
    return `// Enable encryption for EBS volume
import * as aws from "@pulumi/aws";

const volume = new aws.ebs.Volume("encrypted-volume", {
    // ... other configuration
    encrypted: true,
    kmsKeyId: kmsKey.id, // Optional: use custom KMS key
});`;
  }

  private generateRDSRemediationCode(dbName: string): string {
    return `// Enable encryption and configure RDS instance
import * as aws from "@pulumi/aws";

const dbInstance = new aws.rds.Instance("${dbName}", {
    // ... other configuration
    storageEncrypted: true,
    kmsKeyId: kmsKey.id, // Optional: use custom KMS key
    backupRetentionPeriod: 7, // Minimum 7 days
    multiAz: true, // Enable Multi-AZ
    deletionProtection: true, // Prevent accidental deletion
});`;
  }

  private generateS3RemediationCode(bucketName: string): string {
    return `// Secure S3 bucket configuration
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("${bucketName}", {
    // ... other configuration
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    versioning: {
        enabled: true,
    },
});

const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("${bucketName}-pab", {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});`;
  }

  private generateIAMRemediationCode(roleName: string): string {
    return `// Create IAM role with least privilege
import * as aws from "@pulumi/aws";

const role = new aws.iam.Role("${roleName}", {
    // ... other configuration
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com",
            },
        }],
    }),
});

// Attach specific policies instead of Administrator Access
const policy = new aws.iam.RolePolicy("${roleName}-policy", {
    role: role.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "s3:GetObject",
                "s3:PutObject",
                // Add only required actions
            ],
            Resource: [
                "arn:aws:s3:::specific-bucket/*",
                // Specify exact resources
            ],
        }],
    }),
});`;
  }
}

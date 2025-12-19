import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client as S3ListClient,
  ListBucketsCommand,
  GetBucketAclCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const ec2Client = new EC2Client({ region });
const s3ListClient = new S3ListClient({ region });
const rdsClient = new RDSClient({ region });

const reportBucket = process.env.REPORT_BUCKET!;
const snsTopic = process.env.SNS_TOPIC_ARN!;

interface ComplianceViolation {
  resourceType: string;
  resourceId: string;
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

interface ComplianceReport {
  timestamp: string;
  scanId: string;
  violations: ComplianceViolation[];
  summary: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export async function handler(
  _event: unknown
): Promise<Record<string, unknown>> {
  console.log('Starting compliance scan...');
  const scanId = `scan-${Date.now()}`;
  const violations: ComplianceViolation[] = [];

  try {
    // Scan EC2 instances for missing tags
    await scanEC2Instances(violations);

    // Scan EBS volumes for missing tags
    await scanEBSVolumes(violations);

    // Scan S3 buckets for public access
    await scanS3Buckets(violations);

    // Scan RDS instances for encryption
    await scanRDSInstances(violations);

    // Scan RDS clusters for encryption
    await scanRDSClusters(violations);

    // Generate compliance report
    const report = generateReport(scanId, violations);

    // Store report in S3
    await storeReport(scanId, report);

    // Send CloudWatch metrics
    await sendMetrics(violations);

    // Send notification if critical violations found
    const criticalCount = violations.filter(
      v => v.severity === 'CRITICAL'
    ).length;
    if (criticalCount > 0) {
      await sendNotification(report, criticalCount);
    }

    console.log(
      `Compliance scan completed. Total violations: ${violations.length}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        scanId,
        totalViolations: violations.length,
        criticalViolations: criticalCount,
        reportS3Key: `compliance-reports/${scanId}.json`,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
}

async function scanEC2Instances(
  violations: ComplianceViolation[]
): Promise<void> {
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const instanceId = instance.InstanceId!;
        const tags = instance.Tags || [];

        // Check for required tags
        const hasNameTag = tags.some(tag => tag.Key === 'Name');
        const hasEnvironmentTag = tags.some(tag => tag.Key === 'Environment');
        const hasOwnerTag = tags.some(tag => tag.Key === 'Owner');

        if (!hasNameTag || !hasEnvironmentTag || !hasOwnerTag) {
          violations.push({
            resourceType: 'EC2Instance',
            resourceId: instanceId,
            violationType: 'UntaggedResource',
            severity: 'MEDIUM',
            description: `EC2 instance ${instanceId} is missing required tags (Name, Environment, Owner)`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning EC2 instances:', error);
  }
}

async function scanEBSVolumes(
  violations: ComplianceViolation[]
): Promise<void> {
  try {
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    for (const volume of response.Volumes || []) {
      const volumeId = volume.VolumeId!;
      const tags = volume.Tags || [];

      // Check for required tags
      if (tags.length === 0) {
        violations.push({
          resourceType: 'EBSVolume',
          resourceId: volumeId,
          violationType: 'UntaggedResource',
          severity: 'LOW',
          description: `EBS volume ${volumeId} has no tags`,
        });
      }

      // Check for encryption
      if (!volume.Encrypted) {
        violations.push({
          resourceType: 'EBSVolume',
          resourceId: volumeId,
          violationType: 'UnencryptedStorage',
          severity: 'HIGH',
          description: `EBS volume ${volumeId} is not encrypted`,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning EBS volumes:', error);
  }
}

async function scanS3Buckets(violations: ComplianceViolation[]): Promise<void> {
  try {
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3ListClient.send(listCommand);

    for (const bucket of listResponse.Buckets || []) {
      const bucketName = bucket.Name!;

      // Check for public access
      try {
        const aclCommand = new GetBucketAclCommand({ Bucket: bucketName });
        const aclResponse = await s3ListClient.send(aclCommand);

        const hasPublicGrant = (aclResponse.Grants || []).some(grant => {
          const grantee = grant.Grantee;
          return (
            grantee?.Type === 'Group' &&
            (grantee.URI?.includes('AllUsers') ||
              grantee.URI?.includes('AuthenticatedUsers'))
          );
        });

        if (hasPublicGrant) {
          violations.push({
            resourceType: 'S3Bucket',
            resourceId: bucketName,
            violationType: 'PublicAccess',
            severity: 'CRITICAL',
            description: `S3 bucket ${bucketName} has public access enabled`,
          });
        }
      } catch (error) {
        console.error(`Error checking ACL for bucket ${bucketName}:`, error);
      }

      // Check for encryption
      try {
        const encryptionCommand = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });
        await s3ListClient.send(encryptionCommand);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          error.name === 'ServerSideEncryptionConfigurationNotFoundError'
        ) {
          violations.push({
            resourceType: 'S3Bucket',
            resourceId: bucketName,
            violationType: 'UnencryptedStorage',
            severity: 'HIGH',
            description: `S3 bucket ${bucketName} does not have encryption enabled`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning S3 buckets:', error);
  }
}

async function scanRDSInstances(
  violations: ComplianceViolation[]
): Promise<void> {
  try {
    const command = new DescribeDBInstancesCommand({});
    const response = await rdsClient.send(command);

    for (const instance of response.DBInstances || []) {
      const instanceId = instance.DBInstanceIdentifier!;

      // Check for encryption
      if (!instance.StorageEncrypted) {
        violations.push({
          resourceType: 'RDSInstance',
          resourceId: instanceId,
          violationType: 'UnencryptedDatabase',
          severity: 'CRITICAL',
          description: `RDS instance ${instanceId} does not have encryption enabled`,
        });
      }

      // Check for public accessibility
      if (instance.PubliclyAccessible) {
        violations.push({
          resourceType: 'RDSInstance',
          resourceId: instanceId,
          violationType: 'PublicAccess',
          severity: 'CRITICAL',
          description: `RDS instance ${instanceId} is publicly accessible`,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning RDS instances:', error);
  }
}

async function scanRDSClusters(
  violations: ComplianceViolation[]
): Promise<void> {
  try {
    const command = new DescribeDBClustersCommand({});
    const response = await rdsClient.send(command);

    for (const cluster of response.DBClusters || []) {
      const clusterId = cluster.DBClusterIdentifier!;

      // Check for encryption
      if (!cluster.StorageEncrypted) {
        violations.push({
          resourceType: 'RDSCluster',
          resourceId: clusterId,
          violationType: 'UnencryptedDatabase',
          severity: 'CRITICAL',
          description: `RDS cluster ${clusterId} does not have encryption enabled`,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning RDS clusters:', error);
  }
}

function generateReport(
  scanId: string,
  violations: ComplianceViolation[]
): ComplianceReport {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const violation of violations) {
    byType[violation.resourceType] = (byType[violation.resourceType] || 0) + 1;
    bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    scanId,
    violations,
    summary: {
      total: violations.length,
      byType,
      bySeverity,
    },
  };
}

async function storeReport(
  scanId: string,
  report: ComplianceReport
): Promise<void> {
  const key = `compliance-reports/${scanId}.json`;
  const command = new PutObjectCommand({
    Bucket: reportBucket,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Report stored in S3: ${key}`);
}

async function sendMetrics(violations: ComplianceViolation[]): Promise<void> {
  const metricData: Array<{
    MetricName: string;
    Value: number;
    Unit: StandardUnit;
    Timestamp: Date;
    Dimensions: Array<{ Name: string; Value: string }>;
  }> = [];
  const byType: Record<string, number> = {};

  for (const violation of violations) {
    byType[violation.resourceType] = (byType[violation.resourceType] || 0) + 1;
  }

  for (const [resourceType, count] of Object.entries(byType)) {
    metricData.push({
      MetricName: 'ComplianceViolations',
      Value: count,
      Unit: StandardUnit.Count,
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'ResourceType',
          Value: resourceType,
        },
      ],
    });
  }

  if (metricData.length > 0) {
    const command = new PutMetricDataCommand({
      Namespace: 'ComplianceScanner',
      MetricData: metricData,
    });

    await cloudwatchClient.send(command);
    console.log('Metrics sent to CloudWatch');
  }
}

async function sendNotification(
  report: ComplianceReport,
  criticalCount: number
): Promise<void> {
  const message = `
Compliance Scan Alert

Critical violations detected: ${criticalCount}
Total violations: ${report.summary.total}

Violations by severity:
${Object.entries(report.summary.bySeverity)
  .map(([sev, count]) => `  ${sev}: ${count}`)
  .join('\n')}

Violations by resource type:
${Object.entries(report.summary.byType)
  .map(([type, count]) => `  ${type}: ${count}`)
  .join('\n')}

Scan ID: ${report.scanId}
Timestamp: ${report.timestamp}

Please review the detailed report in S3: compliance-reports/${report.scanId}.json
`;

  const command = new PublishCommand({
    TopicArn: snsTopic,
    Subject: `[ALERT] ${criticalCount} Critical Compliance Violations Detected`,
    Message: message,
  });

  await snsClient.send(command);
  console.log('Notification sent to SNS');
}

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVolumesCommand,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
  CreateTagsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  ListUsersCommand,
  ListAccessKeysCommand,
} from '@aws-sdk/client-iam';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';

const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const dynamoDbClient = new DynamoDBClient({});

interface ComplianceViolation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: string;
  description: string;
  remediation: string;
  timestamp: string;
}

interface ComplianceReport {
  scanId: string;
  timestamp: string;
  complianceScore: number;
  totalResources: number;
  violations: ComplianceViolation[];
  summary: {
    ec2: { checked: number; violations: number };
    securityGroups: { checked: number; violations: number };
    s3: { checked: number; violations: number };
    iam: { checked: number; violations: number };
    ebs: { checked: number; violations: number };
    flowLogs: { checked: number; violations: number };
  };
  serviceScores: {
    ec2: number;
    securityGroups: number;
    s3: number;
    iam: number;
    ebs: number;
    flowLogs: number;
  };
}

interface ResourceCounts {
  ec2: number;
  securityGroups: number;
  s3: number;
  iam: number;
  ebs: number;
  vpcs: number;
}

// Retry wrapper with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.name === 'ValidationException' ||
        error.name === 'AccessDeniedException'
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export const handler = async (_event?: any) => {
  console.log('Starting compliance scan...');

  // Validate environment variables
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;

  if (!tableName || !bucketName) {
    throw new Error(
      'Missing required environment variables: DYNAMODB_TABLE, S3_BUCKET'
    );
  }

  const violations: ComplianceViolation[] = [];
  const timestamp = new Date().toISOString();
  const scanId = `scan-${Date.now()}`;
  const resourceCounts: ResourceCounts = {
    ec2: 0,
    securityGroups: 0,
    s3: 0,
    iam: 0,
    ebs: 0,
    vpcs: 0,
  };

  try {
    // Run all checks in parallel with concurrency control
    const [
      ec2Violations,
      sgViolations,
      s3Violations,
      iamViolations,
      ebsViolations,
      flowLogViolations,
    ] = await Promise.all([
      checkEC2Compliance(resourceCounts),
      checkSecurityGroups(resourceCounts),
      checkS3Compliance(resourceCounts),
      checkIAMAccessKeys(resourceCounts),
      checkUnattachedVolumes(resourceCounts),
      checkVPCFlowLogs(resourceCounts),
    ]);

    violations.push(...ec2Violations);
    violations.push(...sgViolations);
    violations.push(...s3Violations);
    violations.push(...iamViolations);
    violations.push(...ebsViolations);
    violations.push(...flowLogViolations);

    // Calculate compliance scores per service and overall
    const serviceScores = calculateServiceScores(
      ec2Violations,
      sgViolations,
      s3Violations,
      iamViolations,
      ebsViolations,
      flowLogViolations,
      resourceCounts
    );

    const complianceScore = calculateComplianceScore(violations);

    const totalResources =
      resourceCounts.ec2 +
      resourceCounts.securityGroups +
      resourceCounts.s3 +
      resourceCounts.iam +
      resourceCounts.ebs +
      resourceCounts.vpcs;

    // Create report
    const report: ComplianceReport = {
      scanId,
      timestamp,
      complianceScore,
      totalResources,
      violations,
      summary: {
        ec2: {
          checked: resourceCounts.ec2,
          violations: ec2Violations.length,
        },
        securityGroups: {
          checked: resourceCounts.securityGroups,
          violations: sgViolations.length,
        },
        s3: { checked: resourceCounts.s3, violations: s3Violations.length },
        iam: { checked: resourceCounts.iam, violations: iamViolations.length },
        ebs: { checked: resourceCounts.ebs, violations: ebsViolations.length },
        flowLogs: {
          checked: resourceCounts.vpcs,
          violations: flowLogViolations.length,
        },
      },
      serviceScores,
    };

    // Store violations in DynamoDB (batch operation)
    await storeViolationsBatch(violations, tableName);

    // Upload report to S3
    await uploadReport(report, bucketName);

    console.log(`Compliance scan completed. Score: ${complianceScore}`);
    console.log(`Total violations: ${violations.length}`);
    console.log(`Total resources checked: ${totalResources}`);

    return {
      statusCode: 200,
      body: JSON.stringify(report),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function checkEC2Compliance(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  const requiredTags = ['Name', 'Environment', 'Owner'];

  let nextToken: string | undefined;

  do {
    const response = await retryWithBackoff(() =>
      ec2Client.send(
        new DescribeInstancesCommand({
          NextToken: nextToken,
        })
      )
    );

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        counts.ec2++;
        const tags = instance.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        const missingTags = requiredTags.filter(tag => !tagKeys.includes(tag));

        if (missingTags.length > 0) {
          violations.push({
            resourceId: instance.InstanceId!,
            resourceType: 'EC2Instance',
            violationType: 'MissingTags',
            severity: 'MEDIUM',
            description: `Instance missing required tags: ${missingTags.join(', ')}`,
            remediation: `Add the following tags: ${missingTags.join(', ')}`,
            timestamp: new Date().toISOString(),
          });
        }

        // Tag resource with LastComplianceCheck
        try {
          await ec2Client.send(
            new CreateTagsCommand({
              Resources: [instance.InstanceId!],
              Tags: [
                {
                  Key: 'LastComplianceCheck',
                  Value: new Date().toISOString(),
                },
              ],
            })
          );
        } catch (error) {
          console.error(
            `Failed to tag instance ${instance.InstanceId}:`,
            error
          );
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return violations;
}

async function checkSecurityGroups(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  let nextToken: string | undefined;

  do {
    const response = await retryWithBackoff(() =>
      ec2Client.send(
        new DescribeSecurityGroupsCommand({
          NextToken: nextToken,
        })
      )
    );

    for (const sg of response.SecurityGroups || []) {
      counts.securityGroups++;

      for (const rule of sg.IpPermissions || []) {
        for (const ipRange of rule.IpRanges || []) {
          if (ipRange.CidrIp === '0.0.0.0/0') {
            const port = rule.FromPort;

            // Allow 80 and 443
            if (port !== 80 && port !== 443) {
              violations.push({
                resourceId: sg.GroupId!,
                resourceType: 'SecurityGroup',
                violationType: 'OverlyPermissiveRule',
                severity: 'HIGH',
                description: `Security group allows 0.0.0.0/0 on port ${port}`,
                remediation:
                  'Restrict access to specific IP ranges or remove the rule',
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return violations;
}

async function checkS3Compliance(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  const listCommand = new ListBucketsCommand({});
  const bucketsResponse = await retryWithBackoff(() =>
    s3Client.send(listCommand)
  );

  for (const bucket of bucketsResponse.Buckets || []) {
    const bucketName = bucket.Name!;
    counts.s3++;

    // Check encryption
    try {
      await retryWithBackoff(() =>
        s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }))
      );
    } catch (error: any) {
      if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
        violations.push({
          resourceId: bucketName,
          resourceType: 'S3Bucket',
          violationType: 'NoEncryption',
          severity: 'HIGH',
          description: `Bucket ${bucketName} does not have encryption enabled`,
          remediation: 'Enable server-side encryption on the bucket',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check public access block
    try {
      const publicAccessResponse = await retryWithBackoff(() =>
        s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }))
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      if (
        !config?.BlockPublicAcls ||
        !config?.BlockPublicPolicy ||
        !config?.IgnorePublicAcls ||
        !config?.RestrictPublicBuckets
      ) {
        violations.push({
          resourceId: bucketName,
          resourceType: 'S3Bucket',
          violationType: 'PublicAccessNotBlocked',
          severity: 'CRITICAL',
          description: `Bucket ${bucketName} does not have all public access settings blocked`,
          remediation: 'Enable all public access block settings',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Failed to check public access for ${bucketName}:`, error);
    }
  }

  return violations;
}

async function checkIAMAccessKeys(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  const maxKeyAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  let userMarker: string | undefined;

  do {
    const usersResponse = await retryWithBackoff(() =>
      iamClient.send(
        new ListUsersCommand({
          Marker: userMarker,
        })
      )
    );

    for (const user of usersResponse.Users || []) {
      counts.iam++;

      const keysCommand = new ListAccessKeysCommand({
        UserName: user.UserName,
      });
      const keysResponse = await retryWithBackoff(() =>
        iamClient.send(keysCommand)
      );

      for (const key of keysResponse.AccessKeyMetadata || []) {
        const keyAge = Date.now() - key.CreateDate!.getTime();

        if (keyAge > maxKeyAge) {
          violations.push({
            resourceId: `${user.UserName}:${key.AccessKeyId}`,
            resourceType: 'IAMAccessKey',
            violationType: 'OldAccessKey',
            severity: 'MEDIUM',
            description: `Access key for user ${user.UserName} is ${Math.floor(keyAge / (24 * 60 * 60 * 1000))} days old`,
            remediation: `Rotate access key for user ${user.UserName}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    userMarker = usersResponse.IsTruncated ? usersResponse.Marker : undefined;
  } while (userMarker);

  return violations;
}

async function checkUnattachedVolumes(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  let nextToken: string | undefined;

  do {
    const response = await retryWithBackoff(() =>
      ec2Client.send(
        new DescribeVolumesCommand({
          NextToken: nextToken,
        })
      )
    );

    for (const volume of response.Volumes || []) {
      counts.ebs++;

      if (!volume.Attachments || volume.Attachments.length === 0) {
        violations.push({
          resourceId: volume.VolumeId!,
          resourceType: 'EBSVolume',
          violationType: 'UnattachedVolume',
          severity: 'MEDIUM',
          description: `Volume ${volume.VolumeId} (${volume.Size} GB) is not attached to any instance`,
          remediation:
            'Review and delete volume if no longer needed, or attach to an instance',
          timestamp: new Date().toISOString(),
        });
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return violations;
}

async function checkVPCFlowLogs(
  counts: ResourceCounts
): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  let vpcNextToken: string | undefined;
  const vpcs: string[] = [];

  do {
    const vpcsResponse = await retryWithBackoff(() =>
      ec2Client.send(
        new DescribeVpcsCommand({
          NextToken: vpcNextToken,
        })
      )
    );

    for (const vpc of vpcsResponse.Vpcs || []) {
      counts.vpcs++;
      vpcs.push(vpc.VpcId!);
    }

    vpcNextToken = vpcsResponse.NextToken;
  } while (vpcNextToken);

  let flowLogNextToken: string | undefined;
  const vpcsWithFlowLogs = new Set<string>();

  do {
    const flowLogsResponse = await retryWithBackoff(() =>
      ec2Client.send(
        new DescribeFlowLogsCommand({
          NextToken: flowLogNextToken,
        })
      )
    );

    for (const flowLog of flowLogsResponse.FlowLogs || []) {
      if (flowLog.ResourceId) {
        vpcsWithFlowLogs.add(flowLog.ResourceId);
      }
    }

    flowLogNextToken = flowLogsResponse.NextToken;
  } while (flowLogNextToken);

  for (const vpcId of vpcs) {
    if (!vpcsWithFlowLogs.has(vpcId)) {
      violations.push({
        resourceId: vpcId,
        resourceType: 'VPC',
        violationType: 'NoFlowLogs',
        severity: 'MEDIUM',
        description: `VPC ${vpcId} does not have flow logs enabled`,
        remediation: 'Enable VPC flow logs with CloudWatch destination',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return violations;
}

function calculateComplianceScore(violations: ComplianceViolation[]): number {
  if (violations.length === 0) return 100;

  const severityWeights: { [key: string]: number } = {
    CRITICAL: 10,
    HIGH: 5,
    MEDIUM: 2,
    LOW: 1,
  };

  const totalPenalty = violations.reduce((sum, v) => {
    return sum + (severityWeights[v.severity] || 1);
  }, 0);

  const score = Math.max(0, 100 - totalPenalty);
  return Math.round(score);
}

function calculateServiceScores(
  ec2Violations: ComplianceViolation[],
  sgViolations: ComplianceViolation[],
  s3Violations: ComplianceViolation[],
  iamViolations: ComplianceViolation[],
  ebsViolations: ComplianceViolation[],
  flowLogViolations: ComplianceViolation[],
  counts: ResourceCounts
): {
  ec2: number;
  securityGroups: number;
  s3: number;
  iam: number;
  ebs: number;
  flowLogs: number;
} {
  const calcScore = (
    violations: ComplianceViolation[],
    resourceCount: number
  ) => {
    if (resourceCount === 0) return 100;
    if (violations.length === 0) return 100;
    const violationRate = violations.length / resourceCount;
    return Math.max(0, Math.round(100 - violationRate * 50));
  };

  return {
    ec2: calcScore(ec2Violations, counts.ec2),
    securityGroups: calcScore(sgViolations, counts.securityGroups),
    s3: calcScore(s3Violations, counts.s3),
    iam: calcScore(iamViolations, counts.iam),
    ebs: calcScore(ebsViolations, counts.ebs),
    flowLogs: calcScore(flowLogViolations, counts.vpcs),
  };
}

async function storeViolationsBatch(
  violations: ComplianceViolation[],
  tableName: string
): Promise<void> {
  if (violations.length === 0) return;

  // Batch write items in chunks of 25 (DynamoDB limit)
  const BATCH_SIZE = 25;

  for (let i = 0; i < violations.length; i += BATCH_SIZE) {
    const batch = violations.slice(i, i + BATCH_SIZE);

    const writeRequests = batch.map(violation => ({
      PutRequest: {
        Item: {
          resourceId: { S: violation.resourceId },
          timestamp: { S: violation.timestamp },
          resourceType: { S: violation.resourceType },
          violationType: { S: violation.violationType },
          severity: { S: violation.severity },
          description: { S: violation.description },
          remediation: { S: violation.remediation },
        },
      },
    }));

    await retryWithBackoff(() =>
      dynamoDbClient.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [tableName]: writeRequests,
          },
        })
      )
    );
  }

  console.log(`Stored ${violations.length} violations in DynamoDB`);
}

async function uploadReport(
  report: ComplianceReport,
  bucketName: string
): Promise<void> {
  const key = `compliance-reports/${report.scanId}.json`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await retryWithBackoff(() => s3Client.send(command));
  console.log(`Report uploaded to s3://${bucketName}/${key}`);
}

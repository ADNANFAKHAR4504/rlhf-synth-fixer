import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketPolicyStatusCommand,
  GetBucketAclCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const cloudwatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});

const REPORT_BUCKET = process.env.REPORT_BUCKET!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

interface Violation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  details?: Record<string, unknown>;
}

interface ComplianceReport {
  scanTimestamp: string;
  environment: string;
  totalViolations: number;
  criticalViolations: number;
  violations: Violation[];
}

export const handler = async (): Promise<{
  statusCode: number;
  body: string;
}> => {
  console.log('Starting compliance scan...');

  const violations: Violation[] = [];

  try {
    // 1. Check EC2 instance tag compliance
    console.log('Checking EC2 instance tags...');
    const ec2TagViolations = await checkEC2TagCompliance();
    violations.push(...ec2TagViolations);

    // 2. Check S3 bucket public access
    console.log('Checking S3 bucket public access...');
    const s3PublicViolations = await checkS3PublicAccess();
    violations.push(...s3PublicViolations);

    // 3. Check IAM role permissions
    console.log('Checking IAM role permissions...');
    const iamViolations = await checkIAMPermissions();
    violations.push(...iamViolations);

    // 4. Check EC2 CloudWatch monitoring
    console.log('Checking EC2 CloudWatch monitoring...');
    const ec2MonitoringViolations = await checkEC2Monitoring();
    violations.push(...ec2MonitoringViolations);

    // 5. Check EBS volume encryption
    console.log('Checking EBS volume encryption...');
    const ebsViolations = await checkEBSEncryption();
    violations.push(...ebsViolations);

    // Generate compliance report
    const report: ComplianceReport = {
      scanTimestamp: new Date().toISOString(),
      environment: ENVIRONMENT_SUFFIX,
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'CRITICAL')
        .length,
      violations,
    };

    // 6. Export report to S3
    console.log('Exporting report to S3...');
    await exportReportToS3(report);

    // 7. Publish CloudWatch custom metrics
    console.log('Publishing CloudWatch metrics...');
    await publishMetrics(violations);

    // 8. Send SNS notification for critical violations
    const criticalViolations = violations.filter(
      v => v.severity === 'CRITICAL'
    );
    if (criticalViolations.length > 0) {
      console.log('Sending SNS notification for critical violations...');
      await sendCriticalAlert(criticalViolations);
    }

    console.log(
      `Compliance scan complete. Found ${violations.length} violations.`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        totalViolations: violations.length,
        criticalViolations: criticalViolations.length,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function checkEC2TagCompliance(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const requiredTags = ['Environment', 'Owner', 'CostCenter'];

  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const tags = instance.Tags || [];
        const tagKeys = tags.map(tag => tag.Key);
        const missingTags = requiredTags.filter(req => !tagKeys.includes(req));

        if (missingTags.length > 0) {
          violations.push({
            resourceId: instance.InstanceId!,
            resourceType: 'EC2Instance',
            violationType: 'MissingRequiredTags',
            severity: 'MEDIUM',
            description: `EC2 instance missing required tags: ${missingTags.join(
              ', '
            )}`,
            details: { missingTags, existingTags: tagKeys },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking EC2 tags:', error);
  }

  return violations;
}

async function checkS3PublicAccess(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);

    for (const bucket of listResponse.Buckets || []) {
      try {
        // Check bucket ACL
        const aclCommand = new GetBucketAclCommand({ Bucket: bucket.Name });
        const aclResponse = await s3Client.send(aclCommand);

        const hasPublicGrants =
          aclResponse.Grants?.some(
            grant =>
              grant.Grantee?.URI ===
                'http://acs.amazonaws.com/groups/global/AllUsers' ||
              grant.Grantee?.URI ===
                'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'
          ) || false;

        if (hasPublicGrants) {
          violations.push({
            resourceId: bucket.Name!,
            resourceType: 'S3Bucket',
            violationType: 'PublicAccess',
            severity: 'CRITICAL',
            description: 'S3 bucket has public access grants in ACL',
            details: { bucketName: bucket.Name },
          });
        }

        // Check policy status
        try {
          const policyCommand = new GetBucketPolicyStatusCommand({
            Bucket: bucket.Name,
          });
          const policyResponse = await s3Client.send(policyCommand);

          if (policyResponse.PolicyStatus?.IsPublic) {
            violations.push({
              resourceId: bucket.Name!,
              resourceType: 'S3Bucket',
              violationType: 'PublicPolicy',
              severity: 'CRITICAL',
              description: 'S3 bucket has public bucket policy',
              details: { bucketName: bucket.Name },
            });
          }
        } catch (err: unknown) {
          // Ignore if no policy exists
          const error = err as { name?: string; message?: string };
          if (error.name !== 'NoSuchBucketPolicy') {
            console.warn(
              `Could not check policy for ${bucket.Name}:`,
              error.message
            );
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.warn(`Could not check bucket ${bucket.Name}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error checking S3 buckets:', error);
  }

  return violations;
}

async function checkIAMPermissions(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const listCommand = new ListRolesCommand({});
    const listResponse = await iamClient.send(listCommand);

    for (const role of listResponse.Roles || []) {
      try {
        // Check inline policies
        const inlinePoliciesCommand = new ListRolePoliciesCommand({
          RoleName: role.RoleName,
        });
        const inlinePolicies = await iamClient.send(inlinePoliciesCommand);

        for (const policyName of inlinePolicies.PolicyNames || []) {
          const getPolicyCommand = new GetRolePolicyCommand({
            RoleName: role.RoleName,
            PolicyName: policyName,
          });
          const policyResponse = await iamClient.send(getPolicyCommand);
          const policyDoc = JSON.parse(
            decodeURIComponent(policyResponse.PolicyDocument!)
          );

          if (hasOverlyPermissivePolicy(policyDoc)) {
            violations.push({
              resourceId: role.RoleName!,
              resourceType: 'IAMRole',
              violationType: 'OverlyPermissivePolicy',
              severity: 'HIGH',
              description: `IAM role has overly permissive inline policy: ${policyName}`,
              details: { roleName: role.RoleName, policyName },
            });
          }
        }

        // Check attached policies
        const attachedCommand = new ListAttachedRolePoliciesCommand({
          RoleName: role.RoleName,
        });
        const attachedResponse = await iamClient.send(attachedCommand);

        for (const policy of attachedResponse.AttachedPolicies || []) {
          // Skip AWS managed policies for this check
          if (!policy.PolicyArn?.includes(':aws:policy/')) {
            try {
              const getPolicyCommand = new GetPolicyCommand({
                PolicyArn: policy.PolicyArn,
              });
              const policyInfo = await iamClient.send(getPolicyCommand);

              const versionCommand = new GetPolicyVersionCommand({
                PolicyArn: policy.PolicyArn,
                VersionId: policyInfo.Policy?.DefaultVersionId,
              });
              const versionResponse = await iamClient.send(versionCommand);
              if (!versionResponse.PolicyVersion?.Document) {
                console.warn(`No policy document for ${policy.PolicyArn}`);
                continue;
              }
              const policyDoc = JSON.parse(
                decodeURIComponent(versionResponse.PolicyVersion.Document)
              );

              if (hasOverlyPermissivePolicy(policyDoc)) {
                violations.push({
                  resourceId: role.RoleName!,
                  resourceType: 'IAMRole',
                  violationType: 'OverlyPermissivePolicy',
                  severity: 'HIGH',
                  description: `IAM role has overly permissive attached policy: ${policy.PolicyName}`,
                  details: {
                    roleName: role.RoleName,
                    policyName: policy.PolicyName,
                  },
                });
              }
            } catch (err) {
              console.warn(`Could not check policy ${policy.PolicyArn}:`, err);
            }
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.warn(`Could not check role ${role.RoleName}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error checking IAM roles:', error);
  }

  return violations;
}

function hasOverlyPermissivePolicy(policyDoc: {
  Statement:
    | Array<{
        Effect?: string;
        Action?: string | string[];
        Resource?: string | string[];
      }>
    | {
        Effect?: string;
        Action?: string | string[];
        Resource?: string | string[];
      };
}): boolean {
  const statements = Array.isArray(policyDoc.Statement)
    ? policyDoc.Statement
    : [policyDoc.Statement];

  for (const statement of statements) {
    if (statement.Effect === 'Allow') {
      const actions = Array.isArray(statement.Action)
        ? statement.Action
        : [statement.Action];
      const resources = Array.isArray(statement.Resource)
        ? statement.Resource
        : [statement.Resource];

      // Check for wildcards in actions or resources
      if (actions.includes('*') || resources.includes('*')) {
        return true;
      }

      // Check for wildcards in individual actions
      if (actions.some(action => action && action.includes('*'))) {
        return true;
      }
    }
  }

  return false;
}

async function checkEC2Monitoring(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        if (instance.Monitoring?.State !== 'enabled') {
          violations.push({
            resourceId: instance.InstanceId!,
            resourceType: 'EC2Instance',
            violationType: 'MonitoringDisabled',
            severity: 'LOW',
            description:
              'EC2 instance does not have detailed CloudWatch monitoring enabled',
            details: { monitoringState: instance.Monitoring?.State },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking EC2 monitoring:', error);
  }

  return violations;
}

async function checkEBSEncryption(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    for (const volume of response.Volumes || []) {
      if (!volume.Encrypted) {
        violations.push({
          resourceId: volume.VolumeId!,
          resourceType: 'EBSVolume',
          violationType: 'UnencryptedVolume',
          severity: 'CRITICAL',
          description: 'EBS volume is not encrypted',
          details: {
            volumeId: volume.VolumeId,
            attachments: volume.Attachments?.map(a => a.InstanceId),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking EBS encryption:', error);
  }

  return violations;
}

async function exportReportToS3(report: ComplianceReport): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `compliance-reports/report-${timestamp}.json`;

  const command = new PutObjectCommand({
    Bucket: REPORT_BUCKET,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Report exported to s3://${REPORT_BUCKET}/${key}`);
}

async function publishMetrics(violations: Violation[]): Promise<void> {
  const metricsByType: Record<string, number> = {};

  for (const violation of violations) {
    metricsByType[violation.violationType] =
      (metricsByType[violation.violationType] || 0) + 1;
  }

  const metricData = Object.entries(metricsByType).map(([type, count]) => ({
    MetricName: type,
    Value: count,
    Unit: 'Count' as const,
    Timestamp: new Date(),
  }));

  // Add total violations metric
  metricData.push({
    MetricName: 'TotalViolations',
    Value: violations.length,
    Unit: 'Count' as const,
    Timestamp: new Date(),
  });

  // Add critical violations metric
  metricData.push({
    MetricName: 'CriticalViolations',
    Value: violations.filter(v => v.severity === 'CRITICAL').length,
    Unit: 'Count' as const,
    Timestamp: new Date(),
  });

  const command = new PutMetricDataCommand({
    Namespace: 'ComplianceMonitoring',
    MetricData: metricData,
  });

  await cloudwatchClient.send(command);
  console.log(`Published ${metricData.length} metrics to CloudWatch`);
}

async function sendCriticalAlert(violations: Violation[]): Promise<void> {
  const message = {
    subject: `CRITICAL: ${violations.length} Critical Compliance Violations Detected`,
    violations: violations.map(v => ({
      resource: v.resourceId,
      type: v.violationType,
      description: v.description,
    })),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT_SUFFIX,
  };

  const command = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: message.subject,
    Message: JSON.stringify(message, null, 2),
  });

  await snsClient.send(command);
  console.log('Critical alert sent to SNS topic');
}

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
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
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export interface TapStackArgs {
  environmentSuffix: string;
  approvedAmiIds?: string[];
}

interface ComplianceViolation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
}

interface PolicyStatement {
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
}

interface PolicyDocument {
  Statement: PolicyStatement[];
}

export class TapStack extends pulumi.ComponentResource {
  public readonly violationsReport: pulumi.Output<string>;
  public readonly snsTopic: aws.sns.Topic;
  public readonly violationCount: pulumi.Output<number>;

  private readonly region: string;
  private readonly ec2Client: EC2Client;
  private readonly s3Client: S3Client;
  private readonly iamClient: IAMClient;
  private readonly cloudwatchClient: CloudWatchClient;
  private readonly snsClient: SNSClient;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const config = new pulumi.Config();
    const approvedAmis =
      args.approvedAmiIds || config.getObject<string[]>('approvedAmiIds') || [];
    const requiredTags = ['Environment', 'Owner', 'CostCenter'];

    // Get AWS region
    this.region = aws.config.region || 'us-east-1';

    // Initialize AWS SDK clients
    this.ec2Client = new EC2Client({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });
    this.iamClient = new IAMClient({ region: this.region });
    this.cloudwatchClient = new CloudWatchClient({ region: this.region });
    this.snsClient = new SNSClient({ region: this.region });

    // Create SNS Topic for critical violation alerts
    this.snsTopic = new aws.sns.Topic(
      `compliance-alerts-${args.environmentSuffix}`,
      {
        name: `compliance-alerts-${args.environmentSuffix}`,
        displayName: 'Infrastructure Compliance Alerts',
        tags: {
          Name: `compliance-alerts-${args.environmentSuffix}`,
          Purpose: 'ComplianceNotifications',
        },
      },
      { parent: this }
    );

    // Collect all violations
    const violations = pulumi
      .all([
        this.checkEc2TagCompliance(requiredTags, args.environmentSuffix),
        this.checkS3BucketCompliance(args.environmentSuffix),
        this.checkEc2AmiCompliance(approvedAmis, args.environmentSuffix),
        this.checkSecurityGroupCompliance(args.environmentSuffix),
        this.checkIamRoleCompliance(args.environmentSuffix),
      ])
      .apply(
        ([
          ec2TagViolations,
          s3Violations,
          amiViolations,
          sgViolations,
          iamViolations,
        ]) => {
          return [
            ...ec2TagViolations,
            ...s3Violations,
            ...amiViolations,
            ...sgViolations,
            ...iamViolations,
          ];
        }
      );

    // Generate CloudWatch metrics for violations
    violations.apply(async allViolations => {
      await this.publishCloudWatchMetrics(
        allViolations,
        args.environmentSuffix
      );
    });

    // Send SNS notifications for critical violations
    violations.apply(async allViolations => {
      const criticalViolations = allViolations.filter(
        v => v.severity === 'critical'
      );
      if (criticalViolations.length > 0) {
        await this.sendCriticalAlerts(
          criticalViolations,
          args.environmentSuffix
        );
      }
    });

    // Export violations as JSON report
    this.violationsReport = violations.apply(v => JSON.stringify(v, null, 2));
    this.violationCount = violations.apply(v => v.length);

    this.registerOutputs({
      violationsReport: this.violationsReport,
      snsTopicArn: this.snsTopic.arn,
      violationCount: this.violationCount,
    });
  }

  private checkEc2TagCompliance(
    requiredTags: string[],
    _environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(
      (async () => {
        const violations: ComplianceViolation[] = [];

        try {
          const command = new DescribeInstancesCommand({
            Filters: [
              {
                Name: 'instance-state-name',
                Values: ['running', 'stopped'],
              },
            ],
          });

          const response = await this.ec2Client.send(command);

          for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
              const tags: Record<string, string> = {};
              for (const tag of instance.Tags || []) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }

              const missingTags = requiredTags.filter(tag => !tags[tag]);

              if (missingTags.length > 0) {
                violations.push({
                  resourceId: instance.InstanceId || 'unknown',
                  resourceType: 'EC2Instance',
                  violationType: 'MissingRequiredTags',
                  severity: 'medium',
                  details: `Missing tags: ${missingTags.join(', ')}`,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking EC2 tag compliance:', error);
        }

        return violations;
      })()
    );
  }

  private checkS3BucketCompliance(
    _environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(
      (async () => {
        const violations: ComplianceViolation[] = [];

        try {
          const listCommand = new ListBucketsCommand({});
          const bucketsResponse = await this.s3Client.send(listCommand);

          for (const bucket of bucketsResponse.Buckets || []) {
            const bucketName = bucket.Name!;

            // Check encryption
            try {
              await this.s3Client.send(
                new GetBucketEncryptionCommand({ Bucket: bucketName })
              );
            } catch (error) {
              violations.push({
                resourceId: bucketName,
                resourceType: 'S3Bucket',
                violationType: 'EncryptionNotEnabled',
                severity: 'critical',
                details: 'S3 bucket does not have encryption enabled',
              });
            }

            // Check versioning
            try {
              const versioningResponse = await this.s3Client.send(
                new GetBucketVersioningCommand({ Bucket: bucketName })
              );

              if (versioningResponse.Status !== 'Enabled') {
                violations.push({
                  resourceId: bucketName,
                  resourceType: 'S3Bucket',
                  violationType: 'VersioningNotEnabled',
                  severity: 'medium',
                  details: 'S3 bucket versioning is not enabled',
                });
              }
            } catch (error) {
              console.error(
                `Error checking versioning for bucket ${bucketName}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error('Error checking S3 bucket compliance:', error);
        }

        return violations;
      })()
    );
  }

  private checkEc2AmiCompliance(
    approvedAmis: string[],
    _environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    if (approvedAmis.length === 0) {
      return pulumi.output([]);
    }

    return pulumi.output(
      (async () => {
        const violations: ComplianceViolation[] = [];

        try {
          const command = new DescribeInstancesCommand({
            Filters: [
              {
                Name: 'instance-state-name',
                Values: ['running', 'stopped'],
              },
            ],
          });

          const response = await this.ec2Client.send(command);

          for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
              const amiId = instance.ImageId || '';

              if (!approvedAmis.includes(amiId)) {
                violations.push({
                  resourceId: instance.InstanceId || 'unknown',
                  resourceType: 'EC2Instance',
                  violationType: 'UnapprovedAMI',
                  severity: 'high',
                  details: `Instance using unapproved AMI: ${amiId}`,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking EC2 AMI compliance:', error);
        }

        return violations;
      })()
    );
  }

  private checkSecurityGroupCompliance(
    _environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(
      (async () => {
        const violations: ComplianceViolation[] = [];

        try {
          const command = new DescribeSecurityGroupsCommand({});
          const response = await this.ec2Client.send(command);

          for (const sg of response.SecurityGroups || []) {
            // Check for open SSH (port 22)
            const openSsh = sg.IpPermissions?.some(
              rule =>
                rule.FromPort !== undefined &&
                rule.ToPort !== undefined &&
                (rule.FromPort === 22 || rule.ToPort === 22) &&
                (rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0') ||
                  rule.Ipv6Ranges?.some(ip => ip.CidrIpv6 === '::/0'))
            );

            if (openSsh) {
              violations.push({
                resourceId: sg.GroupId || 'unknown',
                resourceType: 'SecurityGroup',
                violationType: 'OpenSSHPort',
                severity: 'critical',
                details: `Security group ${sg.GroupName} allows SSH from 0.0.0.0/0`,
              });
            }

            // Check for open RDP (port 3389)
            const openRdp = sg.IpPermissions?.some(
              rule =>
                rule.FromPort !== undefined &&
                rule.ToPort !== undefined &&
                (rule.FromPort === 3389 || rule.ToPort === 3389) &&
                (rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0') ||
                  rule.Ipv6Ranges?.some(ip => ip.CidrIpv6 === '::/0'))
            );

            if (openRdp) {
              violations.push({
                resourceId: sg.GroupId || 'unknown',
                resourceType: 'SecurityGroup',
                violationType: 'OpenRDPPort',
                severity: 'critical',
                details: `Security group ${sg.GroupName} allows RDP from 0.0.0.0/0`,
              });
            }
          }
        } catch (error) {
          console.error('Error checking security group compliance:', error);
        }

        return violations;
      })()
    );
  }

  private checkIamRoleCompliance(
    _environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(
      (async () => {
        const violations: ComplianceViolation[] = [];

        try {
          const listRolesCommand = new ListRolesCommand({});
          const rolesResponse = await this.iamClient.send(listRolesCommand);

          for (const role of rolesResponse.Roles || []) {
            const roleName = role.RoleName!;
            let hasWildcardViolation = false;

            // Check attached policies
            const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand(
              {
                RoleName: roleName,
              }
            );
            const attachedPolicies = await this.iamClient.send(
              attachedPoliciesCommand
            );

            for (const policy of attachedPolicies.AttachedPolicies || []) {
              if (hasWildcardViolation) break;

              try {
                const policyArn = policy.PolicyArn!;
                const getPolicyCommand = new GetPolicyCommand({
                  PolicyArn: policyArn,
                });
                const policyData = await this.iamClient.send(getPolicyCommand);

                const getPolicyVersionCommand = new GetPolicyVersionCommand({
                  PolicyArn: policyArn,
                  VersionId: policyData.Policy!.DefaultVersionId,
                });
                const policyVersion = await this.iamClient.send(
                  getPolicyVersionCommand
                );

                const policyDocument = JSON.parse(
                  decodeURIComponent(policyVersion.PolicyVersion!.Document!)
                ) as PolicyDocument;

                // Check for wildcard permissions
                const hasWildcards = policyDocument.Statement?.some(
                  (stmt: PolicyStatement) =>
                    stmt.Effect === 'Allow' &&
                    (stmt.Action === '*' ||
                      (Array.isArray(stmt.Action) &&
                        stmt.Action.includes('*')) ||
                      stmt.Resource === '*' ||
                      (Array.isArray(stmt.Resource) &&
                        stmt.Resource.includes('*')))
                );

                if (hasWildcards) {
                  violations.push({
                    resourceId: roleName,
                    resourceType: 'IAMRole',
                    violationType: 'WildcardPermissions',
                    severity: 'high',
                    details: `IAM role has wildcard permissions in policy ${policy.PolicyName}`,
                  });
                  hasWildcardViolation = true;
                }
              } catch (error) {
                console.error(
                  `Error checking policy ${policy.PolicyArn}:`,
                  error
                );
              }
            }

            if (hasWildcardViolation) continue;

            // Check inline policies
            try {
              const listInlinePoliciesCommand = new ListRolePoliciesCommand({
                RoleName: roleName,
              });
              const inlinePolicies = await this.iamClient.send(
                listInlinePoliciesCommand
              );

              for (const policyName of inlinePolicies.PolicyNames || []) {
                const getRolePolicyCommand = new GetRolePolicyCommand({
                  RoleName: roleName,
                  PolicyName: policyName,
                });
                const policyData =
                  await this.iamClient.send(getRolePolicyCommand);

                const policyDocument = JSON.parse(
                  decodeURIComponent(policyData.PolicyDocument!)
                ) as PolicyDocument;

                const hasWildcards = policyDocument.Statement?.some(
                  (stmt: PolicyStatement) =>
                    stmt.Effect === 'Allow' &&
                    (stmt.Action === '*' ||
                      (Array.isArray(stmt.Action) &&
                        stmt.Action.includes('*')) ||
                      stmt.Resource === '*' ||
                      (Array.isArray(stmt.Resource) &&
                        stmt.Resource.includes('*')))
                );

                if (hasWildcards) {
                  violations.push({
                    resourceId: roleName,
                    resourceType: 'IAMRole',
                    violationType: 'WildcardPermissions',
                    severity: 'high',
                    details:
                      'IAM role has wildcard permissions in inline policy',
                  });
                  break;
                }
              }
            } catch (error) {
              console.error(
                `Error checking inline policies for role ${roleName}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error('Error checking IAM role compliance:', error);
        }

        return violations;
      })()
    );
  }

  private async publishCloudWatchMetrics(
    violations: ComplianceViolation[],
    environmentSuffix: string
  ): Promise<void> {
    try {
      // Group violations by type
      const violationsByType = violations.reduce(
        (acc, v) => {
          acc[v.violationType] = (acc[v.violationType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Publish metrics
      const metricData = Object.entries(violationsByType).map(
        ([type, count]) => ({
          MetricName: type,
          Value: count,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
          Dimensions: [{ Name: 'Environment', Value: environmentSuffix }],
        })
      );

      if (metricData.length > 0) {
        const command = new PutMetricDataCommand({
          Namespace: `ComplianceMonitoring-${environmentSuffix}`,
          MetricData: metricData,
        });
        await this.cloudwatchClient.send(command);
      }

      // Publish total violation count
      const totalCommand = new PutMetricDataCommand({
        Namespace: `ComplianceMonitoring-${environmentSuffix}`,
        MetricData: [
          {
            MetricName: 'TotalViolations',
            Value: violations.length,
            Unit: StandardUnit.Count,
            Timestamp: new Date(),
            Dimensions: [{ Name: 'Environment', Value: environmentSuffix }],
          },
        ],
      });
      await this.cloudwatchClient.send(totalCommand);
    } catch (error) {
      console.error('Error publishing CloudWatch metrics:', error);
    }
  }

  private async sendCriticalAlerts(
    criticalViolations: ComplianceViolation[],
    environmentSuffix: string
  ): Promise<void> {
    const message = {
      subject: `Critical Compliance Violations Detected - ${environmentSuffix}`,
      violations: criticalViolations,
      timestamp: new Date().toISOString(),
      totalCount: criticalViolations.length,
    };

    await this.snsTopic.arn.apply(async topicArn => {
      try {
        const command = new PublishCommand({
          TopicArn: topicArn,
          Subject: message.subject,
          Message: JSON.stringify(message, null, 2),
        });
        await this.snsClient.send(command);
      } catch (error) {
        console.error('Error sending critical alerts:', error);
      }
    });
  }
}

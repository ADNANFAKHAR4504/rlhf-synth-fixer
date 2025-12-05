const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
} = require('@aws-sdk/client-ec2');
const { IAMClient, ListRolesCommand, ListAttachedRolePoliciesCommand } = require('@aws-sdk/client-iam');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });

const REPORT_BUCKET = process.env.REPORT_BUCKET;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  const violations = {
    unencryptedVolumes: [],
    permissiveSecurityGroups: [],
    missingTags: [],
    iamViolations: [],
    missingFlowLogs: [],
  };

  try {
    // Scan EC2 instances and volumes
    await scanEC2Instances(violations);

    // Scan security groups
    await scanSecurityGroups(violations);

    // Scan IAM roles
    await scanIAMRoles(violations);

    // Scan VPC flow logs
    await scanVPCFlowLogs(violations);

    // Generate report
    const report = generateReport(violations);

    // Upload report to S3
    await uploadReport(report);

    // Publish metrics to CloudWatch
    await publishMetrics(violations);

    console.log('Compliance scan completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        summary: {
          unencryptedVolumes: violations.unencryptedVolumes.length,
          permissiveSecurityGroups: violations.permissiveSecurityGroups.length,
          missingTags: violations.missingTags.length,
          iamViolations: violations.iamViolations.length,
          missingFlowLogs: violations.missingFlowLogs.length,
        },
        reportLocation: `s3://${REPORT_BUCKET}/compliance-reports/${report.timestamp}.json`,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function scanEC2Instances(violations) {
  console.log('Scanning EC2 instances...');

  try {
    const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({}));

    const requiredTags = ['Environment', 'Owner', 'CostCenter'];

    for (const reservation of instancesResponse.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        // Skip terminated instances
        if (instance.State.Name === 'terminated') continue;

        const instanceId = instance.InstanceId;
        const tags = instance.Tags || [];
        const tagKeys = tags.map((t) => t.Key);

        // Check for missing tags
        const missingTagsForInstance = requiredTags.filter((tag) => !tagKeys.includes(tag));
        if (missingTagsForInstance.length > 0) {
          violations.missingTags.push({
            resourceType: 'EC2Instance',
            resourceId: instanceId,
            missingTags: missingTagsForInstance,
          });
        }

        // Check volumes for encryption
        for (const blockDevice of instance.BlockDeviceMappings || []) {
          if (blockDevice.Ebs && blockDevice.Ebs.VolumeId) {
            const volumeId = blockDevice.Ebs.VolumeId;
            const volumeResponse = await ec2Client.send(
              new DescribeVolumesCommand({
                VolumeIds: [volumeId],
              })
            );

            const volume = volumeResponse.Volumes[0];
            if (!volume.Encrypted) {
              violations.unencryptedVolumes.push({
                instanceId: instanceId,
                volumeId: volumeId,
              });
            }
          }
        }
      }
    }

    console.log(`Found ${violations.unencryptedVolumes.length} unencrypted volumes`);
    console.log(`Found ${violations.missingTags.length} instances with missing tags`);
  } catch (error) {
    console.error('Error scanning EC2 instances:', error);
    throw error;
  }
}

async function scanSecurityGroups(violations) {
  console.log('Scanning security groups...');

  try {
    const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({}));

    for (const sg of sgResponse.SecurityGroups || []) {
      const sgId = sg.GroupId;
      const sgDescription = sg.Description;

      // Check if description is missing or generic
      if (!sgDescription || sgDescription.trim() === '' || sgDescription === 'default VPC security group') {
        // Only flag if not the default security group
        if (sg.GroupName !== 'default') {
          violations.permissiveSecurityGroups.push({
            securityGroupId: sgId,
            violationType: 'MissingDescription',
            description: 'Security group lacks a proper description',
          });
        }
      }

      // Check for overly permissive rules
      for (const rule of sg.IpPermissions || []) {
        const fromPort = rule.FromPort;
        const toPort = rule.ToPort;

        for (const ipRange of rule.IpRanges || []) {
          const cidr = ipRange.CidrIp;

          // Flag 0.0.0.0/0 access on non-standard ports
          if (cidr === '0.0.0.0/0') {
            // Allow only ports 80 and 443
            const isAllowedPort = (fromPort === 80 && toPort === 80) || (fromPort === 443 && toPort === 443);

            if (!isAllowedPort) {
              violations.permissiveSecurityGroups.push({
                securityGroupId: sgId,
                violationType: 'OverlyPermissiveRule',
                rule: {
                  fromPort: fromPort,
                  toPort: toPort,
                  cidr: cidr,
                },
                description: `Allows 0.0.0.0/0 access on port(s) ${fromPort}-${toPort}`,
              });
            }
          }
        }
      }
    }

    console.log(`Found ${violations.permissiveSecurityGroups.length} security group violations`);
  } catch (error) {
    console.error('Error scanning security groups:', error);
    throw error;
  }
}

async function scanIAMRoles(violations) {
  console.log('Scanning IAM roles...');

  try {
    const rolesResponse = await iamClient.send(new ListRolesCommand({}));

    for (const role of rolesResponse.Roles || []) {
      const roleName = role.RoleName;

      // Skip AWS service roles
      if (roleName.startsWith('AWS') || roleName.startsWith('aws-')) {
        continue;
      }

      // Check if role has attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      const attachedPolicies = policiesResponse.AttachedPolicies || [];

      if (attachedPolicies.length === 0) {
        violations.iamViolations.push({
          roleName: roleName,
          violationType: 'NoPoliciesAttached',
          description: 'IAM role has no policies attached',
        });
      }

      // Check for overly broad permissions
      for (const policy of attachedPolicies) {
        if (policy.PolicyName === 'AdministratorAccess' || policy.PolicyName === 'PowerUserAccess') {
          violations.iamViolations.push({
            roleName: roleName,
            violationType: 'OverlyBroadPermissions',
            policyName: policy.PolicyName,
            description: `Role has overly broad policy: ${policy.PolicyName}`,
          });
        }
      }
    }

    console.log(`Found ${violations.iamViolations.length} IAM violations`);
  } catch (error) {
    console.error('Error scanning IAM roles:', error);
    throw error;
  }
}

async function scanVPCFlowLogs(violations) {
  console.log('Scanning VPC flow logs...');

  try {
    // Get all VPCs
    const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));

    // Get all flow logs
    const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({}));

    const flowLogVpcIds = new Set();
    for (const flowLog of flowLogsResponse.FlowLogs || []) {
      if (flowLog.ResourceId && flowLog.ResourceId.startsWith('vpc-')) {
        flowLogVpcIds.add(flowLog.ResourceId);
      }
    }

    // Check each VPC for flow logs
    for (const vpc of vpcsResponse.Vpcs || []) {
      const vpcId = vpc.VpcId;

      if (!flowLogVpcIds.has(vpcId)) {
        violations.missingFlowLogs.push({
          vpcId: vpcId,
          description: 'VPC does not have CloudWatch flow logs enabled',
        });
      }
    }

    console.log(`Found ${violations.missingFlowLogs.length} VPCs without flow logs`);
  } catch (error) {
    console.error('Error scanning VPC flow logs:', error);
    throw error;
  }
}

function generateReport(violations) {
  const timestamp = new Date().toISOString();

  return {
    timestamp: timestamp,
    region: region,
    environmentSuffix: ENVIRONMENT_SUFFIX,
    summary: {
      totalViolations:
        violations.unencryptedVolumes.length +
        violations.permissiveSecurityGroups.length +
        violations.missingTags.length +
        violations.iamViolations.length +
        violations.missingFlowLogs.length,
      unencryptedVolumes: violations.unencryptedVolumes.length,
      permissiveSecurityGroups: violations.permissiveSecurityGroups.length,
      missingTags: violations.missingTags.length,
      iamViolations: violations.iamViolations.length,
      missingFlowLogs: violations.missingFlowLogs.length,
    },
    violations: violations,
  };
}

async function uploadReport(report) {
  console.log('Uploading report to S3...');

  const key = `compliance-reports/${report.timestamp}.json`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: REPORT_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(`Report uploaded to s3://${REPORT_BUCKET}/${key}`);
  } catch (error) {
    console.error('Error uploading report:', error);
    throw error;
  }
}

async function publishMetrics(violations) {
  console.log('Publishing metrics to CloudWatch...');

  const namespace = 'ComplianceScanner';
  const timestamp = new Date();

  const metricData = [
    {
      MetricName: 'UnencryptedVolumes',
      Value: violations.unencryptedVolumes.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'PermissiveSecurityGroups',
      Value: violations.permissiveSecurityGroups.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'MissingTags',
      Value: violations.missingTags.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'IAMViolations',
      Value: violations.iamViolations.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'MissingFlowLogs',
      Value: violations.missingFlowLogs.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
  ];

  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: metricData,
      })
    );

    console.log('Metrics published successfully');
  } catch (error) {
    console.error('Error publishing metrics:', error);
    throw error;
  }
}

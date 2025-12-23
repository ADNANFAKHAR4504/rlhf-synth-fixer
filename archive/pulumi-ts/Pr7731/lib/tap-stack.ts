import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = config.get('awsRegion') || 'us-east-1';

// S3 Bucket for Compliance Reports
const complianceReportBucket = new aws.s3.BucketV2(
  `compliance-reports-${environmentSuffix}`,
  {
    bucket: `compliance-reports-${environmentSuffix}`,
    tags: {
      Name: `compliance-reports-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  }
);

// Block public access to compliance reports bucket
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const complianceReportBucketPublicAccessBlock =
  new aws.s3.BucketPublicAccessBlock(
    `compliance-reports-public-access-block-${environmentSuffix}`,
    {
      bucket: complianceReportBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

// Enable versioning for compliance reports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const complianceReportBucketVersioning = new aws.s3.BucketVersioningV2(
  `compliance-reports-versioning-${environmentSuffix}`,
  {
    bucket: complianceReportBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

// Enable server-side encryption for compliance reports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const complianceReportBucketEncryption =
  new aws.s3.BucketServerSideEncryptionConfigurationV2(
    `compliance-reports-encryption-${environmentSuffix}`,
    {
      bucket: complianceReportBucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    }
  );

// IAM Role for Lambda
const lambdaRole = new aws.iam.Role(
  `compliance-scanner-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Name: `compliance-scanner-role-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  }
);

// Attach basic Lambda execution policy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lambdaBasicExecutionAttachment = new aws.iam.RolePolicyAttachment(
  `compliance-scanner-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Custom IAM Policy for compliance scanning
const complianceScannerPolicy = new aws.iam.Policy(
  `compliance-scanner-policy-${environmentSuffix}`,
  {
    description: 'Policy for compliance scanner Lambda function',
    policy: pulumi.all([complianceReportBucket.arn]).apply(([bucketArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeVolumes',
              'ec2:DescribeVpcs',
              'ec2:DescribeFlowLogs',
              'ec2:CreateTags',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'rds:DescribeDBInstances',
              'rds:DescribeDBClusters',
              'rds:ListTagsForResource',
              'rds:AddTagsToResource',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ListAllMyBuckets',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:GetBucketPublicAccessBlock',
              's3:GetEncryptionConfiguration',
              's3:GetBucketTagging',
              's3:PutBucketTagging',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:ListTagsLogGroup',
              'logs:TagLogGroup',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      })
    ),
    tags: {
      Name: `compliance-scanner-policy-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  }
);

// Attach custom policy to Lambda role
const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(
  `compliance-scanner-policy-attachment-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn: complianceScannerPolicy.arn,
  }
);

// CloudWatch Log Group for Lambda
const lambdaLogGroup = new aws.cloudwatch.LogGroup(
  `compliance-scanner-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Name: `compliance-scanner-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  }
);

// Lambda Function for Compliance Scanning
const complianceScannerLambda = new aws.lambda.Function(
  `compliance-scanner-${environmentSuffix}`,
  {
    name: `compliance-scanner-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeVpcsCommand, DescribeFlowLogsCommand, CreateTagsCommand } = require("@aws-sdk/client-ec2");
const { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand, ListTagsForResourceCommand, AddTagsToResourceCommand } = require("@aws-sdk/client-rds");
const { S3Client, ListBucketsCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketTaggingCommand, PutBucketTaggingCommand } = require("@aws-sdk/client-s3");
const { CloudWatchLogsClient, DescribeLogGroupsCommand, ListTagsLogGroupCommand, TagLogGroupCommand } = require("@aws-sdk/client-cloudwatch-logs");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const reportBucket = process.env.REPORT_BUCKET;
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

exports.handler = async (event) => {
    console.log('Starting compliance scan...');

    const timestamp = new Date().toISOString();
    const findings = {
        timestamp,
        summary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        },
        ec2: [],
        rds: [],
        s3: [],
        flowLogs: []
    };

    try {
        // 1. Check EC2 instances
        console.log('Scanning EC2 instances...');
        await scanEC2Instances(findings);

        // 2. Check RDS databases
        console.log('Scanning RDS databases...');
        await scanRDSDatabases(findings);

        // 3. Check S3 buckets
        console.log('Scanning S3 buckets...');
        await scanS3Buckets(findings);

        // 4. Check VPC Flow Logs
        console.log('Checking VPC Flow Logs...');
        await checkFlowLogs(findings);

        // 5. Save compliance report to S3
        console.log('Saving compliance report...');
        await saveComplianceReport(findings);

        // 6. Send metrics to CloudWatch
        console.log('Publishing CloudWatch metrics...');
        await publishMetrics(findings);

        console.log('Compliance scan completed successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Compliance scan completed',
                summary: findings.summary,
                reportLocation: \`s3://\${reportBucket}/compliance-reports/\${timestamp}.json\`
            })
        };
    } catch (error) {
        console.error('Error during compliance scan:', error);
        throw error;
    }
};

async function scanEC2Instances(findings) {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
            const instanceId = instance.InstanceId;
            const issues = [];

            // Check for IAM role
            if (!instance.IamInstanceProfile) {
                issues.push({
                    severity: 'HIGH',
                    issue: 'No IAM role attached',
                    recommendation: 'Attach an IAM instance profile with least privilege permissions'
                });
                findings.summary.high++;
            }

            // Check EBS volumes for encryption
            if (instance.BlockDeviceMappings) {
                for (const device of instance.BlockDeviceMappings) {
                    if (device.Ebs) {
                        const volumeCommand = new DescribeVolumesCommand({
                            VolumeIds: [device.Ebs.VolumeId]
                        });
                        const volumeResponse = await ec2Client.send(volumeCommand);

                        if (volumeResponse.Volumes && volumeResponse.Volumes[0]) {
                            const volume = volumeResponse.Volumes[0];
                            if (!volume.Encrypted) {
                                issues.push({
                                    severity: 'CRITICAL',
                                    issue: \`Unencrypted EBS volume: \${device.Ebs.VolumeId}\`,
                                    recommendation: 'Enable EBS encryption for all volumes'
                                });
                                findings.summary.critical++;
                            }
                        }
                    }
                }
            }

            // Tag the instance
            if (issues.length > 0) {
                await tagResource('ec2', instanceId, timestamp);
            }

            if (issues.length > 0) {
                findings.ec2.push({
                    instanceId,
                    state: instance.State?.Name,
                    issues
                });
            }
        }
    }
}

async function scanRDSDatabases(findings) {
    // Check RDS Instances
    const instancesCommand = new DescribeDBInstancesCommand({});
    const instancesResponse = await rdsClient.send(instancesCommand);

    for (const instance of instancesResponse.DBInstances || []) {
        const issues = [];

        // Check encryption
        if (!instance.StorageEncrypted) {
            issues.push({
                severity: 'CRITICAL',
                issue: 'Encryption at rest not enabled',
                recommendation: 'Enable encryption at rest for RDS instances'
            });
            findings.summary.critical++;
        }

        // Check backup retention
        if (!instance.BackupRetentionPeriod || instance.BackupRetentionPeriod < 7) {
            issues.push({
                severity: 'HIGH',
                issue: \`Backup retention period is \${instance.BackupRetentionPeriod} days (minimum 7 required)\`,
                recommendation: 'Set backup retention period to at least 7 days'
            });
            findings.summary.high++;
        }

        // Tag the instance
        if (issues.length > 0) {
            await tagResource('rds', instance.DBInstanceArn, timestamp);
        }

        if (issues.length > 0) {
            findings.rds.push({
                dbInstanceIdentifier: instance.DBInstanceIdentifier,
                engine: instance.Engine,
                issues
            });
        }
    }

    // Check RDS Clusters
    const clustersCommand = new DescribeDBClustersCommand({});
    const clustersResponse = await rdsClient.send(clustersCommand);

    for (const cluster of clustersResponse.DBClusters || []) {
        const issues = [];

        // Check encryption
        if (!cluster.StorageEncrypted) {
            issues.push({
                severity: 'CRITICAL',
                issue: 'Encryption at rest not enabled',
                recommendation: 'Enable encryption at rest for RDS clusters'
            });
            findings.summary.critical++;
        }

        // Check backup retention
        if (!cluster.BackupRetentionPeriod || cluster.BackupRetentionPeriod < 7) {
            issues.push({
                severity: 'HIGH',
                issue: \`Backup retention period is \${cluster.BackupRetentionPeriod} days (minimum 7 required)\`,
                recommendation: 'Set backup retention period to at least 7 days'
            });
            findings.summary.high++;
        }

        // Tag the cluster
        if (issues.length > 0) {
            await tagResource('rds', cluster.DBClusterArn, timestamp);
        }

        if (issues.length > 0) {
            findings.rds.push({
                dbClusterIdentifier: cluster.DBClusterIdentifier,
                engine: cluster.Engine,
                issues
            });
        }
    }
}

async function scanS3Buckets(findings) {
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);

    for (const bucket of listResponse.Buckets || []) {
        const bucketName = bucket.Name;
        const issues = [];

        try {
            // Check public access block
            try {
                const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
                const publicAccessResponse = await s3Client.send(publicAccessCommand);

                if (!publicAccessResponse.PublicAccessBlockConfiguration ||
                    !publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicAcls ||
                    !publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicPolicy ||
                    !publicAccessResponse.PublicAccessBlockConfiguration.IgnorePublicAcls ||
                    !publicAccessResponse.PublicAccessBlockConfiguration.RestrictPublicBuckets) {
                    issues.push({
                        severity: 'CRITICAL',
                        issue: 'Public access block not fully configured',
                        recommendation: 'Enable all public access block settings'
                    });
                    findings.summary.critical++;
                }
            } catch (err) {
                if (err.name === 'NoSuchPublicAccessBlockConfiguration') {
                    issues.push({
                        severity: 'CRITICAL',
                        issue: 'No public access block configuration',
                        recommendation: 'Configure public access block settings'
                    });
                    findings.summary.critical++;
                }
            }

            // Check versioning
            try {
                const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
                const versioningResponse = await s3Client.send(versioningCommand);

                if (versioningResponse.Status !== 'Enabled') {
                    issues.push({
                        severity: 'MEDIUM',
                        issue: 'Versioning not enabled',
                        recommendation: 'Enable versioning for data protection'
                    });
                    findings.summary.medium++;
                }
            } catch (err) {
                console.error(\`Error checking versioning for \${bucketName}:\`, err.message);
            }

            // Check encryption
            try {
                const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
                await s3Client.send(encryptionCommand);
            } catch (err) {
                if (err.name === 'ServerSideEncryptionConfigurationNotFoundError') {
                    issues.push({
                        severity: 'HIGH',
                        issue: 'Server-side encryption not configured',
                        recommendation: 'Enable server-side encryption (SSE-S3 or SSE-KMS)'
                    });
                    findings.summary.high++;
                }
            }

            // Tag the bucket
            if (issues.length > 0) {
                await tagResource('s3', bucketName, timestamp);
            }

            if (issues.length > 0) {
                findings.s3.push({
                    bucketName,
                    issues
                });
            }
        } catch (err) {
            console.error(\`Error scanning bucket \${bucketName}:\`, err.message);
        }
    }
}

async function checkFlowLogs(findings) {
    // Get all VPCs
    const vpcsCommand = new DescribeVpcsCommand({});
    const vpcsResponse = await ec2Client.send(vpcsCommand);

    for (const vpc of vpcsResponse.Vpcs || []) {
        const vpcId = vpc.VpcId;

        // Check flow logs for this VPC
        const flowLogsCommand = new DescribeFlowLogsCommand({
            Filter: [
                {
                    Name: 'resource-id',
                    Values: [vpcId]
                }
            ]
        });
        const flowLogsResponse = await ec2Client.send(flowLogsCommand);

        if (!flowLogsResponse.FlowLogs || flowLogsResponse.FlowLogs.length === 0) {
            findings.flowLogs.push({
                vpcId,
                issues: [{
                    severity: 'HIGH',
                    issue: 'VPC Flow Logs not enabled',
                    recommendation: 'Enable VPC Flow Logs with CloudWatch Logs destination'
                }]
            });
            findings.summary.high++;
        } else {
            // Check each flow log
            for (const flowLog of flowLogsResponse.FlowLogs) {
                if (flowLog.LogDestinationType === 'cloud-watch-logs' && flowLog.LogGroupName) {
                    // Check log group retention
                    try {
                        const logGroupCommand = new DescribeLogGroupsCommand({
                            logGroupNamePrefix: flowLog.LogGroupName
                        });
                        const logGroupResponse = await logsClient.send(logGroupCommand);

                        if (logGroupResponse.logGroups && logGroupResponse.logGroups.length > 0) {
                            const logGroup = logGroupResponse.logGroups[0];
                            if (!logGroup.retentionInDays || logGroup.retentionInDays < 30) {
                                findings.flowLogs.push({
                                    vpcId,
                                    logGroupName: flowLog.LogGroupName,
                                    issues: [{
                                        severity: 'MEDIUM',
                                        issue: \`CloudWatch Logs retention is \${logGroup.retentionInDays || 'never expires'} (minimum 30 days required)\`,
                                        recommendation: 'Set log retention to at least 30 days'
                                    }]
                                });
                                findings.summary.medium++;
                            }

                            // Tag the log group
                            await tagResource('logs', flowLog.LogGroupName, timestamp);
                        }
                    } catch (err) {
                        console.error(\`Error checking log group \${flowLog.LogGroupName}:\`, err.message);
                    }
                }
            }
        }
    }
}

async function tagResource(resourceType, resourceId, timestamp) {
    const tag = {
        Key: 'last-compliance-check',
        Value: timestamp
    };

    try {
        switch (resourceType) {
            case 'ec2':
                await ec2Client.send(new CreateTagsCommand({
                    Resources: [resourceId],
                    Tags: [tag]
                }));
                break;
            case 'rds':
                await rdsClient.send(new AddTagsToResourceCommand({
                    ResourceName: resourceId,
                    Tags: [tag]
                }));
                break;
            case 's3':
                try {
                    const getTagsCommand = new GetBucketTaggingCommand({ Bucket: resourceId });
                    const existingTags = await s3Client.send(getTagsCommand);
                    const tags = existingTags.TagSet || [];
                    const filteredTags = tags.filter(t => t.Key !== 'last-compliance-check');
                    filteredTags.push(tag);

                    await s3Client.send(new PutBucketTaggingCommand({
                        Bucket: resourceId,
                        Tagging: { TagSet: filteredTags }
                    }));
                } catch (err) {
                    if (err.name === 'NoSuchTagSet') {
                        await s3Client.send(new PutBucketTaggingCommand({
                            Bucket: resourceId,
                            Tagging: { TagSet: [tag] }
                        }));
                    } else {
                        throw err;
                    }
                }
                break;
            case 'logs':
                await logsClient.send(new TagLogGroupCommand({
                    logGroupName: resourceId,
                    tags: { 'last-compliance-check': timestamp }
                }));
                break;
        }
    } catch (err) {
        console.error(\`Error tagging \${resourceType} resource \${resourceId}:\`, err.message);
    }
}

async function saveComplianceReport(findings) {
    const timestamp = findings.timestamp;
    const reportKey = \`compliance-reports/\${timestamp}.json\`;

    const command = new PutObjectCommand({
        Bucket: reportBucket,
        Key: reportKey,
        Body: JSON.stringify(findings, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256'
    });

    await s3Client.send(command);
}

async function publishMetrics(findings) {
    const timestamp = new Date();

    const metricData = [
        {
            MetricName: 'CriticalFindings',
            Value: findings.summary.critical,
            Unit: 'Count',
            Timestamp: timestamp
        },
        {
            MetricName: 'HighFindings',
            Value: findings.summary.high,
            Unit: 'Count',
            Timestamp: timestamp
        },
        {
            MetricName: 'MediumFindings',
            Value: findings.summary.medium,
            Unit: 'Count',
            Timestamp: timestamp
        },
        {
            MetricName: 'LowFindings',
            Value: findings.summary.low,
            Unit: 'Count',
            Timestamp: timestamp
        }
    ];

    const command = new PutMetricDataCommand({
        Namespace: \`ComplianceScanner/\${environmentSuffix}\`,
        MetricData: metricData
    });

    await cloudwatchClient.send(command);
}
        `),
    }),
    environment: {
      variables: {
        REPORT_BUCKET: complianceReportBucket.bucket,
        ENVIRONMENT_SUFFIX: environmentSuffix,
        AWS_REGION: awsRegion,
      },
    },
    tags: {
      Name: `compliance-scanner-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  },
  {
    dependsOn: [lambdaLogGroup, lambdaPolicyAttachment, complianceReportBucket],
  }
);

// EventBridge Rule to trigger Lambda daily
const complianceScanRule = new aws.cloudwatch.EventRule(
  `compliance-scan-schedule-${environmentSuffix}`,
  {
    name: `compliance-scan-schedule-${environmentSuffix}`,
    description: 'Trigger compliance scan daily',
    scheduleExpression: 'rate(1 day)',
    tags: {
      Name: `compliance-scan-schedule-${environmentSuffix}`,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
    },
  }
);

// Lambda permission for EventBridge
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lambdaEventBridgePermission = new aws.lambda.Permission(
  `compliance-scanner-eventbridge-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: complianceScannerLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: complianceScanRule.arn,
  }
);

// EventBridge Target
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const complianceScanTarget = new aws.cloudwatch.EventTarget(
  `compliance-scan-target-${environmentSuffix}`,
  {
    rule: complianceScanRule.name,
    arn: complianceScannerLambda.arn,
  }
);

// CloudWatch Dashboard
const complianceDashboard = new aws.cloudwatch.Dashboard(
  `compliance-dashboard-${environmentSuffix}`,
  {
    dashboardName: `compliance-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi.interpolate`{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        [ "ComplianceScanner/${environmentSuffix}", "CriticalFindings", { "stat": "Maximum", "color": "#d62728" } ],
                        [ ".", "HighFindings", { "stat": "Maximum", "color": "#ff7f0e" } ],
                        [ ".", "MediumFindings", { "stat": "Maximum", "color": "#ffbb78" } ],
                        [ ".", "LowFindings", { "stat": "Maximum", "color": "#98df8a" } ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${awsRegion}",
                    "title": "Compliance Findings by Severity",
                    "period": 300,
                    "yAxis": {
                        "left": {
                            "min": 0
                        }
                    }
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        [ "ComplianceScanner/${environmentSuffix}", "CriticalFindings", { "stat": "Maximum" } ],
                        [ ".", "HighFindings", { "stat": "Maximum" } ],
                        [ ".", "MediumFindings", { "stat": "Maximum" } ],
                        [ ".", "LowFindings", { "stat": "Maximum" } ]
                    ],
                    "view": "singleValue",
                    "region": "${awsRegion}",
                    "title": "Current Compliance Status",
                    "period": 300
                }
            },
            {
                "type": "log",
                "properties": {
                    "query": "SOURCE '/aws/lambda/compliance-scanner-${environmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                    "region": "${awsRegion}",
                    "title": "Recent Compliance Scan Logs",
                    "stacked": false
                }
            }
        ]
    }`,
  }
);

// Exports
export const complianceReportBucketName = complianceReportBucket.bucket;
export const complianceScannerLambdaName = complianceScannerLambda.name;
export const complianceScannerLambdaArn = complianceScannerLambda.arn;
export const complianceDashboardUrl = pulumi.interpolate`https://${awsRegion}.console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${complianceDashboard.dashboardName}`;
export const lambdaLogGroupName = lambdaLogGroup.name;

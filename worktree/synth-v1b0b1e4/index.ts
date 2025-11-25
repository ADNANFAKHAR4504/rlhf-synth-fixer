import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const scanRegions = ["us-east-1", "eu-west-1", "ap-southeast-1"];
const primaryRegion = "us-east-1";

// Resource tags
const tags = {
    Environment: config.get("environment") || "production",
    Owner: "security-team",
    CostCenter: "security-operations",
    Compliance: "soc2-audit",
    Application: "compliance-scanner"
};

// KMS Key for encryption
const kmsKey = new aws.kms.Key(`compliance-kms-${environmentSuffix}`, {
    description: "KMS key for compliance scanner encryption",
    enableKeyRotation: true,
    tags: tags
});

const kmsKeyAlias = new aws.kms.Alias(`compliance-kms-alias-${environmentSuffix}`, {
    name: `alias/compliance-scanner-${environmentSuffix}`,
    targetKeyId: kmsKey.id
});

// S3 Bucket for Access Logs
const accessLogsBucket = new aws.s3.Bucket(`compliance-access-logs-${environmentSuffix}`, {
    bucket: `compliance-scanner-access-logs-${environmentSuffix}`,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256"
            }
        }
    },
    lifecycleRules: [{
        enabled: true,
        expiration: {
            days: 90
        }
    }],
    tags: tags
});

// Block all public access for access logs bucket
const accessLogsPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `compliance-access-logs-public-block-${environmentSuffix}`,
    {
        bucket: accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
    }
);

// S3 Bucket for Compliance Reports with advanced features
const complianceReportsBucket = new aws.s3.Bucket(`compliance-reports-${environmentSuffix}`, {
    bucket: `compliance-reports-${environmentSuffix}`,
    versioning: {
        enabled: true
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKey.arn
            },
            bucketKeyEnabled: true
        }
    },
    loggings: [{
        targetBucket: accessLogsBucket.id,
        targetPrefix: "access-logs/"
    }],
    lifecycleRules: [
        {
            id: "transition-to-ia",
            enabled: true,
            transitions: [
                {
                    days: 30,
                    storageClass: "STANDARD_IA"
                },
                {
                    days: 90,
                    storageClass: "INTELLIGENT_TIERING"
                },
                {
                    days: 365,
                    storageClass: "DEEP_ARCHIVE"
                }
            ]
        },
        {
            id: "delete-old-versions",
            enabled: true,
            noncurrentVersionTransitions: [{
                days: 30,
                storageClass: "GLACIER"
            }],
            noncurrentVersionExpiration: {
                days: 90
            }
        },
        {
            id: "expire-incomplete-multipart-uploads",
            enabled: true,
            expiration: {
                days: 7
            }
        }
    ],
    tags: tags
});

// S3 Intelligent-Tiering Configuration
const intelligentTieringConfig = new aws.s3.BucketIntelligentTieringConfiguration(
    `compliance-reports-tiering-${environmentSuffix}`,
    {
        bucket: complianceReportsBucket.id,
        name: "compliance-reports-tiering",
        status: "Enabled",
        tierings: [
            {
                accessTier: "ARCHIVE_ACCESS",
                days: 90
            },
            {
                accessTier: "DEEP_ARCHIVE_ACCESS",
                days: 180
            }
        ]
    }
);

// Block all public access for reports bucket
const reportsPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `compliance-reports-public-block-${environmentSuffix}`,
    {
        bucket: complianceReportsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
    }
);

// DynamoDB Table for Scan History
const scanHistoryTable = new aws.dynamodb.Table(`compliance-scan-history-${environmentSuffix}`, {
    name: `compliance-scan-history-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "scanId",
    rangeKey: "timestamp",
    attributes: [
        { name: "scanId", type: "S" },
        { name: "timestamp", type: "N" },
        { name: "region", type: "S" }
    ],
    globalSecondaryIndexes: [{
        name: "region-timestamp-index",
        hashKey: "region",
        rangeKey: "timestamp",
        projectionType: "ALL"
    }],
    pointInTimeRecovery: {
        enabled: true
    },
    serverSideEncryption: {
        enabled: true
    },
    tags: tags
});

// SSM Parameters for Configuration Management
const regionsParameter = new aws.ssm.Parameter(`compliance-config-regions-${environmentSuffix}`, {
    name: `/compliance/scanner/config/regions`,
    type: "String",
    value: JSON.stringify(scanRegions),
    description: "Regions to scan for compliance violations",
    tags: tags
});

const thresholdsParameter = new aws.ssm.Parameter(`compliance-config-thresholds-${environmentSuffix}`, {
    name: `/compliance/scanner/config/thresholds`,
    type: "StringList",
    value: "critical_violation_threshold=5,high_violation_threshold=10,medium_violation_threshold=20",
    description: "Compliance thresholds for alerting",
    tags: tags
});

const remediationEnabledParameter = new aws.ssm.Parameter(`compliance-config-remediation-${environmentSuffix}`, {
    name: `/compliance/scanner/config/remediation-enabled`,
    type: "String",
    value: "true",
    description: "Enable/disable automatic remediation",
    tags: tags
});

const scanResourcesParameter = new aws.ssm.Parameter(`compliance-config-scan-resources-${environmentSuffix}`, {
    name: `/compliance/scanner/config/scan-resources`,
    type: "String",
    value: JSON.stringify({ s3: true, rds: true, ec2: true, lambda: true, dynamodb: true }),
    description: "Resources to include in compliance scans",
    tags: tags
});

// SNS Topics for Alerting
const criticalAlertTopic = new aws.sns.Topic(`compliance-critical-alerts-${environmentSuffix}`, {
    name: `compliance-critical-alerts-${environmentSuffix}`,
    kmsMasterKeyId: kmsKey.id,
    tags: tags
});

const highAlertTopic = new aws.sns.Topic(`compliance-high-alerts-${environmentSuffix}`, {
    name: `compliance-high-alerts-${environmentSuffix}`,
    kmsMasterKeyId: kmsKey.id,
    tags: tags
});

const scannerErrorTopic = new aws.sns.Topic(`compliance-scanner-errors-${environmentSuffix}`, {
    name: `compliance-scanner-errors-${environmentSuffix}`,
    kmsMasterKeyId: kmsKey.id,
    tags: tags
});

// Dead Letter Queue for SNS
const snsDLQ = new aws.sqs.Queue(`compliance-sns-dlq-${environmentSuffix}`, {
    name: `compliance-sns-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: tags
});

// IAM Role for Lambda Functions
const lambdaRole = new aws.iam.Role(`compliance-lambda-role-${environmentSuffix}`, {
    name: `compliance-lambda-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    }),
    tags: tags
});

// Lambda IAM Policy
const lambdaPolicy = new aws.iam.RolePolicy(`compliance-lambda-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([
        scanHistoryTable.arn,
        complianceReportsBucket.arn,
        kmsKey.arn,
        criticalAlertTopic.arn,
        highAlertTopic.arn
    ]).apply(([tableArn, bucketArn, keyArn, criticalTopicArn, highTopicArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                Resource: "arn:aws:logs:*:*:*"
            },
            {
                Effect: "Allow",
                Action: [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem"
                ],
                Resource: [tableArn, `${tableArn}/index/*`]
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:GetBucketEncryption",
                    "s3:GetBucketPublicAccessBlock",
                    "s3:PutBucketEncryption"
                ],
                Resource: [bucketArn, `${bucketArn}/*`]
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                ],
                Resource: keyArn
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish"
                ],
                Resource: [criticalTopicArn, highTopicArn]
            },
            {
                Effect: "Allow",
                Action: [
                    "config:DescribeConfigRules",
                    "config:GetComplianceDetailsByConfigRule"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "ec2:DescribeSecurityGroups",
                    "ec2:RevokeSecurityGroupIngress"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:DescribeTable"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "lambda:GetFunction"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "logs:DescribeLogGroups"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                Resource: "arn:aws:ssm:*:*:parameter/compliance/scanner/*"
            },
            {
                Effect: "Allow",
                Action: [
                    "ssm:StartAutomationExecution",
                    "ssm:GetAutomationExecution"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "securityhub:BatchImportFindings",
                    "securityhub:BatchUpdateFindings",
                    "securityhub:GetFindings"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudwatch:PutMetricData"
                ],
                Resource: "*",
                Condition: {
                    StringEquals: {
                        "cloudwatch:namespace": "ComplianceScanner"
                    }
                }
            }
        ]
    }))
});

// Lambda Layer for Shared Utilities
const utilsLayerCode = `
const AWS = require('aws-sdk');

// SSM Parameter Cache
const parameterCache = {};
const CACHE_TTL = 300000; // 5 minutes

async function getParameter(name) {
    const now = Date.now();
    if (parameterCache[name] && (now - parameterCache[name].timestamp) < CACHE_TTL) {
        return parameterCache[name].value;
    }

    const ssm = new AWS.SSM();
    const result = await ssm.getParameter({ Name: name }).promise();
    parameterCache[name] = {
        value: result.Parameter.Value,
        timestamp: now
    };
    return result.Parameter.Value;
}

async function getConfiguration() {
    const regions = JSON.parse(await getParameter('/compliance/scanner/config/regions'));
    const thresholds = await getParameter('/compliance/scanner/config/thresholds');
    const remediationEnabled = await getParameter('/compliance/scanner/config/remediation-enabled');
    const scanResources = JSON.parse(await getParameter('/compliance/scanner/config/scan-resources'));

    // Parse thresholds
    const thresholdMap = {};
    thresholds.split(',').forEach(item => {
        const [key, value] = item.split('=');
        thresholdMap[key] = parseInt(value);
    });

    return {
        regions,
        thresholds: thresholdMap,
        remediationEnabled: remediationEnabled === 'true',
        scanResources
    };
}

// Violation severity mapping
function getSeverity(violationType) {
    const criticalViolations = [
        'MISSING_ENCRYPTION',
        'PUBLIC_DATABASE',
        'UNRESTRICTED_ACCESS'
    ];

    if (criticalViolations.includes(violationType)) {
        return 'CRITICAL';
    }
    return 'HIGH';
}

// Generate scan ID
function generateScanId() {
    return \`scan-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
}

module.exports = {
    getParameter,
    getConfiguration,
    getSeverity,
    generateScanId
};
`;

// Create layer directory and write utilities
const layerDir = "/tmp/lambda-layer";
const utilsLayer = new aws.lambda.LayerVersion(`compliance-utils-layer-${environmentSuffix}`, {
    layerName: `compliance-analysis-utils-${environmentSuffix}`,
    compatibleRuntimes: ["nodejs18.x"],
    code: new pulumi.asset.AssetArchive({
        "nodejs": new pulumi.asset.StringAsset(utilsLayerCode)
    }),
    description: "Common utilities for compliance scanner"
});

// Scanner Lambda Function
const scannerLambdaCode = `
const AWS = require('aws-sdk');
const utils = require('/opt/nodejs');

exports.handler = async (event) => {
    console.log('Scanner Lambda invoked', JSON.stringify(event));

    const config = await utils.getConfiguration();
    const region = event.region || 'us-east-1';
    const service = event.service || 's3';

    AWS.config.update({ region });

    const violations = [];
    const scanId = event.scanId || utils.generateScanId();
    const timestamp = Date.now();

    try {
        if (config.scanResources.s3) {
            const s3 = new AWS.S3();
            const buckets = await s3.listBuckets().promise();

            for (const bucket of buckets.Buckets) {
                try {
                    const encryption = await s3.getBucketEncryption({
                        Bucket: bucket.Name
                    }).promise();
                } catch (err) {
                    if (err.code === 'ServerSideEncryptionConfigurationNotFoundError') {
                        violations.push({
                            resource_id: \`arn:aws:s3:::\${bucket.Name}\`,
                            resource_type: 'S3_BUCKET',
                            violation_type: 'MISSING_ENCRYPTION',
                            severity: 'CRITICAL',
                            description: 'S3 bucket does not have encryption enabled',
                            remediation: 'Enable server-side encryption using AWS KMS',
                            timestamp
                        });
                    }
                }
            }
        }

        if (config.scanResources.rds) {
            const rds = new AWS.RDS();
            const instances = await rds.describeDBInstances().promise();

            for (const instance of instances.DBInstances) {
                if (instance.PubliclyAccessible) {
                    violations.push({
                        resource_id: instance.DBInstanceArn,
                        resource_type: 'RDS_INSTANCE',
                        violation_type: 'PUBLIC_DATABASE',
                        severity: 'CRITICAL',
                        description: 'RDS instance is publicly accessible',
                        remediation: 'Modify instance to disable public access',
                        timestamp
                    });
                }
            }
        }

        if (config.scanResources.ec2) {
            const ec2 = new AWS.EC2();
            const securityGroups = await ec2.describeSecurityGroups().promise();

            for (const sg of securityGroups.SecurityGroups) {
                for (const rule of sg.IpPermissions) {
                    const hasUnrestrictedAccess = rule.IpRanges.some(
                        range => range.CidrIp === '0.0.0.0/0'
                    );

                    if (hasUnrestrictedAccess && (rule.FromPort === 22 || rule.FromPort === 3389)) {
                        violations.push({
                            resource_id: \`arn:aws:ec2:\${region}:*:security-group/\${sg.GroupId}\`,
                            resource_type: 'SECURITY_GROUP',
                            violation_type: 'UNRESTRICTED_ACCESS',
                            severity: 'CRITICAL',
                            description: \`Security group allows unrestricted access on port \${rule.FromPort}\`,
                            remediation: 'Restrict ingress rules to specific IP ranges',
                            timestamp
                        });
                    }
                }
            }
        }

        // Put custom metrics
        const cloudwatch = new AWS.CloudWatch();
        await cloudwatch.putMetricData({
            Namespace: 'ComplianceScanner',
            MetricData: [
                {
                    MetricName: 'ViolationCount',
                    Value: violations.length,
                    Unit: 'Count',
                    Dimensions: [
                        { Name: 'Region', Value: region },
                        { Name: 'Service', Value: service }
                    ]
                },
                {
                    MetricName: 'ScanDuration',
                    Value: (Date.now() - timestamp) / 1000,
                    Unit: 'Seconds',
                    Dimensions: [
                        { Name: 'Region', Value: region }
                    ]
                }
            ]
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                scanId,
                region,
                service,
                violationCount: violations.length,
                violations,
                timestamp
            })
        };
    } catch (error) {
        console.error('Scanner error:', error);

        // Put error metric
        const cloudwatch = new AWS.CloudWatch();
        await cloudwatch.putMetricData({
            Namespace: 'ComplianceScanner',
            MetricData: [{
                MetricName: 'ScanErrors',
                Value: 1,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'Region', Value: region },
                    { Name: 'ErrorType', Value: error.code || 'Unknown' }
                ]
            }]
        }).promise();

        throw error;
    }
};
`;

const scannerLambda = new aws.lambda.Function(`compliance-scanner-${environmentSuffix}`, {
    name: `compliance-scanner-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 1024,
    layers: [utilsLayer.arn],
    tracingConfig: {
        mode: "Active"
    },
    environment: {
        variables: {
            SCAN_HISTORY_TABLE: scanHistoryTable.name,
            REPORTS_BUCKET: complianceReportsBucket.id,
            ENVIRONMENT_SUFFIX: environmentSuffix
        }
    },
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(scannerLambdaCode)
    }),
    tags: tags
});

// Scanner Lambda Log Group
const scannerLogGroup = new aws.cloudwatch.LogGroup(`compliance-scanner-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${scannerLambda.name}`,
    retentionInDays: 30,
    tags: tags
});

// Analyzer Lambda Function
const analyzerLambdaCode = `
const AWS = require('aws-sdk');
const utils = require('/opt/nodejs');

exports.handler = async (event) => {
    console.log('Analyzer Lambda invoked', JSON.stringify(event));

    const s3 = new AWS.S3();
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const config = await utils.getConfiguration();

    // Get S3 object from event
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    try {
        // Read compliance report from S3
        const s3Object = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();

        const report = JSON.parse(s3Object.Body.toString());

        // Categorize violations by severity
        const analysis = {
            scanId: report.scanId,
            timestamp: report.timestamp,
            region: report.region,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            criticalViolations: [],
            highViolations: []
        };

        report.violations.forEach(violation => {
            const severity = violation.severity;
            if (severity === 'CRITICAL') {
                analysis.criticalCount++;
                analysis.criticalViolations.push(violation);
            } else if (severity === 'HIGH') {
                analysis.highCount++;
                analysis.highViolations.push(violation);
            } else if (severity === 'MEDIUM') {
                analysis.mediumCount++;
            } else {
                analysis.lowCount++;
            }
        });

        // Update DynamoDB with analysis
        await dynamodb.put({
            TableName: process.env.SCAN_HISTORY_TABLE,
            Item: {
                scanId: report.scanId,
                timestamp: report.timestamp,
                region: report.region,
                violationCount: report.violations.length,
                criticalCount: analysis.criticalCount,
                highCount: analysis.highCount,
                mediumCount: analysis.mediumCount,
                status: 'COMPLETED',
                analysisComplete: true
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(analysis)
        };
    } catch (error) {
        console.error('Analyzer error:', error);
        throw error;
    }
};
`;

const analyzerLambda = new aws.lambda.Function(`compliance-analyzer-${environmentSuffix}`, {
    name: `compliance-analyzer-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 120,
    memorySize: 512,
    layers: [utilsLayer.arn],
    tracingConfig: {
        mode: "Active"
    },
    environment: {
        variables: {
            SCAN_HISTORY_TABLE: scanHistoryTable.name,
            CRITICAL_ALERT_TOPIC: criticalAlertTopic.arn,
            HIGH_ALERT_TOPIC: highAlertTopic.arn
        }
    },
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(analyzerLambdaCode)
    }),
    tags: tags
});

// Analyzer Lambda Log Group
const analyzerLogGroup = new aws.cloudwatch.LogGroup(`compliance-analyzer-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${analyzerLambda.name}`,
    retentionInDays: 30,
    tags: tags
});

// S3 Bucket Notification for Analyzer
const analyzerPermission = new aws.lambda.Permission(`compliance-analyzer-s3-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: analyzerLambda.arn,
    principal: "s3.amazonaws.com",
    sourceArn: complianceReportsBucket.arn
});

const bucketNotification = new aws.s3.BucketNotification(
    `compliance-reports-notification-${environmentSuffix}`,
    {
        bucket: complianceReportsBucket.id,
        lambdaFunctions: [{
            lambdaFunctionArn: analyzerLambda.arn,
            events: ["s3:ObjectCreated:*"],
            filterSuffix: ".json"
        }]
    },
    { dependsOn: [analyzerPermission] }
);

// Remediation Lambda Function
const remediationLambdaCode = `
const AWS = require('aws-sdk');
const utils = require('/opt/nodejs');

exports.handler = async (event) => {
    console.log('Remediation Lambda invoked', JSON.stringify(event));

    const config = await utils.getConfiguration();

    if (!config.remediationEnabled) {
        console.log('Remediation is disabled');
        return { statusCode: 200, body: 'Remediation disabled' };
    }

    const violations = JSON.parse(event.Records[0].Sns.Message).violations || [];
    const ssm = new AWS.SSM();
    const remediationResults = [];

    for (const violation of violations) {
        try {
            let documentName = '';
            let parameters = {};

            if (violation.violation_type === 'MISSING_ENCRYPTION' && violation.resource_type === 'S3_BUCKET') {
                documentName = 'RemediateUnencryptedS3Bucket-' + process.env.ENVIRONMENT_SUFFIX;
                const bucketName = violation.resource_id.split(':::')[1];
                parameters = {
                    BucketName: [bucketName],
                    KmsKeyId: [process.env.KMS_KEY_ID]
                };
            } else if (violation.violation_type === 'PUBLIC_DATABASE' && violation.resource_type === 'RDS_INSTANCE') {
                documentName = 'RemediatePublicRDSInstance-' + process.env.ENVIRONMENT_SUFFIX;
                const dbInstanceId = violation.resource_id.split(':db:')[1];
                parameters = {
                    DBInstanceIdentifier: [dbInstanceId]
                };
            } else if (violation.violation_type === 'UNRESTRICTED_ACCESS' && violation.resource_type === 'SECURITY_GROUP') {
                documentName = 'RemediateOverlyPermissiveSecurityGroup-' + process.env.ENVIRONMENT_SUFFIX;
                const sgId = violation.resource_id.split('/')[1];
                parameters = {
                    SecurityGroupId: [sgId]
                };
            }

            if (documentName) {
                const execution = await ssm.startAutomationExecution({
                    DocumentName: documentName,
                    Parameters: parameters
                }).promise();

                remediationResults.push({
                    violation: violation.resource_id,
                    executionId: execution.AutomationExecutionId,
                    status: 'STARTED'
                });

                console.log(\`Started remediation: \${execution.AutomationExecutionId}\`);
            }
        } catch (error) {
            console.error('Remediation error:', error);
            remediationResults.push({
                violation: violation.resource_id,
                error: error.message,
                status: 'FAILED'
            });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            remediationsStarted: remediationResults.length,
            results: remediationResults
        })
    };
};
`;

const remediationLambda = new aws.lambda.Function(`compliance-remediate-${environmentSuffix}`, {
    name: `compliance-auto-remediate-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 256,
    layers: [utilsLayer.arn],
    tracingConfig: {
        mode: "Active"
    },
    environment: {
        variables: {
            KMS_KEY_ID: kmsKey.id,
            ENVIRONMENT_SUFFIX: environmentSuffix
        }
    },
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(remediationLambdaCode)
    }),
    tags: tags
});

// Remediation Lambda Log Group
const remediationLogGroup = new aws.cloudwatch.LogGroup(`compliance-remediation-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${remediationLambda.name}`,
    retentionInDays: 30,
    tags: tags
});

// SNS Subscription for Remediation
const remediationSubscription = new aws.sns.TopicSubscription(
    `compliance-remediation-subscription-${environmentSuffix}`,
    {
        topic: criticalAlertTopic.arn,
        protocol: "lambda",
        endpoint: remediationLambda.arn
    }
);

const remediationSnsPermission = new aws.lambda.Permission(
    `compliance-remediation-sns-permission-${environmentSuffix}`,
    {
        action: "lambda:InvokeFunction",
        function: remediationLambda.arn,
        principal: "sns.amazonaws.com",
        sourceArn: criticalAlertTopic.arn
    }
);

// Security Hub Publisher Lambda
const securityHubLambdaCode = `
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Security Hub Publisher invoked', JSON.stringify(event));

    const s3 = new AWS.S3();
    const securityHub = new AWS.SecurityHub();

    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    try {
        const s3Object = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();

        const report = JSON.parse(s3Object.Body.toString());
        const accountId = await getAccountId();
        const findings = [];

        for (const violation of report.violations) {
            const finding = {
                SchemaVersion: "2018-10-08",
                Id: \`\${report.scanId}-\${violation.resource_id}\`,
                ProductArn: \`arn:aws:securityhub:\${report.region}:\${accountId}:product/\${accountId}/default\`,
                ProductName: "Compliance Scanner",
                CompanyName: "Financial Services Inc",
                GeneratorId: process.env.SCANNER_LAMBDA_ARN,
                AwsAccountId: accountId,
                Types: ["Software and Configuration Checks/AWS Security Best Practices"],
                FirstObservedAt: new Date(violation.timestamp).toISOString(),
                LastObservedAt: new Date(violation.timestamp).toISOString(),
                CreatedAt: new Date(violation.timestamp).toISOString(),
                UpdatedAt: new Date().toISOString(),
                Severity: {
                    Label: violation.severity,
                    Normalized: getSeverityScore(violation.severity)
                },
                Confidence: 95,
                Criticality: 80,
                Title: getViolationTitle(violation),
                Description: violation.description,
                Remediation: {
                    Recommendation: {
                        Text: violation.remediation,
                        Url: "https://docs.aws.amazon.com/"
                    }
                },
                ProductFields: {
                    ScanId: report.scanId,
                    Region: report.region,
                    ResourceType: violation.resource_type
                },
                Resources: [{
                    Type: getResourceType(violation.resource_type),
                    Id: violation.resource_id,
                    Partition: "aws",
                    Region: report.region
                }],
                Compliance: {
                    Status: "FAILED",
                    RelatedRequirements: getComplianceRequirements(violation.violation_type)
                },
                RecordState: "ACTIVE",
                Workflow: {
                    Status: "NEW"
                }
            };

            findings.push(finding);
        }

        // Batch import findings (max 100 per batch)
        for (let i = 0; i < findings.length; i += 100) {
            const batch = findings.slice(i, i + 100);
            await securityHub.batchImportFindings({
                Findings: batch
            }).promise();
        }

        console.log(\`Published \${findings.length} findings to Security Hub\`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                findingsPublished: findings.length
            })
        };
    } catch (error) {
        console.error('Security Hub publisher error:', error);
        throw error;
    }
};

async function getAccountId() {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    return identity.Account;
}

function getSeverityScore(severity) {
    const scores = {
        'CRITICAL': 90,
        'HIGH': 70,
        'MEDIUM': 50,
        'LOW': 30,
        'INFORMATIONAL': 0
    };
    return scores[severity] || 50;
}

function getViolationTitle(violation) {
    const titles = {
        'MISSING_ENCRYPTION': 'Resource Not Encrypted',
        'PUBLIC_DATABASE': 'Database Publicly Accessible',
        'UNRESTRICTED_ACCESS': 'Unrestricted Network Access'
    };
    return titles[violation.violation_type] || 'Security Violation Detected';
}

function getResourceType(resourceType) {
    const types = {
        'S3_BUCKET': 'AwsS3Bucket',
        'RDS_INSTANCE': 'AwsRdsDbInstance',
        'SECURITY_GROUP': 'AwsEc2SecurityGroup',
        'LAMBDA_FUNCTION': 'AwsLambdaFunction'
    };
    return types[resourceType] || 'AwsResource';
}

function getComplianceRequirements(violationType) {
    const requirements = {
        'MISSING_ENCRYPTION': [
            'PCI DSS v3.2.1/3.4',
            'CIS AWS v1.4.0/2.1.1',
            'NIST-800-53/SC-28'
        ],
        'PUBLIC_DATABASE': [
            'PCI DSS v3.2.1/1.2.1',
            'CIS AWS v1.4.0/2.3.1',
            'NIST-800-53/AC-4'
        ],
        'UNRESTRICTED_ACCESS': [
            'PCI DSS v3.2.1/1.3.1',
            'CIS AWS v1.4.0/5.1',
            'NIST-800-53/AC-3'
        ]
    };
    return requirements[violationType] || [];
}
`;

const securityHubLambda = new aws.lambda.Function(`compliance-security-hub-${environmentSuffix}`, {
    name: `security-hub-publisher-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 120,
    memorySize: 256,
    tracingConfig: {
        mode: "Active"
    },
    environment: {
        variables: {
            SCANNER_LAMBDA_ARN: scannerLambda.arn
        }
    },
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(securityHubLambdaCode)
    }),
    tags: tags
});

// Security Hub Lambda Log Group
const securityHubLogGroup = new aws.cloudwatch.LogGroup(`compliance-security-hub-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${securityHubLambda.name}`,
    retentionInDays: 30,
    tags: tags
});

// IAM Role for Step Functions
const stepFunctionsRole = new aws.iam.Role(`compliance-step-functions-role-${environmentSuffix}`, {
    name: `compliance-step-functions-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "states.amazonaws.com"
            }
        }]
    }),
    tags: tags
});

// Step Functions IAM Policy
const stepFunctionsPolicy = new aws.iam.RolePolicy(`compliance-step-functions-policy-${environmentSuffix}`, {
    role: stepFunctionsRole.id,
    policy: pulumi.all([
        scannerLambda.arn,
        analyzerLambda.arn,
        remediationLambda.arn,
        criticalAlertTopic.arn,
        scannerErrorTopic.arn,
        complianceReportsBucket.arn
    ]).apply(([scannerArn, analyzerArn, remediationArn, criticalArn, errorArn, bucketArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "lambda:InvokeFunction"
                ],
                Resource: [scannerArn, analyzerArn, remediationArn]
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish"
                ],
                Resource: [criticalArn, errorArn]
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:PutObject"
                ],
                Resource: `${bucketArn}/*`
            },
            {
                Effect: "Allow",
                Action: [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                Resource: "*"
            }
        ]
    }))
});

// Step Functions State Machine
const stateMachineDefinition = pulumi.all([
    scannerLambda.arn,
    analyzerLambda.arn,
    remediationLambda.arn,
    criticalAlertTopic.arn,
    highAlertTopic.arn,
    scannerErrorTopic.arn,
    complianceReportsBucket.id
]).apply(([
    scannerArn,
    analyzerArn,
    remediationArn,
    criticalArn,
    highArn,
    errorArn,
    bucketId
]) => JSON.stringify({
    Comment: "Multi-region compliance scanning workflow with parallel execution",
    StartAt: "ReadConfiguration",
    States: {
        ReadConfiguration: {
            Type: "Pass",
            Result: {
                regions: scanRegions,
                services: ["s3", "rds", "ec2", "lambda", "dynamodb"]
            },
            ResultPath: "$.config",
            Next: "ParallelRegionScan"
        },
        ParallelRegionScan: {
            Type: "Parallel",
            ResultPath: "$.scanResults",
            Next: "AggregateResults",
            Branches: [
                {
                    StartAt: "ScanUsEast1",
                    States: {
                        ScanUsEast1: {
                            Type: "Map",
                            ItemsPath: "$.config.services",
                            ResultPath: "$.usEast1Results",
                            MaxConcurrency: 5,
                            Iterator: {
                                StartAt: "ScanService",
                                States: {
                                    ScanService: {
                                        Type: "Task",
                                        Resource: scannerArn,
                                        Parameters: {
                                            "region": "us-east-1",
                                            "service.$": "$",
                                            "scanId.$": "$.scanId"
                                        },
                                        End: true,
                                        Retry: [{
                                            ErrorEquals: ["States.TaskFailed"],
                                            IntervalSeconds: 5,
                                            MaxAttempts: 3,
                                            BackoffRate: 2.0
                                        }]
                                    }
                                }
                            },
                            End: true
                        }
                    }
                },
                {
                    StartAt: "ScanEuWest1",
                    States: {
                        ScanEuWest1: {
                            Type: "Map",
                            ItemsPath: "$.config.services",
                            ResultPath: "$.euWest1Results",
                            MaxConcurrency: 5,
                            Iterator: {
                                StartAt: "ScanService",
                                States: {
                                    ScanService: {
                                        Type: "Task",
                                        Resource: scannerArn,
                                        Parameters: {
                                            "region": "eu-west-1",
                                            "service.$": "$",
                                            "scanId.$": "$.scanId"
                                        },
                                        End: true,
                                        Retry: [{
                                            ErrorEquals: ["States.TaskFailed"],
                                            IntervalSeconds: 5,
                                            MaxAttempts: 3,
                                            BackoffRate: 2.0
                                        }]
                                    }
                                }
                            },
                            End: true
                        }
                    }
                },
                {
                    StartAt: "ScanApSoutheast1",
                    States: {
                        ScanApSoutheast1: {
                            Type: "Map",
                            ItemsPath: "$.config.services",
                            ResultPath: "$.apSoutheast1Results",
                            MaxConcurrency: 5,
                            Iterator: {
                                StartAt: "ScanService",
                                States: {
                                    ScanService: {
                                        Type: "Task",
                                        Resource: scannerArn,
                                        Parameters: {
                                            "region": "ap-southeast-1",
                                            "service.$": "$",
                                            "scanId.$": "$.scanId"
                                        },
                                        End: true,
                                        Retry: [{
                                            ErrorEquals: ["States.TaskFailed"],
                                            IntervalSeconds: 5,
                                            MaxAttempts: 3,
                                            BackoffRate: 2.0
                                        }]
                                    }
                                }
                            },
                            End: true
                        }
                    }
                }
            ],
            Catch: [{
                ErrorEquals: ["States.ALL"],
                ResultPath: "$.error",
                Next: "NotifyFailure"
            }]
        },
        AggregateResults: {
            Type: "Pass",
            Parameters: {
                "scanId.$": "$.scanId",
                "totalViolations.$": "States.ArrayLength($.scanResults)"
            },
            ResultPath: "$.aggregated",
            Next: "CheckViolationThreshold"
        },
        CheckViolationThreshold: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.aggregated.totalViolations",
                    NumericGreaterThan: 5,
                    Next: "TriggerCriticalAlert"
                },
                {
                    Variable: "$.aggregated.totalViolations",
                    NumericGreaterThan: 0,
                    Next: "TriggerHighAlert"
                }
            ],
            Default: "StoreCleanReport"
        },
        TriggerCriticalAlert: {
            Type: "Task",
            Resource: "arn:aws:states:::sns:publish",
            Parameters: {
                "TopicArn": criticalArn,
                "Message.$": "$.aggregated",
                "Subject": "Critical Compliance Violations Detected"
            },
            ResultPath: "$.alertSent",
            Next: "TriggerRemediation"
        },
        TriggerRemediation: {
            Type: "Task",
            Resource: remediationArn,
            Parameters: {
                "violations.$": "$.scanResults"
            },
            ResultPath: "$.remediation",
            Next: "CompleteScan",
            Catch: [{
                ErrorEquals: ["States.ALL"],
                ResultPath: "$.remediationError",
                Next: "CompleteScan"
            }]
        },
        TriggerHighAlert: {
            Type: "Task",
            Resource: "arn:aws:states:::sns:publish",
            Parameters: {
                "TopicArn": highArn,
                "Message.$": "$.aggregated",
                "Subject": "High Compliance Violations Detected"
            },
            ResultPath: "$.alertSent",
            Next: "CompleteScan"
        },
        StoreCleanReport: {
            Type: "Pass",
            Result: {
                status: "clean",
                message: "No violations found"
            },
            ResultPath: "$.report",
            Next: "CompleteScan"
        },
        CompleteScan: {
            Type: "Pass",
            Result: {
                status: "completed"
            },
            End: true
        },
        NotifyFailure: {
            Type: "Task",
            Resource: "arn:aws:states:::sns:publish",
            Parameters: {
                "TopicArn": errorArn,
                "Message": "Compliance scan workflow failed",
                "Subject": "Scan Failure Alert"
            },
            End: true
        }
    }
}));

const stateMachine = new aws.sfn.StateMachine(`compliance-scanner-workflow-${environmentSuffix}`, {
    name: `ComplianceScannerWorkflow-${environmentSuffix}`,
    roleArn: stepFunctionsRole.arn,
    definition: stateMachineDefinition,
    tracingConfiguration: {
        enabled: true
    },
    tags: tags
});

// EventBridge Rule for Scheduled Scans
const scheduledRule = new aws.cloudwatch.EventRule(`compliance-scanner-daily-${environmentSuffix}`, {
    name: `compliance-scanner-daily-${environmentSuffix}`,
    description: "Trigger daily compliance scans at 2 AM UTC",
    scheduleExpression: "cron(0 2 * * ? *)",
    tags: tags
});

const scheduledTarget = new aws.cloudwatch.EventTarget(`compliance-scanner-daily-target-${environmentSuffix}`, {
    rule: scheduledRule.name,
    arn: stateMachine.arn,
    roleArn: stepFunctionsRole.arn,
    input: JSON.stringify({
        scanType: "scheduled",
        scanId: `scheduled-${Date.now()}`
    })
});

// EventBridge Rule for On-Demand Scans
const onDemandRule = new aws.cloudwatch.EventRule(`compliance-scanner-ondemand-${environmentSuffix}`, {
    name: `compliance-scanner-ondemand-${environmentSuffix}`,
    description: "Trigger on-demand compliance scans",
    eventPattern: JSON.stringify({
        source: ["custom.compliance"],
        "detail-type": ["Scan Request"],
        detail: {
            scanType: ["manual"]
        }
    }),
    tags: tags
});

const onDemandTarget = new aws.cloudwatch.EventTarget(`compliance-scanner-ondemand-target-${environmentSuffix}`, {
    rule: onDemandRule.name,
    arn: stateMachine.arn,
    roleArn: stepFunctionsRole.arn
});

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
    dashboardName: `ComplianceScanner-${environmentSuffix}`,
    dashboardBody: pulumi.all([
        scannerLambda.name,
        analyzerLambda.name,
        remediationLambda.name
    ]).apply(([scannerName, analyzerName, remediationName]) => JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["ComplianceScanner", "ViolationCount", { stat: "Sum", label: "Total Violations" }]
                    ],
                    period: 300,
                    stat: "Sum",
                    region: primaryRegion,
                    title: "Violation Trends (30 days)",
                    yAxis: { left: { min: 0 } }
                }
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["ComplianceScanner", "ViolationCount", { dimensions: { Service: "s3" }, label: "S3" }],
                        ["...", { dimensions: { Service: "rds" }, label: "RDS" }],
                        ["...", { dimensions: { Service: "ec2" }, label: "EC2" }]
                    ],
                    period: 300,
                    stat: "Sum",
                    region: primaryRegion,
                    title: "Violations by Service"
                }
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/Lambda", "Duration", { dimensions: { FunctionName: scannerName }, stat: "Average" }],
                        ["...", { dimensions: { FunctionName: analyzerName }, stat: "Average" }]
                    ],
                    period: 300,
                    stat: "Average",
                    region: primaryRegion,
                    title: "Scanner Performance"
                }
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["ComplianceScanner", "ViolationCount", { dimensions: { Region: "us-east-1" }, label: "US East 1" }],
                        ["...", { dimensions: { Region: "eu-west-1" }, label: "EU West 1" }],
                        ["...", { dimensions: { Region: "ap-southeast-1" }, label: "AP Southeast 1" }]
                    ],
                    period: 300,
                    stat: "Sum",
                    region: primaryRegion,
                    title: "Regional Distribution"
                }
            }
        ]
    }))
});

// CloudWatch Alarms
const scannerErrorAlarm = new aws.cloudwatch.MetricAlarm(`compliance-scanner-error-alarm-${environmentSuffix}`, {
    name: `compliance-scanner-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 2,
    alarmDescription: "Alert when scanner Lambda has more than 2 errors in 5 minutes",
    alarmActions: [scannerErrorTopic.arn],
    dimensions: {
        FunctionName: scannerLambda.name
    },
    tags: tags
});

const analyzerErrorAlarm = new aws.cloudwatch.MetricAlarm(`compliance-analyzer-error-alarm-${environmentSuffix}`, {
    name: `compliance-analyzer-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 2,
    alarmDescription: "Alert when analyzer Lambda has more than 2 errors in 5 minutes",
    alarmActions: [scannerErrorTopic.arn],
    dimensions: {
        FunctionName: analyzerLambda.name
    },
    tags: tags
});

const scanDurationAlarm = new aws.cloudwatch.MetricAlarm(`compliance-scan-duration-alarm-${environmentSuffix}`, {
    name: `compliance-scan-duration-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "ScanDuration",
    namespace: "ComplianceScanner",
    period: 300,
    statistic: "Maximum",
    threshold: 240, // 4 minutes in seconds
    alarmDescription: "Alert when scan duration exceeds 4 minutes",
    alarmActions: [scannerErrorTopic.arn],
    tags: tags
});

// SSM Automation Documents
const s3EncryptionDocument = new aws.ssm.Document(`s3-encryption-remediation-${environmentSuffix}`, {
    name: `RemediateUnencryptedS3Bucket-${environmentSuffix}`,
    documentType: "Automation",
    documentFormat: "YAML",
    content: kmsKey.id.apply(keyId => `
schemaVersion: "0.3"
description: "Automatically enable encryption on unencrypted S3 bucket"
parameters:
  BucketName:
    type: String
    description: "Name of the S3 bucket to remediate"
  KmsKeyId:
    type: String
    description: "KMS key ID for bucket encryption"
    default: "${keyId}"
mainSteps:
  - name: EnableBucketEncryption
    action: aws:executeAwsApi
    inputs:
      Service: s3
      Api: PutBucketEncryption
      Bucket: "{{ BucketName }}"
      ServerSideEncryptionConfiguration:
        Rules:
          - ApplyServerSideEncryptionByDefault:
              SSEAlgorithm: "aws:kms"
              KMSMasterKeyID: "{{ KmsKeyId }}"
            BucketKeyEnabled: true
  - name: VerifyEncryption
    action: aws:executeAwsApi
    inputs:
      Service: s3
      Api: GetBucketEncryption
      Bucket: "{{ BucketName }}"
    outputs:
      - Name: EncryptionStatus
        Selector: "$.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm"
        Type: String
`),
    tags: tags
});

const rdsPublicAccessDocument = new aws.ssm.Document(`rds-public-access-remediation-${environmentSuffix}`, {
    name: `RemediatePublicRDSInstance-${environmentSuffix}`,
    documentType: "Automation",
    documentFormat: "YAML",
    content: `
schemaVersion: "0.3"
description: "Modify RDS instance to remove public accessibility"
parameters:
  DBInstanceIdentifier:
    type: String
    description: "RDS instance identifier"
mainSteps:
  - name: ModifyDBInstance
    action: aws:executeAwsApi
    inputs:
      Service: rds
      Api: ModifyDBInstance
      DBInstanceIdentifier: "{{ DBInstanceIdentifier }}"
      PubliclyAccessible: false
      ApplyImmediately: true
  - name: VerifyModification
    action: aws:executeAwsApi
    inputs:
      Service: rds
      Api: DescribeDBInstances
      DBInstanceIdentifier: "{{ DBInstanceIdentifier }}"
    outputs:
      - Name: PublicAccessStatus
        Selector: "$.DBInstances[0].PubliclyAccessible"
        Type: Boolean
`,
    tags: tags
});

const securityGroupDocument = new aws.ssm.Document(`security-group-remediation-${environmentSuffix}`, {
    name: `RemediateOverlyPermissiveSecurityGroup-${environmentSuffix}`,
    documentType: "Automation",
    documentFormat: "YAML",
    content: `
schemaVersion: "0.3"
description: "Revoke 0.0.0.0/0 ingress rules from security group"
parameters:
  SecurityGroupId:
    type: String
    description: "Security group ID to remediate"
  IpProtocol:
    type: String
    description: "IP protocol (tcp, udp, icmp)"
    default: "tcp"
  FromPort:
    type: Integer
    description: "Start port"
    default: 22
  ToPort:
    type: Integer
    description: "End port"
    default: 22
mainSteps:
  - name: RevokeUnrestrictedAccess
    action: aws:executeAwsApi
    inputs:
      Service: ec2
      Api: RevokeSecurityGroupIngress
      GroupId: "{{ SecurityGroupId }}"
      IpPermissions:
        - IpProtocol: "{{ IpProtocol }}"
          FromPort: "{{ FromPort }}"
          ToPort: "{{ ToPort }}"
          IpRanges:
            - CidrIp: "0.0.0.0/0"
  - name: VerifyRevocation
    action: aws:executeAwsApi
    inputs:
      Service: ec2
      Api: DescribeSecurityGroups
      GroupIds:
        - "{{ SecurityGroupId }}"
    outputs:
      - Name: IngressRules
        Selector: "$.SecurityGroups[0].IpPermissions"
        Type: MapList
`,
    tags: tags
});

// Exports
export const scannerLambdaArn = scannerLambda.arn;
export const analysisLambdaArn = analyzerLambda.arn;
export const remediationLambdaArn = remediationLambda.arn;
export const securityHubPublisherArn = securityHubLambda.arn;
export const scanHistoryTableName = scanHistoryTable.name;
export const complianceReportsBucketName = complianceReportsBucket.id;
export const accessLogsBucketName = accessLogsBucket.id;
export const criticalAlertTopicArn = criticalAlertTopic.arn;
export const highAlertTopicArn = highAlertTopic.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${primaryRegion}#dashboards:name=${dashboard.dashboardName}`;
export const stepFunctionArn = stateMachine.arn;
export const stepFunctionName = stateMachine.name;
export const parameterStorePrefix = "/compliance/scanner";
export const automationDocuments = [
    s3EncryptionDocument.name,
    rdsPublicAccessDocument.name,
    securityGroupDocument.name
];
export const kmsKeyId = kmsKey.id;
export const kmsKeyArn = kmsKey.arn;

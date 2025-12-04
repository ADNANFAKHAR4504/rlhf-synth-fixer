/**
 * AWS Compliance Monitoring System
 *
 * This Pulumi program creates a comprehensive compliance monitoring system
 * that periodically checks AWS resources for compliance violations.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Standard tags for all resources
const tags = {
  Environment: 'production',
  Project: 'compliance-monitoring',
  ManagedBy: 'pulumi',
};

// Create SNS topic for compliance violation alerts
const snsTopic = new aws.sns.Topic('compliance-violations', {
  displayName: 'Compliance Violations',
  tags,
});

// Create IAM role for Lambda function
const lambdaRole = new aws.iam.Role('compliance-lambda-role', {
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
  tags,
});

// Attach basic execution role for CloudWatch Logs
new aws.iam.RolePolicyAttachment('lambda-logs', {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

// Create custom policy for compliance checks
const compliancePolicy = new aws.iam.Policy('compliance-policy', {
  description: 'Policy for compliance monitoring Lambda function',
  policy: pulumi.all([snsTopic.arn]).apply(([snsArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetEncryptionConfiguration',
            's3:ListAllMyBuckets',
            's3:GetBucketEncryption',
          ],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['ec2:DescribeSecurityGroups', 'ec2:DescribeFlowLogs'],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['iam:GetAccountPasswordPolicy'],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['cloudtrail:DescribeTrails', 'cloudtrail:GetTrailStatus'],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['sns:Publish'],
          Resource: snsArn,
        },
      ],
    })
  ),
  tags,
});

new aws.iam.RolePolicyAttachment('compliance-policy-attach', {
  role: lambdaRole.name,
  policyArn: compliancePolicy.arn,
});

// Lambda function code using AWS SDK v3
const lambdaCode = `
const { S3Client, ListBucketsCommand, GetBucketEncryptionCommand } = require('@aws-sdk/client-s3');
const { EC2Client, DescribeSecurityGroupsCommand, DescribeFlowLogsCommand } = require('@aws-sdk/client-ec2');
const { IAMClient, GetAccountPasswordPolicyCommand } = require('@aws-sdk/client-iam');
const { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } = require('@aws-sdk/client-cloudtrail');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION || 'us-east-1';
const snsTopicArn = process.env.SNS_TOPIC_ARN;

const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const snsClient = new SNSClient({ region });

exports.handler = async (event) => {
    console.log('Starting compliance checks...');
    const violations = [];

    // Check 1: S3 Bucket Encryption
    try {
        const s3Violations = await checkS3Encryption();
        violations.push(...s3Violations);
        console.log(\`S3 encryption check completed: \${s3Violations.length} violations found\`);
    } catch (error) {
        console.error('Error checking S3 encryption:', error);
        violations.push({
            check: 'S3 Encryption',
            severity: 'error',
            message: \`Failed to check S3 encryption: \${error.message}\`,
        });
    }

    // Check 2: EC2 Security Groups
    try {
        const sgViolations = await checkSecurityGroups();
        violations.push(...sgViolations);
        console.log(\`Security group check completed: \${sgViolations.length} violations found\`);
    } catch (error) {
        console.error('Error checking security groups:', error);
        violations.push({
            check: 'Security Groups',
            severity: 'error',
            message: \`Failed to check security groups: \${error.message}\`,
        });
    }

    // Check 3: IAM Password Policy
    try {
        const iamViolations = await checkPasswordPolicy();
        violations.push(...iamViolations);
        console.log(\`IAM password policy check completed: \${iamViolations.length} violations found\`);
    } catch (error) {
        console.error('Error checking IAM password policy:', error);
        violations.push({
            check: 'IAM Password Policy',
            severity: 'error',
            message: \`Failed to check IAM password policy: \${error.message}\`,
        });
    }

    // Check 4: CloudTrail Logging
    try {
        const cloudTrailViolations = await checkCloudTrail();
        violations.push(...cloudTrailViolations);
        console.log(\`CloudTrail check completed: \${cloudTrailViolations.length} violations found\`);
    } catch (error) {
        console.error('Error checking CloudTrail:', error);
        violations.push({
            check: 'CloudTrail',
            severity: 'error',
            message: \`Failed to check CloudTrail: \${error.message}\`,
        });
    }

    // Check 5: VPC Flow Logs
    try {
        const vpcViolations = await checkVPCFlowLogs();
        violations.push(...vpcViolations);
        console.log(\`VPC Flow Logs check completed: \${vpcViolations.length} violations found\`);
    } catch (error) {
        console.error('Error checking VPC Flow Logs:', error);
        violations.push({
            check: 'VPC Flow Logs',
            severity: 'error',
            message: \`Failed to check VPC Flow Logs: \${error.message}\`,
        });
    }

    // Send violations to SNS if any found
    if (violations.length > 0) {
        try {
            await sendViolations(violations);
            console.log('Violations sent to SNS successfully');
        } catch (error) {
            console.error('Error sending violations to SNS:', error);
        }
    }

    const result = {
        statusCode: 200,
        body: JSON.stringify({
            checksPerformed: 5,
            violationsFound: violations.length,
            violations: violations,
        }),
    };

    console.log('Compliance checks completed:', result.body);
    return result;
};

async function checkS3Encryption() {
    const violations = [];

    try {
        const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
        const buckets = listBucketsResponse.Buckets || [];

        for (const bucket of buckets) {
            try {
                await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucket.Name }));
            } catch (error) {
                if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
                    violations.push({
                        check: 'S3 Encryption',
                        severity: 'high',
                        resource: bucket.Name,
                        message: \`Bucket \${bucket.Name} does not have encryption enabled\`,
                    });
                }
            }
        }
    } catch (error) {
        throw new Error(\`Failed to list S3 buckets: \${error.message}\`);
    }

    return violations;
}

async function checkSecurityGroups() {
    const violations = [];

    try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
        const securityGroups = response.SecurityGroups || [];

        for (const sg of securityGroups) {
            const ingressRules = sg.IpPermissions || [];

            for (const rule of ingressRules) {
                const ipRanges = rule.IpRanges || [];
                for (const ipRange of ipRanges) {
                    if (ipRange.CidrIp === '0.0.0.0/0') {
                        violations.push({
                            check: 'Security Groups',
                            severity: 'critical',
                            resource: sg.GroupId,
                            message: \`Security group \${sg.GroupId} (\${sg.GroupName}) has overly permissive rule allowing 0.0.0.0/0\`,
                        });
                    }
                }
            }
        }
    } catch (error) {
        throw new Error(\`Failed to describe security groups: \${error.message}\`);
    }

    return violations;
}

async function checkPasswordPolicy() {
    const violations = [];

    try {
        const response = await iamClient.send(new GetAccountPasswordPolicyCommand({}));
        const policy = response.PasswordPolicy;

        if (!policy) {
            violations.push({
                check: 'IAM Password Policy',
                severity: 'critical',
                message: 'No password policy is configured for the AWS account',
            });
        } else {
            if (!policy.RequireUppercaseCharacters) {
                violations.push({
                    check: 'IAM Password Policy',
                    severity: 'medium',
                    message: 'Password policy does not require uppercase characters',
                });
            }
            if (!policy.RequireLowercaseCharacters) {
                violations.push({
                    check: 'IAM Password Policy',
                    severity: 'medium',
                    message: 'Password policy does not require lowercase characters',
                });
            }
            if (!policy.RequireNumbers) {
                violations.push({
                    check: 'IAM Password Policy',
                    severity: 'medium',
                    message: 'Password policy does not require numbers',
                });
            }
            if (!policy.RequireSymbols) {
                violations.push({
                    check: 'IAM Password Policy',
                    severity: 'medium',
                    message: 'Password policy does not require symbols',
                });
            }
            if (policy.MinimumPasswordLength < 14) {
                violations.push({
                    check: 'IAM Password Policy',
                    severity: 'high',
                    message: \`Password policy minimum length (\${policy.MinimumPasswordLength}) is less than recommended 14 characters\`,
                });
            }
        }
    } catch (error) {
        if (error.name === 'NoSuchEntityException') {
            violations.push({
                check: 'IAM Password Policy',
                severity: 'critical',
                message: 'No password policy exists for the AWS account',
            });
        } else {
            throw new Error(\`Failed to get password policy: \${error.message}\`);
        }
    }

    return violations;
}

async function checkCloudTrail() {
    const violations = [];

    try {
        const describeResponse = await cloudTrailClient.send(new DescribeTrailsCommand({}));
        const trails = describeResponse.trailList || [];

        if (trails.length === 0) {
            violations.push({
                check: 'CloudTrail',
                severity: 'critical',
                message: 'No CloudTrail trails are configured',
            });
        } else {
            for (const trail of trails) {
                try {
                    const statusResponse = await cloudTrailClient.send(
                        new GetTrailStatusCommand({ Name: trail.Name })
                    );
                    if (!statusResponse.IsLogging) {
                        violations.push({
                            check: 'CloudTrail',
                            severity: 'critical',
                            resource: trail.Name,
                            message: \`CloudTrail \${trail.Name} exists but is not logging\`,
                        });
                    }
                } catch (error) {
                    console.error(\`Error checking trail status for \${trail.Name}:\`, error);
                }
            }
        }
    } catch (error) {
        throw new Error(\`Failed to describe CloudTrail trails: \${error.message}\`);
    }

    return violations;
}

async function checkVPCFlowLogs() {
    const violations = [];

    try {
        const response = await ec2Client.send(new DescribeFlowLogsCommand({}));
        const flowLogs = response.FlowLogs || [];

        if (flowLogs.length === 0) {
            violations.push({
                check: 'VPC Flow Logs',
                severity: 'high',
                message: 'No VPC Flow Logs are configured',
            });
        } else {
            const inactiveFlowLogs = flowLogs.filter(
                (log) => log.FlowLogStatus !== 'ACTIVE'
            );
            for (const log of inactiveFlowLogs) {
                violations.push({
                    check: 'VPC Flow Logs',
                    severity: 'high',
                    resource: log.FlowLogId,
                    message: \`VPC Flow Log \${log.FlowLogId} is not active (status: \${log.FlowLogStatus})\`,
                });
            }
        }
    } catch (error) {
        throw new Error(\`Failed to describe VPC Flow Logs: \${error.message}\`);
    }

    return violations;
}

async function sendViolations(violations) {
    const message = {
        Subject: \`Compliance Violations Detected: \${violations.length} issues found\`,
        Message: JSON.stringify({
            timestamp: new Date().toISOString(),
            violationCount: violations.length,
            violations: violations,
        }, null, 2),
    };

    try {
        await snsClient.send(
            new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: message.Subject,
                Message: message.Message,
            })
        );
    } catch (error) {
        console.error('Failed to publish to SNS:', error);
        throw error;
    }
}
`;

// Create Lambda function
const lambdaFunction = new aws.lambda.Function('compliance-checker', {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  code: new pulumi.asset.AssetArchive({
    'index.js': new pulumi.asset.StringAsset(lambdaCode),
    'package.json': new pulumi.asset.StringAsset(
      JSON.stringify({
        name: 'compliance-checker',
        version: '1.0.0',
        dependencies: {
          '@aws-sdk/client-s3': '^3.0.0',
          '@aws-sdk/client-ec2': '^3.0.0',
          '@aws-sdk/client-iam': '^3.0.0',
          '@aws-sdk/client-cloudtrail': '^3.0.0',
          '@aws-sdk/client-sns': '^3.0.0',
        },
      })
    ),
  }),
  handler: 'index.handler',
  role: lambdaRole.arn,
  timeout: 300,
  memorySize: 512,
  environment: {
    variables: {
      SNS_TOPIC_ARN: snsTopic.arn,
    },
  },
  tags,
});

// Create EventBridge rule to trigger Lambda every 12 hours
const eventRule = new aws.cloudwatch.EventRule('compliance-schedule', {
  scheduleExpression: 'rate(12 hours)',
  description: 'Trigger compliance checks every 12 hours',
  tags,
});

new aws.cloudwatch.EventTarget('compliance-target', {
  rule: eventRule.name,
  arn: lambdaFunction.arn,
});

// Grant EventBridge permission to invoke Lambda
new aws.lambda.Permission('eventbridge-invoke', {
  action: 'lambda:InvokeFunction',
  function: lambdaFunction.name,
  principal: 'events.amazonaws.com',
  sourceArn: eventRule.arn,
});

// Create CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard('compliance-dashboard', {
  dashboardName: 'compliance-monitoring',
  dashboardBody: pulumi.all([lambdaFunction.name]).apply(([_functionName]) =>
    JSON.stringify({
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
              ['.', 'Errors', { stat: 'Sum' }],
              ['.', 'Duration', { stat: 'Average' }],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'Compliance Check Performance',
            yAxis: {
              left: {
                label: 'Count',
              },
              right: {
                label: 'Milliseconds',
              },
            },
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/Lambda', 'ConcurrentExecutions', { stat: 'Maximum' }],
            ],
            period: 300,
            stat: 'Maximum',
            region: 'us-east-1',
            title: 'Lambda Concurrent Executions',
          },
        },
      ],
    })
  ),
});

// Export stack outputs
export const lambdaFunctionArn = lambdaFunction.arn;
export const lambdaFunctionName = lambdaFunction.name;
export const snsTopicArn = snsTopic.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;
export const iamRoleArn = lambdaRole.arn;

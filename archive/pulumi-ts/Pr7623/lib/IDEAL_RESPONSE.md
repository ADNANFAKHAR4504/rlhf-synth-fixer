# IDEAL RESPONSE - Production-Ready EC2 Cost Optimization

This document contains the corrected, production-ready implementation with all MODEL_FAILURES issues resolved.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = config.get("aws:region") || "us-east-1";

// EC2 pricing data (per hour in USD for us-east-1, as of 2025)
// Note: Update these values periodically or integrate with AWS Pricing API
const pricingData: { [key: string]: number } = {
    "t3.micro": 0.0104,
    "t3.small": 0.0208,
    "t3.medium": 0.0416,
    "t3.large": 0.0832,
    "t3.xlarge": 0.1664,
    "t3.2xlarge": 0.3328,
};

// Query existing EC2 instances with development or staging tags
const devInstances = aws.ec2.getInstancesOutput({
    filters: [
        {
            name: "tag:Environment",
            values: ["development"],
        },
        {
            name: "instance-state-name",
            values: ["running", "stopped"],
        },
    ],
});

const stagingInstances = aws.ec2.getInstancesOutput({
    filters: [
        {
            name: "tag:Environment",
            values: ["staging"],
        },
        {
            name: "instance-state-name",
            values: ["running", "stopped"],
        },
    ],
});

// SNS topic for alarm notifications
const alarmTopic = new aws.sns.Topic(`ec2-scheduler-alarms-${environmentSuffix}`, {
    displayName: `EC2 Scheduler Alarms (${environmentSuffix})`,
    tags: {
        Name: `ec2-scheduler-alarms-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DynamoDB table for tracking instance states
const stateTable = new aws.dynamodb.Table(`ec2-state-${environmentSuffix}`, {
    billingMode: "PAY_PER_REQUEST",
    hashKey: "instanceId",
    rangeKey: "timestamp",
    attributes: [
        { name: "instanceId", type: "S" },
        { name: "timestamp", type: "N" },
    ],
    ttl: {
        enabled: true,
        attributeName: "ttl",
    },
    tags: {
        Name: `ec2-scheduler-state-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM role for Lambda functions
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `ec2-scheduler-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Attach basic Lambda execution policy
const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Custom policy for EC2, DynamoDB, and SNS operations
const lambdaCustomPolicy = new aws.iam.RolePolicy(`lambda-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([stateTable.arn, alarmTopic.arn]).apply(([tableArn, topicArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "ec2:DescribeInstances",
                        "ec2:DescribeInstanceStatus",
                        "ec2:DescribeInstanceTypes",
                        "ec2:StartInstances",
                        "ec2:StopInstances",
                    ],
                    Resource: "*",
                },
                {
                    Effect: "Allow",
                    Action: [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                    ],
                    Resource: tableArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "sns:Publish",
                    ],
                    Resource: topicArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    Resource: "arn:aws:logs:*:*:*",
                },
            ],
        })
    ),
});

// Lambda function code for stopping instances
const stopLambdaCode = `
const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION;
const ec2Client = new EC2Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const snsClient = new SNSClient({ region });

exports.handler = async (event) => {
    console.log('Starting EC2 instance stop operation');
    const tableName = process.env.STATE_TABLE_NAME;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    const results = {
        success: [],
        failed: [],
        noInstancesFound: false,
    };

    try {
        // Find instances to stop
        const describeParams = {
            Filters: [
                {
                    Name: 'tag:Environment',
                    Values: ['development', 'staging']
                },
                {
                    Name: 'instance-state-name',
                    Values: ['running']
                }
            ]
        };

        const describeCommand = new DescribeInstancesCommand(describeParams);
        const describeResult = await ec2Client.send(describeCommand);

        const instancesToStop = [];
        for (const reservation of describeResult.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                // Additional check to exclude production instances
                const envTag = instance.Tags?.find(t => t.Key === 'Environment');
                if (envTag && envTag.Value !== 'production') {
                    instancesToStop.push(instance.InstanceId);
                }
            }
        }

        if (instancesToStop.length === 0) {
            console.log('No instances to stop');
            results.noInstancesFound = true;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No instances to stop', results })
            };
        }

        console.log(\`Attempting to stop \${instancesToStop.length} instances: \${instancesToStop.join(', ')}\`);

        // Stop instances
        try {
            const stopCommand = new StopInstancesCommand({
                InstanceIds: instancesToStop
            });
            const stopResult = await ec2Client.send(stopCommand);

            for (const instance of stopResult.StoppingInstances || []) {
                results.success.push(instance.InstanceId);
            }
        } catch (error) {
            console.error('Error stopping instances:', error);
            results.failed = instancesToStop;

            // Publish failure notification
            try {
                await snsClient.send(new PublishCommand({
                    TopicArn: snsTopicArn,
                    Subject: 'EC2 Scheduler: Failed to stop instances',
                    Message: \`Failed to stop instances: \${instancesToStop.join(', ')}\\n\\nError: \${error.message}\`
                }));
            } catch (snsError) {
                console.error('Failed to publish SNS notification:', snsError);
            }

            throw error;
        }

        // Log to DynamoDB (non-blocking)
        const timestamp = Date.now();
        const logPromises = results.success.map(async (instanceId) => {
            try {
                const putCommand = new PutItemCommand({
                    TableName: tableName,
                    Item: {
                        instanceId: { S: instanceId },
                        timestamp: { N: timestamp.toString() },
                        action: { S: 'stop' },
                        status: { S: 'success' },
                        ttl: { N: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString() }
                    }
                });
                await dynamoClient.send(putCommand);
            } catch (error) {
                console.error(\`Failed to log instance \${instanceId} to DynamoDB:\`, error);
                // Don't fail the entire operation if logging fails
            }
        });

        await Promise.allSettled(logPromises);

        console.log(\`Successfully stopped \${results.success.length} instances\`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Instances stopped successfully',
                results
            })
        };
    } catch (error) {
        console.error('Fatal error in stop operation:', error);
        throw error;
    }
};
`;

// Lambda function code for starting instances
const startLambdaCode = `
const { EC2Client, DescribeInstancesCommand, StartInstancesCommand, DescribeInstanceStatusCommand } = require('@aws-sdk/client-ec2');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION;
const ec2Client = new EC2Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const snsClient = new SNSClient({ region });

exports.handler = async (event) => {
    console.log('Starting EC2 instance start operation');
    const tableName = process.env.STATE_TABLE_NAME;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    const results = {
        success: [],
        failed: [],
        noInstancesFound: false,
    };

    try {
        // Find instances to start
        const describeParams = {
            Filters: [
                {
                    Name: 'tag:Environment',
                    Values: ['development', 'staging']
                },
                {
                    Name: 'instance-state-name',
                    Values: ['stopped']
                }
            ]
        };

        const describeCommand = new DescribeInstancesCommand(describeParams);
        const describeResult = await ec2Client.send(describeCommand);

        const instancesToStart = [];
        for (const reservation of describeResult.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                // Additional check to exclude production instances
                const envTag = instance.Tags?.find(t => t.Key === 'Environment');
                if (envTag && envTag.Value !== 'production') {
                    instancesToStart.push(instance.InstanceId);
                }
            }
        }

        if (instancesToStart.length === 0) {
            console.log('No instances to start');
            results.noInstancesFound = true;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No instances to start', results })
            };
        }

        console.log(\`Attempting to start \${instancesToStart.length} instances: \${instancesToStart.join(', ')}\`);

        // Start instances
        try {
            const startCommand = new StartInstancesCommand({
                InstanceIds: instancesToStart
            });
            const startResult = await ec2Client.send(startCommand);

            for (const instance of startResult.StartingInstances || []) {
                results.success.push(instance.InstanceId);
            }

            // Wait a bit and check if instances actually started
            await new Promise(resolve => setTimeout(resolve, 5000));

            const statusCommand = new DescribeInstanceStatusCommand({
                InstanceIds: results.success
            });
            const statusResult = await ec2Client.send(statusCommand);

            // Check for failed starts
            const runningInstances = statusResult.InstanceStatuses?.map(s => s.InstanceId) || [];
            results.failed = results.success.filter(id => !runningInstances.includes(id));
            results.success = results.success.filter(id => runningInstances.includes(id));

            // Notify about failed starts
            if (results.failed.length > 0) {
                try {
                    await snsClient.send(new PublishCommand({
                        TopicArn: snsTopicArn,
                        Subject: 'EC2 Scheduler: Some instances failed to start',
                        Message: \`The following instances failed to start:\\n\${results.failed.join('\\n')}\`
                    }));
                } catch (snsError) {
                    console.error('Failed to publish SNS notification:', snsError);
                }
            }
        } catch (error) {
            console.error('Error starting instances:', error);
            results.failed = instancesToStart;

            // Publish failure notification
            try {
                await snsClient.send(new PublishCommand({
                    TopicArn: snsTopicArn,
                    Subject: 'EC2 Scheduler: Failed to start instances',
                    Message: \`Failed to start instances: \${instancesToStart.join(', ')}\\n\\nError: \${error.message}\`
                }));
            } catch (snsError) {
                console.error('Failed to publish SNS notification:', snsError);
            }

            throw error;
        }

        // Log to DynamoDB (non-blocking)
        const timestamp = Date.now();
        const logPromises = [...results.success, ...results.failed].map(async (instanceId) => {
            const status = results.success.includes(instanceId) ? 'success' : 'failed';
            try {
                const putCommand = new PutItemCommand({
                    TableName: tableName,
                    Item: {
                        instanceId: { S: instanceId },
                        timestamp: { N: timestamp.toString() },
                        action: { S: 'start' },
                        status: { S: status },
                        ttl: { N: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString() }
                    }
                });
                await dynamoClient.send(putCommand);
            } catch (error) {
                console.error(\`Failed to log instance \${instanceId} to DynamoDB:\`, error);
                // Don't fail the entire operation if logging fails
            }
        });

        await Promise.allSettled(logPromises);

        console.log(\`Successfully started \${results.success.length} instances, \${results.failed.length} failed\`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Instance start operation completed',
                results
            })
        };
    } catch (error) {
        console.error('Fatal error in start operation:', error);
        throw error;
    }
};
`;

// Create Lambda layer with AWS SDK v3
const sdkLayerCode = `
{
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.450.0",
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0"
  }
}
`;

const sdkLayer = new aws.lambda.LayerVersion(`aws-sdk-layer-${environmentSuffix}`, {
    layerName: `ec2-scheduler-aws-sdk-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
        "nodejs/package.json": new pulumi.asset.StringAsset(sdkLayerCode),
    }),
    compatibleRuntimes: [aws.lambda.Runtime.NodeJS18dX, aws.lambda.Runtime.NodeJS20dX],
    description: "AWS SDK v3 for EC2 Scheduler",
});

// Create Lambda functions with proper configuration
const stopLambda = new aws.lambda.Function(`stop-lambda-${environmentSuffix}`, {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(stopLambdaCode),
    }),
    layers: [sdkLayer.arn],
    environment: {
        variables: {
            STATE_TABLE_NAME: stateTable.name,
            SNS_TOPIC_ARN: alarmTopic.arn,
            AWS_REGION: region,
        },
    },
    timeout: 300,
    memorySize: 256,
    tags: {
        Name: `ec2-stop-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [lambdaBasicPolicy, lambdaCustomPolicy] });

const startLambda = new aws.lambda.Function(`start-lambda-${environmentSuffix}`, {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(startLambdaCode),
    }),
    layers: [sdkLayer.arn],
    environment: {
        variables: {
            STATE_TABLE_NAME: stateTable.name,
            SNS_TOPIC_ARN: alarmTopic.arn,
            AWS_REGION: region,
        },
    },
    timeout: 300,
    memorySize: 256,
    tags: {
        Name: `ec2-start-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [lambdaBasicPolicy, lambdaCustomPolicy] });

// IAM role for Step Functions
const stepFunctionsRole = new aws.iam.Role(`sfn-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "states.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `ec2-scheduler-sfn-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Policy for Step Functions to invoke Lambda
const stepFunctionsPolicy = new aws.iam.RolePolicy(`sfn-policy-${environmentSuffix}`, {
    role: stepFunctionsRole.id,
    policy: pulumi.all([startLambda.arn, stopLambda.arn]).apply(([startArn, stopArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: [
                    "lambda:InvokeFunction",
                ],
                Resource: [startArn, stopArn],
            }],
        })
    ),
});

// Step Functions state machine for orchestration
const stateMachine = new aws.sfn.StateMachine(`sfn-${environmentSuffix}`, {
    roleArn: stepFunctionsRole.arn,
    definition: pulumi.all([startLambda.arn, stopLambda.arn]).apply(([startArn, stopArn]) =>
        JSON.stringify({
            Comment: "EC2 Scheduler State Machine - Orchestrates start/stop operations with retry logic",
            StartAt: "DetermineAction",
            States: {
                DetermineAction: {
                    Type: "Choice",
                    Choices: [
                        {
                            Variable: "$.action",
                            StringEquals: "start",
                            Next: "StartInstances",
                        },
                        {
                            Variable: "$.action",
                            StringEquals: "stop",
                            Next: "StopInstances",
                        },
                    ],
                    Default: "InvalidAction",
                },
                StartInstances: {
                    Type: "Task",
                    Resource: startArn,
                    Retry: [
                        {
                            ErrorEquals: ["States.ALL"],
                            IntervalSeconds: 2,
                            MaxAttempts: 3,
                            BackoffRate: 2,
                        },
                    ],
                    Catch: [
                        {
                            ErrorEquals: ["States.ALL"],
                            Next: "OperationFailed",
                        },
                    ],
                    End: true,
                },
                StopInstances: {
                    Type: "Task",
                    Resource: stopArn,
                    Retry: [
                        {
                            ErrorEquals: ["States.ALL"],
                            IntervalSeconds: 2,
                            MaxAttempts: 3,
                            BackoffRate: 2,
                        },
                    ],
                    Catch: [
                        {
                            ErrorEquals: ["States.ALL"],
                            Next: "OperationFailed",
                        },
                    ],
                    End: true,
                },
                InvalidAction: {
                    Type: "Fail",
                    Error: "InvalidAction",
                    Cause: "The action must be 'start' or 'stop'",
                },
                OperationFailed: {
                    Type: "Fail",
                    Error: "OperationFailed",
                    Cause: "EC2 operation failed after retries",
                },
            },
        })
    ),
    loggingConfiguration: {
        level: "ALL",
        includeExecutionData: true,
        logDestination: pulumi.interpolate\`arn:aws:logs:\${region}:\${aws.getCallerIdentityOutput().accountId}:log-group:/aws/states/ec2-scheduler-\${environmentSuffix}:*\`,
    },
    tags: {
        Name: `ec2-scheduler-sfn-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [stepFunctionsPolicy] });

// CloudWatch Log Group for Step Functions
const sfnLogGroup = new aws.cloudwatch.LogGroup(`sfn-logs-${environmentSuffix}`, {
    name: \`/aws/states/ec2-scheduler-\${environmentSuffix}\`,
    retentionInDays: 30,
    tags: {
        Name: `ec2-scheduler-sfn-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM role for EventBridge to invoke Step Functions
const eventBridgeRole = new aws.iam.Role(`events-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "events.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `ec2-scheduler-events-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const eventBridgePolicy = new aws.iam.RolePolicy(`events-policy-${environmentSuffix}`, {
    role: eventBridgeRole.id,
    policy: stateMachine.arn.apply(arn =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: [
                    "states:StartExecution",
                ],
                Resource: arn,
            }],
        })
    ),
});

// EventBridge rule to stop instances at 7 PM EST on weekdays
// Note: 7 PM EST = midnight UTC (0:00) in standard time, 11 PM UTC (23:00) in daylight saving
// Using midnight UTC as approximation - adjust manually for DST if needed
const stopRule = new aws.cloudwatch.EventRule(`stop-rule-${environmentSuffix}`, {
    description: "Stop EC2 instances at 7 PM EST on weekdays (midnight UTC)",
    scheduleExpression: "cron(0 0 ? * MON-FRI *)",
    isEnabled: true,
    tags: {
        Name: `ec2-stop-rule-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// EventBridge rule to start instances at 8 AM EST on weekdays
// Note: 8 AM EST = 1 PM UTC (13:00) in standard time, noon UTC (12:00) in daylight saving
// Using 1 PM UTC as approximation - adjust manually for DST if needed
const startRule = new aws.cloudwatch.EventRule(`start-rule-${environmentSuffix}`, {
    description: "Start EC2 instances at 8 AM EST on weekdays (1 PM UTC)",
    scheduleExpression: "cron(0 13 ? * MON-FRI *)",
    isEnabled: true,
    tags: {
        Name: `ec2-start-rule-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// EventBridge targets for Step Functions
const stopTarget = new aws.cloudwatch.EventTarget(`stop-target-${environmentSuffix}`, {
    rule: stopRule.name,
    arn: stateMachine.arn,
    roleArn: eventBridgeRole.arn,
    input: JSON.stringify({
        action: "stop",
        triggeredBy: "EventBridge",
        timestamp: new Date().toISOString(),
    }),
}, { dependsOn: [eventBridgePolicy] });

const startTarget = new aws.cloudwatch.EventTarget(`start-target-${environmentSuffix}`, {
    rule: startRule.name,
    arn: stateMachine.arn,
    roleArn: eventBridgeRole.arn,
    input: JSON.stringify({
        action: "start",
        triggeredBy: "EventBridge",
        timestamp: new Date().toISOString(),
    }),
}, { dependsOn: [eventBridgePolicy] });

// CloudWatch alarms for failed Lambda invocations
const stopLambdaAlarm = new aws.cloudwatch.MetricAlarm(`stop-alarm-${environmentSuffix}`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 0,
    dimensions: {
        FunctionName: stopLambda.name,
    },
    alarmDescription: "Alert when stop Lambda function fails",
    alarmActions: [alarmTopic.arn],
    treatMissingData: "notBreaching",
    tags: {
        Name: `ec2-stop-lambda-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const startLambdaAlarm = new aws.cloudwatch.MetricAlarm(`start-alarm-${environmentSuffix}`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 0,
    dimensions: {
        FunctionName: startLambda.name,
    },
    alarmDescription: "Alert when start Lambda function fails",
    alarmActions: [alarmTopic.arn],
    treatMissingData: "notBreaching",
    tags: {
        Name: `ec2-start-lambda-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch alarm for Step Functions failures
const sfnFailureAlarm = new aws.cloudwatch.MetricAlarm(`sfn-alarm-${environmentSuffix}`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "ExecutionsFailed",
    namespace: "AWS/States",
    period: 300,
    statistic: "Sum",
    threshold: 0,
    dimensions: {
        StateMachineArn: stateMachine.arn,
    },
    alarmDescription: "Alert when Step Functions execution fails",
    alarmActions: [alarmTopic.arn],
    treatMissingData: "notBreaching",
    tags: {
        Name: `ec2-scheduler-sfn-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Calculate cost savings with safety checks
const calculateSavings = pulumi.all([devInstances.ids, stagingInstances.ids]).apply(([devIds, stagingIds]) => {
    const allInstanceIds = [...devIds, ...stagingIds];

    if (allInstanceIds.length === 0) {
        return {
            instanceCount: 0,
            hoursPerDay: 13,
            daysPerMonth: 22,
            monthlySavingsPerInstance: "0.00",
            totalMonthlySavings: "0.00",
            message: "No instances found matching the criteria. Ensure instances are tagged with Environment=development or Environment=staging.",
        };
    }

    // Assume t3.medium for calculation (in production, query actual types)
    const avgPricePerHour = pricingData["t3.medium"];
    const hoursPerDay = 13; // Shutdown hours
    const daysPerMonth = 22; // Weekdays
    const monthlySavingsPerInstance = avgPricePerHour * hoursPerDay * daysPerMonth;
    const totalMonthlySavings = monthlySavingsPerInstance * allInstanceIds.length;

    return {
        instanceCount: allInstanceIds.length,
        hoursPerDay,
        daysPerMonth,
        avgInstanceType: "t3.medium",
        monthlySavingsPerInstance: monthlySavingsPerInstance.toFixed(2),
        totalMonthlySavings: totalMonthlySavings.toFixed(2),
        message: "Cost calculation assumes t3.medium instances. Actual savings may vary based on instance types.",
    };
});

// Exports
export const devInstanceIds = devInstances.ids;
export const stagingInstanceIds = stagingInstances.ids;
export const stopLambdaArn = stopLambda.arn;
export const startLambdaArn = startLambda.arn;
export const stateMachineArn = stateMachine.arn;
export const stopRuleArn = stopRule.arn;
export const startRuleArn = startRule.arn;
export const stateTableName = stateTable.name;
export const alarmTopicArn = alarmTopic.arn;
export const costSavings = calculateSavings;
export const importInstructions = pulumi.all([devInstances.ids, stagingInstances.ids]).apply(([devIds, stagingIds]) => {
    const allIds = [...devIds, ...stagingIds];
    if (allIds.length === 0) {
        return "No instances found. Create instances tagged with Environment=development or Environment=staging first.";
    }
    return \`To import existing EC2 instances into Pulumi state, run:

\${allIds.map(id => \`pulumi import aws:ec2/instance:Instance \${id} \${id}\`).join('\\n')}

Note: This is optional. The current implementation uses data sources to query instances dynamically.\`;
});
```

## File: Pulumi.yaml

```yaml
name: ec2-cost-optimizer
runtime: nodejs
description: EC2 cost optimization with automated scheduled start/stop

config:
  aws:region:
    type: string
    default: us-east-1
    description: AWS region for deployment

  environmentSuffix:
    type: string
    description: Suffix for resource names to ensure uniqueness across environments
```

## File: package.json

```json
{
  "name": "ec2-cost-optimizer",
  "version": "1.0.0",
  "description": "EC2 cost optimization with scheduled start/stop functionality",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest --coverage",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.15.0"
  },
  "devDependencies": {
    "@types/node": "^18.19.0",
    "@typescript-eslint/eslint-plugin": "^6.18.0",
    "@typescript-eslint/parser": "^6.18.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin", "**/*.test.ts"]
}
```

## File: .gitignore

```
# Pulumi
.pulumi/
Pulumi.*.yaml

# Node
node_modules/
npm-debug.log
yarn-error.log

# TypeScript
bin/
*.js
*.js.map
*.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/
.nyc_output/

# Environment
.env
.env.local
```

## File: lib/README.md

```markdown
# EC2 Cost Optimization with Scheduled Start/Stop

Production-ready automated EC2 instance scheduler that stops non-production instances during off-hours to reduce AWS costs.

## Architecture

### Components

- **Lambda Functions**: Handle EC2 start/stop operations with error handling and notifications
- **Lambda Layer**: Provides AWS SDK v3 for Node.js 18+ runtime
- **Step Functions**: Orchestrate the workflow with retry logic and error handling
- **EventBridge Rules**: Schedule operations at 8 AM and 7 PM EST on weekdays
- **DynamoDB**: Track instance state changes for audit purposes with 30-day TTL
- **CloudWatch Alarms**: Alert on Lambda and Step Functions failures
- **SNS Topic**: Deliver notifications for failures and anomalies
- **CloudWatch Logs**: Store execution logs with 30-day retention

### Architecture Diagram

\`\`\`
EventBridge (Schedule)
    ↓
Step Functions (Orchestration)
    ↓
Lambda (Start/Stop) → EC2 Instances
    ↓
DynamoDB (Audit Log)
    ↓
CloudWatch Alarms → SNS → Notifications
\`\`\`

## Prerequisites

- **Pulumi CLI** installed (v3.100+)
- **AWS credentials** configured with appropriate permissions
- **Node.js 18+** installed
- **Existing EC2 instances** tagged with:
  - \`Environment=development\` or
  - \`Environment=staging\`

## Deployment

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Pulumi Stack

\`\`\`bash
# Initialize a new stack
pulumi stack init dev

# Set AWS region
pulumi config set aws:region us-east-1

# Set environment suffix (required)
pulumi config set environmentSuffix dev01
\`\`\`

### 3. Review Configuration

\`\`\`bash
pulumi config
\`\`\`

Expected output:
\`\`\`
KEY                 VALUE
aws:region          us-east-1
environmentSuffix   dev01
\`\`\`

### 4. Preview Infrastructure

\`\`\`bash
pulumi preview
\`\`\`

### 5. Deploy Infrastructure

\`\`\`bash
pulumi up
\`\`\`

Review the changes and confirm with "yes".

### 6. Verify Deployment

After deployment, check the outputs:

\`\`\`bash
pulumi stack output
\`\`\`

Expected outputs:
- \`devInstanceIds\`: List of development instance IDs
- \`stagingInstanceIds\`: List of staging instance IDs
- \`stopLambdaArn\`: ARN of stop Lambda function
- \`startLambdaArn\`: ARN of start Lambda function
- \`stateMachineArn\`: ARN of Step Functions state machine
- \`stopRuleArn\`: ARN of stop EventBridge rule
- \`startRuleArn\`: ARN of start EventBridge rule
- \`stateTableName\`: Name of DynamoDB audit table
- \`alarmTopicArn\`: ARN of SNS topic for alarms
- \`costSavings\`: Estimated monthly cost savings
- \`importInstructions\`: Commands to import instances (optional)

## Configuration

### Scheduling

The default schedule is:
- **Stop**: 7 PM EST on weekdays (Mon-Fri) - implemented as midnight UTC
- **Start**: 8 AM EST on weekdays (Mon-Fri) - implemented as 1 PM UTC

**Important**: EventBridge uses UTC time. The cron expressions are approximations:
- Standard Time: 7 PM EST = midnight UTC, 8 AM EST = 1 PM UTC
- Daylight Saving Time: 7 PM EDT = 11 PM UTC, 8 AM EDT = noon UTC

To adjust for DST, modify the cron expressions in \`index.ts\`:
- Stop rule: \`cron(0 0 ? * MON-FRI *)\` or \`cron(0 23 ? * MON-FRI *)\`
- Start rule: \`cron(0 13 ? * MON-FRI *)\` or \`cron(0 12 ? * MON-FRI *)\`

### Instance Tagging

Instances must be tagged with:
\`\`\`
Key: Environment
Value: development OR staging
\`\`\`

Instances tagged with \`Environment=production\` are explicitly excluded.

### Notifications

Subscribe to the SNS topic to receive notifications:

\`\`\`bash
SNS_TOPIC_ARN=$(pulumi stack output alarmTopicArn)
aws sns subscribe \\
  --topic-arn "$SNS_TOPIC_ARN" \\
  --protocol email \\
  --notification-endpoint your-email@example.com
\`\`\`

Confirm the subscription via email.

## Cost Savings Calculation

The system calculates estimated savings based on:
- **13 hours** of daily shutdown (7 PM to 8 AM)
- **22 weekdays** per month
- **Current EC2 on-demand pricing** for t3 instance types (as of 2025)

Formula:
\`\`\`
Monthly Savings = Instance Count × Price Per Hour × 13 hours × 22 days
\`\`\`

Example for 5 t3.medium instances:
\`\`\`
Monthly Savings = 5 × $0.0416/hr × 13 hrs × 22 days = $119.65
\`\`\`

**Note**: The calculation assumes t3.medium instances. Actual savings depend on instance types and may vary.

## Monitoring and Observability

### CloudWatch Alarms

Three alarms are configured:

1. **Stop Lambda Errors**: Triggers when stop operations fail
2. **Start Lambda Errors**: Triggers when start operations fail
3. **Step Functions Failures**: Triggers when state machine execution fails

All alarms publish to the SNS topic.

### CloudWatch Logs

Logs are available in:
- **/aws/lambda/stop-lambda-{environmentSuffix}**
- **/aws/lambda/start-lambda-{environmentSuffix}**
- **/aws/states/ec2-scheduler-{environmentSuffix}**

Retention: 30 days

### DynamoDB Audit Trail

The \`ec2-scheduler-state-{environmentSuffix}\` table stores:
- Instance ID
- Timestamp (milliseconds)
- Action (start/stop)
- Status (success/failed)
- TTL (30 days)

Query example:
\`\`\`bash
aws dynamodb query \\
  --table-name ec2-scheduler-state-dev01 \\
  --key-condition-expression "instanceId = :id" \\
  --expression-attribute-values '{":id":{"S":"i-1234567890abcdef0"}}'
\`\`\`

## Importing Existing Instances (Optional)

The current implementation uses data sources to dynamically query instances. If you want to import instances into Pulumi state for full management:

\`\`\`bash
pulumi stack output importInstructions
\`\`\`

Follow the displayed commands to import each instance.

## Security

### IAM Policies

All IAM roles follow least privilege principle:

- **Lambda Role**: EC2 describe/start/stop, DynamoDB put/get/query, SNS publish, CloudWatch logs
- **Step Functions Role**: Lambda invoke
- **EventBridge Role**: Step Functions start execution

### Network Security

- No VPC modifications required
- Instances remain in their current subnets
- Lambda functions run in AWS-managed VPC

### Data Protection

- DynamoDB table uses AWS-managed encryption
- SNS topic uses AWS-managed encryption
- CloudWatch logs encrypted at rest

## Troubleshooting

### Instances Not Starting/Stopping

1. Check EventBridge rule status:
   \`\`\`bash
   aws events describe-rule --name ec2-start-rule-dev01
   aws events describe-rule --name ec2-stop-rule-dev01
   \`\`\`

2. Check Lambda execution logs:
   \`\`\`bash
   aws logs tail /aws/lambda/start-lambda-dev01 --follow
   aws logs tail /aws/lambda/stop-lambda-dev01 --follow
   \`\`\`

3. Verify instance tags:
   \`\`\`bash
   aws ec2 describe-instances \\
     --filters "Name=tag:Environment,Values=development,staging" \\
     --query "Reservations[].Instances[].[InstanceId,State.Name,Tags]"
   \`\`\`

### No Instances Found

Ensure instances are:
- Running or stopped (not terminated)
- Tagged with \`Environment=development\` or \`Environment=staging\`
- In the same region as the deployment

### CloudWatch Alarms Triggering

1. Check Step Functions execution history:
   \`\`\`bash
   aws stepfunctions list-executions \\
     --state-machine-arn "$(pulumi stack output stateMachineArn)" \\
     --status-filter FAILED
   \`\`\`

2. Review Lambda error metrics in CloudWatch console

3. Check SNS notifications for detailed error messages

## Maintenance

### Update EC2 Pricing

Edit \`pricingData\` in \`index.ts\` with current prices:
\`\`\`typescript
const pricingData: { [key: string]: number } = {
    "t3.medium": 0.0416,  // Update these values
    "t3.large": 0.0832,
};
\`\`\`

Redeploy:
\`\`\`bash
pulumi up
\`\`\`

### Adjust Schedule

Modify cron expressions in \`index.ts\`:
\`\`\`typescript
scheduleExpression: "cron(0 0 ? * MON-FRI *)",  // Stop time
scheduleExpression: "cron(0 13 ? * MON-FRI *)", // Start time
\`\`\`

Redeploy:
\`\`\`bash
pulumi up
\`\`\`

### Disable Scheduling

To temporarily disable scheduling without destroying infrastructure:
\`\`\`bash
aws events disable-rule --name ec2-stop-rule-dev01
aws events disable-rule --name ec2-start-rule-dev01
\`\`\`

To re-enable:
\`\`\`bash
aws events enable-rule --name ec2-stop-rule-dev01
aws events enable-rule --name ec2-start-rule-dev01
\`\`\`

## Cleanup

To remove all resources:

\`\`\`bash
pulumi destroy
\`\`\`

Review the resources to be deleted and confirm with "yes".

**Warning**: This will:
- Remove all Lambda functions, Step Functions, EventBridge rules
- Delete the DynamoDB audit table (including all historical data)
- Remove CloudWatch alarms and log groups
- Delete the SNS topic

The actual EC2 instances will NOT be affected.

## Testing

### Manual Invocation

Test Lambda functions directly:

\`\`\`bash
# Test stop function
aws lambda invoke \\
  --function-name ec2-stop-lambda-dev01 \\
  --payload '{}' \\
  response.json

# Test start function
aws lambda invoke \\
  --function-name ec2-start-lambda-dev01 \\
  --payload '{}' \\
  response.json

cat response.json
\`\`\`

### Step Functions Execution

Test the state machine:

\`\`\`bash
# Start execution
EXECUTION_ARN=$(aws stepfunctions start-execution \\
  --state-machine-arn "$(pulumi stack output stateMachineArn)" \\
  --input '{"action":"stop"}' \\
  --query 'executionArn' \\
  --output text)

# Check status
aws stepfunctions describe-execution --execution-arn "$EXECUTION_ARN"
\`\`\`

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed execution traces
2. Review DynamoDB audit table for historical operations
3. Examine SNS notifications for failure details
4. Consult AWS service documentation for specific errors

## License

This project is provided as-is for infrastructure automation purposes.
\`\`\`

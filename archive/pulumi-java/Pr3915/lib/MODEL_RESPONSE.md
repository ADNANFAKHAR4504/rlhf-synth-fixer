I'll help you create a comprehensive order processing system using Pulumi with Java. This solution includes all the components you need for a production-ready serverless order management system.

## File: lib/src/main/java/app/Main.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.aws.dynamodb.Table;
import com.pulumi.aws.dynamodb.TableArgs;
import com.pulumi.aws.dynamodb.inputs.TableAttributeArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.lambda.Permission;
import com.pulumi.aws.lambda.PermissionArgs;
import com.pulumi.aws.lambda.EventSourceMapping;
import com.pulumi.aws.lambda.EventSourceMappingArgs;
import com.pulumi.aws.scheduler.Schedule;
import com.pulumi.aws.scheduler.ScheduleArgs;
import com.pulumi.aws.scheduler.inputs.ScheduleTargetArgs;
import com.pulumi.aws.scheduler.inputs.ScheduleTargetRetryPolicyArgs;
import com.pulumi.aws.scheduler.inputs.ScheduleFlexibleTimeWindowArgs;
import com.pulumi.aws.sfn.StateMachine;
import com.pulumi.aws.sfn.StateMachineArgs;
import com.pulumi.aws.sqs.Queue;
import com.pulumi.aws.sqs.QueueArgs;
import com.pulumi.asset.FileArchive;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Map;

/**
 * Main class for restaurant order processing infrastructure.
 * Deploys a serverless order management system with SQS, Lambda, DynamoDB,
 * Step Functions, CloudWatch, and EventBridge Scheduler.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        final Map<String, String> commonTags = Map.of(
            "Environment", "production",
            "Project", "restaurant-order-processing",
            "ManagedBy", "pulumi"
        );

        // Dead Letter Queue for failed messages
        Queue deadLetterQueue = new Queue("order-dlq", QueueArgs.builder()
            .fifoQueue(true)
            .contentBasedDeduplication(true)
            .messageRetentionSeconds(259200) // 3 days
            .tags(commonTags)
            .build());

        // Main SQS FIFO Queue for order sequencing
        Queue orderQueue = new Queue("order-queue", QueueArgs.builder()
            .fifoQueue(true)
            .contentBasedDeduplication(true)
            .visibilityTimeoutSeconds(300)
            .redrivePolicy(deadLetterQueue.arn().apply(arn ->
                String.format("{\"deadLetterTargetArn\":\"%s\",\"maxReceiveCount\":3}", arn)))
            .tags(commonTags)
            .build());

        // DynamoDB table for order storage
        Table ordersTable = new Table("orders-table", TableArgs.builder()
            .attributes(
                TableAttributeArgs.builder()
                    .name("orderId")
                    .type("S")
                    .build(),
                TableAttributeArgs.builder()
                    .name("orderTimestamp")
                    .type("N")
                    .build()
            )
            .hashKey("orderId")
            .rangeKey("orderTimestamp")
            .billingMode("PAY_PER_REQUEST")
            .tags(commonTags)
            .build());

        // CloudWatch Log Group for Lambda
        LogGroup lambdaLogGroup = new LogGroup("order-validator-logs", LogGroupArgs.builder()
            .retentionInDays(7)
            .tags(commonTags)
            .build());

        // IAM Role for Lambda
        Role lambdaRole = new Role("order-validator-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }
                """)
            .tags(commonTags)
            .build());

        // Lambda Role Policy
        RolePolicy lambdaPolicy = new RolePolicy("order-validator-policy", RolePolicyArgs.builder()
            .role(lambdaRole.id())
            .policy(ordersTable.arn().apply(tableArn ->
                orderQueue.arn().apply(queueArn ->
                    lambdaLogGroup.arn().apply(logArn ->
                        String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sqs:ReceiveMessage",
                                        "sqs:DeleteMessage",
                                        "sqs:GetQueueAttributes"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:PutItem",
                                        "dynamodb:GetItem",
                                        "dynamodb:UpdateItem",
                                        "dynamodb:Query"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": "%s:*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "cloudwatch:PutMetricData"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, queueArn, tableArn, logArn)
                    )
                )
            ))
            .build());

        // Lambda function for order validation
        Function orderValidator = new Function("order-validator", FunctionArgs.builder()
            .runtime("nodejs20.x")
            .role(lambdaRole.arn())
            .handler("index.handler")
            .code(new FileArchive("./lib/lambda"))
            .timeout(60)
            .environment(FunctionArgs.FunctionEnvironmentArgs.builder()
                .variables(ordersTable.name().apply(tableName ->
                    Map.of("ORDERS_TABLE", tableName)))
                .build())
            .tags(commonTags)
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(lambdaPolicy, lambdaLogGroup)
                .build());

        // Lambda Event Source Mapping for SQS
        EventSourceMapping eventSourceMapping = new EventSourceMapping("order-queue-mapping",
            EventSourceMappingArgs.builder()
                .eventSourceArn(orderQueue.arn())
                .functionName(orderValidator.name())
                .batchSize(10)
                .build());

        // IAM Role for Step Functions
        Role stepFunctionsRole = new Role("step-functions-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "states.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }
                """)
            .tags(commonTags)
            .build());

        // Step Functions Role Policy
        RolePolicy stepFunctionsPolicy = new RolePolicy("step-functions-policy",
            RolePolicyArgs.builder()
                .role(stepFunctionsRole.id())
                .policy(orderValidator.arn().apply(lambdaArn ->
                    ordersTable.arn().apply(tableArn ->
                        String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "lambda:InvokeFunction"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:PutItem",
                                        "dynamodb:UpdateItem"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogDelivery",
                                        "logs:GetLogDelivery",
                                        "logs:UpdateLogDelivery",
                                        "logs:DeleteLogDelivery",
                                        "logs:ListLogDeliveries",
                                        "logs:PutResourcePolicy",
                                        "logs:DescribeResourcePolicies",
                                        "logs:DescribeLogGroups"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, lambdaArn, tableArn)
                    )
                ))
                .build());

        // Step Functions State Machine
        StateMachine orderWorkflow = new StateMachine("order-workflow", StateMachineArgs.builder()
            .roleArn(stepFunctionsRole.arn())
            .definition(orderValidator.arn().apply(lambdaArn ->
                ordersTable.name().apply(tableName ->
                    String.format("""
                    {
                        "Comment": "Order processing workflow with error retry logic",
                        "StartAt": "ValidateOrder",
                        "States": {
                            "ValidateOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::lambda:invoke",
                                "Parameters": {
                                    "FunctionName": "%s",
                                    "Payload.$": "$"
                                },
                                "Retry": [
                                    {
                                        "ErrorEquals": ["States.TaskFailed", "Lambda.ServiceException"],
                                        "IntervalSeconds": 2,
                                        "MaxAttempts": 3,
                                        "BackoffRate": 2.0
                                    }
                                ],
                                "Catch": [
                                    {
                                        "ErrorEquals": ["States.ALL"],
                                        "Next": "HandleError"
                                    }
                                ],
                                "Next": "ProcessOrder"
                            },
                            "ProcessOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {
                                        "orderId": {"S.$": "$.Payload.orderId"},
                                        "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}
                                    },
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {
                                        ":status": {"S": "PROCESSING"}
                                    }
                                },
                                "Retry": [
                                    {
                                        "ErrorEquals": ["States.TaskFailed"],
                                        "IntervalSeconds": 1,
                                        "MaxAttempts": 2,
                                        "BackoffRate": 1.5
                                    }
                                ],
                                "Next": "ConfirmOrder"
                            },
                            "ConfirmOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {
                                        "orderId": {"S.$": "$.Payload.orderId"},
                                        "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}
                                    },
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {
                                        ":status": {"S": "CONFIRMED"}
                                    }
                                },
                                "End": true
                            },
                            "HandleError": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {
                                        "orderId": {"S.$": "$.Payload.orderId"},
                                        "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}
                                    },
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {
                                        ":status": {"S": "FAILED"}
                                    }
                                },
                                "End": true
                            }
                        }
                    }
                    """, lambdaArn, tableName, tableName, tableName)
                )
            ))
            .tags(commonTags)
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(stepFunctionsPolicy)
                .build());

        // IAM Role for EventBridge Scheduler
        Role schedulerRole = new Role("scheduler-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "scheduler.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }
                """)
            .tags(commonTags)
            .build());

        // Scheduler Role Policy
        RolePolicy schedulerPolicy = new RolePolicy("scheduler-policy", RolePolicyArgs.builder()
            .role(schedulerRole.id())
            .policy(orderWorkflow.arn().apply(stateMachineArn ->
                String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["states:StartExecution"],
                        "Resource": "%s"
                    }]
                }
                """, stateMachineArn)))
            .build());

        // EventBridge Scheduler for daily reports
        Schedule dailyReportSchedule = new Schedule("daily-order-report", ScheduleArgs.builder()
            .scheduleExpression("cron(0 23 * * ? *)")  // 11 PM UTC daily
            .scheduleExpressionTimezone("America/Los_Angeles")
            .flexibleTimeWindow(ScheduleFlexibleTimeWindowArgs.builder()
                .mode("OFF")
                .build())
            .target(ScheduleTargetArgs.builder()
                .arn(orderWorkflow.arn())
                .roleArn(schedulerRole.arn())
                .input("{\"reportType\":\"daily-summary\"}")
                .retryPolicy(ScheduleTargetRetryPolicyArgs.builder()
                    .maximumRetryAttempts(3)
                    .maximumEventAgeInSeconds(3600)
                    .build())
                .build())
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(schedulerPolicy)
                .build());

        // Exports
        ctx.export("orderQueueUrl", orderQueue.url());
        ctx.export("deadLetterQueueUrl", deadLetterQueue.url());
        ctx.export("ordersTableName", ordersTable.name());
        ctx.export("orderValidatorArn", orderValidator.arn());
        ctx.export("orderWorkflowArn", orderWorkflow.arn());
        ctx.export("dailyReportScheduleName", dailyReportSchedule.name());
    }
}
```

## File: lib/lambda/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

const ORDERS_TABLE = process.env.ORDERS_TABLE;

/**
 * Validates order data
 */
function validateOrder(order) {
    const errors = [];

    if (!order.orderId) {
        errors.push('Missing orderId');
    }

    if (!order.customerName) {
        errors.push('Missing customerName');
    }

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        errors.push('Missing or invalid items array');
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
        errors.push('Invalid totalAmount');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Publishes CloudWatch metrics
 */
async function publishMetrics(metricName, value, unit = 'Count') {
    try {
        const params = {
            Namespace: 'OrderProcessing',
            MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: unit,
                Timestamp: new Date()
            }]
        };

        await cloudWatchClient.send(new PutMetricDataCommand(params));
    } catch (error) {
        console.error('Error publishing metrics:', error);
    }
}

/**
 * Lambda handler for order validation
 */
exports.handler = async (event) => {
    const startTime = Date.now();

    try {
        console.log('Processing event:', JSON.stringify(event, null, 2));

        // Handle SQS batch
        const records = event.Records || [];
        const results = [];

        for (const record of records) {
            try {
                const order = JSON.parse(record.body);
                const orderTimestamp = Date.now();

                // Validate order
                const validation = validateOrder(order);

                if (!validation.valid) {
                    console.error('Validation failed:', validation.errors);
                    await publishMetrics('OrderValidationFailed', 1);
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }

                // Store in DynamoDB
                const item = {
                    orderId: order.orderId,
                    orderTimestamp: orderTimestamp,
                    customerName: order.customerName,
                    items: order.items,
                    totalAmount: order.totalAmount,
                    orderStatus: 'VALIDATED',
                    createdAt: new Date().toISOString()
                };

                await docClient.send(new PutCommand({
                    TableName: ORDERS_TABLE,
                    Item: item
                }));

                await publishMetrics('OrderValidationSuccess', 1);

                results.push({
                    orderId: order.orderId,
                    orderTimestamp: orderTimestamp.toString(),
                    status: 'success'
                });

            } catch (error) {
                console.error('Error processing record:', error);
                await publishMetrics('OrderProcessingError', 1);
                throw error;
            }
        }

        // Publish execution time metric
        const executionTime = Date.now() - startTime;
        await publishMetrics('LambdaExecutionTime', executionTime, 'Milliseconds');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Orders processed successfully',
                results
            })
        };

    } catch (error) {
        console.error('Handler error:', error);
        await publishMetrics('LambdaError', 1);
        throw error;
    }
};
```

## File: lib/lambda/package.json

```json
{
  "name": "order-validator",
  "version": "1.0.0",
  "description": "Lambda function for order validation",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-cloudwatch": "^3.700.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0"
  }
}
```

This solution provides a complete serverless order processing system with:

1. SQS FIFO queue maintaining order sequence
2. Lambda function with Node.js 20 for validation
3. DynamoDB table for persistent storage
4. Step Functions with retry logic for workflow orchestration
5. Dead Letter Queue with 3-day retention
6. CloudWatch metrics for monitoring
7. IAM roles with least privilege access
8. EventBridge Scheduler for daily reports

All resources are tagged for cost tracking and follow AWS best practices for production serverless applications.
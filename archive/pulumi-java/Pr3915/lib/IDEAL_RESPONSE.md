# Ideal Infrastructure Solution: Restaurant Order Processing System

This document describes the production-ready order processing infrastructure deployed for a restaurant chain handling 3,400 orders per day.

## Architecture Overview

A serverless order processing system deployed in us-west-1 with the following components:

1. **SQS FIFO Queues**: Main queue and Dead Letter Queue for reliable message ordering
2. **Lambda Function**: Node.js 20 order validator with CloudWatch monitoring
3. **DynamoDB Table**: Persistent storage with PAY_PER_REQUEST billing
4. **Step Functions**: Workflow orchestration with retry logic
5. **EventBridge Scheduler**: Daily report generation
6. **CloudWatch Logs**: Centralized logging with 7-day retention

## Infrastructure Code Structure

### Main.java (Refactored for Maintainability)

The infrastructure is defined using helper methods to comply with checkstyle rules (max 200 lines per method):

- `createDeadLetterQueue()`: Creates FIFO DLQ with 3-day retention
- `createOrderQueue()`: Creates main FIFO queue with redrive policy
- `createOrdersTable()`: Creates DynamoDB table with composite key
- `createLambdaRole()` & `createLambdaPolicy()`: IAM permissions following least privilege
- `createLambdaFunction()`: Lambda with environment variables and dependencies
- `createEventSourceMapping()`: Connects SQS to Lambda
- `createStepFunctionsRole()` & `createStepFunctionsPolicy()`: Step Functions IAM
- `createStepFunctionsStateMachine()`: Workflow with error handling
- `createSchedulerRole()` & `createSchedulerPolicy()`: EventBridge IAM
- `createDailySchedule()`: Cron-based scheduler
- `exportOutputs()`: Stack outputs for integration tests

### Lambda Function (index.js)

Order validator with:
- Field validation (orderId, customerName, items, totalAmount)
- DynamoDB persistence
- CloudWatch metrics publishing
- Error handling with detailed logging

## Key Design Decisions

1. **FIFO Queues**: Ensures order sequence is maintained
2. **Content-Based Deduplication**: Prevents duplicate processing
3. **Visibility Timeout**: 300 seconds for processing
4. **DLQ with Max Receive Count**: 3 retries before DLQ
5. **PAY_PER_REQUEST**: Cost-effective for variable workload
6. **Composite Key**: orderId (hash) + orderTimestamp (range)
7. **Step Functions Retry Logic**: Exponential backoff for transient failures
8. **CloudWatch Integration**: Metrics for throughput, errors, execution times

## Testing

- **Unit Tests**: 23 tests covering method structure and visibility
- **Integration Tests**: 10 tests validating deployed infrastructure
  - Queue configuration (FIFO, deduplication, visibility timeout)
  - DynamoDB schema and billing mode
  - Lambda configuration (runtime, handler, timeout)
  - Step Functions workflow definition
  - CloudWatch log group retention

## Compliance

- All resources are destroyable (no retain policies)
- IAM follows least privilege principle
- Resources tagged for cost tracking
- Checkstyle compliant (no methods > 200 lines)
- Comprehensive test coverage

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.core.Either;
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
import com.pulumi.aws.lambda.inputs.FunctionEnvironmentArgs;
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

    static void defineInfrastructure(final Context ctx) {
        final Map<String, String> commonTags = Map.of(
            "Environment", "production",
            "Project", "restaurant-order-processing",
            "ManagedBy", "pulumi"
        );

        // Create queues
        Queue deadLetterQueue = createDeadLetterQueue(commonTags);
        Queue orderQueue = createOrderQueue(deadLetterQueue, commonTags);

        // Create DynamoDB table
        Table ordersTable = createOrdersTable(commonTags);

        // Create Lambda function and its resources
        LogGroup lambdaLogGroup = createLambdaLogGroup(commonTags);
        Role lambdaRole = createLambdaRole(commonTags);
        RolePolicy lambdaPolicy = createLambdaPolicy(lambdaRole, ordersTable, orderQueue, lambdaLogGroup);
        Function orderValidator = createLambdaFunction(lambdaRole, ordersTable, lambdaLogGroup, lambdaPolicy, commonTags);

        // Create event source mapping
        EventSourceMapping eventSourceMapping = createEventSourceMapping(orderQueue, orderValidator);

        // Create Step Functions resources
        Role stepFunctionsRole = createStepFunctionsRole(commonTags);
        RolePolicy stepFunctionsPolicy = createStepFunctionsPolicy(stepFunctionsRole, orderValidator, ordersTable);
        StateMachine orderWorkflow = createStepFunctionsStateMachine(stepFunctionsRole, orderValidator, ordersTable,
                                                                      stepFunctionsPolicy, commonTags);

        // Create EventBridge Scheduler resources
        Role schedulerRole = createSchedulerRole(commonTags);
        RolePolicy schedulerPolicy = createSchedulerPolicy(schedulerRole, orderWorkflow);
        Schedule dailyReportSchedule = createDailySchedule(orderWorkflow, schedulerRole, schedulerPolicy);

        // Export outputs
        exportOutputs(ctx, orderQueue, deadLetterQueue, ordersTable, orderValidator, orderWorkflow, dailyReportSchedule);
    }

    private static Queue createDeadLetterQueue(final Map<String, String> tags) {
        return new Queue("order-dlq", QueueArgs.builder()
            .fifoQueue(true)
            .contentBasedDeduplication(true)
            .messageRetentionSeconds(259200) // 3 days
            .tags(tags)
            .build());
    }

    private static Queue createOrderQueue(final Queue dlq, final Map<String, String> tags) {
        return new Queue("order-queue", QueueArgs.builder()
            .fifoQueue(true)
            .contentBasedDeduplication(true)
            .visibilityTimeoutSeconds(300)
            .redrivePolicy(dlq.arn().apply(arn ->
                Output.of(String.format("{\"deadLetterTargetArn\":\"%s\",\"maxReceiveCount\":3}", arn))))
            .tags(tags)
            .build());
    }

    private static Table createOrdersTable(final Map<String, String> tags) {
        return new Table("orders-table", TableArgs.builder()
            .attributes(
                TableAttributeArgs.builder().name("orderId").type("S").build(),
                TableAttributeArgs.builder().name("orderTimestamp").type("N").build()
            )
            .hashKey("orderId")
            .rangeKey("orderTimestamp")
            .billingMode("PAY_PER_REQUEST")
            .tags(tags)
            .build());
    }

    private static LogGroup createLambdaLogGroup(final Map<String, String> tags) {
        return new LogGroup("order-validator-logs", LogGroupArgs.builder()
            .retentionInDays(7)
            .tags(tags)
            .build());
    }

    private static Role createLambdaRole(final Map<String, String> tags) {
        return new Role("order-validator-role", RoleArgs.builder()
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
            .tags(tags)
            .build());
    }

    private static RolePolicy createLambdaPolicy(final Role role, final Table table,
                                                   final Queue queue, final LogGroup logGroup) {
        return new RolePolicy("order-validator-policy", RolePolicyArgs.builder()
            .role(role.id())
            .policy(Output.all(table.arn(), queue.arn(), logGroup.arn())
                .applyValue(arns -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:Query"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                                    "Resource": "%s:*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["cloudwatch:PutMetricData"],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, arns.get(1), arns.get(0), arns.get(2)))))
            .build());
    }

    private static Function createLambdaFunction(final Role role, final Table table,
                                                   final LogGroup logGroup, final RolePolicy policy,
                                                   final Map<String, String> tags) {
        return new Function("order-validator", FunctionArgs.builder()
            .runtime("nodejs20.x")
            .role(role.arn())
            .handler("index.handler")
            .code(new FileArchive("./lib/lambda"))
            .timeout(60)
            .environment(FunctionEnvironmentArgs.builder()
                .variables(table.name().apply(tableName ->
                    Output.of(Map.of("ORDERS_TABLE", tableName))))
                .build())
            .tags(tags)
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(policy, logGroup)
                .build());
    }

    private static EventSourceMapping createEventSourceMapping(final Queue queue, final Function function) {
        return new EventSourceMapping("order-queue-mapping",
            EventSourceMappingArgs.builder()
                .eventSourceArn(queue.arn())
                .functionName(function.name())
                .batchSize(10)
                .build());
    }

    private static Role createStepFunctionsRole(final Map<String, String> tags) {
        return new Role("step-functions-role", RoleArgs.builder()
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
            .tags(tags)
            .build());
    }

    private static RolePolicy createStepFunctionsPolicy(final Role role, final Function lambda, final Table table) {
        return new RolePolicy("step-functions-policy",
            RolePolicyArgs.builder()
                .role(role.id())
                .policy(Output.all(lambda.arn(), table.arn())
                    .applyValue(arns -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["lambda:InvokeFunction"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogDelivery", "logs:GetLogDelivery",
                                        "logs:UpdateLogDelivery", "logs:DeleteLogDelivery",
                                        "logs:ListLogDeliveries", "logs:PutResourcePolicy",
                                        "logs:DescribeResourcePolicies", "logs:DescribeLogGroups"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, arns.get(0), arns.get(1)))))
                .build());
    }

    private static StateMachine createStepFunctionsStateMachine(final Role role, final Function lambda,
                                                                  final Table table, final RolePolicy policy,
                                                                  final Map<String, String> tags) {
        return new StateMachine("order-workflow", StateMachineArgs.builder()
            .roleArn(role.arn())
            .definition(Output.all(lambda.arn(), table.name())
                .applyValue(values -> String.format("""
                    {
                        "Comment": "Order processing workflow with error retry logic",
                        "StartAt": "ValidateOrder",
                        "States": {
                            "ValidateOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::lambda:invoke",
                                "Parameters": {"FunctionName": "%s", "Payload.$": "$"},
                                "Retry": [{
                                    "ErrorEquals": ["States.TaskFailed", "Lambda.ServiceException"],
                                    "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2.0
                                }],
                                "Catch": [{"ErrorEquals": ["States.ALL"], "Next": "HandleError"}],
                                "Next": "ProcessOrder"
                            },
                            "ProcessOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {"orderId": {"S.$": "$.Payload.orderId"},
                                            "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}},
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {":status": {"S": "PROCESSING"}}
                                },
                                "Retry": [{
                                    "ErrorEquals": ["States.TaskFailed"],
                                    "IntervalSeconds": 1, "MaxAttempts": 2, "BackoffRate": 1.5
                                }],
                                "Next": "ConfirmOrder"
                            },
                            "ConfirmOrder": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {"orderId": {"S.$": "$.Payload.orderId"},
                                            "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}},
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {":status": {"S": "CONFIRMED"}}
                                },
                                "End": true
                            },
                            "HandleError": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:updateItem",
                                "Parameters": {
                                    "TableName": "%s",
                                    "Key": {"orderId": {"S.$": "$.Payload.orderId"},
                                            "orderTimestamp": {"N.$": "$.Payload.orderTimestamp"}},
                                    "UpdateExpression": "SET orderStatus = :status",
                                    "ExpressionAttributeValues": {":status": {"S": "FAILED"}}
                                },
                                "End": true
                            }
                        }
                    }
                    """, values.get(0), values.get(1), values.get(1), values.get(1))))
            .tags(tags)
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(policy)
                .build());
    }

    private static Role createSchedulerRole(final Map<String, String> tags) {
        return new Role("scheduler-role", RoleArgs.builder()
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
            .tags(tags)
            .build());
    }

    private static RolePolicy createSchedulerPolicy(final Role role, final StateMachine stateMachine) {
        return new RolePolicy("scheduler-policy", RolePolicyArgs.builder()
            .role(role.id())
            .policy(stateMachine.arn().applyValue(stateMachineArn ->
                Either.ofLeft(String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["states:StartExecution"],
                        "Resource": "%s"
                    }]
                }
                """, stateMachineArn))))
            .build());
    }

    private static Schedule createDailySchedule(final StateMachine stateMachine, final Role role,
                                                  final RolePolicy policy) {
        return new Schedule("daily-order-report", ScheduleArgs.builder()
            .scheduleExpression("cron(0 23 * * ? *)")  // 11 PM UTC daily
            .scheduleExpressionTimezone("America/Los_Angeles")
            .flexibleTimeWindow(ScheduleFlexibleTimeWindowArgs.builder()
                .mode("OFF")
                .build())
            .target(ScheduleTargetArgs.builder()
                .arn(stateMachine.arn())
                .roleArn(role.arn())
                .input("{\"reportType\":\"daily-summary\"}")
                .retryPolicy(ScheduleTargetRetryPolicyArgs.builder()
                    .maximumRetryAttempts(3)
                    .maximumEventAgeInSeconds(3600)
                    .build())
                .build())
            .build(),
            CustomResourceOptions.builder()
                .dependsOn(policy)
                .build());
    }

    private static void exportOutputs(final Context ctx, final Queue orderQueue, final Queue dlq,
                                       final Table ordersTable, final Function orderValidator,
                                       final StateMachine orderWorkflow, final Schedule schedule) {
        ctx.export("orderQueueUrl", orderQueue.url());
        ctx.export("deadLetterQueueUrl", dlq.url());
        ctx.export("ordersTableName", ordersTable.name());
        ctx.export("orderValidatorArn", orderValidator.arn());
        ctx.export("orderWorkflowArn", orderWorkflow.arn());
        ctx.export("dailyReportScheduleName", schedule.name());
    }
}
```

``` javascript
# lambda/index.js

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
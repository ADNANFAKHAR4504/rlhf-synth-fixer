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
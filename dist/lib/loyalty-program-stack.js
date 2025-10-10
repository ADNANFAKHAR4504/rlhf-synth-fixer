"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyProgramStack = void 0;
const constructs_1 = require("constructs");
const cdktf_1 = require("cdktf");
const dynamodb_table_1 = require("@cdktf/provider-aws/lib/dynamodb-table");
const api_gateway_rest_api_1 = require("@cdktf/provider-aws/lib/api-gateway-rest-api");
const api_gateway_resource_1 = require("@cdktf/provider-aws/lib/api-gateway-resource");
const api_gateway_method_1 = require("@cdktf/provider-aws/lib/api-gateway-method");
const api_gateway_integration_1 = require("@cdktf/provider-aws/lib/api-gateway-integration");
const api_gateway_deployment_1 = require("@cdktf/provider-aws/lib/api-gateway-deployment");
const api_gateway_stage_1 = require("@cdktf/provider-aws/lib/api-gateway-stage");
const api_gateway_request_validator_1 = require("@cdktf/provider-aws/lib/api-gateway-request-validator");
const lambda_function_1 = require("@cdktf/provider-aws/lib/lambda-function");
const lambda_permission_1 = require("@cdktf/provider-aws/lib/lambda-permission");
const lambda_event_source_mapping_1 = require("@cdktf/provider-aws/lib/lambda-event-source-mapping");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const iam_policy_1 = require("@cdktf/provider-aws/lib/iam-policy");
const sns_topic_1 = require("@cdktf/provider-aws/lib/sns-topic");
const cloudwatch_dashboard_1 = require("@cdktf/provider-aws/lib/cloudwatch-dashboard");
const cloudwatch_metric_alarm_1 = require("@cdktf/provider-aws/lib/cloudwatch-metric-alarm");
const cloudwatch_event_rule_1 = require("@cdktf/provider-aws/lib/cloudwatch-event-rule");
const cloudwatch_event_target_1 = require("@cdktf/provider-aws/lib/cloudwatch-event-target");
const data_archive_file_1 = require("@cdktf/provider-archive/lib/data-archive-file");
const provider_1 = require("@cdktf/provider-archive/lib/provider");
const path = __importStar(require("path"));
class LoyaltyProgramStack extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        new provider_1.ArchiveProvider(this, 'archive-provider');
        // DynamoDB Table for Members
        const membersTable = new dynamodb_table_1.DynamodbTable(this, 'members-table', {
            name: `loyalty-members-${props.environmentSuffix}`,
            billingMode: 'PAY_PER_REQUEST',
            hashKey: 'memberId',
            rangeKey: 'transactionId',
            streamEnabled: true,
            streamViewType: 'NEW_AND_OLD_IMAGES',
            attribute: [
                {
                    name: 'memberId',
                    type: 'S',
                },
                {
                    name: 'transactionId',
                    type: 'S',
                },
                {
                    name: 'email',
                    type: 'S',
                },
            ],
            globalSecondaryIndex: [
                {
                    name: 'email-index',
                    hashKey: 'email',
                    projectionType: 'ALL',
                },
            ],
            pointInTimeRecovery: {
                enabled: true,
            },
            serverSideEncryption: {
                enabled: true,
            },
            tags: {
                Name: `loyalty-members-${props.environmentSuffix}`,
            },
        });
        // SNS Topic for Notifications
        const notificationTopic = new sns_topic_1.SnsTopic(this, 'notification-topic', {
            name: `loyalty-notifications-${props.environmentSuffix}`,
            displayName: 'Loyalty Program Notifications',
            kmsMasterKeyId: 'alias/aws/sns',
            tags: {
                Name: `loyalty-notifications-${props.environmentSuffix}`,
            },
        });
        // IAM Role for Point Calculation Lambda
        const pointCalcLambdaRole = new iam_role_1.IamRole(this, 'point-calc-lambda-role', {
            name: `loyalty-point-calc-lambda-${props.environmentSuffix}`,
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
        });
        // IAM Policy for Point Calculation Lambda
        const pointCalcPolicy = new iam_policy_1.IamPolicy(this, 'point-calc-policy', {
            name: `loyalty-point-calc-${props.environmentSuffix}`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'dynamodb:GetItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:Query',
                            'dynamodb:TransactWriteItems',
                        ],
                        Resource: [membersTable.arn, `${membersTable.arn}/index/*`],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['sns:Publish'],
                        Resource: notificationTopic.arn,
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                        ],
                        Resource: 'arn:aws:logs:*:*:*',
                    },
                ],
            }),
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'point-calc-policy-attachment', {
            role: pointCalcLambdaRole.name,
            policyArn: pointCalcPolicy.arn,
        });
        // Package Lambda Functions
        const pointCalcLambdaAsset = new data_archive_file_1.DataArchiveFile(this, 'point-calc-lambda-zip', {
            type: 'zip',
            outputPath: 'point-calc-lambda.zip',
            sourceDir: path.join(__dirname, 'lambda', 'point-calc'),
        });
        // Point Calculation Lambda
        const pointCalcLambda = new lambda_function_1.LambdaFunction(this, 'point-calc-lambda', {
            functionName: `loyalty-point-calc-${props.environmentSuffix}`,
            role: pointCalcLambdaRole.arn,
            handler: 'index.handler',
            runtime: 'nodejs20.x',
            filename: pointCalcLambdaAsset.outputPath,
            sourceCodeHash: pointCalcLambdaAsset.outputBase64Sha256,
            timeout: 30,
            memorySize: 256,
            environment: {
                variables: {
                    LOYALTY_TABLE_NAME: membersTable.name,
                    SNS_TOPIC_ARN: notificationTopic.arn,
                },
            },
        });
        // IAM Role for Stream Processing Lambda
        const streamProcessorRole = new iam_role_1.IamRole(this, 'stream-processor-role', {
            name: `loyalty-stream-processor-${props.environmentSuffix}`,
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
        });
        // IAM Policy for Stream Processing Lambda
        const streamProcessorPolicy = new iam_policy_1.IamPolicy(this, 'stream-processor-policy', {
            name: `loyalty-stream-processor-${props.environmentSuffix}`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'dynamodb:DescribeStream',
                            'dynamodb:GetRecords',
                            'dynamodb:GetShardIterator',
                            'dynamodb:ListStreams',
                        ],
                        Resource: `${membersTable.arn}/stream/*`,
                    },
                    {
                        Effect: 'Allow',
                        Action: ['sns:Publish'],
                        Resource: notificationTopic.arn,
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                        ],
                        Resource: 'arn:aws:logs:*:*:*',
                    },
                ],
            }),
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'stream-processor-policy-attachment', {
            role: streamProcessorRole.name,
            policyArn: streamProcessorPolicy.arn,
        });
        // Stream Processing Lambda Asset
        const streamProcessorLambdaAsset = new data_archive_file_1.DataArchiveFile(this, 'stream-processor-lambda-zip', {
            type: 'zip',
            outputPath: 'stream-processor-lambda.zip',
            sourceDir: path.join(__dirname, 'lambda', 'stream-processor'),
        });
        // Stream Processing Lambda
        const streamProcessorLambda = new lambda_function_1.LambdaFunction(this, 'stream-processor-lambda', {
            functionName: `loyalty-stream-processor-${props.environmentSuffix}`,
            role: streamProcessorRole.arn,
            handler: 'index.handler',
            runtime: 'nodejs20.x',
            filename: streamProcessorLambdaAsset.outputPath,
            sourceCodeHash: streamProcessorLambdaAsset.outputBase64Sha256,
            timeout: 60,
            memorySize: 256,
            environment: {
                variables: {
                    LOYALTY_TABLE_NAME: membersTable.name,
                    SNS_TOPIC_ARN: notificationTopic.arn,
                },
            },
        });
        // DynamoDB Stream Event Source Mapping
        new lambda_event_source_mapping_1.LambdaEventSourceMapping(this, 'stream-event-mapping', {
            eventSourceArn: membersTable.streamArn,
            functionName: streamProcessorLambda.arn,
            startingPosition: 'LATEST',
            maximumBatchingWindowInSeconds: 5,
            parallelizationFactor: 10,
            maximumRetryAttempts: 3,
        });
        // API Gateway
        const api = new api_gateway_rest_api_1.ApiGatewayRestApi(this, 'loyalty-api', {
            name: `loyalty-api-${props.environmentSuffix}`,
            description: 'Loyalty Program API',
            endpointConfiguration: {
                types: ['REGIONAL'],
            },
        });
        // Request Validator
        const requestValidator = new api_gateway_request_validator_1.ApiGatewayRequestValidator(this, 'request-validator', {
            restApiId: api.id,
            name: 'request-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // API Resources
        const transactionsResource = new api_gateway_resource_1.ApiGatewayResource(this, 'transactions-resource', {
            restApiId: api.id,
            parentId: api.rootResourceId,
            pathPart: 'transactions',
        });
        // API Method
        const transactionMethod = new api_gateway_method_1.ApiGatewayMethod(this, 'transaction-method', {
            restApiId: api.id,
            resourceId: transactionsResource.id,
            httpMethod: 'POST',
            authorization: 'NONE',
            requestValidatorId: requestValidator.id,
        });
        // API Integration
        new api_gateway_integration_1.ApiGatewayIntegration(this, 'transaction-integration', {
            restApiId: api.id,
            resourceId: transactionsResource.id,
            httpMethod: transactionMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: pointCalcLambda.invokeArn,
        });
        // Lambda Permission for API Gateway
        new lambda_permission_1.LambdaPermission(this, 'api-lambda-permission', {
            statementId: 'AllowAPIGatewayInvoke',
            action: 'lambda:InvokeFunction',
            functionName: pointCalcLambda.functionName,
            principal: 'apigateway.amazonaws.com',
            sourceArn: `${api.executionArn}/*/*`,
        });
        // API Deployment
        const deployment = new api_gateway_deployment_1.ApiGatewayDeployment(this, 'api-deployment', {
            restApiId: api.id,
            dependsOn: [transactionMethod],
        });
        // API Stage with Throttling
        new api_gateway_stage_1.ApiGatewayStage(this, 'api-stage', {
            deploymentId: deployment.id,
            restApiId: api.id,
            stageName: props.environmentSuffix,
        });
        // EventBridge Rule for Periodic Tier Review
        const tierReviewRule = new cloudwatch_event_rule_1.CloudwatchEventRule(this, 'tier-review-rule', {
            name: `loyalty-tier-review-${props.environmentSuffix}`,
            description: 'Periodic tier review for loyalty members',
            scheduleExpression: 'rate(1 day)',
        });
        new cloudwatch_event_target_1.CloudwatchEventTarget(this, 'tier-review-target', {
            rule: tierReviewRule.name,
            arn: streamProcessorLambda.arn,
        });
        new lambda_permission_1.LambdaPermission(this, 'eventbridge-lambda-permission', {
            statementId: 'AllowEventBridgeInvoke',
            action: 'lambda:InvokeFunction',
            functionName: streamProcessorLambda.functionName,
            principal: 'events.amazonaws.com',
            sourceArn: tierReviewRule.arn,
        });
        // CloudWatch Alarms
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, 'high-transaction-volume-alarm', {
            alarmName: `loyalty-high-transactions-${props.environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'Invocations',
            namespace: 'AWS/Lambda',
            period: 300,
            statistic: 'Sum',
            threshold: 1000,
            alarmDescription: 'Alert when transaction volume is high',
            dimensions: {
                FunctionName: pointCalcLambda.functionName,
            },
        });
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, 'failed-transactions-alarm', {
            alarmName: `loyalty-failed-transactions-${props.environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 1,
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            period: 300,
            statistic: 'Sum',
            threshold: 10,
            alarmDescription: 'Alert when transactions are failing',
            dimensions: {
                FunctionName: pointCalcLambda.functionName,
            },
        });
        // CloudWatch Dashboard
        new cloudwatch_dashboard_1.CloudwatchDashboard(this, 'loyalty-dashboard', {
            dashboardName: `loyalty-metrics-${props.environmentSuffix}`,
            dashboardBody: JSON.stringify({
                widgets: [
                    {
                        type: 'metric',
                        properties: {
                            metrics: [
                                [
                                    'AWS/Lambda',
                                    'Invocations',
                                    { stat: 'Sum', label: 'Total Transactions' },
                                ],
                                ['.', 'Errors', { stat: 'Sum', label: 'Failed Transactions' }],
                                ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-west-2',
                            title: 'Transaction Metrics',
                            period: 300,
                        },
                    },
                    {
                        type: 'metric',
                        properties: {
                            metrics: [
                                ['AWS/DynamoDB', 'UserErrors', { stat: 'Sum' }],
                                ['.', 'SystemErrors', { stat: 'Sum' }],
                                ['.', 'ConsumedReadCapacityUnits', { stat: 'Sum' }],
                                ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-west-2',
                            title: 'DynamoDB Metrics',
                            period: 300,
                        },
                    },
                ],
            }),
        });
        // Outputs
        new cdktf_1.TerraformOutput(this, 'members-table-name', {
            value: membersTable.name,
            description: 'DynamoDB table name for loyalty members',
        });
        new cdktf_1.TerraformOutput(this, 'members-table-arn', {
            value: membersTable.arn,
            description: 'DynamoDB table ARN for loyalty members',
        });
        new cdktf_1.TerraformOutput(this, 'api-endpoint', {
            value: `${api.id}.execute-api.${api.region}.amazonaws.com/${props.environmentSuffix}`,
            description: 'API Gateway endpoint',
        });
        new cdktf_1.TerraformOutput(this, 'api-url', {
            value: `https://${api.id}.execute-api.${api.region}.amazonaws.com/${props.environmentSuffix}/transactions`,
            description: 'Full API URL for transactions endpoint',
        });
        new cdktf_1.TerraformOutput(this, 'point-calc-lambda-name', {
            value: pointCalcLambda.functionName,
            description: 'Point calculation Lambda function name',
        });
        new cdktf_1.TerraformOutput(this, 'point-calc-lambda-arn', {
            value: pointCalcLambda.arn,
            description: 'Point calculation Lambda function ARN',
        });
        new cdktf_1.TerraformOutput(this, 'stream-processor-lambda-name', {
            value: streamProcessorLambda.functionName,
            description: 'Stream processor Lambda function name',
        });
        new cdktf_1.TerraformOutput(this, 'stream-processor-lambda-arn', {
            value: streamProcessorLambda.arn,
            description: 'Stream processor Lambda function ARN',
        });
        new cdktf_1.TerraformOutput(this, 'notification-topic-arn', {
            value: notificationTopic.arn,
            description: 'SNS topic ARN for notifications',
        });
        new cdktf_1.TerraformOutput(this, 'dashboard-name', {
            value: `loyalty-metrics-${props.environmentSuffix}`,
            description: 'CloudWatch dashboard name',
        });
    }
}
exports.LoyaltyProgramStack = LoyaltyProgramStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG95YWx0eS1wcm9ncmFtLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2xveWFsdHktcHJvZ3JhbS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMsaUNBQXdDO0FBQ3hDLDJFQUF1RTtBQUN2RSx1RkFBaUY7QUFDakYsdUZBQWtGO0FBQ2xGLG1GQUE4RTtBQUM5RSw2RkFBd0Y7QUFDeEYsMkZBQXNGO0FBQ3RGLGlGQUE0RTtBQUM1RSx5R0FBbUc7QUFDbkcsNkVBQXlFO0FBQ3pFLGlGQUE2RTtBQUM3RSxxR0FBK0Y7QUFDL0YsK0RBQTJEO0FBQzNELG1HQUE2RjtBQUM3RixtRUFBK0Q7QUFDL0QsaUVBQTZEO0FBQzdELHVGQUFtRjtBQUNuRiw2RkFBd0Y7QUFDeEYseUZBQW9GO0FBQ3BGLDZGQUF3RjtBQUN4RixxRkFBZ0Y7QUFDaEYsbUVBQXVFO0FBQ3ZFLDJDQUE2QjtBQU03QixNQUFhLG1CQUFvQixTQUFRLHNCQUFTO0lBQ2hELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBK0I7UUFDdkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLDBCQUFlLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFOUMsNkJBQTZCO1FBQzdCLE1BQU0sWUFBWSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzVELElBQUksRUFBRSxtQkFBbUIsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQ2xELFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsT0FBTyxFQUFFLFVBQVU7WUFDbkIsUUFBUSxFQUFFLGVBQWU7WUFDekIsYUFBYSxFQUFFLElBQUk7WUFDbkIsY0FBYyxFQUFFLG9CQUFvQjtZQUNwQyxTQUFTLEVBQUU7Z0JBQ1Q7b0JBQ0UsSUFBSSxFQUFF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Q3JELENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDdkQsS0FBSyxFQUFFLHFCQUFxQixDQUFDLEdBQUc7WUFDaEMsV0FBVyxFQUFFLHNDQUFzQztTQUNwRCxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFlLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ2xELEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxHQUFHO1lBQzVCLFdBQVcsRUFBRSxpQ0FBaUM7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBZSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsbUJBQW1CLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtZQUNuRCxXQUFXLEVBQUUsMkJBQTJCO1NBQ3pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhkRCxrREFnZEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IFRlcnJhZm9ybU91dHB1dCB9IGZyb20gJ2Nka3RmJztcbmltcG9ydCB7IER5bmFtb2RiVGFibGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9keW5hbW9kYi10YWJsZSc7XG5pbXBvcnQgeyBBcGlHYXRld2F5UmVzdEFwaSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2FwaS1nYXRld2F5LXJlc3QtYXBpJztcbmltcG9ydCB7IEFwaUdhdGV3YXlSZXNvdXJjZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2FwaS1nYXRld2F5LXJlc291cmNlJztcbmltcG9ydCB7IEFwaUdhdGV3YXlNZXRob2QgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hcGktZ2F0ZXdheS1tZXRob2QnO1xuaW1wb3J0IHsgQXBpR2F0ZXdheUludGVncmF0aW9uIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvYXBpLWdhdGV3YXktaW50ZWdyYXRpb24nO1xuaW1wb3J0IHsgQXBpR2F0ZXdheURlcGxveW1lbnQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hcGktZ2F0ZXdheS1kZXBsb3ltZW50JztcbmltcG9ydCB7IEFwaUdhdGV3YXlTdGFnZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2FwaS1nYXRld2F5LXN0YWdlJztcbmltcG9ydCB7IEFwaUdhdGV3YXlSZXF1ZXN0VmFsaWRhdG9yIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvYXBpLWdhdGV3YXktcmVxdWVzdC12YWxpZGF0b3InO1xuaW1wb3J0IHsgTGFtYmRhRnVuY3Rpb24gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9sYW1iZGEtZnVuY3Rpb24nO1xuaW1wb3J0IHsgTGFtYmRhUGVybWlzc2lvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2xhbWJkYS1wZXJtaXNzaW9uJztcbmltcG9ydCB7IExhbWJkYUV2ZW50U291cmNlTWFwcGluZyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2xhbWJkYS1ldmVudC1zb3VyY2UtbWFwcGluZyc7XG5pbXBvcnQgeyBJYW1Sb2xlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUnO1xuaW1wb3J0IHsgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tcm9sZS1wb2xpY3ktYXR0YWNobWVudCc7XG5pbXBvcnQgeyBJYW1Qb2xpY3kgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tcG9saWN5JztcbmltcG9ydCB7IFNuc1RvcGljIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc25zLXRvcGljJztcbmltcG9ydCB7IENsb3Vkd2F0Y2hEYXNoYm9hcmQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9jbG91ZHdhdGNoLWRhc2hib2FyZCc7XG5pbXBvcnQgeyBDbG91ZHdhdGNoTWV0cmljQWxhcm0gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9jbG91ZHdhdGNoLW1ldHJpYy1hbGFybSc7XG5pbXBvcnQgeyBDbG91ZHdhdGNoRXZlbnRSdWxlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR3YXRjaC1ldmVudC1ydWxlJztcbmltcG9ydCB7IENsb3Vkd2F0Y2hFdmVudFRhcmdldCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2Nsb3Vkd2F0Y2gtZXZlbnQtdGFyZ2V0JztcbmltcG9ydCB7IERhdGFBcmNoaXZlRmlsZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hcmNoaXZlL2xpYi9kYXRhLWFyY2hpdmUtZmlsZSc7XG5pbXBvcnQgeyBBcmNoaXZlUHJvdmlkZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXJjaGl2ZS9saWIvcHJvdmlkZXInO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuaW50ZXJmYWNlIExveWFsdHlQcm9ncmFtU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBMb3lhbHR5UHJvZ3JhbVN0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IExveWFsdHlQcm9ncmFtU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBuZXcgQXJjaGl2ZVByb3ZpZGVyKHRoaXMsICdhcmNoaXZlLXByb3ZpZGVyJyk7XG5cbiAgICAvLyBEeW5hbW9EQiBUYWJsZSBmb3IgTWVtYmVyc1xuICAgIGNvbnN0IG1lbWJlcnNUYWJsZSA9IG5ldyBEeW5hbW9kYlRhYmxlKHRoaXMsICdtZW1iZXJzLXRhYmxlJywge1xuICAgICAgbmFtZTogYGxveWFsdHktbWVtYmVycy0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBiaWxsaW5nTW9kZTogJ1BBWV9QRVJfUkVRVUVTVCcsXG4gICAgICBoYXNoS2V5OiAnbWVtYmVySWQnLFxuICAgICAgcmFuZ2VLZXk6ICd0cmFuc2FjdGlvbklkJyxcbiAgICAgIHN0cmVhbUVuYWJsZWQ6IHRydWUsXG4gICAgICBzdHJlYW1WaWV3VHlwZTogJ05FV19BTkRfT0xEX0lNQUdFUycsXG4gICAgICBhdHRyaWJ1dGU6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdtZW1iZXJJZCcsXG4gICAgICAgICAgdHlwZTogJ1MnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3RyYW5zYWN0aW9uSWQnLFxuICAgICAgICAgIHR5cGU6ICdTJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdlbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ1MnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnZW1haWwtaW5kZXgnLFxuICAgICAgICAgIGhhc2hLZXk6ICdlbWFpbCcsXG4gICAgICAgICAgcHJvamVjdGlvblR5cGU6ICdBTEwnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzZXJ2ZXJTaWRlRW5jcnlwdGlvbjoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogYGxveWFsdHktbWVtYmVycy0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBOb3RpZmljYXRpb25zXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uVG9waWMgPSBuZXcgU25zVG9waWModGhpcywgJ25vdGlmaWNhdGlvbi10b3BpYycsIHtcbiAgICAgIG5hbWU6IGBsb3lhbHR5LW5vdGlmaWNhdGlvbnMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGlzcGxheU5hbWU6ICdMb3lhbHR5IFByb2dyYW0gTm90aWZpY2F0aW9ucycsXG4gICAgICBrbXNNYXN0ZXJLZXlJZDogJ2FsaWFzL2F3cy9zbnMnLFxuICAgICAgdGFnczoge1xuICAgICAgICBOYW1lOiBgbG95YWx0eS1ub3RpZmljYXRpb25zLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUm9sZSBmb3IgUG9pbnQgQ2FsY3VsYXRpb24gTGFtYmRhXG4gICAgY29uc3QgcG9pbnRDYWxjTGFtYmRhUm9sZSA9IG5ldyBJYW1Sb2xlKHRoaXMsICdwb2ludC1jYWxjLWxhbWJkYS1yb2xlJywge1xuICAgICAgbmFtZTogYGxveWFsdHktcG9pbnQtY2FsYy1sYW1iZGEtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICBTZXJ2aWNlOiAnbGFtYmRhLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUG9saWN5IGZvciBQb2ludCBDYWxjdWxhdGlvbiBMYW1iZGFcbiAgICBjb25zdCBwb2ludENhbGNQb2xpY3kgPSBuZXcgSWFtUG9saWN5KHRoaXMsICdwb2ludC1jYWxjLXBvbGljeScsIHtcbiAgICAgIG5hbWU6IGBsb3lhbHR5LXBvaW50LWNhbGMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICdkeW5hbW9kYjpHZXRJdGVtJyxcbiAgICAgICAgICAgICAgJ2R5bmFtb2RiOlB1dEl0ZW0nLFxuICAgICAgICAgICAgICAnZHluYW1vZGI6VXBkYXRlSXRlbScsXG4gICAgICAgICAgICAgICdkeW5hbW9kYjpRdWVyeScsXG4gICAgICAgICAgICAgICdkeW5hbW9kYjpUcmFuc2FjdFdyaXRlSXRlbXMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiBbbWVtYmVyc1RhYmxlLmFybiwgYCR7bWVtYmVyc1RhYmxlLmFybn0vaW5kZXgvKmBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbJ3NuczpQdWJsaXNoJ10sXG4gICAgICAgICAgICBSZXNvdXJjZTogbm90aWZpY2F0aW9uVG9waWMuYXJuLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6bG9nczoqOio6KicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgbmV3IElhbVJvbGVQb2xpY3lBdHRhY2htZW50KHRoaXMsICdwb2ludC1jYWxjLXBvbGljeS1hdHRhY2htZW50Jywge1xuICAgICAgcm9sZTogcG9pbnRDYWxjTGFtYmRhUm9sZS5uYW1lLFxuICAgICAgcG9saWN5QXJuOiBwb2ludENhbGNQb2xpY3kuYXJuLFxuICAgIH0pO1xuXG4gICAgLy8gUGFja2FnZSBMYW1iZGEgRnVuY3Rpb25zXG4gICAgY29uc3QgcG9pbnRDYWxjTGFtYmRhQXNzZXQgPSBuZXcgRGF0YUFyY2hpdmVGaWxlKFxuICAgICAgdGhpcyxcbiAgICAgICdwb2ludC1jYWxjLWxhbWJkYS16aXAnLFxuICAgICAge1xuICAgICAgICB0eXBlOiAnemlwJyxcbiAgICAgICAgb3V0cHV0UGF0aDogJ3BvaW50LWNhbGMtbGFtYmRhLnppcCcsXG4gICAgICAgIHNvdXJjZURpcjogcGF0aC5qb2luKF9fZGlybmFtZSwgJ2xhbWJkYScsICdwb2ludC1jYWxjJyksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBvaW50IENhbGN1bGF0aW9uIExhbWJkYVxuICAgIGNvbnN0IHBvaW50Q2FsY0xhbWJkYSA9IG5ldyBMYW1iZGFGdW5jdGlvbih0aGlzLCAncG9pbnQtY2FsYy1sYW1iZGEnLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBsb3lhbHR5LXBvaW50LWNhbGMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcm9sZTogcG9pbnRDYWxjTGFtYmRhUm9sZS5hcm4sXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBydW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICBmaWxlbmFtZTogcG9pbnRDYWxjTGFtYmRhQXNzZXQub3V0cHV0UGF0aCxcbiAgICAgIHNvdXJjZUNvZGVIYXNoOiBwb2ludENhbGNMYW1iZGFBc3NldC5vdXRwdXRCYXNlNjRTaGEyNTYsXG4gICAgICB0aW1lb3V0OiAzMCxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgIExPWUFMVFlfVEFCTEVfTkFNRTogbWVtYmVyc1RhYmxlLm5hbWUsXG4gICAgICAgICAgU05TX1RPUElDX0FSTjogbm90aWZpY2F0aW9uVG9waWMuYXJuLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIElBTSBSb2xlIGZvciBTdHJlYW0gUHJvY2Vzc2luZyBMYW1iZGFcbiAgICBjb25zdCBzdHJlYW1Qcm9jZXNzb3JSb2xlID0gbmV3IElhbVJvbGUodGhpcywgJ3N0cmVhbS1wcm9jZXNzb3Itcm9sZScsIHtcbiAgICAgIG5hbWU6IGBsb3lhbHR5LXN0cmVhbS1wcm9jZXNzb3ItJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICBTZXJ2aWNlOiAnbGFtYmRhLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUG9saWN5IGZvciBTdHJlYW0gUHJvY2Vzc2luZyBMYW1iZGFcbiAgICBjb25zdCBzdHJlYW1Qcm9jZXNzb3JQb2xpY3kgPSBuZXcgSWFtUG9saWN5KFxuICAgICAgdGhpcyxcbiAgICAgICdzdHJlYW0tcHJvY2Vzc29yLXBvbGljeScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBsb3lhbHR5LXN0cmVhbS1wcm9jZXNzb3ItJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOkRlc2NyaWJlU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6R2V0UmVjb3JkcycsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOkdldFNoYXJkSXRlcmF0b3InLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpMaXN0U3RyZWFtcycsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiBgJHttZW1iZXJzVGFibGUuYXJufS9zdHJlYW0vKmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzbnM6UHVibGlzaCddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogbm90aWZpY2F0aW9uVG9waWMuYXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6bG9nczoqOio6KicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBuZXcgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQodGhpcywgJ3N0cmVhbS1wcm9jZXNzb3ItcG9saWN5LWF0dGFjaG1lbnQnLCB7XG4gICAgICByb2xlOiBzdHJlYW1Qcm9jZXNzb3JSb2xlLm5hbWUsXG4gICAgICBwb2xpY3lBcm46IHN0cmVhbVByb2Nlc3NvclBvbGljeS5hcm4sXG4gICAgfSk7XG5cbiAgICAvLyBTdHJlYW0gUHJvY2Vzc2luZyBMYW1iZGEgQXNzZXRcbiAgICBjb25zdCBzdHJlYW1Qcm9jZXNzb3JMYW1iZGFBc3NldCA9IG5ldyBEYXRhQXJjaGl2ZUZpbGUoXG4gICAgICB0aGlzLFxuICAgICAgJ3N0cmVhbS1wcm9jZXNzb3ItbGFtYmRhLXppcCcsXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICd6aXAnLFxuICAgICAgICBvdXRwdXRQYXRoOiAnc3RyZWFtLXByb2Nlc3Nvci1sYW1iZGEuemlwJyxcbiAgICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGFtYmRhJywgJ3N0cmVhbS1wcm9jZXNzb3InKSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gU3RyZWFtIFByb2Nlc3NpbmcgTGFtYmRhXG4gICAgY29uc3Qgc3RyZWFtUHJvY2Vzc29yTGFtYmRhID0gbmV3IExhbWJkYUZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdzdHJlYW0tcHJvY2Vzc29yLWxhbWJkYScsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYGxveWFsdHktc3RyZWFtLXByb2Nlc3Nvci0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHJvbGU6IHN0cmVhbVByb2Nlc3NvclJvbGUuYXJuLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIHJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgICAgZmlsZW5hbWU6IHN0cmVhbVByb2Nlc3NvckxhbWJkYUFzc2V0Lm91dHB1dFBhdGgsXG4gICAgICAgIHNvdXJjZUNvZGVIYXNoOiBzdHJlYW1Qcm9jZXNzb3JMYW1iZGFBc3NldC5vdXRwdXRCYXNlNjRTaGEyNTYsXG4gICAgICAgIHRpbWVvdXQ6IDYwLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBMT1lBTFRZX1RBQkxFX05BTUU6IG1lbWJlcnNUYWJsZS5uYW1lLFxuICAgICAgICAgICAgU05TX1RPUElDX0FSTjogbm90aWZpY2F0aW9uVG9waWMuYXJuLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIER5bmFtb0RCIFN0cmVhbSBFdmVudCBTb3VyY2UgTWFwcGluZ1xuICAgIG5ldyBMYW1iZGFFdmVudFNvdXJjZU1hcHBpbmcodGhpcywgJ3N0cmVhbS1ldmVudC1tYXBwaW5nJywge1xuICAgICAgZXZlbnRTb3VyY2VBcm46IG1lbWJlcnNUYWJsZS5zdHJlYW1Bcm4hLFxuICAgICAgZnVuY3Rpb25OYW1lOiBzdHJlYW1Qcm9jZXNzb3JMYW1iZGEuYXJuLFxuICAgICAgc3RhcnRpbmdQb3NpdGlvbjogJ0xBVEVTVCcsXG4gICAgICBtYXhpbXVtQmF0Y2hpbmdXaW5kb3dJblNlY29uZHM6IDUsXG4gICAgICBwYXJhbGxlbGl6YXRpb25GYWN0b3I6IDEwLFxuICAgICAgbWF4aW11bVJldHJ5QXR0ZW1wdHM6IDMsXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBBcGlHYXRld2F5UmVzdEFwaSh0aGlzLCAnbG95YWx0eS1hcGknLCB7XG4gICAgICBuYW1lOiBgbG95YWx0eS1hcGktJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMb3lhbHR5IFByb2dyYW0gQVBJJyxcbiAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xuICAgICAgICB0eXBlczogWydSRUdJT05BTCddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFJlcXVlc3QgVmFsaWRhdG9yXG4gICAgY29uc3QgcmVxdWVzdFZhbGlkYXRvciA9IG5ldyBBcGlHYXRld2F5UmVxdWVzdFZhbGlkYXRvcihcbiAgICAgIHRoaXMsXG4gICAgICAncmVxdWVzdC12YWxpZGF0b3InLFxuICAgICAge1xuICAgICAgICByZXN0QXBpSWQ6IGFwaS5pZCxcbiAgICAgICAgbmFtZTogJ3JlcXVlc3QtdmFsaWRhdG9yJyxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQVBJIFJlc291cmNlc1xuICAgIGNvbnN0IHRyYW5zYWN0aW9uc1Jlc291cmNlID0gbmV3IEFwaUdhdGV3YXlSZXNvdXJjZShcbiAgICAgIHRoaXMsXG4gICAgICAndHJhbnNhY3Rpb25zLXJlc291cmNlJyxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaUlkOiBhcGkuaWQsXG4gICAgICAgIHBhcmVudElkOiBhcGkucm9vdFJlc291cmNlSWQsXG4gICAgICAgIHBhdGhQYXJ0OiAndHJhbnNhY3Rpb25zJyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQVBJIE1ldGhvZFxuICAgIGNvbnN0IHRyYW5zYWN0aW9uTWV0aG9kID0gbmV3IEFwaUdhdGV3YXlNZXRob2QodGhpcywgJ3RyYW5zYWN0aW9uLW1ldGhvZCcsIHtcbiAgICAgIHJlc3RBcGlJZDogYXBpLmlkLFxuICAgICAgcmVzb3VyY2VJZDogdHJhbnNhY3Rpb25zUmVzb3VyY2UuaWQsXG4gICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXG4gICAgICBhdXRob3JpemF0aW9uOiAnTk9ORScsXG4gICAgICByZXF1ZXN0VmFsaWRhdG9ySWQ6IHJlcXVlc3RWYWxpZGF0b3IuaWQsXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgSW50ZWdyYXRpb25cbiAgICBuZXcgQXBpR2F0ZXdheUludGVncmF0aW9uKHRoaXMsICd0cmFuc2FjdGlvbi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgIHJlc3RBcGlJZDogYXBpLmlkLFxuICAgICAgcmVzb3VyY2VJZDogdHJhbnNhY3Rpb25zUmVzb3VyY2UuaWQsXG4gICAgICBodHRwTWV0aG9kOiB0cmFuc2FjdGlvbk1ldGhvZC5odHRwTWV0aG9kLFxuICAgICAgaW50ZWdyYXRpb25IdHRwTWV0aG9kOiAnUE9TVCcsXG4gICAgICB0eXBlOiAnQVdTX1BST1hZJyxcbiAgICAgIHVyaTogcG9pbnRDYWxjTGFtYmRhLmludm9rZUFybixcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBQZXJtaXNzaW9uIGZvciBBUEkgR2F0ZXdheVxuICAgIG5ldyBMYW1iZGFQZXJtaXNzaW9uKHRoaXMsICdhcGktbGFtYmRhLXBlcm1pc3Npb24nLCB7XG4gICAgICBzdGF0ZW1lbnRJZDogJ0FsbG93QVBJR2F0ZXdheUludm9rZScsXG4gICAgICBhY3Rpb246ICdsYW1iZGE6SW52b2tlRnVuY3Rpb24nLFxuICAgICAgZnVuY3Rpb25OYW1lOiBwb2ludENhbGNMYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgcHJpbmNpcGFsOiAnYXBpZ2F0ZXdheS5hbWF6b25hd3MuY29tJyxcbiAgICAgIHNvdXJjZUFybjogYCR7YXBpLmV4ZWN1dGlvbkFybn0vKi8qYCxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBEZXBsb3ltZW50XG4gICAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBBcGlHYXRld2F5RGVwbG95bWVudCh0aGlzLCAnYXBpLWRlcGxveW1lbnQnLCB7XG4gICAgICByZXN0QXBpSWQ6IGFwaS5pZCxcbiAgICAgIGRlcGVuZHNPbjogW3RyYW5zYWN0aW9uTWV0aG9kXSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBTdGFnZSB3aXRoIFRocm90dGxpbmdcbiAgICBuZXcgQXBpR2F0ZXdheVN0YWdlKHRoaXMsICdhcGktc3RhZ2UnLCB7XG4gICAgICBkZXBsb3ltZW50SWQ6IGRlcGxveW1lbnQuaWQsXG4gICAgICByZXN0QXBpSWQ6IGFwaS5pZCxcbiAgICAgIHN0YWdlTmFtZTogcHJvcHMuZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgfSk7XG5cbiAgICAvLyBFdmVudEJyaWRnZSBSdWxlIGZvciBQZXJpb2RpYyBUaWVyIFJldmlld1xuICAgIGNvbnN0IHRpZXJSZXZpZXdSdWxlID0gbmV3IENsb3Vkd2F0Y2hFdmVudFJ1bGUodGhpcywgJ3RpZXItcmV2aWV3LXJ1bGUnLCB7XG4gICAgICBuYW1lOiBgbG95YWx0eS10aWVyLXJldmlldy0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1BlcmlvZGljIHRpZXIgcmV2aWV3IGZvciBsb3lhbHR5IG1lbWJlcnMnLFxuICAgICAgc2NoZWR1bGVFeHByZXNzaW9uOiAncmF0ZSgxIGRheSknLFxuICAgIH0pO1xuXG4gICAgbmV3IENsb3Vkd2F0Y2hFdmVudFRhcmdldCh0aGlzLCAndGllci1yZXZpZXctdGFyZ2V0Jywge1xuICAgICAgcnVsZTogdGllclJldmlld1J1bGUubmFtZSxcbiAgICAgIGFybjogc3RyZWFtUHJvY2Vzc29yTGFtYmRhLmFybixcbiAgICB9KTtcblxuICAgIG5ldyBMYW1iZGFQZXJtaXNzaW9uKHRoaXMsICdldmVudGJyaWRnZS1sYW1iZGEtcGVybWlzc2lvbicsIHtcbiAgICAgIHN0YXRlbWVudElkOiAnQWxsb3dFdmVudEJyaWRnZUludm9rZScsXG4gICAgICBhY3Rpb246ICdsYW1iZGE6SW52b2tlRnVuY3Rpb24nLFxuICAgICAgZnVuY3Rpb25OYW1lOiBzdHJlYW1Qcm9jZXNzb3JMYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgcHJpbmNpcGFsOiAnZXZlbnRzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgc291cmNlQXJuOiB0aWVyUmV2aWV3UnVsZS5hcm4sXG4gICAgfSk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIEFsYXJtc1xuICAgIG5ldyBDbG91ZHdhdGNoTWV0cmljQWxhcm0odGhpcywgJ2hpZ2gtdHJhbnNhY3Rpb24tdm9sdW1lLWFsYXJtJywge1xuICAgICAgYWxhcm1OYW1lOiBgbG95YWx0eS1oaWdoLXRyYW5zYWN0aW9ucy0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgIG1ldHJpY05hbWU6ICdJbnZvY2F0aW9ucycsXG4gICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgIHRocmVzaG9sZDogMTAwMCxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCB3aGVuIHRyYW5zYWN0aW9uIHZvbHVtZSBpcyBoaWdoJyxcbiAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgRnVuY3Rpb25OYW1lOiBwb2ludENhbGNMYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBDbG91ZHdhdGNoTWV0cmljQWxhcm0odGhpcywgJ2ZhaWxlZC10cmFuc2FjdGlvbnMtYWxhcm0nLCB7XG4gICAgICBhbGFybU5hbWU6IGBsb3lhbHR5LWZhaWxlZC10cmFuc2FjdGlvbnMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcbiAgICAgIG5hbWVzcGFjZTogJ0FXUy9MYW1iZGEnLFxuICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCB3aGVuIHRyYW5zYWN0aW9ucyBhcmUgZmFpbGluZycsXG4gICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgIEZ1bmN0aW9uTmFtZTogcG9pbnRDYWxjTGFtYmRhLmZ1bmN0aW9uTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIERhc2hib2FyZFxuICAgIG5ldyBDbG91ZHdhdGNoRGFzaGJvYXJkKHRoaXMsICdsb3lhbHR5LWRhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IGBsb3lhbHR5LW1ldHJpY3MtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGFzaGJvYXJkQm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICAgICAgICAnSW52b2NhdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgeyBzdGF0OiAnU3VtJywgbGFiZWw6ICdUb3RhbCBUcmFuc2FjdGlvbnMnIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBbJy4nLCAnRXJyb3JzJywgeyBzdGF0OiAnU3VtJywgbGFiZWw6ICdGYWlsZWQgVHJhbnNhY3Rpb25zJyB9XSxcbiAgICAgICAgICAgICAgICBbJy4nLCAnRHVyYXRpb24nLCB7IHN0YXQ6ICdBdmVyYWdlJywgbGFiZWw6ICdBdmcgRHVyYXRpb24nIH1dLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB2aWV3OiAndGltZVNlcmllcycsXG4gICAgICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICByZWdpb246ICd1cy13ZXN0LTInLFxuICAgICAgICAgICAgICB0aXRsZTogJ1RyYW5zYWN0aW9uIE1ldHJpY3MnLFxuICAgICAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnbWV0cmljJyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICAgIFsnQVdTL0R5bmFtb0RCJywgJ1VzZXJFcnJvcnMnLCB7IHN0YXQ6ICdTdW0nIH1dLFxuICAgICAgICAgICAgICAgIFsnLicsICdTeXN0ZW1FcnJvcnMnLCB7IHN0YXQ6ICdTdW0nIH1dLFxuICAgICAgICAgICAgICAgIFsnLicsICdDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzJywgeyBzdGF0OiAnU3VtJyB9XSxcbiAgICAgICAgICAgICAgICBbJy4nLCAnQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHMnLCB7IHN0YXQ6ICdTdW0nIH1dLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB2aWV3OiAndGltZVNlcmllcycsXG4gICAgICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICByZWdpb246ICd1cy13ZXN0LTInLFxuICAgICAgICAgICAgICB0aXRsZTogJ0R5bmFtb0RCIE1ldHJpY3MnLFxuICAgICAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ21lbWJlcnMtdGFibGUtbmFtZScsIHtcbiAgICAgIHZhbHVlOiBtZW1iZXJzVGFibGUubmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgdGFibGUgbmFtZSBmb3IgbG95YWx0eSBtZW1iZXJzJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ21lbWJlcnMtdGFibGUtYXJuJywge1xuICAgICAgdmFsdWU6IG1lbWJlcnNUYWJsZS5hcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHRhYmxlIEFSTiBmb3IgbG95YWx0eSBtZW1iZXJzJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ2FwaS1lbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiBgJHthcGkuaWR9LmV4ZWN1dGUtYXBpLiR7YXBpLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IGVuZHBvaW50JyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ2FwaS11cmwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHthcGkuaWR9LmV4ZWN1dGUtYXBpLiR7YXBpLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fS90cmFuc2FjdGlvbnNgLFxuICAgICAgZGVzY3JpcHRpb246ICdGdWxsIEFQSSBVUkwgZm9yIHRyYW5zYWN0aW9ucyBlbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdwb2ludC1jYWxjLWxhbWJkYS1uYW1lJywge1xuICAgICAgdmFsdWU6IHBvaW50Q2FsY0xhbWJkYS5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1BvaW50IGNhbGN1bGF0aW9uIExhbWJkYSBmdW5jdGlvbiBuYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ3BvaW50LWNhbGMtbGFtYmRhLWFybicsIHtcbiAgICAgIHZhbHVlOiBwb2ludENhbGNMYW1iZGEuYXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdQb2ludCBjYWxjdWxhdGlvbiBMYW1iZGEgZnVuY3Rpb24gQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ3N0cmVhbS1wcm9jZXNzb3ItbGFtYmRhLW5hbWUnLCB7XG4gICAgICB2YWx1ZTogc3RyZWFtUHJvY2Vzc29yTGFtYmRhLmZ1bmN0aW9uTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3RyZWFtIHByb2Nlc3NvciBMYW1iZGEgZnVuY3Rpb24gbmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdzdHJlYW0tcHJvY2Vzc29yLWxhbWJkYS1hcm4nLCB7XG4gICAgICB2YWx1ZTogc3RyZWFtUHJvY2Vzc29yTGFtYmRhLmFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3RyZWFtIHByb2Nlc3NvciBMYW1iZGEgZnVuY3Rpb24gQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ25vdGlmaWNhdGlvbi10b3BpYy1hcm4nLCB7XG4gICAgICB2YWx1ZTogbm90aWZpY2F0aW9uVG9waWMuYXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdTTlMgdG9waWMgQVJOIGZvciBub3RpZmljYXRpb25zJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ2Rhc2hib2FyZC1uYW1lJywge1xuICAgICAgdmFsdWU6IGBsb3lhbHR5LW1ldHJpY3MtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZFdhdGNoIGRhc2hib2FyZCBuYW1lJyxcbiAgICB9KTtcbiAgfVxufVxuIl19
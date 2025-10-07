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
exports.FoodDeliveryStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const ssm = __importStar(require("aws-cdk-lib/aws-ssm"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const path = __importStar(require("path"));
class FoodDeliveryStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Dead Letter Queue for failed order processing
        const deadLetterQueue = new sqs.Queue(this, 'OrderProcessingDLQ', {
            queueName: `food-delivery-dlq-${this.stackName}`,
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.KMS_MANAGED,
        });
        // DynamoDB Table with auto-scaling
        const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
            tableName: `food-delivery-orders-${this.stackName}`,
            partitionKey: {
                name: 'orderId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.NUMBER,
            },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            writeCapacity: 5,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        });
        // Global Secondary Index for customer queries
        ordersTable.addGlobalSecondaryIndex({
            indexName: 'customerIdIndex',
            partitionKey: {
                name: 'customerId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.NUMBER,
            },
            readCapacity: 5,
            writeCapacity: 5,
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Auto-scaling configuration
        const readScaling = ordersTable.autoScaleReadCapacity({
            minCapacity: 5,
            maxCapacity: 100,
        });
        readScaling.scaleOnUtilization({
            targetUtilizationPercent: 70,
        });
        const writeScaling = ordersTable.autoScaleWriteCapacity({
            minCapacity: 5,
            maxCapacity: 100,
        });
        writeScaling.scaleOnUtilization({
            targetUtilizationPercent: 70,
        });
        // SNS Topic for alerts
        const alertTopic = new sns.Topic(this, 'FoodDeliveryAlerts', {
            displayName: 'Food Delivery API Alerts',
        });
        // Parameter Store configurations
        const tableNameParameter = new ssm.StringParameter(this, 'TableNameParameter', {
            parameterName: `/food-delivery/${this.stackName}/table-name`,
            stringValue: ordersTable.tableName,
            description: 'DynamoDB table name for orders',
        });
        const apiConfigParameter = new ssm.StringParameter(this, 'ApiConfigParameter', {
            parameterName: `/food-delivery/${this.stackName}/api-config`,
            stringValue: JSON.stringify({
                maxOrdersPerHour: 150,
                defaultTimeout: 500,
                retryAttempts: 3,
            }),
            description: 'API configuration parameters',
        });
        const featureFlagsParameter = new ssm.StringParameter(this, 'FeatureFlagsParameter', {
            parameterName: `/food-delivery/${this.stackName}/feature-flags`,
            stringValue: JSON.stringify({
                expressDelivery: false,
                loyaltyProgram: true,
                multiplePayments: false,
            }),
            description: 'Feature flags for gradual rollouts',
            // Note: Removed deprecated 'type' property - defaults to String parameter
        });
        // Lambda Execution Role with least privilege
        const lambdaRole = new iam.Role(this, 'OrderProcessingRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });
        // DynamoDB permissions
        ordersTable.grantReadWriteData(lambdaRole);
        // Parameter Store permissions
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [
                tableNameParameter.parameterArn,
                apiConfigParameter.parameterArn,
                featureFlagsParameter.parameterArn,
            ],
        }));
        // SQS permissions for DLQ
        deadLetterQueue.grantSendMessages(lambdaRole);
        // Order Processing Lambda Function
        const orderProcessingFunction = new lambda.Function(this, 'OrderProcessingFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            functionName: `food-delivery-processor-${this.stackName}`,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            role: lambdaRole,
            environment: {
                TABLE_NAME: ordersTable.tableName,
                DLQ_URL: deadLetterQueue.queueUrl,
                TABLE_NAME_PARAM: tableNameParameter.parameterName,
                API_CONFIG_PARAM: apiConfigParameter.parameterName,
                FEATURE_FLAGS_PARAM: featureFlagsParameter.parameterName,
                POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
                POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
                LOG_LEVEL: 'INFO',
            },
            reservedConcurrentExecutions: 100,
            tracing: lambda.Tracing.ACTIVE,
            deadLetterQueue: deadLetterQueue,
            deadLetterQueueEnabled: true,
        });
        // Query Orders Lambda Function
        const queryOrdersFunction = new lambda.Function(this, 'QueryOrdersFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            functionName: `food-delivery-query-${this.stackName}`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 512,
            role: lambdaRole,
            environment: {
                TABLE_NAME: ordersTable.tableName,
                POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
                POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
                LOG_LEVEL: 'INFO',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        // API Gateway REST API
        const api = new apigateway.RestApi(this, 'FoodDeliveryApi', {
            restApiName: `food-delivery-api-${this.stackName}`,
            description: 'Food Delivery REST API',
            deployOptions: {
                stageName: 'prod',
                tracingEnabled: true,
                dataTraceEnabled: true,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                metricsEnabled: true,
                throttlingBurstLimit: 200,
                throttlingRateLimit: 100,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Api-Key', 'Authorization'],
                maxAge: cdk.Duration.hours(1),
            },
        });
        // API Key for partner integrations
        const apiKey = new apigateway.ApiKey(this, 'FoodDeliveryApiKey', {
            apiKeyName: `food-delivery-key-${this.stackName}`,
            description: 'API key for partner integrations',
        });
        const usagePlan = new apigateway.UsagePlan(this, 'FoodDeliveryUsagePlan', {
            name: `food-delivery-usage-${this.stackName}`,
            apiStages: [
                {
                    api: api,
                    stage: api.deploymentStage,
                },
            ],
            throttle: {
                rateLimit: 100,
                burstLimit: 200,
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.DAY,
            },
        });
        usagePlan.addApiKey(apiKey);
        // Request Validator
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: api,
            requestValidatorName: 'validate-request-body-and-params',
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // Order Model for validation
        const orderModel = new apigateway.Model(this, 'OrderModel', {
            restApi: api,
            contentType: 'application/json',
            modelName: 'OrderModel',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['customerId', 'items', 'deliveryAddress'],
                properties: {
                    customerId: {
                        type: apigateway.JsonSchemaType.STRING,
                        minLength: 1,
                    },
                    items: {
                        type: apigateway.JsonSchemaType.ARRAY,
                        minItems: 1,
                        items: {
                            type: apigateway.JsonSchemaType.OBJECT,
                            required: ['productId', 'quantity', 'price'],
                            properties: {
                                productId: { type: apigateway.JsonSchemaType.STRING },
                                quantity: {
                                    type: apigateway.JsonSchemaType.INTEGER,
                                    minimum: 1,
                                },
                                price: { type: apigateway.JsonSchemaType.NUMBER },
                            },
                        },
                    },
                    deliveryAddress: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        required: ['street', 'city', 'zipCode'],
                        properties: {
                            street: { type: apigateway.JsonSchemaType.STRING },
                            city: { type: apigateway.JsonSchemaType.STRING },
                            zipCode: { type: apigateway.JsonSchemaType.STRING },
                        },
                    },
                },
            },
        });
        // API Resources and Methods
        const orders = api.root.addResource('orders');
        // POST /orders - Create order
        orders.addMethod('POST', new apigateway.LambdaIntegration(orderProcessingFunction), {
            apiKeyRequired: true,
            requestValidator: requestValidator,
            requestModels: {
                'application/json': orderModel,
            },
        });
        // GET /orders/{orderId} - Get order
        const orderById = orders.addResource('{orderId}');
        orderById.addMethod('GET', new apigateway.LambdaIntegration(queryOrdersFunction), {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.orderId': true,
            },
        });
        // PUT /orders/{orderId} - Update order
        orderById.addMethod('PUT', new apigateway.LambdaIntegration(orderProcessingFunction), {
            apiKeyRequired: true,
            requestValidator: requestValidator,
            requestModels: {
                'application/json': orderModel,
            },
        });
        // GET /orders/customer/{customerId} - Get customer orders
        const customerOrders = orders
            .addResource('customer')
            .addResource('{customerId}');
        customerOrders.addMethod('GET', new apigateway.LambdaIntegration(queryOrdersFunction), {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.customerId': true,
            },
        });
        // CloudWatch Alarms
        const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
            metric: orderProcessingFunction.metricErrors({
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
            }),
            threshold: 1,
            evaluationPeriods: 2,
            alarmDescription: 'Alert when error rate exceeds 1%',
        });
        errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        const latencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
            metric: orderProcessingFunction.metricDuration({
                statistic: 'p95',
                period: cdk.Duration.minutes(5),
            }),
            threshold: 500,
            evaluationPeriods: 2,
            alarmDescription: 'Alert when 95th percentile latency exceeds 500ms',
        });
        latencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        // CloudWatch Dashboard
        const dashboard = new cloudwatch.Dashboard(this, 'FoodDeliveryDashboard', {
            dashboardName: `food-delivery-dashboard-${this.stackName}`,
        });
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [api.metricCount()],
            right: [api.metricClientError(), api.metricServerError()],
        }), new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [
                orderProcessingFunction.metricInvocations(),
                queryOrdersFunction.metricInvocations(),
            ],
        }), new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: [
                orderProcessingFunction.metricDuration(),
                queryOrdersFunction.metricDuration(),
            ],
        }), new cloudwatch.GraphWidget({
            title: 'DynamoDB Metrics',
            left: [
                ordersTable.metricConsumedReadCapacityUnits(),
                ordersTable.metricConsumedWriteCapacityUnits(),
            ],
        }));
        // Outputs
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'Food Delivery API URL',
        });
        new cdk.CfnOutput(this, 'ApiKeyId', {
            value: apiKey.keyId,
            description: 'API Key ID for partner integrations',
        });
        new cdk.CfnOutput(this, 'DashboardUrl', {
            value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
            description: 'CloudWatch Dashboard URL',
        });
    }
}
exports.FoodDeliveryStack = FoodDeliveryStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9vZC1kZWxpdmVyeS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9mb29kLWRlbGl2ZXJ5LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsbUVBQXFEO0FBQ3JELCtEQUFpRDtBQUNqRCx5REFBMkM7QUFDM0MsdUVBQXlEO0FBQ3pELHNGQUF3RTtBQUN4RSx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLHlEQUEyQztBQUUzQywyQ0FBNkI7QUFFN0IsTUFBYSxpQkFBa0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGdEQUFnRDtRQUNoRCxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQ2hFLFNBQVMsRUFBRSxxQkFBcUIsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNoRCxlQUFlLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3RDLFVBQVUsRUFBRSxHQUFHLENBQUMsZUFBZSxDQUFDLFdBQVc7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsbUNBQW1DO1FBQ25DLE1BQU0sV0FBVyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzFELFNBQVMsRUFBRSx3QkFBd0IsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuRCxZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELE9BQU8sRUFBRTtnQkFDUCxJ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U0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdEMsS0FBSyxFQUFFLHlEQUF5RCxJQUFJLENBQUMsTUFBTSxvQkFBb0IsU0FBUyxDQUFDLGFBQWEsRUFBRTtZQUN4SCxXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhhRCw4Q0F3YUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIEZvb2REZWxpdmVyeVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRGVhZCBMZXR0ZXIgUXVldWUgZm9yIGZhaWxlZCBvcmRlciBwcm9jZXNzaW5nXG4gICAgY29uc3QgZGVhZExldHRlclF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnT3JkZXJQcm9jZXNzaW5nRExRJywge1xuICAgICAgcXVldWVOYW1lOiBgZm9vZC1kZWxpdmVyeS1kbHEtJHt0aGlzLnN0YWNrTmFtZX1gLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiBjZGsuRHVyYXRpb24uZGF5cygxNCksXG4gICAgICBlbmNyeXB0aW9uOiBzcXMuUXVldWVFbmNyeXB0aW9uLktNU19NQU5BR0VELFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgVGFibGUgd2l0aCBhdXRvLXNjYWxpbmdcbiAgICBjb25zdCBvcmRlcnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnT3JkZXJzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBmb29kLWRlbGl2ZXJ5LW9yZGVycy0ke3RoaXMuc3RhY2tOYW1lfWAsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ29yZGVySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUixcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUFJPVklTSU9ORUQsXG4gICAgICByZWFkQ2FwYWNpdHk6IDUsXG4gICAgICB3cml0ZUNhcGFjaXR5OiA1LFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHsgcG9pbnRJblRpbWVSZWNvdmVyeUVuYWJsZWQ6IHRydWUgfSxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgICB9KTtcblxuICAgIC8vIEdsb2JhbCBTZWNvbmRhcnkgSW5kZXggZm9yIGN1c3RvbWVyIHF1ZXJpZXNcbiAgICBvcmRlcnNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdjdXN0b21lcklkSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdjdXN0b21lcklkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIsXG4gICAgICB9LFxuICAgICAgcmVhZENhcGFjaXR5OiA1LFxuICAgICAgd3JpdGVDYXBhY2l0eTogNSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBBdXRvLXNjYWxpbmcgY29uZmlndXJhdGlvblxuICAgIGNvbnN0IHJlYWRTY2FsaW5nID0gb3JkZXJzVGFibGUuYXV0b1NjYWxlUmVhZENhcGFjaXR5KHtcbiAgICAgIG1pbkNhcGFjaXR5OiA1LFxuICAgICAgbWF4Q2FwYWNpdHk6IDEwMCxcbiAgICB9KTtcblxuICAgIHJlYWRTY2FsaW5nLnNjYWxlT25VdGlsaXphdGlvbih7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDcwLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd3JpdGVTY2FsaW5nID0gb3JkZXJzVGFibGUuYXV0b1NjYWxlV3JpdGVDYXBhY2l0eSh7XG4gICAgICBtaW5DYXBhY2l0eTogNSxcbiAgICAgIG1heENhcGFjaXR5OiAxMDAsXG4gICAgfSk7XG5cbiAgICB3cml0ZVNjYWxpbmcuc2NhbGVPblV0aWxpemF0aW9uKHtcbiAgICAgIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogNzAsXG4gICAgfSk7XG5cbiAgICAvLyBTTlMgVG9waWMgZm9yIGFsZXJ0c1xuICAgIGNvbnN0IGFsZXJ0VG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdGb29kRGVsaXZlcnlBbGVydHMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogJ0Zvb2QgRGVsaXZlcnkgQVBJIEFsZXJ0cycsXG4gICAgfSk7XG5cbiAgICAvLyBQYXJhbWV0ZXIgU3RvcmUgY29uZmlndXJhdGlvbnNcbiAgICBjb25zdCB0YWJsZU5hbWVQYXJhbWV0ZXIgPSBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcihcbiAgICAgIHRoaXMsXG4gICAgICAnVGFibGVOYW1lUGFyYW1ldGVyJyxcbiAgICAgIHtcbiAgICAgICAgcGFyYW1ldGVyTmFtZTogYC9mb29kLWRlbGl2ZXJ5LyR7dGhpcy5zdGFja05hbWV9L3RhYmxlLW5hbWVgLFxuICAgICAgICBzdHJpbmdWYWx1ZTogb3JkZXJzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHRhYmxlIG5hbWUgZm9yIG9yZGVycycsXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGFwaUNvbmZpZ1BhcmFtZXRlciA9IG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKFxuICAgICAgdGhpcyxcbiAgICAgICdBcGlDb25maWdQYXJhbWV0ZXInLFxuICAgICAge1xuICAgICAgICBwYXJhbWV0ZXJOYW1lOiBgL2Zvb2QtZGVsaXZlcnkvJHt0aGlzLnN0YWNrTmFtZX0vYXBpLWNvbmZpZ2AsXG4gICAgICAgIHN0cmluZ1ZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbWF4T3JkZXJzUGVySG91cjogMTUwLFxuICAgICAgICAgIGRlZmF1bHRUaW1lb3V0OiA1MDAsXG4gICAgICAgICAgcmV0cnlBdHRlbXB0czogMyxcbiAgICAgICAgfSksXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycycsXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGZlYXR1cmVGbGFnc1BhcmFtZXRlciA9IG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKFxuICAgICAgdGhpcyxcbiAgICAgICdGZWF0dXJlRmxhZ3NQYXJhbWV0ZXInLFxuICAgICAge1xuICAgICAgICBwYXJhbWV0ZXJOYW1lOiBgL2Zvb2QtZGVsaXZlcnkvJHt0aGlzLnN0YWNrTmFtZX0vZmVhdHVyZS1mbGFnc2AsXG4gICAgICAgIHN0cmluZ1ZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgZXhwcmVzc0RlbGl2ZXJ5OiBmYWxzZSxcbiAgICAgICAgICBsb3lhbHR5UHJvZ3JhbTogdHJ1ZSxcbiAgICAgICAgICBtdWx0aXBsZVBheW1lbnRzOiBmYWxzZSxcbiAgICAgICAgfSksXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRmVhdHVyZSBmbGFncyBmb3IgZ3JhZHVhbCByb2xsb3V0cycsXG4gICAgICAgIC8vIE5vdGU6IFJlbW92ZWQgZGVwcmVjYXRlZCAndHlwZScgcHJvcGVydHkgLSBkZWZhdWx0cyB0byBTdHJpbmcgcGFyYW1ldGVyXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIExhbWJkYSBFeGVjdXRpb24gUm9sZSB3aXRoIGxlYXN0IHByaXZpbGVnZVxuICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ09yZGVyUHJvY2Vzc2luZ1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnXG4gICAgICAgICksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTWFJheURhZW1vbldyaXRlQWNjZXNzJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgcGVybWlzc2lvbnNcbiAgICBvcmRlcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGFtYmRhUm9sZSk7XG5cbiAgICAvLyBQYXJhbWV0ZXIgU3RvcmUgcGVybWlzc2lvbnNcbiAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3NzbTpHZXRQYXJhbWV0ZXInLCAnc3NtOkdldFBhcmFtZXRlcnMnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgdGFibGVOYW1lUGFyYW1ldGVyLnBhcmFtZXRlckFybixcbiAgICAgICAgICBhcGlDb25maWdQYXJhbWV0ZXIucGFyYW1ldGVyQXJuLFxuICAgICAgICAgIGZlYXR1cmVGbGFnc1BhcmFtZXRlci5wYXJhbWV0ZXJBcm4sXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBTUVMgcGVybWlzc2lvbnMgZm9yIERMUVxuICAgIGRlYWRMZXR0ZXJRdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhsYW1iZGFSb2xlKTtcblxuICAgIC8vIE9yZGVyIFByb2Nlc3NpbmcgTGFtYmRhIEZ1bmN0aW9uXG4gICAgY29uc3Qgb3JkZXJQcm9jZXNzaW5nRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdPcmRlclByb2Nlc3NpbmdGdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGFtYmRhJykpLFxuICAgICAgICBmdW5jdGlvbk5hbWU6IGBmb29kLWRlbGl2ZXJ5LXByb2Nlc3Nvci0ke3RoaXMuc3RhY2tOYW1lfWAsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBUQUJMRV9OQU1FOiBvcmRlcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgRExRX1VSTDogZGVhZExldHRlclF1ZXVlLnF1ZXVlVXJsLFxuICAgICAgICAgIFRBQkxFX05BTUVfUEFSQU06IHRhYmxlTmFtZVBhcmFtZXRlci5wYXJhbWV0ZXJOYW1lLFxuICAgICAgICAgIEFQSV9DT05GSUdfUEFSQU06IGFwaUNvbmZpZ1BhcmFtZXRlci5wYXJhbWV0ZXJOYW1lLFxuICAgICAgICAgIEZFQVRVUkVfRkxBR1NfUEFSQU06IGZlYXR1cmVGbGFnc1BhcmFtZXRlci5wYXJhbWV0ZXJOYW1lLFxuICAgICAgICAgIFBPV0VSVE9PTFNfU0VSVklDRV9OQU1FOiAnZm9vZC1kZWxpdmVyeS1hcGknLFxuICAgICAgICAgIFBPV0VSVE9PTFNfTUVUUklDU19OQU1FU1BBQ0U6ICdGb29kRGVsaXZlcnknLFxuICAgICAgICAgIExPR19MRVZFTDogJ0lORk8nLFxuICAgICAgICB9LFxuICAgICAgICByZXNlcnZlZENvbmN1cnJlbnRFeGVjdXRpb25zOiAxMDAsXG4gICAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICAgICAgZGVhZExldHRlclF1ZXVlOiBkZWFkTGV0dGVyUXVldWUsXG4gICAgICAgIGRlYWRMZXR0ZXJRdWV1ZUVuYWJsZWQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIFF1ZXJ5IE9yZGVycyBMYW1iZGEgRnVuY3Rpb25cbiAgICBjb25zdCBxdWVyeU9yZGVyc0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnUXVlcnlPcmRlcnNGdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGFtYmRhJykpLFxuICAgICAgICBmdW5jdGlvbk5hbWU6IGBmb29kLWRlbGl2ZXJ5LXF1ZXJ5LSR7dGhpcy5zdGFja05hbWV9YCxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgVEFCTEVfTkFNRTogb3JkZXJzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIFBPV0VSVE9PTFNfU0VSVklDRV9OQU1FOiAnZm9vZC1kZWxpdmVyeS1hcGknLFxuICAgICAgICAgIFBPV0VSVE9PTFNfTUVUUklDU19OQU1FU1BBQ0U6ICdGb29kRGVsaXZlcnknLFxuICAgICAgICAgIExPR19MRVZFTDogJ0lORk8nLFxuICAgICAgICB9LFxuICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IFJFU1QgQVBJXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnRm9vZERlbGl2ZXJ5QXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGBmb29kLWRlbGl2ZXJ5LWFwaS0ke3RoaXMuc3RhY2tOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Zvb2QgRGVsaXZlcnkgUkVTVCBBUEknLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcbiAgICAgICAgdHJhY2luZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAyMDAsXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDEwMCxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ1gtQXBpLUtleScsICdBdXRob3JpemF0aW9uJ10sXG4gICAgICAgIG1heEFnZTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBLZXkgZm9yIHBhcnRuZXIgaW50ZWdyYXRpb25zXG4gICAgY29uc3QgYXBpS2V5ID0gbmV3IGFwaWdhdGV3YXkuQXBpS2V5KHRoaXMsICdGb29kRGVsaXZlcnlBcGlLZXknLCB7XG4gICAgICBhcGlLZXlOYW1lOiBgZm9vZC1kZWxpdmVyeS1rZXktJHt0aGlzLnN0YWNrTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkga2V5IGZvciBwYXJ0bmVyIGludGVncmF0aW9ucycsXG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2FnZVBsYW4gPSBuZXcgYXBpZ2F0ZXdheS5Vc2FnZVBsYW4odGhpcywgJ0Zvb2REZWxpdmVyeVVzYWdlUGxhbicsIHtcbiAgICAgIG5hbWU6IGBmb29kLWRlbGl2ZXJ5LXVzYWdlLSR7dGhpcy5zdGFja05hbWV9YCxcbiAgICAgIGFwaVN0YWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgYXBpOiBhcGksXG4gICAgICAgICAgc3RhZ2U6IGFwaS5kZXBsb3ltZW50U3RhZ2UsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgdGhyb3R0bGU6IHtcbiAgICAgICAgcmF0ZUxpbWl0OiAxMDAsXG4gICAgICAgIGJ1cnN0TGltaXQ6IDIwMCxcbiAgICAgIH0sXG4gICAgICBxdW90YToge1xuICAgICAgICBsaW1pdDogMTAwMDAsXG4gICAgICAgIHBlcmlvZDogYXBpZ2F0ZXdheS5QZXJpb2QuREFZLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHVzYWdlUGxhbi5hZGRBcGlLZXkoYXBpS2V5KTtcblxuICAgIC8vIFJlcXVlc3QgVmFsaWRhdG9yXG4gICAgY29uc3QgcmVxdWVzdFZhbGlkYXRvciA9IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IoXG4gICAgICB0aGlzLFxuICAgICAgJ1JlcXVlc3RWYWxpZGF0b3InLFxuICAgICAge1xuICAgICAgICByZXN0QXBpOiBhcGksXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3JOYW1lOiAndmFsaWRhdGUtcmVxdWVzdC1ib2R5LWFuZC1wYXJhbXMnLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiB0cnVlLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBPcmRlciBNb2RlbCBmb3IgdmFsaWRhdGlvblxuICAgIGNvbnN0IG9yZGVyTW9kZWwgPSBuZXcgYXBpZ2F0ZXdheS5Nb2RlbCh0aGlzLCAnT3JkZXJNb2RlbCcsIHtcbiAgICAgIHJlc3RBcGk6IGFwaSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdPcmRlck1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgcmVxdWlyZWQ6IFsnY3VzdG9tZXJJZCcsICdpdGVtcycsICdkZWxpdmVyeUFkZHJlc3MnXSxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGN1c3RvbWVySWQ6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HLFxuICAgICAgICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuQVJSQVksXG4gICAgICAgICAgICBtaW5JdGVtczogMSxcbiAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgICAgICAgICByZXF1aXJlZDogWydwcm9kdWN0SWQnLCAncXVhbnRpdHknLCAncHJpY2UnXSxcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RJZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgICAgICAgIHF1YW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIsXG4gICAgICAgICAgICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5OVU1CRVIgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZWxpdmVyeUFkZHJlc3M6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc3RyZWV0JywgJ2NpdHknLCAnemlwQ29kZSddLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICBzdHJlZXQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgICAgY2l0eTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgICAgICB6aXBDb2RlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIFJlc291cmNlcyBhbmQgTWV0aG9kc1xuICAgIGNvbnN0IG9yZGVycyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdvcmRlcnMnKTtcblxuICAgIC8vIFBPU1QgL29yZGVycyAtIENyZWF0ZSBvcmRlclxuICAgIG9yZGVycy5hZGRNZXRob2QoXG4gICAgICAnUE9TVCcsXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihvcmRlclByb2Nlc3NpbmdGdW5jdGlvbiksXG4gICAgICB7XG4gICAgICAgIGFwaUtleVJlcXVpcmVkOiB0cnVlLFxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yOiByZXF1ZXN0VmFsaWRhdG9yLFxuICAgICAgICByZXF1ZXN0TW9kZWxzOiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBvcmRlck1vZGVsLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHRVQgL29yZGVycy97b3JkZXJJZH0gLSBHZXQgb3JkZXJcbiAgICBjb25zdCBvcmRlckJ5SWQgPSBvcmRlcnMuYWRkUmVzb3VyY2UoJ3tvcmRlcklkfScpO1xuICAgIG9yZGVyQnlJZC5hZGRNZXRob2QoXG4gICAgICAnR0VUJyxcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHF1ZXJ5T3JkZXJzRnVuY3Rpb24pLFxuICAgICAge1xuICAgICAgICBhcGlLZXlSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5vcmRlcklkJzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gUFVUIC9vcmRlcnMve29yZGVySWR9IC0gVXBkYXRlIG9yZGVyXG4gICAgb3JkZXJCeUlkLmFkZE1ldGhvZChcbiAgICAgICdQVVQnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ob3JkZXJQcm9jZXNzaW5nRnVuY3Rpb24pLFxuICAgICAge1xuICAgICAgICBhcGlLZXlSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcjogcmVxdWVzdFZhbGlkYXRvcixcbiAgICAgICAgcmVxdWVzdE1vZGVsczoge1xuICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogb3JkZXJNb2RlbCxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gR0VUIC9vcmRlcnMvY3VzdG9tZXIve2N1c3RvbWVySWR9IC0gR2V0IGN1c3RvbWVyIG9yZGVyc1xuICAgIGNvbnN0IGN1c3RvbWVyT3JkZXJzID0gb3JkZXJzXG4gICAgICAuYWRkUmVzb3VyY2UoJ2N1c3RvbWVyJylcbiAgICAgIC5hZGRSZXNvdXJjZSgne2N1c3RvbWVySWR9Jyk7XG4gICAgY3VzdG9tZXJPcmRlcnMuYWRkTWV0aG9kKFxuICAgICAgJ0dFVCcsXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihxdWVyeU9yZGVyc0Z1bmN0aW9uKSxcbiAgICAgIHtcbiAgICAgICAgYXBpS2V5UmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY3VzdG9tZXJJZCc6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm1zXG4gICAgY29uc3QgZXJyb3JBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdIaWdoRXJyb3JSYXRlQWxhcm0nLCB7XG4gICAgICBtZXRyaWM6IG9yZGVyUHJvY2Vzc2luZ0Z1bmN0aW9uLm1ldHJpY0Vycm9ycyh7XG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCB3aGVuIGVycm9yIHJhdGUgZXhjZWVkcyAxJScsXG4gICAgfSk7XG5cbiAgICBlcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xuXG4gICAgY29uc3QgbGF0ZW5jeUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0hpZ2hMYXRlbmN5QWxhcm0nLCB7XG4gICAgICBtZXRyaWM6IG9yZGVyUHJvY2Vzc2luZ0Z1bmN0aW9uLm1ldHJpY0R1cmF0aW9uKHtcbiAgICAgICAgc3RhdGlzdGljOiAncDk1JyxcbiAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIH0pLFxuICAgICAgdGhyZXNob2xkOiA1MDAsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCB3aGVuIDk1dGggcGVyY2VudGlsZSBsYXRlbmN5IGV4Y2VlZHMgNTAwbXMnLFxuICAgIH0pO1xuXG4gICAgbGF0ZW5jeUFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBEYXNoYm9hcmRcbiAgICBjb25zdCBkYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQodGhpcywgJ0Zvb2REZWxpdmVyeURhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IGBmb29kLWRlbGl2ZXJ5LWRhc2hib2FyZC0ke3RoaXMuc3RhY2tOYW1lfWAsXG4gICAgfSk7XG5cbiAgICBkYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdBUEkgR2F0ZXdheSBSZXF1ZXN0cycsXG4gICAgICAgIGxlZnQ6IFthcGkubWV0cmljQ291bnQoKV0sXG4gICAgICAgIHJpZ2h0OiBbYXBpLm1ldHJpY0NsaWVudEVycm9yKCksIGFwaS5tZXRyaWNTZXJ2ZXJFcnJvcigpXSxcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0xhbWJkYSBJbnZvY2F0aW9ucycsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBvcmRlclByb2Nlc3NpbmdGdW5jdGlvbi5tZXRyaWNJbnZvY2F0aW9ucygpLFxuICAgICAgICAgIHF1ZXJ5T3JkZXJzRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoKSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0xhbWJkYSBEdXJhdGlvbicsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBvcmRlclByb2Nlc3NpbmdGdW5jdGlvbi5tZXRyaWNEdXJhdGlvbigpLFxuICAgICAgICAgIHF1ZXJ5T3JkZXJzRnVuY3Rpb24ubWV0cmljRHVyYXRpb24oKSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0R5bmFtb0RCIE1ldHJpY3MnLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgb3JkZXJzVGFibGUubWV0cmljQ29uc3VtZWRSZWFkQ2FwYWNpdHlVbml0cygpLFxuICAgICAgICAgIG9yZGVyc1RhYmxlLm1ldHJpY0NvbnN1bWVkV3JpdGVDYXBhY2l0eVVuaXRzKCksXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaVVybCcsIHtcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdGb29kIERlbGl2ZXJ5IEFQSSBVUkwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUtleUlkJywge1xuICAgICAgdmFsdWU6IGFwaUtleS5rZXlJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEtleSBJRCBmb3IgcGFydG5lciBpbnRlZ3JhdGlvbnMnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rhc2hib2FyZFVybCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly9jb25zb2xlLmF3cy5hbWF6b24uY29tL2Nsb3Vkd2F0Y2gvaG9tZT9yZWdpb249JHt0aGlzLnJlZ2lvbn0jZGFzaGJvYXJkczpuYW1lPSR7ZGFzaGJvYXJkLmRhc2hib2FyZE5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRXYXRjaCBEYXNoYm9hcmQgVVJMJyxcbiAgICB9KTtcbiAgfVxufVxuIl19
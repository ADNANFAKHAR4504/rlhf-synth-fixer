package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatchactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	EnvironmentSuffix *string
	// LambdaAssetPath allows overriding the path used for Lambda code assets (useful in tests).
	LambdaAssetPath *string
}

// TapStack represents the main CDK stack for e-commerce order processing pipeline.
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack for order processing pipeline.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// ========================================
	// DynamoDB Table for Orders with GSI
	// ========================================
	ordersTable := awsdynamodb.NewTable(stack, jsii.String("OrdersTable"), &awsdynamodb.TableProps{
		TableName: jsii.String(fmt.Sprintf("orders-table-%s", environmentSuffix)),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("orderId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		BillingMode:         awsdynamodb.BillingMode_PAY_PER_REQUEST,
		RemovalPolicy:       awscdk.RemovalPolicy_DESTROY,
		PointInTimeRecovery: jsii.Bool(true),
		Encryption:          awsdynamodb.TableEncryption_AWS_MANAGED,
	})

	// Add GSI for customer ID lookups
	ordersTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexProps{
		IndexName: jsii.String("CustomerIdIndex"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("customerId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("timestamp"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		ProjectionType: awsdynamodb.ProjectionType_ALL,
	})

	// ========================================
	// Dead Letter Queue
	// ========================================
	dlq := awssqs.NewQueue(stack, jsii.String("OrderDLQ"), &awssqs.QueueProps{
		QueueName:       jsii.String(fmt.Sprintf("order-dlq-%s", environmentSuffix)),
		RetentionPeriod: awscdk.Duration_Days(jsii.Number(14)),
	})

	// ========================================
	// SQS Queue for Order Processing
	// ========================================
	orderQueue := awssqs.NewQueue(stack, jsii.String("OrderQueue"), &awssqs.QueueProps{
		QueueName:         jsii.String(fmt.Sprintf("order-queue-%s", environmentSuffix)),
		VisibilityTimeout: awscdk.Duration_Seconds(jsii.Number(300)),
		DeadLetterQueue: &awssqs.DeadLetterQueue{
			MaxReceiveCount: jsii.Number(3),
			Queue:           dlq,
		},
	})

	// ========================================
	// SNS Topic for Notifications
	// ========================================
	orderTopic := awssns.NewTopic(stack, jsii.String("OrderTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("order-topic-%s", environmentSuffix)),
		DisplayName: jsii.String("Order Processing Notifications"),
	})

	// ========================================
	// Lambda Function for Order Processing
	// ========================================
	// Determine lambda asset path (allow override from props for tests)
	lambdaAssetPath := "lib/lambda"
	if props != nil && props.LambdaAssetPath != nil {
		lambdaAssetPath = *props.LambdaAssetPath
	}

	orderProcessorLambda := awslambda.NewFunction(stack, jsii.String("OrderProcessor"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("order-processor-%s", environmentSuffix)),
		Runtime:      awslambda.Runtime_PYTHON_3_11(),
		Handler:      jsii.String("order_processor.handler"),
		Code:         awslambda.Code_FromAsset(jsii.String(lambdaAssetPath), nil),
		Environment: &map[string]*string{
			"ORDERS_TABLE":    ordersTable.TableName(),
			"SNS_TOPIC":       orderTopic.TopicArn(),
			"CUSTOMER_ID_GSI": jsii.String("CustomerIdIndex"),
		},
		Timeout:                      awscdk.Duration_Seconds(jsii.Number(60)),
		ReservedConcurrentExecutions: jsii.Number(100),
		Tracing:                      awslambda.Tracing_ACTIVE,
		LogRetention:                 awslogs.RetentionDays_ONE_WEEK,
	})

	// Grant permissions
	ordersTable.GrantReadWriteData(orderProcessorLambda)
	orderTopic.GrantPublish(orderProcessorLambda)

	// Add SQS event source to Lambda
	orderProcessorLambda.AddEventSource(awslambdaeventsources.NewSqsEventSource(orderQueue, &awslambdaeventsources.SqsEventSourceProps{
		BatchSize:               jsii.Number(10),
		MaxBatchingWindow:       awscdk.Duration_Seconds(jsii.Number(5)),
		ReportBatchItemFailures: jsii.Bool(true),
	}))

	// ========================================
	// Lambda Function for API Handler
	// ========================================
	apiHandlerLambda := awslambda.NewFunction(stack, jsii.String("ApiHandler"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("api-handler-%s", environmentSuffix)),
		Runtime:      awslambda.Runtime_PYTHON_3_11(),
		Handler:      jsii.String("api_handler.handler"),
		Code:         awslambda.Code_FromAsset(jsii.String(lambdaAssetPath), nil),
		Environment: &map[string]*string{
			"ORDER_QUEUE_URL": orderQueue.QueueUrl(),
		},
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		Tracing:      awslambda.Tracing_ACTIVE,
		LogRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// Grant permission to send messages to queue
	orderQueue.GrantSendMessages(apiHandlerLambda)

	// ========================================
	// API Gateway with Request Validation
	// ========================================
	api := awsapigateway.NewRestApi(stack, jsii.String("OrdersApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("orders-api-%s", environmentSuffix)),
		Description: jsii.String("API for order ingestion"),
		DeployOptions: &awsapigateway.StageOptions{
			StageName:        jsii.String("prod"),
			TracingEnabled:   jsii.Bool(true),
			LoggingLevel:     awsapigateway.MethodLoggingLevel_INFO,
			DataTraceEnabled: jsii.Bool(true),
			MetricsEnabled:   jsii.Bool(true),
		},
	})

	// Request validator
	requestValidator := awsapigateway.NewRequestValidator(stack, jsii.String("OrderRequestValidator"), &awsapigateway.RequestValidatorProps{
		RestApi:              api,
		ValidateRequestBody:  jsii.Bool(true),
		RequestValidatorName: jsii.String(fmt.Sprintf("order-validator-%s", environmentSuffix)),
	})

	// Request model for validation
	orderModel := api.AddModel(jsii.String("OrderModel"), &awsapigateway.ModelOptions{
		ContentType: jsii.String("application/json"),
		ModelName:   jsii.String("OrderModel"),
		Schema: &awsapigateway.JsonSchema{
			Schema: awsapigateway.JsonSchemaVersion_DRAFT4,
			Type:   awsapigateway.JsonSchemaType_OBJECT,
			Properties: &map[string]*awsapigateway.JsonSchema{
				"orderId": {
					Type: awsapigateway.JsonSchemaType_STRING,
				},
				"customerId": {
					Type: awsapigateway.JsonSchemaType_STRING,
				},
				"items": {
					Type: awsapigateway.JsonSchemaType_ARRAY,
					Items: &awsapigateway.JsonSchema{
						Type: awsapigateway.JsonSchemaType_OBJECT,
					},
				},
			},
			Required: &[]*string{
				jsii.String("orderId"),
				jsii.String("customerId"),
				jsii.String("items"),
			},
		},
	})

	// API Integration
	integration := awsapigateway.NewLambdaIntegration(apiHandlerLambda, &awsapigateway.LambdaIntegrationOptions{
		Proxy: jsii.Bool(true),
	})

	ordersResource := api.Root().AddResource(jsii.String("orders"), nil)
	ordersResource.AddMethod(jsii.String("POST"), integration, &awsapigateway.MethodOptions{
		RequestValidator: requestValidator,
		RequestModels: &map[string]awsapigateway.IModel{
			"application/json": orderModel,
		},
	})

	// ========================================
	// CloudWatch Alarms
	// ========================================

	// Alarm for Lambda errors
	orderProcessorErrorAlarm := awscloudwatch.NewAlarm(stack, jsii.String("OrderProcessorErrors"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String(fmt.Sprintf("order-processor-errors-%s", environmentSuffix)),
		Metric: orderProcessorLambda.MetricErrors(&awscloudwatch.MetricOptions{
			Statistic: jsii.String("Sum"),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(5),
		EvaluationPeriods:  jsii.Number(1),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		AlarmDescription:   jsii.String("Alert when order processor has more than 5 errors in 5 minutes"),
	})

	// Alarm for Lambda throttles
	orderProcessorThrottleAlarm := awscloudwatch.NewAlarm(stack, jsii.String("OrderProcessorThrottles"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String(fmt.Sprintf("order-processor-throttles-%s", environmentSuffix)),
		Metric: orderProcessorLambda.MetricThrottles(&awscloudwatch.MetricOptions{
			Statistic: jsii.String("Sum"),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(10),
		EvaluationPeriods:  jsii.Number(1),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		AlarmDescription:   jsii.String("Alert when order processor is throttled"),
	})

	// Alarm for DLQ messages
	dlqAlarm := awscloudwatch.NewAlarm(stack, jsii.String("DLQMessagesAlarm"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String(fmt.Sprintf("order-dlq-messages-%s", environmentSuffix)),
		Metric: dlq.MetricApproximateNumberOfMessagesVisible(&awscloudwatch.MetricOptions{
			Statistic: jsii.String("Sum"),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(1),
		EvaluationPeriods:  jsii.Number(1),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
		AlarmDescription:   jsii.String("Alert when messages appear in DLQ"),
	})

	// Alarm for queue depth
	queueDepthAlarm := awscloudwatch.NewAlarm(stack, jsii.String("QueueDepthAlarm"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String(fmt.Sprintf("order-queue-depth-%s", environmentSuffix)),
		Metric: orderQueue.MetricApproximateNumberOfMessagesVisible(&awscloudwatch.MetricOptions{
			Statistic: jsii.String("Average"),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(1000),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		AlarmDescription:   jsii.String("Alert when queue depth is high"),
	})

	// Send alarm notifications to SNS topic
	orderProcessorErrorAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(orderTopic))
	orderProcessorThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(orderTopic))
	dlqAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(orderTopic))
	queueDepthAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(orderTopic))

	// ========================================
	// Stack Outputs
	// ========================================
	awscdk.NewCfnOutput(stack, jsii.String("ApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway endpoint URL"),
		ExportName:  jsii.String(fmt.Sprintf("OrdersApiEndpoint-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("OrdersTableName"), &awscdk.CfnOutputProps{
		Value:       ordersTable.TableName(),
		Description: jsii.String("DynamoDB orders table name"),
		ExportName:  jsii.String(fmt.Sprintf("OrdersTableName-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("OrderQueueUrl"), &awscdk.CfnOutputProps{
		Value:       orderQueue.QueueUrl(),
		Description: jsii.String("Order processing queue URL"),
		ExportName:  jsii.String(fmt.Sprintf("OrderQueueUrl-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("OrderTopicArn"), &awscdk.CfnOutputProps{
		Value:       orderTopic.TopicArn(),
		Description: jsii.String("Order notification topic ARN"),
		ExportName:  jsii.String(fmt.Sprintf("OrderTopicArn-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DLQUrl"), &awscdk.CfnOutputProps{
		Value:       dlq.QueueUrl(),
		Description: jsii.String("Dead letter queue URL"),
		ExportName:  jsii.String(fmt.Sprintf("OrderDLQUrl-%s", environmentSuffix)),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}

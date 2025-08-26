package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatchactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment   string
	LambdaRole    awsiam.IRole
	S3Bucket      awss3.IBucket
	DynamoDBTable awsdynamodb.ITable
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
}

type ComputeConstruct struct {
	constructs.Construct
	LambdaFunction awslambda.IFunction
	Alarms         []awscloudwatch.IAlarm
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Enhanced CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Get private subnets for Lambda VPC configuration
	privateSubnets := props.VPC.PrivateSubnets()

	// Enhanced Lambda function with ARM64 and Python 3.12
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
		FunctionName:                 jsii.String("proj-lambda-" + props.Environment),
		Runtime:                      awslambda.Runtime_PYTHON_3_12(),
		Architecture:                 awslambda.Architecture_ARM_64(),
		Handler:                      jsii.String("handler.lambda_handler"),
		Code:                         awslambda.Code_FromAsset(jsii.String("lambda"), nil),
		Role:                         props.LambdaRole,
		LogGroup:                     logGroup,
		Timeout:                      awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize:                   jsii.Number(512), // Increased for ARM64 optimization
		ReservedConcurrentExecutions: jsii.Number(10),  // Stability limit
		Description:                  jsii.String("Enhanced S3 processor with ARM64 and monitoring"),
		Environment: &map[string]*string{
			"DYNAMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
			"S3_BUCKET_NAME":      props.S3Bucket.BucketName(),
			"ENVIRONMENT":         jsii.String(props.Environment),
		},
		Tracing: awslambda.Tracing_ACTIVE,
		Vpc:     props.VPC,
		VpcSubnets: &awsec2.SubnetSelection{
			Subnets: privateSubnets,
		},
		DeadLetterQueueEnabled: jsii.Bool(true),
		RetryAttempts:          jsii.Number(2),
	})

	// Configure S3 trigger
	props.S3Bucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(lambdaFunction),
		nil,
	)

	// Create comprehensive CloudWatch alarms
	alarms := createLambdaAlarms(construct, lambdaFunction, props)
	createDynamoDBAlarms(construct, props.DynamoDBTable, props.AlertingTopic, props.Environment)

	return &ComputeConstruct{
		Construct:      construct,
		LambdaFunction: lambdaFunction,
		Alarms:         alarms,
	}
}

func createLambdaAlarms(construct constructs.Construct, fn awslambda.IFunction, props *ComputeConstructProps) []awscloudwatch.IAlarm {
	var alarms []awscloudwatch.IAlarm

	// Error Rate Alarm (>1%)
	errorRateAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorRateAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-error-rate-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function error rate exceeded 1%"),
		Metric: awscloudwatch.NewMathExpression(&awscloudwatch.MathExpressionProps{
			Expression: jsii.String("(errors / invocations) * 100"),
			UsingMetrics: &map[string]awscloudwatch.IMetric{
				"errors": fn.MetricErrors(&awscloudwatch.MetricOptions{
					Statistic: awscloudwatch.Stats_SUM(),
					Period:    awscdk.Duration_Minutes(jsii.Number(5)),
				}),
				"invocations": fn.MetricInvocations(&awscloudwatch.MetricOptions{
					Statistic: awscloudwatch.Stats_SUM(),
					Period:    awscdk.Duration_Minutes(jsii.Number(5)),
				}),
			},
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	errorRateAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Duration Alarm (>30s)
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-duration-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function duration exceeded 30 seconds"),
		Metric: fn.MetricDuration(&awscloudwatch.MetricOptions{
			Statistic: awscloudwatch.Stats_AVERAGE(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(30000), // 30 seconds in milliseconds
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	durationAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Throttling Alarm
	throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-throttles-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function is being throttled"),
		Metric: fn.MetricThrottles(&awscloudwatch.MetricOptions{
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(1),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	throttleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	alarms = append(alarms, errorRateAlarm, durationAlarm, throttleAlarm)
	return alarms
}

func createDynamoDBAlarms(construct constructs.Construct, table awsdynamodb.ITable, topic awssns.ITopic, env string) {
	// DynamoDB Read Throttling Alarm
	readThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBReadThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-read-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing read throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("ReadThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	readThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))

	// DynamoDB Write Throttling Alarm
	writeThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBWriteThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-write-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing write throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("WriteThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	writeThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))
}

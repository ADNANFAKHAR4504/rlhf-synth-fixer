package constructs

import (
	"fmt"
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment      string
	Region           string
	Vpc              awsec2.Vpc
	SecurityGroup    awsec2.SecurityGroup
	ExecutionRole    awsiam.Role
	DeadLetterQueue  awssqs.Queue
	CrossRegionTopic awssns.Topic
}

type ComputeConstruct struct {
	constructs.Construct
	lambdaFunction awslambda.Function
	logGroup       awslogs.LogGroup
	errorAlarm     awscloudwatch.Alarm
	durationAlarm  awscloudwatch.Alarm
	throttleAlarm  awscloudwatch.Alarm
}

func NewComputeConstruct(scope constructs.Construct, id *string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Create CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/lambda/tap-handler%s", envSuffix)),
		Retention:     awslogs.RetentionDays_TWO_WEEKS,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function with enhanced configuration
	// Use path that works both from root and when tests are copied to lib/
	lambdaPath := "lib/lambda"
	if _, err := os.Stat("lambda"); err == nil {
		lambdaPath = "lambda"
	}

	lambdaFunction := awslambda.NewFunction(construct, jsii.String("TapHandler"), &awslambda.FunctionProps{
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         awslambda.Code_FromAsset(jsii.String(lambdaPath), nil),
		FunctionName: jsii.String(fmt.Sprintf("tap-handler%s", envSuffix)),
		MemorySize:   jsii.Number(256), // ≤256MB as required
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		LogGroup:     logGroup,
		Role:         props.ExecutionRole,
		Vpc:          props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
		SecurityGroups:  &[]awsec2.ISecurityGroup{props.SecurityGroup},
		Tracing:         awslambda.Tracing_ACTIVE, // X-Ray tracing
		RetryAttempts:   jsii.Number(2),
		DeadLetterQueue: props.DeadLetterQueue,
		Environment: &map[string]*string{
			"LOG_LEVEL":              jsii.String("INFO"),
			"ENVIRONMENT":            jsii.String(props.Environment),
			"REGION":                 jsii.String(props.Region),
			"CROSS_REGION_TOPIC_ARN": props.CrossRegionTopic.TopicArn(),
			"DLQ_URL":                props.DeadLetterQueue.QueueUrl(),
		},
		ReservedConcurrentExecutions: jsii.Number(100), // Prevent runaway costs
	})

	// Enhanced CloudWatch Alarms
	// Error alarm with composite metric
	errorAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("tap-lambda-errors%s", envSuffix)),
		AlarmDescription: jsii.String("Lambda function error rate exceeds threshold"),
		Metric: awscloudwatch.NewMathExpression(&awscloudwatch.MathExpressionProps{
			Expression: jsii.String("(errors / invocations) * 100"),
			UsingMetrics: &map[string]awscloudwatch.IMetric{
				"errors": lambdaFunction.MetricErrors(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
				"invocations": lambdaFunction.MetricInvocations(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
			},
		}),
		Threshold:          jsii.Number(5), // 5% error rate
		EvaluationPeriods:  jsii.Number(2),
		DatapointsToAlarm:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Duration alarm
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("tap-lambda-duration%s", envSuffix)),
		AlarmDescription: jsii.String("Lambda function duration exceeds threshold"),
		Metric: lambdaFunction.MetricDuration(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(25000), // 25 seconds
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Throttle alarm
	throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("tap-lambda-throttles%s", envSuffix)),
		AlarmDescription: jsii.String("Lambda function throttles detected"),
		Metric: lambdaFunction.MetricThrottles(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(1),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	return &ComputeConstruct{
		Construct:      construct,
		lambdaFunction: lambdaFunction,
		logGroup:       logGroup,
		errorAlarm:     errorAlarm,
		durationAlarm:  durationAlarm,
		throttleAlarm:  throttleAlarm,
	}
}

func (c *ComputeConstruct) LambdaFunction() awslambda.Function {
	return c.lambdaFunction
}

func (c *ComputeConstruct) LogGroup() awslogs.LogGroup {
	return c.logGroup
}

func (c *ComputeConstruct) ErrorAlarm() awscloudwatch.Alarm {
	return c.errorAlarm
}

func (c *ComputeConstruct) DurationAlarm() awscloudwatch.Alarm {
	return c.durationAlarm
}

func (c *ComputeConstruct) ThrottleAlarm() awscloudwatch.Alarm {
	return c.throttleAlarm
}

package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
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

	// Create CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/tap-handler"),
		Retention:     awslogs.RetentionDays_TWO_WEEKS,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("TapHandler"), &awslambda.FunctionProps{
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         awslambda.Code_FromAsset(jsii.String("lib/lambda"), nil),
		FunctionName: jsii.String("tap-handler"),
		MemorySize:   jsii.Number(256), // ≤256MB as required
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		LogGroup:     logGroup,
		Environment: &map[string]*string{
			"LOG_LEVEL": jsii.String("INFO"),
		},
	})

	// CloudWatch Alarms
	// Error alarm
	errorAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("tap-lambda-errors"),
		AlarmDescription: jsii.String("Lambda function error rate"),
		Metric: lambdaFunction.MetricErrors(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(1),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Duration alarm
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("tap-lambda-duration"),
		AlarmDescription: jsii.String("Lambda function duration"),
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
		AlarmName:        jsii.String("tap-lambda-throttles"),
		AlarmDescription: jsii.String("Lambda function throttles"),
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

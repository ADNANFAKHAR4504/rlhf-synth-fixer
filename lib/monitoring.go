package main

import (
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/cloudwatchmetricalarm"
)

type MonitoringResources struct {
	LambdaErrorAlarms map[string]cloudwatchmetricalarm.CloudwatchMetricAlarm
}

func NewMonitoringResources(stack *TapStack) *MonitoringResources {
	resources := &MonitoringResources{
		LambdaErrorAlarms: make(map[string]cloudwatchmetricalarm.CloudwatchMetricAlarm),
	}

	// Create CloudWatch alarms for Lambda functions
	for funcName, lambdaFunc := range stack.Lambda.Functions {
		resources.LambdaErrorAlarms[funcName] = cloudwatchmetricalarm.NewCloudwatchMetricAlarm(stack.Stack, str(funcName+"-error-alarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
			AlarmName:          str(stack.Config.AppName + "-" + funcName + "-errors"),
			ComparisonOperator: str("GreaterThanOrEqualToThreshold"),
			EvaluationPeriods:  num(1),
			MetricName:         str("Errors"),
			Namespace:          str("AWS/Lambda"),
			Period:             num(300), // 5 minutes
			Statistic:          str("Sum"),
			Threshold:          num(5),
			AlarmDescription:   str("Lambda function " + funcName + " error alarm"),
			AlarmActions:       &[]*string{},
			Dimensions: &map[string]*string{
				"FunctionName": lambdaFunc.FunctionName(),
			},
			Tags: &map[string]*string{
				"Name": str(stack.Config.AppName + "-" + funcName + "-error-alarm"),
			},
		})
	}

	return resources
}
package lib

import (
	myConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
}

type TapStack struct {
	awscdk.Stack
	ApiEndpoint awscdk.CfnOutput
	LambdaArn   awscdk.CfnOutput
	LogGroups   awscdk.CfnOutput
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, &id, &sprops)

	// Global tags
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// Create compute construct with Lambda functions
	computeConstruct := myConstructs.NewComputeConstruct(stack, jsii.String("ComputeConstruct"), &myConstructs.ComputeConstructProps{})

	// Create API Gateway
	api := awsapigateway.NewRestApi(stack, jsii.String("TapApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String("tap-api"),
		Description: jsii.String("TAP API Gateway"),
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
		},
	})

	// API Gateway Lambda integration
	lambdaIntegration := awsapigateway.NewLambdaIntegration(computeConstruct.LambdaFunction(), &awsapigateway.LambdaIntegrationOptions{
		Proxy: jsii.Bool(true),
	})

	// Add proxy resource
	api.Root().AddProxy(&awsapigateway.ProxyResourceOptions{
		DefaultIntegration: lambdaIntegration,
		AnyMethod:          jsii.Bool(true),
	})

	// Create outputs
	apiEndpoint := awscdk.NewCfnOutput(stack, jsii.String("ApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway endpoint URL"),
		ExportName:  jsii.String("TapApiEndpoint"),
	})

	lambdaArn := awscdk.NewCfnOutput(stack, jsii.String("LambdaArn"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LambdaFunction().FunctionArn(),
		Description: jsii.String("Lambda function ARN"),
		ExportName:  jsii.String("TapLambdaArn"),
	})

	logGroups := awscdk.NewCfnOutput(stack, jsii.String("LogGroups"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LogGroup().LogGroupName(),
		Description: jsii.String("CloudWatch Log Group name"),
		ExportName:  jsii.String("TapLogGroups"),
	})

	return &TapStack{
		Stack:       stack,
		ApiEndpoint: apiEndpoint,
		LambdaArn:   lambdaArn,
		LogGroups:   logGroups,
	}
}

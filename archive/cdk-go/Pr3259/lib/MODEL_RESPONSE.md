```go
package main

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/jsii-runtime-go"
)

type ServerlessApiStackProps struct {
	awscdk.StackProps
}

func NewServerlessApiStack(scope constructs.Construct, id string, props *ServerlessApiStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create DynamoDB table with on-demand capacity
	table := awsdynamodb.NewTable(stack, jsii.String("ItemsTable"), &awsdynamodb.TableProps{
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("id"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Define the Lambda function with Python runtime
	lambdaFunction := awslambda.NewFunction(stack, jsii.String("ApiHandler"), &awslambda.FunctionProps{
		Runtime:         awslambda.Runtime_PYTHON_3_9(),
		Handler:         jsii.String("handler.main"),
		Code:            awslambda.Code_FromAsset(jsii.String("lambda")),
		Environment:     &map[string]*string{"TABLE_NAME": table.TableName()},
		LogRetention:    awslogs.RetentionDays_ONE_WEEK,
	})

	// Grant permissions to Lambda to access DynamoDB and write logs
	table.GrantReadWriteData(lambdaFunction)
	lambdaFunction.AddToRolePolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Actions:   &[]*string{jsii.String("logs:CreateLogGroup"), jsii.String("logs:CreateLogStream"), jsii.String("logs:PutLogEvents")},
		Resources: &[]*string{jsii.String("arn:aws:logs:*:*:*")},
	}))

	// Create API Gateway and integrate with Lambda
	api := awsapigateway.NewRestApi(stack, jsii.String("ApiGateway"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String("ServerlessApi"),
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
		},
	})

	integration := awsapigateway.NewLambdaIntegration(lambdaFunction, &awsapigateway.LambdaIntegrationOptions{})
	items := api.Root().AddResource(jsii.String("items"))
	items.AddMethod(jsii.String("GET"), integration, &awsapigateway.MethodOptions{})
	items.AddMethod(jsii.String("POST"), integration, &awsapigateway.MethodOptions{})

	return stack
}

func main() {
	app := awscdk.NewApp(nil)

	NewServerlessApiStack(app, "ServerlessApiStack", &ServerlessApiStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to be deployed.
func env() *awscdk.Environment {
	return nil // Use default account and region from AWS CLI configuration
}
```

This Go CDK code defines a serverless application with a REST API backed by DynamoDB and Lambda. The API Gateway includes CORS support, and the Lambda function has necessary permissions. The code is structured to be region-independent and follows AWS best practices. Ensure you have a `lambda` directory with a Python handler (`handler.py`) to complete the deployment.


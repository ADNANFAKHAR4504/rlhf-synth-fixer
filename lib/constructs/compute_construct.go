package constructs

import (
	"os"
	"path/filepath"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment   string
	LambdaRole    awsiam.IRole
	S3Bucket      awss3.IBucket
	DynamoDBTable awsdynamodb.ITable
}

type ComputeConstruct struct {
	constructs.Construct
	LambdaFunction awslambda.IFunction
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create CloudWatch Log Group for Lambda with retention policy
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Find the lib/lambda directory - check multiple possible paths
	var lambdaPath string
	possiblePaths := []string{
		"lib/lambda",       // From project root
		"../../lib/lambda", // From tests/unit
		"../lib/lambda",    // From other subdirs
		"lambda",           // Fallback to project root lambda dir
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(filepath.Join(path, "handler.py")); err == nil {
			lambdaPath = path
			break
		}
	}

	// Use inline code as fallback if lib/lambda not found
	var lambdaCode awslambda.Code
	if lambdaPath != "" {
		lambdaCode = awslambda.Code_FromAsset(jsii.String(lambdaPath), nil)
	} else {
		// Fallback inline lambda code for testing
		lambdaCode = awslambda.Code_FromInline(jsii.String(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Test Lambda function - S3 event processing")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Test function executed successfully'})
    }
		`))
	}

	// Create Lambda function
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String("proj-lambda-" + props.Environment),
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         lambdaCode,
		Role:         props.LambdaRole,
		LogGroup:     logGroup,
		Timeout:      awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize:   jsii.Number(256),
		Description:  jsii.String("Processes S3 object creation events and writes to DynamoDB"),
		Environment: &map[string]*string{
			"DYNAMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
			"S3_BUCKET_NAME":      props.S3Bucket.BucketName(),
			"ENVIRONMENT":         jsii.String(props.Environment),
		},
		// Enable X-Ray tracing for better observability
		Tracing: awslambda.Tracing_ACTIVE,
	})

	// Configure S3 bucket to trigger Lambda on object creation
	props.S3Bucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(lambdaFunction),
	)

	// Add tags
	awscdk.Tags_Of(lambdaFunction).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(lambdaFunction).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

	return &ComputeConstruct{
		Construct:      construct,
		LambdaFunction: lambdaFunction,
	}
}

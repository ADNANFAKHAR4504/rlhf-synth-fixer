package lib

import (
	tapConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options for production-grade infrastructure.
type TapStackProps struct {
	awscdk.StackProps
	// Environment identifies the deployment environment (e.g., 'dev', 'prod', 'staging').
	Environment string
}

// TapStack represents the main CDK stack for the TAP Infrastructure project.
//
// This stack creates a comprehensive, secure, and auditable cloud environment including:
// - CloudTrail for audit logging
// - S3 buckets with versioning and access logging
// - DynamoDB table with encryption and point-in-time recovery
// - Lambda function for S3 event processing
// - IAM roles with least-privilege access
// - CloudWatch logging and monitoring
type TapStack struct {
	awscdk.Stack
	// Environment stores the deployment environment identifier
	Environment string
	// Resources created by this stack
	CloudTrailBucket awss3.IBucket
	MainBucket       awss3.IBucket
	LoggingBucket    awss3.IBucket
	DynamoDBTable    awsdynamodb.ITable
	LambdaFunction   awslambda.IFunction
	LambdaRole       awsiam.IRole
}

// NewTapStack creates a new instance of TapStack with comprehensive AWS infrastructure.
//
// This function creates a production-grade, secure, and auditable cloud environment
// following AWS best practices for security, monitoring, and compliance.
//
// Args:
//   - scope: The parent construct
//   - id: The unique identifier for this stack
//   - props: Stack properties including environment configuration
//
// Returns:
//
//	A new TapStack instance with all infrastructure components
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment from props or default to 'prod'
	environment := "prod"
	if props != nil && props.Environment != "" {
		environment = props.Environment
	}

	// Create CloudTrail bucket for audit logging
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-cloudtrail-" + environment),
		Versioned:         jsii.Bool(true),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
			},
		},
	})

	// Create CloudTrail for comprehensive audit logging
	awscloudtrail.NewTrail(stack, jsii.String("AuditTrail"), &awscloudtrail.TrailProps{
		TrailName:                  jsii.String("proj-audit-trail-" + environment),
		Bucket:                     cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableFileValidation:       jsii.Bool(true),
	})

	// Create security construct (IAM roles and policies)
	securityConstruct := tapConstructs.NewSecurityConstruct(stack, "SecurityConstruct", &tapConstructs.SecurityConstructProps{
		Environment: environment,
	})

	// Create storage construct (S3 bucket with logging)
	storageConstruct := tapConstructs.NewStorageConstruct(stack, "StorageConstruct", &tapConstructs.StorageConstructProps{
		Environment: environment,
	})

	// Create database construct (DynamoDB table)
	databaseConstruct := tapConstructs.NewDatabaseConstruct(stack, "DatabaseConstruct", &tapConstructs.DatabaseConstructProps{
		Environment: environment,
	})

	// Create compute construct (Lambda function)
	computeConstruct := tapConstructs.NewComputeConstruct(stack, "ComputeConstruct", &tapConstructs.ComputeConstructProps{
		Environment:   environment,
		LambdaRole:    securityConstruct.LambdaRole,
		S3Bucket:      storageConstruct.Bucket,
		DynamoDBTable: databaseConstruct.Table,
	})

	return &TapStack{
		Stack:            stack,
		Environment:      environment,
		CloudTrailBucket: cloudTrailBucket,
		MainBucket:       storageConstruct.Bucket,
		LoggingBucket:    storageConstruct.LoggingBucket,
		DynamoDBTable:    databaseConstruct.Table,
		LambdaFunction:   computeConstruct.LambdaFunction,
		LambdaRole:       securityConstruct.LambdaRole,
	}
}

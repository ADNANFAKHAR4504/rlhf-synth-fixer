package lib

import (
	tapConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
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

type TapStack struct {
	awscdk.Stack
	Environment string
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

	// Enhanced CloudTrail setup
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-cloudtrail-" + environment),
		Versioned:         jsii.Bool(true),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:    awss3.StorageClass_INFREQUENT_ACCESS(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
					},
					{
						StorageClass:    awss3.StorageClass_GLACIER(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(60)),
					},
				},
			},
		},
	})

	awscloudtrail.NewTrail(stack, jsii.String("AuditTrail"), &awscloudtrail.TrailProps{
		TrailName:                  jsii.String("proj-audit-trail-" + environment),
		Bucket:                     cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableFileValidation:       jsii.Bool(true),
		SendToCloudWatchLogs:       jsii.Bool(true),
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

	// Create enhanced compute construct with monitoring
	tapConstructs.NewComputeConstruct(stack, "ComputeConstruct", &tapConstructs.ComputeConstructProps{
		Environment:   environment,
		LambdaRole:    securityConstruct.LambdaRole,
		S3Bucket:      storageConstruct.Bucket,
		DynamoDBTable: databaseConstruct.Table,
		AlertingTopic: securityConstruct.AlertingTopic,
		VPC:           securityConstruct.VPC,
	})

	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("AlertingTopicArn"), &awscdk.CfnOutputProps{
		Value:       securityConstruct.AlertingTopic.TopicArn(),
		Description: jsii.String("SNS Topic ARN for infrastructure alerts"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       securityConstruct.VPC.VpcId(),
		Description: jsii.String("VPC ID for private endpoints"),
	})

	return &TapStack{
		Stack:       stack,
		Environment: environment,
	}
}

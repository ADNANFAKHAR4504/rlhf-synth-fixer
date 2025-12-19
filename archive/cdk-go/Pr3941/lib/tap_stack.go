package lib

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// getLambdaAssetPath returns the correct path to Lambda assets
// accounting for different execution contexts (root vs lib directory vs tests)
func getLambdaAssetPath(relativePath string) string {
	// Try the path as-is first (works from root)
	if _, err := os.Stat(relativePath); err == nil {
		return relativePath
	}

	// Try from parent directory (works from lib/)
	parentPath := filepath.Join("..", relativePath)
	if _, err := os.Stat(parentPath); err == nil {
		return parentPath
	}

	// Try from grandparent directory (works from tests/unit)
	grandparentPath := filepath.Join("../..", relativePath)
	if _, err := os.Stat(grandparentPath); err == nil {
		return grandparentPath
	}

	// Try from great-grandparent directory (works from deeper test paths)
	greatGrandparentPath := filepath.Join("../../..", relativePath)
	if _, err := os.Stat(greatGrandparentPath); err == nil {
		return greatGrandparentPath
	}

	// Fallback to original path
	return relativePath
}

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack implements a serverless image processing system with:
// - S3 buckets for source and processed images
// - Lambda function for image processing
// - DynamoDB table for metadata tracking
// - CloudWatch monitoring and alarms
//
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
	// SourceBucket stores the S3 bucket for original images
	SourceBucket awss3.Bucket
	// ProcessedBucket stores the S3 bucket for processed images
	ProcessedBucket awss3.Bucket
	// MetadataTable stores the DynamoDB table for image metadata
	MetadataTable awsdynamodb.Table
	// ImageProcessor stores the Lambda function for image processing
	ImageProcessor awslambda.Function
}

// NewTapStack creates a new instance of TapStack.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance with all resources configured.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Create S3 bucket for source images with lifecycle policies for cost optimization
	sourceBucket := awss3.NewBucket(stack, jsii.String("SourceImageBucket"), &awss3.BucketProps{
		BucketName:         jsii.String(fmt.Sprintf("photo-uploads-%s-%s", *stack.Account(), environmentSuffix)),
		Versioned:          jsii.Bool(false), // No versioning to save costs
		PublicReadAccess:   jsii.Bool(false),
		BlockPublicAccess:  awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:         awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:      awscdk.RemovalPolicy_RETAIN,
		AutoDeleteObjects:  jsii.Bool(false),
		EventBridgeEnabled: jsii.Bool(true),

		// Lifecycle rules for cost optimization
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteOldOriginals"),
				Enabled: jsii.Bool(true),
				Prefix:  jsii.String("originals/"),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:    awss3.StorageClass_INFREQUENT_ACCESS(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
					},
					{
						StorageClass:    awss3.StorageClass_GLACIER_INSTANT_RETRIEVAL(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(90)),
					},
				},
			},
		},

		// CORS configuration for web uploads
		Cors: &[]*awss3.CorsRule{
			{
				AllowedMethods: &[]awss3.HttpMethods{
					awss3.HttpMethods_PUT,
					awss3.HttpMethods_POST,
					awss3.HttpMethods_GET,
				},
				AllowedOrigins: &[]*string{jsii.String("*")}, // Restrict in production
				AllowedHeaders: &[]*string{jsii.String("*")},
				MaxAge:         jsii.Number(3600),
			},
		},
	})

	// Create S3 bucket for processed images
	processedBucket := awss3.NewBucket(stack, jsii.String("ProcessedImageBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("photo-processed-%s-%s", *stack.Account(), environmentSuffix)),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,

		// Lifecycle rules for processed images
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldPreviews"),
				Enabled:    jsii.Bool(true),
				Prefix:     jsii.String("previews/"),
				Expiration: awscdk.Duration_Days(jsii.Number(365)),
			},
		},
	})

	// Create DynamoDB table with optimized configuration
	imageMetadataTable := awsdynamodb.NewTable(stack, jsii.String("ImageMetadataTable"), &awsdynamodb.TableProps{
		TableName: jsii.String(fmt.Sprintf("image-metadata-%s-%s-%s", *stack.Region(), *stack.Account(), environmentSuffix)),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("imageId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("timestamp"),
			Type: awsdynamodb.AttributeType_NUMBER,
		},
		BillingMode:   awsdynamodb.BillingMode_PAY_PER_REQUEST, // Cost-efficient for 2000 daily uploads
		RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
		PointInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
			PointInTimeRecoveryEnabled: jsii.Bool(true),
		},

		// Enable DynamoDB Streams for future extensibility
		Stream: awsdynamodb.StreamViewType_NEW_AND_OLD_IMAGES,

		// Time to Live for automatic cleanup
		TimeToLiveAttribute: jsii.String("ttl"),
	})

	// Add Global Secondary Index for querying by status
	imageMetadataTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexProps{
		IndexName: jsii.String("StatusIndex"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("processingStatus"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("timestamp"),
			Type: awsdynamodb.AttributeType_NUMBER,
		},
		ProjectionType: awsdynamodb.ProjectionType_ALL,
	})

	// Add GSI for user queries
	imageMetadataTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexProps{
		IndexName: jsii.String("UserIndex"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("userId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("timestamp"),
			Type: awsdynamodb.AttributeType_NUMBER,
		},
		ProjectionType: awsdynamodb.ProjectionType_ALL,
	})

	// Create Lambda execution role with least privilege
	lambdaRole := awsiam.NewRole(stack, jsii.String("ImageProcessorRole"), &awsiam.RoleProps{
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("Role for image processing Lambda function"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	// Create CloudWatch Log Group for Lambda
	logGroup := awslogs.NewLogGroup(stack, jsii.String("ImageProcessorLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/lambda/image-processor-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
	})

	// Create Lambda function with optimized settings
	lambdaPath := getLambdaAssetPath("lib/lambda/image-processor")
	imageProcessor := awslambda.NewFunction(stack, jsii.String("ImageProcessorFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("image-processor-%s", environmentSuffix)),
		Runtime:      awslambda.Runtime_PROVIDED_AL2023(), // Go custom runtime
		Code:         awslambda.Code_FromAsset(jsii.String(lambdaPath), nil),
		Handler:      jsii.String("bootstrap"),
		Role:         lambdaRole,

		// Optimized settings for image processing
		MemorySize:                   jsii.Number(1024), // Balanced for cost/performance
		Timeout:                      awscdk.Duration_Seconds(jsii.Number(30)),
		ReservedConcurrentExecutions: jsii.Number(10),                          // Prevent runaway costs
		EphemeralStorageSize:         awscdk.Size_Mebibytes(jsii.Number(1024)), // For temp image storage

		Environment: &map[string]*string{
			"SOURCE_BUCKET":    sourceBucket.BucketName(),
			"PROCESSED_BUCKET": processedBucket.BucketName(),
			"METADATA_TABLE":   imageMetadataTable.TableName(),
			"LOG_LEVEL":        jsii.String("INFO"),
			"MAX_IMAGE_SIZE":   jsii.String("10485760"), // 10MB
			"PREVIEW_SIZES":    jsii.String("150x150,300x300,800x800"),
		},

		// Enable X-Ray for performance monitoring
		Tracing: awslambda.Tracing_ACTIVE,

		// Log configuration
		LogGroup: logGroup,

		// Dead letter queue for failed processing
		DeadLetterQueueEnabled: jsii.Bool(true),
		MaxEventAge:            awscdk.Duration_Hours(jsii.Number(1)),
		RetryAttempts:          jsii.Number(2),
	})

	// Grant necessary permissions
	sourceBucket.GrantRead(imageProcessor, nil)
	processedBucket.GrantReadWrite(imageProcessor, nil)
	imageMetadataTable.GrantReadWriteData(imageProcessor)

	// Add S3 event source with prefix filter only
	// Note: Lambda will handle file type filtering
	imageProcessor.AddEventSource(awslambdaeventsources.NewS3EventSource(sourceBucket, &awslambdaeventsources.S3EventSourceProps{
		Events: &[]awss3.EventType{
			awss3.EventType_OBJECT_CREATED,
		},
		Filters: &[]*awss3.NotificationKeyFilter{
			{
				Prefix: jsii.String("uploads/"),
			},
		},
	}))

	// Create CloudWatch Dashboard
	dashboard := awscloudwatch.NewDashboard(stack, jsii.String("ImageProcessorDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String(fmt.Sprintf("image-processor-metrics-%s", environmentSuffix)),
		Start:         jsii.String("-PT6H"),
	})

	// Add metrics widgets
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title:  jsii.String("Lambda Invocations"),
			Width:  jsii.Number(12),
			Height: jsii.Number(6),
			Left: &[]awscloudwatch.IMetric{
				imageProcessor.MetricInvocations(nil),
				imageProcessor.MetricErrors(nil),
			},
		}),
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title:  jsii.String("Lambda Duration"),
			Width:  jsii.Number(12),
			Height: jsii.Number(6),
			Left: &[]awscloudwatch.IMetric{
				imageProcessor.MetricDuration(nil),
			},
		}),
	)

	// Create CloudWatch Alarms
	awscloudwatch.NewAlarm(stack, jsii.String("HighErrorRate"), &awscloudwatch.AlarmProps{
		AlarmName:         jsii.String(fmt.Sprintf("image-processor-high-error-rate-%s", environmentSuffix)),
		AlarmDescription:  jsii.String("Alert when Lambda error rate is too high"),
		Metric:            imageProcessor.MetricErrors(nil),
		Threshold:         jsii.Number(10),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	awscloudwatch.NewAlarm(stack, jsii.String("HighDuration"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("image-processor-high-duration-%s", environmentSuffix)),
		AlarmDescription: jsii.String("Alert when Lambda duration is too high"),
		Metric: imageProcessor.MetricDuration(&awscloudwatch.MetricOptions{
			Statistic: jsii.String("Average"),
		}),
		Threshold:         jsii.Number(20000), // 20 seconds
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Output important values
	awscdk.NewCfnOutput(stack, jsii.String("SourceBucketName"), &awscdk.CfnOutputProps{
		Value:       sourceBucket.BucketName(),
		Description: jsii.String("Name of the source image bucket"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ProcessedBucketName"), &awscdk.CfnOutputProps{
		Value:       processedBucket.BucketName(),
		Description: jsii.String("Name of the processed image bucket"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("MetadataTableName"), &awscdk.CfnOutputProps{
		Value:       imageMetadataTable.TableName(),
		Description: jsii.String("Name of the DynamoDB metadata table"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("LambdaFunctionName"), &awscdk.CfnOutputProps{
		Value:       imageProcessor.FunctionName(),
		Description: jsii.String("Name of the image processor Lambda function"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
		SourceBucket:      sourceBucket,
		ProcessedBucket:   processedBucket,
		MetadataTable:     imageMetadataTable,
		ImageProcessor:    imageProcessor,
	}
}

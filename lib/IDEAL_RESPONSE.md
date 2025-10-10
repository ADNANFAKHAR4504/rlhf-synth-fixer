# Serverless Image Processing System - CDK Go Implementation

## Complete Stack Implementation

```go
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

func getLambdaAssetPath(relativePath string) string {
	if _, err := os.Stat(relativePath); err == nil {
		return relativePath
	}

	parentPath := filepath.Join("..", relativePath)
	if _, err := os.Stat(parentPath); err == nil {
		return parentPath
	}

	return relativePath
}

type TapStackProps struct {
	*awscdk.StackProps
	EnvironmentSuffix *string
}

type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
	SourceBucket      awss3.Bucket
	ProcessedBucket   awss3.Bucket
	MetadataTable     awsdynamodb.Table
	ImageProcessor    awslambda.Function
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	sourceBucket := awss3.NewBucket(stack, jsii.String("SourceImageBucket"), &awss3.BucketProps{
		BucketName:         jsii.String(fmt.Sprintf("photo-uploads-%s-%s", *stack.Account(), environmentSuffix)),
		Versioned:          jsii.Bool(false),
		PublicReadAccess:   jsii.Bool(false),
		BlockPublicAccess:  awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:         awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:      awscdk.RemovalPolicy_RETAIN,
		AutoDeleteObjects:  jsii.Bool(false),
		EventBridgeEnabled: jsii.Bool(true),

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

		Cors: &[]*awss3.CorsRule{
			{
				AllowedMethods: &[]awss3.HttpMethods{
					awss3.HttpMethods_PUT,
					awss3.HttpMethods_POST,
					awss3.HttpMethods_GET,
				},
				AllowedOrigins: &[]*string{jsii.String("*")},
				AllowedHeaders: &[]*string{jsii.String("*")},
				MaxAge:         jsii.Number(3600),
			},
		},
	})

	processedBucket := awss3.NewBucket(stack, jsii.String("ProcessedImageBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("photo-processed-%s-%s", *stack.Account(), environmentSuffix)),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,

		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldPreviews"),
				Enabled:    jsii.Bool(true),
				Prefix:     jsii.String("previews/"),
				Expiration: awscdk.Duration_Days(jsii.Number(365)),
			},
		},
	})

	imageMetadataTable := awsdynamodb.NewTable(stack, jsii.String("ImageMetadataTable"), &awsdynamodb.TableProps{
		TableName: jsii.String(fmt.Sprintf("image-metadata-%s", environmentSuffix)),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("imageId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("timestamp"),
			Type: awsdynamodb.AttributeType_NUMBER,
		},
		BillingMode:   awsdynamodb.BillingMode_PAY_PER_REQUEST,
		RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
		PointInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
			PointInTimeRecoveryEnabled: jsii.Bool(true),
		},

		Stream: awsdynamodb.StreamViewType_NEW_AND_OLD_IMAGES,

		TimeToLiveAttribute: jsii.String("ttl"),
	})

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

	lambdaRole := awsiam.NewRole(stack, jsii.String("ImageProcessorRole"), &awsiam.RoleProps{
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("Role for image processing Lambda function"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	logGroup := awslogs.NewLogGroup(stack, jsii.String("ImageProcessorLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/lambda/image-processor-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
	})

	lambdaPath := getLambdaAssetPath("lib/lambda/image-processor")
	imageProcessor := awslambda.NewFunction(stack, jsii.String("ImageProcessorFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("image-processor-%s", environmentSuffix)),
		Runtime:      awslambda.Runtime_PROVIDED_AL2023(),
		Code:         awslambda.Code_FromAsset(jsii.String(lambdaPath), nil),
		Handler:      jsii.String("bootstrap"),
		Role:         lambdaRole,

		MemorySize:                   jsii.Number(1024),
		Timeout:                      awscdk.Duration_Seconds(jsii.Number(30)),
		ReservedConcurrentExecutions: jsii.Number(10),
		EphemeralStorageSize:         awscdk.Size_Mebibytes(jsii.Number(1024)),

		Environment: &map[string]*string{
			"SOURCE_BUCKET":    sourceBucket.BucketName(),
			"PROCESSED_BUCKET": processedBucket.BucketName(),
			"METADATA_TABLE":   imageMetadataTable.TableName(),
			"LOG_LEVEL":        jsii.String("INFO"),
			"MAX_IMAGE_SIZE":   jsii.String("10485760"),
			"PREVIEW_SIZES":    jsii.String("150x150,300x300,800x800"),
		},

		Tracing: awslambda.Tracing_ACTIVE,

		LogGroup: logGroup,

		DeadLetterQueueEnabled: jsii.Bool(true),
		MaxEventAge:            awscdk.Duration_Hours(jsii.Number(1)),
		RetryAttempts:          jsii.Number(2),
	})

	sourceBucket.GrantRead(imageProcessor, nil)
	processedBucket.GrantReadWrite(imageProcessor, nil)
	imageMetadataTable.GrantReadWriteData(imageProcessor)

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

	dashboard := awscloudwatch.NewDashboard(stack, jsii.String("ImageProcessorDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String(fmt.Sprintf("image-processor-metrics-%s", environmentSuffix)),
		Start:         jsii.String("-PT6H"),
	})

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
		Threshold:         jsii.Number(20000),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

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
```

## Key Components

### Infrastructure Resources

- **Source S3 Bucket**: Stores original uploaded images with lifecycle policies for cost optimization
- **Processed S3 Bucket**: Stores processed images with automatic expiration
- **DynamoDB Table**: Tracks image metadata with GSI for status and user queries
- **Lambda Function**: Go-based image processor with custom runtime
- **CloudWatch Dashboard**: Real-time monitoring with invocation and duration metrics
- **CloudWatch Alarms**: Alerts for high error rates and processing duration

### Cost Optimization Features

- PAY_PER_REQUEST billing for DynamoDB
- S3 lifecycle transitions to Infrequent Access and Glacier
- Reserved concurrency limits on Lambda (10)
- Automatic deletion of old processed images (365 days)
- 1024MB Lambda memory for balanced cost/performance

### Security Features

- S3 encryption at rest (S3_MANAGED)
- Block all public access on S3 buckets
- Least privilege IAM roles
- X-Ray tracing enabled
- CloudWatch logs with 1-week retention

### Scalability Features

- DynamoDB Streams enabled
- Point-in-time recovery
- Dead letter queue for failed processing
- Global Secondary Indexes for efficient queries
- Event-driven architecture with S3 triggers

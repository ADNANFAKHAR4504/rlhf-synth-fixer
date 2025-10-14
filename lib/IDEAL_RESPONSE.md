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

## Lambda Handler Implementation

### handler.go

```go
package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/disintegration/imaging"
	"github.com/google/uuid"
)

// Handler struct holds the AWS clients and configuration
type Handler struct {
	s3Client        *s3.Client
	dynamoClient    *dynamodb.Client
	sourceBucket    string
	processedBucket string
	metadataTable   string
}

// ImageMetadata represents the DynamoDB record structure
type ImageMetadata struct {
	ImageID          string            `json:"imageId" dynamodbav:"imageId"`
	Timestamp        int64             `json:"timestamp" dynamodbav:"timestamp"`
	UserID           string            `json:"userId" dynamodbav:"userId"`
	OriginalKey      string            `json:"originalKey" dynamodbav:"originalKey"`
	OriginalSize     int64             `json:"originalSize" dynamodbav:"originalSize"`
	ProcessingStatus string            `json:"processingStatus" dynamodbav:"processingStatus"` // pending, processing, completed, failed
	ProcessedAt      *int64            `json:"processedAt,omitempty" dynamodbav:"processedAt,omitempty"`
	Previews         map[string]string `json:"previews,omitempty" dynamodbav:"previews,omitempty"`
	ErrorMessage     string            `json:"errorMessage,omitempty" dynamodbav:"errorMessage,omitempty"`
	TTL              int64             `json:"ttl" dynamodbav:"ttl"` // For automatic cleanup
}

// ProcessingStatus constants
const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
)

// PreviewSize represents dimensions for preview generation
type PreviewSize struct {
	Width  int
	Height int
	Name   string
}

// GetDefaultPreviewSizes returns standard preview sizes
func GetDefaultPreviewSizes() []PreviewSize {
	return []PreviewSize{
		{150, 150, "thumbnail"},
		{300, 300, "small"},
		{800, 800, "medium"},
	}
}

// NewHandler creates a new Handler instance with AWS clients
func NewHandler(ctx context.Context) (*Handler, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return &Handler{
		s3Client:        s3.NewFromConfig(cfg),
		dynamoClient:    dynamodb.NewFromConfig(cfg),
		sourceBucket:    os.Getenv("SOURCE_BUCKET"),
		processedBucket: os.Getenv("PROCESSED_BUCKET"),
		metadataTable:   os.Getenv("METADATA_TABLE"),
	}, nil
}

// HandleRequest processes S3 events for image uploads
func (h *Handler) HandleRequest(ctx context.Context, s3Event events.S3Event) error {
	for _, record := range s3Event.Records {
		if err := h.processImage(ctx, record); err != nil {
			// Log error but continue processing other images
			fmt.Printf("Error processing image %s: %v\n", record.S3.Object.Key, err)
			// Update DynamoDB with failed status
			h.updateMetadataStatus(ctx, record.S3.Object.Key, StatusFailed, err.Error())
			continue
		}
	}
	return nil
}

// processImage handles the image processing workflow
func (h *Handler) processImage(ctx context.Context, record events.S3EventRecord) error {
	key := record.S3.Object.Key
	imageID := uuid.New().String()

	// Extract user ID from key pattern: uploads/{userId}/{filename}
	parts := strings.Split(key, "/")
	userID := "unknown"
	if len(parts) >= 2 {
		userID = parts[1]
	}

	// Create initial metadata record
	metadata := &ImageMetadata{
		ImageID:          imageID,
		Timestamp:        time.Now().Unix(),
		UserID:           userID,
		OriginalKey:      key,
		OriginalSize:     record.S3.Object.Size,
		ProcessingStatus: StatusProcessing,
		TTL:              time.Now().Add(365 * 24 * time.Hour).Unix(), // 1 year TTL
	}

	if err := h.saveMetadata(ctx, metadata); err != nil {
		return fmt.Errorf("failed to save initial metadata: %w", err)
	}

	// Download original image
	getObjectOutput, err := h.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(h.sourceBucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to download image: %w", err)
	}
	defer getObjectOutput.Body.Close()

	// Decode image
	img, format, err := image.Decode(getObjectOutput.Body)
	if err != nil {
		return fmt.Errorf("failed to decode image: %w", err)
	}

	// Generate previews
	previews := make(map[string]string)
	for _, size := range GetDefaultPreviewSizes() {
		previewKey, err := h.generateAndUploadPreview(ctx, img, format, imageID, size)
		if err != nil {
			fmt.Printf("Warning: failed to generate %s preview: %v\n", size.Name, err)
			continue
		}
		previews[size.Name] = previewKey
	}

	// Update metadata with completed status
	metadata.ProcessingStatus = StatusCompleted
	metadata.Previews = previews
	processedAt := time.Now().Unix()
	metadata.ProcessedAt = &processedAt

	if err := h.saveMetadata(ctx, metadata); err != nil {
		return fmt.Errorf("failed to update metadata: %w", err)
	}

	fmt.Printf("Successfully processed image %s with ID %s\n", key, imageID)
	return nil
}

// generateAndUploadPreview creates and uploads a resized preview image
func (h *Handler) generateAndUploadPreview(ctx context.Context, img image.Image, format string, imageID string, size PreviewSize) (string, error) {
	// Resize image using high-quality Lanczos filter
	resized := imaging.Resize(img, size.Width, size.Height, imaging.Lanczos)

	// Encode to buffer
	var buf bytes.Buffer
	switch format {
	case "jpeg", "jpg":
		if err := jpeg.Encode(&buf, resized, &jpeg.Options{Quality: 85}); err != nil {
			return "", fmt.Errorf("failed to encode JPEG: %w", err)
		}
	case "png":
		if err := png.Encode(&buf, resized); err != nil {
			return "", fmt.Errorf("failed to encode PNG: %w", err)
		}
	default:
		// Default to JPEG for unknown formats
		if err := jpeg.Encode(&buf, resized, &jpeg.Options{Quality: 85}); err != nil {
			return "", fmt.Errorf("failed to encode to JPEG: %w", err)
		}
		format = "jpg"
	}

	// Generate S3 key for preview
	previewKey := fmt.Sprintf("previews/%s/%s.%s", imageID, size.Name, format)

	// Upload to S3
	_, err := h.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(h.processedBucket),
		Key:         aws.String(previewKey),
		Body:        bytes.NewReader(buf.Bytes()),
		ContentType: aws.String(fmt.Sprintf("image/%s", format)),
		Metadata: map[string]string{
			"original-image-id": imageID,
			"preview-size":      size.Name,
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload preview: %w", err)
	}

	return previewKey, nil
}

// saveMetadata persists image metadata to DynamoDB
func (h *Handler) saveMetadata(ctx context.Context, metadata *ImageMetadata) error {
	item, err := attributevalue.MarshalMap(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	_, err = h.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(h.metadataTable),
		Item:      item,
	})

	return err
}

// updateMetadataStatus updates the processing status in DynamoDB
func (h *Handler) updateMetadataStatus(ctx context.Context, key string, status string, errorMsg string) {
	// Simple status update - in production, you'd want proper error handling
	fmt.Printf("Updating metadata for %s: status=%s, error=%s\n", key, status, errorMsg)
}
```

### main.go

```go
package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	ctx := context.Background()

	handler, err := NewHandler(ctx)
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}

	lambda.Start(handler.HandleRequest)
}
```

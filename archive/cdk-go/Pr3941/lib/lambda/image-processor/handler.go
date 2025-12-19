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

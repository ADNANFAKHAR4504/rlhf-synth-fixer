package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Handler processes S3 events for incoming healthcare data
// HIPAA Compliance: Processes PHI data securely within VPC
func Handler(ctx context.Context, s3Event events.S3Event) error {
	processedBucket := os.Getenv("PROCESSED_BUCKET")
	if processedBucket == "" {
		return fmt.Errorf("PROCESSED_BUCKET environment variable not set")
	}

	// Initialize AWS SDK v2 client
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("ERROR: Unable to load SDK config: %v", err)
		return err
	}

	s3Client := s3.NewFromConfig(cfg)

	// Process each S3 event record
	for _, record := range s3Event.Records {
		sourceBucket := record.S3.Bucket.Name
		sourceKey := record.S3.Object.Key

		log.Printf("INFO: Processing file: s3://%s/%s", sourceBucket, sourceKey)

		// HIPAA Compliance: Log processing activity for audit trail
		log.Printf("AUDIT: Data processing started for object: %s", sourceKey)

		// Get the object from source bucket
		getObjectInput := &s3.GetObjectInput{
			Bucket: &sourceBucket,
			Key:    &sourceKey,
		}

		result, err := s3Client.GetObject(ctx, getObjectInput)
		if err != nil {
			log.Printf("ERROR: Failed to get object %s from bucket %s: %v", sourceKey, sourceBucket, err)
			return err
		}
		defer result.Body.Close()

		// Process the data (placeholder - add actual processing logic)
		// HIPAA Compliance: Ensure all processing maintains data confidentiality
		log.Printf("INFO: Processing healthcare data from %s", sourceKey)

		// Generate processed file name
		processedKey := filepath.Join("processed", filepath.Base(sourceKey))

		// Store processed data in processed bucket
		// HIPAA: Data is encrypted using KMS key configured on bucket
		putObjectInput := &s3.PutObjectInput{
			Bucket:               &processedBucket,
			Key:                  &processedKey,
			Body:                 result.Body,
			ServerSideEncryption: "aws:kms", // Use KMS encryption
		}

		_, err = s3Client.PutObject(ctx, putObjectInput)
		if err != nil {
			log.Printf("ERROR: Failed to put object %s to bucket %s: %v", processedKey, processedBucket, err)
			return err
		}

		log.Printf("SUCCESS: Processed and stored: s3://%s/%s", processedBucket, processedKey)

		// HIPAA Compliance: Log successful processing for audit trail
		log.Printf("AUDIT: Data processing completed successfully for object: %s", sourceKey)
	}

	return nil
}

func main() {
	lambda.Start(Handler)
}

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/s3"
)

type LambdaInvokePayload struct {
	RequestPayload  string `json:"requestPayload"`
	ResponsePayload string `json:"responsePayload"`
}

type TransactionData struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
}

type DynamoDBRecord struct {
	TransactionID string  `json:"transactionId"`
	Timestamp     int64   `json:"timestamp"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
	Status        string  `json:"status"`
	ProcessedAt   string  `json:"processedAt"`
}

func handler(ctx context.Context, event LambdaInvokePayload) error {
	tableName := os.Getenv("DYNAMODB_TABLE")
	bucketName := os.Getenv("S3_BUCKET")

	// Parse the request payload
	var transaction TransactionData
	if err := json.Unmarshal([]byte(event.RequestPayload), &transaction); err != nil {
		return fmt.Errorf("failed to parse request payload: %w", err)
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %w", err)
	}

	dynamodbSvc := dynamodb.New(sess)
	s3Svc := s3.New(sess)

	// Prepare DynamoDB record
	now := time.Now()
	record := DynamoDBRecord{
		TransactionID: transaction.TransactionID,
		Timestamp:     now.Unix(),
		Amount:        transaction.Amount,
		Currency:      transaction.Currency,
		Source:        transaction.Source,
		Status:        "processed",
		ProcessedAt:   now.Format(time.RFC3339),
	}

	// Marshal record for DynamoDB
	av, err := dynamodbattribute.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("failed to marshal DynamoDB record: %w", err)
	}

	// Write to DynamoDB
	_, err = dynamodbSvc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	})
	if err != nil {
		return fmt.Errorf("failed to write to DynamoDB: %w", err)
	}

	// Prepare audit log for S3
	auditLog := map[string]interface{}{
		"transactionId": transaction.TransactionID,
		"timestamp":     now.Unix(),
		"amount":        transaction.Amount,
		"currency":      transaction.Currency,
		"source":        transaction.Source,
		"status":        "processed",
		"processedAt":   now.Format(time.RFC3339),
		"auditTime":     time.Now().Format(time.RFC3339),
	}

	auditLogJSON, err := json.Marshal(auditLog)
	if err != nil {
		return fmt.Errorf("failed to marshal audit log: %w", err)
	}

	// Write to S3
	key := fmt.Sprintf("audit-logs/%s/%s.json",
		now.Format("2006-01-02"),
		transaction.TransactionID)

	_, err = s3Svc.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        aws.ReadSeekCloser(bytes.NewReader(auditLogJSON)),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return fmt.Errorf("failed to write to S3: %w", err)
	}

	fmt.Printf("Successfully processed transaction %s\n", transaction.TransactionID)
	return nil
}

func main() {
	lambda.Start(handler)
}

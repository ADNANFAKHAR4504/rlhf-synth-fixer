package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sqs"
)

var (
	s3Client      *s3.S3
	sqsClient     *sqs.SQS
	dynamoClient  *dynamodb.DynamoDB
	queueURL      string
	tableName     string
)

func init() {
	sess := session.Must(session.NewSession())
	s3Client = s3.New(sess)
	sqsClient = sqs.New(sess)
	dynamoClient = dynamodb.New(sess)
	queueURL = os.Getenv("PROCESSOR_QUEUE_URL")
	tableName = os.Getenv("DYNAMODB_TABLE_NAME")
}

type ProcessingStatus struct {
	FileID         string `json:"fileId"`
	Status         string `json:"status"`
	Stage          string `json:"stage"`
	LastUpdated    int64  `json:"lastUpdated"`
	ExpirationTime int64  `json:"expirationTime"`
	BucketName     string `json:"bucketName"`
	ObjectKey      string `json:"objectKey"`
}

func handleRequest(ctx context.Context, s3Event events.S3Event) error {
	for _, record := range s3Event.Records {
		bucketName := record.S3.Bucket.Name
		objectKey := record.S3.Object.Key
		fileID := fmt.Sprintf("%s/%s", bucketName, objectKey)

		fmt.Printf("Processing file: %s\n", fileID)

		// Validate file exists
		_, err := s3Client.GetObject(&s3.GetObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(objectKey),
		})
		if err != nil {
			fmt.Printf("Error getting object: %v\n", err)
			return err
		}

		// Update DynamoDB with validation status
		now := time.Now().Unix()
		expiration := now + (30 * 24 * 60 * 60) // 30 days TTL

		status := ProcessingStatus{
			FileID:         fileID,
			Status:         "validated",
			Stage:          "validator",
			LastUpdated:    now,
			ExpirationTime: expiration,
			BucketName:     bucketName,
			ObjectKey:      objectKey,
		}

		item := map[string]*dynamodb.AttributeValue{
			"fileId":         {S: aws.String(fileID)},
			"status":         {S: aws.String(status.Status)},
			"stage":          {S: aws.String(status.Stage)},
			"lastUpdated":    {N: aws.String(fmt.Sprintf("%d", now))},
			"expirationTime": {N: aws.String(fmt.Sprintf("%d", expiration))},
			"bucketName":     {S: aws.String(bucketName)},
			"objectKey":      {S: aws.String(objectKey)},
		}

		_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      item,
		})
		if err != nil {
			fmt.Printf("Error updating DynamoDB: %v\n", err)
			return err
		}

		// Send message to processor queue
		messageBody, _ := json.Marshal(status)
		_, err = sqsClient.SendMessage(&sqs.SendMessageInput{
			QueueUrl:       aws.String(queueURL),
			MessageBody:    aws.String(string(messageBody)),
			MessageGroupId: aws.String(fileID),
		})
		if err != nil {
			fmt.Printf("Error sending SQS message: %v\n", err)
			return err
		}

		fmt.Printf("File validated successfully: %s\n", fileID)
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}

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
)

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    string
)

func init() {
	sess := session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
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

func handleRequest(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		fmt.Printf("Aggregating message: %s\n", record.MessageId)

		var status ProcessingStatus
		err := json.Unmarshal([]byte(record.Body), &status)
		if err != nil {
			fmt.Printf("Error unmarshaling message: %v\n", err)
			return err
		}

		// Aggregate the results (simulation)
		fmt.Printf("Aggregating results for file: %s\n", status.FileID)

		// Update DynamoDB with completed status
		now := time.Now().Unix()
		status.Status = "completed"
		status.Stage = "aggregator"
		status.LastUpdated = now

		item := map[string]*dynamodb.AttributeValue{
			"fileId":         {S: aws.String(status.FileID)},
			"status":         {S: aws.String(status.Status)},
			"stage":          {S: aws.String(status.Stage)},
			"lastUpdated":    {N: aws.String(fmt.Sprintf("%d", now))},
			"expirationTime": {N: aws.String(fmt.Sprintf("%d", status.ExpirationTime))},
			"bucketName":     {S: aws.String(status.BucketName)},
			"objectKey":      {S: aws.String(status.ObjectKey)},
		}

		_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      item,
		})
		if err != nil {
			fmt.Printf("Error updating DynamoDB: %v\n", err)
			return err
		}

		fmt.Printf("File aggregation completed: %s\n", status.FileID)
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}

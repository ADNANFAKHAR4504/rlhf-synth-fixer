package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

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
	FileID      string `json:"fileId"`
	Status      string `json:"status"`
	Stage       string `json:"stage"`
	LastUpdated int64  `json:"lastUpdated"`
	BucketName  string `json:"bucketName"`
	ObjectKey   string `json:"objectKey"`
}

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	fileID := request.PathParameters["fileId"]
	if fileID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"error": "fileId is required"}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	fmt.Printf("Querying status for file: %s\n", fileID)

	// Get item from DynamoDB
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"fileId": {S: aws.String(fileID)},
		},
	})
	if err != nil {
		fmt.Printf("Error querying DynamoDB: %v\n", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf(`{"error": "Internal server error: %v"}`, err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if result.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       `{"error": "File not found"}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Parse the result
	status := ProcessingStatus{}
	if val, ok := result.Item["fileId"]; ok && val.S != nil {
		status.FileID = *val.S
	}
	if val, ok := result.Item["status"]; ok && val.S != nil {
		status.Status = *val.S
	}
	if val, ok := result.Item["stage"]; ok && val.S != nil {
		status.Stage = *val.S
	}
	if val, ok := result.Item["bucketName"]; ok && val.S != nil {
		status.BucketName = *val.S
	}
	if val, ok := result.Item["objectKey"]; ok && val.S != nil {
		status.ObjectKey = *val.S
	}

	responseBody, _ := json.Marshal(status)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}

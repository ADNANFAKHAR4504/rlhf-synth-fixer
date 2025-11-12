package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type Transaction struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	ProcessorID   string  `json:"processorId"`
	Timestamp     int64   `json:"timestamp"`
}

var dynamoClient *dynamodb.DynamoDB
var tableName string

func init() {
	sess := session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	tableName = os.Getenv("DYNAMODB_TABLE")
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		// Parse SNS message from SQS
		var snsMessage struct {
			Message string `json:"Message"`
		}
		if err := json.Unmarshal([]byte(record.Body), &snsMessage); err != nil {
			fmt.Printf("Error parsing SNS message: %v\n", err)
			continue
		}

		// Parse transaction data
		var transaction Transaction
		if err := json.Unmarshal([]byte(snsMessage.Message), &transaction); err != nil {
			fmt.Printf("Error parsing transaction: %v\n", err)
			continue
		}

		// Store in DynamoDB
		timestamp := transaction.Timestamp
		if timestamp == 0 {
			timestamp = time.Now().Unix()
		}

		_, err := dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item: map[string]*dynamodb.AttributeValue{
				"transactionId": {
					S: aws.String(transaction.TransactionID),
				},
				"timestamp": {
					N: aws.String(strconv.FormatInt(timestamp, 10)),
				},
				"amount": {
					N: aws.String(fmt.Sprintf("%.2f", transaction.Amount)),
				},
				"currency": {
					S: aws.String(transaction.Currency),
				},
				"processorId": {
					S: aws.String(transaction.ProcessorID),
				},
				"recordedAt": {
					N: aws.String(strconv.FormatInt(time.Now().Unix(), 10)),
				},
			},
		})

		if err != nil {
			fmt.Printf("Error storing transaction %s: %v\n", transaction.TransactionID, err)
			return err
		}

		fmt.Printf("Successfully recorded transaction: %s\n", transaction.TransactionID)
	}

	return nil
}

func main() {
	lambda.Start(handler)
}

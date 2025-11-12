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
	"github.com/aws/aws-sdk-go/service/sns"
)

type PaymentWebhook struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	ProcessorID   string  `json:"processorId"`
	Timestamp     int64   `json:"timestamp"`
}

var snsClient *sns.SNS
var topicArn string

func init() {
	sess := session.Must(session.NewSession())
	snsClient = sns.New(sess)
	topicArn = os.Getenv("SNS_TOPIC_ARN")
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Parse the webhook payload
	var webhook PaymentWebhook
	if err := json.Unmarshal([]byte(request.Body), &webhook); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       fmt.Sprintf("Invalid payload: %v", err),
		}, nil
	}

	// Validate required fields
	if webhook.TransactionID == "" || webhook.Amount <= 0 || webhook.Currency == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Missing required fields",
		}, nil
	}

	// Publish to SNS topic
	messageBody, err := json.Marshal(webhook)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to serialize message: %v", err),
		}, nil
	}

	_, err = snsClient.Publish(&sns.PublishInput{
		TopicArn: aws.String(topicArn),
		Message:  aws.String(string(messageBody)),
		MessageAttributes: map[string]*sns.MessageAttributeValue{
			"transactionId": {
				DataType:    aws.String("String"),
				StringValue: aws.String(webhook.TransactionID),
			},
		},
	})

	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to publish message: %v", err),
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       fmt.Sprintf("Transaction %s processed successfully", webhook.TransactionID),
	}, nil
}

func main() {
	lambda.Start(handler)
}

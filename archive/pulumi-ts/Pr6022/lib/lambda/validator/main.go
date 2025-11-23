package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type TransactionRequest struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
}

type TransactionResponse struct {
	Message       string `json:"message"`
	TransactionID string `json:"transactionId,omitempty"`
	Valid         bool   `json:"valid"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var transaction TransactionRequest

	// Parse request body
	if err := json.Unmarshal([]byte(request.Body), &transaction); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Invalid request body", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Validate transaction
	if transaction.TransactionID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "TransactionID is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Amount <= 0 {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Amount must be greater than zero", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Currency == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Currency is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Source == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Source is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Validation successful
	response := TransactionResponse{
		Message:       "Transaction validated successfully",
		TransactionID: transaction.TransactionID,
		Valid:         true,
	}

	responseBody, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"message": "Internal server error", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handler)
}

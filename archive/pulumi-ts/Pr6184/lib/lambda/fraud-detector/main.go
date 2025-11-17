package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Transaction struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	ProcessorID   string  `json:"processorId"`
	Timestamp     int64   `json:"timestamp"`
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

		// Fraud detection logic
		fraudScore := analyzeFraudRisk(transaction)

		if fraudScore > 0.7 {
			fmt.Printf("ALERT: High fraud risk detected for transaction %s (score: %.2f)\n",
				transaction.TransactionID, fraudScore)
		} else {
			fmt.Printf("Transaction %s analyzed - fraud score: %.2f (LOW RISK)\n",
				transaction.TransactionID, fraudScore)
		}
	}

	return nil
}

func analyzeFraudRisk(t Transaction) float64 {
	score := 0.0

	// Check for suspiciously high amounts
	if t.Amount > 10000 {
		score += 0.3
	}

	// Check for rapid transactions (simplified)
	// In production, this would check against recent transaction history
	if t.Amount > 5000 {
		score += 0.2
	}

	// Check for unusual currency patterns
	if t.Currency != "USD" && t.Currency != "EUR" && t.Currency != "GBP" {
		score += 0.15
	}

	// Additional checks would include:
	// - Geographic anomalies
	// - Velocity checks
	// - Historical patterns
	// - Machine learning model predictions

	return score
}

func main() {
	lambda.Start(handler)
}

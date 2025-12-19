package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	_ "github.com/lib/pq"
)

type Transaction struct {
	ID         string  `json:"id"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	MerchantID string  `json:"merchant_id"`
	CustomerID string  `json:"customer_id"`
	Timestamp  string  `json:"timestamp"`
}

type ValidationResult struct {
	TransactionID string `json:"transaction_id"`
	Valid         bool   `json:"valid"`
	Reason        string `json:"reason,omitempty"`
}

var (
	db          *sql.DB
	s3Client    *s3.Client
	sqsClient   *sqs.Client
	environment string
	dbHost      string
	dbPort      string
	dbName      string
	queueURL    string
	dataBucket  string
)

func init() {
	environment = os.Getenv("ENVIRONMENT")
	dbHost = os.Getenv("DB_HOST")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	queueURL = os.Getenv("QUEUE_URL")
	dataBucket = os.Getenv("DATA_BUCKET")

	// Initialize database connection
	var err error
	dbURL := fmt.Sprintf("postgres://admin:password@%s:%s/%s?sslmode=require",
		dbHost, dbPort, dbName)
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Initialize AWS SDK clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	s3Client = s3.NewFromConfig(cfg)
	sqsClient = sqs.NewFromConfig(cfg)
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		var transaction Transaction
		err := json.Unmarshal([]byte(record.Body), &transaction)
		if err != nil {
			fmt.Printf("Error unmarshaling transaction: %v\n", err)
			continue
		}

		result := validateTransaction(ctx, transaction)

		// Store validation result in S3
		err = storeResult(ctx, result)
		if err != nil {
			fmt.Printf("Error storing result: %v\n", err)
			return err
		}

		// Delete message from queue if processing succeeded
		if result.Valid {
			fmt.Printf("Transaction %s validated successfully\n", transaction.ID)
		} else {
			fmt.Printf("Transaction %s validation failed: %s\n", transaction.ID, result.Reason)
		}
	}

	return nil
}

func validateTransaction(ctx context.Context, tx Transaction) ValidationResult {
	result := ValidationResult{
		TransactionID: tx.ID,
		Valid:         true,
	}

	// Validate amount
	if tx.Amount <= 0 {
		result.Valid = false
		result.Reason = "Invalid amount"
		return result
	}

	// Validate currency
	if tx.Currency == "" {
		result.Valid = false
		result.Reason = "Missing currency"
		return result
	}

	// Check for fraud patterns in database
	var fraudCount int
	err := db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM fraud_patterns WHERE merchant_id = $1 OR customer_id = $2",
		tx.MerchantID, tx.CustomerID).Scan(&fraudCount)

	if err != nil {
		fmt.Printf("Database query error: %v\n", err)
		result.Valid = false
		result.Reason = "Database validation error"
		return result
	}

	if fraudCount > 0 {
		result.Valid = false
		result.Reason = "Fraud pattern detected"
		return result
	}

	return result
}

func storeResult(ctx context.Context, result ValidationResult) error {
	_, err := json.Marshal(result)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("validation-results/%s/%s.json", environment, result.TransactionID)

	// Store result in S3 (implementation simplified for brevity)
	fmt.Printf("Would store result to s3://%s/%s\n", dataBucket, key)

	return nil
}

func main() {
	lambda.Start(handler)
}

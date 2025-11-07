package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

type NotificationEvent struct {
	TransactionID string `json:"transactionId"`
	Status        string `json:"status"`
	Message       string `json:"message"`
}

func handler(ctx context.Context, event NotificationEvent) error {
	// In a real implementation, this would send notifications via SNS, SES, or other services
	// For this example, we'll just log the notification

	notification := map[string]interface{}{
		"transactionId": event.TransactionID,
		"status":        event.Status,
		"message":       event.Message,
		"notifiedAt":    time.Now().Format(time.RFC3339),
	}

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	fmt.Printf("Notification sent: %s\n", string(notificationJSON))
	return nil
}

func main() {
	lambda.Start(handler)
}

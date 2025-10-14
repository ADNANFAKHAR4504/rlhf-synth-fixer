package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	ctx := context.Background()

	handler, err := NewHandler(ctx)
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}

	lambda.Start(handler.HandleRequest)
}

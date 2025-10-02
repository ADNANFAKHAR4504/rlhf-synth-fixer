I need to build a simple, cost-efficient processing system for a retail application that handles about 1,000 order notifications per day. The processing should be asynchronous, reliable, and each outcome should be logged for tracking.

Please create this as a single AWS CloudFormation template with the following:
• SQS (Standard Queue) to manage incoming order messages.
• Lambda function (Node.js) to process each order.
• DynamoDB table to record and track order processing status.
• CloudWatch for monitoring, logging, and visibility into failures.
• IAM roles/policies for secure component interaction.
• Dead Letter Queue (DLQ) to capture and handle failed tasks.

The design should prioritize simplicity, reliability, and cost efficiency, while ensuring operational visibility.

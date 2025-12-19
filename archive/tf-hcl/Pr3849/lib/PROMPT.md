# Subscription Management System Infrastructure

I need to deploy a subscription management system in AWS us-west-2 region that can handle 3,300 daily subscription renewals with payment processing and receipt generation.

## Requirements

The system needs the following AWS services:

1. API Gateway for payment webhooks endpoint
2. Lambda functions using Node.js 20 runtime for payment processing
3. DynamoDB table for storing subscription data with on-demand billing
4. S3 bucket for storing PDF receipts
5. SES for sending email receipts to customers
6. Secrets Manager for storing payment gateway API keys and credentials
7. CloudWatch for monitoring transactions and errors
8. IAM roles and policies for secure access between services
9. Step Functions workflow for handling subscription renewal process with retry logic

## Specific Requirements

- Payment gateway credentials must be stored in Secrets Manager
- Use Step Functions Express Workflows for the renewal workflow with automatic retry logic for failed payments
- Generate PDF receipts for successful payments and store them in S3
- Lambda function should process webhook events, validate subscriptions in DynamoDB, generate receipts, and send emails
- Use DynamoDB on-demand pricing for cost efficiency
- Set up CloudWatch alarms for failed transactions and Lambda errors
- All resources should have proper IAM permissions following least privilege principle
- S3 bucket should have encryption enabled
- Lambda should have environment variables for configuration

Please provide the complete Terraform infrastructure code to deploy this system. Include all necessary IAM roles, policies, and resource configurations. Create separate Terraform files for different resource types for better organization.

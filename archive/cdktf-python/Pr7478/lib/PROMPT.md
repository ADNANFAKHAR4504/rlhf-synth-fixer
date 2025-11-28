# Payment Processing Infrastructure for Multi-Environment Setup

Hey! I need you to build out a serverless payment processing system on AWS using CDKTF with Python. This is for an e-commerce platform that needs to handle payment webhooks from Stripe.

## What We Need

We're looking to build infrastructure that can be deployed across multiple environments (dev, staging, prod) with proper networking, databases, and serverless functions. Here's what I'm thinking:

### Networking Layer
- Set up a VPC with public and private subnets across multiple availability zones for high availability
- Use NAT Gateways so our Lambda functions in private subnets can reach the internet
- Configure proper routing tables and internet gateway

### Database Setup
- We need an RDS PostgreSQL database to store payment transaction records
- Should be accessible from our Lambda functions
- Multi-AZ deployment for production reliability
- Store things like transaction IDs, amounts, status, timestamps

### Lambda Function for Webhook Processing
- Create a Lambda function that receives payment webhooks from Stripe
- Should be deployed in the VPC private subnets with access to the RDS database
- The function needs to:
  - Parse incoming payment webhook data
  - Validate the payload
  - Store transaction details in the database
  - Return appropriate HTTP responses

### Security & Access
- Lambda needs an IAM role with permissions to:
  - Write CloudWatch logs
  - Access the RDS database through VPC networking
  - Execute within the VPC
- Use security groups to control traffic between Lambda and RDS

### Environment Management
- This needs to work for dev, staging, and prod environments
- Each environment should be properly isolated
- Resource naming should include environment identifiers

### Monitoring
- CloudWatch log groups for Lambda execution logs
- Proper log retention policies

## Technical Details

- Use CDKTF with Python
- Deploy to AWS region us-east-1
- Lambda runtime: Python 3.11
- RDS engine: PostgreSQL 15
- Keep everything infrastructure-as-code

The goal is to have a production-ready, scalable payment processing infrastructure that follows AWS best practices and can handle webhook traffic reliably across different environments.

Can you build this out with proper CDKTF structure, including the Lambda function code and all necessary infrastructure components?
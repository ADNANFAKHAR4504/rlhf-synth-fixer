# Multi-Tiered Web App Infrastructure on AWS

Need to deploy a production-ready web application using Pulumi Python in us-west-2. The app has five major parts that all need to work together: frontend, backend API, database, streaming data pipeline, and monitoring. Everything should be secure, scalable, and cost-effective.

## What I Need

### Global Frontend
CloudFront distribution serving static files from an S3 bucket. The S3 bucket should only be accessible through CloudFront using Origin Access Control - no direct public access. Optional Lambda@Edge for request/response manipulation if needed.

### Backend API
API Gateway REST API connected to a Lambda function with Python runtime. Lambda needs to run in a private subnet inside a VPC for security. It should connect to DynamoDB through a VPC endpoint - no public internet traffic. IAM role should have minimal permissions: just dynamodb:PutItem, dynamodb:GetItem, dynamodb:UpdateItem for the specific table.

### Real-time Data Processing
Kinesis Data Stream for ingesting events, with a Lambda consumer that processes the stream and writes results to S3. The consumer Lambda should also be in a private subnet. Use VPC endpoint for S3 access. IAM permissions: kinesis:GetRecords, kinesis:DescribeStream, s3:PutObject.

### Network and Security
Custom VPC with public and private subnets in at least 2 AZs. NAT Gateways in public subnets for outbound internet from private resources. Security groups need to be tight - backend Lambda should only accept traffic from API Gateway, and outbound should be limited to VPC endpoints.

### Monitoring
CloudWatch for logs and metrics from all services. Set up alarms for critical issues like Lambda errors, API Gateway 5xx errors, and Kinesis throughput. Send alerts to an SNS topic.

## Key Requirements

- All data must be encrypted at rest and in transit
- IAM roles should follow least privilege - no wildcards
- Use managed services and auto-scaling to keep costs down
- Network isolation between public and private components
- Code should be modular with clear component separation
- Deploy in us-west-2 region

Keep the Pulumi code clean and well-organized. Use component resources where it makes sense.

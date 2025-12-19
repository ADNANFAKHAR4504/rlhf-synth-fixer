# Problem Statement: Multi-Tiered, Resilient, and Secure Web Application Deployment

You are tasked with deploying a highly available, scalable, and secure web application to AWS using Pulumi Typescript. This application requires a public-facing frontend, a private backend API, a persistent data store, a real-time data processing pipeline, and an internal monitoring and alerting system. Your mission is to connect these five distinct infrastructures into a cohesive and resilient architecture, strictly adhering to security, performance, and cost-efficiency best practices. The infrastructure must be deployed in the us-west-2 region


## Constraints
* Public Frontend: Must be globally distributed for low latency and high availability. It will be serverless to minimize operational overhead.
* Private Backend API: Accessible only by the frontend and internal services. It must be scalable and secure against common web vulnerabilities.
* Persistent Data Store: A highly available, durable, and performant database for application data. Data encryption at rest and in transit is mandatory.
* Real-time Data Processing: A mechanism to ingest and process streaming data from the application, with results stored for analytical purposes.
* Monitoring & Alerting: Comprehensive monitoring of all deployed resources with automated alerts for critical events.
* Network Isolation: Strict network segmentation between public and private components.
* Cost Efficiency: Design the architecture to be cost-effective, utilizing managed services and auto-scaling where appropriate.
* Security Best Practices: Implement IAM least privilege, encryption, and secure configurations for all resources.
* Deployment Automation: The entire infrastructure must be deployed and managed exclusively through CDK Python.

## Requirements

### Infrastructure 1: Global Frontend (Amazon CloudFront, S3 Static Website Hosting, AWS Lambda@Edge)
* **Components**: An S3 bucket configured for static website hosting, an Amazon CloudFront distribution, and an optional AWS Lambda@Edge function.
* **Connections**:
  * The CloudFront distribution will use the S3 bucket as its origin, pulling static web files (HTML, CSS, JS, images) directly from S3.
  * CloudFront's Origin Access Control (OAC) must grant CloudFront secure access to the S3 bucket, preventing direct public access.
  * Lambda@Edge (if implemented) will be associated with the CloudFront distribution's cache behaviors to intercept and modify requests/responses at the edge.

### Infrastructure 2: Serverless Backend API (Amazon API Gateway, AWS Lambda, Amazon DynamoDB)
* **Components**: A REST API using Amazon API Gateway, an AWS Lambda function (Python runtime), and an Amazon DynamoDB table.
* **Connections**:
  * API Gateway will expose public API endpoints with Lambda Proxy Integration to trigger the AWS Lambda function.
  * The Lambda function must be placed within a VPC in a private subnet for security, accessing DynamoDB via VPC Endpoints.
  * The Lambda function's execution role must have IAM permissions (`dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, etc.) to interact with the DynamoDB table.
  * A VPC Endpoint for DynamoDB must be created to allow secure access without traversing the public internet.

### Infrastructure 3: Event-Driven Real-time Data Processing (Amazon Kinesis, AWS Lambda, Amazon S3)
* **Components**: An Amazon Kinesis Data Stream, an AWS Lambda function (Kinesis consumer), and an Amazon S3 bucket for processed data.
* **Connections**:
  * The backend Lambda function (from Infrastructure 2 or another service) will publish records to the Kinesis Data Stream using the AWS SDK.
  * The Kinesis consumer Lambda will be configured with an event source mapping to process data from the Kinesis Data Stream.
  * The Kinesis consumer Lambda must be placed in a private subnet within the VPC.
  * The Lambda's execution role must have IAM permissions (`kinesis:GetRecords`, `kinesis:DescribeStream`, `s3:PutObject`) to read from Kinesis and write to S3.
  * A VPC Endpoint for S3 must be created to allow secure storage without public internet access.

### Infrastructure 4: Shared Network and Security (Amazon VPC, Security Groups, IAM Roles)
* **Components**: A custom Amazon VPC with public and private subnets across at least two Availability Zones, Security Groups, NAT Gateways, and fine-grained IAM Roles.
* **Connections**:
  * All compute resources requiring private network access (both Lambda functions) will be deployed in private subnets.
  * NAT Gateways in public subnets will provide outbound internet access for private subnet resources.
  * Security Groups will control traffic:
    * The backend API Lambda Security Group allows inbound traffic only from the API Gateway's VPC Link.
    * Lambda Security Groups allow outbound traffic to VPC Endpoints for DynamoDB and S3.
  * IAM Roles assigned to each service (Lambda, API Gateway, Kinesis) will enforce least privilege, specifying permitted actions on specific resources.

### Infrastructure 5: Centralized Monitoring and Logging (Amazon CloudWatch, AWS SNS)
* **Components**: Amazon CloudWatch Logs, CloudWatch Alarms, and an Amazon SNS Topic.
* **Connections**:
  * CloudWatch Logs will collect logs from Lambda, API Gateway, and Kinesis.
  * CloudWatch Metrics will provide operational insights (e.g., Lambda invocations, API Gateway errors, Kinesis throughput).
  * CloudWatch Alarms will monitor metrics and publish notifications to the SNS Topic when thresholds are breached.
  * The SNS Topic will distribute notifications to subscribers (e.g., email or other endpoints) to alert the operations team.

## Additional Requirements
* The Pulumi Typescript code must be modular, well-commented, and demonstrate clear organization of resources. Utilize Pulumi's component resources or functions to encapsulate related infrastructure.


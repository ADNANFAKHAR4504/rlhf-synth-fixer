Create infrastructure code using CloudFormation JSON for a lead scoring system with enhanced security and automation features.

Requirements:

Build a serverless lead scoring pipeline that processes incoming leads through an API, scores them using machine learning, routes them to appropriate sales teams based on their score, and includes automated batch processing capabilities with secure configuration management.

The system should:

1. Accept lead data via REST API endpoint with fields like company size, industry, engagement metrics
2. Process leads using Lambda function (Python 3.11) that calls SageMaker endpoint for ML scoring
3. Store lead data and scores in DynamoDB with TTL set to 24 hours for caching predictions
4. Route high-value leads (score > 80) to senior sales via EventBridge custom event bus
5. Send immediate notifications for very high scores (> 95) via SNS email topic
6. Store ML model artifacts in S3 bucket with versioning enabled
7. Track scoring metrics in CloudWatch with alarms for high latency (> 3 seconds)
8. Include AWS Application Composer integration tags for visual architecture
9. Store sensitive configuration and API keys using AWS Secrets Manager
10. Implement scheduled batch processing of queued leads using EventBridge Scheduler

Technical specifications:
- API Gateway with request validation and throttling (100 req/sec)
- Lambda with 1GB memory and 30 second timeout
- DynamoDB with on-demand billing and point-in-time recovery
- EventBridge with rule patterns for score-based routing
- EventBridge Scheduler for automated batch processing every 15 minutes
- AWS Secrets Manager for secure storage of API keys and configuration
- CloudWatch dashboard for monitoring scoring performance

Deploy all resources in us-west-2 region. Include proper IAM roles with least privilege access. Output the API endpoint URL and monitoring dashboard link.

Provide the complete CloudFormation template in JSON format.
Implement a serverless survey data collection/analysis system (3k daily responses, real-time aggregation) using AWS (Python 3.10, us-east-1, YAML, dev). Requirements:

Ingress/Compute: API Gateway (submission endpoints), Lambda (validation, processing).
Storage/Query: DynamoDB (responses, GSI for efficient querying), S3 (scheduled backup exports).
Automation/Events: EventBridge (daily aggregation schedule), SNS (admin notifications).
Monitoring/Control: CloudWatch (API monitoring), Configure API throttling limits.

Expected Output: Single Stack (TapStack.yml)

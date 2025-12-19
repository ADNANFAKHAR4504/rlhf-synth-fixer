Create Terraform infrastructure code for an expense tracking application that processes 3,200 daily receipt uploads with OCR and categorization capabilities in us-west-2 region.

The infrastructure should include:

1. S3 bucket for storing receipt uploads with event notifications configured to trigger processing
2. Lambda function in Python 3.10 that integrates with AWS Textract for OCR processing of receipts
3. DynamoDB table for storing processed expense records with appropriate indexes
4. AWS Comprehend integration for automatic expense category detection from receipt text
5. Step Functions state machine orchestrating the multi-stage processing workflow with error handling and retry logic
6. SNS topic for sending completion notifications when receipt processing is finished
7. CloudWatch metrics and alarms for monitoring processing performance and failures
8. IAM roles and policies with least privilege access for all services

Additional requirements:
- Configure S3 bucket with versioning and lifecycle policies for cost optimization
- Lambda function should handle various receipt formats and sizes with appropriate timeout settings
- DynamoDB table should support queries by user ID, date range, and expense category
- Step Functions should include parallel processing branches for OCR and categorization
- Implement dead letter queues for failed processing attempts
- Use AWS Comprehend's latest custom entity recognition feature for improved category detection
- Include CloudWatch Container Insights for enhanced monitoring of Step Functions executions
- Set up appropriate tags for cost tracking and compliance

Generate complete Terraform HCL code with all resources properly configured. Each file should be in its own code block.
# Content Moderation System Infrastructure

I need to build a content moderation system infrastructure in AWS us-west-1 region using CDKTF with Python. The system should handle 11,400 daily images and text submissions that require automated filtering and human review when necessary.

## System Requirements

The infrastructure should include:

1. **S3 Bucket** - For storing uploaded content (images and text files) with versioning enabled and lifecycle policies for processed content

2. **Lambda Functions** - Python 3.10 runtime functions:
   - Image moderation function that uses Rekognition to analyze images
   - Text moderation function that uses Comprehend for toxicity detection and sentiment analysis
   - Result processor function to store outcomes in DynamoDB

3. **DynamoDB Table** - Store moderation results with attributes for content ID, moderation scores, timestamps, and review status

4. **Step Functions** - Orchestrate the moderation workflow with conditional logic:
   - Route content to appropriate Lambda functions based on type
   - If content flags exceed thresholds, send to human review queue
   - Update DynamoDB with final decisions

5. **SQS Queue** - Dead letter queue for failed processing and a separate queue for human review items

6. **SNS Topic** - Send notifications to reviewers when content needs manual review

7. **CloudWatch** - Dashboards and alarms for monitoring:
   - Lambda invocation errors
   - Step Functions failures
   - Queue depth for human review items

8. **IAM Roles** - Service permissions for:
   - Lambda to access Rekognition, Comprehend, S3, and DynamoDB
   - Step Functions to invoke Lambdas and access SQS
   - SNS publish permissions

## Technical Specifications

- Use Rekognition's moderation labels with confidence thresholds for image analysis
- Implement Comprehend's toxicity detection across categories like hate speech, profanity, and threats
- Configure Step Functions with retry logic and error handling
- Set up CloudWatch metrics for processing latency and error rates

Please generate the infrastructure code using CDKTF Python that follows AWS best practices. Include proper error handling, monitoring, and security configurations. Each component should be in its own code block with the filename clearly indicated.
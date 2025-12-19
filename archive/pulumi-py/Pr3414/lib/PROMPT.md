Create Pulumi Python infrastructure code for an asynchronous event processing system for a marketing firm that processes 1,200 daily campaign events.

Requirements:

1. SQS Queue Configuration:
   - Standard queue for campaign event messages
   - Dead Letter Queue (DLQ) for failed messages with max receive count of 3
   - Message retention period of 14 days for main queue
   - Visibility timeout of 120 seconds to allow Lambda processing time

2. Lambda Function:
   - Python 3.11 runtime for event processing
   - Memory: 256MB
   - Timeout: 90 seconds
   - Process messages from SQS queue
   - Include error handling for failed events
   - Lambda should have reserved concurrent executions set to 10 to manage throughput

3. DynamoDB Table:
   - Table for event logging with the following attributes:
     - event_id as partition key (String)
     - timestamp as sort key (String)
   - Store: event_id, timestamp, status, message_body, error_message (if failed)
   - Use on-demand billing mode for cost optimization
   - Enable point-in-time recovery for data protection

4. CloudWatch Monitoring:
   - Alarm for queue message age (threshold: 300 seconds)
   - Alarm for DLQ messages (threshold: 1 message)
   - Log group for Lambda function with 7-day retention

5. IAM Roles and Policies:
   - Lambda execution role with least privilege permissions:
     - Read/delete from SQS queue
     - Write to DynamoDB table
     - Write to CloudWatch Logs
   - Follow AWS best practices for role boundaries

6. Lambda Function Code:
   - Include inline Python code that:
     - Parses SQS messages
     - Processes campaign events
     - Logs to DynamoDB with success/failure status
     - Implements proper error handling
     - Uses batch processing for efficiency

Additional specifications:
- Deploy in us-west-1 region
- Use environment tags for resource identification
- Implement AWS Lambda Destinations for async invocation tracking
- Use SQS Event Source Mapping with batch size of 10 for optimal throughput

Provide the complete infrastructure code in one code block per file, ensuring all components are properly integrated and following Pulumi Python best practices.
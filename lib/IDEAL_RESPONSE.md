# CloudFormation Template for Serverless Weather Monitoring System with Enhanced Features

## Complete Infrastructure Solution - TapStack.json

This is the fully functional CloudFormation template that includes:
- Amazon Timestream for time-series data storage (conditional)
- AWS EventBridge Scheduler for automated processing
- Complete error handling and monitoring
- All required IAM permissions



## Key Features Implemented

### 1. Core Infrastructure
- **API Gateway**: REST API with rate limiting (100 req/sec)
- **Lambda Function**: Python 3.11 runtime with multi-purpose handler
- **DynamoDB Table**: Auto-scaling enabled (5-100 units, 70% target)

### 2. Enhanced Features
- **Amazon Timestream**: Time-series database for historical analytics (conditional)
  - 7 days memory retention
  - 365 days magnetic storage
- **EventBridge Scheduler**: 
  - Hourly data aggregation
  - Daily report generation at 2 AM UTC
  - 15-minute flexible time window

### 3. Monitoring & Alerting
- **CloudWatch Alarms**:
  - Lambda error rate > 1%
  - API Gateway 4xx errors > 5%
  - DynamoDB throttled requests
  - Timestream query execution > 5 seconds (conditional)
- **SNS Topic**: Anomaly detection alerts
- **CloudWatch Logs**: 7-day retention with Live Tail support

### 4. Error Handling
- **S3 Bucket**: Failed Lambda event storage
- **Lambda Retry Configuration**: Max 2 retry attempts
- **Dead Letter Destination**: S3 bucket with 30-day lifecycle

### 5. Security
- **IAM Roles**: Least privilege access
- **KMS Encryption**: SNS topic encryption
- **S3 Public Access**: Blocked on failed events bucket

## Deployment Instructions

1. Save the template as 

2. Deploy without Timestream (default):


3. Deploy with Timestream (if enabled in account):


## Stack Outputs

The stack provides the following outputs:
- **APIEndpoint**: API Gateway URL for sensor data submission
- **DynamoDBTableName**: Name of the DynamoDB table
- **LambdaFunctionArn**: ARN of the Lambda function
- **SNSTopicArn**: ARN for anomaly notifications
- **FailedEventsBucketName**: S3 bucket for failed events
- **TimestreamDatabaseName**: Timestream database (if enabled)
- **HourlyScheduleArn**: EventBridge hourly schedule ARN

## Testing the Deployment

### Send Sensor Data


### Trigger Anomaly Detection


## Notes

1. **Timestream Availability**: Timestream requires explicit enablement in some AWS accounts. Use the  parameter to control deployment.

2. **Environment Suffix**: Always use a unique environment suffix to avoid resource naming conflicts.

3. **Cleanup**: Remember to delete the S3 bucket contents before deleting the stack.

4. **Monitoring**: CloudWatch dashboards can be added for visualization of metrics.

5. **Cost Optimization**: DynamoDB auto-scaling ensures cost-effective operation based on actual load.

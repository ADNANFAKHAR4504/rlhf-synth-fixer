Create infrastructure code for a serverless weather monitoring system to handle 5,200 daily sensor readings with real-time processing and historical analysis.

Build a data ingestion pipeline using:
- API Gateway REST API with rate limiting set to 100 requests per second
- Lambda function in Python 3.11 for data aggregation and processing
- DynamoDB table with auto-scaling enabled for storing recent sensor readings
- Amazon Timestream database for long-term time series data storage with 7 days memory retention and 365 days magnetic storage
- EventBridge Scheduler to trigger hourly data aggregation Lambda function and daily report generation
- CloudWatch monitoring with alarms for high error rates
- SNS topic for sending anomaly alerts when unusual weather patterns are detected
- IAM roles with least privilege access for all service integrations

Configure the DynamoDB table to handle the expected load with:
- Read capacity auto-scaling between 5-100 units
- Write capacity auto-scaling between 5-100 units
- Target utilization of 70%

Set up Amazon Timestream with:
- Database named "WeatherMonitoring"
- Table named "SensorData" with memory retention of 7 days
- Magnetic storage retention of 365 days
- Lambda function to migrate data from DynamoDB to Timestream every hour

Configure EventBridge Scheduler with:
- Hourly schedule to trigger data aggregation Lambda function
- Daily schedule at 2 AM UTC to generate weather reports
- Flexible time window of 15 minutes for both schedules

Set up CloudWatch alarms to monitor:
- Lambda function error rate exceeding 1%
- API Gateway 4xx errors exceeding 5%
- DynamoDB throttled requests
- Timestream query execution time exceeding 5 seconds

Include CloudWatch Logs Live Tail integration for real-time Lambda debugging and Amazon S3 as failed-event destination for Lambda asynchronous invocations.

Provide the complete CloudFormation JSON template with all resources properly configured and connected.
# Serverless IoT Data Processing Pipeline

A complete serverless architecture for processing IoT sensor data using AWS Lambda, DynamoDB, SQS, SNS, and API Gateway built with CDKTF Python.

## Architecture

- **API Gateway**: REST API with three endpoints (/ingest, /process, /query) with AWS_IAM authorization
- **Lambda Functions**: Three functions for data ingestion, processing, and querying (Python 3.11)
- **DynamoDB**: Two tables for raw and processed sensor data with point-in-time recovery
- **SQS**: Queue for decoupling ingestion and processing with dead letter queue
- **SNS**: Topic for error alerts and notifications
- **CloudWatch**: Log Groups with 30-day retention and metric alarms
- **X-Ray**: Distributed tracing across all services
- **Systems Manager**: Parameter Store for configuration management
- **Lambda Layers**: Shared dependencies (boto3, requests, aws-xray-sdk)

## Prerequisites

- CDKTF CLI installed
- Python 3.11+
- AWS credentials configured
- Node.js 18+ (for CDKTF)
- Terraform 1.5+

## Deployment

1. Install dependencies:
```bash
npm install
pip install -r requirements.txt
```

2. Create Lambda deployment packages:
```bash
# Create ingestion Lambda package
cd lib/lambda/ingestion && zip -r ../ingestion.zip . && cd ../../..

# Create processor Lambda package
cd lib/lambda/processor && zip -r ../processor.zip . && cd ../../..

# Create query Lambda package
cd lib/lambda/query && zip -r ../query.zip . && cd ../../..

# Create Lambda layer package
cd lib/lambda/layer && \
  pip install -r requirements.txt -t python/ && \
  zip -r ../layer.zip python/ && \
  rm -rf python/ && \
  cd ../../..
```

3. Deploy infrastructure:
```bash
cdktf deploy
```

## API Usage

The API endpoints require AWS IAM authentication. Use AWS Signature Version 4 to sign requests.

### Ingest Data
```bash
POST /prod/ingest
Content-Type: application/json

{
  "device_id": "device-123",
  "sensor_data": {
    "temperature": 25.5,
    "humidity": 60,
    "pressure": 1013
  }
}

Response:
{
  "message": "Data ingested successfully",
  "device_id": "device-123",
  "timestamp": 1700000000000
}
```

### Query Processed Data
```bash
GET /prod/query?device_id=device-123&event_date=2024-01-15

Response:
{
  "count": 10,
  "items": [
    {
      "device_id": "device-123",
      "event_date": "2024-01-15",
      "timestamp": 1700000000000,
      "temperature": 25.5,
      "temperature_celsius": 25.5,
      "temperature_fahrenheit": 77.9,
      "humidity": 60,
      "pressure": 1013,
      "processed_at": "2024-01-15T10:30:00Z",
      "status": "processed"
    }
  ]
}
```

### Query Raw Data
```bash
GET /prod/query?device_id=device-123&table=raw

Response:
{
  "count": 15,
  "items": [...]
}
```

## Monitoring

CloudWatch alarms are configured for:
- Lambda function errors (threshold: 10 errors in 5 minutes)
- Lambda function throttles (threshold: 5 throttles in 5 minutes)
- DynamoDB throttled requests (threshold: 10 errors in 5 minutes)

All alarms publish to the SNS topic for notifications.

## Configuration

Systems Manager parameters:
- `/iot-pipeline/{environment_suffix}/api-key`: API key for authentication (SecureString)
- `/iot-pipeline/{environment_suffix}/config`: Pipeline configuration (JSON)

Update parameters:
```bash
aws ssm put-parameter \
  --name "/iot-pipeline/dev/api-key" \
  --value "your-api-key" \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/iot-pipeline/dev/config" \
  --value '{"batch_size": 100, "processing_timeout": 60}' \
  --type "String" \
  --overwrite
```

## Testing

Run unit tests:
```bash
pytest test/
```

## Outputs

After deployment, the following outputs are available:
- `ApiEndpoint`: API Gateway endpoint URL
- `RawSensorTableName`: DynamoDB raw sensor data table name
- `ProcessedDataTableName`: DynamoDB processed data table name
- `IngestionQueueUrl`: SQS queue URL
- `AlertTopicArn`: SNS topic ARN for alerts

View outputs:
```bash
cdktf output
```

## Architecture Flow

1. Client sends sensor data to API Gateway `/ingest` endpoint
2. Ingestion Lambda stores raw data in DynamoDB and sends message to SQS
3. SQS triggers Processor Lambda with batched messages
4. Processor Lambda transforms data and stores in processed DynamoDB table
5. If errors exceed threshold, alerts are sent to SNS topic
6. Client queries processed data via API Gateway `/query` endpoint
7. Query Lambda retrieves data from DynamoDB tables
8. X-Ray traces all requests end-to-end

## Security

- AWS_IAM authorization on all API Gateway endpoints
- Least-privilege IAM roles for each Lambda function
- Encryption at rest enabled on DynamoDB tables
- Dead letter queues for failed Lambda invocations
- CloudWatch Logs encryption with 30-day retention
- Systems Manager SecureString for sensitive parameters

## Resource Naming

All resources include `environment_suffix` for uniqueness:
- `raw-sensor-data-{environment_suffix}`
- `processed-data-{environment_suffix}`
- `iot-api-{environment_suffix}`
- `data-ingestion-{environment_suffix}`
- etc.

## Cleanup

```bash
cdktf destroy
```

## Troubleshooting

### Lambda Errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/data-ingestion-{environment_suffix} --follow
aws logs tail /aws/lambda/data-processor-{environment_suffix} --follow
aws logs tail /aws/lambda/data-query-{environment_suffix} --follow
```

### X-Ray Traces
View distributed traces in AWS X-Ray console to debug request flows.

### DLQ Messages
Check dead letter queue for failed messages:
```bash
aws sqs receive-message --queue-url <DLQ_URL>
```

## Cost Optimization

- DynamoDB uses on-demand billing (pay per request)
- Lambda reserved concurrency set to 100 per function
- API Gateway throttling set to 1000 req/sec
- CloudWatch Logs retention set to 30 days
- No NAT gateways or expensive resources (fully serverless)

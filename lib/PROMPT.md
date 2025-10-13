# Manufacturing IoT Data Processing Pipeline

You are an expert AWS Infrastructure Engineer. Create infrastructure using **CloudFormation with YAML**.

## Problem Statement

Design and implement a CloudFormation template for a manufacturing company's IoT sensor data processing platform with real-time analytics. The system must handle high-frequency data ingestion from manufacturing equipment sensors, process the data in real-time for anomaly detection, store both processed and raw data, and provide monitoring capabilities.

## Requirements

### 1. IoT Data Ingestion
- Configure AWS IoT Core to connect manufacturing equipment sensors
- Support MQTT protocol for sensor communication
- Implement IoT Thing for device representation
- Create IoT Policy for device authorization with least-privilege permissions
- Set up IoT Rules to route incoming sensor data to processing pipeline

### 2. Real-Time Data Processing
- Use Amazon Kinesis Data Stream for data buffering and real-time ingestion
- Implement AWS Lambda functions for:
  - Data transformation from raw sensor readings to structured format
  - Anomaly detection on sensor readings (temperature, pressure, vibration thresholds)
  - Processing sensor data from Kinesis stream
- Configure Kinesis as event source for Lambda processing

### 3. Data Storage
- Store processed sensor data in DynamoDB table with:
  - Partition key: deviceId
  - Sort key: timestamp
  - Attributes: sensorType, value, status, anomalyDetected
- Archive raw sensor data to S3 bucket for long-term storage and compliance
- Implement S3 lifecycle policy to transition data to cheaper storage tiers
- Enable S3 bucket encryption

### 4. Analytics and Monitoring
- Create CloudWatch Log Groups for all Lambda functions with 7-day retention
- Implement CloudWatch custom metrics for:
  - Number of sensor readings processed
  - Anomalies detected count
  - Data processing latency
- Set up CloudWatch Alarms for:
  - High error rate in Lambda functions
  - Anomaly detection threshold exceeded
  - Kinesis stream throttling

### 5. Security and Access Control
- Create IAM roles with least-privilege policies for:
  - Lambda execution role (access to Kinesis, DynamoDB, S3, CloudWatch)
  - IoT Core role (access to Kinesis)
- Implement IoT Policy for device authorization
- Enable encryption at rest for DynamoDB and S3
- Use AWS managed KMS keys for encryption

### 6. Resource Configuration
- All resource names must include EnvironmentSuffix parameter using !Sub
- Set DeletionPolicy: Delete for all resources (synthetic task requirement)
- Configure appropriate timeouts and memory for Lambda functions
- Use on-demand billing for DynamoDB to handle variable workload
- Set appropriate shard count for Kinesis stream (start with 1)

## Expected Deliverables

1. **CloudFormation Template (template.yaml)** containing:
   - Parameters section with EnvironmentSuffix
   - All AWS resources properly configured
   - Proper DependsOn relationships
   - Outputs for key resource identifiers

2. **Lambda Function Code**:
   - Data processor function (Node.js 20.x runtime)
   - Implement sensor data transformation logic
   - Implement basic anomaly detection (threshold-based)
   - Error handling and CloudWatch logging

3. **Architecture** should include:
   - AWS IoT Core (Thing, Policy, Rule)
   - Amazon Kinesis Data Stream
   - AWS Lambda (processing function)
   - Amazon DynamoDB (processed data)
   - Amazon S3 (raw data archive)
   - CloudWatch (logs, metrics, alarms)
   - IAM roles and policies

## Constraints

- Must use CloudFormation YAML only
- Region: us-east-1
- Serverless architecture (no EC2 instances)
- All resources must be easily destroyable
- Follow AWS Well-Architected Framework principles
- Implement proper error handling and logging

## Technical Specifications

### IoT Rule SQL
```sql
SELECT *, timestamp() as timestamp FROM 'sensor/+/data'
```

### Anomaly Detection Thresholds
- Temperature: > 80°C or < 10°C
- Pressure: > 150 PSI or < 30 PSI
- Vibration: > 5.0 mm/s

### Lambda Configuration
- Runtime: nodejs20.x
- Memory: 256 MB
- Timeout: 60 seconds
- Batch size from Kinesis: 100 records

Generate complete infrastructure code with one code block per file.

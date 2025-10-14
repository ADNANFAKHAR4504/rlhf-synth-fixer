# Manufacturing IoT Data Processing Pipeline

Hey, I need help building an IoT data processing system for our manufacturing plant. We've got sensors all over the place monitoring temperature, pressure, and vibration on our equipment, and we need to process this data in real-time to catch problems before they become expensive.

## The Problem

Right now we're losing money because equipment breaks down unexpectedly. We have sensors sending data, but we're not doing anything smart with it. We need to:

- Detect when equipment is about to fail (anomaly detection)
- Store the data properly for compliance and analysis
- Get alerts when something's wrong
- Handle thousands of sensor readings per second

## What I Need

I need a CloudFormation template that sets up:

**Data Ingestion:**
- AWS IoT Core to receive sensor data via MQTT
- Kinesis stream to buffer the data
- IoT rules to route data from sensors to Kinesis

**Data Processing:**
- Lambda function that processes sensor readings
- Anomaly detection logic for temperature, pressure, vibration
- Store processed data in DynamoDB
- Archive raw data to S3

**Monitoring:**
- CloudWatch alarms for errors and anomalies
- Custom metrics to track processing
- Logs for debugging

## Technical Details

**Sensor Data Format:**
Sensors send JSON like: `{"deviceId": "device-001", "sensorType": "temperature", "value": 25.5}`

**Anomaly Thresholds:**
- Temperature: > 80°C or < 10°C
- Pressure: > 150 PSI or < 30 PSI  
- Vibration: > 5.0 mm/s

**MQTT Topic:** `sensor/{deviceId}/data`

**DynamoDB Schema:**
- Partition key: deviceId
- Sort key: timestamp
- Attributes: sensorType, value, status, anomalyDetected, ttl

**Lambda Config:**
- Runtime: nodejs20.x
- Memory: 256 MB
- Timeout: 60 seconds
- Batch size: 100 records

## Requirements

- Use CloudFormation YAML
- All resources need environment suffix parameter
- DeletionPolicy: Delete for all resources
- Encryption at rest for DynamoDB and S3
- Least privilege IAM policies
- 7-day log retention
- DynamoDB TTL set to 90 days
- S3 lifecycle policies for cost optimization

## What I Want Back

A complete CloudFormation template that I can deploy with one command. Include:

1. All the AWS resources properly configured
2. Lambda function code with anomaly detection
3. IAM roles with proper permissions
4. CloudWatch alarms and metrics
5. Outputs for all the important resource names

Make sure it's production-ready and follows AWS best practices. I need to be able to deploy this and start getting sensor data flowing through it immediately.

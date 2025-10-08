# IoT Data Pipeline Challenge

Hey there! I need help building an IoT data pipeline that can handle a lot of sensor data. We're talking about 500,000 sensor readings per day from various smart devices, and I want to deploy this in the us-east-1 region.

## What I'm Looking For

I need a complete IoT pipeline that can:
- Take in real-time sensor data from devices
- Process and analyze that data as it comes in
- Store everything for both immediate use and long-term analysis
- Keep costs reasonable while handling the scale

## The Technical Stack I Want

**Device Connection:**
- AWS IoT Core to securely connect all the devices
- Device certificates for authentication
- IoT Device Shadows so we can track device state

**Data Flow:**
- IoT Rules that automatically route messages to Kinesis Data Streams
- Kinesis configured to handle the volume with proper sharding
- Lambda function (Python 3.11) that processes the stream data
- Need retry logic with exponential backoff for reliability

**Storage & Analytics:**
- Kinesis Data Firehose to batch and deliver data to S3
- DynamoDB table for keeping track of device states (with TTL for cleanup)
- Timestream for time-series sensor data storage
- Glue Crawler to automatically discover data schemas
- Athena for running ad-hoc queries when needed

**Monitoring:**
- CloudWatch for metrics and alarms
- SNS for sending alerts when things go wrong

**Security:**
- Proper IAM roles for each service
- Least privilege access policies
- Secure device authentication

## Implementation Details

Please use AWS CDK with TypeScript. I want to see how everything connects together - from IoT Core through Kinesis to Lambda to Firehose to S3, and how the monitoring fits in.

Make sure to configure:
- Firehose batching to keep costs down
- Kinesis shard scaling for the volume
- DynamoDB TTL so old data gets cleaned up automatically
- Lambda retry logic that backs off when there are issues

Include security best practices with IAM roles and device certificates.

## What I Need Back

Give me the complete TypeScript CDK code, and then explain how the architecture works - especially how all the pieces connect together and why you made the design choices you did.

The code should be production-ready with proper error handling, monitoring, and cost optimization built in.
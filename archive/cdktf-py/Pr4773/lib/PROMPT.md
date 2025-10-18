# Manufacturing IoT Sensor Data Processing Infrastructure

Hey team,

We need to build a complete IoT data processing and compliance logging infrastructure for a manufacturing company that's rolling out sensor-equipped machinery across their facilities. They're monitoring temperature, vibration, pressure, and operational metrics from hundreds of manufacturing devices, and they need a robust cloud infrastructure to handle the data ingestion, processing, storage, and compliance requirements.

The company operates in a regulated industry, so every action on the data needs to be logged for audit purposes. They need to meet compliance standards that require complete traceability of data access, processing, and storage operations. Additionally, the manufacturing operations team needs real-time insights from the sensor data to detect equipment anomalies and prevent costly downtime.

I've been asked to create this infrastructure using **CDKTF with Python** to deploy to the ap-southeast-1 region. The solution needs to be production-ready, secure, cost-optimized, and fully compliant with their audit requirements.

## What we need to build

Create a manufacturing IoT sensor data processing platform using **CDKTF with Python** for ingesting, processing, storing, and logging IoT sensor data from manufacturing equipment.

### Core Requirements

1. **IoT Data Ingestion**
   - Use **AWS IoT Core** to receive sensor data from manufacturing devices
   - Configure IoT Thing Types and Things for device management
   - Implement secure device authentication using X.509 certificates
   - Create IoT Rules to route incoming sensor data to downstream systems

2. **Real-Time Data Processing**
   - Use **Amazon Kinesis Data Streams** for real-time streaming data processing
   - Configure shards appropriately for expected data throughput
   - Enable server-side encryption for data in transit

3. **Data Storage**
   - Use **Amazon S3** for long-term storage of raw sensor data
   - Organize data with appropriate prefixes (by date, device type, facility)
   - Implement lifecycle policies to transition older data to cost-effective storage classes
   - Use **Amazon DynamoDB** for storing processed sensor metrics and device metadata
   - Enable point-in-time recovery for DynamoDB tables

4. **Compliance and Audit Logging**
   - Use **AWS CloudTrail** to log all API calls for compliance auditing
   - Use **AWS CloudWatch Logs** for application-level operational logging
   - Configure log retention policies (30 days for operational logs, longer for compliance)
   - Enable CloudTrail insights for unusual activity detection

5. **Data Processing Functions**
   - Use **AWS Lambda** functions to process sensor data from Kinesis streams
   - Aggregate sensor readings and detect anomalies
   - Write processed data to DynamoDB and archive raw data to S3
   - Implement error handling and retry logic

6. **Security and Encryption**
   - Use **AWS KMS** to create customer-managed keys for encryption
   - Encrypt all data at rest (S3, DynamoDB, Kinesis, CloudWatch Logs)
   - Encrypt all data in transit using TLS
   - Implement least-privilege IAM roles for all services

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS IoT Core** for device connectivity and message routing
- Use **Amazon Kinesis Data Streams** for real-time data streaming
- Use **Amazon S3** for long-term raw data storage with lifecycle policies
- Use **Amazon DynamoDB** for structured sensor metrics storage
- Use **AWS Lambda** for serverless data processing
- Use **AWS CloudTrail** for API audit logging
- Use **AWS CloudWatch Logs** for operational logging
- Use **AWS KMS** for encryption key management
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environment-suffix}`
- Deploy to **ap-southeast-1** region
- All Lambda functions should use Python 3.11 runtime
- Enable encryption for all data stores
- Implement proper IAM least-privilege policies

### Constraints

- All data must be encrypted at rest and in transit (compliance requirement)
- All API operations must be logged to CloudTrail for audit trails
- Data retention: CloudWatch operational logs for 30 days, CloudTrail logs for 90 days
- DynamoDB tables must have point-in-time recovery enabled
- S3 buckets must have versioning enabled for data integrity
- All resources must be destroyable (no Retain policies for synthetic task)
- Lambda functions must have proper error handling and CloudWatch logging
- IoT devices must use certificate-based authentication
- No hardcoded credentials or secrets in code

### Performance and Cost Optimization

- Use Kinesis Data Streams with on-demand capacity mode to auto-scale
- Use DynamoDB on-demand billing mode for unpredictable workloads
- Implement S3 lifecycle policies to transition data to Glacier after 90 days
- Use Lambda reserved concurrency only if needed (avoid account limits)
- Configure appropriate CloudWatch Logs retention to control costs
- Use S3 Intelligent-Tiering for automatic cost optimization

## Success Criteria

- **Functionality**: Complete IoT data pipeline from device ingestion to storage with processing
- **Security**: All data encrypted with KMS, certificate-based IoT authentication, least-privilege IAM
- **Compliance**: CloudTrail enabled, CloudWatch Logs configured, audit trail complete
- **Reliability**: Error handling in Lambda, DynamoDB point-in-time recovery, S3 versioning
- **Performance**: Real-time processing with Kinesis, efficient Lambda execution
- **Resource Naming**: All resources include environment suffix for uniqueness
- **Code Quality**: Clean Python CDKTF code, well-tested, properly documented
- **Cost Optimization**: Serverless architecture, appropriate retention policies, lifecycle rules

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- AWS IoT Core configuration (Thing Types, IoT Rule for routing data)
- Amazon Kinesis Data Stream with encryption enabled
- Amazon S3 bucket with lifecycle policies and versioning
- Amazon DynamoDB table with on-demand billing and PITR
- AWS Lambda function for processing sensor data from Kinesis
- AWS KMS customer-managed key for encryption
- AWS CloudTrail configuration for API logging
- AWS CloudWatch Log Groups for operational logging
- IAM roles and policies following least privilege
- Unit tests for all infrastructure components
- Integration tests validating the complete data pipeline
- Documentation explaining the architecture and deployment

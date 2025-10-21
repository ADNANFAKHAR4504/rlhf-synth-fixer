Hey team,

We need to build a high-throughput industrial IoT monitoring system for a manufacturing plant in São Paulo, Brazil. The plant has thousands of sensors deployed across the manufacturing floor, and we need to capture, process, and analyze all that sensor data in real-time. I've been asked to create this using **Pulumi with Python** for the sa-east-1 region.

The manufacturing operations team needs a system that can handle continuous data streams from these sensors, detect anomalies as they happen, and provide real-time visibility into the production line status. This is mission-critical infrastructure - any downtime could impact production, so we need to build this with high availability and proper failure recovery mechanisms.

We're deploying in Brazil to meet local data residency requirements and reduce latency for the manufacturing plant operations. The system needs to scale to handle thousands of concurrent IoT device connections and process high-frequency sensor readings without data loss.

## What we need to build

Create an industrial IoT monitoring system using **Pulumi with Python** that handles real-time sensor data ingestion, processing, and analytics for a manufacturing plant.

### Core Requirements

1. **IoT Device Connectivity**
   - AWS IoT Core for managing thousands of IoT sensors
   - MQTT protocol support for efficient sensor data transmission
   - IoT policy enabling certificate-based authentication (device credential provisioning happens outside this stack)
   - Support for thousands of concurrent device connections
   - IoT rules engine for routing and processing sensor data through resilient integration components

2. **Real-time Data Processing Pipeline**
   - High-throughput data ingestion from IoT sensors
   - Stream processing for real-time analytics and transformations
   - Data aggregation and enrichment
   - Anomaly detection with automated alerting
   - Lambda functions for custom data processing logic

3. **Time-series Data Storage**
   - Efficient storage for high-frequency sensor readings
   - Hot tier for recent data (fast query access)
   - Cold tier for historical data (cost-optimized archiving)
   - Data retention policies for compliance
   - Support for time-based queries and aggregations

4. **Monitoring and Visualization**
   - CloudWatch metrics for system health monitoring
   - Alarms for critical system events and anomalies
   - Performance metrics tracking (throughput, latency, errors)
   - Guidance for operations teams to plug metrics into dashboards

5. **Security and Authentication**
   - End-to-end encryption for IoT data in transit and at rest
   - X.509 certificate-based device authentication
   - IAM roles following least privilege principle
   - Secure credential management
   - Network isolation using VPC where applicable

6. **High Availability and Disaster Recovery**
   - Multi-AZ deployment for critical components
   - Automatic failover mechanisms
   - Data backup and archival to S3
   - Error handling and retry logic in processing pipeline
   - Circuit breakers for external dependencies

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **sa-east-1** region (São Paulo, Brazil)
- Use **AWS IoT Core** for device connectivity and management
- Use **Amazon Kinesis Data Streams** for real-time data ingestion
- Use **AWS Lambda** for serverless data processing
- Use **Amazon Timestream** or **DynamoDB** for time-series storage
- Use **Amazon S3** for cold storage and data archiving
- Use **Amazon CloudWatch** for monitoring, metrics, and alerting
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: resource-type-purpose-suffix
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging throughout

### Constraints

- Must handle thousands of concurrent IoT device connections
- Real-time processing with sub-second latency requirements
- Data must remain in sa-east-1 region for compliance
- System must achieve 99.9% availability or higher
- Certificate-based authentication mandatory for all IoT devices
- Encryption required for all data at rest and in transit
- Cost optimization through serverless architecture and data tiering
- No NAT Gateways or slow-deploying resources (use serverless options)
- All Lambda functions must have appropriate timeouts and memory settings
- IoT rules must have error handling actions

## Success Criteria

- **Functionality**: System successfully ingests and processes sensor data from IoT devices through complete pipeline (IoT Core -> Kinesis -> Lambda -> Storage)
- **Performance**: Handles thousands of concurrent connections with sub-second processing latency
- **Reliability**: Multi-AZ deployment with automatic failover, data backup to S3, proper error handling
- **Security**: Certificate-based device authentication, IAM roles with least privilege, encryption enabled
- **Monitoring**: CloudWatch metrics and alarms for anomalies, with guidance for dashboard integration
- **Data Management**: Hot/cold storage tiers implemented, retention policies configured
- **Resource Naming**: All resources include string suffix for uniqueness
- **Code Quality**: Clean Python code, well-structured, properly documented
- **Testing**: Unit tests verify infrastructure configuration

## What to deliver

- Complete Pulumi Python implementation in tap_stack.py
- AWS IoT Core configuration (policies, routing rules, and guidance for certificate handling handled outside the stack)
- Kinesis Data Streams for high-throughput ingestion
- Lambda functions for data processing and transformation
- Time-series database (Timestream or DynamoDB)
- S3 buckets for data archiving with lifecycle policies
- CloudWatch alarms and metric publication for dashboard consumption
- IAM roles and policies with least privilege access
- Proper error handling, logging, and monitoring
- Unit tests validating infrastructure setup
- Documentation on architecture and deployment

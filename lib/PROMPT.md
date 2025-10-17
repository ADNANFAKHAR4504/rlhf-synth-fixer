# Manufacturing IoT Sensor Data Processing System

Hey team,

We're working with a European manufacturing company that needs to modernize their factory monitoring infrastructure. They have hundreds of IoT sensors deployed across their facilities collecting temperature, pressure, and equipment status data continuously. The current system can't handle real-time processing, and they need a modern cloud-based solution that can scale with their growing sensor network while maintaining strict compliance with manufacturing standards.

The business wants a complete real-time data pipeline that can ingest sensor data streams, process them for anomaly detection, and store everything securely for compliance audits. The entire system needs to be deployed in the EU region to meet data residency requirements.

I've been asked to create this infrastructure using **CDKTF with Python** for the European region.

## What we need to build

Create a real-time IoT sensor data processing system using **CDKTF with Python** that handles data ingestion, processing, and storage for manufacturing compliance.

### Core Requirements

1. **Real-Time Data Ingestion**
   - Use AWS Kinesis Data Streams for ingesting sensor data from hundreds of IoT devices
   - Configure appropriate shard capacity for continuous data flow
   - Enable stream encryption for data security

2. **Containerized Data Processing**
   - Deploy AWS ECS Fargate cluster for running data processing containers
   - Configure Fargate tasks for processing sensor data streams
   - Implement container health checks and auto-scaling
   - Connect ECS tasks to Kinesis streams for real-time processing

3. **Caching and Temporary Storage**
   - Deploy AWS ElastiCache Redis cluster for temporary data storage
   - Use Redis for caching frequently accessed sensor readings
   - Configure Redis in private subnets with appropriate security groups
   - Enable encryption in transit

4. **Permanent Data Storage**
   - Deploy AWS RDS PostgreSQL database for long-term storage
   - Store processed sensor data for compliance and audit purposes
   - Configure database in private subnets with Multi-AZ for reliability
   - Enable encryption at rest

5. **Secure Credentials Management**
   - Use AWS Secrets Manager for database credentials
   - Implement automatic credential rotation with 30-day cycle
   - Grant ECS tasks secure access to database credentials
   - Never expose credentials in environment variables or code

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS Kinesis Data Streams** for real-time data ingestion
- Use **AWS ECS Fargate** (not EC2) for serverless container management
- Use **AWS ElastiCache Redis** for caching layer
- Use **AWS RDS PostgreSQL** for permanent storage
- Use **AWS Secrets Manager** with 30-day automatic rotation
- Deploy to **eu-west-2** region
- Create VPC with public and private subnets across at least 2 Availability Zones
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Configure proper IAM roles and policies for all services
- Enable CloudWatch logging for monitoring and debugging
- Implement security groups with least-privilege access

### Constraints

- ALL resources must be deployed in **eu-west-2** region
- Database credentials must rotate automatically every **30 days** via Secrets Manager
- System must handle **real-time data processing** from IoT sensors
- Data must be stored securely for **manufacturing compliance**
- Use **ECS Fargate** (serverless) not EC2 instances
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation
- No hardcoded credentials or sensitive data in code

### Architecture Components

1. **Networking**: VPC with public/private subnets, NAT Gateway or VPC Endpoints, security groups
2. **Data Ingestion**: Kinesis Data Streams with encryption
3. **Processing**: ECS Fargate cluster with task definitions, IAM roles
4. **Caching**: ElastiCache Redis in private subnet
5. **Storage**: RDS PostgreSQL with encryption and backups
6. **Secrets**: Secrets Manager with rotation configuration
7. **Monitoring**: CloudWatch logs and metrics

## Success Criteria

- **Functionality**: Complete data pipeline from ingestion through processing to storage
- **Security**: Database credentials managed by Secrets Manager with 30-day rotation
- **Real-time Processing**: ECS Fargate tasks successfully process Kinesis stream data
- **Data Storage**: PostgreSQL database stores processed data with encryption
- **Caching**: Redis available for temporary storage and query optimization
- **Networking**: Proper VPC setup with public/private subnet isolation
- **Compliance**: All data encrypted at rest and in transit
- **Resource Naming**: All resources include string suffix for uniqueness
- **Code Quality**: Python CDKTF code, well-tested, properly documented
- **Monitoring**: CloudWatch logging enabled for all components

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- AWS Kinesis Data Streams configuration
- AWS ECS Fargate cluster and task definitions
- AWS ElastiCache Redis cluster setup
- AWS RDS PostgreSQL database with proper configuration
- AWS Secrets Manager with 30-day rotation policy
- VPC with appropriate subnet configuration
- IAM roles and policies for service integration
- Security groups with least-privilege rules
- Unit tests for infrastructure validation
- Documentation explaining the architecture and data flow

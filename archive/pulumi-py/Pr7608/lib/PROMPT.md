# Multi-AZ Data Processing Infrastructure

## Task Description

Create a production-ready, multi-AZ data processing infrastructure on AWS using Pulumi (Python) with the following requirements:

## Infrastructure Components

### 1. Network Infrastructure
- **VPC**: 10.0.0.0/16 CIDR block with DNS hostnames and DNS support enabled
- **Public Subnets**: 2 subnets across different AZs (10.0.0.0/24, 10.0.1.0/24)
  - Enable auto-assign public IP
  - Internet Gateway for outbound connectivity
- **Private Subnets**: 2 subnets across different AZs (10.0.10.0/24, 10.0.11.0/24)
  - For database and cache resources
  - Isolated from direct internet access
- **Route Tables**: Public and private route tables with appropriate associations

### 2. Data Streaming
- **Amazon Kinesis Data Stream**:
  - 2 shards for parallel processing
  - 24-hour data retention
  - Shard-level metrics enabled (IncomingBytes, IncomingRecords, OutgoingBytes, OutgoingRecords)
  - Provisioned stream mode

### 3. Caching Layer
- **Amazon ElastiCache Redis**:
  - Replication group with 2 cache clusters (Multi-AZ)
  - Node type: cache.t3.micro
  - Engine version: 7.0
  - Automatic failover enabled
  - Multi-AZ enabled for high availability
  - At-rest and transit encryption enabled
  - Deployed in private subnets

### 4. Database Layer
- **Amazon RDS PostgreSQL**:
  - Engine: PostgreSQL 15.15
  - Instance class: db.t3.micro
  - 20 GB GP2 storage with encryption
  - Multi-AZ deployment for high availability
  - Automated backups (7-day retention)
  - Backup window: 03:00-04:00 UTC
  - Maintenance window: Monday 04:00-05:00 UTC
  - Deployed in private subnets
  - Skip final snapshot (for testing)

### 5. Security
- **Security Groups**:
  - Redis SG: Allow port 6379 from VPC CIDR (10.0.0.0/16)
  - RDS SG: Allow port 5432 from VPC CIDR (10.0.0.0/16)
  - All egress traffic allowed
- **AWS Secrets Manager**:
  - Store database credentials securely
  - Include username, password, host, port, database name

### 6. Monitoring
- **CloudWatch Alarms**:
  - RDS CPU Alarm: Alert when CPU > 80% for 2 evaluation periods (5-minute intervals)
  - Redis CPU Alarm: Alert when CPU > 75% for 2 evaluation periods (5-minute intervals)
  - Kinesis Records Alarm: Alert when no incoming records for 3 evaluation periods (5-minute intervals)

## Requirements

### Code Quality
1. Use Pulumi best practices for Python
2. Implement proper resource naming and tagging
3. Use appropriate resource dependencies
4. Follow PEP 8 style guidelines

### Testing
1. **Unit Tests**:
   - 100% code coverage required
   - Use Pulumi mocks for testing
   - Test all resource configurations
   - Mock `get_availability_zones()` function call
   - Verify Multi-AZ configurations
   - Validate security group rules
   - Check CloudWatch alarm thresholds

2. **Integration Tests**:
   - Verify resources exist in AWS
   - Test VPC and subnet configurations
   - Verify Kinesis stream is active and can accept records
   - Check Redis cluster is available with Multi-AZ
   - Verify RDS instance is available with Multi-AZ
   - Validate security group rules
   - Confirm CloudWatch alarms are created
   - Test Secrets Manager secret accessibility

### Outputs
Export the following stack outputs:
- VPC ID
- Kinesis stream name
- Redis primary endpoint
- RDS endpoint
- RDS secret ARN

## Success Criteria

1. All resources deploy successfully without errors
2. 100% unit test coverage with all tests passing
3. All integration tests pass against deployed resources
4. Multi-AZ configuration verified for Redis and RDS
5. Security groups properly restrict access
6. CloudWatch alarms are active
7. Code follows best practices and is well-documented
8. Infrastructure is production-ready

## Common Pitfalls to Avoid

1. **Pulumi Mocking**: Ensure `get_availability_zones()` is properly mocked in unit tests
2. **Multi-AZ Configuration**: Both `automatic_failover_enabled` and `multi_az_enabled` must be True for Redis
3. **Security Groups**: Don't forget egress rules
4. **Subnet Groups**: Both RDS and ElastiCache require subnet groups with multiple subnets
5. **Dependencies**: Ensure proper resource dependencies (e.g., IGW before routes)
6. **Testing**: Integration tests should skip if stack outputs are not available
7. **Credentials**: Use Secrets Manager instead of hardcoded passwords in production

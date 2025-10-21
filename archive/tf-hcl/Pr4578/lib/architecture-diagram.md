# Architecture Diagram

## System Overview

This CloudWatch analytics system monitors API Gateway, Lambda functions, and RDS database to handle 100k+ daily interactions. The architecture provides real-time monitoring, automated metric aggregation, and proactive alerting.

## Component Architecture

### Data Flow

1. API Gateway receives HTTP requests from clients
2. Lambda function processes requests and queries RDS
3. CloudWatch automatically collects metrics from all services
4. EventBridge triggers metric aggregator Lambda every 5 minutes
5. Aggregated metrics stored in DynamoDB for analysis
6. CloudWatch Alarms monitor thresholds and trigger SNS notifications
7. Operations team receives email alerts for threshold breaches

### Network Architecture

The system uses a VPC with public and private subnets:

- Public subnets: Internet Gateway for external access
- Private subnets: RDS database and Lambda functions
- Security groups control traffic between components
- No direct internet access to database

### Monitoring Components

CloudWatch Dashboard displays:

- API Gateway request count and error rates
- API Gateway latency (average, p95, p99)
- Lambda invocation count and errors
- Lambda execution duration
- RDS CPU utilization and connections
- RDS read/write latency and throughput

### Alerting Thresholds

The system monitors and alerts on:

- API latency exceeding 1000ms average
- API error rate above 5 percent
- Lambda errors exceeding 10 per evaluation period
- Lambda duration above 3000ms
- RDS CPU above 80 percent
- RDS connections above 100

### Security Architecture

Encryption in transit:

- API Gateway uses HTTPS
- All AWS API calls use TLS

Encryption at rest:

- KMS encryption for all data storage
- DynamoDB encrypted with customer managed key
- RDS storage encrypted
- CloudWatch Logs encrypted
- SNS messages encrypted

Access control:

- IAM roles with least-privilege policies
- Security groups restrict network access
- VPC isolation for database
- KMS key policies control encryption key usage

### High Availability

The infrastructure provides:

- Multi-AZ deployment for RDS with automatic failover
- Lambda functions run across multiple availability zones
- DynamoDB replicates data across multiple zones
- CloudWatch is a regional service with built-in redundancy

### Scalability

Components scale automatically:

- API Gateway handles any request volume
- Lambda scales to 1000 concurrent executions
- DynamoDB uses on-demand capacity mode
- RDS can be scaled vertically if needed

## Resource Naming

All resources include the environment suffix to avoid conflicts:

- Format: `project-name-environment-suffix-resource-type`
- Example: `cw-analytics-dev-api`

This allows multiple environments to coexist in the same account.

## Metric Aggregation

The aggregator Lambda function:

1. Queries CloudWatch for metrics from last 5 minutes
2. Collects data for API Gateway, Lambda, and RDS
3. Processes and formats the data
4. Stores in DynamoDB with timestamp and metadata
5. Enables historical analysis and custom reporting

## Cost Optimization

The architecture optimizes costs by:

- Using db.t3.small for RDS (right-sized for workload)
- DynamoDB on-demand billing (pay per request)
- 30-day log retention (not indefinite)
- Metric aggregation reduces CloudWatch API calls
- Lambda only charges for actual execution time

## Operational Considerations

For production use, consider:

- Moving database credentials to AWS Secrets Manager
- Implementing automated backups
- Setting up multi-region failover
- Adding WAF for API Gateway
- Enabling AWS Config for compliance
- Implementing cost alerts
- Setting up automated testing

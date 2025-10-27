# Healthcare Data Processing Pipeline Infrastructure

I need help setting up a HIPAA-compliant real-time medical data processing system for a healthcare provider. They have multiple medical facilities sending patient monitoring data from various devices and need to process this data in real-time while staying compliant with healthcare regulations.

The system should handle real-time streaming data from patient monitoring devices, store it securely in a database, cache frequently accessed data for quick retrieval, and provide API access for authorized healthcare staff.

## Requirements

The infrastructure needs to be deployed in the eu-west-1 region and must meet HIPAA compliance requirements. All data must be encrypted both when stored and during transmission using AES-256 encryption. The system needs to be highly available with at least 99.99% uptime, which means resources should be deployed across multiple availability zones.

## Core Components

For data ingestion, I need a Kinesis Data Stream that can handle real-time patient monitoring data. The stream should support encryption and be able to scale based on incoming traffic patterns.

For processing the data, I need ECS Fargate containers that can automatically scale based on workload. These containers will read from the Kinesis stream, process the medical data, and store it in the database.

The database should be RDS Aurora with encryption enabled. It needs to support automatic backups and should be deployed across multiple availability zones for high availability. I've heard Aurora Serverless v2 now supports scaling to zero capacity which could help with cost management during off-peak hours.

For caching frequently accessed data, I need ElastiCache Redis with encryption at rest and in transit. This should also be deployed in a multi-AZ configuration.

API Gateway should provide secure access to the data with proper authentication. The API needs to support custom authorizers for healthcare-specific authentication requirements.

All credentials and sensitive configuration should be stored in Secrets Manager with automatic rotation enabled.

## Security and Networking

Everything should run in a private VPC with proper network segmentation. Public subnets for load balancers and NAT gateways, private subnets for compute resources and databases. All security groups should follow the principle of least privilege.

All encryption should use KMS keys with automatic rotation enabled. I need CloudWatch logging for all services to maintain an audit trail for compliance purposes.

## Additional Considerations

The infrastructure code should be written in Go using Pulumi. Resource names should include an environment suffix to support multiple environments running in parallel.

Make sure to use recent AWS features where applicable, especially the newer Aurora Serverless v2 zero-capacity scaling and Secrets Manager managed rotation capabilities.

Hey team,

We're building a secure data pipeline infrastructure for FastShop, a growing Brazilian e-commerce company. They need real-time transaction processing and fraud detection capabilities that comply with Brazil's LGPD data protection regulations. The business is growing fast and they need a system that can handle real-time customer transaction data while keeping everything secure and compliant.

The challenge here is balancing performance with security. We need to process transactions in real-time for fraud detection, but we also need to ensure all customer data is encrypted and handled according to LGPD requirements. The infrastructure needs to be robust enough to handle production workloads while maintaining the flexibility to be deployed and torn down as needed for testing.

I've been asked to create this infrastructure using **Pulumi with Python**. The platform team has standardized on Pulumi for our infrastructure as code, and Python is our go-to language for these deployments. Everything needs to be deployed in the us-east-1 region to align with our existing infrastructure.

## What we need to build

Create a secure data pipeline infrastructure using **Pulumi with Python** for real-time transaction processing and fraud detection.

### Core Requirements

1. **Real-time Data Ingestion**
   - Amazon Kinesis Data Stream for processing customer transaction data in real-time
   - Stream must be encrypted at rest using AWS KMS
   - Configure appropriate shard capacity for transaction volume

2. **Data Storage**
   - Amazon RDS PostgreSQL instance for storing processed transaction data
   - Database must be in a private subnet with no direct internet access
   - Enable encryption at rest using AWS KMS
   - Configure automated backups and maintenance windows

3. **Caching Layer**
   - Amazon ElastiCache Redis cluster for temporary data caching
   - Must have automatic failover enabled with at least one replica
   - Deploy in private subnets for security
   - Configure appropriate node types for performance

4. **Network Infrastructure**
   - Amazon VPC with both public and private subnets across multiple availability zones
   - Security groups to control network access between components
   - Proper subnet configuration for database and cache isolation
   - NAT Gateway or VPC endpoints for private subnet internet access

5. **Encryption and Security**
   - AWS KMS customer managed key for encrypting data at rest
   - All data in Kinesis, RDS, and ElastiCache must use KMS encryption
   - Security groups configured with least privilege access
   - No public access to database or cache instances

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use Amazon Kinesis Data Streams for real-time processing
- Use Amazon RDS PostgreSQL for persistent storage
- Use Amazon ElastiCache Redis with automatic failover
- Use AWS KMS for encryption key management
- Use Amazon VPC with proper network segmentation
- Resource names must include **environment_suffix** parameter for uniqueness
- Follow naming convention: resource-type-{environment_suffix}
- Deploy to **us-east-1** region
- LGPD Compliance: Implement encryption and access controls for Brazilian customer data

### Deployment Requirements (CRITICAL)

- All named resources MUST include environment_suffix to avoid naming conflicts
- Do NOT use deletion_protection on RDS instances - resources must be destroyable
- Do NOT use RETAIN removal policies - all resources must be cleanly removable
- RDS instance: Set skip_final_snapshot=True for testing environments
- ElastiCache: Ensure automatic_failover_enabled=True with replica nodes
- All encryption keys: Enable key deletion (do not disable key deletion)

### Constraints

- RDS instance must be in private subnet only (no public access)
- ElastiCache must have automatic failover with minimum one replica
- All data at rest must be encrypted using customer managed KMS keys
- Security groups must follow least privilege principle
- All resources must be in us-east-1 region
- LGPD compliance requires proper encryption and access control
- Resources must be fully destroyable (no retention policies)
- Include proper error handling and validation

## Success Criteria

- **Functionality**: Real-time data stream processing with encrypted storage and caching
- **Security**: All data encrypted at rest, RDS in private subnet, proper security groups
- **High Availability**: ElastiCache with automatic failover and replica nodes
- **Compliance**: LGPD-compliant encryption and access controls for Brazilian customer data
- **Resource Naming**: All resources include environment_suffix parameter
- **Destroyability**: All resources can be cleanly deleted without retention policies
- **Code Quality**: Clean Python code, well-structured, properly typed

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- TapStackArgs class with environment_suffix parameter
- TapStack class implementing all AWS services:
  - VPC with public and private subnets
  - KMS key for encryption
  - Kinesis Data Stream with KMS encryption
  - RDS PostgreSQL in private subnet with KMS encryption
  - ElastiCache Redis cluster with automatic failover
  - Security groups for all components
- Unit tests with 100% coverage in tests/unit/test_tap_stack.py
- Integration tests in tests/integration/test_tap_stack.py
- Documentation and deployment instructions in lib/README.md

# E-Commerce Product Catalog Data Pipeline Infrastructure

Hey team,

We need to build a scalable data pipeline infrastructure for RetailTech Inc.'s e-commerce platform. The business is experiencing rapid growth and their current system can't handle the volume of inventory updates coming from multiple suppliers. They need a robust solution that can process real-time updates, maintain accurate product catalog data, and provide fast access to frequently queried products.

The platform team has asked us to implement this using **CDK with Python** to align with their existing infrastructure tooling. The system needs to handle high throughput while maintaining compliance with data retention requirements.

## What we need to build

Create an e-commerce product catalog data pipeline using **CDK with Python** that processes inventory updates in real-time, caches frequently accessed data, and maintains compliance with data retention policies.

### Core Requirements

1. **Real-Time Inventory Processing**
   - Handle inventory updates from multiple suppliers
   - Process at least 1000 product updates per minute
   - Ensure reliable message delivery and processing

2. **Product Catalog Database**
   - Store product catalog data in a relational database
   - Support efficient querying and updates
   - Maintain data consistency across updates

3. **Caching Layer**
   - Cache frequently accessed product data
   - Reduce database load for read-heavy operations
   - Provide sub-second response times for cached data

4. **Compliance and Archival**
   - Retain data for minimum 3 years (e-commerce regulations)
   - Support long-term storage for compliance
   - Enable efficient data lifecycle management

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **Amazon Kinesis Data Streams** or **Amazon SQS** for ingesting inventory updates (1000+ updates/min throughput)
- Use **Amazon RDS** (PostgreSQL or MySQL) for product catalog storage
- Use **Amazon ElastiCache** (Redis or Memcached) for caching layer
- Use **Amazon S3** for long-term data retention and compliance archival
- Use **AWS KMS** for encryption at rest across all data stores
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region

### Security Requirements

- Implement encryption at rest using AWS KMS for all data stores
- Enable encryption in transit using TLS/SSL
- Follow principle of least privilege for IAM roles and policies
- Enable CloudWatch logging for all services
- Tag all resources with appropriate metadata

### Infrastructure Constraints

- All resources must be destroyable (no Retain policies)
- Infrastructure should support clean teardown for CI/CD workflows
- Fetch secrets from existing Secrets Manager entries (do not create new ones)
- Avoid resources with DeletionProtection enabled
- Include proper error handling and dead-letter queues where appropriate

## Success Criteria

- **Functionality**: System processes 1000+ updates per minute reliably
- **Performance**: Cached queries respond in under 100ms
- **Reliability**: Message delivery with at-least-once semantics
- **Security**: All data encrypted at rest and in transit
- **Compliance**: Data retention for 3+ years configured
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Python code following CDK best practices, well-tested, documented

## What to deliver

- Complete CDK infrastructure code in Python
- Kinesis Data Streams or SQS for message ingestion
- RDS database for product catalog
- ElastiCache cluster for caching
- S3 buckets with lifecycle policies for archival
- KMS keys for encryption
- IAM roles and policies following least privilege
- CloudWatch log groups and alarms
- Unit tests for all components with 90%+ coverage
- Integration tests validating end-to-end workflows
- Documentation and deployment instructions

Hey team,

We need to build a scalable data pipeline for RetailTech Inc.'s e-commerce platform that handles real-time inventory updates from multiple suppliers. The business is growing fast and we're seeing bottlenecks in our current system. I've been asked to create this infrastructure using AWS CDK with Python.

The main challenge is that we have suppliers pushing inventory updates constantly, and our customers need to see accurate stock levels immediately. We also need to comply with e-commerce data retention regulations that require us to keep transaction records for at least 3 years. The system needs to handle at least 1000 product updates per minute during peak hours.

Right now, our product catalog lives in various places and there's no good caching layer, so we're hitting the database way too hard for popular products. We need a proper architecture that can scale with the business.

## What we need to build

Create a data pipeline infrastructure using **AWS CDK with Python** for processing real-time inventory updates, caching product data, and maintaining compliance requirements.

### Core Requirements

1. **Real-Time Data Ingestion**
   - Stream processing for inventory updates from multiple suppliers
   - Handle at least 1000 product updates per minute
   - Process updates and route to appropriate destinations

2. **Product Catalog Storage**
   - Relational database for product catalog data
   - Store product information, pricing, and inventory levels
   - Support transactional consistency for updates

3. **Caching Layer**
   - Cache frequently accessed product data
   - Reduce database load for popular products
   - Fast read access for customer queries

4. **Data Processing**
   - Transform and validate incoming inventory updates
   - Update product catalog database
   - Invalidate cache entries when inventory changes

5. **Compliance and Archival**
   - Archive all inventory updates for regulatory compliance
   - Maintain data for minimum 3 years
   - Organized storage for audit purposes

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon Kinesis Data Streams** for real-time inventory updates
- Use **Amazon RDS PostgreSQL** for product catalog storage
- Use **Amazon ElastiCache Redis** for product data caching
- Use **AWS Lambda** for stream processing and data transformation
- Use **Amazon S3** for compliance archival with appropriate lifecycle policies
- Use **AWS Secrets Manager** for database credentials
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or deletion protection)
- Use RemovalPolicy.DESTROY for all stateful resources
- No DeletionPolicy set to Retain
- Include proper error handling and CloudWatch logging
- Lambda functions must handle stream processing errors gracefully
- Database credentials must be securely managed via Secrets Manager

### Constraints

- Deploy exclusively in us-east-1 region
- Data retention must meet e-commerce compliance (minimum 3 years for archives)
- System must process at least 1000 product updates per minute
- Database must support transactional consistency
- Cache must provide sub-millisecond read latency
- All resources must be cost-optimized (use appropriate instance sizes)
- Lambda functions should use Python 3.9 or higher runtime

## Success Criteria

- **Functionality**: Real-time processing of inventory updates with database and cache updates
- **Performance**: Handle 1000+ updates per minute with low latency
- **Reliability**: Fault-tolerant stream processing with error handling
- **Security**: Encrypted data at rest and in transit, secure credential management
- **Compliance**: 3-year archival of all inventory updates in S3
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be completely removed without retention
- **Code Quality**: Clean Python code, well-tested, fully documented

## What to deliver

- Complete AWS CDK Python implementation
- Kinesis Data Stream for inventory ingestion
- RDS PostgreSQL database for product catalog
- ElastiCache Redis cluster for caching
- Lambda functions for stream processing
- S3 bucket with lifecycle policies for compliance
- Secrets Manager for database credentials
- IAM roles and policies with least privilege
- CloudWatch log groups for monitoring
- Unit tests for all components
- Deployment instructions and documentation

# Data Lake Infrastructure - CloudFormation YAML Development

## Project Context

I'm building a secure data lake architecture for a data analytics company that processes 10TB of daily log data. This infrastructure needs to handle massive scale while providing comprehensive cataloging, querying, and security capabilities.

## Business Requirements

- **Data Volume**: 10TB daily log ingestion
- **Security**: Enterprise-grade access controls and encryption
- **Performance**: Fast query response times for analytics workloads
- **Scalability**: Auto-scaling components for varying workloads
- **Cost Optimization**: Lifecycle policies for storage optimization
- **Compliance**: Audit trails and data governance

## Infrastructure Requirements

### Core Data Lake Components

- **S3 Data Lake**: Three-zone architecture (raw, processed, curated)
  - Raw zone: Landing area for incoming data
  - Processed zone: Cleaned and validated data
  - Curated zone: Business-ready datasets
- **Lifecycle Policies**: Automatic data tiering (IA → Glacier → Deep Archive)
- **Versioning & MFA Delete**: Data protection and compliance

### Data Processing & ETL

- **AWS Glue Crawlers**: Automatic schema discovery for all data sources
- **AWS Glue ETL Jobs**: Spark-based data transformations
- **AWS Glue Data Catalog**: Centralized metadata repository
- **EMR Cluster**: Complex analytics and machine learning workloads
- **Lambda Functions**: Real-time data validation and lightweight processing

### Data Ingestion

- **Kinesis Data Firehose**: Stream processing for log ingestion
- **Direct S3 uploads**: Batch data uploads with proper partitioning
- **Cross-region replication**: Disaster recovery setup

### Query & Analytics

- **Amazon Athena**: Serverless SQL queries on S3 data
- **Athena Workgroups**: Query governance and cost control
- **Query result buckets**: Separate S3 storage for query outputs

### Security & Access Control

- **Lake Formation**: Fine-grained access control and data governance
- **IAM Roles**: Least privilege access for all services
- **KMS Encryption**: Data encryption at rest and in transit
- **VPC Endpoints**: Secure private connectivity
- **CloudTrail**: API audit logging

### Monitoring & Operations

- **CloudWatch Dashboards**: Comprehensive monitoring
- **CloudWatch Alarms**: Proactive alerting
- **SNS Topics**: Alert notifications
- **Cost allocation tags**: Resource cost tracking

## Technical Specifications

### S3 Configuration

```yaml
# Example structure I need:
RawDataBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub '${CompanyName}-datalake-raw-${Environment}-${AWS::AccountId}'
    VersioningConfiguration:
      Status: Enabled
    LifecycleConfiguration:
      Rules:
        - Status: Enabled
          Transitions:
            - TransitionInDays: 30
              StorageClass: STANDARD_IA
            - TransitionInDays: 90
              StorageClass: GLACIER
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
```

### Glue Job Configuration

```yaml
# ETL job example:
DataProcessingJob:
  Type: AWS::Glue::Job
  Properties:
    Name: !Sub '${CompanyName}-etl-raw-to-processed'
    Role: !GetAtt GlueExecutionRole.Arn
    Command:
      Name: glueetl
      ScriptLocation: !Sub 's3://${ScriptsBucket}/etl-scripts/raw-to-processed.py'
    DefaultArguments:
      '--job-language': 'python'
      '--job-bookmark-option': 'job-bookmark-enable'
    MaxRetries: 3
    GlueVersion: '3.0'
```

### Lake Formation Permissions

```yaml
# Fine-grained access control:
DataAnalystPermissions:
  Type: AWS::LakeFormation::Permissions
  Properties:
    DataLakePrincipal:
      DataLakePrincipalIdentifier: !GetAtt DataAnalystRole.Arn
    Resource:
      DatabaseResource:
        Name: !Ref ProcessedDataDatabase
    Permissions:
      - SELECT
      - DESCRIBE
```

## What I Need

### 1. Complete CloudFormation Template

- **Parameters section**: Environment, company name, retention periods
- **Conditions**: Environment-based configurations
- **Resources**: All 15+ AWS services with proper dependencies
- **Outputs**: All resource ARNs and endpoints for integration

### 2. Proper Resource Organization

- Logical grouping of related resources
- Clear naming conventions using company/environment prefixes
- Proper dependencies between services
- Cross-service IAM permissions

### 3. Security Best Practices

- KMS keys for each data zone with proper policies
- IAM roles with minimal required permissions
- VPC endpoints for secure service communication
- Encryption everywhere (S3, Glue, Athena, EMR)

### 4. Scalability & Performance

- Auto-scaling EMR clusters
- Partitioned S3 storage layout
- Optimized Glue job configurations
- Athena query optimization settings

### 5. Cost Optimization

- S3 lifecycle policies for all buckets
- Spot instances for EMR when appropriate
- Athena workgroup query limits
- Resource tagging for cost allocation

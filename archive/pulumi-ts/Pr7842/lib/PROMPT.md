# Infrastructure Analysis and Monitoring System

## Objective

Create a comprehensive S3 bucket analysis system that scans all S3 buckets in an AWS account and provides detailed insights on configurations, security settings, and compliance status.

## Requirements

### 1. Asynchronous Analysis Architecture

**CRITICAL**: The analysis must be designed to run asynchronously, NOT during infrastructure deployment.

- Use AWS Lambda function(s) to perform bucket analysis
- Analysis must complete within 10 minutes when Lambda is invoked
- Infrastructure deployment must complete in under 5 minutes
- Store analysis results incrementally in S3 as they are computed

### 2. S3 Bucket Analysis

The Lambda function should analyze all S3 buckets in the account and collect:

- **Basic Information**:
  - Bucket name
  - Creation date
  - Region
  - Owner

- **Security Configuration**:
  - Public access block settings (all 4 settings)
  - Bucket ACL configuration
  - Bucket policy (if exists)
  - Encryption settings (SSE-S3, SSE-KMS, etc.)
  - Versioning status

- **Logging and Monitoring**:
  - Server access logging status
  - Object-level logging status

- **Lifecycle and Storage**:
  - Lifecycle policies (if configured)
  - Storage metrics (number of objects, total size if available)
  - Replication configuration (if any)

- **Compliance Checks**:
  - Flag buckets with public access enabled
  - Flag buckets without encryption
  - Flag buckets without versioning
  - Flag buckets without logging

### 3. Results Storage

- Create an S3 bucket to store analysis results
- Store results as JSON files with timestamps
- Organize results by date/time for historical tracking
- Each analysis run should create a new result file

### 4. Monitoring and Alerting

Create CloudWatch dashboard and alarms for:

- **Dashboard Metrics**:
  - Total buckets analyzed
  - Number of buckets with security issues
  - Number of buckets without encryption
  - Number of buckets with public access
  - Analysis execution time
  - Lambda execution status

- **CloudWatch Alarms**:
  - Alert when buckets with public access are detected
  - Alert when unencrypted buckets are found
  - Alert when Lambda function fails
  - Alert when analysis takes longer than 10 minutes

### 5. Lambda Function Requirements

- **Runtime**: Node.js 18.x or later (TypeScript compiled to JavaScript)
- **Timeout**: 15 minutes (900 seconds)
- **Memory**: 512 MB minimum (adjust based on testing)
- **IAM Permissions**:
  - Read access to all S3 buckets
  - List all buckets
  - Get bucket configurations (ACL, policy, encryption, versioning, logging, lifecycle, replication)
  - Write access to results bucket
  - CloudWatch Logs permissions
  - CloudWatch Metrics permissions

### 6. Optional Enhancements (Good for Real-World Use)

- EventBridge scheduled rule to run analysis daily or weekly
- SNS topic for alarm notifications
- API Gateway endpoint to trigger analysis on-demand
- Parameter Store or Secrets Manager for configuration
- Tags on created resources for organization

## Technical Constraints

- **Platform**: Pulumi with TypeScript
- **Region**: us-east-1
- **Deployment Time**: Must complete in < 5 minutes
- **Analysis Time**: Must complete in < 10 minutes when Lambda runs
- **Testing**: Achieve 100% code coverage
- **Integration Tests**: Use real resource outputs, no mocking

## Success Criteria

1. Infrastructure deploys successfully in < 5 minutes
2. Lambda function can analyze 100+ S3 buckets within 10 minutes
3. Results are stored in S3 with proper structure
4. CloudWatch dashboard displays all required metrics
5. Alarms trigger appropriately for security issues
6. All tests pass with 100% coverage
7. Integration tests validate real resource configurations
8. Code follows best practices and is production-ready

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  AWS Account                             │
│                                                          │
│  ┌──────────────┐      ┌──────────────────────────┐   │
│  │  Lambda      │──────►  S3 Results Bucket        │   │
│  │  Function    │      │  (stores analysis JSON)   │   │
│  └──────┬───────┘      └──────────────────────────┘   │
│         │                                               │
│         │ Scans                                         │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  All S3 Buckets in Account                       │  │
│  │  (analyzes config, security, compliance)         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CloudWatch Dashboard                            │  │
│  │  (metrics and visualizations)                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CloudWatch Alarms                               │  │
│  │  (security and compliance alerts)                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  EventBridge Rule (Optional)                     │  │
│  │  (scheduled daily/weekly execution)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Notes

- Do NOT perform analysis synchronously during stack deployment
- Lambda function is invoked separately after infrastructure is deployed
- Results bucket should have versioning and encryption enabled
- Lambda function should handle pagination for large numbers of buckets
- Include proper error handling and retries
- Log progress to CloudWatch Logs for debugging

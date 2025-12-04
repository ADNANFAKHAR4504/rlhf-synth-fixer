# Zero-Downtime Migration Orchestration - CDKTF Python Implementation

This implementation provides a comprehensive zero-downtime migration orchestration platform for migrating a payment processing system from on-premises to AWS.

## Architecture Overview

The solution implements a complete migration infrastructure with:

- **Dual VPC Architecture**: Production and migration VPCs with Transit Gateway connectivity
- **Database Layer**: Aurora PostgreSQL with multi-AZ deployment and DMS replication
- **Migration Orchestration**: Step Functions state machine controlling the migration workflow
- **Data Validation**: Lambda functions for consistency checks
- **Automated Rollback**: Lambda-based rollback with checkpoint management
- **Monitoring**: CloudWatch dashboards, alarms, and log metric filters
- **API Layer**: API Gateway with custom authorization for traffic routing

## Implementation Files

### Main Infrastructure (`lib/tap_stack.py`)

Complete CDKTF Python implementation including:

#### 1. Network Infrastructure
- Production VPC (10.0.0.0/16) with 3 AZs
- Migration VPC (10.1.0.0/16) with 3 AZs
- Each VPC has:
  - Public subnets for NAT gateways
  - Private subnets for compute and databases
  - DMS-specific subnets for replication instances
- Internet Gateways and NAT Gateways for internet connectivity
- Transit Gateway connecting both VPCs for cross-VPC communication

#### 2. Database Infrastructure
- Aurora PostgreSQL cluster with 2 instances (db.r6g.large)
- Multi-AZ deployment for high availability
- Encryption at rest enabled
- CloudWatch logs exported for monitoring
- DB credentials stored in Secrets Manager
- 7-day backup retention

#### 3. Database Migration Service (DMS)
- Multi-AZ replication instance (dms.c5.xlarge)
- Source endpoint for on-premises database
- Target endpoint for Aurora PostgreSQL
- Replication task configured for:
  - Full-load migration
  - Change Data Capture (CDC) for real-time replication
  - LOB handling with limited size mode
  - Comprehensive logging

#### 4. Lambda Functions

**Data Validator (`lib/lambda/data_validator.py`)**
- Validates data consistency between source and target databases
- Performs row count validation across tables
- Calculates and compares checksums for data integrity
- Publishes metrics to CloudWatch
- Runs in VPC with access to databases

**API Authorizer (`lib/lambda/api_authorizer.py`)**
- Custom authorizer for API Gateway
- Token-based authentication using HMAC validation
- Retrieves secrets from Parameter Store
- Returns IAM policy for API Gateway

**Rollback Handler (`lib/lambda/rollback_handler.py`)**
- Executes automated rollback procedures
- Updates routing configuration to redirect to source
- Stops DMS replication tasks
- Retrieves and saves checkpoint states from S3
- Sends SNS notifications

#### 5. Step Functions State Machine

Orchestrates the entire migration workflow:

1. **Initialize**: Sets up migration state
2. **StartReplication**: Starts DMS replication task
3. **WaitForReplication**: Allows time for data replication
4. **ValidateData**: Invokes validator Lambda
5. **CheckValidationResult**: Decision point based on validation
6. **ExecuteRollback**: Triggered on validation failure
7. **NotifySuccess/NotifyRollback/NotifyFailure**: SNS notifications

#### 6. Storage Layer
- S3 bucket for migration checkpoints
- Versioning enabled for state history
- Server-side encryption (AES256)
- Stores rollback states and migration metadata

#### 7. Monitoring and Alerting

**CloudWatch Dashboards**
- DMS replication lag metrics
- Validation results (matches, mismatches, errors)
- Aurora cluster health (CPU, connections)

**CloudWatch Alarms**
- Replication lag alarm (threshold: 5 seconds)
- Validation failure alarm

**Log Metric Filters**
- Tracks validation failures from Lambda logs
- Creates custom metrics in CloudWatch

**SNS Notifications**
- Email subscription for ops team
- Alerts on replication lag
- Alerts on validation failures
- Migration status notifications

#### 8. API Gateway
- REST API for traffic routing during migration
- Custom authorizer using Lambda
- POST /payment endpoint
- HTTP_PROXY integration to backend
- Deployed to production stage

#### 9. Configuration Management

**Secrets Manager**
- Database master credentials with auto-generated passwords
- Recovery window set to 0 for testing (adjust for production)

**Parameter Store**
- `/migration/{env}/routing/target`: Controls traffic routing
- `/migration/{env}/api/secret`: API authorization secret
- `/migration/{env}/sns/topic-arn`: SNS topic ARN for notifications

#### 10. IAM Roles and Policies

**Lambda Execution Role**
- Basic Lambda execution permissions
- VPC execution permissions
- Secrets Manager read access
- Parameter Store read/write access
- S3 read/write for migration bucket
- CloudWatch metrics publishing
- SNS publish permissions
- DMS task control

**Step Functions Role**
- Lambda invocation permissions
- DMS task management
- SNS publish permissions
- CloudWatch Logs permissions

**DMS Role**
- VPC management permissions for DMS

### Security Features

1. **Encryption**
   - All data encrypted at rest (Aurora, S3)
   - SSL/TLS for data in transit (DMS endpoints)
   - Secrets Manager for credential management

2. **Network Security**
   - Security groups with least privilege access
   - Private subnets for databases and compute
   - VPC isolation

3. **Authentication and Authorization**
   - Custom API authorizer with token validation
   - IAM roles with scoped permissions
   - Parameter Store for sensitive configuration

### Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `production-vpc-dev`
- `aurora-cluster-dev`
- `data-validator-dev`
- `migration-orchestration-dev`

This ensures:
- Multi-environment support
- Easy identification of resources
- No naming conflicts

### Deployment

The infrastructure is deployable via:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
pipenv run python tap.py
cdktf deploy
```

### Migration Workflow

1. **Pre-Migration**
   - Infrastructure deployed
   - DMS endpoints configured
   - Lambda functions deployed
   - Parameter Store configured

2. **Migration Execution**
   - Start Step Functions state machine
   - DMS begins full load + CDC
   - Wait period for initial replication
   - Data validation Lambda invoked
   - Validation checks row counts and checksums

3. **Success Path**
   - All validations pass
   - SNS notification sent
   - Traffic can be gradually shifted

4. **Failure/Rollback Path**
   - Validation fails or error occurs
   - Rollback Lambda invoked
   - Routing updated to source
   - DMS tasks stopped
   - Rollback state saved to S3
   - SNS alert sent to ops team

### Monitoring During Migration

Operators can monitor:
- CloudWatch dashboard for real-time metrics
- Replication lag to ensure < 5 seconds
- Validation results in custom metrics
- Lambda logs for detailed debugging
- SNS email notifications for critical events

### Compliance and Best Practices

- **PCI-DSS Considerations**: Encryption, network isolation, audit logging
- **High Availability**: Multi-AZ deployment for Aurora and DMS
- **Disaster Recovery**: S3 checkpoint backups, automated rollback
- **Cost Optimization**: Right-sized instances, Aurora provisioned mode
- **Operational Excellence**: Comprehensive monitoring, automated alerts

## Key Features

1. **Zero Downtime**: Parallel systems with gradual cutover
2. **Data Consistency**: Automated validation with rollback
3. **Observable**: Comprehensive monitoring and alerting
4. **Secure**: Encryption, least privilege, credential management
5. **Automated**: Step Functions orchestration, Lambda automation
6. **Resilient**: Multi-AZ, automated rollback, checkpoint management
7. **Production-Ready**: All resources properly tagged, configured, and monitored

## Future Enhancements

1. Add Secrets Manager rotation Lambda for automatic credential rotation
2. Implement blue/green deployment for Aurora
3. Add cross-region Aurora read replicas (us-east-2)
4. Enhance API Gateway with rate limiting and caching
5. Implement automated testing of rollback procedures
6. Add cost allocation tags for detailed billing
7. Implement AWS Config rules for compliance monitoring

## Notes

- Source endpoint uses placeholder credentials (update for production)
- SNS email subscription requires confirmation
- API secret in Parameter Store should be rotated regularly
- Transit Gateway allows future VPN connection to on-premises
- Lambda functions require psycopg2 layer (package with deployment)
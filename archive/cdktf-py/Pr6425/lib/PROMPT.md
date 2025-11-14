# TAP Infrastructure - Aurora PostgreSQL Demonstration

## Overview

Build a demonstration infrastructure using **CDKTF with Python** that showcases AWS Aurora PostgreSQL deployment with proper security, monitoring, and best practices.

## What We Need to Build

Create a foundational AWS infrastructure stack that demonstrates:
- Aurora PostgreSQL 16.9 cluster with proper configuration
- Network infrastructure (VPC, subnets, security groups)
- IAM roles and policies for enhanced monitoring
- S3 bucket with versioning and encryption
- Terraform state management with S3 backend

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR block `10.0.0.0/16`
   - Two private subnets in different availability zones
   - Security group for Aurora PostgreSQL allowing traffic on port 5432 from VPC
   - Enable DNS hostnames and DNS support

2. **Database Tier**
   - Deploy Aurora PostgreSQL 16.9 cluster
   - Single writer instance (db.r6g.large)
   - Enable encryption at rest
   - Configure automated backups with 7-day retention
   - Enable Performance Insights
   - Enable Enhanced Monitoring (60-second granularity)
   - Enable CloudWatch Logs exports for PostgreSQL

3. **Parameter Groups**
   - Cluster parameter group for Aurora PostgreSQL 16
   - DB parameter group for Aurora PostgreSQL 16 instances
   - Configure monitoring extensions (pg_stat_statements, auto_explain)
   - Enable SSL/TLS enforcement
   - Configure logging parameters

4. **IAM and Security**
   - IAM role for RDS Enhanced Monitoring
   - Attach AmazonRDSEnhancedMonitoringRole policy
   - Security group rules for PostgreSQL access
   - Egress rules for outbound connectivity

5. **S3 Infrastructure**
   - S3 bucket for demonstration
   - Enable versioning
   - Enable server-side encryption (AES256)
   - Proper naming convention (lowercase, no underscores)

6. **State Management**
   - S3 backend for Terraform state
   - State file encryption enabled
   - State locking with S3 lockfile
   - Environment-specific state file paths

### Technical Requirements

- **Framework**: CDKTF with Python
- **Database**: Aurora PostgreSQL 16.9
- **Region**: us-east-1 (configurable)
- **Instance Type**: db.r6g.large (Graviton2)
- **Database Engine**: aurora-postgresql
- **Engine Version**: 16.9
- **Parameter Family**: aurora-postgresql16
- **Naming Convention**: `{resource-type}-{environment-suffix}`
- **Environment Suffix**: Configurable via kwargs (default: 'dev')
- **State Bucket**: iac-rlhf-tf-states (configurable)

### Configuration Parameters

The stack accepts the following configuration parameters:
- `environment_suffix`: Environment identifier (default: 'dev')
- `aws_region`: AWS region for deployment (default: 'us-east-1')
- `state_bucket_region`: Region for S3 state bucket (default: 'us-east-1')
- `state_bucket`: S3 bucket name for state (default: 'iac-rlhf-tf-states')
- `default_tags`: Dictionary of default tags to apply to all resources

### Security and Best Practices

- **Encryption**: Storage encryption enabled for Aurora cluster
- **Backups**: 7-day retention period with automated backups
- **Networking**: Private subnets, no public accessibility
- **Monitoring**: Performance Insights and Enhanced Monitoring enabled
- **Logging**: CloudWatch Logs integration for PostgreSQL logs
- **SSL/TLS**: Force SSL parameter enabled in cluster parameter group
- **IAM**: Service role with minimal required permissions
- **Resource Naming**: All resources properly tagged with environment and name

### Database Configuration

**Master Credentials**:
- Username: `postgresadmin` (avoid reserved name 'postgres')
- Password: `TempPassword123!ChangeMe` (should be rotated in production)
- Database Name: `tapdb{environment}` (alphanumeric only)

**Cluster Settings**:
- Backup window: 03:00-04:00 UTC
- Maintenance window: Monday 04:00-05:00 UTC
- Multi-AZ: Enabled via subnet group
- Skip final snapshot: True (for testing/demo purposes)
- Apply immediately: True (for testing/demo purposes)

**Monitoring Configuration**:
- Performance Insights: Enabled (7-day retention)
- Enhanced Monitoring: 60-second intervals
- CloudWatch Logs: PostgreSQL logs exported

### Constraints

- Resource names must be lowercase (RDS naming requirements)
- Database name must start with letter, alphanumeric only
- S3 bucket names must be globally unique and lowercase
- Security group must be in the same VPC as subnets
- DB subnet group requires minimum 2 subnets in different AZs
- Parameter group family must match engine version (aurora-postgresql16)
- IAM role trust policy must allow monitoring.rds.amazonaws.com

## Success Criteria

### Functionality (Core)
- ✅ Aurora PostgreSQL 16.9 cluster successfully deployed
- ✅ VPC with proper networking configuration
- ✅ Security groups with appropriate ingress/egress rules
- ✅ IAM role for Enhanced Monitoring with correct policies
- ✅ Parameter groups properly configured for PostgreSQL 16
- ✅ S3 bucket with versioning and encryption

### Security
- ✅ Encryption at rest enabled
- ✅ Private subnets (no public accessibility)
- ✅ Security group restricts access to VPC only
- ✅ SSL/TLS enforcement via parameter group
- ✅ IAM role follows least privilege principle

### Reliability
- ✅ Multi-AZ deployment via subnet group
- ✅ Automated backups enabled (7-day retention)
- ✅ Enhanced Monitoring for performance tracking
- ✅ CloudWatch Logs integration

### Code Quality
- ✅ Well-structured Python code using CDKTF
- ✅ Proper resource dependencies
- ✅ Comprehensive unit tests (90%+ coverage)
- ✅ Integration tests for AWS connectivity
- ✅ Type hints and documentation
- ✅ Error handling and validation

## What to Deliver

### Core Infrastructure (`lib/tap_stack.py`)
- Complete CDKTF Python implementation
- AWS Provider configuration
- S3 Backend for state management
- VPC with 2 private subnets across 2 AZs
- DB Subnet Group for Aurora
- Security Group with PostgreSQL rules
- IAM Role for RDS Enhanced Monitoring
- RDS Cluster Parameter Group (aurora-postgresql16)
- DB Parameter Group (aurora-postgresql16)
- Aurora PostgreSQL 16.9 cluster
- Aurora PostgreSQL 16.9 instance (writer)
- S3 bucket with versioning and encryption

### Testing (`tests/`)
- **Unit Tests** (98 tests, 100% coverage):
  - `tests/unit/test_tap_stack.py`: 52 tests for TapStack
  - `tests/unit/test_modules.py`: 46 tests for infrastructure modules
- **Integration Tests** (8 tests):
  - `tests/integration/test_live_deployment.py`: AWS connectivity tests
  - `tests/integration/test_tap_stack.py`: CDKTF synthesis test

### Entry Point (`tap.py`)
- Main application entry point
- Stack instantiation with configuration
- CDKTF app synthesis

### Configuration
- `.coveragerc`: Coverage configuration (90% threshold)
- `tests/conftest.py`: Pytest global configuration
- `tests/integration/conftest.py`: Integration test markers

## Resource Naming Examples

For `environment_suffix = "dev"`:
- VPC: `aurora-vpc-dev`
- Subnets: `aurora-subnet-1-dev`, `aurora-subnet-2-dev`
- Security Group: `aurora-sg-dev`
- Subnet Group: `aurora-subnet-group-dev`
- Cluster Parameter Group: `aurora-postgres16-cluster-pg-dev`
- DB Parameter Group: `aurora-postgres16-db-pg-dev`
- Cluster: `aurora-postgres-dev`
- Instance: `aurora-postgres-dev-instance-1`
- IAM Role: `rds-monitoring-role-dev`
- S3 Bucket: `tap-bucket-dev-tapstackdev`

## Deployment

```bash
# Install dependencies
pip install cdktf constructs cdktf-cdktf-provider-aws

# Initialize CDKTF
cdktf get

# Synthesize Terraform configuration
cdktf synth

# Plan deployment
cdktf plan

# Deploy infrastructure
cdktf deploy

# Run tests
pytest tests/unit/ -v --cov=lib --cov-report=term-missing
pytest tests/integration/ -v -m integration
```

## Notes

This is a **demonstration infrastructure** focused on showing proper CDKTF implementation patterns, not a production-ready payment processing migration system. It demonstrates:
- Correct use of Aurora PostgreSQL 16.9
- Proper CDKTF Python patterns
- Security best practices
- Monitoring and observability
- Infrastructure as Code with comprehensive testing

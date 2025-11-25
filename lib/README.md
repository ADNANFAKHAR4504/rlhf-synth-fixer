# Aurora Global Database for Disaster Recovery

This CloudFormation template deploys a production-ready Aurora Global Database infrastructure spanning two AWS regions for cross-region disaster recovery.

## Architecture

### Components

1. **Aurora Global Database**: Top-level global cluster resource managing cross-region replication
2. **Primary Region (us-east-1)**:
   - Aurora MySQL cluster with 2 instances
   - VPC with 3 private subnets across multiple AZs
   - DB subnet group
   - Security group for database access
3. **Secondary Region (us-east-2)**:
   - Aurora MySQL cluster (read replica) with 1 instance
   - VPC with 3 private subnets across multiple AZs
   - DB subnet group
   - Security group for database access
4. **Secrets Manager**: Secure storage for database credentials
5. **CloudWatch**: Monitoring and alarms for replication lag and cluster health
6. **Route 53**: Health checks for database endpoints

### Key Features

- Cross-region replication with sub-second lag
- Automatic failover capability
- Encrypted storage at rest
- Encrypted credentials in Secrets Manager
- Private subnet deployment (no public access)
- Multi-AZ high availability
- CloudWatch monitoring and alerting
- Fully parameterized with environmentSuffix

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create RDS, VPC, Secrets Manager, CloudWatch, and Route 53 resources
- Sufficient service quotas for Aurora instances in both regions

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-dr-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=PrimaryRegion,ParameterValue=us-east-1 \
    ParameterKey=SecondaryRegion,ParameterValue=us-east-2 \
    ParameterKey=DatabaseName,ParameterValue=appdb \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=DBInstanceClass,ParameterValue=db.r5.large \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

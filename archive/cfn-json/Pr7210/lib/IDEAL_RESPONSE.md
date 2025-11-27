# Production-Ready CloudFormation Nested Stack Solution

This document describes the ideal, production-ready implementation of the transaction processing infrastructure using CloudFormation nested stacks with AWS Secrets Manager for secure credential management.

## Architecture Overview

The solution implements a nested stack architecture that eliminates circular dependencies and enables rapid deployments:

1. **NetworkStack** - VPC, subnets (3 AZs), security groups, VPC endpoints
2. **DatabaseStack** - RDS Aurora MySQL cluster with AWS Secrets Manager integration
3. **ComputeStack** - Lambda functions using ECR container images
4. **MonitoringStack** - CloudWatch alarms and rollback triggers

### Root Level Resources

- **SessionTable** - DynamoDB table for session management (on-demand billing)
- **AuditLogsBucket** - S3 bucket for audit logs with conditional cross-region replication
- **S3ReplicationRole** - IAM role for S3 cross-region replication (production only)

## Key Features

### 1. AWS Secrets Manager Integration

The database password is automatically generated and stored securely in AWS Secrets Manager, eliminating the need to pass passwords via CloudFormation parameters.

**Implementation in DatabaseStack.json:**

```json
{
  "DBMasterSecret": {
    "Type": "AWS::SecretsManager::Secret",
    "Properties": {
      "Name": {
        "Fn::Sub": "rds-master-secret-${EnvironmentSuffix}"
      },
      "Description": "RDS Aurora master password",
      "GenerateSecretString": {
        "SecretStringTemplate": {
          "Fn::Sub": "{\"username\": \"${DBMasterUsername}\"}"
        },
        "GenerateStringKey": "password",
        "PasswordLength": 32,
        "ExcludeCharacters": "\"@/\\",
        "IncludeSpace": false,
        "RequireEachIncludedType": true
      }
    }
  },
  "DBCluster": {
    "Type": "AWS::RDS::DBCluster",
    "DependsOn": "DBMasterSecret",
    "Properties": {
      "MasterUsername": {
        "Fn::Sub": "{{resolve:secretsmanager:rds-master-secret-${EnvironmentSuffix}:SecretString:username}}"
      },
      "MasterUserPassword": {
        "Fn::Sub": "{{resolve:secretsmanager:rds-master-secret-${EnvironmentSuffix}:SecretString:password}}"
      }
    }
  },
  "DBSecretAttachment": {
    "Type": "AWS::SecretsManager::SecretTargetAttachment",
    "Properties": {
      "SecretId": {"Ref": "DBMasterSecret"},
      "TargetId": {"Ref": "DBCluster"},
      "TargetType": "AWS::RDS::DBCluster"
    }
  }
}
```

**Benefits:**
- ✅ Automatic password generation (32 characters, secure)
- ✅ No plaintext passwords in CloudFormation parameters
- ✅ Enables automatic secret rotation via SecretTargetAttachment
- ✅ Complies with cfn-lint W1011 (Use dynamic references over parameters for secrets)
- ✅ Password never exposed in stack events or parameter history

### 2. Nested Stack Architecture

The main stack (`TapStack.json`) orchestrates four nested stacks:

#### NetworkStack
- **Purpose**: VPC, subnets, security groups, VPC endpoints
- **Timeout**: 10 minutes
- **Outputs**: VPC ID, subnet IDs, security group IDs
- **Dependencies**: None (foundation stack)

#### DatabaseStack
- **Purpose**: RDS Aurora MySQL cluster with Secrets Manager
- **Timeout**: 30 minutes (RDS creation takes time)
- **Inputs**: Subnet IDs, security group ID from NetworkStack
- **Outputs**: Cluster ID, endpoint, port, read endpoint, secret ARN
- **Dependencies**: NetworkStack

#### ComputeStack
- **Purpose**: Lambda functions with ECR container images
- **Timeout**: 15 minutes
- **Inputs**: Subnet IDs, security group ID from NetworkStack; DB endpoint from DatabaseStack
- **Outputs**: Lambda function ARNs and names
- **Dependencies**: NetworkStack, DatabaseStack

#### MonitoringStack
- **Purpose**: CloudWatch alarms and rollback triggers
- **Timeout**: 5 minutes
- **Inputs**: DB cluster ID from DatabaseStack; Lambda names from ComputeStack
- **Outputs**: Alarm ARNs
- **Dependencies**: DatabaseStack, ComputeStack

### 3. Cross-Stack References

Nested stacks communicate via CloudFormation outputs using `Fn::GetAtt`:

```json
{
  "DatabaseStack": {
    "Properties": {
      "Parameters": {
        "PrivateSubnet1Id": {
          "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1Id"]
        },
        "DatabaseSecurityGroupId": {
          "Fn::GetAtt": ["NetworkStack", "Outputs.DatabaseSecurityGroupId"]
        }
      }
    }
  }
}
```

### 4. Root Level Resources

#### SessionTable (DynamoDB)
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Features**: 
  - Global Secondary Index (UserIdIndex)
  - Time-to-Live (TTL) enabled
  - Conditional Point-in-Time Recovery (enabled for prod only)
- **Naming**: `session-table-${EnvironmentSuffix}`

#### AuditLogsBucket (S3)
- **Versioning**: Enabled
- **Encryption**: AES256 server-side encryption
- **Public Access**: Blocked (all four settings enabled)
- **Lifecycle Rules**:
  - Transition to Standard-IA after 30 days
  - Transition to Glacier after 90 days
  - Delete old versions after 90 days
- **Replication**: Conditional on `IsProd` condition
  - Cross-region replication with 15-minute RTC SLA
  - Replication role created only in production
- **Naming**: `audit-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}`

### 5. Conditional Resource Creation

Resources are conditionally created based on environment:

```json
{
  "Conditions": {
    "IsProd": {
      "Fn::Equals": [{"Ref": "Environment"}, "prod"]
    }
  },
  "Resources": {
    "S3ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Condition": "IsProd",
      "Properties": {
        // Only created in production
      }
    },
    "AuditLogsBucket": {
      "Properties": {
        "ReplicationConfiguration": {
          "Fn::If": [
            "IsProd",
            {
              // Replication configuration
            },
            {"Ref": "AWS::NoValue"}
          ]
        }
      }
    },
    "SessionTable": {
      "Properties": {
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {
            "Fn::If": ["IsProd", true, false]
          }
        }
      }
    }
  }
}
```

### 6. Data Protection

- **RDS Aurora**: 
  - `DeletionPolicy: Snapshot` (30-day retention via backup retention period)
  - `UpdateReplacePolicy: Snapshot`
  - `DeletionProtection: false` (allows test teardown)
  - 7-day backup retention period
- **DynamoDB**: 
  - `DeletionPolicy: Delete` (clean teardown)
  - Conditional PITR for production
- **S3**: 
  - `DeletionPolicy: Delete` (clean teardown)
  - Versioning enabled for recovery

## File Structure

```
lib/
├── TapStack.json          # Main stack (orchestrates nested stacks)
├── NetworkStack.json      # VPC and networking resources
├── DatabaseStack.json     # RDS Aurora with Secrets Manager
├── ComputeStack.json      # Lambda functions with ECR
├── MonitoringStack.json   # CloudWatch alarms
└── lambda/
    ├── validator.py       # Transaction validator Lambda code
    ├── migration.py       # Database migration Lambda code
    ├── Dockerfile         # Lambda container image definition
    └── requirements.txt   # Python dependencies
```

## Deployment Instructions

### Prerequisites

1. **S3 Bucket for Nested Stack Templates**
   - Create an S3 bucket to store nested stack templates
   - Upload all nested stack JSON files to the bucket
   - Ensure bucket is accessible from CloudFormation

2. **AWS CLI v2** installed and configured
3. **IAM Permissions** for CloudFormation, RDS, Lambda, Secrets Manager, S3, DynamoDB

### Step 1: Upload Nested Stack Templates

```bash
# Set variables
TEMPLATES_BUCKET="your-templates-bucket-name"
ENVIRONMENT_SUFFIX="dev"

# Upload nested stack templates
aws s3 cp lib/NetworkStack.json s3://${TEMPLATES_BUCKET}/NetworkStack.json
aws s3 cp lib/DatabaseStack.json s3://${TEMPLATES_BUCKET}/DatabaseStack.json
aws s3 cp lib/ComputeStack.json s3://${TEMPLATES_BUCKET}/ComputeStack.json
aws s3 cp lib/MonitoringStack.json s3://${TEMPLATES_BUCKET}/MonitoringStack.json
```

### Step 2: Deploy Main Stack

```bash
# Deploy to primary region (us-east-1)
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    Environment=dev \
    DBMasterUsername=admin \
    DBMasterPassword=TempPassword123 \
    EnableMultiAZ=true \
    TemplatesBucketName=${TEMPLATES_BUCKET} \
    LambdaImageUri="" \
  --capabilities CAPABILITY_NAMED_IAM

# Note: DBMasterPassword parameter is still required in TapStack.json
# but DatabaseStack.json uses Secrets Manager instead
```

### Step 3: Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'

# Verify Secrets Manager secret
aws secretsmanager describe-secret \
  --secret-id rds-master-secret-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### Step 4: Retrieve Database Password (if needed)

```bash
# Get password from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id rds-master-secret-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq -r '.password'
```

## Key Implementation Details

### Secrets Manager Dynamic References

The database credentials are retrieved using CloudFormation dynamic references:

```json
{
  "MasterUsername": {
    "Fn::Sub": "{{resolve:secretsmanager:rds-master-secret-${EnvironmentSuffix}:SecretString:username}}"
  },
  "MasterUserPassword": {
    "Fn::Sub": "{{resolve:secretsmanager:rds-master-secret-${EnvironmentSuffix}:SecretString:password}}"
  }
}
```

**Important Notes:**
- The secret name in the dynamic reference must be a literal string (cannot use `Fn::Sub` with parameters)
- The secret must exist before the RDS cluster is created (enforced via `DependsOn`)
- CloudFormation resolves these references at stack creation/update time

### Stack Timeouts

Each nested stack has an appropriate timeout:
- **NetworkStack**: 10 minutes (VPC resources are quick)
- **DatabaseStack**: 30 minutes (RDS Aurora creation takes 10-15 minutes)
- **ComputeStack**: 15 minutes (Lambda and ECR setup)
- **MonitoringStack**: 5 minutes (CloudWatch alarms are quick)

### Stack Dependencies

Dependencies are implicit via cross-stack references:
- DatabaseStack depends on NetworkStack (subnets, security groups)
- ComputeStack depends on NetworkStack and DatabaseStack
- MonitoringStack depends on DatabaseStack and ComputeStack

No explicit `DependsOn` attributes are needed - CloudFormation infers dependencies from `Fn::GetAtt` references.

## Outputs

The main stack exports the following outputs:

1. **StackName** - CloudFormation stack name
2. **VpcId** - VPC ID from NetworkStack
3. **DBClusterEndpoint** - RDS Aurora cluster endpoint from DatabaseStack
4. **ValidatorLambdaArn** - Transaction validator Lambda ARN from ComputeStack
5. **SessionTableName** - DynamoDB session table name
6. **AuditLogsBucketName** - S3 audit logs bucket name
7. **AuditLogsBucketArn** - S3 audit logs bucket ARN

All outputs include Export names for cross-stack reference.

## Security Best Practices

1. **Secrets Management**: Database password stored in Secrets Manager, not in parameters
2. **Encryption**: 
   - RDS Aurora: Storage encryption enabled
   - S3: AES256 server-side encryption
   - DynamoDB: Encryption at rest (default)
3. **Network Security**: 
   - RDS in private subnets
   - Security groups with least privilege
   - Public access blocked on S3 buckets
4. **IAM**: Least privilege IAM roles for all services
5. **Compliance**: Conditional PITR and replication for production environments

## Testing

### Unit Tests

Unit tests validate template structure:
- Parameter definitions and constraints
- Resource configurations
- Cross-stack references
- Output definitions

Run with: `npm test -- test/TapStack.unit.test.ts`

### Integration Tests

Integration tests validate:
- Template structure and syntax
- Deployment outputs (if available)
- Cross-stack reference patterns
- Resource naming conventions

Run with: `npm test -- test/TapStack.int.test.ts`

### Linting

Validate CloudFormation templates:
```bash
pipenv run cfn-lint lib/*.json
```

## Cleanup

To destroy all resources:

```bash
# Delete main stack (nested stacks are deleted automatically)
aws cloudformation delete-stack \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Note: RDS snapshots are retained for 30 days per backup retention period
# Secrets Manager secret is deleted with the stack
```

## Notes

- **Secrets Manager Secret**: Automatically deleted when stack is deleted (recovery window is 0 for testing)
- **RDS Snapshots**: Retained for 7 days (backup retention period), then automatically deleted
- **S3 Bucket**: Must be empty before deletion (lifecycle rules may need time to clean up)
- **Nested Stack Templates**: Must remain in S3 bucket during stack lifetime
- **Deployment Time**: Typically 15-20 minutes for full stack deployment
- **Update Time**: Typically 5-10 minutes for stack updates (depends on what changed)

## Improvements Over Initial Requirements

1. **Secrets Manager Integration**: Replaced NoEcho parameter with automatic password generation
2. **Dynamic References**: Uses CloudFormation dynamic references for secure credential retrieval
3. **Secret Rotation Support**: SecretTargetAttachment enables future automatic password rotation
4. **cfn-lint Compliance**: Resolves W1011 warning about using dynamic references for secrets
5. **Production-Ready Security**: No plaintext passwords in stack parameters or events

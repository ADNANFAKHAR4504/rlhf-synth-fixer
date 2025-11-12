# Multi-Environment Payment Processing Infrastructure

Complete CloudFormation JSON implementation for deploying payment processing infrastructure across dev, staging, and production environments with proper parameterization, environment-specific sizing, and security best practices.

## File: lib/payment-stack.json

This CloudFormation template provides:
- **Multi-environment support**: Single template for dev, staging, and prod
- **RDS PostgreSQL**: Environment-specific sizing and Multi-AZ configuration
- **Application Load Balancer**: Internet-facing ALB with health checks
- **Auto Scaling**: EC2 instances with environment-based capacity
- **S3 Storage**: Encrypted static content bucket with versioning
- **Secrets Management**: Database passwords stored in Secrets Manager
- **Monitoring**: CloudWatch alarms for RDS CPU utilization
- **Security**: Encryption, private subnets for RDS, security group restrictions

### Template Structure

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment payment processing infrastructure with RDS, ALB, Auto Scaling, and S3",
  "Parameters": { ... },
  "Mappings": { ... },
  "Conditions": { ... },
  "Resources": { ... },
  "Outputs": { ... }
}
```

### Key Features

#### 1. Environment Parameterization
```json
"Parameters": {
  "Environment": {
    "Type": "String",
    "AllowedValues": ["dev", "staging", "prod"]
  },
  "EnvironmentSuffix": {
    "Type": "String",
    "MinLength": 3,
    "MaxLength": 10
  }
}
```

#### 2. Environment-Specific Configuration
```json
"Mappings": {
  "EnvironmentConfig": {
    "dev": {
      "RDSInstanceClass": "db.t3.micro",
      "BackupRetentionDays": 1,
      "MultiAZ": "false"
    },
    "prod": {
      "RDSInstanceClass": "db.t3.medium",
      "BackupRetentionDays": 30,
      "MultiAZ": "true"
    }
  }
}
```

#### 3. Conditional Resources
```json
"Conditions": {
  "IsMultiAZ": {
    "Fn::Or": [
      {"Fn::Equals": [{"Ref": "Environment"}, "staging"]},
      {"Fn::Equals": [{"Ref": "Environment"}, "prod"]}
    ]
  }
}
```

### Resources Deployed

1. **Secrets Manager Secret** (`DBPassword`): Auto-generated database password
2. **RDS Subnet Group** (`DBSubnetGroup`): 3 private subnets
3. **RDS Security Group** (`DBSecurityGroup`): Restricts access to EC2 instances only
4. **RDS PostgreSQL Instance** (`RDSInstance`): PostgreSQL 15.8 with encryption
5. **CloudWatch Alarm** (`RDSCPUAlarm`): CPU monitoring with environment-specific thresholds
6. **S3 Bucket** (`StaticContentBucket`): Encrypted with versioning
7. **ALB Security Group** (`ALBSecurityGroup`): HTTP/HTTPS ingress
8. **EC2 Security Group** (`EC2SecurityGroup`): Traffic from ALB only
9. **Application Load Balancer** (`ApplicationLoadBalancer`): Internet-facing
10. **Target Group** (`ALBTargetGroup`): Health checks at /health
11. **ALB Listener** (`ALBListener`): HTTP port 80
12. **IAM Role** (`InstanceRole`): S3 and Secrets Manager access
13. **Instance Profile** (`InstanceProfile`): Attached to EC2 instances
14. **Launch Template** (`LaunchTemplate`): Amazon Linux 2 with httpd
15. **Auto Scaling Group** (`AutoScalingGroup`): Environment-based capacity
16. **Scaling Policy** (`ScaleUpPolicy`): CPU-based target tracking

### Deployment

#### Prerequisites
- Existing VPC with 3 public and 3 private subnets across 3 AZs
- EC2 Key Pair for SSH access
- S3 bucket for CloudFormation templates

#### Parameter Files

**lib/parameters-dev.json**:
```json
[
  {"ParameterKey": "Environment", "ParameterValue": "dev"},
  {"ParameterKey": "EnvironmentSuffix", "ParameterValue": "s907"},
  {"ParameterKey": "VpcId", "ParameterValue": "vpc-xxxxx"},
  {"ParameterKey": "PrivateSubnet1", "ParameterValue": "subnet-xxxxx"},
  {"ParameterKey": "PrivateSubnet2", "ParameterValue": "subnet-yyyyy"},
  {"ParameterKey": "PrivateSubnet3", "ParameterValue": "subnet-zzzzz"},
  {"ParameterKey": "PublicSubnet1", "ParameterValue": "subnet-aaaaa"},
  {"ParameterKey": "PublicSubnet2", "ParameterValue": "subnet-bbbbb"},
  {"ParameterKey": "PublicSubnet3", "ParameterValue": "subnet-ccccc"},
  {"ParameterKey": "KeyPairName", "ParameterValue": "my-keypair"}
]
```

#### Deploy Command
```bash
aws cloudformation deploy \
  --template-file lib/payment-stack.json \
  --stack-name PaymentStack<suffix> \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides file://lib/parameters-dev.json \
  --tags Repository=iac-test-automations \
  --s3-bucket iac-rlhf-cfn-states-us-east-1-<account-id> \
  --s3-prefix <suffix> \
  --region us-east-1
```

### Stack Outputs

The template exports the following outputs for cross-stack references:

- **RDSEndpoint**: Database connection endpoint
- **RDSPort**: Database port (5432)
- **LoadBalancerDNS**: ALB DNS name for HTTP access
- **LoadBalancerArn**: ALB ARN for additional configuration
- **S3BucketName**: Static content bucket name
- **DBSecretArn**: Secrets Manager ARN for database password

### Security Features

1. **Encryption at Rest**:
   - RDS storage encryption enabled
   - S3 bucket encryption with AES256

2. **Network Isolation**:
   - RDS in private subnets
   - Security group restricts database access to application tier only
   - ALB in public subnets, instances in private subnets

3. **Secrets Management**:
   - Database passwords in Secrets Manager, not hardcoded
   - IAM role grants EC2 instances access to secrets

4. **No Deletion Protection**:
   - All resources can be destroyed (no Retain policies)
   - RDS DeletionProtection set to false for testing

### Environment Differences

| Feature | Dev | Staging | Production |
|---------|-----|---------|------------|
| RDS Instance | db.t3.micro | db.t3.small | db.t3.medium |
| RDS Multi-AZ | No | Yes | Yes |
| Backup Retention | 1 day | 7 days | 30 days |
| EC2 Instance | t3.micro | t3.small | t3.medium |
| ASG Min/Max | 1/2 | 2/4 | 3/10 |
| S3 Versioning | Suspended | Enabled | Enabled |
| CPU Alarm Threshold | 80% | 70% | 60% |

### Testing

#### Unit Tests
```bash
npm run test:unit
```
Validates template structure, parameters, mappings, conditions, resources, and outputs.

#### Integration Tests
```bash
npm run test:integration
```
Validates deployed resources:
- RDS instance status and configuration
- ALB and target group health
- S3 bucket encryption and versioning
- Auto Scaling Group capacity
- CloudWatch alarms
- Resource tagging
- End-to-end connectivity

### Cleanup

```bash
aws cloudformation delete-stack --stack-name PaymentStack<suffix> --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name PaymentStack<suffix> --region us-east-1
```

## Success Criteria Met

✅ **Single template for all environments**: Parameters and conditions control environment-specific resources
✅ **Environment-specific sizing**: Mappings define RDS/EC2 instance types per environment
✅ **Multi-AZ control**: Conditions enable Multi-AZ only for staging/prod
✅ **Backup retention**: 1/7/30 days for dev/staging/prod
✅ **Security**: Encryption, Secrets Manager, network isolation
✅ **Resource naming**: All names include environmentSuffix
✅ **Tagging**: Environment, Project, ManagedBy tags on all resources
✅ **Monitoring**: CloudWatch alarms with environment-specific thresholds
✅ **Destroyable**: No Retain policies or DeletionProtection
✅ **Cross-stack integration**: Exported outputs for downstream stacks

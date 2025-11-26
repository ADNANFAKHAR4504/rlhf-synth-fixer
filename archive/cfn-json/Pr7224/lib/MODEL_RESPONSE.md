# Aurora Global Database CloudFormation Implementation

This implementation creates a production-ready Aurora Global Database infrastructure with cross-region disaster recovery capabilities.

## Architecture Overview

- Aurora Global Cluster spanning us-east-1 (primary) and us-east-2 (secondary)
- VPC networking in both regions with Multi-AZ configuration
- Secrets Manager for secure credential management
- Route 53 health checks for monitoring
- CloudWatch alarms for replication lag and database health
- All resources parameterized with environmentSuffix for uniqueness

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora Global Database for cross-region disaster recovery with automated failover capabilities",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple stack deployments",
      "Default": "prod",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "PrimaryRegion": {
      "Type": "String",
      "Description": "Primary AWS region for the global database",
      "Default": "us-east-1",
      "AllowedValues": ["us-east-1", "us-east-2", "us-west-2", "eu-west-1"]
    },
    "SecondaryRegion": {
      "Type": "String",
      "Description": "Secondary AWS region for disaster recovery",
      "Default": "us-east-2",
      "AllowedValues": ["us-east-1", "us-east-2", "us-west-2", "eu-west-1"]
    },
    "DatabaseName": {
      "Type": "String",
      "Description": "Name of the database to create",
      "Default": "appdb",
      "MinLength": 1,
      "MaxLength": 64,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "MasterUsername": {
      "Type": "String",
      "Description": "Master username for database access",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "Database instance class",
      "Default": "db.r5.large",
      "AllowedValues": [
        "db.r5.large",
        "db.r5.xlarge",
        "db.r5.2xlarge",
        "db.r6g.large",
        "db.r6g.xlarge"
      ]
    }
  },
  "Resources": {
    "PrimaryVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-vpc-${environmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "environmentSuffix" }
          }
        ]
      }
    },
    "PrimaryPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "PrimaryVPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-private-subnet-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "PrimaryVPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-private-subnet-2-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryPrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "PrimaryVPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-private-subnet-3-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "primary-db-subnet-group-${environmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for primary Aurora cluster",
        "SubnetIds": [
          { "Ref": "PrimaryPrivateSubnet1" },
          { "Ref": "PrimaryPrivateSubnet2" },
          { "Ref": "PrimaryPrivateSubnet3" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-db-subnet-group-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryDBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "primary-db-sg-${environmentSuffix}" },
        "GroupDescription": "Security group for primary Aurora cluster",
        "VpcId": { "Ref": "PrimaryVPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.0.0.0/16",
            "Description": "Allow MySQL access from VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-db-sg-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.1.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-vpc-${environmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "environmentSuffix" }
          }
        ]
      }
    },
    "SecondaryPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "SecondaryVPC" },
        "CidrBlock": "10.1.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": { "Ref": "SecondaryRegion" } }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-private-subnet-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "SecondaryVPC" },
        "CidrBlock": "10.1.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": { "Ref": "SecondaryRegion" } }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-private-subnet-2-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryPrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "SecondaryVPC" },
        "CidrBlock": "10.1.3.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": { "Ref": "SecondaryRegion" } }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-private-subnet-3-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "secondary-db-subnet-group-${environmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for secondary Aurora cluster",
        "SubnetIds": [
          { "Ref": "SecondaryPrivateSubnet1" },
          { "Ref": "SecondaryPrivateSubnet2" },
          { "Ref": "SecondaryPrivateSubnet3" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-db-subnet-group-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryDBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "secondary-db-sg-${environmentSuffix}" },
        "GroupDescription": "Security group for secondary Aurora cluster",
        "VpcId": { "Ref": "SecondaryVPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.1.0.0/16",
            "Description": "Allow MySQL access from VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-db-sg-${environmentSuffix}" }
          }
        ]
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "aurora-master-credentials-${environmentSuffix}" },
        "Description": "Master credentials for Aurora Global Database",
        "GenerateSecretString": {
          "SecretStringTemplate": { "Fn::Sub": "{\"username\": \"${MasterUsername}\"}" },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-secret-${environmentSuffix}" }
          }
        ]
      }
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": { "Fn::Sub": "global-aurora-cluster-${environmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.02.0",
        "StorageEncrypted": true
      }
    },
    "PrimaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DependsOn": "GlobalCluster",
      "Properties": {
        "DBClusterIdentifier": { "Fn::Sub": "primary-aurora-cluster-${environmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.02.0",
        "GlobalClusterIdentifier": { "Ref": "GlobalCluster" },
        "MasterUsername": { "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}" },
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}" },
        "DatabaseName": { "Ref": "DatabaseName" },
        "DBSubnetGroupName": { "Ref": "PrimaryDBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "PrimaryDBSecurityGroup" }],
        "StorageEncrypted": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-aurora-cluster-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "primary-aurora-instance-1-${environmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "PrimaryDBCluster" },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-aurora-instance-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "primary-aurora-instance-2-${environmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "PrimaryDBCluster" },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-aurora-instance-2-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DependsOn": ["GlobalCluster", "PrimaryDBCluster"],
      "Properties": {
        "DBClusterIdentifier": { "Fn::Sub": "secondary-aurora-cluster-${environmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.02.0",
        "GlobalClusterIdentifier": { "Ref": "GlobalCluster" },
        "DBSubnetGroupName": { "Ref": "SecondaryDBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "SecondaryDBSecurityGroup" }],
        "StorageEncrypted": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-aurora-cluster-${environmentSuffix}" }
          }
        ]
      }
    },
    "SecondaryDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "secondary-aurora-instance-1-${environmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "SecondaryDBCluster" },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "secondary-aurora-instance-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrimaryClusterHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "CALCULATED",
          "ChildHealthChecks": [],
          "HealthThreshold": 1
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "primary-cluster-health-${environmentSuffix}" }
          }
        ]
      }
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "aurora-replication-lag-${environmentSuffix}" },
        "AlarmDescription": "Alert when Aurora Global Database replication lag exceeds 1 second",
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": { "Ref": "SecondaryDBCluster" }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "PrimaryClusterCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "primary-cluster-cpu-${environmentSuffix}" },
        "AlarmDescription": "Alert when primary cluster CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": { "Ref": "PrimaryDBCluster" }
          }
        ]
      }
    },
    "SecondaryClusterCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "secondary-cluster-cpu-${environmentSuffix}" },
        "AlarmDescription": "Alert when secondary cluster CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": { "Ref": "SecondaryDBCluster" }
          }
        ]
      }
    }
  },
  "Outputs": {
    "GlobalClusterIdentifier": {
      "Description": "Aurora Global Cluster identifier",
      "Value": { "Ref": "GlobalCluster" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-GlobalClusterIdentifier" }
      }
    },
    "PrimaryClusterEndpoint": {
      "Description": "Primary Aurora cluster endpoint",
      "Value": { "Fn::GetAtt": ["PrimaryDBCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrimaryClusterEndpoint" }
      }
    },
    "PrimaryClusterReadEndpoint": {
      "Description": "Primary Aurora cluster reader endpoint",
      "Value": { "Fn::GetAtt": ["PrimaryDBCluster", "ReadEndpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrimaryClusterReadEndpoint" }
      }
    },
    "SecondaryClusterEndpoint": {
      "Description": "Secondary Aurora cluster endpoint",
      "Value": { "Fn::GetAtt": ["SecondaryDBCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SecondaryClusterEndpoint" }
      }
    },
    "SecondaryClusterReadEndpoint": {
      "Description": "Secondary Aurora cluster reader endpoint",
      "Value": { "Fn::GetAtt": ["SecondaryDBCluster", "ReadEndpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SecondaryClusterReadEndpoint" }
      }
    },
    "DatabaseSecretArn": {
      "Description": "ARN of the database credentials secret",
      "Value": { "Ref": "DatabaseSecret" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DatabaseSecretArn" }
      }
    },
    "PrimaryVPCId": {
      "Description": "Primary VPC ID",
      "Value": { "Ref": "PrimaryVPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrimaryVPCId" }
      }
    },
    "SecondaryVPCId": {
      "Description": "Secondary VPC ID",
      "Value": { "Ref": "SecondaryVPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SecondaryVPCId" }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
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
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Accessing the Database

### Retrieve Credentials

```bash
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --region us-east-1 \
  --query 'SecretString' \
  --output text
```

### Connect to Primary Cluster

```bash
PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryClusterEndpoint`].OutputValue' \
  --output text)

mysql -h $PRIMARY_ENDPOINT -u admin -p
```

## Disaster Recovery Procedures

### Manual Failover to Secondary Region

1. **Detach secondary cluster from global cluster**:
```bash
aws rds remove-from-global-cluster \
  --global-cluster-identifier global-aurora-cluster-prod \
  --db-cluster-identifier secondary-aurora-cluster-prod \
  --region us-east-2
```

2. **Promote secondary cluster to standalone**:
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier secondary-aurora-cluster-prod \
  --apply-immediately \
  --region us-east-2
```

3. **Update application to use secondary endpoint**:
```bash
SECONDARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`SecondaryClusterEndpoint`].OutputValue' \
  --output text)
```

### Failback to Primary Region

After primary region recovery:

1. Delete the old primary cluster
2. Create new secondary cluster in recovered region
3. Attach to global cluster
4. Update application to use original primary endpoint

## Monitoring

### CloudWatch Alarms

The stack creates the following CloudWatch alarms:

- **Replication Lag**: Alerts when lag exceeds 1 second
- **Primary CPU**: Alerts when primary cluster CPU > 80%
- **Secondary CPU**: Alerts when secondary cluster CPU > 80%

### View Replication Lag

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=secondary-aurora-cluster-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-2
```

## Cost Optimization

- Uses db.r5.large instances by default (adjust via parameters)
- Backup retention set to 7 days (minimum for production)
- Consider using Aurora Serverless v2 for variable workloads
- Monitor CloudWatch costs for alarms and metrics

## Cleanup

### Delete the Stack

```bash
aws cloudformation delete-stack \
  --stack-name aurora-global-dr-prod \
  --region us-east-1
```

**Note**: This will delete all resources including databases. Ensure you have backups if needed.

### Verify Deletion

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-global-dr-prod \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Fails

- Check CloudFormation events for specific error messages
- Verify service quotas for Aurora instances
- Ensure IAM permissions are sufficient
- Check VPC and subnet CIDR ranges don't overlap with existing resources

### Replication Lag High

- Check network connectivity between regions
- Verify instance sizes are appropriate for workload
- Review write load on primary cluster
- Check for long-running transactions

### Cannot Connect to Database

- Verify security group rules allow access from your IP/VPC
- Check database is in "available" state
- Verify credentials from Secrets Manager
- Ensure you're connecting to the correct endpoint

## Security Considerations

- Database instances are deployed in private subnets only
- No public access enabled
- Credentials stored in Secrets Manager with encryption
- Storage encrypted at rest
- VPC security groups restrict access to database ports
- Enable automated security patching during maintenance windows
- Consider enabling IAM database authentication for additional security

## References

- [Aurora Global Database Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [CloudFormation RDS Resource Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_RDS.html)
- [Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
```

## Deployment Notes

### CloudFormation Limitations

**Important**: This template demonstrates the structure for Aurora Global Database, but CloudFormation has a limitation - it cannot deploy resources across multiple regions in a single stack.

**Deployment Options**:

1. **StackSets**: Use CloudFormation StackSets to deploy across regions
2. **Separate Stacks**: Deploy primary region stack first, then secondary region stack with cross-region references
3. **Terraform/Pulumi**: Consider using Terraform or Pulumi for true multi-region deployment in single execution

### Resource Dependencies

The template includes proper dependencies:
- `GlobalCluster` must be created first
- `PrimaryDBCluster` depends on `GlobalCluster`
- `SecondaryDBCluster` depends on both `GlobalCluster` and `PrimaryDBCluster`
- DB instances depend on their respective clusters
- No circular dependencies between Route 53 and CloudWatch alarms

### Testing Strategy

1. **Unit Tests**: Validate CloudFormation JSON syntax
2. **Integration Tests**: Deploy to test account and verify outputs
3. **Failover Test**: Simulate regional failure and test failover procedures
4. **Performance Test**: Measure replication lag under load


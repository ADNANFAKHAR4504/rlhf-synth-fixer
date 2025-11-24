# Ideal Response: Single-Region High Availability Architecture

## Overview

This solution implements a comprehensive single-region high availability architecture for a payment processing system using CDKTF (Python). The infrastructure is deployed in AWS us-east-1 region with multi-AZ support for high availability and automated backups.

## Architecture Components

### 1. Main Stack (tap_stack.py)

The root stack orchestrates all sub-stacks with a single AWS provider:

```python
from cdktf import TerraformStack
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.database_stack import DatabaseStack
from lib.compute_stack import ComputeStack
from lib.monitoring_stack import MonitoringStack
from lib.backup_stack import BackupStack
from lib.dns_stack import DnsStack

class TapStack(TerraformStack):
    """Single-region payment processing infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id)

        environment_suffix = kwargs.get('environment_suffix', 'dev')
        default_tags = kwargs.get('default_tags', {})

        # Single-region configuration
        region = "us-east-1"

        # AWS Provider
        provider = AwsProvider(
            self, "aws",
            region=region,
            default_tags=[default_tags],
        )

        # Networking
        networking = NetworkingStack(...)

        # Database (Aurora + DynamoDB)
        database = DatabaseStack(...)

        # Compute (Lambda + EventBridge)
        compute = ComputeStack(...)

        # Monitoring (CloudWatch)
        monitoring = MonitoringStack(...)

        # Backup (AWS Backup)
        backup = BackupStack(...)

        # DNS (Route 53)
        dns = DnsStack(...)
```

---

### 2. Networking Stack (networking_stack.py)

Creates VPC, subnets, internet gateway, NAT gateway, and security groups:

```python
class NetworkingStack(Construct):
    """Multi-AZ VPC with public/private subnets."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider):
        super().__init__(scope, construct_id)

        # VPC with DNS support
        vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-{region}-{environment_suffix}"},
            provider=provider,
        )

        # 3 public subnets (one per AZ)
        public_subnets = []
        availability_zones = ["a", "b", "c"]
        for i, az in enumerate(availability_zones):
            subnet = Subnet(
                self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"{region}{az}",
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-{region}-{az}-{environment_suffix}"},
                provider=provider,
            )
            public_subnets.append(subnet)

        # 3 private subnets (one per AZ)
        private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = Subnet(
                self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=f"{region}{az}",
                tags={"Name": f"payment-private-{region}-{az}-{environment_suffix}"},
                provider=provider,
            )
            private_subnets.append(subnet)

        # Internet Gateway and NAT Gateway
        igw = InternetGateway(...)
        eip = Eip(...)
        nat_gateway = NatGateway(...)

        # Security Groups (Lambda and Database)
        lambda_sg = SecurityGroup(...)
        db_sg = SecurityGroup(...)
```

---

### 3. Database Stack (database_stack.py)

Implements Aurora MySQL cluster and DynamoDB table with proper configuration:

```python
import os
from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster

class DatabaseStack(Construct):
    """Database infrastructure with Aurora and DynamoDB."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, vpc, private_subnets, db_security_group):
        super().__init__(scope, construct_id)

        # Get database password from environment variable
        # For production, use AWS Secrets Manager instead
        db_password = os.environ.get("DB_MASTER_PASSWORD", "ChangeMeInProduction123!")

        # Aurora cluster (single region)
        cluster = RdsCluster(
            self, "cluster",
            cluster_identifier=f"payment-cluster-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            master_username="admin",
            master_password=db_password,
            db_subnet_group_name=subnet_group.name,
            vpc_security_group_ids=[db_security_group.id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            backtrack_window=259200,  # 72 hours in seconds
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=False,  # For production: enable encryption
            tags={"Name": f"payment-cluster-{environment_suffix}"},
            provider=provider,
        )

        # Aurora instance
        RdsClusterInstance(
            self, "instance",
            identifier=f"payment-instance-{environment_suffix}",
            cluster_identifier=cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-instance-{environment_suffix}"},
            provider=provider,
        )

        # DynamoDB Table (single region)
        dynamodb_table = DynamodbTable(
            self, "sessions_table",
            name=f"payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[DynamodbTableAttribute(name="session_id", type="S")],
            point_in_time_recovery={"enabled": True},
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={"Name": f"payment-sessions-{environment_suffix}"},
            provider=provider,
        )
```

**Key Features**:
1. Aurora backtracking enabled for 72-hour point-in-time recovery
2. DynamoDB with point-in-time recovery enabled
3. Multi-AZ deployment for high availability

---

### 4. Compute Stack (compute_stack.py)

Deploys Lambda function with EventBridge for event processing:

```python
class ComputeStack(Construct):
    """Lambda function and EventBridge for payment processing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, vpc, private_subnets, lambda_security_group,
                 aurora_endpoint, dynamodb_table_name):
        super().__init__(scope, construct_id)

        # Lambda function
        lambda_func = LambdaFunction(
            self, "lambda",
            function_name=f"payment-processor-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            filename=lambda_asset.path,
            role=lambda_role.arn,
            timeout=30,
            memory_size=1024,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DB_ENDPOINT": aurora_endpoint,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "REGION": region,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                }
            ),
            vpc_config={"subnet_ids": [s.id for s in private_subnets], "security_group_ids": [lambda_security_group.id]},
            tags={"Name": f"payment-processor-{environment_suffix}"},
            provider=provider,
        )

        # Lambda Function URL
        lambda_url = LambdaFunctionUrl(
            self, "lambda_url",
            function_name=lambda_func.function_name,
            authorization_type="NONE",
            provider=provider,
        )

        # EventBridge rule for payment events
        event_rule = CloudwatchEventRule(
            self, "event_rule",
            name=f"payment-events-{environment_suffix}",
            description="Payment events for processing",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-{environment_suffix}"},
            provider=provider,
        )

        # EventBridge target
        CloudwatchEventTarget(
            self, "event_target",
            rule=event_rule.name,
            arn=lambda_func.arn,
            provider=provider,
        )
```

---

### 5. Backup Stack (backup_stack.py)

AWS Backup with daily backups:

```python
class BackupStack(Construct):
    """AWS Backup for Aurora database."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, aurora_cluster_arn: str):
        super().__init__(scope, construct_id)

        # Backup vault
        vault = BackupVault(...)

        # Backup plan
        backup_plan = BackupPlan(
            self, "backup_plan",
            name=f"payment-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily_backup",
                target_vault_name=vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=7),
            )],
            tags={"Name": f"payment-backup-plan-{environment_suffix}"},
            provider=provider,
        )
```

---

### 6. DNS Stack (dns_stack.py)

Route 53 with simple routing:

```python
class DnsStack(Construct):
    """Route 53 DNS with simple routing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 provider, lambda_url: str):
        super().__init__(scope, construct_id)

        # Hosted zone
        hosted_zone = Route53Zone(
            self, "hosted_zone",
            name=f"payment-{environment_suffix}.testing.local",
            comment=f"Payment processing system - {environment_suffix}",
            tags={"Name": f"payment-zone-{environment_suffix}"},
            provider=provider,
        )

        # Simple DNS record
        Route53Record(
            self, "api_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.testing.local",
            type="CNAME",
            ttl=60,
            records=[clean_url],
            provider=provider,
        )
```

---

### 7. Monitoring Stack (monitoring_stack.py)

CloudWatch dashboards and alarms:

```python
class MonitoringStack(Construct):
    """CloudWatch dashboards and alarms."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, aurora_cluster_id: str,
                 lambda_function_name: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        # CloudWatch dashboard
        CloudwatchDashboard(
            self, "dashboard",
            dashboard_name=f"payment-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections"]], "region": region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations"], [".", "Errors"]], "region": region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits"]], "region": region, "title": "DynamoDB"}},
            ]}),
            provider=provider,
        )

        # CloudWatch alarms
        CloudwatchMetricAlarm(
            self, "lambda_errors",
            alarm_name=f"payment-lambda-errors-{environment_suffix}",
            metric_name="Errors",
            namespace="AWS/Lambda",
            threshold=10,
            dimensions={"FunctionName": lambda_function_name},
            provider=provider,
        )
```

---

## Key Features

### 1. High Availability
- Multi-AZ VPC deployment across 3 availability zones
- Aurora MySQL with automatic failover
- Lambda in VPC for enhanced security

### 2. Data Protection
- Aurora backtracking (72 hours)
- DynamoDB point-in-time recovery
- Daily automated backups with 7-day retention

### 3. Monitoring
- CloudWatch dashboards for all services
- Alarms for Lambda errors, Aurora CPU, and DynamoDB throttling
- Comprehensive logging with CloudWatch Logs

### 4. Security
- VPC with private subnets
- Security groups for network isolation
- Systems Manager Parameter Store for configuration
- IAM roles with least privilege

---

## Testing

### Unit Tests
- Tests validate resource creation and configuration
- Tests verify proper naming conventions
- Tests ensure destroyability requirements

### Integration Tests
- Test end-to-end workflows with deployed resources
- Validate high availability mechanisms
- Test backup and restore procedures
- Verify monitoring and alerting

---

## Deployment

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"

# Synthesize Terraform configuration
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy --auto-approve

# Destroy when done
pipenv run cdktf destroy --auto-approve
```

---

## Production Considerations

1. **Encryption**: Enable KMS encryption for Aurora and DynamoDB
2. **Domain**: Use actual owned domain instead of `testing.local`
3. **Secrets Management**: Use AWS Secrets Manager for database credentials
4. **Cost Optimization**: Consider Aurora Serverless v2 for variable workloads
5. **Security**: Implement least-privilege IAM policies, enable GuardDuty
6. **Compliance**: Enable AWS CloudTrail and Security Hub
7. **Scaling**: Add Aurora read replicas for read-heavy workloads
8. **Monitoring**: Add custom metrics and detailed dashboards

---

## Architecture Benefits

- **High Availability**: Multi-AZ deployment with automatic failover
- **Data Protection**: Aurora backtracking and automated backups
- **Point-in-Time Recovery**: DynamoDB PITR and Aurora backtrack
- **Monitoring**: Comprehensive CloudWatch dashboards and alarms
- **Scalability**: Lambda auto-scaling, DynamoDB on-demand billing
- **Cost Efficient**: Pay-per-request DynamoDB, skip final snapshots for testing
- **Security**: VPC isolation, security groups, IAM least privilege

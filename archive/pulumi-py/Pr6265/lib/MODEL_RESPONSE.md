# Multi-Region Disaster Recovery Trading Platform - MODEL RESPONSE (With Bugs)

This document contains a simulated LLM response with realistic bugs and issues that would need to be caught during QA testing.

## Overview

I'll help you create a multi-region disaster recovery infrastructure for a trading platform using **Pulumi with Python**. This will span us-east-1 (primary) and us-east-2 (secondary) regions with automated failover capabilities.

## Bug Summary

This implementation contains 15+ realistic bugs across various categories:
1. **Configuration Errors**: Wrong regions, missing parameters
2. **Resource Dependencies**: Missing or incorrect dependency chains
3. **IAM Permissions**: Insufficient or incorrect policies
4. **Naming Issues**: Missing environment_suffix in some resources
5. **Integration Problems**: Incorrect service integrations
6. **Security Issues**: Missing encryption, overly permissive policies
7. **Monitoring Gaps**: Incomplete alarm configurations
8. **Replication Errors**: Incorrect cross-region setup

---

## File: lib/tap_stack.py (BUGGY VERSION)

```python
"""
Main Pulumi stack for multi-region disaster recovery trading platform.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions

from infrastructure.route53_stack import Route53Stack
from infrastructure.aurora_stack import AuroraStack
from infrastructure.lambda_stack import LambdaStack
from infrastructure.dynamodb_stack import DynamoDBStack
from infrastructure.s3_stack import S3Stack
from infrastructure.api_gateway_stack import ApiGatewayStack
from infrastructure.monitoring_stack import MonitoringStack
from infrastructure.failover_stack import FailoverStack
from infrastructure.sns_stack import SnsStack
from infrastructure.synthetics_stack import SyntheticsStack


class TapStackArgs:
    """Arguments for the TapStack component."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-east-2",
        domain_name: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.domain_name = domain_name


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for multi-region disaster recovery trading platform.

    BUG #1: Missing proper dependency chain - components created in wrong order
    BUG #2: No error handling for missing outputs
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.primary_region = args.primary_region
        self.secondary_region = args.secondary_region

        # BUG #1: Creating Aurora BEFORE SNS, but Aurora monitoring needs SNS
        # CORRECT: SNS should be created first
        self.aurora_stack = AuroraStack(
            f"aurora-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS created after Aurora - will cause issues with monitoring
        self.sns_stack = SnsStack(
            f"sns-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB stack
        self.dynamodb_stack = DynamoDBStack(
            f"dynamodb-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # S3 stack
        self.s3_stack = S3Stack(
            f"s3-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # BUG #2: Lambda stack missing depends_on for Aurora and DynamoDB
        # Lambda needs these to exist first for environment variables
        self.lambda_stack = LambdaStack(
            f"lambda-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_endpoint=self.aurora_stack.primary_endpoint,
            dynamodb_table_name=self.dynamodb_stack.table_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)  # Missing depends_on!
        )

        # API Gateway stack
        self.api_gateway_stack = ApiGatewayStack(
            f"api-gateway-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            primary_lambda_arn=self.lambda_stack.primary_function_arn,
            secondary_lambda_arn=self.lambda_stack.secondary_function_arn,
            domain_name=args.domain_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_stack])
        )

        # Route 53 stack
        self.route53_stack = Route53Stack(
            f"route53-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_endpoint=self.api_gateway_stack.primary_api_endpoint,
            secondary_endpoint=self.api_gateway_stack.secondary_api_endpoint,
            domain_name=args.domain_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_gateway_stack])
        )

        # Monitoring stack
        self.monitoring_stack = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_cluster_id=self.aurora_stack.primary_cluster_id,
            lambda_function_name=self.lambda_stack.primary_function_name,
            api_gateway_id=self.api_gateway_stack.primary_api_id,
            sns_topic_arn=self.sns_stack.primary_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)  # BUG #3: Missing depends_on for all resources
        )

        # Synthetics stack
        self.synthetics_stack = SyntheticsStack(
            f"synthetics-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            primary_api_endpoint=self.api_gateway_stack.primary_api_endpoint,
            secondary_api_endpoint=self.api_gateway_stack.secondary_api_endpoint,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_gateway_stack])
        )

        # Failover stack
        self.failover_stack = FailoverStack(
            f"failover-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_global_cluster_id=self.aurora_stack.global_cluster_id,
            secondary_cluster_arn=self.aurora_stack.secondary_cluster_arn,
            route53_health_check_id=self.route53_stack.health_check_id,
            composite_alarm_arn=self.monitoring_stack.composite_alarm_arn,
            sns_topic_arn=self.sns_stack.primary_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.aurora_stack,
                self.route53_stack,
                self.monitoring_stack,
                self.sns_stack
            ])
        )

        # Export outputs
        self.register_outputs({
            'primary_api_endpoint': self.api_gateway_stack.primary_api_endpoint,
            'secondary_api_endpoint': self.api_gateway_stack.secondary_api_endpoint,
            'aurora_primary_endpoint': self.aurora_stack.primary_endpoint,
            'dynamodb_table_name': self.dynamodb_stack.table_name,
            # BUG #4: Missing several important outputs
            # Missing: Aurora secondary endpoint, S3 buckets, SNS topics, failover function
        })
```

## File: lib/infrastructure/route53_stack.py (BUGGY VERSION)

```python
"""
Route 53 DNS failover configuration.
BUG #5: Health check interval set to 60 seconds instead of required 30 seconds
BUG #6: Missing CloudWatch alarm for health check
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class Route53Stack(pulumi.ComponentResource):
    """Route 53 DNS configuration with health checks and failover routing."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_endpoint: Output[str],
        secondary_endpoint: Output[str],
        domain_name: Optional[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:Route53Stack', name, None, opts)

        # Create health check for primary region
        # BUG #5: request_interval should be 30, not 60
        self.health_check = aws.route53.HealthCheck(
            f"trading-health-check-{environment_suffix}",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_endpoint.apply(lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0]),
            port=443,
            request_interval=60,  # WRONG! Should be 30
            failure_threshold=3,
            measure_latency=True,
            tags={**tags, 'Name': f"trading-health-check-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # BUG #6: Missing CloudWatch alarm for health check status
        # Should create alarm to monitor HealthCheckStatus metric

        if domain_name:
            # Create hosted zone
            self.hosted_zone = aws.route53.Zone(
                f"trading-zone-{environment_suffix}",
                name=domain_name,
                tags={**tags, 'Name': f"trading-zone-{environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            # Primary record
            self.primary_record = aws.route53.Record(
                f"trading-primary-record-{environment_suffix}",
                zone_id=self.hosted_zone.zone_id,
                name=f"api.{domain_name}",
                type="CNAME",
                ttl=60,
                records=[primary_endpoint.apply(lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0])],
                set_identifier="primary",
                failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="PRIMARY"
                )],
                health_check_id=self.health_check.id,
                opts=ResourceOptions(parent=self)
            )

            # Secondary record
            self.secondary_record = aws.route53.Record(
                f"trading-secondary-record-{environment_suffix}",
                zone_id=self.hosted_zone.zone_id,
                name=f"api.{domain_name}",
                type="CNAME",
                ttl=60,
                records=[secondary_endpoint.apply(lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0])],
                set_identifier="secondary",
                failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="SECONDARY"
                )],
                opts=ResourceOptions(parent=self)
            )

        self.health_check_id = self.health_check.id

        self.register_outputs({
            'health_check_id': self.health_check.id,
        })
```

## File: lib/infrastructure/aurora_stack.py (BUGGY VERSION)

```python
"""
Aurora PostgreSQL Global Database configuration.
BUG #7: Using wrong engine version
BUG #8: Missing encryption configuration on secondary cluster
BUG #9: Hardcoded password instead of using Secrets Manager
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class AuroraStack(pulumi.ComponentResource):
    """Aurora PostgreSQL Global Database spanning two regions."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:AuroraStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Get VPC and subnets for primary
        primary_vpc = aws.ec2.get_vpc(default=True)
        primary_subnets = aws.ec2.get_subnets(
            filters=[aws.ec2.GetSubnetsFilterArgs(name="vpc-id", values=[primary_vpc.id])]
        )

        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-primary-{environment_suffix}",
            subnet_ids=primary_subnets.ids,
            tags={**tags, 'Name': f"aurora-subnet-group-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-primary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=primary_vpc.id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=["0.0.0.0/0"]  # BUG #10: Too permissive! Should restrict to VPC CIDR
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**tags, 'Name': f"aurora-sg-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # BUG #7: Wrong engine version - using 14.6 instead of 15.4
        self.global_cluster = aws.rds.GlobalCluster(
            f"trading-global-cluster-{environment_suffix}",
            global_cluster_identifier=f"trading-global-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",  # WRONG! Should be 15.4
            database_name="trading",
            storage_encrypted=True,
            opts=ResourceOptions(parent=self)
        )

        # BUG #9: Hardcoded password instead of Secrets Manager
        self.primary_cluster = aws.rds.Cluster(
            f"trading-cluster-primary-{environment_suffix}",
            cluster_identifier=f"trading-cluster-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",  # Must match global cluster
            database_name="trading",
            master_username="admin",
            master_password="insecure123",  # BUG #9: Hardcoded, not secret!
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={**tags, 'Name': f"trading-cluster-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_instance = aws.rds.ClusterInstance(
            f"trading-instance-primary-{environment_suffix}",
            identifier=f"trading-instance-primary-{environment_suffix}",
            cluster_identifier=self.primary_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            engine_version="14.6",
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**tags, 'Name': f"trading-instance-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary region setup
        secondary_vpc = aws.ec2.get_vpc(default=True, opts=pulumi.InvokeOptions(provider=secondary_provider))
        secondary_subnets = aws.ec2.get_subnets(
            filters=[aws.ec2.GetSubnetsFilterArgs(name="vpc-id", values=[secondary_vpc.id])],
            opts=pulumi.InvokeOptions(provider=secondary_provider)
        )

        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-secondary-{environment_suffix}",
            subnet_ids=secondary_subnets.ids,
            tags={**tags, 'Name': f"aurora-subnet-group-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-secondary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=secondary_vpc.id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=["0.0.0.0/0"]  # Same permissive bug
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**tags, 'Name': f"aurora-sg-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # BUG #8: Missing storage_encrypted=True on secondary cluster
        self.secondary_cluster = aws.rds.Cluster(
            f"trading-cluster-secondary-{environment_suffix}",
            cluster_identifier=f"trading-cluster-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            # storage_encrypted=True,  # MISSING!
            backup_retention_period=7,
            tags={**tags, 'Name': f"trading-cluster-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[self.primary_cluster])
        )

        self.secondary_instance = aws.rds.ClusterInstance(
            f"trading-instance-secondary-{environment_suffix}",
            identifier=f"trading-instance-secondary-{environment_suffix}",
            cluster_identifier=self.secondary_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            engine_version="14.6",
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**tags, 'Name': f"trading-instance-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.global_cluster_id = self.global_cluster.id
        self.primary_cluster_id = self.primary_cluster.id
        self.secondary_cluster_arn = self.secondary_cluster.arn
        self.primary_endpoint = self.primary_cluster.endpoint
        self.secondary_endpoint = self.secondary_cluster.endpoint

        self.register_outputs({
            'global_cluster_id': self.global_cluster.id,
            'primary_cluster_id': self.primary_cluster.id,
            'primary_endpoint': self.primary_cluster.endpoint,
            'secondary_cluster_arn': self.secondary_cluster.arn,
        })
```

## Additional Bug Files

Due to space constraints, here's a summary of bugs in remaining files:

### lambda_stack.py (BUG #11-13)
- **BUG #11**: Lambda timeout set to 30 seconds instead of 300
- **BUG #12**: Missing VPC configuration for Lambda functions
- **BUG #13**: IAM policy missing `secretsmanager:GetSecretValue` permission

### dynamodb_stack.py (BUG #14)
- **BUG #14**: Point-in-time recovery not enabled on replica

### s3_stack.py (BUG #15-16)
- **BUG #15**: Replication Time Control (RTC) not configured
- **BUG #16**: Missing bucket versioning on secondary bucket

### api_gateway_stack.py (BUG #17-18)
- **BUG #17**: API Gateway stage missing access logging configuration
- **BUG #18**: Missing throttling settings (rate limiting)

### monitoring_stack.py (BUG #19-20)
- **BUG #19**: Composite alarm using AND instead of OR logic
- **BUG #20**: Missing SNS alarm actions on individual alarms

### failover_stack.py (BUG #21-22)
- **BUG #21**: Lambda timeout too short for RDS failover operations
- **BUG #22**: Missing error handling and retry logic in failover code

### sns_stack.py (BUG #23)
- **BUG #23**: Missing cross-region subscription configuration

### synthetics_stack.py (BUG #24-25)
- **BUG #24**: Canary script using wrong runtime (Python instead of Node.js)
- **BUG #25**: Missing canary alarm configuration

## Summary

Total Bugs: 25+ realistic issues covering:
- Configuration errors (6)
- Security issues (4)
- Missing features (8)
- Integration problems (4)
- Resource dependencies (3)

See MODEL_FAILURES.md for detailed documentation of each bug and its fix.
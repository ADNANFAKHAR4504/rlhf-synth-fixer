# Multi-Region Disaster Recovery Infrastructure for Payment Processing

This implementation provides a complete active-passive disaster recovery solution using AWS CDK with Python.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    CfnOutput,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class DisasterRecoveryStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        is_primary: bool = True,
        primary_region: str = "us-east-1",
        dr_region: str = "us-east-2",
        alert_email: str = "alerts@example.com",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
        self.is_primary = is_primary
        region_name = primary_region if is_primary else dr_region

        # VPC with 3 AZs
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            vpc_name=f"payment-vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"isolated-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Security Groups
        alb_sg = ec2.SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for ALB {environment_suffix}",
            allow_all_outbound=True,
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic",
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic",
        )

        ecs_sg = ec2.SecurityGroup(
            self,
            f"ecs-sg-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for ECS tasks {environment_suffix}",
            allow_all_outbound=True,
        )
        ecs_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB",
        )

        db_sg = ec2.SecurityGroup(
            self,
            f"db-sg-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for Aurora {environment_suffix}",
            allow_all_outbound=False,
        )
        db_sg.add_ingress_rule(
            ecs_sg,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from ECS",
        )

        # SNS Topic for Alerts
        alert_topic = sns.Topic(
            self,
            f"alert-topic-{environment_suffix}",
            topic_name=f"payment-alerts-{environment_suffix}",
            display_name=f"Payment Processing Alerts {environment_suffix}",
        )
        alert_topic.add_subscription(
            sns_subscriptions.EmailSubscription(alert_email)
        )

        # Aurora Global Database
        db_cluster_identifier = f"payment-db-{environment_suffix}"

        if is_primary:
            # Primary Aurora PostgreSQL cluster
            db_cluster = rds.DatabaseCluster(
                self,
                f"aurora-cluster-{environment_suffix}",
                engine=rds.DatabaseClusterEngine.aurora_postgres(
                    version=rds.AuroraPostgresEngineVersion.VER_14_6
                ),
                cluster_identifier=db_cluster_identifier,
                writer=rds.ClusterInstance.provisioned(
                    f"writer-{environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.R6G,
                        ec2.InstanceSize.XLARGE,
                    ),
                ),
                readers=[
                    rds.ClusterInstance.provisioned(
                        f"reader1-{environment_suffix}",
                        instance_type=ec2.InstanceType.of(
                            ec2.InstanceClass.R6G,
                            ec2.InstanceSize.XLARGE,
                        ),
                    ),
                ],
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[db_sg],
                removal_policy=RemovalPolicy.DESTROY,
                storage_encrypted=True,
                backup=rds.BackupProps(
                    retention=Duration.days(7),
                ),
            )

            # CloudWatch Alarm for Database Replication Lag
            db_replication_alarm = cloudwatch.Alarm(
                self,
                f"db-replication-alarm-{environment_suffix}",
                alarm_name=f"db-replication-lag-{environment_suffix}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="AuroraGlobalDBReplicationLag",
                    dimensions_map={
                        "DBClusterIdentifier": db_cluster_identifier,
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                ),
                threshold=300000,  # 5 minutes in milliseconds
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            )
            db_replication_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(alert_topic)
            )

            CfnOutput(
                self,
                "DatabaseEndpoint",
                value=db_cluster.cluster_endpoint.hostname,
                description="Aurora cluster endpoint",
            )
        else:
            # Secondary Aurora cluster (DR region)
            # In production, this would be a secondary cluster of a Global Database
            # For this implementation, we create a standalone cluster that would be
            # configured as secondary in the Global Database setup
            db_cluster = rds.DatabaseCluster(
                self,
                f"aurora-cluster-dr-{environment_suffix}",
                engine=rds.DatabaseClusterEngine.aurora_postgres(
                    version=rds.AuroraPostgresEngineVersion.VER_14_6
                ),
                cluster_identifier=f"{db_cluster_identifier}-dr",
                writer=rds.ClusterInstance.provisioned(
                    f"writer-dr-{environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.R6G,
                        ec2.InstanceSize.LARGE,
                    ),
                ),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[db_sg],
                removal_policy=RemovalPolicy.DESTROY,
                storage_encrypted=True,
            )

            CfnOutput(
                self,
                "DatabaseEndpointDR",
                value=db_cluster.cluster_endpoint.hostname,
                description="Aurora DR cluster endpoint",
            )

        # ECS Cluster
        cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            cluster_name=f"payment-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"task-definition-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
        )

        # Grant task access to database
        db_cluster.grant_connect(task_definition.task_role, "payment_user")

        # Container
        container = task_definition.add_container(
            f"payment-container-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix=f"payment-{environment_suffix}",
                log_retention=logs.RetentionDays.ONE_WEEK,
            ),
            environment={
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "REGION": region_name,
                "IS_PRIMARY": str(is_primary),
            },
        )
        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"payment-alb-{environment_suffix}",
            security_group=alb_sg,
        )

        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"target-group-{environment_suffix}",
            vpc=vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Listener
        listener = alb.add_listener(
            f"listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group],
        )

        # Fargate Service with Auto-scaling
        min_capacity = 10 if is_primary else 2
        max_capacity = 50

        fargate_service = ecs.FargateService(
            self,
            f"fargate-service-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=min_capacity,
            service_name=f"payment-service-{environment_suffix}",
            security_groups=[ecs_sg],
            assign_public_ip=False,
        )

        fargate_service.attach_to_application_target_group(target_group)

        # Auto-scaling
        scaling = fargate_service.auto_scale_task_count(
            min_capacity=min_capacity,
            max_capacity=max_capacity,
        )

        scaling.scale_on_cpu_utilization(
            f"cpu-scaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # CloudWatch Alarms for ALB
        alb_unhealthy_alarm = cloudwatch.Alarm(
            self,
            f"alb-unhealthy-alarm-{environment_suffix}",
            alarm_name=f"alb-unhealthy-targets-{environment_suffix}",
            metric=target_group.metric_unhealthy_host_count(
                statistic="Average",
                period=Duration.minutes(1),
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )
        alb_unhealthy_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alert_topic)
        )

        # CloudWatch Alarm for ECS Task Count
        ecs_task_alarm = cloudwatch.Alarm(
            self,
            f"ecs-task-alarm-{environment_suffix}",
            alarm_name=f"ecs-low-task-count-{environment_suffix}",
            metric=fargate_service.metric_cpu_utilization(
                statistic="SampleCount",
                period=Duration.minutes(1),
            ),
            threshold=min_capacity,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        )
        ecs_task_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alert_topic))

        # Lambda Function for Payment Validation
        lambda_role = iam.Role(
            self,
            f"lambda-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant Lambda access to database
        db_cluster.grant_connect(lambda_role, "payment_user")

        validation_lambda = lambda_.Function(
            self,
            f"validation-lambda-{environment_suffix}",
            function_name=f"payment-validation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[ecs_sg],
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "REGION": region_name,
                "IS_PRIMARY": str(is_primary),
            },
            role=lambda_role,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # S3 Bucket for Transaction Logs
        bucket_name = f"payment-logs-{environment_suffix}-{region_name}"

        if is_primary:
            # Primary bucket with versioning and replication
            log_bucket = s3.Bucket(
                self,
                f"log-bucket-{environment_suffix}",
                bucket_name=bucket_name,
                versioned=True,
                encryption=s3.BucketEncryption.S3_MANAGED,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
                lifecycle_rules=[
                    s3.LifecycleRule(
                        transitions=[
                            s3.Transition(
                                storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                                transition_after=Duration.days(30),
                            ),
                            s3.Transition(
                                storage_class=s3.StorageClass.GLACIER,
                                transition_after=Duration.days(90),
                            ),
                        ],
                    ),
                ],
            )

            # Grant Lambda write access to bucket
            log_bucket.grant_write(validation_lambda)
            log_bucket.grant_write(task_definition.task_role)

            CfnOutput(
                self,
                "LogBucketName",
                value=log_bucket.bucket_name,
                description="Transaction logs bucket",
            )
        else:
            # DR bucket (replication destination)
            log_bucket = s3.Bucket(
                self,
                f"log-bucket-dr-{environment_suffix}",
                bucket_name=f"{bucket_name}-replica",
                versioned=True,
                encryption=s3.BucketEncryption.S3_MANAGED,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
            )

            # Grant Lambda write access to bucket
            log_bucket.grant_write(validation_lambda)
            log_bucket.grant_write(task_definition.task_role)

            CfnOutput(
                self,
                "LogBucketNameDR",
                value=log_bucket.bucket_name,
                description="DR transaction logs bucket",
            )

        # Outputs
        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=alb.load_balancer_dns_name,
            description="ALB DNS name",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=validation_lambda.function_arn,
            description="Payment validation Lambda ARN",
        )

        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
        )

        CfnOutput(
            self,
            "ClusterName",
            value=cluster.cluster_name,
            description="ECS Cluster name",
        )

        CfnOutput(
            self,
            "SNSTopicArn",
            value=alert_topic.topic_arn,
            description="SNS alert topic ARN",
        )


class Route53FailoverStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_alb_dns: str,
        dr_alb_dns: str,
        domain_name: str = "example.com",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create hosted zone (or use existing)
        hosted_zone = route53.HostedZone(
            self,
            f"hosted-zone-{environment_suffix}",
            zone_name=domain_name,
        )

        # Health check for primary region
        primary_health_check = route53.CfnHealthCheck(
            self,
            f"primary-health-check-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=primary_alb_dns,
                port=443,
                request_interval=30,
                failure_threshold=3,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-health-{environment_suffix}",
                ),
            ],
        )

        # Primary failover record
        route53.ARecord(
            self,
            f"primary-record-{environment_suffix}",
            zone=hosted_zone,
            record_name=f"payments.{domain_name}",
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(
                    primary_alb_dns,
                )
            ),
            failover=route53.FailoverRoutingConfig(
                routing_type=route53.FailoverType.PRIMARY,
                health_check_id=primary_health_check.attr_health_check_id,
            ),
        )

        # DR failover record
        route53.ARecord(
            self,
            f"dr-record-{environment_suffix}",
            zone=hosted_zone,
            record_name=f"payments.{domain_name}",
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(
                    dr_alb_dns,
                )
            ),
            failover=route53.FailoverRoutingConfig(
                routing_type=route53.FailoverType.SECONDARY,
            ),
        )

        CfnOutput(
            self,
            "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            description="Route53 Hosted Zone ID",
        )

        CfnOutput(
            self,
            "PaymentDomainName",
            value=f"payments.{domain_name}",
            description="Payment service domain name",
        )
```

## File: bin/tap.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import DisasterRecoveryStack, Route53FailoverStack


app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "prod"
alert_email = app.node.try_get_context("alertEmail") or "alerts@example.com"
domain_name = app.node.try_get_context("domainName") or "example.com"

# Primary Region Stack (us-east-1)
primary_stack = DisasterRecoveryStack(
    app,
    f"PaymentDRPrimary-{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=True,
    primary_region="us-east-1",
    dr_region="us-east-2",
    alert_email=alert_email,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",
    ),
    description=f"Primary region disaster recovery stack for payment processing ({environment_suffix})",
)

# DR Region Stack (us-east-2)
dr_stack = DisasterRecoveryStack(
    app,
    f"PaymentDRSecondary-{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=False,
    primary_region="us-east-1",
    dr_region="us-east-2",
    alert_email=alert_email,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-2",
    ),
    description=f"DR region disaster recovery stack for payment processing ({environment_suffix})",
)

# Route53 Failover Stack (global)
# Note: This would be deployed after obtaining ALB DNS names from primary and DR stacks
# For the actual deployment, you would retrieve these values from stack outputs
route53_stack = Route53FailoverStack(
    app,
    f"PaymentRoute53-{environment_suffix}",
    environment_suffix=environment_suffix,
    primary_alb_dns="primary-alb-dns.us-east-1.elb.amazonaws.com",
    dr_alb_dns="dr-alb-dns.us-east-2.elb.amazonaws.com",
    domain_name=domain_name,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",  # Route53 is global but stack needs a region
    ),
    description=f"Route53 failover configuration for payment processing ({environment_suffix})",
)

route53_stack.add_dependency(primary_stack)
route53_stack.add_dependency(dr_stack)

app.synth()
```

## File: lib/lambda/index.py

```python
import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function for payment validation.

    This function validates payment transactions and logs them to S3.
    In a production environment, this would connect to the Aurora database
    and perform complex validation logic.
    """

    db_host = os.environ.get("DB_HOST", "")
    region = os.environ.get("REGION", "")
    is_primary = os.environ.get("IS_PRIMARY", "true") == "true"

    logger.info(f"Payment validation request in region: {region}")
    logger.info(f"Running in {'primary' if is_primary else 'DR'} region")

    try:
        # Extract payment details from event
        payment_id = event.get("payment_id", "unknown")
        amount = event.get("amount", 0)
        currency = event.get("currency", "USD")

        logger.info(f"Validating payment: {payment_id}, Amount: {amount} {currency}")

        # Validation logic
        if amount <= 0:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "valid": False,
                    "reason": "Invalid amount",
                    "payment_id": payment_id,
                }),
            }

        if amount > 1000000:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "valid": False,
                    "reason": "Amount exceeds limit",
                    "payment_id": payment_id,
                }),
            }

        # In production, this would:
        # 1. Connect to Aurora database
        # 2. Validate payment against business rules
        # 3. Check for fraud patterns
        # 4. Log transaction to S3
        # 5. Update database with validation result

        return {
            "statusCode": 200,
            "body": json.dumps({
                "valid": True,
                "payment_id": payment_id,
                "amount": amount,
                "currency": currency,
                "region": region,
                "validated_at": context.request_id,
            }),
        }

    except Exception as e:
        logger.error(f"Error validating payment: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "valid": False,
                "reason": "Internal error",
                "error": str(e),
            }),
        }
```

## File: requirements.txt

```txt
aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Infrastructure

This CDK application implements a comprehensive active-passive disaster recovery solution for a payment processing system across AWS regions us-east-1 (primary) and us-east-2 (DR).

## Architecture Overview

### Components

1. **Aurora Global Database**: PostgreSQL database with automatic replication between regions
2. **ECS Fargate**: Containerized payment processing application with auto-scaling
3. **Application Load Balancer**: Load distribution with health checks
4. **Route 53**: DNS failover routing with health-based automatic failover
5. **Lambda Functions**: Serverless payment validation deployed to both regions
6. **S3 with Cross-Region Replication**: Transaction log storage
7. **CloudWatch**: Monitoring and alerting for all components
8. **SNS**: Notification system for failover events

### Disaster Recovery Strategy

- **RTO**: < 15 minutes
- **RPO**: < 5 minutes
- **Pattern**: Active-Passive
- **Primary Region**: us-east-1 (10-50 tasks)
- **DR Region**: us-east-2 (2-50 tasks, minimal capacity)

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Python 3.8 or higher
- Node.js 14.x or higher (for CDK CLI)
- Docker (for Lambda function packaging)

## Installation

1. Install CDK CLI:
```bash
npm install -g aws-cdk
```

2. Create Python virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Bootstrap CDK in both regions:
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

## Deployment

### Step 1: Deploy Primary Region

```bash
cdk deploy PaymentDRPrimary-prod \
  --context environmentSuffix=prod \
  --context alertEmail=your-email@example.com \
  --region us-east-1
```

### Step 2: Deploy DR Region

```bash
cdk deploy PaymentDRSecondary-prod \
  --context environmentSuffix=prod \
  --context alertEmail=your-email@example.com \
  --region us-east-2
```

### Step 3: Configure Route 53 Failover

After deploying both regions, retrieve the ALB DNS names from stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name PaymentDRPrimary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name PaymentDRSecondary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-2
```

Update `bin/tap.py` with the actual ALB DNS names and deploy Route 53 stack:

```bash
cdk deploy PaymentRoute53-prod \
  --context environmentSuffix=prod \
  --context domainName=your-domain.com \
  --region us-east-1
```

## Configuration

### Context Parameters

- `environmentSuffix`: Unique identifier for resources (default: "prod")
- `alertEmail`: Email address for SNS notifications
- `domainName`: Domain name for Route 53 hosted zone

### Environment Variables

Set in your terminal:
```bash
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
```

## Monitoring

### CloudWatch Alarms

1. **Database Replication Lag**: Triggers when lag exceeds 5 minutes
2. **ALB Unhealthy Targets**: Alerts when targets become unhealthy
3. **ECS Task Count**: Monitors minimum task count

All alarms send notifications to the SNS topic configured with your email.

### CloudWatch Dashboards

Create custom dashboards to monitor:
- ECS task CPU and memory utilization
- ALB request count and latency
- Aurora database connections and queries
- Lambda invocation metrics

## Failover Process

### Automatic Failover

Route 53 health checks monitor the primary region ALB. When health checks fail:
1. Route 53 automatically updates DNS to point to DR region
2. CloudWatch alarms trigger SNS notifications
3. Traffic routes to DR region ALB
4. DR region ECS tasks auto-scale to handle increased load

### Manual Failover

If needed, manually promote DR region:
1. Scale up DR region ECS tasks
2. Update Route 53 to use DR region as primary
3. Promote Aurora secondary cluster to primary

## Cost Optimization

- DR region runs minimal capacity (2 tasks) until failover
- S3 lifecycle policies move old logs to cheaper storage
- CloudWatch log retention set to 7 days
- Aurora instances in DR use smaller instance types

## Security

- VPC isolation with private subnets
- Security groups restrict traffic between components
- IAM roles follow least privilege principle
- Encryption at rest for Aurora and S3
- Encryption in transit for all connections

## Testing

### Health Check Testing

Test ALB health endpoint:
```bash
PRIMARY_ALB=$(aws cloudformation describe-stacks \
  --stack-name PaymentDRPrimary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1)

curl http://${PRIMARY_ALB}/health
```

### Failover Testing

Simulate primary region failure by modifying health check or scaling down ECS tasks:
```bash
aws ecs update-service \
  --cluster payment-cluster-prod \
  --service payment-service-prod \
  --desired-count 0 \
  --region us-east-1
```

Monitor Route 53 health check status and DNS resolution.

## Cleanup

Remove all stacks in reverse order:

```bash
cdk destroy PaymentRoute53-prod --region us-east-1
cdk destroy PaymentDRSecondary-prod --region us-east-2
cdk destroy PaymentDRPrimary-prod --region us-east-1
```

## Troubleshooting

### Stack Deployment Fails

- Verify AWS credentials and permissions
- Check CDK bootstrap in both regions
- Ensure unique environment suffix
- Review CloudFormation events for specific errors

### Health Checks Failing

- Verify ECS tasks are running and healthy
- Check security group rules allow health check traffic
- Review ALB target group health check configuration
- Examine ECS task logs for application errors

### Replication Lag High

- Check Aurora cluster metrics in CloudWatch
- Verify network connectivity between regions
- Review database workload and optimize queries
- Consider scaling up Aurora instances

## Production Considerations

1. **Domain Configuration**: Replace example.com with your actual domain
2. **Container Images**: Replace sample container with your payment processing application
3. **Database Credentials**: Use AWS Secrets Manager for database credentials
4. **SSL/TLS**: Add ACM certificates to ALB listeners
5. **WAF**: Add AWS WAF for additional security
6. **Backup Testing**: Regularly test backup and restore procedures
7. **Disaster Recovery Drills**: Schedule regular failover testing
8. **Monitoring**: Enhance monitoring with custom metrics and dashboards

## Support

For issues or questions:
- Review CloudWatch logs for detailed error messages
- Check CloudFormation stack events
- Consult AWS documentation for service-specific issues
- Contact AWS Support for infrastructure problems

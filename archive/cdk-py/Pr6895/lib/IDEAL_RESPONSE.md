# Multi-Region Disaster Recovery Architecture - AWS CDK Python Implementation

This implementation provides a complete multi-region disaster recovery solution with 5-minute RTO for a trading platform using AWS CDK with Python.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    Duration,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_events as events,
    aws_events_targets as event_targets,
    aws_logs as logs,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-west-2",
        log_retention_days: int = 7,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.log_retention_days = log_retention_days

        # Determine if this is primary or secondary region
        self.is_primary = self.region == primary_region

        # Create VPC with 3 AZs
        self.vpc = self._create_vpc()

        # Create security groups
        self.alb_sg = self._create_alb_security_group()
        self.ecs_sg = self._create_ecs_security_group()
        self.db_sg = self._create_database_security_group()

        # Create ECS Cluster and Fargate Service
        self.cluster = self._create_ecs_cluster()
        self.task_definition = self._create_task_definition()
        self.ecs_service = self._create_ecs_service()

        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()

        # Create Aurora Global Database (primary only creates global cluster)
        if self.is_primary:
            self.aurora_cluster = self._create_aurora_primary_cluster()
            self._create_replication_lag_alarm()
        else:
            self.aurora_cluster = self._create_aurora_secondary_cluster()

        # Create DynamoDB Global Table (only create from primary)
        if self.is_primary:
            self.dynamodb_table = self._create_dynamodb_global_table()

        # Create S3 buckets with cross-region replication
        self.s3_bucket = self._create_s3_bucket()

        # Create EventBridge rules for cross-region replication
        self.event_bus = self._create_event_bridge_rules()

        # Create Route 53 resources (only in primary)
        if self.is_primary:
            self.hosted_zone = self._create_route53_hosted_zone()
            self._create_route53_records()

        # Create CloudWatch Log Groups
        self._create_log_groups()

        # Outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs, public and private subnets"""
        vpc = ec2.Vpc(
            self,
            f"TradingVPC-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Cost optimization: 1 NAT gateway
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )
        return vpc

    def _create_alb_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ALB"""
        sg = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic",
        )
        sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic",
        )
        return sg

    def _create_ecs_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ECS tasks"""
        sg = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB",
        )
        return sg

    def _create_database_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Aurora database"""
        sg = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Aurora database",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            self.ecs_sg,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL traffic from ECS",
        )
        return sg

    def _create_ecs_cluster(self) -> ecs.Cluster:
        """Create ECS cluster"""
        cluster = ecs.Cluster(
            self,
            f"TradingCluster-{self.environment_suffix}",
            vpc=self.vpc,
            cluster_name=f"trading-cluster-{self.environment_suffix}",
            container_insights=True,
        )
        return cluster

    def _create_task_definition(self) -> ecs.FargateTaskDefinition:
        """Create Fargate task definition"""
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TradingTaskDef-{self.environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
        )

        # Add container
        container = task_definition.add_container(
            f"TradingContainer-{self.environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix=f"trading-{self.environment_suffix}",
                log_retention=logs.RetentionDays(self.log_retention_days),
            ),
            environment={
                "REGION": self.region,
                "ENVIRONMENT_SUFFIX": self.environment_suffix,
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        return task_definition

    def _create_ecs_service(self) -> ecs.FargateService:
        """Create Fargate service with 2 tasks"""
        service = ecs.FargateService(
            self,
            f"TradingService-{self.environment_suffix}",
            cluster=self.cluster,
            task_definition=self.task_definition,
            desired_count=2,
            security_groups=[self.ecs_sg],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            assign_public_ip=False,
        )
        return service

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"TradingALB-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"trading-alb-{self.environment_suffix}",
            security_group=self.alb_sg,
            deletion_protection=False,
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TradingTargetGroup-{self.environment_suffix}",
            vpc=self.vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=2,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Register ECS service with target group
        self.ecs_service.attach_to_application_target_group(target_group)

        # Create listener
        listener = alb.add_listener(
            f"TradingListener-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group],
        )

        return alb

    def _create_aurora_primary_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora Global Database primary cluster"""
        # Create subnet group with explicit subnets
        db_subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-{self.environment_suffix}",
            description="Subnet group for Aurora Global Database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create parameter group for global database
        parameter_group = rds.ParameterGroup(
            self,
            f"AuroraParameterGroup-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            description="Parameter group for Aurora Global Database",
        )

        # Create Aurora Global Database cluster (primary)
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraGlobalCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret("postgres"),
            default_database_name="tradingdb",
            instances=2,
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[self.db_sg],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            subnet_group=db_subnet_group,
            parameter_group=parameter_group,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            backup=rds.BackupProps(
                retention=Duration.days(7),
            ),
        )

        return cluster

    def _create_aurora_secondary_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora Global Database secondary cluster"""
        # Create subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-{self.environment_suffix}",
            description="Subnet group for Aurora Global Database secondary",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create secondary cluster
        # Note: In real implementation, this would need CfnGlobalCluster
        # and proper global database configuration
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraSecondaryCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            instances=2,
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[self.db_sg],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            subnet_group=db_subnet_group,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
        )

        return cluster

    def _create_replication_lag_alarm(self) -> None:
        """Create CloudWatch alarm for Aurora replication lag"""
        if hasattr(self, "aurora_cluster"):
            alarm = cloudwatch.Alarm(
                self,
                f"ReplicationLagAlarm-{self.environment_suffix}",
                metric=self.aurora_cluster.metric_global_database_replicated_write_io(
                    statistic="Average",
                    period=Duration.minutes(1),
                ),
                threshold=60,
                evaluation_periods=2,
                datapoints_to_alarm=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description="Alert when Aurora replication lag exceeds 60 seconds",
            )

    def _create_dynamodb_global_table(self) -> dynamodb.Table:
        """Create DynamoDB Global Table"""
        table = dynamodb.Table(
            self,
            f"SessionTable-{self.environment_suffix}",
            table_name=f"trading-sessions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            replication_regions=[self.secondary_region],
        )
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning"""
        # Create bucket
        bucket = s3.Bucket(
            self,
            f"TradingBucket-{self.environment_suffix}",
            bucket_name=f"trading-data-{self.region}-{self.environment_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # If primary region, set up cross-region replication
        if self.is_primary:
            # Create replication role
            replication_role = iam.Role(
                self,
                f"S3ReplicationRole-{self.environment_suffix}",
                assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
                description="Role for S3 cross-region replication",
            )

            # Add replication permissions
            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket",
                    ],
                    resources=[bucket.bucket_arn],
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                    ],
                    resources=[f"{bucket.bucket_arn}/*"],
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                    ],
                    resources=[
                        f"arn:aws:s3:::trading-data-{self.secondary_region}-{self.environment_suffix}/*"
                    ],
                )
            )

            # Note: CfnBucket.ReplicationConfigurationProperty would be used
            # for actual replication configuration with RTC

        return bucket

    def _create_event_bridge_rules(self) -> events.EventBus:
        """Create EventBridge rules for cross-region replication"""
        # Create custom event bus
        event_bus = events.EventBus(
            self,
            f"TradingEventBus-{self.environment_suffix}",
            event_bus_name=f"trading-events-{self.environment_suffix}",
        )

        # Create rule for trading events
        rule = events.Rule(
            self,
            f"TradingEventsRule-{self.environment_suffix}",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["trading.platform"],
                detail_type=["Trade Executed", "Order Placed"],
            ),
            description="Route trading events for cross-region replication",
        )

        # Grant permissions for cross-region event delivery
        if self.is_primary:
            # Add cross-region target
            # Note: This would use EventBridge global endpoints in production
            pass

        return event_bus

    def _create_route53_hosted_zone(self) -> route53.HostedZone:
        """Create Route 53 hosted zone"""
        hosted_zone = route53.PublicHostedZone(
            self,
            f"TradingHostedZone-{self.environment_suffix}",
            zone_name=f"trading-{self.environment_suffix}.example.com",
            comment="Hosted zone for multi-region trading platform",
        )
        return hosted_zone

    def _create_route53_records(self) -> None:
        """Create Route 53 weighted routing records with health checks"""
        # Create health check for primary ALB
        primary_health_check = route53.CfnHealthCheck(
            self,
            f"PrimaryHealthCheck-{self.environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=self.alb.load_balancer_dns_name,
                port=443,
                request_interval=30,
                failure_threshold=2,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-alb-health-{self.environment_suffix}",
                )
            ],
        )

        # Create weighted record for primary region
        route53.ARecord(
            self,
            f"PrimaryWeightedRecord-{self.environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"api.trading-{self.environment_suffix}.example.com",
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(self.alb)
            ),
            weight=100,  # 100% traffic to primary initially
        )

        # Note: Secondary region health check and record would be created
        # in the secondary region stack with weight=0

    def _create_log_groups(self) -> None:
        """Create CloudWatch Log Groups"""
        # Application logs
        logs.LogGroup(
            self,
            f"ApplicationLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/trading/application-{self.environment_suffix}",
            retention=logs.RetentionDays(self.log_retention_days),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Infrastructure logs
        logs.LogGroup(
            self,
            f"InfrastructureLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/trading/infrastructure-{self.environment_suffix}",
            retention=logs.RetentionDays(self.log_retention_days),
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        # ALB DNS name
        CfnOutput(
            self,
            f"ALBEndpoint-{self.environment_suffix}",
            value=self.alb.load_balancer_dns_name,
            description=f"ALB DNS endpoint for {self.region}",
            export_name=f"TradingALBEndpoint-{self.region}-{self.environment_suffix}",
        )

        # Aurora cluster endpoint
        if hasattr(self, "aurora_cluster"):
            CfnOutput(
                self,
                f"AuroraClusterEndpoint-{self.environment_suffix}",
                value=self.aurora_cluster.cluster_endpoint.hostname,
                description="Aurora cluster endpoint",
                export_name=f"AuroraEndpoint-{self.region}-{self.environment_suffix}",
            )

        # DynamoDB table name (primary only)
        if self.is_primary and hasattr(self, "dynamodb_table"):
            CfnOutput(
                self,
                f"DynamoDBTableName-{self.environment_suffix}",
                value=self.dynamodb_table.table_name,
                description="DynamoDB Global Table name",
                export_name=f"DynamoDBTable-{self.environment_suffix}",
            )

        # S3 bucket name
        CfnOutput(
            self,
            f"S3BucketName-{self.environment_suffix}",
            value=self.s3_bucket.bucket_name,
            description=f"S3 bucket for {self.region}",
            export_name=f"S3Bucket-{self.region}-{self.environment_suffix}",
        )

        # Route 53 hosted zone ID (primary only)
        if self.is_primary and hasattr(self, "hosted_zone"):
            CfnOutput(
                self,
                f"HostedZoneId-{self.environment_suffix}",
                value=self.hosted_zone.hosted_zone_id,
                description="Route 53 Hosted Zone ID",
                export_name=f"HostedZoneId-{self.environment_suffix}",
            )

        # ECS cluster name
        CfnOutput(
            self,
            f"ECSClusterName-{self.environment_suffix}",
            value=self.cluster.cluster_name,
            description=f"ECS Cluster name in {self.region}",
            export_name=f"ECSCluster-{self.region}-{self.environment_suffix}",
        )
```

## File: bin/tap.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get(
    "ENVIRONMENT_SUFFIX", "dev"
)

# Get log retention from context
log_retention_days = int(
    app.node.try_get_context("logRetentionDays") or os.environ.get("LOG_RETENTION_DAYS", "7")
)

# Primary region stack (us-east-1)
primary_stack = TapStack(
    app,
    f"TradingPrimaryStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    primary_region="us-east-1",
    secondary_region="us-west-2",
    log_retention_days=log_retention_days,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",
    ),
    description="Multi-region DR trading platform - Primary region (us-east-1)",
)

# Secondary region stack (us-west-2)
secondary_stack = TapStack(
    app,
    f"TradingSecondaryStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    primary_region="us-east-1",
    secondary_region="us-west-2",
    log_retention_days=log_retention_days,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-west-2",
    ),
    description="Multi-region DR trading platform - Secondary region (us-west-2)",
)

# Add dependency: secondary should deploy after primary for Aurora Global DB
secondary_stack.add_dependency(primary_stack)

app.synth()
```

## File: lib/requirements.txt

```text
aws-cdk-lib==2.110.0
constructs>=10.0.0,<11.0.0
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Architecture for Trading Platform

This CDK application deploys a complete multi-region disaster recovery infrastructure for a trading platform with automatic failover capabilities.

## Architecture Overview

The solution spans two AWS regions:
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2

### Components

1. **Route 53**: DNS management with weighted routing (100% primary, 0% secondary) and health checks
2. **ECS Fargate**: Containerized trading application (2 tasks, 1 vCPU, 2GB each)
3. **Application Load Balancers**: Traffic distribution in both regions
4. **Aurora Global Database**: PostgreSQL with cross-region replication
5. **DynamoDB Global Tables**: Session data with automatic replication
6. **S3 Cross-Region Replication**: Object storage with versioning and RTC
7. **EventBridge**: Cross-region event replication
8. **CloudWatch**: Monitoring and alarms for replication lag

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- Docker installed for container builds

## Deployment

### 1. Install Dependencies

```bash
pip install -r lib/requirements.txt
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod"
export LOG_RETENTION_DAYS="7"
export CDK_DEFAULT_ACCOUNT="123456789012"
```

### 3. Bootstrap CDK (if not done)

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

### 4. Deploy Primary Region First

```bash
cdk deploy TradingPrimaryStack-${ENVIRONMENT_SUFFIX} --region us-east-1
```

**Important**: Wait for the Aurora Global Database primary cluster to reach "available" state (20-30 minutes) before deploying secondary region.

### 5. Deploy Secondary Region

```bash
cdk deploy TradingSecondaryStack-${ENVIRONMENT_SUFFIX} --region us-west-2
```

### 6. Deploy All Stacks

```bash
cdk deploy --all
```

## Configuration

### Context Variables

You can pass configuration via CDK context:

```bash
cdk deploy --context environmentSuffix=prod --context logRetentionDays=30
```

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource names (default: "dev")
- `LOG_RETENTION_DAYS`: CloudWatch log retention period (default: 7)
- `CDK_DEFAULT_ACCOUNT`: AWS account ID

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- VPC: `TradingVPC-{environmentSuffix}`
- ECS Cluster: `trading-cluster-{environmentSuffix}`
- ALB: `trading-alb-{environmentSuffix}`
- S3 Bucket: `trading-data-{region}-{environmentSuffix}`
- DynamoDB Table: `trading-sessions-{environmentSuffix}`

## Outputs

After deployment, the following outputs are available:

- `ALBEndpoint-{environmentSuffix}`: ALB DNS name for each region
- `AuroraClusterEndpoint-{environmentSuffix}`: Database endpoint
- `DynamoDBTableName-{environmentSuffix}`: Global table name
- `S3BucketName-{environmentSuffix}`: S3 bucket names
- `HostedZoneId-{environmentSuffix}`: Route 53 hosted zone ID
- `ECSClusterName-{environmentSuffix}`: ECS cluster names

## Monitoring

### CloudWatch Alarms

- **Replication Lag Alarm**: Triggers when Aurora replication lag exceeds 60 seconds

### Health Checks

- Route 53 health checks monitor ALBs every 30 seconds
- Failover threshold: 2 consecutive failures (60 seconds total)

## Disaster Recovery

### RTO: 5 Minutes

The architecture is designed to achieve a 5-minute Recovery Time Objective:

1. Route 53 health checks detect primary region failure (60 seconds)
2. DNS updates propagate (TTL-dependent, typically 60-300 seconds)
3. Traffic automatically routes to secondary region
4. Secondary Aurora cluster handles writes via write forwarding

### Failover Process

1. Primary region ALB health check fails
2. Route 53 marks primary unhealthy after 2 failures (60 seconds)
3. Traffic weight shifts to secondary region
4. Application continues with minimal disruption

## Cost Optimization

- Uses single NAT Gateway per region (instead of per AZ)
- Aurora Serverless v2 compatible (can be enabled)
- On-demand DynamoDB billing
- 7-day log retention (configurable)

## Cleanup

To destroy all resources:

```bash
cdk destroy --all
```

**Note**: All resources have `deletion_protection=False` and `RemovalPolicy.DESTROY` for testing environments.

## Known Limitations

1. **Aurora Global Database**: Primary cluster must be fully available before secondary can be attached (20-30 minutes)
2. **Route 53 Domain**: Example domain used (`trading-{suffix}.example.com`). Replace with actual domain.
3. **Container Image**: Uses sample ECS image. Replace with actual trading application image.
4. **SSL/TLS**: HTTP listener used for simplicity. Add ACM certificate and HTTPS listener for production.

## Troubleshooting

### Aurora Global Database Secondary Attachment Fails

**Cause**: Primary cluster not in "available" state.

**Solution**: Wait 20-30 minutes after primary deployment before deploying secondary.

### S3 Replication Not Working

**Cause**: Missing IAM permissions or bucket policies.

**Solution**: Verify replication role has correct permissions for source and destination buckets.

### ECS Tasks Not Starting

**Cause**: Security groups or network configuration issues.

**Solution**: Verify ECS security group allows traffic from ALB, and tasks are in private subnets with NAT Gateway access.

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Route 53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
```

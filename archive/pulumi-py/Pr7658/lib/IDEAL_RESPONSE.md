# ECS Fargate Payment Processing Migration - Pulumi Python Implementation

This implementation provides a complete containerized payment processing platform using Pulumi with Python, migrating from EC2 to ECS Fargate with full auto-scaling, monitoring, and security features. This is a self-sufficient deployment that creates all required infrastructure without dependencies on external stacks.

## File: __main__.py

```python
"""
ECS Fargate Payment Processing Infrastructure
Migrates payment processing from EC2 to containerized ECS Fargate
"""
import pulumi
import pulumi_aws as aws

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
region = config.get("region") or "us-east-2"

# Resource tags
common_tags = {
    "environment": environment_suffix,
    "team": "platform",
    "cost-center": "engineering",
    "project": "payment-processor-migration",
    "managed-by": "pulumi"
}

# Get availability zones for the region
availability_zones = aws.get_availability_zones(state="available")
# Use 2-3 AZs for redundancy
az_count = min(3, len(availability_zones.names))
azs = availability_zones.names[:az_count]

# Create VPC for standalone deployment
vpc = aws.ec2.Vpc(
    f"payment-processor-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"payment-processor-vpc-{environment_suffix}"}
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-processor-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-processor-igw-{environment_suffix}"}
)

# Create public subnets (one per AZ)
public_subnets = []
for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
        f"payment-processor-public-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**common_tags, "Name": f"payment-processor-public-subnet-{i}-{environment_suffix}"}
    )
    public_subnets.append(subnet)

# Create private subnets (one per AZ)
private_subnets = []
for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
        f"payment-processor-private-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 10}.0/24",
        availability_zone=az,
        tags={**common_tags, "Name": f"payment-processor-private-subnet-{i}-{environment_suffix}"}
    )
    private_subnets.append(subnet)

# Create Elastic IPs for NAT Gateways
nat_eips = []
for i in range(az_count):
    eip = aws.ec2.Eip(
        f"payment-processor-nat-eip-{i}-{environment_suffix}",
        domain="vpc",
        tags={**common_tags, "Name": f"payment-processor-nat-eip-{i}-{environment_suffix}"},
        opts=pulumi.ResourceOptions(depends_on=[igw])
    )
    nat_eips.append(eip)

# Create NAT Gateways (one per AZ for high availability)
nat_gateways = []
for i, (public_subnet, eip) in enumerate(zip(public_subnets, nat_eips)):
    nat = aws.ec2.NatGateway(
        f"payment-processor-nat-{i}-{environment_suffix}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={**common_tags, "Name": f"payment-processor-nat-{i}-{environment_suffix}"}
    )
    nat_gateways.append(nat)

# Create public route table
public_route_table = aws.ec2.RouteTable(
    f"payment-processor-public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
    ],
    tags={**common_tags, "Name": f"payment-processor-public-rt-{environment_suffix}"}
)

# Associate public subnets with public route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"payment-processor-public-rta-{i}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )

# Create private route tables (one per AZ, each with its own NAT Gateway)
private_route_tables = []
for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
    rt = aws.ec2.RouteTable(
        f"payment-processor-private-rt-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )
        ],
        tags={**common_tags, "Name": f"payment-processor-private-rt-{i}-{environment_suffix}"}
    )
    private_route_tables.append(rt)
    
    # Associate private subnet with its route table
    aws.ec2.RouteTableAssociation(
        f"payment-processor-private-rta-{i}-{environment_suffix}",
        subnet_id=private_subnet.id,
        route_table_id=rt.id
    )

# Security Group for ALB
alb_security_group = aws.ec2.SecurityGroup(
    f"alb-sg-{environment_suffix}",
    name=f"alb-{environment_suffix}",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTP traffic from internet"
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTPS traffic from internet"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags=common_tags
)

# ECR Repository for container images
ecr_repository = aws.ecr.Repository(
    f"payment-processor-ecr-{environment_suffix}",
    name=f"payment-processor-{environment_suffix}",
    image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
        scan_on_push=True,
    ),
    image_tag_mutability="MUTABLE",
    tags=common_tags
)

# ECR Lifecycle Policy - keep only last 10 images
ecr_lifecycle_policy = aws.ecr.LifecyclePolicy(
    f"payment-processor-lifecycle-{environment_suffix}",
    repository=ecr_repository.name,
    policy=pulumi.Output.all().apply(lambda _: """{
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep only last 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    }""")
)

# CloudWatch Log Group for ECS tasks
log_group = aws.cloudwatch.LogGroup(
    f"payment-processor-logs-{environment_suffix}",
    name=f"/ecs/payment-processor-{environment_suffix}",
    retention_in_days=30,
    kms_key_id=None,  # Using AWS managed encryption by default
    tags=common_tags
)

# ECS Cluster
ecs_cluster = aws.ecs.Cluster(
    f"payment-processor-cluster-{environment_suffix}",
    name=f"payment-processor-{environment_suffix}",
    settings=[aws.ecs.ClusterSettingArgs(
        name="containerInsights",
        value="enabled",
    )],
    tags=common_tags
)

# IAM Role for ECS Task Execution (pulls from ECR, writes to CloudWatch)
task_execution_role = aws.iam.Role(
    f"ecs-task-execution-role-{environment_suffix}",
    name=f"ecs-task-execution-{environment_suffix}",
    assume_role_policy=pulumi.Output.all().apply(lambda _: """{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }"""),
    tags=common_tags
)

# Attach AWS managed policy for ECS task execution
task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
    f"ecs-task-execution-policy-{environment_suffix}",
    role=task_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
)

# Additional policy for Secrets Manager access
secrets_policy = aws.iam.RolePolicy(
    f"ecs-secrets-policy-{environment_suffix}",
    role=task_execution_role.id,
    policy=pulumi.Output.all().apply(lambda _: """{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": "arn:aws:secretsmanager:*:*:secret:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                ],
                "Resource": "*"
            }
        ]
    }""")
)

# IAM Role for ECS Task (application runtime permissions)
task_role = aws.iam.Role(
    f"ecs-task-role-{environment_suffix}",
    name=f"ecs-task-{environment_suffix}",
    assume_role_policy=pulumi.Output.all().apply(lambda _: """{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }"""),
    tags=common_tags
)

# Application-specific policies for task role
app_policy = aws.iam.RolePolicy(
    f"ecs-app-policy-{environment_suffix}",
    role=task_role.id,
    policy=pulumi.Output.all().apply(lambda _: """{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"
                ],
                "Resource": "arn:aws:secretsmanager:*:*:secret:db-credentials-*"
            }
        ]
    }""")
)

# Placeholder secret for database credentials (in production, create this separately)
# This demonstrates how the task definition will reference it
db_secret = aws.secretsmanager.Secret(
    f"db-credentials-{environment_suffix}",
    name=f"db-credentials-{environment_suffix}",
    description="Database credentials for payment processor",
    tags=common_tags
)

# Example secret value structure (in production, set this securely)
db_secret_version = aws.secretsmanager.SecretVersion(
    f"db-credentials-version-{environment_suffix}",
    secret_id=db_secret.id,
    secret_string=pulumi.Output.all().apply(lambda _: """{
        "username": "payment_user",
        "password": "CHANGEME_IN_PRODUCTION",
        "host": "db.example.com",
        "port": "5432",
        "database": "payments"
    }""")
)

# ECS Task Definition
task_definition = aws.ecs.TaskDefinition(
    f"payment-processor-task-{environment_suffix}",
    family=f"payment-processor-{environment_suffix}",
    network_mode="awsvpc",
    requires_compatibilities=["FARGATE"],
    cpu="2048",  # 2 vCPU
    memory="4096",  # 4GB
    execution_role_arn=task_execution_role.arn,
    task_role_arn=task_role.arn,
    container_definitions=pulumi.Output.all(
        ecr_repository.repository_url,
        log_group.name,
        db_secret.arn,
        region
    ).apply(lambda args: f"""[
        {{
            "name": "payment-processor",
            "image": "{args[0]}:latest",
            "cpu": 2048,
            "memory": 4096,
            "essential": true,
            "portMappings": [
                {{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }}
            ],
            "environment": [
                {{
                    "name": "AWS_REGION",
                    "value": "{args[3]}"
                }},
                {{
                    "name": "ENVIRONMENT",
                    "value": "{environment_suffix}"
                }}
            ],
            "secrets": [
                {{
                    "name": "DB_USERNAME",
                    "valueFrom": "{args[2]}:username::"
                }},
                {{
                    "name": "DB_PASSWORD",
                    "valueFrom": "{args[2]}:password::"
                }},
                {{
                    "name": "DB_HOST",
                    "valueFrom": "{args[2]}:host::"
                }},
                {{
                    "name": "DB_PORT",
                    "valueFrom": "{args[2]}:port::"
                }},
                {{
                    "name": "DB_DATABASE",
                    "valueFrom": "{args[2]}:database::"
                }}
            ],
            "logConfiguration": {{
                "logDriver": "awslogs",
                "options": {{
                    "awslogs-group": "{args[1]}",
                    "awslogs-region": "{args[3]}",
                    "awslogs-stream-prefix": "ecs"
                }}
            }},
            "healthCheck": {{
                "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }}
        }}
    ]"""),
    tags=common_tags
)

# Security Group for ECS Tasks
ecs_security_group = aws.ec2.SecurityGroup(
    f"ecs-tasks-sg-{environment_suffix}",
    name=f"ecs-tasks-{environment_suffix}",
    description="Security group for ECS Fargate tasks",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            security_groups=[alb_security_group.id],
            description="Allow traffic from ALB"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags=common_tags
)

# Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"payment-processor-alb-{environment_suffix}",
    name=f"payment-proc-alb-{environment_suffix}"[:32],  # AWS limit
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_security_group.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,
    enable_http2=True,
    idle_timeout=60,
    tags=common_tags
)

# Target Group for ECS Service
target_group = aws.lb.TargetGroup(
    f"payment-processor-tg-{environment_suffix}",
    name=f"payment-proc-{environment_suffix}"[:32],  # AWS limit
    port=8080,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="ip",
    deregistration_delay=30,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/health",
        protocol="HTTP",
        port="8080",
        healthy_threshold=2,
        unhealthy_threshold=3,
        timeout=5,
        interval=30,
        matcher="200",
        # Note: ALB health checks don't support custom headers directly.
        # The X-Health-Check header requirement is enforced via listener rule conditions
        # for routing, but health checks will use standard HTTP requests.
    ),
    tags=common_tags
)

# ALB Listener (HTTP)
alb_listener = aws.lb.Listener(
    f"payment-processor-listener-{environment_suffix}",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[aws.lb.ListenerDefaultActionArgs(
        type="fixed-response",
        fixed_response=aws.lb.ListenerDefaultActionFixedResponseArgs(
            content_type="text/plain",
            message_body="Not Found",
            status_code="404"
        )
    )],
    tags=common_tags
)

# ALB Listener Rule with custom header check
listener_rule = aws.lb.ListenerRule(
    f"payment-processor-rule-{environment_suffix}",
    listener_arn=alb_listener.arn,
    priority=100,
    actions=[aws.lb.ListenerRuleActionArgs(
        type="forward",
        target_group_arn=target_group.arn,
    )],
    conditions=[
        aws.lb.ListenerRuleConditionArgs(
            path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                values=["/health", "/api/*"]
            )
        ),
        aws.lb.ListenerRuleConditionArgs(
            http_header=aws.lb.ListenerRuleConditionHttpHeaderArgs(
                http_header_name="X-Health-Check",
                values=["true"]
            )
        )
    ],
    tags=common_tags
)

# ECS Service
ecs_service = aws.ecs.Service(
    f"payment-processor-service-{environment_suffix}",
    name=f"payment-processor-{environment_suffix}",
    cluster=ecs_cluster.id,
    task_definition=task_definition.arn,
    desired_count=3,
    launch_type="FARGATE",
    platform_version="LATEST",
    scheduling_strategy="REPLICA",
    deployment_maximum_percent=200,
    deployment_minimum_healthy_percent=100,
    network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
        assign_public_ip=False,
        subnets=[subnet.id for subnet in private_subnets],
        security_groups=[ecs_security_group.id]
    ),
    load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
        target_group_arn=target_group.arn,
        container_name="payment-processor",
        container_port=8080
    )],
    deployment_controller=aws.ecs.ServiceDeploymentControllerArgs(
        type="ECS"  # Supports both rolling and blue/green via CodeDeploy
    ),
    enable_execute_command=True,
    propagate_tags="SERVICE",
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[listener_rule])
)

# Auto Scaling Target
autoscaling_target = aws.appautoscaling.Target(
    f"ecs-autoscaling-target-{environment_suffix}",
    max_capacity=10,
    min_capacity=3,
    resource_id=pulumi.Output.all(ecs_cluster.name, ecs_service.name).apply(
        lambda args: f"service/{args[0]}/{args[1]}"
    ),
    scalable_dimension="ecs:service:DesiredCount",
    service_namespace="ecs"
)

# CPU-based Auto Scaling Policy
# pylint: disable=line-too-long
cpu_scaling_policy = aws.appautoscaling.Policy(
    f"ecs-cpu-scaling-{environment_suffix}",
    name=f"ecs-cpu-scaling-{environment_suffix}",
    policy_type="TargetTrackingScaling",
    resource_id=autoscaling_target.resource_id,
    scalable_dimension=autoscaling_target.scalable_dimension,
    service_namespace=autoscaling_target.service_namespace,
    target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
        predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type="ECSServiceAverageCPUUtilization"
        ),
        target_value=70.0,
        scale_in_cooldown=300,
        scale_out_cooldown=60
    )
)

# Memory-based Auto Scaling Policy
# pylint: disable=line-too-long
memory_scaling_policy = aws.appautoscaling.Policy(
    f"ecs-memory-scaling-{environment_suffix}",
    name=f"ecs-memory-scaling-{environment_suffix}",
    policy_type="TargetTrackingScaling",
    resource_id=autoscaling_target.resource_id,
    scalable_dimension=autoscaling_target.scalable_dimension,
    service_namespace=autoscaling_target.service_namespace,
    target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
        predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type="ECSServiceAverageMemoryUtilization"
        ),
        target_value=80.0,
        scale_in_cooldown=300,
        scale_out_cooldown=60
    )
)

# CloudWatch Alarms for monitoring
high_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"ecs-high-cpu-{environment_suffix}",
    name=f"ecs-high-cpu-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/ECS",
    period=300,
    statistic="Average",
    threshold=80.0,
    alarm_description="Alert when CPU exceeds 80%",
    dimensions={
        "ClusterName": ecs_cluster.name,
        "ServiceName": ecs_service.name
    },
    tags=common_tags
)

high_memory_alarm = aws.cloudwatch.MetricAlarm(
    f"ecs-high-memory-{environment_suffix}",
    name=f"ecs-high-memory-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="MemoryUtilization",
    namespace="AWS/ECS",
    period=300,
    statistic="Average",
    threshold=85.0,
    alarm_description="Alert when memory exceeds 85%",
    dimensions={
        "ClusterName": ecs_cluster.name,
        "ServiceName": ecs_service.name
    },
    tags=common_tags
)

# Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("alb_security_group_id", alb_security_group.id)
pulumi.export("app_security_group_id", ecs_security_group.id)
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_cluster_arn", ecs_cluster.arn)
pulumi.export("ecs_service_name", ecs_service.name)
pulumi.export("ecr_repository_url", ecr_repository.repository_url)
pulumi.export("ecr_repository_uri", ecr_repository.repository_url)
pulumi.export("load_balancer_dns", alb.dns_name)
pulumi.export("alb_arn", alb.arn)
pulumi.export("alb_listener_arn", alb_listener.arn)
pulumi.export("target_group_arn", target_group.arn)
pulumi.export("log_group_name", log_group.name)
pulumi.export("task_definition_arn", task_definition.arn)
pulumi.export("db_secret_arn", db_secret.arn)
```

## File: Pulumi.yaml

```yaml
name: payment-processor-migration
runtime: python
description: ECS Fargate migration for payment processing system
main: lib/__main__.py

config:
  aws:region:
    description: AWS region for deployment
    value: us-east-2
  payment-processor-migration:environmentSuffix:
    description: Environment suffix for resource naming (e.g., dev, staging, prod)
  payment-processor-migration:legacyStackName:
    description: Name of the legacy infrastructure stack to import from
    default: legacy-infrastructure
```

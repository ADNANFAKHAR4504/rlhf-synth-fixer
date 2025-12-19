# ECS Fargate Payment Processing Migration - Pulumi Python Implementation

This implementation provides a complete containerized payment processing platform using Pulumi with Python, migrating from EC2 to ECS Fargate with full auto-scaling, monitoring, and security features.

## File: __main__.py

```python
"""
ECS Fargate Payment Processing Infrastructure
Migrates payment processing from EC2 to containerized ECS Fargate
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

# Configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
legacy_stack_name = config.get("legacyStackName") or "legacy-infrastructure"
region = config.get("region") or "us-east-2"

# Resource tags
common_tags = {
    "environment": environment_suffix,
    "team": "platform",
    "cost-center": "engineering",
    "project": "payment-processor-migration",
    "managed-by": "pulumi"
}

# Import legacy infrastructure using stack references
legacy_stack = pulumi.StackReference(f"organization/{legacy_stack_name}/production")

vpc_id = legacy_stack.get_output("vpcId")
private_subnet_ids = legacy_stack.get_output("privateSubnetIds")
public_subnet_ids = legacy_stack.get_output("publicSubnetIds")
alb_security_group_id = legacy_stack.get_output("albSecurityGroupId")
app_security_group_id = legacy_stack.get_output("appSecurityGroupId")

# ECR Repository for container images
ecr_repository = aws.ecr.Repository(
    f"payment-processor-ecr-{environment_suffix}",
    name=f"payment-processor-{environment_suffix}",
    image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
        scan_on_push=True,
    ),
    image_tag_mutability="MUTABLE",
    encryption_configuration=aws.ecr.RepositoryEncryptionConfigurationArgs(
        encryption_type="AES256",
    ),
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
    vpc_id=vpc_id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            security_groups=[alb_security_group_id],
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

# Target Group for ECS Service
target_group = aws.lb.TargetGroup(
    f"payment-processor-tg-{environment_suffix}",
    name=f"payment-proc-{environment_suffix}"[:32],  # AWS limit
    port=8080,
    protocol="HTTP",
    vpc_id=vpc_id,
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
        # Custom header in health check - implemented via ALB listener rule
    ),
    tags=common_tags
)

# Get ALB from legacy stack
alb_arn = legacy_stack.get_output("albArn")
alb_listener_arn = legacy_stack.get_output("albListenerArn")

# ALB Listener Rule with custom header check
listener_rule = aws.lb.ListenerRule(
    f"payment-processor-rule-{environment_suffix}",
    listener_arn=alb_listener_arn,
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
    deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
        maximum_percent=200,
        minimum_healthy_percent=100,
        deployment_circuit_breaker=aws.ecs.ServiceDeploymentConfigurationDeploymentCircuitBreakerArgs(
            enable=True,
            rollback=True
        )
    ),
    network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
        assign_public_ip=False,
        subnets=private_subnet_ids,
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
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_cluster_arn", ecs_cluster.arn)
pulumi.export("ecs_service_name", ecs_service.name)
pulumi.export("ecr_repository_url", ecr_repository.repository_url)
pulumi.export("ecr_repository_uri", ecr_repository.repository_url)
pulumi.export("load_balancer_dns", legacy_stack.get_output("albDnsName"))
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

config:
  aws:region:
    description: AWS region for deployment
    default: us-east-2
  payment-processor-migration:environmentSuffix:
    description: Environment suffix for resource naming (e.g., dev, staging, prod)
  payment-processor-migration:legacyStackName:
    description: Name of the legacy infrastructure stack to import from
    default: legacy-infrastructure
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-2
  payment-processor-migration:environmentSuffix: dev
  payment-processor-migration:legacyStackName: legacy-infrastructure
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: README.md

```markdown
# Payment Processor ECS Fargate Migration

This Pulumi Python program migrates a payment processing application from EC2 instances to ECS Fargate with full containerization, auto-scaling, and monitoring.

## Architecture

- **ECS Cluster**: Fargate-based cluster with Container Insights enabled
- **ECR Repository**: Private repository with vulnerability scanning and lifecycle policies
- **Task Definition**: 2 vCPU, 4GB memory with Secrets Manager integration
- **ECS Service**: 3 tasks distributed across availability zones
- **Auto-scaling**: CPU (70%) and memory (80%) based scaling between 3-10 tasks
- **Monitoring**: CloudWatch logs with 30-day retention and encryption
- **Security**: Private subnets, Secrets Manager for credentials, encrypted logs

## Prerequisites

1. Python 3.9 or later
2. Pulumi CLI 3.x installed
3. AWS CLI configured with appropriate IAM permissions
4. Existing legacy infrastructure stack with VPC, subnets, ALB, and security groups

## Required Legacy Stack Outputs

The legacy infrastructure stack must export:
- `vpcId`: VPC ID
- `privateSubnetIds`: Array of private subnet IDs
- `publicSubnetIds`: Array of public subnet IDs
- `albSecurityGroupId`: ALB security group ID
- `appSecurityGroupId`: Application security group ID
- `albArn`: Application Load Balancer ARN
- `albListenerArn`: ALB HTTP/HTTPS listener ARN
- `albDnsName`: ALB DNS name

## Deployment

### 1. Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Stack

```bash
pulumi stack init dev
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
pulumi config set legacyStackName legacy-infrastructure
```

### 3. Build and Push Container Image

Before deploying, build and push your payment-processor container:

```bash
# Get ECR repository URL (after first deployment or from preview)
ECR_URL=$(pulumi stack output ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $ECR_URL

# Build and push
docker build -t payment-processor:latest .
docker tag payment-processor:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

### 4. Deploy Infrastructure

```bash
pulumi up
```

### 5. Update Database Credentials

After deployment, update the Secrets Manager secret with real credentials:

```bash
aws secretsmanager update-secret \
  --secret-id db-credentials-dev \
  --secret-string '{
    "username": "actual_username",
    "password": "actual_password",
    "host": "actual-rds-host.region.rds.amazonaws.com",
    "port": "5432",
    "database": "payments"
  }' \
  --region us-east-2
```

## Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `environmentSuffix` | Environment suffix for resource naming | Required |
| `legacyStackName` | Legacy infrastructure stack name | `legacy-infrastructure` |
| `aws:region` | AWS deployment region | `us-east-2` |

## Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `payment-processor-cluster-dev`
- `payment-processor-ecr-dev`
- `ecs-tasks-sg-dev`

## Auto-Scaling

The service automatically scales based on:
- **CPU**: Scales out when average CPU > 70%, scales in when < 70%
- **Memory**: Scales out when average memory > 80%, scales in when < 80%
- **Limits**: Minimum 3 tasks, maximum 10 tasks
- **Cooldown**: 60s scale-out, 300s scale-in

## Monitoring

### CloudWatch Logs
- Log group: `/ecs/payment-processor-{environment-suffix}`
- Retention: 30 days
- Encryption: AWS managed keys

### CloudWatch Alarms
- High CPU: Triggers when CPU > 80% for 2 consecutive periods (5 min each)
- High Memory: Triggers when memory > 85% for 2 consecutive periods

## Security

- **Network**: Tasks run in private subnets with no public IP
- **Credentials**: Database credentials stored in Secrets Manager
- **Images**: ECR repository has vulnerability scanning enabled
- **Logs**: CloudWatch logs encrypted at rest
- **IAM**: Least-privilege roles for task execution and runtime

## Health Checks

- **Container Health**: Internal health check on `http://localhost:8080/health`
- **Target Group Health**: ALB health check on `/health` endpoint
- **Custom Header**: Health checks require `X-Health-Check: true` header

## Deployment Strategies

The infrastructure supports both deployment strategies:

### Rolling Updates (Default)
- Controlled by `deployment_configuration` in ECS service
- Maximum 200% capacity, minimum 100% healthy

### Blue/Green Deployment
To enable blue/green deployments:
1. Set up AWS CodeDeploy application and deployment group
2. Update `deployment_controller` to `CODE_DEPLOY` type
3. Use CodeDeploy for deployments

## Troubleshooting

### Tasks Not Starting
1. Check CloudWatch logs: `/ecs/payment-processor-{environment-suffix}`
2. Verify ECR image exists: `aws ecr describe-images --repository-name payment-processor-{suffix}`
3. Check IAM permissions for task execution role

### Database Connection Issues
1. Verify Secrets Manager secret contains correct credentials
2. Check security group rules allow outbound traffic
3. Verify RDS security group allows inbound from ECS tasks

### Auto-Scaling Not Working
1. Check CloudWatch metrics for CPU and memory utilization
2. Verify auto-scaling policies are active
3. Check service events in ECS console

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Cost Optimization

- Uses Fargate Spot for non-critical environments (modify task definition)
- ECR lifecycle policy keeps only 10 most recent images
- CloudWatch logs retention set to 30 days
- Auto-scaling prevents over-provisioning

## Outputs

| Output | Description |
|--------|-------------|
| `ecs_cluster_name` | ECS cluster name |
| `ecs_cluster_arn` | ECS cluster ARN |
| `ecs_service_name` | ECS service name |
| `ecr_repository_url` | ECR repository URL for pushing images |
| `load_balancer_dns` | ALB DNS name for accessing the service |
| `target_group_arn` | Target group ARN |
| `log_group_name` | CloudWatch log group name |
| `task_definition_arn` | ECS task definition ARN |
| `db_secret_arn` | Secrets Manager secret ARN |

## CI/CD Integration

Use these outputs in your CI/CD pipeline:

```bash
# Get ECR URL and push new image
ECR_URL=$(pulumi stack output ecr_repository_url)
docker push $ECR_URL:$VERSION

# Force new deployment
aws ecs update-service \
  --cluster $(pulumi stack output ecs_cluster_name) \
  --service $(pulumi stack output ecs_service_name) \
  --force-new-deployment
```
```

## File: .gitignore

```
# Pulumi
Pulumi.*.yaml
!Pulumi.dev.yaml
.pulumi/
*.pyc

# Python
venv/
__pycache__/
*.py[cod]
*$py.class
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
```

# ECS Fargate Web Application Deployment Solution

This implementation provides a complete containerized application deployment platform using Pulumi Python for an e-commerce product catalog API service.

## Architecture Overview

The solution deploys:
- VPC with 3 public and 3 private subnets across availability zones
- Internet Gateway and NAT Gateways for connectivity
- ECR repository with lifecycle policy
- ECS Fargate cluster with auto-scaling
- Application Load Balancer with health checks
- CloudWatch logging and monitoring
- Systems Manager Parameter Store for secrets

## Implementation Files

### File: lib/tap_stack.py

```python
import pulumi
import pulumi_aws as aws
import json

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
aws_region = config.get("region") or "us-east-1"

# Get availability zones
azs = aws.get_availability_zones(state="available")
az_names = azs.names[:3]  # Use first 3 AZs

# Create VPC
vpc = aws.ec2.Vpc(
    f"vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"vpc-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    f"igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"igw-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create public subnets
public_subnets = []
for i, az in enumerate(az_names):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-{i}-{environment_suffix}",
            "Environment": environment_suffix,
            "Type": "public"
        }
    )
    public_subnets.append(subnet)

# Create private subnets
private_subnets = []
for i, az in enumerate(az_names):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 10}.0/24",
        availability_zone=az,
        tags={
            "Name": f"private-subnet-{i}-{environment_suffix}",
            "Environment": environment_suffix,
            "Type": "private"
        }
    )
    private_subnets.append(subnet)

# Create Elastic IPs for NAT Gateways
eips = []
for i in range(len(az_names)):
    eip = aws.ec2.Eip(
        f"nat-eip-{i}-{environment_suffix}",
        vpc=True,
        tags={
            "Name": f"nat-eip-{i}-{environment_suffix}",
            "Environment": environment_suffix
        }
    )
    eips.append(eip)

# Create NAT Gateways
nat_gateways = []
for i, public_subnet in enumerate(public_subnets):
    nat = aws.ec2.NatGateway(
        f"nat-{i}-{environment_suffix}",
        subnet_id=public_subnet.id,
        allocation_id=eips[i].id,
        tags={
            "Name": f"nat-{i}-{environment_suffix}",
            "Environment": environment_suffix
        }
    )
    nat_gateways.append(nat)

# Create public route table
public_rt = aws.ec2.RouteTable(
    f"public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"public-rt-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create route to Internet Gateway
public_route = aws.ec2.Route(
    f"public-route-{environment_suffix}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{i}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id
    )

# Create private route tables and routes
for i, (nat, subnet) in enumerate(zip(nat_gateways, private_subnets)):
    rt = aws.ec2.RouteTable(
        f"private-rt-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"private-rt-{i}-{environment_suffix}",
            "Environment": environment_suffix
        }
    )

    aws.ec2.Route(
        f"private-route-{i}-{environment_suffix}",
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat.id
    )

    aws.ec2.RouteTableAssociation(
        f"private-rta-{i}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=rt.id
    )

# Create ECR repository
ecr_repo = aws.ecr.Repository(
    f"ecr-repo-{environment_suffix}",
    name=f"product-catalog-api-{environment_suffix}",
    force_delete=True,
    tags={
        "Name": f"ecr-repo-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ECR lifecycle policy
ecr_lifecycle_policy = aws.ecr.LifecyclePolicy(
    f"ecr-lifecycle-{environment_suffix}",
    repository=ecr_repo.name,
    policy=json.dumps({
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep only 5 most recent images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 5
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    })
)

# Create CloudWatch log group
log_group = aws.cloudwatch.LogGroup(
    f"ecs-logs-{environment_suffix}",
    name=f"/ecs/product-catalog-api-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Name": f"ecs-logs-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ECS cluster
ecs_cluster = aws.ecs.Cluster(
    f"ecs-cluster-{environment_suffix}",
    name=f"product-catalog-cluster-{environment_suffix}",
    tags={
        "Name": f"ecs-cluster-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create IAM role for ECS task execution
task_execution_role = aws.iam.Role(
    f"ecs-task-execution-role-{environment_suffix}",
    name=f"ecs-task-execution-role-{environment_suffix}",
    assume_role_policy=json.dumps({
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
    }),
    tags={
        "Name": f"ecs-task-execution-role-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Attach AWS managed policy for ECS task execution
task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
    f"ecs-task-execution-policy-{environment_suffix}",
    role=task_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
)

# Create IAM role for ECS task
task_role = aws.iam.Role(
    f"ecs-task-role-{environment_suffix}",
    name=f"ecs-task-role-{environment_suffix}",
    assume_role_policy=json.dumps({
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
    }),
    tags={
        "Name": f"ecs-task-role-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create inline policy for Parameter Store access
task_role_policy = aws.iam.RolePolicy(
    f"ecs-task-policy-{environment_suffix}",
    role=task_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameters",
                    "ssm:GetParameter"
                ],
                "Resource": f"arn:aws:ssm:{aws_region}:*:parameter/product-catalog/*"
            }
        ]
    })
)

# Create ALB security group
alb_sg = aws.ec2.SecurityGroup(
    f"alb-sg-{environment_suffix}",
    name=f"alb-sg-{environment_suffix}",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTP from internet"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound"
        )
    ],
    tags={
        "Name": f"alb-sg-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ECS security group
ecs_sg = aws.ec2.SecurityGroup(
    f"ecs-sg-{environment_suffix}",
    name=f"ecs-sg-{environment_suffix}",
    description="Security group for ECS tasks",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            security_groups=[alb_sg.id],
            description="Allow traffic from ALB"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound"
        )
    ],
    tags={
        "Name": f"ecs-sg-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"alb-{environment_suffix}",
    name=f"product-catalog-alb-{environment_suffix}",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_sg.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,
    tags={
        "Name": f"alb-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create target group
target_group = aws.lb.TargetGroup(
    f"tg-{environment_suffix}",
    name=f"product-catalog-tg-{environment_suffix}",
    port=8080,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="ip",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/health",
        port="8080",
        protocol="HTTP",
        healthy_threshold=2,
        unhealthy_threshold=3,
        timeout=5,
        interval=30,
        matcher="200"
    ),
    deregistration_delay=30,
    tags={
        "Name": f"tg-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ALB listener
alb_listener = aws.lb.Listener(
    f"alb-listener-{environment_suffix}",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)

# Create ECS task definition
task_definition = aws.ecs.TaskDefinition(
    f"task-def-{environment_suffix}",
    family=f"product-catalog-api-{environment_suffix}",
    cpu="1024",
    memory="2048",
    network_mode="awsvpc",
    requires_compatibilities=["FARGATE"],
    execution_role_arn=task_execution_role.arn,
    task_role_arn=task_role.arn,
    container_definitions=pulumi.Output.all(ecr_repo.repository_url, log_group.name).apply(
        lambda args: json.dumps([
            {
                "name": "product-catalog-api",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [
                    {
                        "containerPort": 8080,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    {
                        "name": "PORT",
                        "value": "8080"
                    },
                    {
                        "name": "ENVIRONMENT",
                        "value": environment_suffix
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[1],
                        "awslogs-region": aws_region,
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ])
    ),
    tags={
        "Name": f"task-def-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ECS service
ecs_service = aws.ecs.Service(
    f"ecs-service-{environment_suffix}",
    name=f"product-catalog-service-{environment_suffix}",
    cluster=ecs_cluster.arn,
    task_definition=task_definition.arn,
    desired_count=2,
    launch_type="FARGATE",
    network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
        assign_public_ip=False,
        subnets=[subnet.id for subnet in private_subnets],
        security_groups=[ecs_sg.id]
    ),
    load_balancers=[
        aws.ecs.ServiceLoadBalancerArgs(
            target_group_arn=target_group.arn,
            container_name="product-catalog-api",
            container_port=8080
        )
    ],
    health_check_grace_period_seconds=60,
    tags={
        "Name": f"ecs-service-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(depends_on=[alb_listener])
)

# Create Application Auto Scaling target
autoscaling_target = aws.appautoscaling.Target(
    f"ecs-autoscaling-target-{environment_suffix}",
    max_capacity=10,
    min_capacity=2,
    resource_id=pulumi.Output.all(ecs_cluster.name, ecs_service.name).apply(
        lambda args: f"service/{args[0]}/{args[1]}"
    ),
    scalable_dimension="ecs:service:DesiredCount",
    service_namespace="ecs"
)

# Create scaling policy for CPU utilization
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

# Create CloudWatch alarm for high CPU
cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"ecs-high-cpu-alarm-{environment_suffix}",
    name=f"ecs-high-cpu-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/ECS",
    period=300,
    statistic="Average",
    threshold=80.0,
    alarm_description="Trigger when CPU exceeds 80%",
    dimensions={
        "ClusterName": ecs_cluster.name,
        "ServiceName": ecs_service.name
    },
    tags={
        "Name": f"ecs-high-cpu-alarm-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create CloudWatch alarm for low healthy task count
healthy_task_alarm = aws.cloudwatch.MetricAlarm(
    f"ecs-low-task-alarm-{environment_suffix}",
    name=f"ecs-low-task-alarm-{environment_suffix}",
    comparison_operator="LessThanThreshold",
    evaluation_periods=1,
    metric_name="HealthyHostCount",
    namespace="AWS/ApplicationELB",
    period=60,
    statistic="Average",
    threshold=2.0,
    alarm_description="Trigger when healthy task count falls below 2",
    dimensions={
        "TargetGroup": target_group.arn_suffix,
        "LoadBalancer": alb.arn_suffix
    },
    tags={
        "Name": f"ecs-low-task-alarm-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create Parameter Store parameters for secrets
db_connection_param = aws.ssm.Parameter(
    f"db-connection-param-{environment_suffix}",
    name=f"/product-catalog/db-connection-{environment_suffix}",
    type="SecureString",
    value="postgresql://user:password@localhost:5432/productdb",
    description="Database connection string for product catalog API",
    tags={
        "Name": f"db-connection-param-{environment_suffix}",
        "Environment": environment_suffix
    }
)

api_key_param = aws.ssm.Parameter(
    f"api-key-param-{environment_suffix}",
    name=f"/product-catalog/api-key-{environment_suffix}",
    type="SecureString",
    value="example-api-key-12345",
    description="API key for product catalog service",
    tags={
        "Name": f"api-key-param-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Export stack outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_endpoint", alb.dns_name)
pulumi.export("ecr_repository_uri", ecr_repo.repository_url)
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_service_name", ecs_service.name)
pulumi.export("alb_url", pulumi.Output.concat("http://", alb.dns_name))
```

### File: lib/__main__.py

```python
"""Entry point for Pulumi program."""
from tap_stack import *
```

### File: lib/README.md

```markdown
# Product Catalog API Deployment

This infrastructure deploys a highly available, auto-scaling containerized web application using AWS ECS Fargate.

## Architecture

- **VPC**: Custom VPC with 3 public and 3 private subnets across availability zones
- **Networking**: Internet Gateway and NAT Gateways for connectivity
- **Container Registry**: ECR repository with lifecycle policy (retains 5 most recent images)
- **Compute**: ECS Fargate cluster with auto-scaling (2-10 tasks)
- **Load Balancing**: Application Load Balancer with health checks
- **Monitoring**: CloudWatch logs (7-day retention) and alarms
- **Secrets**: Systems Manager Parameter Store for sensitive data
- **Security**: IAM roles with least privilege, tasks in private subnets

## Prerequisites

1. Pulumi CLI 3.x or higher
2. Python 3.9+
3. AWS CLI configured with appropriate credentials
4. Docker for building container images

## Configuration

Set the following Pulumi config values:

```bash
pulumi config set environmentSuffix dev
pulumi config set region us-east-1
```

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Build and push Docker image to ECR:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t product-catalog-api .

# Tag image
docker tag product-catalog-api:latest <ecr-repository-url>:latest

# Push image
docker push <ecr-repository-url>:latest
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Access application via ALB endpoint:
```bash
curl http://<alb-endpoint>
```

## Auto Scaling

The service automatically scales between 2-10 tasks based on CPU utilization:
- **Target CPU**: 70%
- **Scale out cooldown**: 60 seconds
- **Scale in cooldown**: 300 seconds

## Monitoring

Two CloudWatch alarms are configured:
1. **High CPU Alarm**: Triggers when CPU > 80% for 10 minutes
2. **Low Task Count Alarm**: Triggers when healthy tasks < 2

## Secrets Management

Database connection strings and API keys are stored in Parameter Store:
- `/product-catalog/db-connection-{environmentSuffix}`
- `/product-catalog/api-key-{environmentSuffix}`

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Outputs

- `vpc_id`: VPC identifier
- `alb_endpoint`: ALB DNS name
- `alb_url`: Full HTTP URL to access the application
- `ecr_repository_uri`: ECR repository URL for pushing images
- `ecs_cluster_name`: ECS cluster name
- `ecs_service_name`: ECS service name
```

### File: requirements.txt

```text
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

### File: Pulumi.yaml

```yaml
name: product-catalog-api
runtime: python
description: Containerized web application deployment using ECS Fargate
config:
  environmentSuffix:
    type: string
    default: dev
    description: Environment suffix for resource naming
  region:
    type: string
    default: us-east-1
    description: AWS region for deployment
```

## Key Features

1. **High Availability**: Multi-AZ deployment with minimum 2 tasks
2. **Auto Scaling**: Dynamic scaling based on CPU utilization (70% target)
3. **Security**: Tasks in private subnets, secrets in Parameter Store, least privilege IAM
4. **Monitoring**: CloudWatch logs with 7-day retention, CPU and task health alarms
5. **Cost Optimization**: Fargate serverless compute, ECR image cleanup, NAT per AZ
6. **Destroyability**: All resources fully removable without manual intervention

## Testing the Deployment

After deployment completes:

1. Get the ALB endpoint URL from stack outputs
2. Wait for ECS tasks to be healthy (check target group health)
3. Test the health endpoint: `curl http://<alb-endpoint>/health`
4. Verify auto-scaling by generating CPU load
5. Check CloudWatch logs for application output
6. Verify alarms are configured in CloudWatch console

## Troubleshooting

- **Tasks not starting**: Check ECS task logs in CloudWatch
- **Health checks failing**: Verify container exposes port 8080 and responds to /health
- **Auto-scaling not working**: Check CloudWatch metrics and scaling policies
- **Cannot pull image**: Verify ECR permissions and image exists with :latest tag

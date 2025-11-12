# E-commerce Flask API Infrastructure with Pulumi Python

This implementation creates a production-ready infrastructure for deploying a containerized Flask API on AWS ECS Fargate with high availability, auto-scaling, and comprehensive monitoring.

## Architecture Overview

The infrastructure spans 2 availability zones and includes:
- VPC with public and private subnets
- ECS Fargate cluster for containerized Flask API
- Application Load Balancer with HTTPS
- RDS Aurora PostgreSQL cluster (writer + reader)
- ECR repository for container images
- Auto-scaling based on CPU utilization
- CloudWatch logging and monitoring
- Secrets Manager for database credentials

## File: __main__.py

```python
"""
Main Pulumi program for deploying Flask API infrastructure on AWS ECS Fargate.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get Pulumi configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()

# Define common tags for all resources
tags = {
    "Environment": "production",
    "Project": "ecommerce-api",
    "ManagedBy": "Pulumi"
}

# Create the infrastructure stack
stack = TapStack(
    name="ecommerce-api-stack",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=tags
    )
)

# Export important outputs
pulumi.export("alb_dns_name", stack.alb_dns_name)
pulumi.export("ecr_repository_uri", stack.ecr_repository_uri)
pulumi.export("rds_cluster_endpoint", stack.rds_cluster_endpoint)
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("ecs_cluster_name", stack.ecs_cluster_name)
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main infrastructure stack for the e-commerce Flask API.
Creates VPC, ECS Fargate, ALB, RDS Aurora, and all supporting resources.
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying the deployment environment.
        tags (Optional[dict]): Default tags to apply to all resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main infrastructure stack for deploying Flask API on ECS Fargate.

    Creates a complete production-ready infrastructure including:
    - VPC with public and private subnets across 2 AZs
    - ECS Fargate cluster and service
    - Application Load Balancer with HTTPS
    - RDS Aurora PostgreSQL cluster
    - ECR repository for container images
    - Auto-scaling configuration
    - CloudWatch logging
    - Security groups and IAM roles

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
        opts (ResourceOptions): Pulumi options.
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

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"flask-api-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"flask-api-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"flask-api-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"flask-api-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets in 2 AZs
        public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"flask-api-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"flask-api-public-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)

        # Create private subnets in 2 AZs
        private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"flask-api-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.tags, "Name": f"flask-api-private-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Create Elastic IPs for NAT Gateways
        eips = []
        for i in range(2):
            eip = aws.ec2.Eip(
                f"flask-api-nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, "Name": f"flask-api-nat-eip-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            eips.append(eip)

        # Create NAT Gateways in public subnets
        nat_gateways = []
        for i in range(2):
            nat = aws.ec2.NatGateway(
                f"flask-api-nat-{i+1}-{self.environment_suffix}",
                allocation_id=eips[i].id,
                subnet_id=public_subnets[i].id,
                tags={**self.tags, "Name": f"flask-api-nat-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[igw])
            )
            nat_gateways.append(nat)

        # Create public route table
        public_rt = aws.ec2.RouteTable(
            f"flask-api-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"flask-api-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        aws.ec2.Route(
            f"flask-api-public-route-{self.environment_suffix}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"flask-api-public-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route tables and routes to NAT Gateways
        for i, subnet in enumerate(private_subnets):
            private_rt = aws.ec2.RouteTable(
                f"flask-api-private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"flask-api-private-rt-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"flask-api-private-route-{i+1}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateways[i].id,
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"flask-api-private-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create ECR repository for Flask API
        self.ecr_repository = aws.ecr.Repository(
            f"flask-api-repo-{self.environment_suffix}",
            name=f"flask-api-{self.environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            image_tag_mutability="MUTABLE",
            tags={**self.tags, "Name": f"flask-api-repo-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Security Group for ALB
        alb_sg = aws.ec2.SecurityGroup(
            f"flask-api-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Flask API ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS inbound"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP inbound"
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
            tags={**self.tags, "Name": f"flask-api-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Security Group for ECS tasks
        ecs_sg = aws.ec2.SecurityGroup(
            f"flask-api-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Flask API ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5000,
                    to_port=5000,
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB on port 5000"
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
            tags={**self.tags, "Name": f"flask-api-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Security Group for RDS
        rds_sg = aws.ec2.SecurityGroup(
            f"flask-api-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Flask API RDS Aurora",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[ecs_sg.id],
                    description="Allow PostgreSQL from ECS tasks"
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
            tags={**self.tags, "Name": f"flask-api-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create DB Subnet Group
        db_subnet_group = aws.rds.SubnetGroup(
            f"flask-api-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={**self.tags, "Name": f"flask-api-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Secrets Manager secret for database password
        db_password_secret = aws.secretsmanager.Secret(
            f"flask-api-db-password-{self.environment_suffix}",
            name=f"flask-api-db-password-{self.environment_suffix}",
            description="Database password for Flask API RDS Aurora cluster",
            tags={**self.tags, "Name": f"flask-api-db-password-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Generate and store a random password
        import random
        import string
        db_password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        db_password_version = aws.secretsmanager.SecretVersion(
            f"flask-api-db-password-version-{self.environment_suffix}",
            secret_id=db_password_secret.id,
            secret_string=db_password,
            opts=ResourceOptions(parent=self)
        )

        # Create RDS Aurora PostgreSQL cluster
        rds_cluster = aws.rds.Cluster(
            f"flask-api-aurora-{self.environment_suffix}",
            cluster_identifier=f"flask-api-aurora-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.4",
            database_name="flaskapi",
            master_username="apiuser",
            master_password=db_password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            skip_final_snapshot=True,
            apply_immediately=True,
            tags={**self.tags, "Name": f"flask-api-aurora-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[db_password_version])
        )

        # Create Aurora cluster instances (writer + reader)
        cluster_instances = []
        for i in range(2):
            instance_role = "writer" if i == 0 else "reader"
            instance = aws.rds.ClusterInstance(
                f"flask-api-aurora-instance-{i+1}-{self.environment_suffix}",
                identifier=f"flask-api-aurora-instance-{i+1}-{self.environment_suffix}",
                cluster_identifier=rds_cluster.id,
                instance_class="db.t3.medium",
                engine=rds_cluster.engine,
                engine_version=rds_cluster.engine_version,
                publicly_accessible=False,
                tags={**self.tags, "Name": f"flask-api-aurora-{instance_role}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            cluster_instances.append(instance)

        # Create CloudWatch Log Group for ECS
        ecs_log_group = aws.cloudwatch.LogGroup(
            f"flask-api-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/flask-api-{self.environment_suffix}",
            retention_in_days=7,
            tags={**self.tags, "Name": f"flask-api-ecs-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for ALB
        alb_log_group = aws.cloudwatch.LogGroup(
            f"flask-api-alb-logs-{self.environment_suffix}",
            name=f"/aws/alb/flask-api-{self.environment_suffix}",
            retention_in_days=7,
            tags={**self.tags, "Name": f"flask-api-alb-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task execution
        ecs_task_execution_role = aws.iam.Role(
            f"flask-api-ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"flask-api-ecs-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"flask-api-ecs-execution-policy-{self.environment_suffix}",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Add policy for Secrets Manager access
        secrets_policy = aws.iam.RolePolicy(
            f"flask-api-secrets-policy-{self.environment_suffix}",
            role=ecs_task_execution_role.id,
            policy=db_password_secret.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": arn
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task
        ecs_task_role = aws.iam.Role(
            f"flask-api-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"flask-api-ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ECS cluster
        ecs_cluster = aws.ecs.Cluster(
            f"flask-api-cluster-{self.environment_suffix}",
            name=f"flask-api-cluster-{self.environment_suffix}",
            tags={**self.tags, "Name": f"flask-api-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Application Load Balancer
        alb = aws.lb.LoadBalancer(
            f"flask-api-alb-{self.environment_suffix}",
            name=f"flask-api-alb-{self.environment_suffix}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in public_subnets],
            security_groups=[alb_sg.id],
            tags={**self.tags, "Name": f"flask-api-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Target Group
        target_group = aws.lb.TargetGroup(
            f"flask-api-tg-{self.environment_suffix}",
            name=f"flask-api-tg-{self.environment_suffix}",
            port=5000,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200"
            ),
            tags={**self.tags, "Name": f"flask-api-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Note: For HTTPS, you would need to have an ACM certificate
        # Here we create an HTTP listener for demonstration
        # In production, you should create an HTTPS listener with certificate_arn
        listener = aws.lb.Listener(
            f"flask-api-listener-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )],
            tags={**self.tags, "Name": f"flask-api-listener-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # For HTTPS (uncomment when you have an ACM certificate):
        # certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"
        # https_listener = aws.lb.Listener(
        #     f"flask-api-https-listener-{self.environment_suffix}",
        #     load_balancer_arn=alb.arn,
        #     port=443,
        #     protocol="HTTPS",
        #     ssl_policy="ELBSecurityPolicy-2016-08",
        #     certificate_arn=certificate_arn,
        #     default_actions=[aws.lb.ListenerDefaultActionArgs(
        #         type="forward",
        #         target_group_arn=target_group.arn
        #     )],
        #     tags={**self.tags, "Name": f"flask-api-https-listener-{self.environment_suffix}"},
        #     opts=ResourceOptions(parent=self)
        # )

        # Create ECS Task Definition
        task_definition = aws.ecs.TaskDefinition(
            f"flask-api-task-{self.environment_suffix}",
            family=f"flask-api-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",  # 1 vCPU
            memory="2048",  # 2GB
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=Output.all(
                self.ecr_repository.repository_url,
                ecs_log_group.name,
                rds_cluster.endpoint,
                db_password_secret.arn
            ).apply(lambda args: json.dumps([{
                "name": "flask-api",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 5000,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DB_HOST", "value": args[2]},
                    {"name": "DB_PORT", "value": "5432"},
                    {"name": "DB_NAME", "value": "flaskapi"},
                    {"name": "DB_USER", "value": "apiuser"}
                ],
                "secrets": [{
                    "name": "DB_PASSWORD",
                    "valueFrom": args[3]
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[1],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "flask-api"
                    }
                }
            }])),
            tags={**self.tags, "Name": f"flask-api-task-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[ecs_task_execution_role, ecs_task_role])
        )

        # Create ECS Service
        ecs_service = aws.ecs.Service(
            f"flask-api-service-{self.environment_suffix}",
            name=f"flask-api-service-{self.environment_suffix}",
            cluster=ecs_cluster.arn,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="flask-api",
                container_port=5000
            )],
            tags={**self.tags, "Name": f"flask-api-service-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[listener])
        )

        # Create Auto Scaling Target
        scaling_target = aws.appautoscaling.Target(
            f"flask-api-scaling-target-{self.environment_suffix}",
            service_namespace="ecs",
            resource_id=Output.concat("service/", ecs_cluster.name, "/", ecs_service.name),
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=2,
            max_capacity=10,
            opts=ResourceOptions(parent=self)
        )

        # Create Auto Scaling Policy based on CPU utilization
        scaling_policy = aws.appautoscaling.Policy(
            f"flask-api-scaling-policy-{self.environment_suffix}",
            name=f"flask-api-cpu-scaling-{self.environment_suffix}",
            service_namespace=scaling_target.service_namespace,
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=ResourceOptions(parent=self)
        )

        # Note: Route53 record creation requires a hosted zone
        # Uncomment when you have a hosted zone:
        # hosted_zone = aws.route53.get_zone(name="example.com")
        # route53_record = aws.route53.Record(
        #     f"flask-api-dns-{self.environment_suffix}",
        #     zone_id=hosted_zone.zone_id,
        #     name="api.example.com",
        #     type="A",
        #     aliases=[aws.route53.RecordAliasArgs(
        #         name=alb.dns_name,
        #         zone_id=alb.zone_id,
        #         evaluate_target_health=True
        #     )],
        #     opts=ResourceOptions(parent=self)
        # )

        # Store outputs
        self.vpc_id = self.vpc.id
        self.alb_dns_name = alb.dns_name
        self.ecr_repository_uri = self.ecr_repository.repository_url
        self.rds_cluster_endpoint = rds_cluster.endpoint
        self.ecs_cluster_name = ecs_cluster.name

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc_id,
            "alb_dns_name": self.alb_dns_name,
            "ecr_repository_uri": self.ecr_repository_uri,
            "rds_cluster_endpoint": self.rds_cluster_endpoint,
            "ecs_cluster_name": self.ecs_cluster_name
        })
```

## Deployment Instructions

### Prerequisites

1. Install Pulumi CLI (version 3.x or later)
2. Install Python 3.9 or later
3. Configure AWS credentials
4. Install Python dependencies:

```bash
pip install pulumi pulumi-aws
```

### Deployment Steps

1. Initialize Pulumi stack:

```bash
pulumi stack init dev
```

2. Set configuration (optional):

```bash
pulumi config set environmentSuffix dev
```

3. Preview the infrastructure:

```bash
pulumi preview
```

4. Deploy the infrastructure:

```bash
pulumi up
```

5. After deployment, get the outputs:

```bash
pulumi stack output alb_dns_name
pulumi stack output ecr_repository_uri
pulumi stack output rds_cluster_endpoint
```

### Building and Pushing Docker Image

1. Authenticate with ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(pulumi stack output ecr_repository_uri | cut -d'/' -f1)
```

2. Build your Flask API Docker image:

```bash
docker build -t flask-api .
```

3. Tag and push to ECR:

```bash
docker tag flask-api:latest $(pulumi stack output ecr_repository_uri):latest
docker push $(pulumi stack output ecr_repository_uri):latest
```

4. Update ECS service to use the new image (ECS will automatically pull the latest image on next deployment).

### HTTPS Configuration

To enable HTTPS:

1. Request or import an ACM certificate for your domain in us-east-1
2. Uncomment the HTTPS listener code in `tap_stack.py`
3. Update the certificate ARN in the code
4. Uncomment the Route53 record creation code
5. Update the hosted zone name
6. Redeploy with `pulumi up`

### Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Key Features

1. **High Availability**: Resources distributed across 2 availability zones
2. **Auto-Scaling**: ECS service scales between 2-10 tasks based on CPU utilization
3. **Security**: Private subnets for ECS and RDS, security groups restrict access, secrets in Secrets Manager
4. **Monitoring**: CloudWatch logs with 7-day retention for ECS and ALB
5. **Serverless Compute**: Fargate eliminates server management
6. **Database HA**: Aurora PostgreSQL with writer and reader instances
7. **Container Registry**: Private ECR repository with image scanning
8. **Proper Naming**: All resources include environmentSuffix for uniqueness

## Notes

- The implementation uses HTTP for the ALB listener by default. In production, configure HTTPS with an ACM certificate.
- Route53 DNS record creation is commented out. Uncomment and configure your hosted zone when ready.
- Database password is generated randomly and stored in Secrets Manager.
- NAT Gateways enable outbound internet access for containers in private subnets.
- All resources are tagged with Environment='production' and Project='ecommerce-api'.
- The infrastructure is fully destroyable with no Retain policies.
# Pulumi Python Implementation - E-Commerce Product Catalog Infrastructure

I'll create a complete Pulumi infrastructure for the e-commerce product catalog API with ECS Fargate, RDS PostgreSQL, and all the required components.

## File: __main__.py

```python
import pulumi
import pulumi_aws as aws
from tap_stack import TapStack

# Create the infrastructure stack
stack = TapStack("tap")

# Export the important outputs
pulumi.export("alb_dns_name", stack.alb.dns_name)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_name", stack.ecs_cluster.name)
```

## File: tap_stack.py

```python
import pulumi
import pulumi_aws as aws
import json

class TapStack:
    def __init__(self, name, environment_suffix="prod"):
        self.environment_suffix = environment_suffix

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={"Name": f"igw-{environment_suffix}"}
        )

        # Create public subnets (2)
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{i}-{environment_suffix}"}
            )
            self.public_subnets.append(subnet)

        # Create private subnets (4)
        self.private_subnets = []
        for i in range(4):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i % 2],
                tags={"Name": f"private-subnet-{i}-{environment_suffix}"}
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={"Name": f"public-rt-{environment_suffix}"}
        )

        # Route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Create NAT Gateways (one per AZ)
        self.nat_gateways = []
        for i in range(2):
            eip = aws.ec2.Eip(
                f"nat-eip-{i}-{environment_suffix}",
                vpc=True,
                tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
            )

            nat = aws.ec2.NatGateway(
                f"nat-{i}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=self.public_subnets[i].id,
                tags={"Name": f"nat-{i}-{environment_suffix}"}
            )
            self.nat_gateways.append(nat)

        # Create private route tables
        for i in range(2):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                tags={"Name": f"private-rt-{i}-{environment_suffix}"}
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{i}-{environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateways[i].id
            )

            # Associate private subnets with private route table
            for j in range(2):
                subnet_idx = i * 2 + j
                aws.ec2.RouteTableAssociation(
                    f"private-rta-{subnet_idx}-{environment_suffix}",
                    subnet_id=self.private_subnets[subnet_idx].id,
                    route_table_id=private_rt.id
                )

        # Create ECR Repository
        self.ecr_repository = aws.ecr.Repository(
            f"ecr-repo-{environment_suffix}",
            name=f"product-catalog-{environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            tags={"Name": f"ecr-repo-{environment_suffix}"}
        )

        # ECR Lifecycle Policy (keep last 5 images)
        aws.ecr.LifecyclePolicy(
            f"ecr-lifecycle-{environment_suffix}",
            repository=self.ecr_repository.name,
            policy=json.dumps({
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep only 5 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            })
        )

        # Create RDS Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets[:2]],
            tags={"Name": f"db-subnet-group-{environment_suffix}"}
        )

        # Security Group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL",
            tags={"Name": f"rds-sg-{environment_suffix}"}
        )

        # Security Group for ECS Tasks
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"ecs-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={"Name": f"ecs-sg-{environment_suffix}"}
        )

        # Security Group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={"Name": f"alb-sg-{environment_suffix}"}
        )

        # Allow ALB to reach ECS tasks on port 5000
        aws.ec2.SecurityGroupRule(
            f"ecs-from-alb-{environment_suffix}",
            type="ingress",
            from_port=5000,
            to_port=5000,
            protocol="tcp",
            source_security_group_id=self.alb_sg.id,
            security_group_id=self.ecs_sg.id
        )

        # Allow ECS tasks to reach RDS on port 5432
        aws.ec2.SecurityGroupRule(
            f"rds-from-ecs-{environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.ecs_sg.id,
            security_group_id=self.rds_sg.id
        )

        # Create Secrets Manager secret for database credentials
        self.db_secret = aws.secretsmanager.Secret(
            f"db-secret-{environment_suffix}",
            name=f"product-catalog-db-{environment_suffix}",
            description="Database credentials for product catalog",
            tags={"Name": f"db-secret-{environment_suffix}"}
        )

        # Store initial secret value
        db_password = "ChangeMe123!"  # In production, use a random password
        db_username = "postgres"

        # Create RDS instance
        self.rds_instance = aws.rds.Instance(
            f"rds-{environment_suffix}",
            identifier=f"product-catalog-{environment_suffix}",
            engine="postgres",
            engine_version="14.7",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_encrypted=True,
            db_name="productcatalog",
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            multi_az=True,
            skip_final_snapshot=True,
            publicly_accessible=False,
            tags={"Name": f"rds-{environment_suffix}"}
        )

        # Update secret with connection string
        self.rds_instance.endpoint.apply(
            lambda endpoint: aws.secretsmanager.SecretVersion(
                f"db-secret-version-{environment_suffix}",
                secret_id=self.db_secret.id,
                secret_string=json.dumps({
                    "username": db_username,
                    "password": db_password,
                    "engine": "postgres",
                    "host": endpoint.split(":")[0],
                    "port": 5432,
                    "dbname": "productcatalog",
                    "connection_string": f"postgresql://{db_username}:{db_password}@{endpoint.split(':')[0]}:5432/productcatalog"
                })
            )
        )

        # Create CloudWatch Log Group
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecs-log-group-{environment_suffix}",
            name=f"/ecs/product-catalog-{environment_suffix}",
            retention_in_days=7,
            tags={"Name": f"ecs-log-group-{environment_suffix}"}
        )

        # Create ECS Cluster with Container Insights
        self.ecs_cluster = aws.ecs.Cluster(
            f"ecs-cluster-{environment_suffix}",
            name=f"product-catalog-{environment_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )],
            tags={"Name": f"ecs-cluster-{environment_suffix}"}
        )

        # Create IAM Role for ECS Task Execution
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"ecs-task-execution-role-{environment_suffix}"}
        )

        # Attach policies to execution role
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Add Secrets Manager access to execution role
        aws.iam.RolePolicy(
            f"ecs-secrets-policy-{environment_suffix}",
            role=self.task_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "kms:Decrypt"
                    ],
                    "Resource": "*"
                }]
            })
        )

        # Create IAM Role for ECS Task
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"ecs-task-role-{environment_suffix}"}
        )

        # Create ECS Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"task-def-{environment_suffix}",
            family=f"product-catalog-{environment_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=pulumi.Output.all(
                self.ecr_repository.repository_url,
                self.db_secret.arn,
                self.log_group.name
            ).apply(lambda args: json.dumps([{
                "name": "product-catalog",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 5000,
                    "protocol": "tcp"
                }],
                "secrets": [{
                    "name": "DATABASE_URL",
                    "valueFrom": args[1]
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[2],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }])),
            tags={"Name": f"task-def-{environment_suffix}"}
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment_suffix}",
            name=f"product-catalog-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            tags={"Name": f"alb-{environment_suffix}"}
        )

        # Create Target Group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{environment_suffix}",
            name=f"product-catalog-{environment_suffix}",
            port=5000,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                port="5000",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30
            ),
            tags={"Name": f"tg-{environment_suffix}"}
        )

        # Create ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"alb-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn
            )]
        )

        # Create ECS Service
        self.ecs_service = aws.ecs.Service(
            f"ecs-service-{environment_suffix}",
            name=f"product-catalog-{environment_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_sg.id]
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=self.target_group.arn,
                container_name="product-catalog",
                container_port=5000
            )],
            tags={"Name": f"ecs-service-{environment_suffix}"}
        )

        # Create Auto Scaling Target
        self.autoscaling_target = aws.appautoscaling.Target(
            f"ecs-autoscaling-target-{environment_suffix}",
            max_capacity=10,
            min_capacity=2,
            resource_id=pulumi.Output.concat("service/", self.ecs_cluster.name, "/", self.ecs_service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        # Create Auto Scaling Policy
        self.autoscaling_policy = aws.appautoscaling.Policy(
            f"ecs-autoscaling-policy-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )
```

## File: requirements.txt

```
pulumi>=3.0.0
pulumi-aws>=6.0.0
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: python
description: E-commerce Product Catalog Infrastructure with ECS Fargate and RDS
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

4. Deploy infrastructure:
```bash
pulumi up
```

5. Build and push Docker image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-repository-url>
docker build -t product-catalog .
docker tag product-catalog:latest <ecr-repository-url>:latest
docker push <ecr-repository-url>:latest
```

6. Access the application using the ALB DNS name output.

The infrastructure includes all required components with proper security configurations, auto-scaling, monitoring, and high availability.

# Fraud Detection API Infrastructure - CDKTF Python Implementation

This implementation provides a complete fraud detection API infrastructure using CDKTF with Python.

## File: main.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class FraudDetectionStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Provider
        AwsProvider(self, "AWS", region="us-east-1")

        # VPC
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"fraud-vpc-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"fraud-igw-{environment_suffix}"}
        )

        # Public Subnets
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={"Name": f"fraud-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={"Name": f"fraud-public-subnet-2-{environment_suffix}"}
        )

        # Private Subnets
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1a",
            tags={"Name": f"fraud-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone="us-east-1b",
            tags={"Name": f"fraud-private-subnet-2-{environment_suffix}"}
        )

        # EIP for NAT Gateway
        eip = Eip(
            self,
            "nat_eip",
            vpc=True,
            tags={"Name": f"fraud-nat-eip-{environment_suffix}"}
        )

        # NAT Gateway
        nat = NatGateway(
            self,
            "nat",
            allocation_id=eip.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"fraud-nat-{environment_suffix}"}
        )

        # Route Tables
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"fraud-public-rt-{environment_suffix}"}
        )

        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id
            )],
            tags={"Name": f"fraud-private-rt-{environment_suffix}"}
        )

        # Route Table Associations
        RouteTableAssociation(self, "public_rta_1", subnet_id=public_subnet_1.id, route_table_id=public_rt.id)
        RouteTableAssociation(self, "public_rta_2", subnet_id=public_subnet_2.id, route_table_id=public_rt.id)
        RouteTableAssociation(self, "private_rta_1", subnet_id=private_subnet_1.id, route_table_id=private_rt.id)
        RouteTableAssociation(self, "private_rta_2", subnet_id=private_subnet_2.id, route_table_id=private_rt.id)

        # Security Groups
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"fraud-alb-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ALB",
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"fraud-ecs-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS tasks",
            ingress=[SecurityGroupIngress(
                from_port=8080,
                to_port=8080,
                protocol="tcp",
                security_groups=[alb_sg.id]
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        # ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"fraud-cluster-{environment_suffix}"
        )

        # IAM Role for ECS Task
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"fraud-ecs-task-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }"""
        )

        # ECS Task Definition
        task_def = EcsTaskDefinition(
            self,
            "task_def",
            family=f"fraud-api-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            task_role_arn=ecs_task_role.arn,
            execution_role_arn=ecs_task_role.arn,
            container_definitions="""[{
                "name": "fraud-api",
                "image": "fraud-api:latest",
                "cpu": 1024,
                "memory": 2048,
                "essential": true,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }]
            }]"""
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "alb",
            name=f"fraud-alb-{environment_suffix}",
            load_balancer_type="application",
            subnets=[public_subnet_1.id, public_subnet_2.id],
            security_groups=[alb_sg.id]
        )

        # Target Group
        tg = LbTargetGroup(
            self,
            "tg",
            name=f"fraud-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip"
        )

        # Listener
        LbListener(
            self,
            "listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[{
                "type": "forward",
                "target_group_arn": tg.arn
            }]
        )

        # ECS Service
        EcsService(
            self,
            "ecs_service",
            name=f"fraud-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_def.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration={
                "subnets": [private_subnet_1.id, private_subnet_2.id],
                "security_groups": [ecs_sg.id]
            },
            load_balancer=[{
                "target_group_arn": tg.arn,
                "container_name": "fraud-api",
                "container_port": 8080
            }]
        )

        # Aurora Serverless
        RdsCluster(
            self,
            "aurora",
            cluster_identifier=f"fraud-db-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            database_name="frauddb",
            master_username="admin",
            master_password="changeme123",
            db_subnet_group_name="default",
            storage_encrypted=True
        )

        # Secrets Manager
        SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"fraud-db-secret-{environment_suffix}"
        )

        # API Gateway
        api = Apigatewayv2Api(
            self,
            "api",
            name=f"fraud-api-{environment_suffix}",
            protocol_type="HTTP"
        )

        # Outputs
        TerraformOutput(self, "alb_dns_name", value=alb.dns_name)
        TerraformOutput(self, "api_endpoint", value=api.api_endpoint)


app = App()
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "fraud-detection-api",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: Pipfile

```
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
cdktf = "~=0.19.0"
cdktf-cdktf-provider-aws = "~=18.0"
constructs = "~=10.3.0"

[requires]
python_version = "3.9"
```

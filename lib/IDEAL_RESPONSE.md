### Ideal response for PROMPT.md (what the model must produce)

A compliant, production-ready single-file Python CDKTF stack that:

- Uses only us-east-1 and configures Terraform Cloud as the remote backend via `RemoteBackend` and `NamedRemoteWorkspace` (org/workspace from env vars), with `cdktf deploy` working end-to-end.
- Implements modular components within one file (classes/sections) for: Networking (VPC with 2 public + 2 private subnets, IGW, per‑AZ NAT, routing), Security (least‑privilege IAM, SGs), Secrets (AWS Secrets Manager only, no plaintext in code), Compute (ECS Fargate + ALB with zero‑downtime deployment), Database (RDS Postgres, Multi‑AZ, automated backups), and Monitoring (CloudWatch alarms for ECS, ALB target health, and RDS).
- Manages secrets without embedding values in code:
  - Pull sensitive inputs from Terraform Cloud sensitive variables or reference pre-existing Secrets Manager entries via data sources.
  - If creating secrets, populate from variables and reference the same secret in ECS containers with correct `valueFrom` syntax.
  - If using RDS `manage_master_user_password`, reference the generated secret (and endpoint) in ECS via outputs/data sources, not a separate hardcoded secret. Alternatively, use a single Secrets Manager secret (populated from TFC sensitive vars) as the source of truth and pass the same password to RDS (no plaintext in code, variables remain sensitive).
- Ensures zero‑downtime ECS deployments with a suitable deployment configuration (min healthy / max percent, circuit breaker with rollback), and ALB target group health checks.
- Tags every resource with `Environment: Production` and adds `Name` where helpful.
- Exposes rich outputs: VPC ID, ALB DNS name, Target Group ARN, ECS Cluster/Service names, RDS identifier and endpoint, Secrets ARNs, and SNS Topic ARN.
- Avoids placeholders: no wildcard ARNs for secrets, no hardcoded emails; parameterize via variables and/or environment.
- Uses correct CloudWatch dimensions for ALB metrics: `TargetGroup = targetgroup/<name>/<hash>`, `LoadBalancer = app/<name>/<hash>`.
- Contains clear, readable code structure and imports that synthesize without errors.

### Key elements to show explicitly (with reference snippets)

- Backend configuration snippet using Terraform Cloud org/workspace.
- Data sources or variables for sensitive values and email addresses.
- Proper ECS task definition `secrets` entries referencing actual Secret ARNs/JSON keys.
- RDS configuration with Multi‑AZ, backups, encryption, and either a valid monitoring role or those fields omitted.
- Outputs section covering all essential resource identifiers/addresses.

```python
# Terraform Cloud remote backend
from cdktf import RemoteBackend, NamedRemoteWorkspace
import os

RemoteBackend(
    self,
    hostname="app.terraform.io",
    organization=os.getenv("TF_CLOUD_ORG", "your-org"),
    workspaces=NamedRemoteWorkspace(os.getenv("TF_WORKSPACE", "production")),
)
```

```python
# Sensitive variables (no plaintext in code)
from cdktf import TerraformVariable

db_username = TerraformVariable(self, "db_username", type="string", sensitive=True)
db_password = TerraformVariable(self, "db_password", type="string", sensitive=True)
jwt_secret  = TerraformVariable(self, "jwt_secret",  type="string", sensitive=True)
api_key     = TerraformVariable(self, "api_key",     type="string", sensitive=True)
enc_key     = TerraformVariable(self, "encryption_key", type="string", sensitive=True)
alert_email = TerraformVariable(self, "alert_email", type="string")
```

```python
# Secrets Manager creation populated from sensitive vars
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json

db_secret = SecretsmanagerSecret(self, "db_secret", name="production/database/credentials")
SecretsmanagerSecretVersion(
    self, "db_secret_v",
    secret_id=db_secret.id,
    secret_string=json.dumps({
        "username": db_username.string_value,
        "password": db_password.string_value,
        "engine": "postgres",
        "port": 5432,
        "dbname": "production",
    })
)

app_secret = SecretsmanagerSecret(self, "app_secret", name="production/application/secrets")
SecretsmanagerSecretVersion(
    self, "app_secret_v",
    secret_id=app_secret.id,
    secret_string=json.dumps({
        "jwt_secret": jwt_secret.string_value,
        "api_key": api_key.string_value,
        "encryption_key": enc_key.string_value,
    })
)
```

```python
# ECS task definition secrets – correct valueFrom syntax (no wildcard account)
container_definitions=json.dumps([{
  "name": "app",
  "image": "nginx:latest",
  "secrets": [
    {"name": "DB_USERNAME", "valueFrom": db_secret.arn + ":username::"},
    {"name": "DB_PASSWORD", "valueFrom": db_secret.arn + ":password::"},
    {"name": "JWT_SECRET",  "valueFrom": app_secret.arn + ":jwt_secret::"},
  ],
  # ...
}])
```

```python
# RDS – two acceptable approaches (pick one, document it)
from cdktf_cdktf_provider_aws.db_instance import DbInstance

# A) Use AWS-managed master password; omit invalid monitoring role
rds = DbInstance(
    self, "db",
    engine="postgres", engine_version="14.9", instance_class="db.t3.micro",
    multi_az=True, backup_retention_period=7, storage_encrypted=True,
    username="dbadmin", manage_master_user_password=True,
    # monitoring_role_arn omitted unless created in this stack
)

# Then surface connection details and (if available) the generated secret via outputs/data sources.

# B) Single source of truth secret (populated from sensitive var)
# Use the same db_password variable to set RDS password, and store it in Secrets Manager for ECS.
rds = DbInstance(
    self, "db",
    engine="postgres", engine_version="14.9", instance_class="db.t3.micro",
    multi_az=True, backup_retention_period=7, storage_encrypted=True,
    username=db_username.string_value,
    password=db_password.string_value,  # variable is sensitive; no plaintext in code
)
```

```python
# CloudWatch ALB dimensions helper – correct identifiers
def alb_dimensions(alb_arn: str, tg_arn: str) -> dict:
    alb_resource = alb_arn.split(":")[-1]  # loadbalancer/app/<name>/<hash>
    tg_resource  = tg_arn.split(":")[-1]   # targetgroup/<name>/<hash>
    return {
        "LoadBalancer": "/".join(alb_resource.split("/")[1:]),  # app/<name>/<hash>
        "TargetGroup": "/".join(tg_resource.split("/")[1:]),   # targetgroup/<name>/<hash>
    }
```

```python
# Parameterized SNS subscription
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription

alerts = SnsTopic(self, "alerts", name="production-alerts")
SnsTopicSubscription(
    self, "alerts_email",
    topic_arn=alerts.arn,
    protocol="email",
    endpoint=alert_email.string_value,
)
```

```python
# Rich outputs for verification
from cdktf import TerraformOutput

TerraformOutput(self, "vpc_id", value=vpc.id)
TerraformOutput(self, "alb_dns_name", value=alb.dns_name)
TerraformOutput(self, "target_group_arn", value=tg.arn)
TerraformOutput(self, "ecs_cluster_name", value=cluster.name)
TerraformOutput(self, "ecs_service_name", value=service.name)
TerraformOutput(self, "rds_identifier", value=rds.id)
TerraformOutput(self, "rds_endpoint", value=rds.address)
TerraformOutput(self, "db_secret_arn", value=db_secret.arn)
TerraformOutput(self, "app_secret_arn", value=app_secret.arn)
```

### Reference implementation (single-file tap_stack.py)

```python
"""Production-ready TapStack implemented in a single file.
Paste this into lib/tap_stack.py. Do not add an App() here; tests will import the class.
"""

import json
import os
from typing import List

from constructs import Construct
from cdktf import (
    TerraformStack,
    TerraformOutput,
    RemoteBackend,
    NamedRemoteWorkspace,
    TerraformVariable,
)

from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class TapStack(TerraformStack):
    """Single-file production stack for AWS Fargate + RDS in us-east-1."""

    def __init__(self, scope: Construct, construct_id: str) -> None:
        super().__init__(scope, construct_id)

        # Provider and Terraform Cloud backend
        AwsProvider(self, "aws", region="us-east-1")
        RemoteBackend(
            self,
            hostname="app.terraform.io",
            organization=os.getenv("TF_CLOUD_ORG", "your-org"),
            workspaces=NamedRemoteWorkspace(os.getenv("TF_WORKSPACE", "production")),
        )

        # Sensitive variables (supplied via TFC workspace variables or env)
        db_username = TerraformVariable(self, "db_username", type="string", sensitive=True)
        db_password = TerraformVariable(self, "db_password", type="string", sensitive=True)
        jwt_secret = TerraformVariable(self, "jwt_secret", type="string", sensitive=True)
        api_key = TerraformVariable(self, "api_key", type="string", sensitive=True)
        encryption_key = TerraformVariable(self, "encryption_key", type="string", sensitive=True)
        alert_email = TerraformVariable(self, "alert_email", type="string")

        # Common tags
        common_tags = {"Environment": "Production"}

        # Networking: VPC, subnets, IGW, NAT, routes
        vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": "production-vpc"},
        )

        igw = InternetGateway(self, "igw", vpc_id=vpc.id, tags={**common_tags, "Name": "production-igw"})

        azs = ["us-east-1a", "us-east-1b"]
        public_subnets: List[Subnet] = []
        private_subnets: List[Subnet] = []
        for i, az in enumerate(azs):
            public = Subnet(
                self, f"public-{i+1}", vpc_id=vpc.id, cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az, map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"public-{i+1}", "Type": "Public"},
            )
            private = Subnet(
                self, f"private-{i+1}", vpc_id=vpc.id, cidr_block=f"10.0.{i+11}.0/24",
                availability_zone=az, tags={**common_tags, "Name": f"private-{i+1}", "Type": "Private"},
            )
            public_subnets.append(public)
            private_subnets.append(private)

        nat_gateways: List[NatGateway] = []
        for i, pub in enumerate(public_subnets):
            eip = Eip(self, f"nat-eip-{i+1}", domain="vpc", tags={**common_tags, "Name": f"nat-eip-{i+1}"})
            nat = NatGateway(
                self, f"nat-{i+1}", allocation_id=eip.id, subnet_id=pub.id,
                tags={**common_tags, "Name": f"nat-{i+1}"},
            )
            nat_gateways.append(nat)

        public_rt = RouteTable(self, "public-rt", vpc_id=vpc.id, tags={**common_tags, "Name": "public-rt"})
        Route(self, "public-default", route_table_id=public_rt.id, destination_cidr_block="0.0.0.0/0", gateway_id=igw.id)
        for i, s in enumerate(public_subnets):
            RouteTableAssociation(self, f"pub-assoc-{i+1}", subnet_id=s.id, route_table_id=public_rt.id)

        for i, (s, nat) in enumerate(zip(private_subnets, nat_gateways)):
            rt = RouteTable(self, f"private-rt-{i+1}", vpc_id=vpc.id, tags={**common_tags, "Name": f"private-rt-{i+1}"})
            Route(self, f"private-default-{i+1}", route_table_id=rt.id, destination_cidr_block="0.0.0.0/0", nat_gateway_id=nat.id)
            RouteTableAssociation(self, f"priv-assoc-{i+1}", subnet_id=s.id, route_table_id=rt.id)

        # Security groups
        alb_sg = SecurityGroup(self, "alb-sg", name="production-alb-sg", vpc_id=vpc.id, tags={**common_tags, "Name": "alb-sg"})
        SecurityGroupRule(self, "alb-http", type="ingress", from_port=80, to_port=80, protocol="tcp", cidr_blocks=["0.0.0.0/0"], security_group_id=alb_sg.id)
        SecurityGroupRule(self, "alb-https", type="ingress", from_port=443, to_port=443, protocol="tcp", cidr_blocks=["0.0.0.0/0"], security_group_id=alb_sg.id)

        fargate_sg = SecurityGroup(self, "fargate-sg", name="production-fargate-sg", vpc_id=vpc.id, tags={**common_tags, "Name": "fargate-sg"})
        SecurityGroupRule(self, "svc-from-alb", type="ingress", from_port=8080, to_port=8080, protocol="tcp", source_security_group_id=alb_sg.id, security_group_id=fargate_sg.id)

        rds_sg = SecurityGroup(self, "rds-sg", name="production-rds-sg", vpc_id=vpc.id, tags={**common_tags, "Name": "rds-sg"})
        SecurityGroupRule(self, "rds-from-svc", type="ingress", from_port=5432, to_port=5432, protocol="tcp", source_security_group_id=fargate_sg.id, security_group_id=rds_sg.id)

        for sg in [alb_sg, fargate_sg, rds_sg]:
            SecurityGroupRule(self, f"{sg.name}-egress", type="egress", from_port=0, to_port=0, protocol="-1", cidr_blocks=["0.0.0.0/0"], security_group_id=sg.id)

        # IAM roles and policy for ECS
        ecs_exec_role = IamRole(
            self, "ecs-exec-role",
            name="production-ecs-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Action": "sts:AssumeRole", "Effect": "Allow", "Principal": {"Service": "ecs-tasks.amazonaws.com"}}],
            }),
            tags=common_tags,
        )
        IamRolePolicyAttachment(self, "ecs-exec-policy", role=ecs_exec_role.name, policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")

        ecs_task_role = IamRole(
            self, "ecs-task-role",
            name="production-ecs-task-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Action": "sts:AssumeRole", "Effect": "Allow", "Principal": {"Service": "ecs-tasks.amazonaws.com"}}],
            }),
            tags=common_tags,
        )
        secrets_policy = IamPolicy(
            self, "secrets-policy",
            name="production-secrets-access-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
                    "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:production/*",
                }],
            }),
        )
        IamRolePolicyAttachment(self, "ecs-task-secrets-policy", role=ecs_task_role.name, policy_arn=secrets_policy.arn)

        # Secrets Manager (values sourced from sensitive vars)
        db_secret = SecretsmanagerSecret(self, "db-secret", name="production/database/credentials", description="DB credentials")
        SecretsmanagerSecretVersion(
            self, "db-secret-v",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": db_username.string_value,
                "password": db_password.string_value,
                "engine": "postgres",
                "port": 5432,
                "dbname": "production",
            }),
        )

        app_secret = SecretsmanagerSecret(self, "app-secret", name="production/application/secrets", description="App secrets")
        SecretsmanagerSecretVersion(
            self, "app-secret-v",
            secret_id=app_secret.id,
            secret_string=json.dumps({
                "jwt_secret": jwt_secret.string_value,
                "api_key": api_key.string_value,
                "encryption_key": encryption_key.string_value,
            }),
        )

        # RDS (Multi-AZ, backups, encryption; no invalid monitoring role)
        db_subnets = DbSubnetGroup(self, "db-subnets", name="production-db-subnets", subnet_ids=[s.id for s in private_subnets], tags={**common_tags, "Name": "production-db-subnets"})
        rds = DbInstance(
            self, "rds",
            identifier="production-postgres-db",
            engine="postgres", engine_version="14.9",
            instance_class="db.t3.micro",
            allocated_storage=20, max_allocated_storage=100, storage_type="gp2", storage_encrypted=True,
            db_name="production", username=db_username.string_value, password=db_password.string_value,
            vpc_security_group_ids=[rds_sg.id], db_subnet_group_name=db_subnets.name,
            multi_az=True, backup_retention_period=7, backup_window="03:00-04:00", maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=False, final_snapshot_identifier="production-db-final-snapshot", deletion_protection=True,
            enabled_cloudwatch_logs_exports=["postgresql"], performance_insights_enabled=True,
            tags={**common_tags, "Name": "production-postgres-db"},
        )

        # Compute: ECS + ALB
        log_group = CloudwatchLogGroup(self, "ecs-logs", name="/ecs/production-app", retention_in_days=30, tags=common_tags)
        cluster = EcsCluster(self, "ecs-cluster", name="production-cluster", setting=[{"name": "containerInsights", "value": "enabled"}], tags={**common_tags, "Name": "production-ecs-cluster"})
        alb = Lb(self, "alb", name="production-alb", load_balancer_type="application", scheme="internet-facing", security_groups=[alb_sg.id], subnets=[s.id for s in public_subnets], enable_deletion_protection=True, tags={**common_tags, "Name": "production-alb"})
        tg = LbTargetGroup(
            self, "tg", name="production-app-tg", port=8080, protocol="HTTP", vpc_id=vpc.id, target_type="ip",
            health_check={"enabled": True, "healthy_threshold": 2, "unhealthy_threshold": 2, "timeout": 5, "interval": 30, "path": "/health", "matcher": "200", "protocol": "HTTP", "port": "traffic-port"},
            tags={**common_tags, "Name": "production-app-tg"},
        )
        LbListener(self, "listener", load_balancer_arn=alb.arn, port="80", protocol="HTTP", default_action=[{"type": "forward", "target_group_arn": tg.arn}])

        task_def = EcsTaskDefinition(
            self, "task",
            family="production-app", network_mode="awsvpc", requires_compatibilities=["FARGATE"], cpu="256", memory="512",
            execution_role_arn=ecs_exec_role.arn, task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "production-app",
                    "image": "nginx:latest",
                    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
                    "essential": True,
                    "logConfiguration": {"logDriver": "awslogs", "options": {"awslogs-group": log_group.name, "awslogs-region": "us-east-1", "awslogs-stream-prefix": "ecs"}},
                    "environment": [{"name": "ENV", "value": "production"}, {"name": "PORT", "value": "8080"}],
                    "secrets": [
                        {"name": "DB_USERNAME", "valueFrom": db_secret.arn + ":username::"},
                        {"name": "DB_PASSWORD", "valueFrom": db_secret.arn + ":password::"},
                        {"name": "JWT_SECRET",  "valueFrom": app_secret.arn + ":jwt_secret::"},
                    ],
                }
            ]),
            tags={**common_tags, "Name": "production-app-task"},
        )

        service = EcsService(
            self, "service",
            name="production-app-service", cluster=cluster.id, task_definition=task_def.arn, desired_count=2, launch_type="FARGATE", platform_version="LATEST",
            network_configuration={"subnets": [s.id for s in private_subnets], "security_groups": [fargate_sg.id], "assign_public_ip": False},
            load_balancer=[{"target_group_arn": tg.arn, "container_name": "production-app", "container_port": 8080}],
            deployment_configuration={"maximum_percent": 200, "minimum_healthy_percent": 50, "deployment_circuit_breaker": {"enable": True, "rollback": True}},
            enable_execute_command=True,
            tags={**common_tags, "Name": "production-app-service"},
        )

        # Monitoring: SNS + Alarms
        alerts = SnsTopic(self, "alerts", name="production-alerts", tags=common_tags)
        SnsTopicSubscription(self, "alerts-email", topic_arn=alerts.arn, protocol="email", endpoint=alert_email.string_value)

        CloudwatchMetricAlarm(
            self, "ecs-cpu-high",
            alarm_name="production-ecs-high-cpu", comparison_operator="GreaterThanThreshold", evaluation_periods=2,
            metric_name="CPUUtilization", namespace="AWS/ECS", period=300, statistic="Average", threshold=80,
            alarm_description="ECS service CPU utilization is too high", alarm_actions=[alerts.arn],
            dimensions={"ServiceName": service.name, "ClusterName": cluster.name}, tags=common_tags,
        )
        CloudwatchMetricAlarm(
            self, "ecs-mem-high",
            alarm_name="production-ecs-high-memory", comparison_operator="GreaterThanThreshold", evaluation_periods=2,
            metric_name="MemoryUtilization", namespace="AWS/ECS", period=300, statistic="Average", threshold=80,
            alarm_description="ECS service memory utilization is too high", alarm_actions=[alerts.arn],
            dimensions={"ServiceName": service.name, "ClusterName": cluster.name}, tags=common_tags,
        )

        def alb_dimensions(alb_arn: str, tg_arn: str) -> dict:
            alb_resource = alb_arn.split(":")[-1]  # loadbalancer/app/<name>/<hash>
            tg_resource = tg_arn.split(":")[-1]    # targetgroup/<name>/<hash>
            return {
                "LoadBalancer": "/".join(alb_resource.split("/")[1:]),
                "TargetGroup": "/".join(tg_resource.split("/")[1:]),
            }

        CloudwatchMetricAlarm(
            self, "alb-unhealthy",
            alarm_name="production-alb-unhealthy-targets", comparison_operator="GreaterThanThreshold", evaluation_periods=2,
            metric_name="UnHealthyHostCount", namespace="AWS/ApplicationELB", period=300, statistic="Average", threshold=0,
            alarm_description="ALB has unhealthy targets", alarm_actions=[alerts.arn],
            dimensions=alb_dimensions(alb.arn, tg.arn), tags=common_tags,
        )
        CloudwatchMetricAlarm(
            self, "rds-cpu-high",
            alarm_name="production-rds-high-cpu", comparison_operator="GreaterThanThreshold", evaluation_periods=2,
            metric_name="CPUUtilization", namespace="AWS/RDS", period=300, statistic="Average", threshold=80,
            alarm_description="RDS CPU utilization is too high", alarm_actions=[alerts.arn],
            dimensions={"DBInstanceIdentifier": rds.id}, tags=common_tags,
        )

        # Outputs for verification
        TerraformOutput(self, "vpc_id", value=vpc.id)
        TerraformOutput(self, "alb_dns_name", value=alb.dns_name)
        TerraformOutput(self, "target_group_arn", value=tg.arn)
        TerraformOutput(self, "ecs_cluster_name", value=cluster.name)
        TerraformOutput(self, "ecs_service_name", value=service.name)
        TerraformOutput(self, "rds_identifier", value=rds.id)
        TerraformOutput(self, "rds_endpoint", value=rds.address)
        TerraformOutput(self, "db_secret_arn", value=db_secret.arn)
        TerraformOutput(self, "app_secret_arn", value=app_secret.arn)
```

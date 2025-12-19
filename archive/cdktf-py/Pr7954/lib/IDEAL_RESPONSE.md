# Ideal Response - Financial Transaction Processing Platform

## Architecture Overview

A production-grade web application infrastructure for financial transactions using CDKTF Python on AWS, designed for PCI-DSS compliance.

## Components

### Network Layer
- VPC with CIDR 10.0.0.0/16
- 3 public subnets for ALB and NAT Gateways
- 3 private subnets for compute and database
- NAT Gateways for private subnet internet access
- Route tables for traffic management

```python
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway

# VPC
self.vpc = Vpc(self, "vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"financial-vpc-{environment_suffix}",
        "Environment": f"{environment_suffix}",
        "Application": "financial-transaction-platform",
        "CostCenter": "engineering"
    }
)

# Public Subnets (3 AZs)
azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
self.public_subnets = []
for i, az in enumerate(azs):
    subnet = Subnet(self, f"public_subnet_{i}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={"Name": f"financial-public-subnet-{i+1}-{environment_suffix}"}
    )
    self.public_subnets.append(subnet)

# Private Subnets (3 AZs)
self.private_subnets = []
for i, az in enumerate(azs):
    subnet = Subnet(self, f"private_subnet_{i}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={"Name": f"financial-private-subnet-{i+1}-{environment_suffix}"}
    )
    self.private_subnets.append(subnet)
```

### Compute Layer
- Auto Scaling Group with t3.large instances
- Amazon Linux 2023 AMI with IMDSv2 enforced
- Launch template with user data for application setup
- Target tracking scaling policy (70% CPU)
- Scheduled scaling for business hours (8AM-6PM EST)

```python
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate,
    LaunchTemplateMetadataOptions,
    LaunchTemplateTagSpecifications
)
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.autoscaling_policy import AutoscalingPolicy

# Launch Template with IMDSv2
self.launch_template = LaunchTemplate(self, "launch_template",
    name_prefix=f"financial-lt-{environment_suffix}-",
    image_id=ami.id,
    instance_type="t3.large",
    iam_instance_profile={"name": security.ec2_instance_profile.name},
    vpc_security_group_ids=[security.ec2_sg.id],
    user_data=base64.b64encode(user_data_script.encode()).decode(),
    metadata_options=LaunchTemplateMetadataOptions(
        http_endpoint="enabled",
        http_tokens="required",  # IMDSv2 enforcement
        http_put_response_hop_limit=1,
        instance_metadata_tags="enabled"
    )
)

# Auto Scaling Group
self.asg = AutoscalingGroup(self, "asg",
    name=f"financial-asg-{environment_suffix}",
    launch_template={"id": self.launch_template.id, "version": "$Latest"},
    vpc_zone_identifier=[subnet.id for subnet in vpc.private_subnets],
    target_group_arns=[alb.target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    min_size=2,
    max_size=10,
    desired_capacity=3
)

# Target Tracking Scaling Policy (70% CPU)
AutoscalingPolicy(self, "scale_up_policy",
    name=f"financial-scale-up-{environment_suffix}",
    autoscaling_group_name=self.asg.name,
    policy_type="TargetTrackingScaling",
    target_tracking_configuration=AutoscalingPolicyTargetTrackingConfiguration(
        predefined_metric_specification={
            "predefined_metric_type": "ASGAverageCPUUtilization"
        },
        target_value=70.0
    )
)
```

### Database Layer
- Aurora MySQL 8.0 cluster with Multi-AZ
- 2 instances for high availability
- KMS encryption at rest
- 7-day automated backup retention
- Performance Insights enabled
- SSL/TLS required for connections

```python
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_cluster_parameter_group import (
    RdsClusterParameterGroup,
    RdsClusterParameterGroupParameter
)

# Cluster Parameter Group with SSL enforcement
cluster_parameter_group = RdsClusterParameterGroup(self, "cluster_param_group",
    name=f"financial-aurora-cluster-pg-{environment_suffix}",
    family="aurora-mysql8.0",
    parameter=[
        RdsClusterParameterGroupParameter(name="character_set_server", value="utf8mb4"),
        RdsClusterParameterGroupParameter(name="require_secure_transport", value="ON")
    ]
)

# Aurora MySQL Cluster
self.cluster = RdsCluster(self, "aurora_cluster",
    cluster_identifier=f"financial-aurora-{environment_suffix}",
    engine="aurora-mysql",
    engine_version="8.0.mysql_aurora.3.04.0",
    engine_mode="provisioned",
    database_name="financialdb",
    master_username="admin",
    master_password=generate_password(),
    db_subnet_group_name=db_subnet_group.name,
    db_cluster_parameter_group_name=cluster_parameter_group.name,
    vpc_security_group_ids=[security.rds_sg.id],
    storage_encrypted=True,
    kms_key_id=security.kms_key.arn,
    backup_retention_period=7,
    enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
    deletion_protection=False,
    skip_final_snapshot=True
)

# Aurora Instances (2 for HA)
self.instances = []
for i in range(2):
    instance = RdsClusterInstance(self, f"aurora_instance_{i}",
        identifier=f"financial-aurora-{environment_suffix}-{i+1}",
        cluster_identifier=self.cluster.id,
        instance_class="db.r6g.large",
        engine=self.cluster.engine,
        performance_insights_enabled=True,
        performance_insights_kms_key_id=security.kms_key.arn
    )
    self.instances.append(instance)
```

### Security
- KMS key for encryption
- Security groups with least privilege
- IAM roles for EC2 and Lambda
- IMDSv2 enforcement

```python
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress
from cdktf_cdktf_provider_aws.iam_role import IamRole

# KMS Key for encryption
self.kms_key = KmsKey(self, "kms_key",
    description=f"KMS key for financial transaction platform {environment_suffix}",
    deletion_window_in_days=10,
    enable_key_rotation=True,
    tags={"Name": f"financial-kms-{environment_suffix}"}
)

# RDS Security Group (least privilege)
self.rds_sg = SecurityGroup(self, "rds_sg",
    name=f"financial-rds-sg-{environment_suffix}",
    vpc_id=vpc.vpc.id,
    ingress=[
        SecurityGroupIngress(
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            security_groups=[self.ec2_sg.id],
            description="Allow MySQL from EC2 instances only"
        )
    ]
)

# EC2 IAM Role
self.ec2_role = IamRole(self, "ec2_role",
    name=f"financial-ec2-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)
```

### Secrets Management
- Secrets Manager for database credentials
- Lambda function for 30-day rotation
- KMS encryption for secrets

### Monitoring
- CloudWatch log groups with 90-day retention
- Metric filters for error tracking
- Alarms for high error rates and CPU
- SNS topic for alerts

## Compliance

- Encryption at rest (KMS) and in transit (SSL/TLS)
- Network isolation with private subnets
- Audit logging for all components
- Automated credential rotation
- IMDSv2 security enforcement

## Resource Naming

All resources follow: `financial-{resource}-{environment_suffix}`

Example: `financial-vpc-dev`, `financial-aurora-prod`

# Multi-Environment Pulumi Python Implementation

This implementation provides a modular, reusable infrastructure-as-code solution for deploying a three-tier web application across dev, staging, and production environments using Pulumi with Python.

## File: __main__.py

```python
import pulumi
import pulumi_aws as aws
from lib.vpc_component import VpcComponent
from lib.alb_component import AlbComponent
from lib.asg_component import AsgComponent
from lib.rds_component import RdsComponent
from lib.s3_component import S3Component

# Load configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
environment = config.require("environment")
min_capacity = config.require_int("minCapacity")
max_capacity = config.require_int("maxCapacity")
read_replica_count = config.require_int("readReplicaCount")
backup_retention_days = config.require_int("backupRetentionDays")
enable_waf = config.get_bool("enableWaf") or False
cost_center = config.require("costCenter")

# Common tags
tags = {
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "CostCenter": cost_center,
}

# Deploy VPC
vpc = VpcComponent(
    "vpc",
    environment_suffix=environment_suffix,
    cidr_block="10.0.0.0/16",
    availability_zones=["us-east-1a", "us-east-1b"],
    tags=tags,
)

# Deploy ALB
alb = AlbComponent(
    "alb",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    public_subnet_ids=vpc.public_subnet_ids,
    enable_waf=enable_waf,
    tags=tags,
)

# Deploy Auto Scaling Group
asg = AsgComponent(
    "asg",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    target_group_arn=alb.target_group_arn,
    min_size=min_capacity,
    max_size=max_capacity,
    tags=tags,
)

# Deploy RDS Aurora PostgreSQL
rds = RdsComponent(
    "rds",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    read_replica_count=read_replica_count,
    backup_retention_days=backup_retention_days,
    tags=tags,
)

# Deploy S3 Buckets
s3 = S3Component(
    "s3",
    environment_suffix=environment_suffix,
    environment=environment,
    tags=tags,
)

# Export outputs
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("alb_dns_name", alb.alb_dns_name)
pulumi.export("alb_arn", alb.alb_arn)
pulumi.export("rds_cluster_endpoint", rds.cluster_endpoint)
pulumi.export("rds_reader_endpoint", rds.reader_endpoint)
pulumi.export("static_assets_bucket", s3.static_assets_bucket)
pulumi.export("logs_bucket", s3.logs_bucket)
```

## File: lib/__init__.py

```python
"""
Multi-environment infrastructure components for Pulumi
"""
```

## File: lib/vpc_component.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class VpcComponent(ComponentResource):
    """
    Reusable VPC component with public and private subnets across multiple AZs
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        cidr_block: str,
        availability_zones: list,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:network:VpcComponent", name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"public-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**tags, "Name": f"private-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)

        # Create NAT Gateway (single for cost optimization)
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment_suffix}",
            domain="vpc",
            tags={**tags, "Name": f"nat-eip-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, "Name": f"nat-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"public-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Public route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self),
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self),
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"private-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Private route to NAT Gateway
        aws.ec2.Route(
            f"private-route-{environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self),
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self),
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]

        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
            }
        )
```

## File: lib/alb_component.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class AlbComponent(ComponentResource):
    """
    Application Load Balancer component with optional WAF
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: list,
        enable_waf: bool,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:loadbalancer:AlbComponent", name, None, opts)

        # Create ALB security group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"alb-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, "Name": f"alb-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, "Name": f"tg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create ALB listener
        self.listener = aws.lb.Listener(
            f"listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Conditionally create WAF for production
        self.waf_acl = None
        if enable_waf:
            self.waf_acl = aws.wafv2.WebAcl(
                f"waf-{environment_suffix}",
                scope="REGIONAL",
                default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
                rules=[
                    aws.wafv2.WebAclRuleArgs(
                        name="RateLimitRule",
                        priority=1,
                        action=aws.wafv2.WebAclRuleActionArgs(block={}),
                        statement=aws.wafv2.WebAclRuleStatementArgs(
                            rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                                limit=2000,
                                aggregate_key_type="IP",
                            )
                        ),
                        visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                            sampled_requests_enabled=True,
                            cloud_watch_metrics_enabled=True,
                            metric_name="RateLimitRule",
                        ),
                    )
                ],
                visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                    sampled_requests_enabled=True,
                    cloud_watch_metrics_enabled=True,
                    metric_name=f"waf-{environment_suffix}",
                ),
                tags={**tags, "Name": f"waf-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )

            # Associate WAF with ALB
            aws.wafv2.WebAclAssociation(
                f"waf-association-{environment_suffix}",
                resource_arn=self.alb.arn,
                web_acl_arn=self.waf_acl.arn,
                opts=ResourceOptions(parent=self),
            )

        # Export properties
        self.alb_arn = self.alb.arn
        self.alb_dns_name = self.alb.dns_name
        self.target_group_arn = self.target_group.arn
        self.alb_security_group_id = self.alb_sg.id

        self.register_outputs(
            {
                "alb_arn": self.alb_arn,
                "alb_dns_name": self.alb_dns_name,
                "target_group_arn": self.target_group_arn,
                "alb_security_group_id": self.alb_security_group_id,
            }
        )
```

## File: lib/asg_component.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class AsgComponent(ComponentResource):
    """
    Auto Scaling Group component with LC and environment-specific capacity
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: list,
        target_group_arn: Output[str],
        min_size: int,
        max_size: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:compute:AsgComponent", name, None, opts)

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"],
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="state",
                    values=["available"],
                ),
            ],
        )

        # Create EC2 security group
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"ec2-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow HTTP from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"ec2-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create IAM role for EC2
        self.role = aws.iam.Role(
            f"ec2-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**tags, "Name": f"ec2-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Attach policies
        aws.iam.RolePolicyAttachment(
            f"ec2-ssm-policy-{environment_suffix}",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self),
        )

        aws.iam.RolePolicyAttachment(
            f"ec2-cloudwatch-policy-{environment_suffix}",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=self),
        )

        # Create instance profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"ec2-profile-{environment_suffix}",
            role=self.role.name,
            opts=ResourceOptions(parent=self),
        )

        # User data script
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
mkdir -p /var/www/html/health
echo "OK" > /var/www/html/health/index.html
"""

        # Create Launch Template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{environment_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile.arn,
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda s: __import__("base64").b64encode(s.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**tags, "Name": f"instance-{environment_suffix}"},
                ),
            ],
            opts=ResourceOptions(parent=self),
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{environment_suffix}",
            min_size=min_size,
            max_size=max_size,
            desired_capacity=min_size,
            vpc_zone_identifiers=private_subnet_ids,
            target_group_arns=[target_group_arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest",
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True,
                )
                for k, v in {**tags, "Name": f"asg-{environment_suffix}"}.items()
            ],
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch alarm for high CPU
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"cpu-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Trigger when CPU exceeds 80%",
            dimensions={"AutoScalingGroupName": self.asg.name},
            tags={**tags, "Name": f"cpu-alarm-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.asg_name = self.asg.name
        self.ec2_security_group_id = self.ec2_sg.id

        self.register_outputs(
            {
                "asg_name": self.asg_name,
                "ec2_security_group_id": self.ec2_security_group_id,
            }
        )
```

## File: lib/rds_component.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class RdsComponent(ComponentResource):
    """
    RDS Aurora PostgreSQL component with read replicas and encryption
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: list,
        read_replica_count: int,
        backup_retention_days: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:database:RdsComponent", name, None, opts)

        # Create RDS security group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for RDS Aurora PostgreSQL",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow PostgreSQL from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"rds-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"db-subnet-group-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create secret for DB password
        self.db_secret = aws.secretsmanager.Secret(
            f"db-secret-{environment_suffix}",
            description=f"Database password for {environment_suffix}",
            tags={**tags, "Name": f"db-secret-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Generate random password
        import json

        db_password = pulumi.Output.secret(
            ''.join([chr(__import__("random").randint(65, 90)) for _ in range(16)])
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-secret-version-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=db_password.apply(
                lambda pwd: json.dumps({"password": pwd})
            ),
            opts=ResourceOptions(parent=self),
        )

        # Create RDS Aurora Cluster
        self.cluster = aws.rds.Cluster(
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.3",
            database_name="appdb",
            master_username="dbadmin",
            master_password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=backup_retention_days,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            storage_encrypted=True,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={**tags, "Name": f"aurora-cluster-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create primary instance
        self.primary_instance = aws.rds.ClusterInstance(
            f"aurora-instance-primary-{environment_suffix}",
            cluster_identifier=self.cluster.id,
            identifier=f"aurora-instance-primary-{environment_suffix}",
            instance_class="db.t3.medium",
            engine=self.cluster.engine,
            engine_version=self.cluster.engine_version,
            publicly_accessible=False,
            tags={**tags, "Name": f"aurora-instance-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create read replicas
        self.read_replicas = []
        for i in range(read_replica_count):
            replica = aws.rds.ClusterInstance(
                f"aurora-instance-replica-{i}-{environment_suffix}",
                cluster_identifier=self.cluster.id,
                identifier=f"aurora-instance-replica-{i}-{environment_suffix}",
                instance_class="db.t3.medium",
                engine=self.cluster.engine,
                engine_version=self.cluster.engine_version,
                publicly_accessible=False,
                tags={**tags, "Name": f"aurora-instance-replica-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[self.primary_instance]),
            )
            self.read_replicas.append(replica)

        # Create CloudWatch alarm for database connections
        self.db_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"db-connections-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Trigger when DB connections exceed 80",
            dimensions={"DBClusterIdentifier": self.cluster.id},
            tags={**tags, "Name": f"db-connections-alarm-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.cluster_endpoint = self.cluster.endpoint
        self.reader_endpoint = self.cluster.reader_endpoint
        self.cluster_id = self.cluster.id
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs(
            {
                "cluster_endpoint": self.cluster_endpoint,
                "reader_endpoint": self.reader_endpoint,
                "cluster_id": self.cluster_id,
                "db_secret_arn": self.db_secret_arn,
            }
        )
```

## File: lib/s3_component.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
import hashlib


class S3Component(ComponentResource):
    """
    S3 buckets for static assets and logs with encryption
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        environment: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:storage:S3Component", name, None, opts)

        # Generate random suffix for bucket names
        random_suffix = hashlib.md5(environment_suffix.encode()).hexdigest()[:8]

        # Create static assets bucket
        self.static_bucket = aws.s3.Bucket(
            f"static-assets-{environment_suffix}",
            bucket=f"company-{environment}-static-{random_suffix}",
            tags={**tags, "Purpose": "static-assets", "Name": f"static-assets-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Enable versioning for static bucket
        self.static_versioning = aws.s3.BucketVersioningV2(
            f"static-versioning-{environment_suffix}",
            bucket=self.static_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self),
        )

        # Enable encryption for static bucket
        self.static_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"static-encryption-{environment_suffix}",
            bucket=self.static_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Block public access for static bucket
        self.static_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"static-public-access-block-{environment_suffix}",
            bucket=self.static_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Create logs bucket
        self.logs_bucket = aws.s3.Bucket(
            f"logs-{environment_suffix}",
            bucket=f"company-{environment}-logs-{random_suffix}",
            tags={**tags, "Purpose": "logs", "Name": f"logs-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Enable versioning for logs bucket
        self.logs_versioning = aws.s3.BucketVersioningV2(
            f"logs-versioning-{environment_suffix}",
            bucket=self.logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self),
        )

        # Enable encryption for logs bucket
        self.logs_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"logs-encryption-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Block public access for logs bucket
        self.logs_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"logs-public-access-block-{environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Lifecycle policy for logs bucket
        self.logs_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"logs-lifecycle-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=90,
                    ),
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.static_assets_bucket = self.static_bucket.bucket
        self.logs_bucket_name = self.logs_bucket.bucket

        self.register_outputs(
            {
                "static_assets_bucket": self.static_assets_bucket,
                "logs_bucket": self.logs_bucket_name,
            }
        )
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
  multi-env-infra:environmentSuffix: dev-12345
  multi-env-infra:environment: dev
  multi-env-infra:minCapacity: "1"
  multi-env-infra:maxCapacity: "2"
  multi-env-infra:readReplicaCount: "1"
  multi-env-infra:backupRetentionDays: "1"
  multi-env-infra:enableWaf: "false"
  multi-env-infra:costCenter: dev-team
```

## File: Pulumi.staging.yaml

```yaml
config:
  aws:region: us-east-1
  multi-env-infra:environmentSuffix: staging-67890
  multi-env-infra:environment: staging
  multi-env-infra:minCapacity: "2"
  multi-env-infra:maxCapacity: "4"
  multi-env-infra:readReplicaCount: "1"
  multi-env-infra:backupRetentionDays: "7"
  multi-env-infra:enableWaf: "false"
  multi-env-infra:costCenter: staging-team
```

## File: Pulumi.prod.yaml

```yaml
config:
  aws:region: us-east-1
  multi-env-infra:environmentSuffix: prod-abcdef
  multi-env-infra:environment: prod
  multi-env-infra:minCapacity: "3"
  multi-env-infra:maxCapacity: "10"
  multi-env-infra:readReplicaCount: "3"
  multi-env-infra:backupRetentionDays: "30"
  multi-env-infra:enableWaf: "true"
  multi-env-infra:costCenter: production-team
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: Pulumi.yaml

```yaml
name: multi-env-infra
runtime: python
description: Multi-environment infrastructure with Pulumi Python
```

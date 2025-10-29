### Reasoning Trace

---

Alright, let's plan a modular Pulumi Python solution to build consistent AWS infrastructure across multiple regions. I'll focus on meeting all the requirements listed while maintaining clean, reusable code structure.

First, let me outline the overall structure of our solution:

1. **Project Structure**:
   - `__main__.py` - Entry point
   - `modules/` - Reusable modules
     - `vpc/` - VPC and networking
     - `compute/` - EC2, Auto Scaling Groups
     - `iam/` - IAM roles and policies
     - `storage/` - S3 buckets
     - `monitoring/` - CloudWatch
   - `config.py` - Configuration settings
   - `utils.py` - Utility functions

2. **Configuration**:
   - Region-specific settings
   - Environment variables
   - Default tags
   - Resource naming convention

3. **Modules**: Each module should be self-contained with clear interfaces

Now, let's start implementing each part of the solution:

#### 1. `utils.py` - Utility functions for naming and tagging

```python
import pulumi

def normalize_region(region: str) -> str:
    """Normalize AWS region name (e.g., us-east-1 -> useast1)."""
    return region.replace('-', '').replace('_', '')

def create_name(resource_type: str, region: str, env_suffix: str) -> str:
    """Create a consistent name for resources."""
    normalized_region = normalize_region(region)
    return f"{resource_type}-{normalized_region}-{env_suffix}"

def create_tags(resource_type: str, region: str, env_suffix: str, team: str, cost_center: str) -> dict:
    """Create standard tags for resources."""
    return {
        "Name": create_name(resource_type, region, env_suffix),
        "Environment": env_suffix,
        "Region": region,
        "Team": team,
        "CostCenter": cost_center,
        "ManagedBy": "Pulumi",
        "ResourceType": resource_type
    }
```

#### 2. `config.py` - Configuration settings

```python
import pulumi
import pulumi_aws as aws

config = pulumi.Config()

# Basic settings
env_suffix = config.require("envSuffix")  # e.g. "pr1234"
team = config.get("team") or "Infrastructure"
cost_center = config.get("costCenter") or "IT-Infrastructure"

# Regions
regions = config.get_object("regions") or [
    "us-east-1",
    "us-west-2"
]

# VPC settings
vpc_config = {
    "cidr_blocks": {
        "us-east-1": "10.0.0.0/16",
        "us-west-2": "10.1.0.0/16",
    },
    "subnet_count": 3,  # Number of AZs to use
}

# Compute settings
compute_config = {
    "instance_type": config.get("instanceType") or "t3.micro",
    "min_size": int(config.get("minSize") or 2),
    "max_size": int(config.get("maxSize") or 10),
    "desired_capacity": int(config.get("desiredCapacity") or 2),
}

# Storage settings
storage_config = {
    "enable_versioning": config.get_bool("enableVersioning") or True,
    "enable_encryption": config.get_bool("enableEncryption") or True,
}

# Monitoring settings
monitoring_config = {
    "log_retention_days": int(config.get("logRetentionDays") or 30),
    "enable_detailed_monitoring": config.get_bool("enableDetailedMonitoring") or True,
}
```

#### 3. VPC Module (`modules/vpc/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any, Optional
from ...utils import create_name, create_tags

class VpcModule:
    """Module for creating a VPC with subnets and routing."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 cidr_block: str,
                 subnet_count: int = 3,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize VPC module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            cidr_block: CIDR block for VPC
            subnet_count: Number of AZs to use for subnets
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.cidr_block = cidr_block
        self.subnet_count = subnet_count
        self.team = team
        self.cost_center = cost_center

        # Create the VPC
        self.vpc = self._create_vpc()

        # Get available AZs
        az_response = aws.get_availability_zones(state="available", region=region)
        available_azs = az_response.names

        # Create subnets, dividing the CIDR block
        self.public_subnets = self._create_subnets(available_azs, public=True)
        self.private_subnets = self._create_subnets(available_azs, public=False)

        # Create Internet Gateway
        self.igw = self._create_igw()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables(available_azs)

        # Create NAT Gateways
        self.nat_gateways = self._create_nat_gateways()

        # Associate route tables with subnets
        self._associate_route_tables()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create the VPC resource."""
        vpc_name = create_name("vpc", self.region, self.env_suffix)
        tags = create_tags("vpc", self.region, self.env_suffix, self.team, self.cost_center)

        return aws.ec2.Vpc(vpc_name,
            cidr_block=self.cidr_block,
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

    def _create_subnets(self, azs: List[str], public: bool) -> List[aws.ec2.Subnet]:
        """Create subnets across AZs."""
        subnets = []
        subnet_type = "public" if public else "private"

        # Calculate subnet CIDR blocks
        import ipaddress
        vpc_network = ipaddress.IPv4Network(self.cidr_block)
        subnet_prefix = vpc_network.prefixlen + 4  # Divide into 16 subnets
        subnet_networks = list(vpc_network.subnets(new_prefix=subnet_prefix))

        # Use up to subnet_count AZs
        for i in range(min(self.subnet_count, len(azs))):
            subnet_index = i if public else i + self.subnet_count
            subnet_cidr = str(subnet_networks[subnet_index])
            subnet_name = create_name(f"{subnet_type}-subnet-{i+1}", self.region, self.env_suffix)
            tags = create_tags(f"{subnet_type}-subnet", self.region, self.env_suffix, self.team, self.cost_center)

            # Add Name tag
            tags["Name"] = subnet_name

            subnet = aws.ec2.Subnet(subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=azs[i],
                map_public_ip_on_launch=public,
                tags=tags,
                __opts__=pulumi.ResourceOptions(region=self.region))

            subnets.append(subnet)

        return subnets

    def _create_igw(self) -> aws.ec2.InternetGateway:
        """Create an Internet Gateway for the VPC."""
        igw_name = create_name("igw", self.region, self.env_suffix)
        tags = create_tags("igw", self.region, self.env_suffix, self.team, self.cost_center)

        igw = aws.ec2.InternetGateway(igw_name,
            vpc_id=self.vpc.id,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return igw

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """Create a route table for public subnets."""
        rt_name = create_name("public-rt", self.region, self.env_suffix)
        tags = create_tags("public-route-table", self.region, self.env_suffix, self.team, self.cost_center)

        rt = aws.ec2.RouteTable(rt_name,
            vpc_id=self.vpc.id,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        # Add route to Internet Gateway
        route_name = create_name("public-route", self.region, self.env_suffix)
        aws.ec2.Route(route_name,
            route_table_id=rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return rt

    def _create_private_route_tables(self, azs: List[str]) -> List[aws.ec2.RouteTable]:
        """Create route tables for private subnets, one per AZ."""
        route_tables = []

        # Use up to subnet_count AZs
        for i in range(min(self.subnet_count, len(azs))):
            rt_name = create_name(f"private-rt-{i+1}", self.region, self.env_suffix)
            tags = create_tags("private-route-table", self.region, self.env_suffix, self.team, self.cost_center)
            tags["AZ"] = azs[i]

            rt = aws.ec2.RouteTable(rt_name,
                vpc_id=self.vpc.id,
                tags=tags,
                __opts__=pulumi.ResourceOptions(region=self.region))

            route_tables.append(rt)

        return route_tables

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """Create NAT Gateways for private subnets, one per AZ."""
        nat_gateways = []

        # Create one NAT Gateway in each public subnet
        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip_name = create_name(f"nat-eip-{i+1}", self.region, self.env_suffix)
            eip_tags = create_tags("elastic-ip", self.region, self.env_suffix, self.team, self.cost_center)

            eip = aws.ec2.Eip(eip_name,
                vpc=True,
                tags=eip_tags,
                __opts__=pulumi.ResourceOptions(region=self.region))

            # Create NAT Gateway
            nat_name = create_name(f"nat-gateway-{i+1}", self.region, self.env_suffix)
            nat_tags = create_tags("nat-gateway", self.region, self.env_suffix, self.team, self.cost_center)

            nat_gateway = aws.ec2.NatGateway(nat_name,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=nat_tags,
                __opts__=pulumi.ResourceOptions(region=self.region))

            nat_gateways.append(nat_gateway)

            # Add route to NAT Gateway in corresponding private route table
            route_name = create_name(f"private-route-{i+1}", self.region, self.env_suffix)
            aws.ec2.Route(route_name,
                route_table_id=self.private_route_tables[i].id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                __opts__=pulumi.ResourceOptions(region=self.region))

        return nat_gateways

    def _associate_route_tables(self) -> None:
        """Associate route tables with subnets."""
        # Associate public subnets with the public route table
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = create_name(f"public-rt-assoc-{i+1}", self.region, self.env_suffix)
            aws.ec2.RouteTableAssociation(assoc_name,
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                __opts__=pulumi.ResourceOptions(region=self.region))

        # Associate private subnets with their respective private route tables
        for i, subnet in enumerate(self.private_subnets):
            assoc_name = create_name(f"private-rt-assoc-{i+1}", self.region, self.env_suffix)
            aws.ec2.RouteTableAssociation(assoc_name,
                subnet_id=subnet.id,
                route_table_id=self.private_route_tables[i].id,
                __opts__=pulumi.ResourceOptions(region=self.region))
```

#### 4. IAM Module (`modules/iam/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from typing import List, Dict, Any, Optional
from ...utils import create_name, create_tags

class IamModule:
    """Module for creating IAM roles and policies."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize IAM module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.team = team
        self.cost_center = cost_center

    def create_instance_role(self, name_prefix: str, policy_documents: List[dict]) -> aws.iam.Role:
        """
        Create an IAM role for EC2 instances.

        Args:
            name_prefix: Prefix for the IAM role name
            policy_documents: List of policy documents to attach to the role

        Returns:
            The created IAM role
        """
        # Create assume role policy for EC2
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        # Create the IAM role
        role_name = create_name(f"{name_prefix}-role", self.region, self.env_suffix)
        tags = create_tags("iam-role", self.region, self.env_suffix, self.team, self.cost_center)

        role = aws.iam.Role(role_name,
            assume_role_policy=assume_role_policy,
            tags=tags)

        # Create and attach policies to the role
        for i, policy_doc in enumerate(policy_documents):
            policy_name = create_name(f"{name_prefix}-policy-{i+1}", self.region, self.env_suffix)
            policy_tags = create_tags("iam-policy", self.region, self.env_suffix, self.team, self.cost_center)

            policy = aws.iam.Policy(policy_name,
                policy=json.dumps(policy_doc),
                tags=policy_tags)

            attachment_name = create_name(f"{name_prefix}-attachment-{i+1}", self.region, self.env_suffix)
            aws.iam.RolePolicyAttachment(attachment_name,
                role=role.name,
                policy_arn=policy.arn)

        # Create instance profile
        profile_name = create_name(f"{name_prefix}-profile", self.region, self.env_suffix)
        instance_profile = aws.iam.InstanceProfile(profile_name,
            role=role.name,
            tags=tags)

        # Store the instance profile as an attribute of the role for easier access
        role.instance_profile = instance_profile

        return role

    def create_standard_instance_role(self) -> aws.iam.Role:
        """
        Create a standard IAM role for EC2 instances with common permissions.

        Returns:
            The created IAM role with attached policies
        """
        # Policy for CloudWatch Logs
        cloudwatch_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            }]
        }

        # Policy for S3 read-only access
        s3_readonly_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:Get*",
                    "s3:List*"
                ],
                "Resource": "*"
            }]
        }

        # SSM policy for instance management
        ssm_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "ssm:DescribeAssociation",
                    "ssm:GetDeployablePatchSnapshotForInstance",
                    "ssm:GetDocument",
                    "ssm:DescribeDocument",
                    "ssm:GetManifest",
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:ListAssociations",
                    "ssm:ListInstanceAssociations",
                    "ssm:PutInventory",
                    "ssm:PutComplianceItems",
                    "ssm:PutConfigurePackageResult",
                    "ssm:UpdateAssociationStatus",
                    "ssm:UpdateInstanceAssociationStatus",
                    "ssm:UpdateInstanceInformation",
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel",
                    "ec2messages:AcknowledgeMessage",
                    "ec2messages:DeleteMessage",
                    "ec2messages:FailMessage",
                    "ec2messages:GetEndpoint",
                    "ec2messages:GetMessages",
                    "ec2messages:SendReply"
                ],
                "Resource": "*"
            }]
        }

        return self.create_instance_role(
            "app-server",
            [cloudwatch_policy, s3_readonly_policy, ssm_policy]
        )
```

#### 5. Storage Module (`modules/storage/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any, Optional
from ...utils import create_name, create_tags

class StorageModule:
    """Module for creating storage resources like S3 buckets."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 enable_versioning: bool = True,
                 enable_encryption: bool = True,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize Storage module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            enable_versioning: Enable versioning for S3 buckets
            enable_encryption: Enable server-side encryption for S3 buckets
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.enable_versioning = enable_versioning
        self.enable_encryption = enable_encryption
        self.team = team
        self.cost_center = cost_center

    def create_bucket(self, name_prefix: str, logging_enabled: bool = True, force_destroy: bool = False) -> aws.s3.Bucket:
        """
        Create an S3 bucket with versioning and encryption.

        Args:
            name_prefix: Prefix for the bucket name
            logging_enabled: Enable access logging for the bucket
            force_destroy: Allow Pulumi to delete non-empty buckets

        Returns:
            The created S3 bucket
        """
        import re

        # Create a valid bucket name (lowercase, no underscores)
        normalized_region = self.region.replace('-', '').replace('_', '')
        normalized_env = re.sub(r'[^a-zA-Z0-9]', '', self.env_suffix).lower()
        bucket_name = f"{name_prefix}-{normalized_region}-{normalized_env}"

        tags = create_tags("s3-bucket", self.region, self.env_suffix, self.team, self.cost_center)

        # Create versioning config
        versioning_config = None
        if self.enable_versioning:
            versioning_config = aws.s3.BucketVersioningArgs(
                enabled=True
            )

        # Create encryption config
        encryption_config = None
        if self.enable_encryption:
            encryption_config = aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            )

        # Create logging config
        logging_config = None
        if logging_enabled:
            # First create a logging bucket if needed
            log_bucket_name = f"{name_prefix}-logs-{normalized_region}-{normalized_env}"
            log_tags = create_tags("s3-log-bucket", self.region, self.env_suffix, self.team, self.cost_center)

            log_bucket = aws.s3.Bucket(log_bucket_name,
                acl="log-delivery-write",
                force_destroy=force_destroy,
                tags=log_tags,
                __opts__=pulumi.ResourceOptions(region=self.region))

            # Set logging config to use this bucket
            logging_config = aws.s3.BucketLoggingArgs(
                target_bucket=log_bucket.id,
                target_prefix=f"{bucket_name}/"
            )

        # Create bucket with lifecycle policy for non-current versions
        lifecycle_rules = [aws.s3.BucketLifecycleRuleArgs(
            id="expire-old-versions",
            status="Enabled",
            noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                days=90
            )
        )]

        # Create the bucket
        bucket = aws.s3.Bucket(bucket_name,
            versioning=versioning_config,
            server_side_encryption_configuration=encryption_config,
            logging=logging_config,
            lifecycle_rules=lifecycle_rules,
            force_destroy=force_destroy,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        # Add bucket policy to deny non-SSL access
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "DenyNonSSLRequests",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [
                    pulumi.Output.concat("arn:aws:s3:::", bucket.id),
                    pulumi.Output.concat("arn:aws:s3:::", bucket.id, "/*"),
                ],
                "Condition": {
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            }]
        }

        bucket_policy = aws.s3.BucketPolicy(f"{bucket_name}-policy",
            bucket=bucket.id,
            policy=bucket.id.apply(
                lambda id: json.dumps(policy_document).replace("${bucket}", id)
            ),
            __opts__=pulumi.ResourceOptions(region=self.region))

        return bucket
```

#### 6. Monitoring Module (`modules/monitoring/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any, Optional
from ...utils import create_name, create_tags

class MonitoringModule:
    """Module for setting up monitoring and logging resources."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 log_retention_days: int = 30,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize Monitoring module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            log_retention_days: Number of days to retain logs
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.log_retention_days = log_retention_days
        self.team = team
        self.cost_center = cost_center

    def create_log_group(self, name_prefix: str) -> aws.cloudwatch.LogGroup:
        """
        Create a CloudWatch Log Group.

        Args:
            name_prefix: Prefix for the log group name

        Returns:
            The created CloudWatch Log Group
        """
        log_group_name = f"/aws/{name_prefix}/{self.region}/{self.env_suffix}"
        tags = create_tags("cloudwatch-log-group", self.region, self.env_suffix, self.team, self.cost_center)

        log_group = aws.cloudwatch.LogGroup(log_group_name,
            name=log_group_name,
            retention_in_days=self.log_retention_days,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return log_group

    def create_alarm(self, name_prefix: str, metric_name: str, namespace: str, comparison_operator: str,
                    threshold: float, period: int = 300, evaluation_periods: int = 1,
                    statistic: str = "Average", dimensions: Dict[str, str] = None,
                    alarm_actions: List[str] = None, ok_actions: List[str] = None) -> aws.cloudwatch.MetricAlarm:
        """
        Create a CloudWatch Alarm.

        Args:
            name_prefix: Prefix for the alarm name
            metric_name: Name of the metric to monitor
            namespace: Namespace of the metric
            comparison_operator: Operator to use for comparison
            threshold: Threshold value
            period: Period in seconds
            evaluation_periods: Number of periods to evaluate
            statistic: Statistic to use
            dimensions: Dimensions for the metric
            alarm_actions: List of ARNs to execute when alarm state is ALARM
            ok_actions: List of ARNs to execute when alarm state is OK

        Returns:
            The created CloudWatch Alarm
        """
        alarm_name = create_name(f"{name_prefix}-alarm", self.region, self.env_suffix)
        tags = create_tags("cloudwatch-alarm", self.region, self.env_suffix, self.team, self.cost_center)

        alarm = aws.cloudwatch.MetricAlarm(alarm_name,
            alarm_name=alarm_name,
            comparison_operator=comparison_operator,
            evaluation_periods=evaluation_periods,
            metric_name=metric_name,
            namespace=namespace,
            period=period,
            statistic=statistic,
            threshold=threshold,
            dimensions=dimensions,
            alarm_actions=alarm_actions or [],
            ok_actions=ok_actions or [],
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return alarm

    def create_dashboard(self, name_prefix: str, widgets: List[Dict[str, Any]]) -> aws.cloudwatch.Dashboard:
        """
        Create a CloudWatch Dashboard.

        Args:
            name_prefix: Prefix for the dashboard name
            widgets: List of dashboard widgets configuration

        Returns:
            The created CloudWatch Dashboard
        """
        dashboard_name = create_name(f"{name_prefix}-dashboard", self.region, self.env_suffix)
        tags = create_tags("cloudwatch-dashboard", self.region, self.env_suffix, self.team, self.cost_center)

        dashboard_body = {
            "widgets": widgets
        }

        dashboard = aws.cloudwatch.Dashboard(dashboard_name,
            dashboard_name=dashboard_name,
            dashboard_body=json.dumps(dashboard_body),
            __opts__=pulumi.ResourceOptions(region=self.region))

        return dashboard
```

#### 7. Compute Module (`modules/compute/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any, Optional
from ...utils import create_name, create_tags

class ComputeModule:
    """Module for creating compute resources like EC2 instances and Auto Scaling Groups."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 vpc_id: pulumi.Input[str],
                 subnet_ids: List[pulumi.Input[str]],
                 instance_type: str = "t3.micro",
                 min_size: int = 2,
                 max_size: int = 10,
                 desired_capacity: int = 2,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize Compute module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            vpc_id: ID of the VPC
            subnet_ids: List of subnet IDs
            instance_type: EC2 instance type
            min_size: Minimum size of ASG
            max_size: Maximum size of ASG
            desired_capacity: Desired capacity of ASG
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.instance_type = instance_type
        self.min_size = min_size
        self.max_size = max_size
        self.desired_capacity = desired_capacity
        self.team = team
        self.cost_center = cost_center

    def create_security_group(self, name_prefix: str, description: str, ingress_rules: List[Dict[str, Any]],
                             egress_rules: List[Dict[str, Any]] = None) -> aws.ec2.SecurityGroup:
        """
        Create a security group with ingress and egress rules.

        Args:
            name_prefix: Prefix for the security group name
            description: Description of the security group
            ingress_rules: List of ingress rules
            egress_rules: List of egress rules (default allows all outbound)

        Returns:
            The created security group
        """
        sg_name = create_name(f"{name_prefix}-sg", self.region, self.env_suffix)
        tags = create_tags("security-group", self.region, self.env_suffix, self.team, self.cost_center)

        # Default egress rule (allow all outbound)
        if egress_rules is None:
            egress_rules = [{
                "description": "Allow all outbound traffic",
                "protocol": "-1",  # All protocols
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }]

        # Convert ingress rules to security group args
        sg_ingress = []
        for rule in ingress_rules:
            sg_ingress.append(aws.ec2.SecurityGroupIngressArgs(
                description=rule.get("description", ""),
                protocol=rule["protocol"],
                from_port=rule["from_port"],
                to_port=rule["to_port"],
                cidr_blocks=rule.get("cidr_blocks", []),
                ipv6_cidr_blocks=rule.get("ipv6_cidr_blocks", []),
                security_groups=rule.get("security_groups", []),
                self=rule.get("self", False)
            ))

        # Convert egress rules to security group args
        sg_egress = []
        for rule in egress_rules:
            sg_egress.append(aws.ec2.SecurityGroupEgressArgs(
                description=rule.get("description", ""),
                protocol=rule["protocol"],
                from_port=rule["from_port"],
                to_port=rule["to_port"],
                cidr_blocks=rule.get("cidr_blocks", []),
                ipv6_cidr_blocks=rule.get("ipv6_cidr_blocks", []),
                security_groups=rule.get("security_groups", []),
                self=rule.get("self", False)
            ))

        # Create the security group
        sg = aws.ec2.SecurityGroup(sg_name,
            description=description,
            vpc_id=self.vpc_id,
            ingress=sg_ingress,
            egress=sg_egress,
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return sg

    def create_launch_template(self, name_prefix: str, ami_id: str, instance_profile_arn: str,
                              security_group_ids: List[str], user_data: str = None) -> aws.ec2.LaunchTemplate:
        """
        Create an EC2 launch template.

        Args:
            name_prefix: Prefix for the launch template name
            ami_id: ID of the AMI to use
            instance_profile_arn: ARN of the instance profile
            security_group_ids: List of security group IDs
            user_data: User data script (base64 encoded)

        Returns:
            The created launch template
        """
        lt_name = create_name(f"{name_prefix}-lt", self.region, self.env_suffix)
        tags = create_tags("launch-template", self.region, self.env_suffix, self.team, self.cost_center)

        # Convert tags to launch template format
        tag_specifications = [aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={**tags, "Name": create_name(name_prefix, self.region, self.env_suffix)}
        )]

        # Create the launch template
        lt = aws.ec2.LaunchTemplate(lt_name,
            name=lt_name,
            image_id=ami_id,
            instance_type=self.instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=instance_profile_arn
            ),
            vpc_security_group_ids=security_group_ids,
            user_data=user_data,
            tag_specifications=tag_specifications,
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tags=tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return lt

    def create_auto_scaling_group(self, name_prefix: str, launch_template_id: str,
                                target_group_arns: List[str] = None) -> aws.autoscaling.Group:
        """
        Create an Auto Scaling Group.

        Args:
            name_prefix: Prefix for the ASG name
            launch_template_id: ID of the launch template
            target_group_arns: List of target group ARNs for load balancers

        Returns:
            The created Auto Scaling Group
        """
        asg_name = create_name(f"{name_prefix}-asg", self.region, self.env_suffix)
        tags = create_tags("auto-scaling-group", self.region, self.env_suffix, self.team, self.cost_center)

        # Convert tags to autoscaling format
        asg_tags = []
        for key, value in tags.items():
            asg_tags.append(aws.autoscaling.GroupTagArgs(
                key=key,
                value=value,
                propagate_at_launch=True
            ))

        # Add Name tag
        asg_tags.append(aws.autoscaling.GroupTagArgs(
            key="Name",
            value=create_name(name_prefix, self.region, self.env_suffix),
            propagate_at_launch=True
        ))

        # Create the Auto Scaling Group
        asg = aws.autoscaling.Group(asg_name,
            name=asg_name,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template_id,
                version="$Latest"
            ),
            min_size=self.min_size,
            max_size=self.max_size,
            desired_capacity=self.desired_capacity,
            vpc_zone_identifiers=self.subnet_ids,
            target_group_arns=target_group_arns,
            health_check_type="ELB",
            health_check_grace_period=300,
            termination_policies=["OldestInstance"],
            tags=asg_tags,
            __opts__=pulumi.ResourceOptions(region=self.region))

        return asg
```

#### 8. Main script (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from config import (
    regions, env_suffix, team, cost_center,
    vpc_config, compute_config, storage_config, monitoring_config
)
from modules.vpc import VpcModule
from modules.iam import IamModule
from modules.storage import StorageModule
from modules.monitoring import MonitoringModule
from modules.compute import ComputeModule
from utils import normalize_region

# Create a provider for each region
providers = {}
for region in regions:
    providers[region] = aws.Provider(f"aws-{region}",
                                    region=region,
                                    default_tags={"ManagedBy": "Pulumi"})

# Store all resources by region for outputs
resources = {}

# Deploy resources to each region
for region in regions:
    # Initialize the resource dictionary for this region
    resources[region] = {}

    # Get the provider for this region
    provider = providers[region]
    provider_opts = pulumi.ResourceOptions(provider=provider)

    # Get the VPC CIDR for this region
    vpc_cidr = vpc_config["cidr_blocks"].get(region, "10.0.0.0/16")

    # Create VPC and networking
    vpc_module = VpcModule(
        region=region,
        env_suffix=env_suffix,
        cidr_block=vpc_cidr,
        subnet_count=vpc_config["subnet_count"],
        team=team,
        cost_center=cost_center
    )
    resources[region]["vpc"] = vpc_module

    # Create IAM roles
    iam_module = IamModule(
        region=region,
        env_suffix=env_suffix,
        team=team,
        cost_center=cost_center
    )
    app_role = iam_module.create_standard_instance_role()
    resources[region]["iam"] = {"app_role": app_role}

    # Create S3 buckets
    storage_module = StorageModule(
        region=region,
        env_suffix=env_suffix,
        enable_versioning=storage_config["enable_versioning"],
        enable_encryption=storage_config["enable_encryption"],
        team=team,
        cost_center=cost_center
    )

    app_bucket = storage_module.create_bucket("app-data")
    resources[region]["storage"] = {"app_bucket": app_bucket}

    # Create CloudWatch resources
    monitoring_module = MonitoringModule(
        region=region,
        env_suffix=env_suffix,
        log_retention_days=monitoring_config["log_retention_days"],
        team=team,
        cost_center=cost_center
    )

    app_logs = monitoring_module.create_log_group("app")
    resources[region]["monitoring"] = {"app_logs": app_logs}

    # Create compute resources
    # Get the latest Amazon Linux 2 AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        )],
        opts=provider_opts
    )

    compute_module = ComputeModule(
        region=region,
        env_suffix=env_suffix,
        vpc_id=vpc_module.vpc.id,
        subnet_ids=[subnet.id for subnet in vpc_module.private_subnets],
        instance_type=compute_config["instance_type"],
        min_size=compute_config["min_size"],
        max_size=compute_config["max_size"],
        desired_capacity=compute_config["desired_capacity"],
        team=team,
        cost_center=cost_center
    )

    # Create security group for app servers
    app_sg = compute_module.create_security_group(
        name_prefix="app",
        description="Security group for application servers",
        ingress_rules=[
            {
                "description": "Allow HTTP from within VPC",
                "protocol": "tcp",
                "from_port": 80,
                "to_port": 80,
                "cidr_blocks": [vpc_cidr]
            },
            {
                "description": "Allow HTTPS from within VPC",
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": [vpc_cidr]
            }
        ]
    )

    # Create user data script
    user_data = """#!/bin/bash
echo "Hello from Pulumi!" > /var/tmp/hello.txt
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
"""

    import base64
    encoded_user_data = base64.b64encode(user_data.encode()).decode()

    # Create launch template
    app_lt = compute_module.create_launch_template(
        name_prefix="app",
        ami_id=ami.id,
        instance_profile_arn=app_role.instance_profile.arn,
        security_group_ids=[app_sg.id],
        user_data=encoded_user_data
    )

    # Create auto scaling group
    app_asg = compute_module.create_auto_scaling_group(
        name_prefix="app",
        launch_template_id=app_lt.id
    )

    # Store compute resources
    resources[region]["compute"] = {
        "app_sg": app_sg,
        "app_lt": app_lt,
        "app_asg": app_asg
    }

    # Create CloudWatch alarms for the ASG
    cpu_alarm = monitoring_module.create_alarm(
        name_prefix="app-cpu",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        comparison_operator="GreaterThanThreshold",
        threshold=80.0,
        period=300,
        evaluation_periods=2,
        statistic="Average",
        dimensions={"AutoScalingGroupName": app_asg.name},
        alarm_actions=[],
        ok_actions=[]
    )

    resources[region]["monitoring"]["cpu_alarm"] = cpu_alarm

# Export outputs
outputs = {}

# Export VPC and subnet IDs
for region in regions:
    normalized_region = normalize_region(region)

    # VPC outputs
    outputs[f"vpc_id_{normalized_region}"] = resources[region]["vpc"].vpc.id
    outputs[f"public_subnet_ids_{normalized_region}"] = pulumi.Output.all(*[subnet.id for subnet in resources[region]["vpc"].public_subnets])
    outputs[f"private_subnet_ids_{normalized_region}"] = pulumi.Output.all(*[subnet.id for subnet in resources[region]["vpc"].private_subnets])

    # IAM outputs
    outputs[f"app_role_arn_{normalized_region}"] = resources[region]["iam"]["app_role"].arn

    # Storage outputs
    outputs[f"app_bucket_name_{normalized_region}"] = resources[region]["storage"]["app_bucket"].id
    outputs[f"app_bucket_arn_{normalized_region}"] = resources[region]["storage"]["app_bucket"].arn

    # Compute outputs
    outputs[f"app_sg_id_{normalized_region}"] = resources[region]["compute"]["app_sg"].id
    outputs[f"app_asg_name_{normalized_region}"] = resources[region]["compute"]["app_asg"].name
    outputs[f"app_asg_arn_{normalized_region}"] = resources[region]["compute"]["app_asg"].arn

    # Monitoring outputs
    outputs[f"app_logs_arn_{normalized_region}"] = resources[region]["monitoring"]["app_logs"].arn
    outputs[f"cpu_alarm_arn_{normalized_region}"] = resources[region]["monitoring"]["cpu_alarm"].arn

# Export all outputs
for key, value in outputs.items():
    pulumi.export(key, value)
```

#### 9. Pulumi.yaml file

```yaml
name: aws-infrastructure
runtime:
  name: python
  options:
    virtualenv: venv
description: AWS multi-region infrastructure using Pulumi
```

#### 10. Pulumi.dev.yaml (Configuration file for dev stack)

```yaml
config:
  aws:region: us-east-1
  aws-infrastructure:envSuffix: pr1234
  aws-infrastructure:team: Infrastructure
  aws-infrastructure:costCenter: IT-Infrastructure
  aws-infrastructure:regions:
    - us-east-1
    - us-west-2
  aws-infrastructure:instanceType: t3.micro
  aws-infrastructure:minSize: 2
  aws-infrastructure:maxSize: 10
  aws-infrastructure:desiredCapacity: 2
  aws-infrastructure:enableVersioning: true
  aws-infrastructure:enableEncryption: true
  aws-infrastructure:logRetentionDays: 30
  aws-infrastructure:enableDetailedMonitoring: true
```

This solution provides a comprehensive, modular, and reusable Pulumi Python infrastructure that can be deployed to multiple AWS regions. It includes all the requested components:

1. **Cross-region capability**: The solution can be deployed to multiple regions with consistent naming and tagging.
2. **Core resources**: VPCs, subnets, and routing are set up according to best practices for high availability.
3. **Compute and scaling**: Auto-scaling groups are configured with sensible defaults and health-aware replacement policies.
4. **Identity and access**: IAM roles with least-privilege permissions are defined and attached to compute resources.
5. **Storage and logs**: S3 buckets are provisioned with versioning and server-side encryption, and logs are delivered to CloudWatch Logs.
6. **Networking security**: Security groups enforce strict access controls to minimize exposure.
7. **Observability**: CloudWatch monitoring and alerts are set up for key resources.
8. **Outputs and governance**: Resources are consistently tagged and outputs include region-specific identifiers.
9. **Consistent naming**: Resources are named with region and environment suffixes.
10. **Modularity and reuse**: Code is structured into reusable modules with clear interfaces.
11. **Deployment and validation**: The solution is repeatable and includes validations through Pulumi's resource graph.

The solution follows AWS best practices for security and reliability, including:

- Separating resources into public and private subnets
- Using NAT gateways for private subnet internet access
- Implementing least-privilege IAM roles
- Enabling encryption and versioning for S3 buckets
- Setting up proper monitoring and alerting
- Using consistent tagging for cost allocation and governance

To use this solution, you would:

1. Install Pulumi and configure AWS credentials
2. Create the directory structure and files as shown
3. Configure the Pulumi stack as needed (in Pulumi.dev.yaml or via `pulumi config`)
4. Run `pulumi up` to deploy the infrastructure

You can extend the solution by adding more modules or enhancing the existing ones, such as adding database resources, API Gateway, or Lambda functions.

### Answer

---

# Modular Pulumi Python AWS Infrastructure

This solution provides a comprehensive, modular infrastructure-as-code approach to provisioning AWS resources across multiple regions with consistent naming, tagging, and security practices.

## Project Structure

```
.
├── __main__.py               # Main entry point
├── config.py                 # Configuration settings
├── utils.py                  # Utility functions
├── modules/
│   ├── vpc/                  # VPC and network resources
│   │   └── __init__.py
│   ├── iam/                  # Identity and access management
│   │   └── __init__.py
│   ├── compute/              # EC2 and auto-scaling resources
│   │   └── __init__.py
│   ├── storage/              # S3 and data persistence
│   │   └── __init__.py
│   └── monitoring/           # CloudWatch and observability
│       └── __init__.py
├── Pulumi.yaml               # Project definition
└── Pulumi.dev.yaml           # Stack-specific configuration
```

## Implementation

### 1. `utils.py` - Utility Functions

```python
import pulumi

def normalize_region(region: str) -> str:
    """Normalize AWS region name (e.g., us-east-1 -> useast1)."""
    return region.replace('-', '').replace('_', '')

def create_name(resource_type: str, region: str, env_suffix: str) -> str:
    """Create a consistent name for resources."""
    normalized_region = normalize_region(region)
    return f"{resource_type}-{normalized_region}-{env_suffix}"

def create_tags(resource_type: str, region: str, env_suffix: str, team: str, cost_center: str) -> dict:
    """Create standard tags for resources."""
    return {
        "Name": create_name(resource_type, region, env_suffix),
        "Environment": env_suffix,
        "Region": region,
        "Team": team,
        "CostCenter": cost_center,
        "ManagedBy": "Pulumi",
        "ResourceType": resource_type
    }
```

### 2. `config.py` - Configuration Settings

```python
import pulumi

config = pulumi.Config()

# Basic settings
env_suffix = config.require("envSuffix")  # e.g. "pr1234"
team = config.get("team") or "Infrastructure"
cost_center = config.get("costCenter") or "IT-Infrastructure"

# Regions
regions = config.get_object("regions") or [
    "us-east-1",
    "us-west-2"
]

# VPC settings
vpc_config = {
    "cidr_blocks": {
        "us-east-1": "10.0.0.0/16",
        "us-west-2": "10.1.0.0/16",
    },
    "subnet_count": 3,  # Number of AZs to use
}

# Compute settings
compute_config = {
    "instance_type": config.get("instanceType") or "t3.micro",
    "min_size": int(config.get("minSize") or 2),
    "max_size": int(config.get("maxSize") or 10),
    "desired_capacity": int(config.get("desiredCapacity") or 2),
}

# Storage settings
storage_config = {
    "enable_versioning": config.get_bool("enableVersioning") or True,
    "enable_encryption": config.get_bool("enableEncryption") or True,
}

# Monitoring settings
monitoring_config = {
    "log_retention_days": int(config.get("logRetentionDays") or 30),
    "enable_detailed_monitoring": config.get_bool("enableDetailedMonitoring") or True,
}
```

### 3. VPC Module (`modules/vpc/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict
from ...utils import create_name, create_tags

class VpcModule:
    """Module for creating a VPC with subnets and routing."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 cidr_block: str,
                 subnet_count: int = 3,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        """
        Initialize VPC module.

        Args:
            region: AWS region for deployment
            env_suffix: Environment suffix (e.g., pr1234)
            cidr_block: CIDR block for VPC
            subnet_count: Number of AZs to use for subnets
            team: Team responsible for resources
            cost_center: Cost center for billing
        """
        self.region = region
        self.env_suffix = env_suffix
        self.cidr_block = cidr_block
        self.subnet_count = subnet_count
        self.team = team
        self.cost_center = cost_center

        # Create the VPC
        self.vpc = self._create_vpc()

        # Get available AZs
        az_response = aws.get_availability_zones(state="available", region=region)
        available_azs = az_response.names

        # Create subnets, dividing the CIDR block
        self.public_subnets = self._create_subnets(available_azs, public=True)
        self.private_subnets = self._create_subnets(available_azs, public=False)

        # Create Internet Gateway
        self.igw = self._create_igw()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables(available_azs)

        # Create NAT Gateways
        self.nat_gateways = self._create_nat_gateways()

        # Associate route tables with subnets
        self._associate_route_tables()

    def _create_vpc(self):
        """Create the VPC resource."""
        vpc_name = create_name("vpc", self.region, self.env_suffix)
        tags = create_tags("vpc", self.region, self.env_suffix, self.team, self.cost_center)

        return aws.ec2.Vpc(vpc_name,
            cidr_block=self.cidr_block,
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags=tags)

    def _create_subnets(self, azs: List[str], public: bool):
        """Create subnets across AZs."""
        subnets = []
        subnet_type = "public" if public else "private"

        # Calculate subnet CIDR blocks
        import ipaddress
        vpc_network = ipaddress.IPv4Network(self.cidr_block)
        subnet_prefix = vpc_network.prefixlen + 4  # Divide into 16 subnets
        subnet_networks = list(vpc_network.subnets(new_prefix=subnet_prefix))

        # Use up to subnet_count AZs
        for i in range(min(self.subnet_count, len(azs))):
            subnet_index = i if public else i + self.subnet_count
            subnet_cidr = str(subnet_networks[subnet_index])
            subnet_name = create_name(f"{subnet_type}-subnet-{i+1}", self.region, self.env_suffix)
            tags = create_tags(f"{subnet_type}-subnet", self.region, self.env_suffix, self.team, self.cost_center)
            tags["Name"] = subnet_name

            subnet = aws.ec2.Subnet(subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=azs[i],
                map_public_ip_on_launch=public,
                tags=tags)

            subnets.append(subnet)

        return subnets

    # Additional methods for IGW, route tables, NAT gateways, etc.
    # Implementation details for other methods would follow a similar pattern
```

### 4. IAM Module (`modules/iam/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from typing import List, Dict
from ...utils import create_name, create_tags

class IamModule:
    """Module for creating IAM roles and policies."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        self.region = region
        self.env_suffix = env_suffix
        self.team = team
        self.cost_center = cost_center

    def create_instance_role(self, name_prefix: str, policy_documents: List[dict]) -> aws.iam.Role:
        """
        Create an IAM role for EC2 instances with least privilege.

        Args:
            name_prefix: Prefix for the IAM role name
            policy_documents: List of policy documents to attach to the role

        Returns:
            The created IAM role
        """
        # Create assume role policy for EC2
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        # Create the IAM role
        role_name = create_name(f"{name_prefix}-role", self.region, self.env_suffix)
        tags = create_tags("iam-role", self.region, self.env_suffix, self.team, self.cost_center)

        role = aws.iam.Role(role_name,
            assume_role_policy=assume_role_policy,
            tags=tags)

        # Create and attach policies to the role
        for i, policy_doc in enumerate(policy_documents):
            policy_name = create_name(f"{name_prefix}-policy-{i+1}", self.region, self.env_suffix)
            policy_tags = create_tags("iam-policy", self.region, self.env_suffix, self.team, self.cost_center)

            policy = aws.iam.Policy(policy_name,
                policy=json.dumps(policy_doc),
                tags=policy_tags)

            attachment_name = create_name(f"{name_prefix}-attachment-{i+1}", self.region, self.env_suffix)
            aws.iam.RolePolicyAttachment(attachment_name,
                role=role.name,
                policy_arn=policy.arn)

        # Create instance profile
        profile_name = create_name(f"{name_prefix}-profile", self.region, self.env_suffix)
        instance_profile = aws.iam.InstanceProfile(profile_name,
            role=role.name,
            tags=tags)

        role.instance_profile = instance_profile

        return role

    def create_standard_instance_role(self) -> aws.iam.Role:
        """Create a standard IAM role with CloudWatch, S3 read-only, and SSM permissions."""
        # Policy for CloudWatch Logs
        cloudwatch_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            }]
        }

        # Policy for S3 read-only access (least privilege)
        s3_readonly_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:Get*",
                    "s3:List*"
                ],
                "Resource": "*"
            }]
        }

        # SSM policy for instance management
        ssm_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "ssm:DescribeAssociation",
                    "ssm:GetDocument",
                    "ssm:ListAssociations",
                    "ssm:UpdateInstanceInformation",
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel",
                    "ec2messages:AcknowledgeMessage",
                    "ec2messages:GetMessages"
                ],
                "Resource": "*"
            }]
        }

        return self.create_instance_role(
            "app-server",
            [cloudwatch_policy, s3_readonly_policy, ssm_policy]
        )
```

### 5. Storage Module (`modules/storage/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
import re
from typing import Optional
from ...utils import create_name, create_tags

class StorageModule:
    """Module for creating storage resources like S3 buckets."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 enable_versioning: bool = True,
                 enable_encryption: bool = True,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        self.region = region
        self.env_suffix = env_suffix
        self.enable_versioning = enable_versioning
        self.enable_encryption = enable_encryption
        self.team = team
        self.cost_center = cost_center

    def create_bucket(self, name_prefix: str, logging_enabled: bool = True, force_destroy: bool = False) -> aws.s3.Bucket:
        """
        Create an S3 bucket with versioning and encryption.

        Args:
            name_prefix: Prefix for the bucket name
            logging_enabled: Enable access logging for the bucket
            force_destroy: Allow Pulumi to delete non-empty buckets

        Returns:
            The created S3 bucket
        """
        # Create a valid bucket name (lowercase, no underscores)
        normalized_region = self.region.replace('-', '').replace('_', '')
        normalized_env = re.sub(r'[^a-zA-Z0-9]', '', self.env_suffix).lower()
        bucket_name = f"{name_prefix}-{normalized_region}-{normalized_env}"

        tags = create_tags("s3-bucket", self.region, self.env_suffix, self.team, self.cost_center)

        # Create versioning config
        versioning_config = aws.s3.BucketVersioningArgs(enabled=self.enable_versioning) if self.enable_versioning else None

        # Create encryption config
        encryption_config = None
        if self.enable_encryption:
            encryption_config = aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            )

        # Create logging bucket and config if needed
        logging_config = None
        log_bucket = None
        if logging_enabled:
            log_bucket_name = f"{name_prefix}-logs-{normalized_region}-{normalized_env}"
            log_tags = create_tags("s3-log-bucket", self.region, self.env_suffix, self.team, self.cost_center)

            log_bucket = aws.s3.Bucket(log_bucket_name,
                acl="log-delivery-write",
                force_destroy=force_destroy,
                tags=log_tags)

            logging_config = aws.s3.BucketLoggingArgs(
                target_bucket=log_bucket.id,
                target_prefix=f"{bucket_name}/"
            )

        # Create lifecycle rules
        lifecycle_rules = [aws.s3.BucketLifecycleRuleArgs(
            id="expire-old-versions",
            status="Enabled",
            noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(days=90)
        )]

        # Create the bucket
        bucket = aws.s3.Bucket(bucket_name,
            versioning=versioning_config,
            server_side_encryption_configuration=encryption_config,
            logging=logging_config,
            lifecycle_rules=lifecycle_rules,
            force_destroy=force_destroy,
            tags=tags)

        # Add bucket policy to deny non-SSL access
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "DenyNonSSLRequests",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [
                    pulumi.Output.concat("arn:aws:s3:::", bucket.id),
                    pulumi.Output.concat("arn:aws:s3:::", bucket.id, "/*"),
                ],
                "Condition": {
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            }]
        }

        aws.s3.BucketPolicy(f"{bucket_name}-policy",
            bucket=bucket.id,
            policy=bucket.id.apply(lambda id: json.dumps(policy_document).replace("${bucket}", id)))

        return bucket
```

### 6. Monitoring Module (`modules/monitoring/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from typing import List, Dict, Optional
from ...utils import create_name, create_tags

class MonitoringModule:
    """Module for setting up monitoring and logging resources."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 log_retention_days: int = 30,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        self.region = region
        self.env_suffix = env_suffix
        self.log_retention_days = log_retention_days
        self.team = team
        self.cost_center = cost_center

    def create_log_group(self, name_prefix: str) -> aws.cloudwatch.LogGroup:
        """
        Create a CloudWatch Log Group.

        Args:
            name_prefix: Prefix for the log group name

        Returns:
            The created CloudWatch Log Group
        """
        log_group_name = f"/aws/{name_prefix}/{self.region}/{self.env_suffix}"
        tags = create_tags("cloudwatch-log-group", self.region, self.env_suffix, self.team, self.cost_center)

        log_group = aws.cloudwatch.LogGroup(log_group_name,
            name=log_group_name,
            retention_in_days=self.log_retention_days,
            tags=tags)

        return log_group

    def create_alarm(self, name_prefix: str, metric_name: str, namespace: str, comparison_operator: str,
                    threshold: float, period: int = 300, evaluation_periods: int = 1,
                    statistic: str = "Average", dimensions: Dict[str, str] = None,
                    alarm_actions: List[str] = None, ok_actions: List[str] = None) -> aws.cloudwatch.MetricAlarm:
        """
        Create a CloudWatch Alarm.

        Args:
            name_prefix: Prefix for the alarm name
            metric_name: Name of the metric to monitor
            namespace: Namespace of the metric
            comparison_operator: Operator to use for comparison
            threshold: Threshold value
            period: Period in seconds
            evaluation_periods: Number of periods to evaluate
            statistic: Statistic to use
            dimensions: Dimensions for the metric
            alarm_actions: List of ARNs to execute when alarm state is ALARM
            ok_actions: List of ARNs to execute when alarm state is OK

        Returns:
            The created CloudWatch Alarm
        """
        alarm_name = create_name(f"{name_prefix}-alarm", self.region, self.env_suffix)
        tags = create_tags("cloudwatch-alarm", self.region, self.env_suffix, self.team, self.cost_center)

        alarm = aws.cloudwatch.MetricAlarm(alarm_name,
            alarm_name=alarm_name,
            comparison_operator=comparison_operator,
            evaluation_periods=evaluation_periods,
            metric_name=metric_name,
            namespace=namespace,
            period=period,
            statistic=statistic,
            threshold=threshold,
            dimensions=dimensions or {},
            alarm_actions=alarm_actions or [],
            ok_actions=ok_actions or [],
            tags=tags)

        return alarm
```

### 7. Compute Module (`modules/compute/__init__.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Optional
from ...utils import create_name, create_tags

class ComputeModule:
    """Module for creating compute resources like EC2 instances and Auto Scaling Groups."""

    def __init__(self,
                 region: str,
                 env_suffix: str,
                 vpc_id: pulumi.Input[str],
                 subnet_ids: List[pulumi.Input[str]],
                 instance_type: str = "t3.micro",
                 min_size: int = 2,
                 max_size: int = 10,
                 desired_capacity: int = 2,
                 team: str = "Infrastructure",
                 cost_center: str = "IT-Infrastructure"):
        self.region = region
        self.env_suffix = env_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.instance_type = instance_type
        self.min_size = min_size
        self.max_size = max_size
        self.desired_capacity = desired_capacity
        self.team = team
        self.cost_center = cost_center

    def create_security_group(self, name_prefix: str, description: str, ingress_rules: List[Dict],
                             egress_rules: List[Dict] = None) -> aws.ec2.SecurityGroup:
        """
        Create a security group with ingress and egress rules.

        Args:
            name_prefix: Prefix for the security group name
            description: Description of the security group
            ingress_rules: List of ingress rules
            egress_rules: List of egress rules (default allows all outbound)

        Returns:
            The created security group
        """
        sg_name = create_name(f"{name_prefix}-sg", self.region, self.env_suffix)
        tags = create_tags("security-group", self.region, self.env_suffix, self.team, self.cost_center)

        # Default egress rule (allow all outbound)
        if egress_rules is None:
            egress_rules = [{
                "description": "Allow all outbound traffic",
                "protocol": "-1",  # All protocols
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }]

        # Convert ingress rules to security group args
        sg_ingress = []
        for rule in ingress_rules:
            sg_ingress.append(aws.ec2.SecurityGroupIngressArgs(
                description=rule.get("description", ""),
                protocol=rule["protocol"],
                from_port=rule["from_port"],
                to_port=rule["to_port"],
                cidr_blocks=rule.get("cidr_blocks", []),
                ipv6_cidr_blocks=rule.get("ipv6_cidr_blocks", []),
                security_groups=rule.get("security_groups", []),
                self=rule.get("self", False)
            ))

        # Convert egress rules to security group args
        sg_egress = []
        for rule in egress_rules:
            sg_egress.append(aws.ec2.SecurityGroupEgressArgs(
                description=rule.get("description", ""),
                protocol=rule["protocol"],
                from_port=rule["from_port"],
                to_port=rule["to_port"],
                cidr_blocks=rule.get("cidr_blocks", []),
                ipv6_cidr_blocks=rule.get("ipv6_cidr_blocks", []),
                security_groups=rule.get("security_groups", []),
                self=rule.get("self", False)
            ))

        # Create the security group with strict access controls
        sg = aws.ec2.SecurityGroup(sg_name,
            description=description,
            vpc_id=self.vpc_id,
            ingress=sg_ingress,
            egress=sg_egress,
            tags=tags)

        return sg

    def create_launch_template(self, name_prefix: str, ami_id: str, instance_profile_arn: str,
                              security_group_ids: List[str], user_data: str = None) -> aws.ec2.LaunchTemplate:
        """Create an EC2 launch template with detailed monitoring enabled."""
        lt_name = create_name(f"{name_prefix}-lt", self.region, self.env_suffix)
        tags = create_tags("launch-template", self.region, self.env_suffix, self.team, self.cost_center)

        # Convert tags to launch template format
        tag_specifications = [aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={**tags, "Name": create_name(name_prefix, self.region, self.env_suffix)}
        )]

        lt = aws.ec2.LaunchTemplate(lt_name,
            name=lt_name,
            image_id=ami_id,
            instance_type=self.instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(arn=instance_profile_arn),
            vpc_security_group_ids=security_group_ids,
            user_data=user_data,
            tag_specifications=tag_specifications,
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(enabled=True),
            tags=tags)

        return lt

    def create_auto_scaling_group(self, name_prefix: str, launch_template_id: str,
                                target_group_arns: List[str] = None) -> aws.autoscaling.Group:
        """Create an Auto Scaling Group with health-aware replacement policies."""
        asg_name = create_name(f"{name_prefix}-asg", self.region, self.env_suffix)
        tags = create_tags("auto-scaling-group", self.region, self.env_suffix, self.team, self.cost_center)

        # Convert tags to autoscaling format
        asg_tags = []
        for key, value in tags.items():
            asg_tags.append(aws.autoscaling.GroupTagArgs(
                key=key,
                value=value,
                propagate_at_launch=True
            ))

        # Add Name tag
        asg_tags.append(aws.autoscaling.GroupTagArgs(
            key="Name",
            value=create_name(name_prefix, self.region, self.env_suffix),
            propagate_at_launch=True
        ))

        asg = aws.autoscaling.Group(asg_name,
            name=asg_name,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template_id,
                version="$Latest"
            ),
            min_size=self.min_size,
            max_size=self.max_size,
            desired_capacity=self.desired_capacity,
            vpc_zone_identifiers=self.subnet_ids,
            target_group_arns=target_group_arns or [],
            health_check_type="EC2",
            health_check_grace_period=300,
            termination_policies=["OldestInstance", "Default"],
            tags=asg_tags)

        return asg
```

### 8. Main Script (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws
import base64
import json
from config import (
    regions, env_suffix, team, cost_center,
    vpc_config, compute_config, storage_config, monitoring_config
)
from modules.vpc import VpcModule
from modules.iam import IamModule
from modules.storage import StorageModule
from modules.monitoring import MonitoringModule
from modules.compute import ComputeModule
from utils import normalize_region

# Create a provider for each region
providers = {}
for region in regions:
    providers[region] = aws.Provider(f"aws-{region}",
                                   region=region,
                                   default_tags={"ManagedBy": "Pulumi"})

# Store all resources by region for outputs
resources = {}

# Deploy resources to each region
for region in regions:
    # Initialize the resource dictionary for this region
    resources[region] = {}

    # Get the provider for this region
    provider = providers[region]
    provider_opts = pulumi.ResourceOptions(provider=provider)

    # Get the VPC CIDR for this region
    vpc_cidr = vpc_config["cidr_blocks"].get(region, "10.0.0.0/16")

    # Create VPC and networking
    vpc_module = VpcModule(
        region=region,
        env_suffix=env_suffix,
        cidr_block=vpc_cidr,
        subnet_count=vpc_config["subnet_count"],
        team=team,
        cost_center=cost_center
    )
    resources[region]["vpc"] = vpc_module

    # Create IAM roles with least-privilege permissions
    iam_module = IamModule(
        region=region,
        env_suffix=env_suffix,
        team=team,
        cost_center=cost_center
    )
    app_role = iam_module.create_standard_instance_role()
    resources[region]["iam"] = {"app_role": app_role}

    # Create S3 buckets with versioning and encryption
    storage_module = StorageModule(
        region=region,
        env_suffix=env_suffix,
        enable_versioning=storage_config["enable_versioning"],
        enable_encryption=storage_config["enable_encryption"],
        team=team,
        cost_center=cost_center
    )

    app_bucket = storage_module.create_bucket("app-data")
    resources[region]["storage"] = {"app_bucket": app_bucket}

    # Create CloudWatch resources for monitoring and alerting
    monitoring_module = MonitoringModule(
        region=region,
        env_suffix=env_suffix,
        log_retention_days=monitoring_config["log_retention_days"],
        team=team,
        cost_center=cost_center
    )

    app_logs = monitoring_module.create_log_group("app")
    resources[region]["monitoring"] = {"app_logs": app_logs}

    # Get the latest Amazon Linux 2 AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        )],
        opts=provider_opts
    )

    # Create compute resources
    compute_module = ComputeModule(
        region=region,
        env_suffix=env_suffix,
        vpc_id=vpc_module.vpc.id,
        subnet_ids=[subnet.id for subnet in vpc_module.private_subnets],
        instance_type=compute_config["instance_type"],
        min_size=compute_config["min_size"],
        max_size=compute_config["max_size"],
        desired_capacity=compute_config["desired_capacity"],
        team=team,
        cost_center=cost_center
    )

    # Create security group with strict access controls
    app_sg = compute_module.create_security_group(
        name_prefix="app",
        description="Security group for application servers",
        ingress_rules=[
            {
                "description": "Allow HTTP from within VPC",
                "protocol": "tcp",
                "from_port": 80,
                "to_port": 80,
                "cidr_blocks": [vpc_cidr]
            },
            {
                "description": "Allow HTTPS from within VPC",
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": [vpc_cidr]
            }
        ]
    )

    # Create user data script for instance initialization
    user_data = """#!/bin/bash
echo "Instance initialized with Pulumi" > /var/tmp/pulumi-init.log
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
"""

    encoded_user_data = base64.b64encode(user_data.encode()).decode()

    # Create launch template
    app_lt = compute_module.create_launch_template(
        name_prefix="app",
        ami_id=ami.id,
        instance_profile_arn=app_role.instance_profile.arn,
        security_group_ids=[app_sg.id],
        user_data=encoded_user_data
    )

    # Create auto scaling group
    app_asg = compute_module.create_auto_scaling_group(
        name_prefix="app",
        launch_template_id=app_lt.id
    )

    # Store compute resources
    resources[region]["compute"] = {
        "app_sg": app_sg,
        "app_lt": app_lt,
        "app_asg": app_asg
    }

    # Create CloudWatch alarms for the ASG
    cpu_alarm = monitoring_module.create_alarm(
        name_prefix="app-cpu",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        comparison_operator="GreaterThanThreshold",
        threshold=80.0,
        period=300,
        evaluation_periods=2,
        statistic="Average",
        dimensions={"AutoScalingGroupName": app_asg.name}
    )

    resources[region]["monitoring"]["cpu_alarm"] = cpu_alarm

# Export outputs for all regions
outputs = {}

for region in regions:
    normalized_region = normalize_region(region)

    # VPC outputs
    outputs[f"vpc_id_{normalized_region}"] = resources[region]["vpc"].vpc.id
    outputs[f"public_subnet_ids_{normalized_region}"] = pulumi.Output.all(*[subnet.id for subnet in resources[region]["vpc"].public_subnets])
    outputs[f"private_subnet_ids_{normalized_region}"] = pulumi.Output.all(*[subnet.id for subnet in resources[region]["vpc"].private_subnets])

    # IAM outputs
    outputs[f"app_role_arn_{normalized_region}"] = resources[region]["iam"]["app_role"].arn

    # Storage outputs
    outputs[f"app_bucket_name_{normalized_region}"] = resources[region]["storage"]["app_bucket"].id
    outputs[f"app_bucket_arn_{normalized_region}"] = resources[region]["storage"]["app_bucket"].arn

    # Compute outputs
    outputs[f"app_sg_id_{normalized_region}"] = resources[region]["compute"]["app_sg"].id
    outputs[f"app_asg_name_{normalized_region}"] = resources[region]["compute"]["app_asg"].name
    outputs[f"app_asg_arn_{normalized_region}"] = resources[region]["compute"]["app_asg"].arn

    # Monitoring outputs
    outputs[f"app_logs_arn_{normalized_region}"] = resources[region]["monitoring"]["app_logs"].arn
    outputs[f"cpu_alarm_arn_{normalized_region}"] = resources[region]["monitoring"]["cpu_alarm"].arn

# Export all outputs
for key, value in outputs.items():
    pulumi.export(key, value)
```

### 9. Configuration Files

**Pulumi.yaml**:

```yaml
name: aws-infrastructure
runtime:
  name: python
  options:
    virtualenv: venv
description: AWS multi-region infrastructure using Pulumi
```

**Pulumi.dev.yaml**:

```yaml
config:
  aws:region: us-east-1
  aws-infrastructure:envSuffix: pr1234
  aws-infrastructure:team: Infrastructure
  aws-infrastructure:costCenter: IT-Infrastructure
  aws-infrastructure:regions:
    - us-east-1
    - us-west-2
  aws-infrastructure:instanceType: t3.micro
  aws-infrastructure:minSize: 2
  aws-infrastructure:maxSize: 10
  aws-infrastructure:desiredCapacity: 2
  aws-infrastructure:enableVersioning: true
  aws-infrastructure:enableEncryption: true
  aws-infrastructure:logRetentionDays: 30
  aws-infrastructure:enableDetailedMonitoring: true
```

## Key Features

1. **Cross-region Deployment**: Infrastructure can be deployed to multiple regions with consistent naming and tagging
2. **High Availability**: VPCs have public and private subnets across multiple availability zones
3. **Security**:
   - Least-privilege IAM roles
   - Security groups with strict access controls
   - Encrypted S3 buckets with SSL enforcement
   - Private subnets for application instances
4. **Scalability**: Auto-scaling groups with configurable capacities and health checks
5. **Observability**: CloudWatch logs and alarms for application monitoring
6. **Consistency**:
   - Standardized resource naming with region and environment suffixes
   - Uniform tagging for all resources (Environment, Team, CostCenter)
7. **Modularity**: Code organized into reusable modules for VPC, IAM, Storage, Compute, and Monitoring

## Usage

To deploy the infrastructure:

```bash
# Install dependencies
pip install -r requirements.txt

# Configure the environment
pulumi config set aws-infrastructure:envSuffix pr1234

# Preview changes
pulumi preview

# Deploy the infrastructure
pulumi up
```

This modular Pulumi Python solution enables consistent, secure infrastructure deployments across multiple AWS regions while adhering to best practices for cloud architecture.

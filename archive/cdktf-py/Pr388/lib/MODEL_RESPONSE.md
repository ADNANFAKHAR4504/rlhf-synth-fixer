# AWS Multi-Environment Setup with CDK for Terraform (Python)

I'll create a comprehensive CDKTF Python application for managing three isolated AWS environments. This solution follows AWS best practices and implements proper infrastructure as code patterns.

## Project Structure

```
cdktf-aws/
├── main.py
├── stacks/
│   ├── __init__.py
│   ├── base_stack.py
│   ├── dev_stack.py
│   ├── test_stack.py
│   └── prod_stack.py
├── constructs/
│   ├── __init__.py
│   ├── vpc_construct.py
│   ├── security_construct.py
│   └── monitoring_construct.py
├── config/
│   ├── __init__.py
│   ├── dev.py
│   ├── test.py
│   └── prod.py
├── tests/
│   ├── __init__.py
│   ├── test_vpc_construct.py
│   ├── test_security_construct.py
│   └── test_monitoring_construct.py
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── requirements.txt
├── cdktf.json
├── pytest.ini
├── mypy.ini
└── README.md
```

## 1. Core Configuration Files

### `requirements.txt`

```txt
cdktf>=0.20.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
pytest>=7.0.0
pytest-cov>=4.0.0
mypy>=1.0.0
black>=23.0.0
flake8>=6.0.0
```

### `cdktf.json`

```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "aws-multi-env-cdktf",
  "sendCrashReports": "false",
  "terraformProviders": ["hashicorp/aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "@cdktf/provider-aws": {
      "excludeStackIdFromLogicalIds": true
    }
  }
}
```

## 2. Environment Configuration

### `config/__init__.py`

```python
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class EnvironmentConfig:
    """Base configuration class for environments."""
    environment: str
    vpc_cidr: str
    availability_zones: list[str]
    tags: Dict[str, str]
    monitoring_config: Dict[str, Any]
    security_config: Dict[str, Any]
```

### `config/dev.py`

```python
from .config import EnvironmentConfig

DEV_CONFIG = EnvironmentConfig(
    environment="dev",
    vpc_cidr="10.1.0.0/16",
    availability_zones=["us-west-2a", "us-west-2b"],
    tags={
        "Environment": "development",
        "Project": "multi-env-cdktf",
        "Owner": "dev-team",
        "CostCenter": "development"
    },
    monitoring_config={
        "log_retention_days": 7,
        "enable_detailed_monitoring": False,
        "alarm_threshold": 80
    },
    security_config={
        "enable_flow_logs": True,
        "enable_nacls": False,
        "ssh_access_cidrs": ["10.1.0.0/16"]
    }
)
```

### `config/test.py`

```python
from .config import EnvironmentConfig

TEST_CONFIG = EnvironmentConfig(
    environment="test",
    vpc_cidr="10.2.0.0/16",
    availability_zones=["us-west-2a", "us-west-2b"],
    tags={
        "Environment": "testing",
        "Project": "multi-env-cdktf",
        "Owner": "qa-team",
        "CostCenter": "testing"
    },
    monitoring_config={
        "log_retention_days": 14,
        "enable_detailed_monitoring": True,
        "alarm_threshold": 70
    },
    security_config={
        "enable_flow_logs": True,
        "enable_nacls": True,
        "ssh_access_cidrs": ["10.2.0.0/16"]
    }
)
```

### `config/prod.py`

```python
from .config import EnvironmentConfig

PROD_CONFIG = EnvironmentConfig(
    environment="prod",
    vpc_cidr="10.3.0.0/16",
    availability_zones=["us-west-2a", "us-west-2b", "us-west-2c"],
    tags={
        "Environment": "production",
        "Project": "multi-env-cdktf",
        "Owner": "ops-team",
        "CostCenter": "production"
    },
    monitoring_config={
        "log_retention_days": 90,
        "enable_detailed_monitoring": True,
        "alarm_threshold": 60
    },
    security_config={
        "enable_flow_logs": True,
        "enable_nacls": True,
        "ssh_access_cidrs": ["10.3.0.0/16"]
    }
)
```

## 3. Custom Constructs

### `constructs/vpc_construct.py`

```python
from typing import Dict, List
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class VpcConstruct(Construct):
    """VPC construct with public and private subnets across multiple AZs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc_cidr: str,
        availability_zones: List[str],
        environment: str,
        tags: Dict[str, str],
        enable_flow_logs: bool = True
    ):
        super().__init__(scope, construct_id)

        self.vpc_cidr = vpc_cidr
        self.availability_zones = availability_zones
        self.environment = environment
        self.tags = tags

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.igw = self._create_internet_gateway()

        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()

        # Create NAT Gateways
        self.nat_gateways = self._create_nat_gateways()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()

        # Enable VPC Flow Logs if requested
        if enable_flow_logs:
            self._create_flow_logs()

    def _create_vpc(self) -> Vpc:
        """Create the main VPC."""
        return Vpc(
            self,
            "vpc",
            cidr_block=self.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"{self.environment}-vpc"
            }
        )

    def _create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway."""
        return InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-igw"
            }
        )

    def _create_public_subnets(self) -> List[Subnet]:
        """Create public subnets across availability zones."""
        public_subnets = []

        for i, az in enumerate(self.availability_zones):
            # Calculate subnet CIDR (e.g., 10.1.1.0/24, 10.1.2.0/24)
            subnet_cidr = self._calculate_subnet_cidr(i, "public")

            subnet = Subnet(
                self,
                f"public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    "Name": f"{self.environment}-public-subnet-{i+1}",
                    "Type": "public"
                }
            )
            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> List[Subnet]:
        """Create private subnets across availability zones."""
        private_subnets = []

        for i, az in enumerate(self.availability_zones):
            # Calculate subnet CIDR (e.g., 10.1.10.0/24, 10.1.11.0/24)
            subnet_cidr = self._calculate_subnet_cidr(i, "private")

            subnet = Subnet(
                self,
                f"private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                tags={
                    **self.tags,
                    "Name": f"{self.environment}-private-subnet-{i+1}",
                    "Type": "private"
                }
            )
            private_subnets.append(subnet)

        return private_subnets

    def _create_nat_gateways(self) -> List[NatGateway]:
        """Create NAT Gateways for private subnet internet access."""
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"nat-eip-{i}",
                domain="vpc",
                tags={
                    **self.tags,
                    "Name": f"{self.environment}-nat-eip-{i+1}"
                }
            )

            # Create NAT Gateway
            nat_gw = NatGateway(
                self,
                f"nat-gateway-{i}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.tags,
                    "Name": f"{self.environment}-nat-gateway-{i+1}"
                }
            )
            nat_gateways.append(nat_gw)

        return nat_gateways

    def _create_public_route_table(self) -> RouteTable:
        """Create route table for public subnets."""
        route_table = RouteTable(
            self,
            "public-rt",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-public-rt"
            }
        )

        # Add route to Internet Gateway
        Route(
            self,
            "public-route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public-rt-association-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )

        return route_table

    def _create_private_route_tables(self) -> List[RouteTable]:
        """Create route tables for private subnets."""
        private_route_tables = []

        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            route_table = RouteTable(
                self,
                f"private-rt-{i}",
                vpc_id=self.vpc.id,
                tags={
                    **self.tags,
                    "Name": f"{self.environment}-private-rt-{i+1}"
                }
            )

            # Add route to NAT Gateway
            Route(
                self,
                f"private-route-{i}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )

            # Associate private subnet with route table
            RouteTableAssociation(
                self,
                f"private-rt-association-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )

            private_route_tables.append(route_table)

        return private_route_tables

    def _create_flow_logs(self) -> None:
        """Create VPC Flow Logs."""
        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "vpc-flow-logs",
            name=f"/aws/vpc/flowlogs/{self.environment}",
            retention_in_days=14,
            tags=self.tags
        )

        # Create IAM Role for Flow Logs
        flow_logs_role = IamRole(
            self,
            "flow-logs-role",
            name=f"{self.environment}-vpc-flow-logs-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        }
                    }
                ]
            }),
            tags=self.tags
        )

        # Create IAM Policy for Flow Logs
        IamRolePolicy(
            self,
            "flow-logs-policy",
            name=f"{self.environment}-vpc-flow-logs-policy",
            role=flow_logs_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Effect": "Allow",
                        "Resource": "*"
                    }
                ]
            })
        )

        # Create VPC Flow Log
        FlowLog(
            self,
            "vpc-flow-log",
            iam_role_arn=flow_logs_role.arn,
            log_destination=log_group.arn,
            log_destination_type="cloud-watch-logs",
            resource_id=self.vpc.id,
            resource_type="VPC",
            traffic_type="ALL",
            tags={
                **self.tags,
                "Name": f"{self.environment}-vpc-flow-log"
            }
        )

    def _calculate_subnet_cidr(self, index: int, subnet_type: str) -> str:
        """Calculate subnet CIDR based on VPC CIDR and index."""
        # Extract the first two octets from VPC CIDR (e.g., "10.1" from "10.1.0.0/16")
        vpc_base = ".".join(self.vpc_cidr.split(".")[:2])

        if subnet_type == "public":
            # Public subnets: 10.x.1.0/24, 10.x.2.0/24, etc.
            return f"{vpc_base}.{index + 1}.0/24"
        else:
            # Private subnets: 10.x.10.0/24, 10.x.11.0/24, etc.
            return f"{vpc_base}.{index + 10}.0/24"
```

### `constructs/security_construct.py`

```python
from typing import Dict, List
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl
from cdktf_cdktf_provider_aws.network_acl_rule import NetworkAclRule
from cdktf_cdktf_provider_aws.network_acl_association import NetworkAclAssociation


class SecurityConstruct(Construct):
    """Security construct for managing security groups and NACLs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc_id: str,
        environment: str,
        tags: Dict[str, str],
        ssh_access_cidrs: List[str],
        enable_nacls: bool = True
    ):
        super().__init__(scope, construct_id)

        self.vpc_id = vpc_id
        self.environment = environment
        self.tags = tags
        self.ssh_access_cidrs = ssh_access_cidrs

        # Create security groups
        self.web_sg = self._create_web_security_group()
        self.app_sg = self._create_app_security_group()
        self.db_sg = self._create_db_security_group()
        self.bastion_sg = self._create_bastion_security_group()

        # Create NACLs if enabled
        if enable_nacls:
            self.public_nacl = self._create_public_nacl()
            self.private_nacl = self._create_private_nacl()

    def _create_web_security_group(self) -> SecurityGroup:
        """Create security group for web tier."""
        sg = SecurityGroup(
            self,
            "web-sg",
            name=f"{self.environment}-web-sg",
            description="Security group for web tier",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-web-sg",
                "Tier": "web"
            }
        )

        # HTTP inbound
        SecurityGroupRule(
            self,
            "web-http-inbound",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id
        )

        # HTTPS inbound
        SecurityGroupRule(
            self,
            "web-https-inbound",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id
        )

        # All outbound
        SecurityGroupRule(
            self,
            "web-all-outbound",
            type="egress",
            from_port=0,
            to_port=65535,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id
        )

        return sg

    def _create_app_security_group(self) -> SecurityGroup:
        """Create security group for application tier."""
        sg = SecurityGroup(
            self,
            "app-sg",
            name=f"{self.environment}-app-sg",
            description="Security group for application tier",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-app-sg",
                "Tier": "application"
            }
        )

        return sg

    def _create_db_security_group(self) -> SecurityGroup:
        """Create security group for database tier."""
        sg = SecurityGroup(
            self,
            "db-sg",
            name=f"{self.environment}-db-sg",
            description="Security group for database tier",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-db-sg",
                "Tier": "database"
            }
        )

        return sg

    def _create_bastion_security_group(self) -> SecurityGroup:
        """Create security group for bastion host."""
        sg = SecurityGroup(
            self,
            "bastion-sg",
            name=f"{self.environment}-bastion-sg",
            description="Security group for bastion host",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-bastion-sg",
                "Purpose": "bastion"
            }
        )

        # SSH inbound from specified CIDRs
        for i, cidr in enumerate(self.ssh_access_cidrs):
            SecurityGroupRule(
                self,
                f"bastion-ssh-inbound-{i}",
                type="ingress",
                from_port=22,
                to_port=22,
                protocol="tcp",
                cidr_blocks=[cidr],
                security_group_id=sg.id
            )

        # All outbound
        SecurityGroupRule(
            self,
            "bastion-all-outbound",
            type="egress",
            from_port=0,
            to_port=65535,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id
        )

        return sg

    def _create_public_nacl(self) -> NetworkAcl:
        """Create Network ACL for public subnets."""
        nacl = NetworkAcl(
            self,
            "public-nacl",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-public-nacl"
            }
        )

        # HTTP inbound
        NetworkAclRule(
            self,
            "public-nacl-http-inbound",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            from_port=80,
            to_port=80,
            cidr_block="0.0.0.0/0"
        )

        # HTTPS inbound
        NetworkAclRule(
            self,
            "public-nacl-https-inbound",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            from_port=443,
            to_port=443,
            cidr_block="0.0.0.0/0"
        )

        # Ephemeral ports inbound
        NetworkAclRule(
            self,
            "public-nacl-ephemeral-inbound",
            network_acl_id=nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            from_port=1024,
            to_port=65535,
            cidr_block="0.0.0.0/0"
        )

        # All outbound
        NetworkAclRule(
            self,
            "public-nacl-all-outbound",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            from_port=0,
            to_port=65535,
            cidr_block="0.0.0.0/0"
        )

        return nacl

    def _create_private_nacl(self) -> NetworkAcl:
        """Create Network ACL for private subnets."""
        nacl = NetworkAcl(
            self,
            "private-nacl",
            vpc_id=self.vpc_id,
            tags={
                **self.tags,
                "Name": f"{self.environment}-private-nacl"
            }
        )

        # All inbound from VPC
        NetworkAclRule(
            self,
            "private-nacl-vpc-inbound",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            from_port=0,
            to_port=65535,
            cidr_block="10.0.0.0/8"
        )

        # All outbound
        NetworkAclRule(
            self,
            "private-nacl-all-outbound",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            from_port=0,
            to_port=65535,
            cidr_block="0.0.0.0/0"
        )

        return nacl
```

### `constructs/monitoring_construct.py`

```python
from typing import Dict, Any
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
import json


class MonitoringConstruct(Construct):
    """Monitoring construct for CloudWatch logs, metrics, and alarms."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        tags: Dict[str, str],
        monitoring_config: Dict[str, Any]
    ):
        super().__init__(scope, construct_id)

        self.environment = environment
        self.tags = tags
        self.monitoring_config = monitoring_config

        # Create SNS topic for alerts
        self.alert_topic = self._create_alert_topic()

        # Create CloudWatch log groups
        self.log_groups = self._create_log_groups()

        # Create CloudWatch alarms
        self.alarms = self._create_alarms()

        # Create CloudWatch dashboard
        self.dashboard = self._create_dashboard()

    def _create_alert_topic(self) -> SnsTopic:
        """Create SNS topic for monitoring alerts."""
        topic = SnsTopic(
            self,
            "alert-topic",
            name=f"{self.environment}-monitoring-alerts",
            tags={
                **self.tags,
                "Name": f"{self.environment}-monitoring-alerts"
            }
        )

        return topic

    def _create_log_groups(self) -> Dict[str, CloudwatchLogGroup]:
        """Create CloudWatch log groups for different services."""
        log_groups = {}

        services = ["application", "web", "database", "system"]

        for service in services:
            log_group = CloudwatchLogGroup(
                self,
                f"{service}-logs",
                name=f"/aws/{self.environment}/{service}",
                retention_in_days=self.monitoring_config.get("log_retention_days", 14),
                tags={
                    **self.tags,
                    "Service": service
                }
            )
            log_groups[service] = log_group

        return log_groups

    def _create_alarms(self) -> Dict[str, CloudwatchMetricAlarm]:
        """Create CloudWatch alarms for monitoring."""
        alarms = {}
        threshold = self.monitoring_config.get("alarm_threshold", 80)

        # CPU Utilization Alarm
        cpu_alarm = CloudwatchMetricAlarm(
            self,
            "high-cpu-alarm",
            alarm_name=f"{self.environment}-high-cpu-utilization",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=threshold,
            alarm_description=f"This metric monitors ec2 cpu utilization in {self.environment}",
            alarm_actions=[self.alert_topic.arn],
            tags=self.tags
        )
        alarms["cpu"] = cpu_alarm

        # Memory Utilization Alarm
        memory_alarm = CloudwatchMetricAlarm(
            self,
            "high-memory-alarm",
            alarm_name=f"{self.environment}-high-memory-utilization",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            threshold=threshold,
            alarm_description=f"This metric monitors memory utilization in {self.environment}",
            alarm_actions=[self.alert_topic.arn],
            tags=self.tags
        )
        alarms["memory"] = memory_alarm

        # Disk Space Alarm
        disk_alarm = CloudwatchMetricAlarm(
            self,
            "low-disk-space-alarm",
            alarm_name=f"{self.environment}-low-disk-space",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="disk_free_percent",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            threshold=20,  # Alert when less than 20% free space
            alarm_description=f"This metric monitors disk space in {self.environment}",
            alarm_actions=[self.alert_topic.arn],
            tags=self.tags
        )
        alarms["disk"] = disk_alarm

        return alarms

    def _create_dashboard(self) -> CloudwatchDashboard:
        """Create CloudWatch dashboard for the environment."""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/EC2", "CPUUtilization"],
                            ["CWAgent", "MemoryUtilization"],
                            ["CWAgent", "disk_used_percent"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-2",
                        "title": f"{self.environment.title()} Environment - System Metrics"

```

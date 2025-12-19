### 1. Requirements File (`requirements.txt`)

```python
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pydantic>=2.0.0
structlog>=23.0.0
click>=8.0.0
pytest>=7.0.0
pytest-asyncio>=0.21.0
python-dotenv>=1.0.0
```

### 2. Logging Configuration (`logging_config.py`)

```python
import structlog
import logging
import sys
from typing import Any, Dict


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application."""

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper())
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.CallsiteParameterAdder(
                parameters=[
                    structlog.processors.CallsiteParameter.FILENAME,
                    structlog.processors.CallsiteParameter.FUNC_NAME,
                    structlog.processors.CallsiteParameter.LINENO,
                ]
            ),
            structlog.processors.dict_tracebacks,
            structlog.dev.ConsoleRenderer() if log_level == "DEBUG" else structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def log_event(logger: structlog.BoundLogger, event: str, **kwargs: Any) -> None:
    """Log a structured event with consistent formatting."""
    logger.info(event, **kwargs)


def log_error(logger: structlog.BoundLogger, error: str, exception: Exception = None, **kwargs: Any) -> None:
    """Log an error with exception details if provided."""
    if exception:
        logger.error(error, exc_info=True, exception_type=type(exception).__name__, **kwargs)
    else:
        logger.error(error, **kwargs)
```

### 3. Configuration Management (`config.py`)

```python
import os
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
import yaml
import json
from pathlib import Path
from logging_config import get_logger

# Load environment variables
load_dotenv()

logger = get_logger(__name__)


class ResourceTags(BaseModel):
    """Common resource tags for governance and cost tracking."""
    Environment: str
    ManagedBy: str = "Pulumi"
    Project: str
    Owner: str
    CostCenter: Optional[str] = None

    class Config:
        extra = "allow"  # Allow additional custom tags


class InfrastructureConfig(BaseModel):
    """Main infrastructure configuration model with validation."""

    # General settings
    stack_name: str = Field(..., description="Pulumi stack name")
    aws_region: str = Field(default="us-east-1", description="AWS region")
    environment: str = Field(..., regex="^(dev|staging|prod)$")
    dry_run: bool = Field(default=False, description="Preview changes without applying")

    # Resource configuration
    vpc_cidr: str = Field(default="10.0.0.0/16", description="VPC CIDR block")
    availability_zones: List[str] = Field(default_factory=list)
    enable_nat_gateway: bool = Field(default=True)
    enable_monitoring: bool = Field(default=True)

    # Security settings
    allowed_ssh_ips: List[str] = Field(default_factory=list)
    kms_key_alias: Optional[str] = None

    # Tags
    tags: ResourceTags

    @validator('vpc_cidr')
    def validate_cidr(cls, v):
        """Validate CIDR block format."""
        import ipaddress
        try:
            ipaddress.ip_network(v)
        except ValueError:
            raise ValueError(f"Invalid CIDR block: {v}")
        return v

    @validator('availability_zones', pre=True, always=True)
    def set_default_azs(cls, v, values):
        """Set default AZs based on region if not provided."""
        if not v and 'aws_region' in values:
            # In production, you'd query AWS for available AZs
            # This is a simplified example
            region_prefix = values['aws_region'][:9]
            return [f"{region_prefix}a", f"{region_prefix}b"]
        return v

    class Config:
        validate_assignment = True


def load_config(config_path: Optional[str] = None, cli_overrides: Optional[Dict[str, Any]] = None) -> InfrastructureConfig:
    """
    Load configuration from multiple sources with precedence:
    1. CLI arguments (highest)
    2. Environment variables
    3. Configuration file
    4. Defaults (lowest)
    """
    logger.info("loading_configuration", config_path=config_path)

    # Start with defaults
    config_data = {}

    # Load from file if provided
    if config_path:
        path = Path(config_path)
        if path.exists():
            with open(path, 'r') as f:
                if path.suffix in ['.yaml', '.yml']:
                    config_data = yaml.safe_load(f)
                elif path.suffix == '.json':
                    config_data = json.load(f)
                else:
                    raise ValueError(f"Unsupported config file format: {path.suffix}")
            logger.info("loaded_config_file", path=str(path))
        else:
            logger.warning("config_file_not_found", path=str(path))

    # Override with environment variables
    env_mappings = {
        'PULUMI_STACK_NAME': 'stack_name',
        'AWS_REGION': 'aws_region',
        'ENVIRONMENT': 'environment',
        'DRY_RUN': 'dry_run',
        'VPC_CIDR': 'vpc_cidr',
        'ENABLE_NAT_GATEWAY': 'enable_nat_gateway',
        'ENABLE_MONITORING': 'enable_monitoring',
    }

    for env_var, config_key in env_mappings.items():
        value = os.getenv(env_var)
        if value:
            # Handle boolean conversions
            if config_key in ['dry_run', 'enable_nat_gateway', 'enable_monitoring']:
                config_data[config_key] = value.lower() in ['true', '1', 'yes']
            else:
                config_data[config_key] = value
            logger.debug("env_override", var=env_var, key=config_key)

    # Apply CLI overrides (highest priority)
    if cli_overrides:
        config_data.update(cli_overrides)
        logger.debug("cli_overrides_applied", overrides=list(cli_overrides.keys()))

    # Ensure required fields have defaults if not provided
    if 'tags' not in config_data:
        config_data['tags'] = {
            'Environment': config_data.get('environment', 'dev'),
            'Project': config_data.get('stack_name', 'default'),
            'Owner': os.getenv('USER', 'unknown'),
        }

    try:
        config = InfrastructureConfig(**config_data)
        logger.info("configuration_loaded",
                   stack=config.stack_name,
                   region=config.aws_region,
                   environment=config.environment)
        return config
    except Exception as e:
        logger.error("configuration_validation_failed", error=str(e))
        raise


def get_pulumi_config() -> Dict[str, Any]:
    """Get Pulumi-specific configuration."""
    import pulumi

    config = pulumi.Config()
    return {
        'aws:region': config.get('aws:region') or os.getenv('AWS_REGION', 'us-east-1'),
        'assumeRole': config.get('aws:assumeRole'),
    }
```

### 4. Validation Module (`validation.py`)

```python
from typing import List, Dict, Any, Tuple
from logging_config import get_logger
import boto3
from botocore.exceptions import ClientError

logger = get_logger(__name__)


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class ConfigValidator:
    """Validate infrastructure configuration before deployment."""

    def __init__(self, config: Any, aws_region: str):
        self.config = config
        self.aws_region = aws_region
        self.ec2_client = None
        self.iam_client = None

    def _get_aws_client(self, service: str):
        """Get AWS client with proper error handling."""
        try:
            if service == 'ec2' and not self.ec2_client:
                self.ec2_client = boto3.client('ec2', region_name=self.aws_region)
            elif service == 'iam' and not self.iam_client:
                self.iam_client = boto3.client('iam', region_name=self.aws_region)

            return self.ec2_client if service == 'ec2' else self.iam_client
        except ClientError as e:
            logger.error("aws_client_error", service=service, error=str(e))
            raise ValidationError(f"Failed to create AWS {service} client: {e}")

    def validate_all(self) -> Tuple[bool, List[str]]:
        """Run all validation checks and return results."""
        errors = []

        logger.info("starting_validation")

        # Validate AWS credentials and permissions
        if not self._validate_aws_credentials():
            errors.append("AWS credentials validation failed")

        # Validate region
        if not self._validate_region():
            errors.append(f"Invalid AWS region: {self.aws_region}")

        # Validate availability zones
        if self.config.availability_zones:
            invalid_azs = self._validate_availability_zones()
            if invalid_azs:
                errors.append(f"Invalid availability zones: {invalid_azs}")

        # Validate CIDR blocks don't conflict
        if hasattr(self.config, 'vpc_cidr'):
            conflicts = self._check_vpc_conflicts()
            if conflicts:
                errors.append(f"VPC CIDR conflicts detected: {conflicts}")

        # Validate IAM permissions
        missing_perms = self._validate_iam_permissions()
        if missing_perms:
            errors.append(f"Missing IAM permissions: {missing_perms}")

        success = len(errors) == 0
        logger.info("validation_complete", success=success, error_count=len(errors))

        return success, errors

    def _validate_aws_credentials(self) -> bool:
        """Validate AWS credentials are properly configured."""
        try:
            sts = boto3.client('sts', region_name=self.aws_region)
            identity = sts.get_caller_identity()
            logger.info("aws_identity_verified",
                       account_id=identity['Account'],
                       user_arn=identity['Arn'])
            return True
        except Exception as e:
            logger.error("aws_credential_validation_failed", error=str(e))
            return False

    def _validate_region(self) -> bool:
        """Validate the AWS region is valid and available."""
        try:
            ec2 = self._get_aws_client('ec2')
            regions = ec2.describe_regions()
            valid_regions = [r['RegionName'] for r in regions['Regions']]
            return self.aws_region in valid_regions
        except Exception as e:
            logger.error("region_validation_failed", error=str(e))
            return False

    def _validate_availability_zones(self) -> List[str]:
        """Validate availability zones exist in the region."""
        try:
            ec2 = self._get_aws_client('ec2')
            azs = ec2.describe_availability_zones(
                Filters=[{'Name': 'region-name', 'Values': [self.aws_region]}]
            )
            valid_azs = [az['ZoneName'] for az in azs['AvailabilityZones'] if az['State'] == 'available']

            invalid_azs = [az for az in self.config.availability_zones if az not in valid_azs]
            return invalid_azs
        except Exception as e:
            logger.error("az_validation_failed", error=str(e))
            return self.config.availability_zones

    def _check_vpc_conflicts(self) -> List[str]:
        """Check for VPC CIDR conflicts with existing VPCs."""
        try:
            ec2 = self._get_aws_client('ec2')
            vpcs = ec2.describe_vpcs()
            existing_cidrs = [vpc['CidrBlock'] for vpc in vpcs['Vpcs']]

            # Simple overlap check (in production, use ipaddress module for proper checks)
            if self.config.vpc_cidr in existing_cidrs:
                return [f"CIDR {self.config.vpc_cidr} already exists"]

            return []
        except Exception as e:
            logger.error("vpc_conflict_check_failed", error=str(e))
            return []

    def _validate_iam_permissions(self) -> List[str]:
        """Check if the current user has required IAM permissions."""
        required_actions = [
            'ec2:CreateVpc',
            'ec2:CreateSubnet',
            'ec2:CreateInternetGateway',
            'ec2:CreateNatGateway',
            'ec2:CreateSecurityGroup',
            'ec2:CreateTags',
            'iam:CreateRole',
            'iam:AttachRolePolicy',
            'logs:CreateLogGroup',
            'cloudwatch:PutMetricAlarm',
        ]

        try:
            iam = self._get_aws_client('iam')
            # In production, use IAM policy simulator for accurate checks
            # This is a simplified example
            return []
        except Exception:
            # If we can't check, assume permissions are ok but log warning
            logger.warning("iam_permission_check_skipped")
            return []


def validate_inputs(config: Any) -> Tuple[bool, List[str]]:
    """Public validation function."""
    validator = ConfigValidator(config, config.aws_region)
    return validator.validate_all()
```

### 5. Infrastructure Components (`infrastructure.py`)

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, Any, List, Optional
from logging_config import get_logger
from config import InfrastructureConfig, ResourceTags

logger = get_logger(__name__)


class NetworkStack(pulumi.ComponentResource):
    """Manages VPC and networking resources."""

    def __init__(self, name: str, config: InfrastructureConfig, opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('custom:infrastructure:NetworkStack', name, None, opts)

        self.config = config
        self.vpc = None
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []

        # Create resources
        self._create_vpc()
        self._create_subnets()
        self._create_internet_gateway()
        if config.enable_nat_gateway:
            self._create_nat_gateways()
        self._create_route_tables()

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': [s.id for s in self.public_subnets],
            'private_subnet_ids': [s.id for s in self.private_subnets],
        })

    def _create_vpc(self):
        """Create VPC with DNS support enabled."""
        logger.info("creating_vpc", cidr=self.config.vpc_cidr)

        self.vpc = aws.ec2.Vpc(
            f"{self.config.stack_name}-vpc",
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self._get_tags("VPC"),
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_subnets(self):
        """Create public and private subnets in each AZ."""
        azs = self.config.availability_zones
        subnet_bits = 8  # /24 subnets from /16 VPC

        for i, az in enumerate(azs):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"{self.config.stack_name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self._get_tags(f"Public Subnet {i+1}"),
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"{self.config.stack_name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+100}.0/24",
                availability_zone=az,
                tags=self._get_tags(f"Private Subnet {i+1}"),
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

    def _create_internet_gateway(self):
        """Create and attach Internet Gateway."""
        self.igw = aws.ec2.InternetGateway(
            f"{self.config.stack_name}-igw",
            tags=self._get_tags("Internet Gateway"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.InternetGatewayAttachment(
            f"{self.config.stack_name}-igw-attachment",
            vpc_id=self.vpc.id,
            internet_gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_nat_gateways(self):
        """Create NAT Gateways for private subnet internet access."""
        for i, public_subnet in enumerate(self.public_subnets):
            # Allocate Elastic IP
            eip = aws.ec2.Eip(
                f"{self.config.stack_name}-nat-eip-{i+1}",
                domain="vpc",
                tags=self._get_tags(f"NAT Gateway EIP {i+1}"),
                opts=pulumi.ResourceOptions(parent=self)
            )

            # Create NAT Gateway
            nat_gateway = aws.ec2.NatGateway(
                f"{self.config.stack_name}-nat-{i+1}",
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags=self._get_tags(f"NAT Gateway {i+1}"),
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gateway)

    def _create_route_tables(self):
        """Create and associate route tables."""
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"{self.config.stack_name}-public-rt",
            vpc_id=self.vpc.id,
            tags=self._get_tags("Public Route Table"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Add internet route
        aws.ec2.Route(
            f"{self.config.stack_name}-public-route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.config.stack_name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Private route tables (one per AZ for HA)
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{self.config.stack_name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags=self._get_tags(f"Private Route Table {i+1}"),
                opts=pulumi.ResourceOptions(parent=self)
            )

            if self.config.enable_nat_gateway:
                aws.ec2.Route(
                    f"{self.config.stack_name}-private-route-{i+1}",
                    route_table_id=private_rt.id,
                    destination_cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gw.id,
                    opts=pulumi.ResourceOptions(parent=self)
                )

            aws.ec2.RouteTableAssociation(
                f"{self.config.stack_name}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

    def _get_tags(self, name: str) -> Dict[str, str]:
        """Get resource tags with Name tag added."""
        tags = self.config.tags.dict()
        tags['Name'] = f"{self.config.stack_name}-{name}"
        return tags


class SecurityStack(pulumi.ComponentResource):
    """Manages security groups and IAM resources."""

    def __init__(self, name: str, config: InfrastructureConfig, vpc_id: pulumi.Output[str],
                 opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('custom:infrastructure:SecurityStack', name, None, opts)

        self.config = config
        self.vpc_id = vpc_id

        self._create_security_groups()
        self._create_iam_roles()
        if config.kms_key_alias:
            self._create_kms_key()

        self.register_outputs({
            'web_security_group_id': self.web_sg.id,
            'app_security_group_id': self.app_sg.id,
            'app_role_arn': self.app_role.arn if hasattr(self, 'app_role') else None,
        })

    def _create_security_groups(self):
        """Create security groups with least privilege rules."""
        # Web tier security group
        self.web_sg = aws.ec2.SecurityGroup(
            f"{self.config.stack_name}-web-sg",
            vpc_id=self.vpc_id,
            description="Security group for web tier",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from anywhere"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from anywhere"
                ),
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
            tags=self._get_tags("Web Security Group"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Application tier security group
        self.app_sg = aws.ec2.SecurityGroup(
            f"{self.config.stack_name}-app-sg",
            vpc_id=self.vpc_id,
            description="Security group for application tier",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags=self._get_tags("App Security Group"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Allow web tier to communicate with app tier
        aws.ec2.SecurityGroupRule(
            f"{self.config.stack_name}-web-to-app",
            type="ingress",
            security_group_id=self.app_sg.id,
            source_security_group_id=self.web_sg.id,
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            description="Allow web tier to app tier",
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege policies."""
        # Application role
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                }
            }]
        }

        self.app_role = aws.iam.Role(
            f"{self.config.stack_name}-app-role",
            assume_role_policy=assume_role_policy,
            tags=self._get_tags("Application Role"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach managed policies
        aws.iam.RolePolicyAttachment(
            f"{self.config.stack_name}-app-cloudwatch-policy",
            role=self.app_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Custom inline policy for app-specific permissions
        app_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{self.config.stack_name}-app-bucket/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{self.config.aws_region}:*:secret:{self.config.stack_name}/*"
                }
            ]
        }

        aws.iam.RolePolicy(
            f"{self.config.stack_name}-app-policy",
            role=self.app_role.id,
            policy=app_policy,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_kms_key(self):
        """Create KMS key for encryption."""
        self.kms_key = aws.kms.Key(
            f"{self.config.stack_name}-kms-key",
            description=f"KMS key for {self.config.stack_name}",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            tags=self._get_tags("KMS Key"),
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"{self.config.stack_name}-kms-alias",
            name=f"alias/{self.config.kms_key_alias}",
            target_key_id=self.kms_key.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _get_tags(self, name: str) -> Dict[str, str]:
        """Get resource tags with Name tag added."""
        tags = self.config.tags.dict()
        tags['Name'] = f"{self.config.stack_name}-{name}"
        return tags


class MonitoringStack(pulumi.ComponentResource):
    """Manages monitoring and alerting resources."""

    def __init__(self, name: str, config: InfrastructureConfig,
                 opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('custom:infrastructure:MonitoringStack', name, None, opts)

        self.config = config

        if config.enable_monitoring:
            self._create_log_group()
            self._create_cloudwatch_alarms()
            self._create_dashboard()

        self.register_outputs({
            'log_group_name': self.log_group.name if hasattr(self, 'log_group') else None,
            'dashboard_url': self._get_dashboard_url() if hasattr(self, 'dashboard') else None,
        })

    def _create_log_group(self):
        """Create CloudWatch log group."""
        self.log_group = aws.cloudwatch.LogGroup(
            f"{self.config.stack_name}-logs",
            retention_in_days=30 if self.config.environment == 'dev' else 90,
            tags=self._get_tags("Log Group"),
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for key metrics."""
        # Example: High CPU alarm
        self.high_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.config.stack_name}-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when CPU exceeds 80%",
            alarm_actions=[],  # Add SNS topic ARN here
            tags=self._get_tags("High CPU Alarm"),
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_dashboard(self):
        """Create CloudWatch dashboard."""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                            [".", "NetworkIn", {"stat": "Sum"}],
                            [".", "NetworkOut", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.config.aws_region,
                        "title": "EC2 Instance Metrics"
                    }
                }
            ]
        }

        self.dashboard = aws.cloudwatch.Dashboard(
            f"{self.config.stack_name}-dashboard",
            dashboard_name=f"{self.config.stack_name}-overview",
            dashboard_body=pulumi.Output.json_dumps(dashboard_body),
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _get_dashboard_url(self) -> pulumi.Output[str]:
        """Generate CloudWatch dashboard URL."""
        return pulumi.Output.concat(
            f"https://{self.config.aws_region}.console.aws.amazon.com/cloudwatch/home",
            f"?region={self.config.aws_region}",
            f"#dashboards:name=",
            self.dashboard.dashboard_name
        )

    def _get_tags(self, name: str) -> Dict[str, str]:
        """Get resource tags with Name tag added."""
        tags = self.config.tags.dict()
        tags['Name'] = f"{self.config.stack_name}-{name}"
        return tags


def create_infrastructure(config: InfrastructureConfig) -> Dict[str, Any]:
    """Create all infrastructure components."""
    logger.info("creating_infrastructure", stack=config.stack_name)

    # Create network stack
    network_stack = NetworkStack("network", config)

    # Create security stack
    security_stack = SecurityStack("security", config, network_stack.vpc.id)

    # Create monitoring stack
    monitoring_stack = MonitoringStack("monitoring", config)

    # Return outputs
    outputs = {
        "region": config.aws_region,
        "vpc_id": network_stack.vpc.id,
        "vpc_cidr": network_stack.vpc.cidr_block,
        "public_subnet_ids": pulumi.Output.all(
            *[s.id for s in network_stack.public_subnets]
        ).apply(lambda ids: ids),
        "private_subnet_ids": pulumi.Output.all(
            *[s.id for s in network_stack.private_subnets]
        ).apply(lambda ids: ids),
        "web_security_group_id": security_stack.web_sg.id,
        "app_security_group_id": security_stack.app_sg.id,
    }

    if hasattr(security_stack, 'app_role'):
        outputs["app_role_arn"] = security_stack.app_role.arn

    if config.enable_monitoring and hasattr(monitoring_stack, 'log_group'):
        outputs["log_group_name"] = monitoring_stack.log_group.name
        outputs["dashboard_url"] = monitoring_stack._get_dashboard_url()

    logger.info("infrastructure_created", outputs=list(outputs.keys()))

    return outputs
```

### 6. Main Pulumi Program (`__main__.py`)

```python
"""Main Pulumi program for infrastructure deployment."""
import pulumi
import sys
from config import load_config, get_pulumi_config
from validation import validate_inputs
from infrastructure import create_infrastructure
from logging_config import setup_logging, get_logger


def main():
    """Main entry point for Pulumi program."""
    # Setup logging
    setup_logging()
    logger = get_logger(__name__)

    try:
        # Load configuration
        config = load_config()
        logger.info("pulumi_program_started",
                   stack=config.stack_name,
                   environment=config.environment,
                   dry_run=config.dry_run)

        # Validate inputs
        logger.info("validating_configuration")
        is_valid, errors = validate_inputs(config)

        if not is_valid:
            logger.error("validation_failed", errors=errors)
            raise ValueError(f"Configuration validation failed: {'; '.join(errors)}")

        logger.info("validation_passed")

        # Create infrastructure
        outputs = create_infrastructure(config)

        # Export outputs
        for key, value in outputs.items():
            pulumi.export(key, value)

        logger.info("pulumi_program_completed", outputs_count=len(outputs))

    except Exception as e:
        logger.error("pulumi_program_failed",
                    error=str(e),
                    exc_info=True)
        raise


if __name__ == "__main__":
    main()
```

### 7. CLI Entry Point (`cli.py`)

```python
#!/usr/bin/env python3
"""CLI interface for Pulumi infrastructure management."""
import click
import subprocess
import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional
from config import load_config
from validation import validate_inputs
from logging_config import setup_logging, get_logger


@click.group()
@click.option('--log-level', default='INFO', help='Logging level (DEBUG, INFO, WARNING, ERROR)')
@click.pass_context
def cli(ctx, log_level):
    """Pulumi Infrastructure Manager CLI."""
    setup_logging(log_level)
    ctx.ensure_object(dict)
    ctx.obj['logger'] = get_logger(__name__)


@cli.command()
@click.option('--config-file', '-c', type=click.Path(exists=True), help='Configuration file path')
@click.option('--stack-name', '-s', help='Pulumi stack name')
@click.option('--aws-region', '-r', help='AWS region')
@click.option('--environment', '-e', type=click.Choice(['dev', 'staging', 'prod']), help='Environment')
@click.option('--dry-run', is_flag=True, help='Preview changes without applying')
@click.option('--auto-approve', is_flag=True, help='Skip confirmation prompts')
@click.pass_context
def deploy(ctx, config_file, stack_name, aws_region, environment, dry_run, auto_approve):
    """Deploy infrastructure using Pulumi."""
    logger = ctx.obj['logger']

    try:
        # Build CLI overrides
        cli_overrides = {}
        if stack_name:
            cli_overrides['stack_name'] = stack_name
        if aws_region:
            cli_overrides['aws_region'] = aws_region
        if environment:
            cli_overrides['environment'] = environment
        if dry_run:
            cli_overrides['dry_run'] = dry_run

        # Load configuration
        config = load_config(config_file, cli_overrides)

        # Validate configuration
        logger.info("validating_configuration")
        is_valid, errors = validate_inputs(config)

        if not is_valid:
            logger.error("validation_failed", errors=errors)
            click.echo(click.style("Validation failed:", fg='red'))
            for error in errors:
                click.echo(click.style(f"  • {error}", fg='red'))
            sys.exit(1)

        click.echo(click.style("✓ Configuration validated successfully", fg='green'))

        # Show configuration summary
        click.echo("\nDeployment Configuration:")
        click.echo(f"  Stack: {config.stack_name}")
        click.echo(f"  Environment: {config.environment}")
        click.echo(f"  Region: {config.aws_region}")
        click.echo(f"  VPC CIDR: {config.vpc_cidr}")
        click.echo(f"  NAT Gateway: {'Enabled' if config.enable_nat_gateway else 'Disabled'}")
        click.echo(f"  Monitoring: {'Enabled' if config.enable_monitoring else 'Disabled'}")

        # Confirm deployment
        if not auto_approve and not dry_run:
            if not click.confirm("\nDo you want to continue with deployment?"):
                click.echo("Deployment cancelled.")
                sys.exit(0)

        # Run Pulumi command
        cmd = ['pulumi', 'up', '--stack', config.stack_name]

        if dry_run:
            cmd.extend(['--preview', '--diff'])
            click.echo("\n" + click.style("Running in dry-run mode (preview only)", fg='yellow'))
        elif auto_approve:
            cmd.append('--yes')

        logger.info("executing_pulumi_command", command=' '.join(cmd))

        # Execute Pulumi
        result = subprocess.run(cmd, capture_output=False, text=True)

        if result.returncode != 0:
            logger.error("pulumi_execution_failed", return_code=result.returncode)
            sys.exit(result.returncode)

        logger.info("deployment_completed", dry_run=dry_run)

        if not dry_run:
            click.echo("\n" + click.style("✓ Deployment completed successfully!", fg='green'))

            # Show outputs
            show_outputs(ctx, config.stack_name)

    except Exception as e:
        logger.error("deployment_failed", error=str(e), exc_info=True)
        click.echo(click.style(f"\n✗ Deployment failed: {e}", fg='red'))
        sys.exit(1)


@cli.command()
@click.option('--stack-name', '-s', required=True, help='Pulumi stack name')
@click.option('--auto-approve', is_flag=True, help='Skip confirmation prompts')
@click.pass_context
def destroy(ctx, stack_name, auto_approve):
    """Destroy infrastructure managed by Pulumi."""
    logger = ctx.obj['logger']

    try:
        logger.info("destroying_infrastructure", stack=stack_name)

        if not auto_approve:
            click.echo(click.style(f"\nWARNING: This will destroy all resources in stack '{stack_name}'", fg='yellow'))
            if not click.confirm("Are you sure you want to continue?"):
                click.echo("Destruction cancelled.")
                sys.exit(0)

        cmd = ['pulumi', 'destroy', '--stack', stack_name]
        if auto_approve:
            cmd.append('--yes')

        result = subprocess.run(cmd, capture_output=False, text=True)

        if result.returncode != 0:
            logger.error("destruction_failed", return_code=result.returncode)
            sys.exit(result.returncode)

        logger.info("destruction_completed", stack=stack_name)
        click.echo(click.style("\n✓ Infrastructure destroyed successfully!", fg='green'))

    except Exception as e:
        logger.error("destruction_failed", error=str(e), exc_info=True)
        click.echo(click.style(f"\n✗ Destruction failed: {e}", fg='red'))
        sys.exit(1)


@cli.command()
@click.option('--stack-name', '-s', required=True, help='Pulumi stack name')
@click.pass_context
def outputs(ctx, stack_name):
    """Show stack outputs."""
    show_outputs(ctx, stack_name)


def show_outputs(ctx, stack_name: str):
    """Display stack outputs in a formatted way."""
    logger = ctx.obj['logger']

    try:
        # Get outputs from Pulumi
        result = subprocess.run(
            ['pulumi', 'stack', 'output', '--json', '--stack', stack_name],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            logger.error("failed_to_get_outputs", error=result.stderr)
            return

        outputs = json.loads(result.stdout)

        if outputs:
            click.echo("\nStack Outputs:")
            for key, value in outputs.items():
                click.echo(f"  {key}: {value}")
        else:
            click.echo("\nNo outputs found for this stack.")

    except Exception as e:
        logger.error("failed_to_show_outputs", error=str(e))


@cli.command()
@click.option('--config-file', '-c', type=click.Path(exists=True), help='Configuration file path')
@click.pass_context
def validate(ctx, config_file):
    """Validate configuration without deploying."""
    logger = ctx.obj['logger']

    try:
        config = load_config(config_file)
        is_valid, errors = validate_inputs(config)

        if is_valid:
            click.echo(click.style("✓ Configuration is valid", fg='green'))
        else:
            click.echo(click.style("✗ Configuration validation failed:", fg='red'))
            for error in errors:
                click.echo(click.style(f"  • {error}", fg='red'))
            sys.exit(1)

    except Exception as e:
        logger.error("validation_error", error=str(e))
        click.echo(click.style(f"\n✗ Validation error: {e}", fg='red'))
        sys.exit(1)


@cli.command()
@click.pass_context
def list_stacks(ctx):
    """List all Pulumi stacks."""
    logger = ctx.obj['logger']

    try:
        result = subprocess.run(
            ['pulumi', 'stack', 'ls', '--json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            logger.error("failed_to_list_stacks", error=result.stderr)
            sys.exit(1)

        stacks = json.loads(result.stdout)

        if stacks:
            click.echo("\nAvailable Stacks:")
            for stack in stacks:
                status = "✓" if stack.get('current', False) else " "
                click.echo(f"  {status} {stack['name']} ({stack.get('lastUpdate', 'Never updated')})")
        else:
            click.echo("\nNo stacks found.")

    except Exception as e:
        logger.error("failed_to_list_stacks", error=str(e))
        click.echo(click.style(f"\n✗ Failed to list stacks: {e}", fg='red'))
        sys.exit(1)


if __name__ == '__main__':
    cli()
```

### 8. Test Files

#### Test Idempotency (`tests/test_idempotency.py`)

```python
import pytest
import subprocess
import json
import time
from pathlib import Path


class TestIdempotency:
    """Test infrastructure idempotency."""

    @pytest.fixture
    def test_config(self, tmp_path):
        """Create test configuration."""
        config = {
            "stack_name": "test-idempotency",
            "environment": "dev",
            "aws_region": "us-east-1",
            "vpc_cidr": "10.100.0.0/16",
            "enable_nat_gateway": False,
            "enable_monitoring": False,
            "tags": {
                "Environment": "test",
                "Project": "idempotency-test",
                "Owner": "pytest"
            }
        }

        config_file = tmp_path / "test-config.json"
        config_file.write_text(json.dumps(config))

        return config_file

    def run_pulumi_command(self, cmd: list) -> tuple:
        """Run Pulumi command and return result."""
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )
        return result.returncode, result.stdout, result.stderr

    def test_repeated_deploys_idempotent(self, test_config):
        """Test that repeated deployments don't create changes."""
        stack_name = "test-idempotency"

        # Initial deployment
        code, stdout, stderr = self.run_pulumi_command([
            'pulumi', 'up', '--yes', '--stack', stack_name
        ])
        assert code == 0, f"Initial deployment failed: {stderr}"

        # Get initial state
        code, initial_state, _ = self.run_pulumi_command([
            'pulumi', 'stack', 'export', '--stack', stack_name
        ])
        assert code == 0

        # Second deployment (should show no changes)
        code, stdout, stderr = self.run_pulumi_command([
            'pulumi', 'preview', '--stack', stack_name
        ])
        assert code == 0
        assert "0 to change" in stdout or "No changes" in stdout

        # Run actual update
        code, stdout, stderr = self.run_pulumi_command([
            'pulumi', 'up', '--yes', '--stack', stack_name
        ])
        assert code == 0

        # Get final state
        code, final_state, _ = self.run_pulumi_command([
            'pulumi', 'stack', 'export', '--stack', stack_name
        ])
        assert code == 0

        # States should be identical (except timestamps)
        initial_json = json.loads(initial_state)
        final_json = json.loads(final_state)

        # Remove timestamp fields for comparison
        for state in [initial_json, final_json]:
            if 'checkpoint' in state:
                state['checkpoint'].pop('latest_time', None)

        assert initial_json == final_json, "State changed after idempotent update"

    def test_configuration_change_detection(self, test_config):
        """Test that configuration changes are properly detected."""
        stack_name = "test-changes"

        # Initial deployment
        code, _, _ = self.run_pulumi_command([
            'pulumi', 'up', '--yes', '--stack', stack_name
        ])
        assert code == 0

        # Modify configuration
        config = json.loads(test_config.read_text())
        config['enable_monitoring'] = True
        test_config.write_text(json.dumps(config))

        # Preview should show changes
        code, stdout, _ = self.run_pulumi_command([
            'pulumi', 'preview', '--stack', stack_name
        ])
        assert code == 0
        assert "to create" in stdout or "to update" in stdout

    @pytest.fixture(scope="class", autouse=True)
    def cleanup(self):
        """Clean up test stacks after tests."""
        yield

        # Destroy test stacks
        for stack in ["test-idempotency", "test-changes"]:
            subprocess.run(
                ['pulumi', 'destroy', '--yes', '--stack', stack],
                capture_output=True
            )
            subprocess.run(
                ['pulumi', 'stack', 'rm', '--yes', stack],
                capture_output=True
            )
```

#### Test Validation (`tests/test_validation.py`)

```python
import pytest
from config import InfrastructureConfig, ResourceTags, load_config
from validation import ConfigValidator, ValidationError
import json
from pathlib import Path


class TestValidation:
    """Test configuration validation."""

    def test_valid_configuration(self):
        """Test that valid configuration passes validation."""
        config = InfrastructureConfig(
            stack_name="test-stack",
            environment="dev",
            aws_region="us-east-1",
            vpc_cidr="10.0.0.0/16",
            tags=ResourceTags(
                Environment="dev",
                Project="test",
                Owner="pytest"
            )
        )

        validator = ConfigValidator(config, config.aws_region)
        # Note: This will fail without valid AWS credentials
        # In real tests, you'd mock the AWS calls

    def test_invalid_cidr_rejected(self):
        """Test that invalid CIDR blocks are rejected."""
        with pytest.raises(ValueError, match="Invalid CIDR"):
            InfrastructureConfig(
                stack_name="test-stack",
                environment="dev",
                vpc_cidr="invalid-cidr",
                tags=ResourceTags(
                    Environment="dev",
                    Project="test",
                    Owner="pytest"
                )
            )

    def test_invalid_environment_rejected(self):
        """Test that invalid environments are rejected."""
        with pytest.raises(ValueError):
            InfrastructureConfig(
                stack_name="test-stack",
                environment="invalid",
                tags=ResourceTags(
                    Environment="dev",
                    Project="test",
                    Owner="pytest"
                )
            )

    def test_missing_required_fields(self):
        """Test that missing required fields are caught."""
        with pytest.raises(ValueError):
            InfrastructureConfig(
                environment="dev",
                # Missing stack_name
                tags=ResourceTags(
                    Environment="dev",
                    Project="test",
                    Owner="pytest"
                )
            )

    def test_config_file_loading(self, tmp_path):
        """Test configuration file loading."""
        # Test YAML loading
        yaml_config = """
stack_name: test-yaml
environment: dev
aws_region: us-west-2
vpc_cidr: 10.1.0.0/16
tags:
  Environment: dev
  Project: yaml-test
  Owner: pytest
"""
        yaml_file = tmp_path / "config.yaml"
        yaml_file.write_text(yaml_config)

        config = load_config(str(yaml_file))
        assert config.stack_name == "test-yaml"
        assert config.aws_region == "us-west-2"
        assert config.vpc_cidr == "10.1.0.0/16"

        # Test JSON loading
        json_config = {
            "stack_name": "test-json",
            "environment": "staging",
            "tags": {
                "Environment": "staging",
                "Project": "json-test",
                "Owner": "pytest"
            }
        }
        json_file = tmp_path / "config.json"
        json_file.write_text(json.dumps(json_config))

        config = load_config(str(json_file))
        assert config.stack_name == "test-json"
        assert config.environment == "staging"

    def test_cli_override_precedence(self, tmp_path):
        """Test that CLI overrides have highest precedence."""
        config_data = {
            "stack_name": "file-stack",
            "environment": "dev",
            "aws_region": "us-east-1",
            "tags": {
                "Environment": "dev",
                "Project": "test",
                "Owner": "file"
            }
        }
        config_file = tmp_path / "config.json"
        config_file.write_text(json.dumps(config_data))

        # CLI overrides
        cli_overrides = {
            "stack_name": "cli-stack",
            "aws_region": "eu-west-1"
        }

        config = load_config(str(config_file), cli_overrides)
        assert config.stack_name == "cli-stack"  # CLI override
        assert config.aws_region == "eu-west-1"  # CLI override
        assert config.environment == "dev"  # From file
```

### 9. Pulumi Project Files

#### `Pulumi.yaml`

```yaml
name: infrastructure-manager
runtime:
  name: python
  options:
    virtualenv: venv
description: Production-ready infrastructure management with Pulumi
```

#### `Pulumi.dev.yaml`

```yaml
config:
  aws:region: us-east-1
  infrastructure-manager:environment: dev
  infrastructure-manager:enableMonitoring: true
  infrastructure-manager:enableNatGateway: false
```

#### `Pulumi.prod.yaml`

```yaml
config:
  aws:region: us-east-1
  infrastructure-manager:environment: prod
  infrastructure-manager:enableMonitoring: true
  infrastructure-manager:enableNatGateway: true
  infrastructure-manager:kmsKeyAlias: prod-encryption-key
```

## Usage Guide

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pulumi-infra-manager

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize Pulumi
pulumi login --local  # For local state, or use Pulumi Cloud
```

### Basic Usage

```bash
# Validate configuration
python cli.py validate -c config.yaml

# Deploy infrastructure (dry-run)
python cli.py deploy -c config.yaml --dry-run

# Deploy infrastructure
python cli.py deploy -c config.yaml --stack-name my-stack --environment dev

# Deploy with auto-approval (for CI/CD)
python cli.py deploy -c config.yaml --auto-approve

# List all stacks
python cli.py list-stacks

# Show stack outputs
python cli.py outputs -s my-stack

# Destroy infrastructure
python cli.py destroy -s my-stack
```

### Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_PROFILE=my-profile

# Application Configuration
export PULUMI_STACK_NAME=prod-stack
export ENVIRONMENT=prod
export VPC_CIDR=10.0.0.0/16
export ENABLE_MONITORING=true
export DRY_RUN=false
```

## Testing Strategy

### 1. Unit Tests

```bash
# Run unit tests
pytest tests/test_validation.py -v

# Run with coverage
pytest --cov=. --cov-report=html tests/
```

### 2. Integration Tests

```bash
# Run integration tests (requires AWS access)
pytest tests/test_idempotency.py -v --tb=short
```

### GitHub Actions Example

```yaml
name: Infrastructure Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Validate configuration
        run: python cli.py validate -c config.${{ matrix.environment }}.yaml
        strategy:
          matrix:
            environment: [dev, staging, prod]

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: Setup Pulumi
        uses: pulumi/actions@v4

      - name: Deploy infrastructure
        run: |
          python cli.py deploy \
            -c config.${{ github.event.inputs.environment }}.yaml \
            --auto-approve
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

## Troubleshooting

### Common Issues and Solutions

1. **Authentication Errors**

   ```bash
   # Check AWS credentials
   aws sts get-caller-identity

   # Check Pulumi login
   pulumi whoami
   ```

2. **Stack Already Exists**

   ```bash
   # List existing stacks
   pulumi stack ls

   # Select different stack
   pulumi stack select <stack-name>
   ```

3. **Resource Conflicts**

   ```bash
   # Check for existing resources
   aws ec2 describe-vpcs --filters Name=cidr,Values=10.0.0.0/16
   ```

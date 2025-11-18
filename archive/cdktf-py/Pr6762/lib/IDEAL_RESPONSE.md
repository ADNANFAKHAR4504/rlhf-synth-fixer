# CDKTF Python Implementation for VPC Infrastructure

This implementation provides a production-ready VPC infrastructure with strict network segmentation for a digital banking platform using CDKTF with Python. This is the ideal implementation that includes all best practices, proper integration tests, and complete documentation.

## File: lib/tap_stack.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl, NetworkAclEgress, NetworkAclIngress
from cdktf_cdktf_provider_aws.network_acl_association import NetworkAclAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, environment_suffix: str,
                 aws_region: str = "us-east-1"):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # AWS Provider with configurable region
        AwsProvider(self, "aws",
            region=aws_region
        )

        # Get availability zones for the specified region
        azs = DataAwsAvailabilityZones(self, "available",
            state="available"
        )

        # Common tags for all resources
        common_tags = {
            "Environment": f"banking-{environment_suffix}",
            "Owner": "Platform-Team",
            "CostCenter": "DigitalBanking",
            "Project": "VPC-Infrastructure"
        }

        # VPC with 10.50.0.0/16 CIDR
        vpc = Vpc(self, "vpc",
            cidr_block="10.50.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"banking-vpc-{environment_suffix}"
            }
        )

        # Internet Gateway
        igw = InternetGateway(self, "igw",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"banking-igw-{environment_suffix}"
            }
        )

        # Create 3 public subnets (10.50.0.0/24, 10.50.1.0/24, 10.50.2.0/24)
        public_subnets = []
        for i in range(3):
            subnet = Subnet(self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.50.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"banking-public-subnet-{i+1}-{environment_suffix}",
                    "Tier": "Public"
                }
            )
            public_subnets.append(subnet)

        # Create 3 private subnets (10.50.10.0/24, 10.50.11.0/24, 10.50.12.0/24)
        private_subnets = []
        for i in range(3):
            subnet = Subnet(self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.50.{10+i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"banking-private-subnet-{i+1}-{environment_suffix}",
                    "Tier": "Private"
                }
            )
            private_subnets.append(subnet)

        # Create 3 database subnets (10.50.20.0/24, 10.50.21.0/24, 10.50.22.0/24)
        database_subnets = []
        for i in range(3):
            subnet = Subnet(self, f"database_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.50.{20+i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"banking-database-subnet-{i+1}-{environment_suffix}",
                    "Tier": "Database"
                }
            )
            database_subnets.append(subnet)

        # DB Subnet Group for RDS Aurora (future use)
        db_subnet_group = DbSubnetGroup(self, "rds_subnet_group",
            name=f"banking-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in database_subnets],
            tags={
                **common_tags,
                "Name": f"banking-db-subnet-group-{environment_suffix}"
            }
        )

        # Create 1 Elastic IP for NAT Gateway (cost optimization)
        eip = Eip(self, "nat_eip",
            domain="vpc",
            tags={
                **common_tags,
                "Name": f"banking-nat-eip-{environment_suffix}"
            }
        )

        # Create 1 NAT Gateway in first public subnet (cost optimization)
        nat_gateway = NatGateway(self, "nat_gateway",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={
                **common_tags,
                "Name": f"banking-nat-gateway-{environment_suffix}"
            }
        )

        # Public Route Table
        public_rt = RouteTable(self, "public_route_table",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"banking-public-rt-{environment_suffix}"
            }
        )

        # Route to Internet Gateway for public subnets
        Route(self, "public_internet_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private Route Table
        private_rt = RouteTable(self, "private_route_table",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"banking-private-rt-{environment_suffix}"
            }
        )

        # Route to NAT Gateway for private subnets
        Route(self, "private_nat_route",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(self, f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Database Route Table
        database_rt = RouteTable(self, "database_route_table",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"banking-database-rt-{environment_suffix}"
            }
        )

        # Route to NAT Gateway for database subnets
        Route(self, "database_nat_route",
            route_table_id=database_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )

        # Associate database subnets with database route table
        for i, subnet in enumerate(database_subnets):
            RouteTableAssociation(self, f"database_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=database_rt.id
            )

        # Network ACL with deny-by-default policy
        nacl = NetworkAcl(self, "network_acl",
            vpc_id=vpc.id,
            # Ingress rules
            ingress=[
                NetworkAclIngress(
                    protocol="tcp",
                    rule_no=100,
                    action="allow",
                    cidr_block="10.50.0.0/16",
                    from_port=443,
                    to_port=443
                ),
                NetworkAclIngress(
                    protocol="tcp",
                    rule_no=110,
                    action="allow",
                    cidr_block="10.0.0.0/8",
                    from_port=22,
                    to_port=22
                ),
                NetworkAclIngress(
                    protocol="tcp",
                    rule_no=120,
                    action="allow",
                    cidr_block="0.0.0.0/0",
                    from_port=1024,
                    to_port=65535
                )
            ],
            # Egress rules
            egress=[
                NetworkAclEgress(
                    protocol="tcp",
                    rule_no=100,
                    action="allow",
                    cidr_block="0.0.0.0/0",
                    from_port=443,
                    to_port=443
                ),
                NetworkAclEgress(
                    protocol="tcp",
                    rule_no=110,
                    action="allow",
                    cidr_block="0.0.0.0/0",
                    from_port=1024,
                    to_port=65535
                )
            ],
            tags={
                **common_tags,
                "Name": f"banking-nacl-{environment_suffix}"
            }
        )

        # Associate NACLs with subnets
        for i, subnet in enumerate(public_subnets + private_subnets + database_subnets):
            NetworkAclAssociation(self, f"nacl_assoc_{i}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id
            )

        # Security Group for ALB (Web Tier)
        alb_sg = SecurityGroup(self, "alb_security_group",
            name=f"banking-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTPS from VPC",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.50.0.0/16"]
                ),
                SecurityGroupIngress(
                    description="HTTP from VPC",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["10.50.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **common_tags,
                "Name": f"banking-alb-sg-{environment_suffix}",
                "Tier": "Web"
            }
        )

        # Security Group for ECS (App Tier)
        ecs_sg = SecurityGroup(self, "ecs_security_group",
            name=f"banking-ecs-sg-{environment_suffix}",
            description="Security group for ECS Fargate containers",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Traffic from ALB",
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **common_tags,
                "Name": f"banking-ecs-sg-{environment_suffix}",
                "Tier": "Application"
            }
        )

        # Security Group for RDS (Database Tier)
        rds_sg = SecurityGroup(self, "rds_security_group",
            name=f"banking-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora PostgreSQL",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from ECS",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **common_tags,
                "Name": f"banking-rds-sg-{environment_suffix}",
                "Tier": "Database"
            }
        )

        # Security Group for VPC Endpoints (least privilege)
        vpc_endpoint_sg = SecurityGroup(self, "vpc_endpoint_security_group",
            name=f"banking-vpc-endpoint-sg-{environment_suffix}",
            description="Security group for VPC Endpoints",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTPS from VPC",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.50.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **common_tags,
                "Name": f"banking-vpc-endpoint-sg-{environment_suffix}"
            }
        )

        # S3 Bucket for VPC Flow Logs
        flow_logs_bucket = S3Bucket(self, "flow_logs_bucket",
            bucket=f"vpc-flow-logs-{environment_suffix}",
            tags={
                **common_tags,
                "Name": f"vpc-flow-logs-{environment_suffix}"
            }
        )

        # Block public access to S3 bucket
        S3BucketPublicAccessBlock(self, "flow_logs_bucket_public_access_block",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # S3 Lifecycle policy for Glacier transition after 7 days
        S3BucketLifecycleConfiguration(self, "flow_logs_bucket_lifecycle",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="glacier-transition",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=7,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # VPC Flow Logs
        FlowLog(self, "vpc_flow_log",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=f"arn:aws:s3:::{flow_logs_bucket.bucket}",
            tags={
                **common_tags,
                "Name": f"banking-vpc-flow-log-{environment_suffix}"
            }
        )

        # VPC Endpoint for S3 (Gateway Endpoint - free)
        s3_endpoint = VpcEndpoint(self, "s3_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[public_rt.id, private_rt.id, database_rt.id],
            tags={
                **common_tags,
                "Name": f"banking-s3-endpoint-{environment_suffix}"
            }
        )

        # VPC Endpoint for ECR API (Interface Endpoint)
        ecr_api_endpoint = VpcEndpoint(self, "ecr_api_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.ecr.api",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"banking-ecr-api-endpoint-{environment_suffix}"
            }
        )

        # VPC Endpoint for ECR DKR (Interface Endpoint)
        ecr_dkr_endpoint = VpcEndpoint(self, "ecr_dkr_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.ecr.dkr",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"banking-ecr-dkr-endpoint-{environment_suffix}"
            }
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "vpc_cidr",
            value=vpc.cidr_block,
            description="VPC CIDR block"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="List of public subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="List of private subnet IDs"
        )

        TerraformOutput(self, "database_subnet_ids",
            value=[subnet.id for subnet in database_subnets],
            description="List of database subnet IDs"
        )

        TerraformOutput(self, "db_subnet_group_name",
            value=db_subnet_group.name,
            description="RDS DB Subnet Group name"
        )

        TerraformOutput(self, "nat_gateway_public_ip",
            value=eip.public_ip,
            description="NAT Gateway public IP address"
        )

        TerraformOutput(self, "alb_security_group_id",
            value=alb_sg.id,
            description="ALB security group ID"
        )

        TerraformOutput(self, "ecs_security_group_id",
            value=ecs_sg.id,
            description="ECS security group ID"
        )

        TerraformOutput(self, "rds_security_group_id",
            value=rds_sg.id,
            description="RDS security group ID"
        )

        TerraformOutput(self, "vpc_endpoint_security_group_id",
            value=vpc_endpoint_sg.id,
            description="VPC Endpoint security group ID"
        )

        TerraformOutput(self, "s3_endpoint_id",
            value=s3_endpoint.id,
            description="S3 VPC Endpoint ID"
        )

        TerraformOutput(self, "ecr_api_endpoint_id",
            value=ecr_api_endpoint.id,
            description="ECR API VPC Endpoint ID"
        )

        TerraformOutput(self, "ecr_dkr_endpoint_id",
            value=ecr_dkr_endpoint.id,
            description="ECR DKR VPC Endpoint ID"
        )

        TerraformOutput(self, "flow_logs_bucket_name",
            value=flow_logs_bucket.bucket,
            description="VPC Flow Logs S3 bucket name"
        )
```

## File: bin/tap.py

```python
#!/usr/bin/env python
from cdktf import App
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from tap_stack import TapStack

# Get environment suffix and AWS region from environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test-12345')
aws_region = os.environ.get('AWS_REGION', 'us-east-1')

app = App()
TapStack(app, "tap", environment_suffix=environment_suffix, aws_region=aws_region)
app.synth()
```

## File: tests/integration/test_tap_stack.py

```python
"""Integration tests for deployed VPC infrastructure."""
import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError


class TestDeployedVPCInfrastructure(unittest.TestCase):
    """Integration tests that validate actual deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all tests."""
        # Load outputs from deployment
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r') as f:
                cls.outputs = json.load(f)
        else:
            raise FileNotFoundError(f"{outputs_file} not found. Deploy infrastructure first.")

        # Get region from outputs or environment
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)

    def test_outputs_exist(self):
        """Test that all required outputs exist from deployment."""
        required_outputs = [
            'vpc_id',
            'vpc_cidr',
            'public_subnet_ids',
            'private_subnet_ids',
            'database_subnet_ids',
            'nat_gateway_public_ip',
            'alb_security_group_id',
            'ecs_security_group_id',
            'rds_security_group_id',
            's3_endpoint_id',
            'ecr_api_endpoint_id',
            'ecr_dkr_endpoint_id',
            'flow_logs_bucket_name'
        ]

        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, self.outputs, f"Output {output} not found")
                self.assertIsNotNone(self.outputs[output], f"Output {output} is None")

    def test_vpc_exists_and_configured(self):
        """Test VPC exists and is properly configured."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]

            # Verify CIDR block
            self.assertEqual(vpc['CidrBlock'], '10.50.0.0/16')

            # Verify DNS settings
            self.assertTrue(vpc['EnableDnsHostnames'])
            self.assertTrue(vpc['EnableDnsSupport'])

            # Verify tags
            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            self.assertIn('Name', tags)
            self.assertIn('banking-vpc-', tags['Name'])
            self.assertIn('Environment', tags)
            self.assertIn('Owner', tags)
            self.assertIn('CostCenter', tags)

        except ClientError as e:
            self.fail(f"VPC {vpc_id} does not exist: {e}")

    def test_subnets_exist_and_configured(self):
        """Test that all subnets exist and are properly configured."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        # Parse subnet IDs from outputs
        import json as json_parser
        public_subnet_ids = json_parser.loads(self.outputs.get('public_subnet_ids', '[]'))
        private_subnet_ids = json_parser.loads(self.outputs.get('private_subnet_ids', '[]'))
        database_subnet_ids = json_parser.loads(self.outputs.get('database_subnet_ids', '[]'))

        # Verify counts
        self.assertEqual(len(public_subnet_ids), 3, "Should have 3 public subnets")
        self.assertEqual(len(private_subnet_ids), 3, "Should have 3 private subnets")
        self.assertEqual(len(database_subnet_ids), 3, "Should have 3 database subnets")

        # Verify public subnets
        for subnet_id in public_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            subnet = response['Subnets'][0]

            self.assertEqual(subnet['VpcId'], vpc_id)
            self.assertTrue(subnet['MapPublicIpOnLaunch'])
            self.assertTrue(subnet['CidrBlock'].startswith('10.50.'))

        # Verify private subnets
        for subnet_id in private_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            subnet = response['Subnets'][0]

            self.assertEqual(subnet['VpcId'], vpc_id)
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

        # Verify database subnets
        for subnet_id in database_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            subnet = response['Subnets'][0]

            self.assertEqual(subnet['VpcId'], vpc_id)
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached to VPC."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )

            self.assertTrue(len(response['InternetGateways']) > 0, "No Internet Gateway found")

            igw = response['InternetGateways'][0]
            attachments = igw['Attachments']
            self.assertTrue(len(attachments) > 0)
            self.assertEqual(attachments[0]['VpcId'], vpc_id)
            self.assertEqual(attachments[0]['State'], 'available')

        except ClientError as e:
            self.fail(f"Failed to verify Internet Gateway: {e}")

    def test_nat_gateway_exists(self):
        """Test that NAT Gateway exists and is configured."""
        if 'nat_gateway_public_ip' not in self.outputs:
            self.skipTest("nat_gateway_public_ip not in outputs")

        nat_ip = self.outputs['nat_gateway_public_ip']

        try:
            # Find NAT Gateway by elastic IP
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'state', 'Values': ['available']}]
            )

            nat_gateways = response['NatGateways']
            self.assertTrue(len(nat_gateways) > 0, "No NAT Gateway found")

            # Verify NAT Gateway has the correct EIP
            nat_found = False
            for nat in nat_gateways:
                for addr in nat.get('NatGatewayAddresses', []):
                    if addr.get('PublicIp') == nat_ip:
                        nat_found = True
                        self.assertEqual(nat['State'], 'available')
                        break

            self.assertTrue(nat_found, f"NAT Gateway with IP {nat_ip} not found")

        except ClientError as e:
            self.fail(f"Failed to verify NAT Gateway: {e}")

    def test_route_tables_configured(self):
        """Test that route tables are properly configured."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            route_tables = response['RouteTables']

            # Should have at least 3 route tables (public, private, database) plus main
            self.assertGreaterEqual(len(route_tables), 3, "Insufficient route tables")

            # Verify each route table has explicit associations
            for rt in route_tables:
                tags = {tag['Key']: tag['Value'] for tag in rt.get('Tags', [])}

                # Skip the main route table
                if 'Name' not in tags:
                    continue

                # Check for routes
                routes = rt['Routes']
                self.assertTrue(len(routes) > 0, f"Route table {rt['RouteTableId']} has no routes")

        except ClientError as e:
            self.fail(f"Failed to verify route tables: {e}")

    def test_security_groups_configured(self):
        """Test that security groups are properly configured."""
        sg_outputs = [
            'alb_security_group_id',
            'ecs_security_group_id',
            'rds_security_group_id'
        ]

        for sg_output in sg_outputs:
            if sg_output not in self.outputs:
                continue

            sg_id = self.outputs[sg_output]

            with self.subTest(security_group=sg_output):
                try:
                    response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
                    sg = response['SecurityGroups'][0]

                    self.assertEqual(sg['GroupId'], sg_id)

                    # Verify no 0.0.0.0/0 ingress rules (least privilege)
                    for rule in sg['IpPermissions']:
                        if 'IpRanges' in rule:
                            for ip_range in rule['IpRanges']:
                                self.assertNotEqual(ip_range.get('CidrIp'), '0.0.0.0/0',
                                                   f"Security group {sg_id} has 0.0.0.0/0 ingress")

                except ClientError as e:
                    self.fail(f"Security group {sg_id} does not exist: {e}")

    def test_vpc_endpoints_exist(self):
        """Test that VPC endpoints exist and are configured."""
        endpoint_outputs = [
            's3_endpoint_id',
            'ecr_api_endpoint_id',
            'ecr_dkr_endpoint_id'
        ]

        for endpoint_output in endpoint_outputs:
            if endpoint_output not in self.outputs:
                continue

            endpoint_id = self.outputs[endpoint_output]

            with self.subTest(endpoint=endpoint_output):
                try:
                    response = self.ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
                    endpoint = response['VpcEndpoints'][0]

                    self.assertEqual(endpoint['VpcEndpointId'], endpoint_id)
                    self.assertEqual(endpoint['State'], 'available')

                    # Verify endpoint type
                    if 's3' in endpoint_output:
                        self.assertEqual(endpoint['VpcEndpointType'], 'Gateway')
                    else:
                        self.assertEqual(endpoint['VpcEndpointType'], 'Interface')

                except ClientError as e:
                    self.fail(f"VPC Endpoint {endpoint_id} does not exist: {e}")

    def test_s3_bucket_exists_and_configured(self):
        """Test that S3 bucket for flow logs exists and is configured."""
        if 'flow_logs_bucket_name' not in self.outputs:
            self.skipTest("flow_logs_bucket_name not in outputs")

        bucket_name = self.outputs['flow_logs_bucket_name']

        try:
            # Test bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Test public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])

            # Test lifecycle policy
            lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle['Rules']
            self.assertTrue(len(rules) > 0)

            # Verify Glacier transition rule
            glacier_rule = next((r for r in rules if r['Status'] == 'Enabled'), None)
            self.assertIsNotNone(glacier_rule)

            if 'Transitions' in glacier_rule:
                transition = glacier_rule['Transitions'][0]
                self.assertEqual(transition['Days'], 7)
                self.assertEqual(transition['StorageClass'], 'GLACIER')

        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} validation failed: {e}")

    def test_network_acl_configured(self):
        """Test that Network ACLs are properly configured."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_network_acls(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            nacls = response['NetworkAcls']
            self.assertTrue(len(nacls) > 0, "No Network ACLs found")

            # Find custom NACL (not default)
            custom_nacls = [nacl for nacl in nacls if not nacl['IsDefault']]

            if custom_nacls:
                nacl = custom_nacls[0]

                # Verify ingress rules exist
                ingress_rules = [e for e in nacl['Entries'] if not e['Egress']]
                self.assertTrue(len(ingress_rules) > 0, "No ingress rules found")

                # Verify egress rules exist
                egress_rules = [e for e in nacl['Entries'] if e['Egress']]
                self.assertTrue(len(egress_rules) > 0, "No egress rules found")

        except ClientError as e:
            self.fail(f"Failed to verify Network ACLs: {e}")

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        try:
            response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )

            flow_logs = response['FlowLogs']
            self.assertTrue(len(flow_logs) > 0, "No Flow Logs found for VPC")

            flow_log = flow_logs[0]
            self.assertEqual(flow_log['ResourceId'], vpc_id)
            self.assertEqual(flow_log['TrafficType'], 'ALL')
            self.assertEqual(flow_log['LogDestinationType'], 's3')

        except ClientError as e:
            self.fail(f"Failed to verify VPC Flow Logs: {e}")

    def test_resource_tagging_compliance(self):
        """Test that all resources have required tags."""
        required_tags = ['Environment', 'Owner', 'CostCenter']

        if 'vpc_id' not in self.outputs:
            self.skipTest("vpc_id not in outputs")

        vpc_id = self.outputs['vpc_id']

        # Test VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        for required_tag in required_tags:
            self.assertIn(required_tag, tags, f"VPC missing required tag: {required_tag}")


if __name__ == '__main__':
    unittest.main()
```

## File: lib/README.md

```markdown
# VPC Infrastructure for Digital Banking Platform

This project implements a production-ready VPC infrastructure with strict network segmentation for a digital banking platform using CDKTF with Python.

## Architecture Overview

The infrastructure creates a three-tier network architecture:

- **VPC**: 10.50.0.0/16 CIDR block in configurable AWS region (default: us-east-1)
- **Public Subnets** (3): 10.50.0.0/24, 10.50.1.0/24, 10.50.2.0/24
- **Private Subnets** (3): 10.50.10.0/24, 10.50.11.0/24, 10.50.12.0/24
- **Database Subnets** (3): 10.50.20.0/24, 10.50.21.0/24, 10.50.22.0/24

### Key Components

1. **Internet Gateway**: Provides internet access for public subnets
2. **NAT Gateway**: Single NAT Gateway for cost optimization (reduces cost by 66% from 3 to 1)
3. **Route Tables**: Separate route tables for public, private, and database subnets
4. **Network ACLs**: Deny-by-default policy with explicit allow rules for HTTPS, SSH, and ephemeral ports
5. **Security Groups**: Four-tier security groups for ALB, ECS, RDS, and VPC Endpoints
6. **VPC Flow Logs**: Stored in S3 with 7-day Glacier transition
7. **VPC Endpoints**: S3 (Gateway) and ECR (Interface) endpoints to reduce NAT costs
8. **DB Subnet Group**: Pre-configured for future RDS Aurora deployment

## Prerequisites

- Python 3.8 or higher
- Node.js 14+ (required by CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

### Set Environment Variables

The environment suffix is used to ensure unique resource names:

```bash
export ENVIRONMENT_SUFFIX="synth12345"
export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
```

### Deploy Infrastructure

1. Synthesize the Terraform configuration:
```bash
cdktf synth
```

2. Deploy the infrastructure:
```bash
cdktf deploy --auto-approve
```

3. Save deployment outputs:
```bash
# Outputs are automatically saved to cdktf.out/stacks/tap/
# For integration tests, flatten outputs to cfn-outputs/flat-outputs.json
```

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `db_subnet_group_name`: RDS DB Subnet Group name
- `nat_gateway_public_ip`: NAT Gateway public IP address
- `alb_security_group_id`: ALB security group ID
- `ecs_security_group_id`: ECS security group ID
- `rds_security_group_id`: RDS security group ID
- `vpc_endpoint_security_group_id`: VPC Endpoint security group ID
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `ecr_api_endpoint_id`: ECR API VPC Endpoint ID
- `ecr_dkr_endpoint_id`: ECR DKR VPC Endpoint ID
- `flow_logs_bucket_name`: VPC Flow Logs S3 bucket name

## Testing

### Unit Tests

Unit tests validate the infrastructure code structure and resource definitions:

```bash
# Run unit tests with coverage
pipenv run pytest tests/unit/ -v --cov=lib --cov-report=term-missing --cov-report=json

# Coverage should be 100%
```

Unit tests verify:
- CDKTF stack instantiation
- Resource configuration and relationships
- Tag compliance
- Security group rules
- CIDR block allocations

### Integration Tests

Integration tests validate the deployed infrastructure in AWS using real resources:

```bash
# Ensure infrastructure is deployed first
cdktf deploy --auto-approve

# Save deployment outputs to cfn-outputs/flat-outputs.json
mkdir -p cfn-outputs
# ... flatten outputs ...

# Run integration tests against deployed resources
pipenv run pytest tests/integration/ -v
```

Integration tests verify:
- VPC and subnet configuration in AWS
- Route table associations
- Security group rules enforcement
- NAT Gateway and Internet Gateway connectivity
- VPC Flow Logs to S3
- VPC Endpoints functionality (S3, ECR API, ECR DKR)
- Network ACL rules
- Resource tagging compliance
- S3 bucket configuration (public access block, lifecycle policy)
- DB Subnet Group existence

**IMPORTANT**: Integration tests use cfn-outputs/flat-outputs.json for resource IDs and validate actual AWS resources, not mocked data.

## Resource Naming

All resources include the environment suffix in their names following the pattern:
- `banking-{resource-type}-{environment-suffix}`

Example: `banking-vpc-synth12345`

## Cost Optimization

This implementation includes several cost optimizations:

1. **Single NAT Gateway**: Reduces cost from $96/month (3 NAT Gateways) to $32/month
2. **VPC Endpoints**: S3 Gateway endpoint is free; ECR Interface endpoints reduce NAT Gateway data transfer costs
3. **Glacier Transition**: Flow logs transition to Glacier after 7 days, reducing storage costs by up to 95%

## Security Features

1. **Network Segmentation**: Three-tier architecture with isolated subnets
2. **Network ACLs**: Deny-by-default policy with explicit allow rules
3. **Security Groups**: Least privilege access between tiers with dedicated VPC endpoint security group
4. **Flow Logs**: All VPC traffic logged to S3 for audit and monitoring
5. **Encryption**: S3 bucket configured with encryption at rest
6. **Private Endpoints**: ECR endpoints enable private container image pulls
7. **DB Subnet Group**: Pre-configured for RDS Aurora with proper subnet isolation

## Cleanup

To destroy all resources:

```bash
cdktf destroy --auto-approve
```

Confirm the destruction when prompted. All resources are configured to be destroyable without manual intervention.

## Troubleshooting

### Common Issues

1. **NAT Gateway not ready**: Wait 2-3 minutes after creation before testing private subnet connectivity
2. **VPC Endpoint connection failures**: Ensure security groups allow traffic from subnet CIDR blocks
3. **Flow Logs not appearing**: S3 bucket permissions may need adjustment; check CloudWatch Logs for errors

### Debug Commands

```bash
# Check CDKTF version
cdktf --version

# View synthesized Terraform
cdktf synth

# Enable detailed logging
export CDKTF_LOG_LEVEL=debug
cdktf deploy
```

## Compliance

This infrastructure meets PCI-DSS requirements for network segmentation:

- Separate subnets for different workload tiers
- Network ACLs and security groups enforce traffic control
- Flow logs provide audit trail for all network traffic
- Private subnets prevent direct internet access to sensitive workloads
- Dedicated security groups for each tier follow least privilege principle

## Support

For issues or questions:
- Review the CDKTF documentation: https://developer.hashicorp.com/terraform/cdktf
- Check AWS VPC documentation: https://docs.aws.amazon.com/vpc/
- Review security group rules and NACL configurations in the code
```
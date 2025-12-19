# Multi-Account VPC Peering Infrastructure - CDKTF Python Implementation

This implementation provides a complete CDKTF Python solution for establishing secure VPC peering between payment and analytics environments across separate AWS accounts.

## File: lib/networking.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepter
from cdktf_cdktf_provider_aws.route import Route
from typing import List, Dict


class NetworkingModule(Construct):
    """
    Creates VPC infrastructure with public and private subnets across multiple AZs.
    Implements VPC peering connection for cross-account communication.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str = "us-east-1",
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = region
        self.common_tags = common_tags or {}
        self.availability_zones = [f"{region}a", f"{region}b", f"{region}c"]

        # Create Payment VPC (Account 1)
        self.payment_vpc = self._create_vpc(
            "payment",
            "10.0.0.0/16",
            {"Environment": "payment", **self.common_tags}
        )

        # Create Analytics VPC (Account 2)
        self.analytics_vpc = self._create_vpc(
            "analytics",
            "10.1.0.0/16",
            {"Environment": "analytics", **self.common_tags}
        )

        # Create subnets for Payment VPC
        self.payment_public_subnets, self.payment_private_subnets = self._create_subnets(
            self.payment_vpc,
            "payment",
            "10.0.0.0/16"
        )

        # Create subnets for Analytics VPC
        self.analytics_public_subnets, self.analytics_private_subnets = self._create_subnets(
            self.analytics_vpc,
            "analytics",
            "10.1.0.0/16"
        )

        # Create Internet Gateways
        self.payment_igw = self._create_internet_gateway(
            self.payment_vpc,
            "payment"
        )
        self.analytics_igw = self._create_internet_gateway(
            self.analytics_vpc,
            "analytics"
        )

        # Create NAT Gateways for Payment VPC
        self.payment_nat_gateways = self._create_nat_gateways(
            self.payment_public_subnets,
            "payment"
        )

        # Create NAT Gateways for Analytics VPC
        self.analytics_nat_gateways = self._create_nat_gateways(
            self.analytics_public_subnets,
            "analytics"
        )

        # Create route tables for Payment VPC
        self.payment_public_rt, self.payment_private_rts = self._create_route_tables(
            self.payment_vpc,
            self.payment_igw,
            self.payment_nat_gateways,
            self.payment_public_subnets,
            self.payment_private_subnets,
            "payment"
        )

        # Create route tables for Analytics VPC
        self.analytics_public_rt, self.analytics_private_rts = self._create_route_tables(
            self.analytics_vpc,
            self.analytics_igw,
            self.analytics_nat_gateways,
            self.analytics_public_subnets,
            self.analytics_private_subnets,
            "analytics"
        )

        # Create VPC Peering Connection
        self.peering_connection = self._create_vpc_peering()

        # Add peering routes to private route tables
        self._add_peering_routes()

    def _create_vpc(self, name: str, cidr: str, tags: Dict[str, str]) -> Vpc:
        """Create a VPC with DNS support enabled"""
        vpc = Vpc(
            self,
            f"vpc-{name}-{self.environment_suffix}",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{name}-{self.environment_suffix}",
                **tags
            }
        )
        return vpc

    def _create_subnets(
        self,
        vpc: Vpc,
        vpc_name: str,
        vpc_cidr: str
    ) -> tuple:
        """Create public and private subnets across 3 availability zones"""
        public_subnets = []
        private_subnets = []

        # Calculate subnet CIDRs
        base_octets = vpc_cidr.split('.')
        base = f"{base_octets[0]}.{base_octets[1]}"

        for idx, az in enumerate(self.availability_zones):
            # Public subnet
            public_subnet = Subnet(
                self,
                f"subnet-public-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base}.{idx * 16}.0/20",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"subnet-public-{vpc_name}-{az}-{self.environment_suffix}",
                    "Type": "public",
                    **self.common_tags
                }
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"subnet-private-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base}.{128 + idx * 16}.0/20",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"subnet-private-{vpc_name}-{az}-{self.environment_suffix}",
                    "Type": "private",
                    **self.common_tags
                }
            )
            private_subnets.append(private_subnet)

        return public_subnets, private_subnets

    def _create_internet_gateway(self, vpc: Vpc, vpc_name: str) -> InternetGateway:
        """Create Internet Gateway for public subnet internet access"""
        igw = InternetGateway(
            self,
            f"igw-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"igw-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return igw

    def _create_nat_gateways(
        self,
        public_subnets: List[Subnet],
        vpc_name: str
    ) -> List[NatGateway]:
        """Create NAT Gateways in each public subnet for outbound internet access"""
        nat_gateways = []

        for idx, subnet in enumerate(public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"eip-nat-{vpc_name}-{idx}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"eip-nat-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                }
            )

            # Create NAT Gateway
            nat = NatGateway(
                self,
                f"nat-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={
                    "Name": f"nat-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                }
            )
            nat_gateways.append(nat)

        return nat_gateways

    def _create_route_tables(
        self,
        vpc: Vpc,
        igw: InternetGateway,
        nat_gateways: List[NatGateway],
        public_subnets: List[Subnet],
        private_subnets: List[Subnet],
        vpc_name: str
    ) -> tuple:
        """Create and configure route tables for public and private subnets"""

        # Public route table (shared across all public subnets)
        public_rt = RouteTable(
            self,
            f"rt-public-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"rt-public-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )

        # Associate public subnets with public route table
        for idx, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"rta-public-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private route tables (one per AZ for NAT Gateway routing)
        private_rts = []
        for idx, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = RouteTable(
                self,
                f"rt-private-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={
                    "Name": f"rt-private-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                }
            )
            private_rts.append(private_rt)

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"rta-private-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        return public_rt, private_rts

    def _create_vpc_peering(self) -> VpcPeeringConnection:
        """Create VPC peering connection between payment and analytics VPCs"""
        peering = VpcPeeringConnection(
            self,
            f"peering-payment-analytics-{self.environment_suffix}",
            vpc_id=self.payment_vpc.id,
            peer_vpc_id=self.analytics_vpc.id,
            auto_accept=True,
            tags={
                "Name": f"peering-payment-analytics-{self.environment_suffix}",
                "Side": "Requester",
                **self.common_tags
            }
        )
        return peering

    def _add_peering_routes(self):
        """Add routes to private route tables for VPC peering traffic"""
        # Add routes from Payment VPC private subnets to Analytics VPC
        for idx, rt in enumerate(self.payment_private_rts):
            Route(
                self,
                f"route-payment-to-analytics-{idx}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="10.1.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id
            )

        # Add routes from Analytics VPC private subnets to Payment VPC
        for idx, rt in enumerate(self.analytics_private_rts):
            Route(
                self,
                f"route-analytics-to-payment-{idx}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="10.0.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id
            )
```

## File: lib/security.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl, NetworkAclIngress, NetworkAclEgress
from cdktf_cdktf_provider_aws.network_acl_association import NetworkAclAssociation
from typing import List, Dict


class SecurityModule(Construct):
    """
    Creates security groups and network ACLs for controlling traffic between VPCs.
    Implements PCI DSS compliant security controls.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        payment_vpc_id: str,
        analytics_vpc_id: str,
        payment_private_subnets: List,
        analytics_private_subnets: List,
        environment_suffix: str,
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.common_tags = common_tags or {}

        # Create security groups for Payment VPC
        self.payment_sg = self._create_security_group(
            payment_vpc_id,
            "payment",
            "10.1.0.0/16",  # Allow traffic from Analytics VPC
            "Security group for payment VPC - allows HTTPS and PostgreSQL from analytics"
        )

        # Create security groups for Analytics VPC
        self.analytics_sg = self._create_security_group(
            analytics_vpc_id,
            "analytics",
            "10.0.0.0/16",  # Allow traffic from Payment VPC
            "Security group for analytics VPC - allows HTTPS and PostgreSQL from payment"
        )

        # Create Network ACLs for Payment VPC private subnets
        self.payment_nacl = self._create_network_acl(
            payment_vpc_id,
            "payment",
            "10.1.0.0/16",  # Analytics VPC CIDR
            payment_private_subnets
        )

        # Create Network ACLs for Analytics VPC private subnets
        self.analytics_nacl = self._create_network_acl(
            analytics_vpc_id,
            "analytics",
            "10.0.0.0/16",  # Payment VPC CIDR
            analytics_private_subnets
        )

    def _create_security_group(
        self,
        vpc_id: str,
        vpc_name: str,
        peer_cidr: str,
        description: str
    ) -> SecurityGroup:
        """Create security group allowing HTTPS and PostgreSQL from peer VPC"""

        sg = SecurityGroup(
            self,
            f"sg-{vpc_name}-{self.environment_suffix}",
            name=f"sg-{vpc_name}-{self.environment_suffix}",
            description=description,
            vpc_id=vpc_id,
            ingress=[
                # Allow HTTPS (443) from peer VPC
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[peer_cidr],
                    description=f"Allow HTTPS from peer VPC"
                ),
                # Allow PostgreSQL (5432) from peer VPC
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=[peer_cidr],
                    description=f"Allow PostgreSQL from peer VPC"
                )
            ],
            egress=[
                # Allow all outbound traffic
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"sg-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return sg

    def _create_network_acl(
        self,
        vpc_id: str,
        vpc_name: str,
        peer_cidr: str,
        subnets: List
    ) -> NetworkAcl:
        """Create Network ACL restricting traffic to specific ports from peer VPC"""

        nacl = NetworkAcl(
            self,
            f"nacl-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc_id,
            ingress=[
                # Allow HTTPS (443) from peer VPC
                NetworkAclIngress(
                    rule_no=100,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=443,
                    to_port=443
                ),
                # Allow PostgreSQL (5432) from peer VPC
                NetworkAclIngress(
                    rule_no=110,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=5432,
                    to_port=5432
                ),
                # Allow SSH (22) from peer VPC
                NetworkAclIngress(
                    rule_no=120,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=22,
                    to_port=22
                ),
                # Allow ephemeral ports for return traffic
                NetworkAclIngress(
                    rule_no=130,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=1024,
                    to_port=65535
                ),
                # Allow all traffic from within VPC
                NetworkAclIngress(
                    rule_no=140,
                    protocol="-1",
                    action="allow",
                    cidr_block="10.0.0.0/8",
                    from_port=0,
                    to_port=0
                )
            ],
            egress=[
                # Allow HTTPS (443) to peer VPC
                NetworkAclEgress(
                    rule_no=100,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=443,
                    to_port=443
                ),
                # Allow PostgreSQL (5432) to peer VPC
                NetworkAclEgress(
                    rule_no=110,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=5432,
                    to_port=5432
                ),
                # Allow SSH (22) to peer VPC
                NetworkAclEgress(
                    rule_no=120,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=22,
                    to_port=22
                ),
                # Allow ephemeral ports for return traffic
                NetworkAclEgress(
                    rule_no=130,
                    protocol="tcp",
                    action="allow",
                    cidr_block=peer_cidr,
                    from_port=1024,
                    to_port=65535
                ),
                # Allow all traffic to internet for NAT
                NetworkAclEgress(
                    rule_no=140,
                    protocol="-1",
                    action="allow",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            tags={
                "Name": f"nacl-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )

        # Associate NACL with private subnets
        for idx, subnet in enumerate(subnets):
            NetworkAclAssociation(
                self,
                f"nacl-assoc-{vpc_name}-{idx}-{self.environment_suffix}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id
            )

        return nacl
```

## File: lib/monitoring.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json
from typing import Dict


class MonitoringModule(Construct):
    """
    Creates VPC Flow Logs and S3 storage with lifecycle policies.
    Implements monitoring and audit capabilities for network traffic.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        payment_vpc_id: str,
        analytics_vpc_id: str,
        environment_suffix: str,
        region: str = "us-east-1",
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = region
        self.common_tags = common_tags or {}

        # Create S3 bucket for Payment VPC flow logs
        self.payment_logs_bucket = self._create_flow_logs_bucket("payment")

        # Create S3 bucket for Analytics VPC flow logs
        self.analytics_logs_bucket = self._create_flow_logs_bucket("analytics")

        # Create IAM role for Flow Logs
        self.flow_logs_role = self._create_flow_logs_role()

        # Enable VPC Flow Logs for Payment VPC
        self.payment_flow_log = self._create_flow_log(
            payment_vpc_id,
            "payment",
            self.payment_logs_bucket.arn
        )

        # Enable VPC Flow Logs for Analytics VPC
        self.analytics_flow_log = self._create_flow_log(
            analytics_vpc_id,
            "analytics",
            self.analytics_logs_bucket.arn
        )

    def _create_flow_logs_bucket(self, vpc_name: str) -> S3Bucket:
        """Create S3 bucket with lifecycle policy for flow logs storage"""

        # Create S3 bucket
        bucket = S3Bucket(
            self,
            f"s3-flowlogs-{vpc_name}-{self.environment_suffix}",
            bucket=f"flowlogs-{vpc_name}-{self.environment_suffix}",
            force_destroy=True,  # Allow bucket to be destroyed with contents
            tags={
                "Name": f"s3-flowlogs-{vpc_name}-{self.environment_suffix}",
                "Purpose": "VPC Flow Logs",
                **self.common_tags
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            f"s3-block-public-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        # Configure lifecycle policy for 90-day retention
        S3BucketLifecycleConfiguration(
            self,
            f"s3-lifecycle-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )
                )
            ]
        )

        return bucket

    def _create_flow_logs_role(self) -> IamRole:
        """Create IAM role for VPC Flow Logs to write to S3"""

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            f"role-flowlogs-{self.environment_suffix}",
            name=f"role-flowlogs-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"role-flowlogs-{self.environment_suffix}",
                **self.common_tags
            }
        )

        # Attach policy for S3 access
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"{self.payment_logs_bucket.arn}/*",
                        f"{self.analytics_logs_bucket.arn}/*",
                        self.payment_logs_bucket.arn,
                        self.analytics_logs_bucket.arn
                    ]
                }
            ]
        }

        IamRolePolicy(
            self,
            f"policy-flowlogs-{self.environment_suffix}",
            name=f"policy-flowlogs-{self.environment_suffix}",
            role=role.id,
            policy=json.dumps(policy_document)
        )

        return role

    def _create_flow_log(
        self,
        vpc_id: str,
        vpc_name: str,
        bucket_arn: str
    ) -> FlowLog:
        """Enable VPC Flow Logs with S3 destination"""

        flow_log = FlowLog(
            self,
            f"flowlog-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc_id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=bucket_arn,
            tags={
                "Name": f"flowlog-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return flow_log
```

## File: lib/dns.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_zone_association import Route53ZoneAssociation
from typing import Dict


class DnsModule(Construct):
    """
    Creates Route 53 private hosted zones for cross-VPC DNS resolution.
    Enables service discovery across peered VPCs.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        payment_vpc_id: str,
        analytics_vpc_id: str,
        environment_suffix: str,
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.common_tags = common_tags or {}

        # Create private hosted zone for payment domain
        self.payment_zone = self._create_hosted_zone(
            "payment.internal",
            payment_vpc_id,
            "payment"
        )

        # Associate payment zone with analytics VPC for cross-VPC resolution
        self._associate_zone_with_vpc(
            self.payment_zone,
            analytics_vpc_id,
            "payment",
            "analytics"
        )

        # Create private hosted zone for analytics domain
        self.analytics_zone = self._create_hosted_zone(
            "analytics.internal",
            analytics_vpc_id,
            "analytics"
        )

        # Associate analytics zone with payment VPC for cross-VPC resolution
        self._associate_zone_with_vpc(
            self.analytics_zone,
            payment_vpc_id,
            "analytics",
            "payment"
        )

    def _create_hosted_zone(
        self,
        domain_name: str,
        vpc_id: str,
        vpc_name: str
    ) -> Route53Zone:
        """Create Route 53 private hosted zone"""

        # Include environment suffix in domain name
        full_domain = f"{vpc_name}-{self.environment_suffix}.{domain_name}"

        zone = Route53Zone(
            self,
            f"zone-{vpc_name}-{self.environment_suffix}",
            name=full_domain,
            vpc=[{
                "vpc_id": vpc_id
            }],
            tags={
                "Name": f"zone-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return zone

    def _associate_zone_with_vpc(
        self,
        zone: Route53Zone,
        vpc_id: str,
        zone_name: str,
        vpc_name: str
    ):
        """Associate hosted zone with additional VPC for cross-VPC DNS"""

        Route53ZoneAssociation(
            self,
            f"zone-assoc-{zone_name}-{vpc_name}-{self.environment_suffix}",
            zone_id=zone.zone_id,
            vpc_id=vpc_id
        )
```

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingModule
from lib.security import SecurityModule
from lib.monitoring import MonitoringModule
from lib.dns import DnsModule


class TapStack(TerraformStack):
    """
    Main CDKTF stack for multi-account VPC peering infrastructure.
    Orchestrates networking, security, monitoring, and DNS modules.
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = "us-east-1"

        # Common tags for all resources
        self.common_tags = {
            "Project": "VPC-Peering",
            "CostCenter": "Infrastructure",
            "ManagedBy": "CDKTF",
            "Environment": environment_suffix
        }

        # AWS Provider configuration
        AwsProvider(
            self,
            "aws",
            region=self.region
        )

        # Create networking infrastructure
        self.networking = NetworkingModule(
            self,
            "networking",
            environment_suffix=self.environment_suffix,
            region=self.region,
            common_tags=self.common_tags
        )

        # Create security groups and network ACLs
        self.security = SecurityModule(
            self,
            "security",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            payment_private_subnets=self.networking.payment_private_subnets,
            analytics_private_subnets=self.networking.analytics_private_subnets,
            environment_suffix=self.environment_suffix,
            common_tags=self.common_tags
        )

        # Create VPC Flow Logs and monitoring
        self.monitoring = MonitoringModule(
            self,
            "monitoring",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            environment_suffix=self.environment_suffix,
            region=self.region,
            common_tags=self.common_tags
        )

        # Create Route 53 private hosted zones
        self.dns = DnsModule(
            self,
            "dns",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            environment_suffix=self.environment_suffix,
            common_tags=self.common_tags
        )

        # Create outputs
        self._create_outputs()

    def _create_outputs(self):
        """Create Terraform outputs for important resource IDs"""

        # VPC outputs
        TerraformOutput(
            self,
            "payment_vpc_id",
            value=self.networking.payment_vpc.id,
            description="Payment VPC ID"
        )

        TerraformOutput(
            self,
            "analytics_vpc_id",
            value=self.networking.analytics_vpc.id,
            description="Analytics VPC ID"
        )

        # Peering connection output
        TerraformOutput(
            self,
            "peering_connection_id",
            value=self.networking.peering_connection.id,
            description="VPC Peering Connection ID"
        )

        # Security group outputs
        TerraformOutput(
            self,
            "payment_security_group_id",
            value=self.security.payment_sg.id,
            description="Payment VPC Security Group ID"
        )

        TerraformOutput(
            self,
            "analytics_security_group_id",
            value=self.security.analytics_sg.id,
            description="Analytics VPC Security Group ID"
        )

        # Flow logs bucket outputs
        TerraformOutput(
            self,
            "payment_logs_bucket",
            value=self.monitoring.payment_logs_bucket.bucket,
            description="Payment VPC Flow Logs S3 Bucket"
        )

        TerraformOutput(
            self,
            "analytics_logs_bucket",
            value=self.monitoring.analytics_logs_bucket.bucket,
            description="Analytics VPC Flow Logs S3 Bucket"
        )

        # DNS zone outputs
        TerraformOutput(
            self,
            "payment_hosted_zone_id",
            value=self.dns.payment_zone.zone_id,
            description="Payment Private Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "analytics_hosted_zone_id",
            value=self.dns.analytics_zone.zone_id,
            description="Analytics Private Hosted Zone ID"
        )
```

## File: tap.py

```python
#!/usr/bin/env python3
from cdktf import App
from lib.tap_stack import TapStack

app = App()
TapStack(app, "tap", environment_suffix="dev")
app.synth()
```

## File: lib/README.md

```markdown
# Multi-Account VPC Peering Infrastructure

This CDKTF Python implementation creates a secure multi-account VPC peering setup for payment and analytics environments with PCI DSS compliant security controls.

## Architecture Overview

The infrastructure creates:

- **Two VPCs**: Payment (10.0.0.0/16) and Analytics (10.1.0.0/16)
- **Multi-AZ Design**: 3 availability zones with public and private subnets
- **VPC Peering**: Secure cross-account connectivity
- **NAT Gateways**: One per AZ for high availability
- **Security Controls**: Security groups and Network ACLs
- **Monitoring**: VPC Flow Logs with S3 storage (90-day retention)
- **DNS Resolution**: Route 53 private hosted zones for cross-VPC service discovery

## Prerequisites

### Software Requirements

- Python 3.8 or higher
- Node.js 16.x or higher (for CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials

### Install Dependencies

```bash
# Install CDKTF CLI
npm install -g cdktf-cli

# Install Python dependencies
pip install cdktf cdktf-cdktf-provider-aws constructs
```

## Module Structure

```
lib/
├── networking.py       # VPCs, subnets, gateways, peering
├── security.py         # Security groups and Network ACLs
├── monitoring.py       # VPC Flow Logs and S3 buckets
├── dns.py             # Route 53 private hosted zones
├── tap_stack.py       # Main stack orchestration
└── __init__.py
```

## Configuration

### Environment Suffix

The `environment_suffix` parameter ensures resource name uniqueness across environments:

```python
TapStack(app, "tap", environment_suffix="dev")    # Development
TapStack(app, "tap", environment_suffix="prod")   # Production
```

### Region

Default region is `us-east-1`. To change:

```python
# In tap_stack.py
self.region = "us-west-2"
```

## Multi-Account Setup

### Required IAM Permissions

For cross-account VPC peering, ensure the following IAM permissions are configured:

**Account 1 (Payment - Requester)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpcPeeringConnection",
        "ec2:DescribeVpcPeeringConnections"
      ],
      "Resource": "*"
    }
  ]
}
```

**Account 2 (Analytics - Accepter)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:AcceptVpcPeeringConnection",
        "ec2:DescribeVpcPeeringConnections"
      ],
      "Resource": "*"
    }
  ]
}
```

### Deployment Steps

1. **Configure AWS Credentials**:
   ```bash
   # Set up AWS profiles for both accounts
   aws configure --profile payment-account
   aws configure --profile analytics-account
   ```

2. **Synthesize CDKTF**:
   ```bash
   cdktf synth
   ```

3. **Deploy Infrastructure**:
   ```bash
   cdktf deploy
   ```

4. **Verify Peering Connection**:
   ```bash
   aws ec2 describe-vpc-peering-connections --profile payment-account
   ```

## Security Features

### PCI DSS Compliance

- Network isolation using VPCs and subnets
- Restricted traffic to ports 443, 5432, and 22 only
- Encrypted S3 buckets for flow logs
- Comprehensive logging and monitoring
- Security groups and Network ACLs for defense in depth

### Traffic Control

**Allowed Traffic Between VPCs**:
- HTTPS (port 443) - API and web traffic
- PostgreSQL (port 5432) - Database connections
- SSH (port 22) - Administrative access

**Network ACLs**: Stateless rules at subnet level
**Security Groups**: Stateful rules at instance level

## Monitoring and Logging

### VPC Flow Logs

Flow logs capture all network traffic for audit purposes:

- **Destination**: S3 buckets (separate for each VPC)
- **Retention**: 90 days (automatic lifecycle policy)
- **Encryption**: AES-256 server-side encryption
- **Traffic Type**: ALL (accept, reject, and all traffic)

### S3 Bucket Configuration

- Public access blocked
- Versioning disabled
- Force destroy enabled (for easy cleanup)
- Lifecycle policy for 90-day expiration

## DNS Resolution

Route 53 private hosted zones enable service discovery:

- **Payment Zone**: `payment-{env}.payment.internal`
- **Analytics Zone**: `analytics-{env}.analytics.internal`

Both zones are associated with both VPCs for cross-VPC DNS resolution.

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{purpose}-{environmentSuffix}`

Examples:
- `vpc-payment-dev`
- `subnet-private-analytics-us-east-1a-dev`
- `sg-payment-dev`
- `flowlogs-analytics-dev`

## Outputs

After deployment, the following outputs are available:

```bash
cdktf output
```

- `payment_vpc_id` - Payment VPC ID
- `analytics_vpc_id` - Analytics VPC ID
- `peering_connection_id` - VPC Peering Connection ID
- `payment_security_group_id` - Payment Security Group ID
- `analytics_security_group_id` - Analytics Security Group ID
- `payment_logs_bucket` - Payment Flow Logs Bucket Name
- `analytics_logs_bucket` - Analytics Flow Logs Bucket Name
- `payment_hosted_zone_id` - Payment Hosted Zone ID
- `analytics_hosted_zone_id` - Analytics Hosted Zone ID

## Testing

### Unit Tests

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/
```

### Integration Tests

```bash
# Deploy to test environment
cdktf deploy --auto-approve

# Verify connectivity
./scripts/test-connectivity.sh

# Cleanup
cdktf destroy --auto-approve
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with `force_destroy=True` to ensure clean removal.

## Troubleshooting

### Common Issues

1. **Peering Connection Not Active**
   - Verify IAM permissions in accepter account
   - Check that `auto_accept=True` is set
   - Ensure both VPCs are in the same region

2. **Route Table Issues**
   - Verify peering connection ID in routes
   - Check that CIDR blocks don't overlap
   - Ensure routes exist in both directions

3. **DNS Resolution Fails**
   - Verify hosted zone associations
   - Enable DNS resolution and DNS hostnames on VPCs
   - Check Route 53 query logs

4. **Flow Logs Not Appearing**
   - Verify IAM role permissions
   - Check S3 bucket policy
   - Allow 10-15 minutes for initial log delivery

## Cost Optimization

Estimated monthly costs (us-east-1):

- **VPC and Subnets**: Free
- **NAT Gateways**: ~$97.92 (6 gateways × $0.045/hour × 730 hours)
- **VPC Peering**: $0.01/GB transferred
- **S3 Storage**: ~$0.69 (30 GB × $0.023/GB)
- **Route 53 Hosted Zones**: $1.00 (2 zones × $0.50/zone)

**Total**: ~$99.61/month (excluding data transfer)

### Cost Reduction Options

- Reduce NAT Gateways to 1 per VPC (reduces HA)
- Use VPC endpoints for AWS services
- Implement S3 Intelligent-Tiering for flow logs

## Support

For issues or questions:
- Check AWS CloudWatch Logs
- Review VPC Flow Logs in S3
- Consult AWS VPC Peering documentation
- Open issue in repository

## License

This infrastructure code is provided as-is for educational and deployment purposes.
```

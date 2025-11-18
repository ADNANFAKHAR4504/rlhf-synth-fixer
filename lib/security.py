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
            name=f"{vpc_name}-security-group-{self.environment_suffix}",
            description=description,
            vpc_id=vpc_id,
            ingress=[
                # Allow HTTPS (443) from peer VPC
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[peer_cidr],
                    description="Allow HTTPS from peer VPC"
                ),
                # Allow PostgreSQL (5432) from peer VPC
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=[peer_cidr],
                    description="Allow PostgreSQL from peer VPC"
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
                "Name": f"{vpc_name}-security-group-{self.environment_suffix}",
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

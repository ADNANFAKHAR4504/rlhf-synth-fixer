"""Security groups stack."""

from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class SecurityStack(Construct):
    """Security groups for ALB, ECS, and ElastiCache."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc_id: str,
        environment_suffix: str
    ):
        """Initialize security groups."""
        super().__init__(scope, construct_id)

        # ALB Security Group
        self.alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"pc-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    description="Allow HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"product-catalog-alb-sg-{environment_suffix}"
            }
        )

        # ECS Security Group
        self.ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"pc-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow traffic from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"product-catalog-ecs-sg-{environment_suffix}"
            }
        )

        # ElastiCache Security Group
        self.cache_sg = SecurityGroup(
            self,
            "cache_sg",
            name=f"pc-cache-sg-{environment_suffix}",
            description="Security group for ElastiCache",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow Redis from ECS tasks",
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[self.ecs_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"product-catalog-cache-sg-{environment_suffix}"
            }
        )

    @property
    def alb_security_group_id(self):
        """Return ALB security group ID."""
        return self.alb_sg.id

    @property
    def ecs_security_group_id(self):
        """Return ECS security group ID."""
        return self.ecs_sg.id

    @property
    def cache_security_group_id(self):
        """Return cache security group ID."""
        return self.cache_sg.id

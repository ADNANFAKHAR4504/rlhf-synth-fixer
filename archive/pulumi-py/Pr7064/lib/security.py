"""Security Groups"""
import pulumi
import pulumi_aws as aws
from typing import Dict

def create_security_groups(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    vpc_cidr: str,
    tags: Dict[str, str]
) -> Dict[str, aws.ec2.SecurityGroup]:
    """Create security groups for all components"""

    # ALB Security Group
    alb_sg = aws.ec2.SecurityGroup(
        f"payment-alb-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for Application Load Balancer",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=80,
                to_port=80,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP from internet"
            ),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS from internet"
            )
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
        tags={**tags, "Name": f"payment-alb-sg-{environment_suffix}"}
    )

    # Application Security Group
    app_sg = aws.ec2.SecurityGroup(
        f"payment-app-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for ECS application containers",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=8080,
                to_port=8080,
                security_groups=[alb_sg.id],
                description="Allow traffic from ALB"
            )
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
        tags={**tags, "Name": f"payment-app-sg-{environment_suffix}"}
    )

    # Database Security Group
    database_sg = aws.ec2.SecurityGroup(
        f"payment-db-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for RDS Aurora database",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[app_sg.id],
                description="PostgreSQL from application"
            )
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
        tags={**tags, "Name": f"payment-db-sg-{environment_suffix}"}
    )

    # Cache Security Group
    cache_sg = aws.ec2.SecurityGroup(
        f"payment-cache-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for ElastiCache Redis",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=6379,
                to_port=6379,
                security_groups=[app_sg.id],
                description="Redis from application"
            )
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
        tags={**tags, "Name": f"payment-cache-sg-{environment_suffix}"}
    )

    return {
        "alb_sg": alb_sg,
        "app_sg": app_sg,
        "database_sg": database_sg,
        "cache_sg": cache_sg
    }

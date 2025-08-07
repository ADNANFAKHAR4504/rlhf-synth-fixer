"""VPC module for secure network infrastructure."""
import pulumi
import pulumi_aws as aws


class VPCManager:
  """Manages VPC and network security components."""

  def __init__(self, project_name: str, environment: str):
    self.project_name = project_name
    self.environment = environment

  def create_vpc(self) -> aws.ec2.Vpc:
    """Create secure VPC with proper configuration."""

    vpc = aws.ec2.Vpc(
        f"{self.project_name}-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"{self.project_name}-vpc",
            "Environment": self.environment,
            "Purpose": "secure-network",
            "ManagedBy": "pulumi"
        }
    )

    return vpc

  def create_private_subnets(self, vpc: aws.ec2.Vpc) -> list:
    """Create private subnets for secure workloads."""

    private_subnets = []
    availability_zones = ["us-west-1a", "us-west-1c"]

    for i, az in enumerate(availability_zones):
      subnet = aws.ec2.Subnet(
          f"{self.project_name}-private-subnet-{i + 1}",
          vpc_id=vpc.id,
          cidr_block=f"10.0.{i + 1}.0/24",
          availability_zone=az,
          map_public_ip_on_launch=False,
          tags={
              "Name": f"{self.project_name}-private-subnet-{i + 1}",
              "Environment": self.environment,
              "Type": "private",
              "ManagedBy": "pulumi"
          }
      )
      private_subnets.append(subnet)

    return private_subnets

  def create_security_groups(self, vpc: aws.ec2.Vpc) -> aws.ec2.SecurityGroup:
    """Create restrictive security groups."""

    # Default security group with minimal access
    default_sg = aws.ec2.SecurityGroup(
        f"{self.project_name}-default-sg",
        name=f"{self.project_name}-default-sg",
        description="Default security group with minimal access",
        vpc_id=vpc.id,
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS outbound only"
            )
        ],
        tags={
            "Name": f"{self.project_name}-default-sg",
            "Environment": self.environment,
            "Purpose": "default-minimal-access",
            "ManagedBy": "pulumi"
        }
    )

    return default_sg

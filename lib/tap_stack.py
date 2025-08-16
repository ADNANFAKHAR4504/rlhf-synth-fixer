"""
tap_stack.py

Single-file Pulumi script for AWS infrastructure deployment.
Creates a VPC with public/private subnets, NAT Gateway, security groups with
least-privilege egress, and VPC Flow Logs to CloudWatch (14-day retention).

Run with: pulumi up

Required config:
  pulumi config set --path ssh_allowed_cidrs[0] "<your_ip>/32"
  # (Optionally add more entries for team/VPN ranges)
"""

import json
import pulumi
from pulumi import Config
from pulumi_aws import ec2, iam, cloudwatch, get_availability_zones


def create_infrastructure(export_outputs=True):
    """Create the complete AWS infrastructure."""
    # ---------------------------
    # Config & security validation
    # ---------------------------
    config = Config()
    environment = config.get('environment') or 'dev'
    team = config.get('team') or 'platform'
    project = config.get('project') or 'tap'

    # Mandatory explicit SSH allowlist for ALL environments
    # e.g., pulumi config set --path ssh_allowed_cidrs[0] "203.0.113.45/32"
    ssh_allowed_cidrs = config.get_object('ssh_allowed_cidrs')  # expects list

    if not ssh_allowed_cidrs or not isinstance(ssh_allowed_cidrs, list):
        raise ValueError(
            "Config 'ssh_allowed_cidrs' is required and must be a list "
            "(e.g., ['203.0.113.45/32']). Refusing to default to 0.0.0.0/0."
        )

    # Never allow 0.0.0.0/0 for SSH in any environment
    if any(c == '0.0.0.0/0' for c in ssh_allowed_cidrs):
        raise ValueError("Refusing SSH from 0.0.0.0/0. Provide a specific CIDR (e.g., your /32).")

    print(f"Security: SSH allowlist for {environment}: {ssh_allowed_cidrs}")

    # ---------------------------
    # AZs & base networking
    # ---------------------------
    azs = get_availability_zones(state="available")

    # VPC
    vpc = ec2.Vpc(
        f"vpc-{environment}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"vpc-{environment}",
        },
    )

    # Internet Gateway
    igw = ec2.InternetGateway(
        f"igw-{environment}",
        vpc_id=vpc.id,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"igw-{environment}",
        },
    )

    # Public Subnets
    public_subnet_1 = ec2.Subnet(
        f"public-subnet-1-{environment}",
        vpc_id=vpc.id,
        cidr_block="10.0.1.0/24",
        availability_zone=azs.names[0],
        map_public_ip_on_launch=True,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"public-subnet-1-{environment}",
        },
    )

    public_subnet_2 = ec2.Subnet(
        f"public-subnet-2-{environment}",
        vpc_id=vpc.id,
        cidr_block="10.0.2.0/24",
        availability_zone=azs.names[1],
        map_public_ip_on_launch=True,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"public-subnet-2-{environment}",
        },
    )

    # Private Subnets
    private_subnet_1 = ec2.Subnet(
        f"private-subnet-1-{environment}",
        vpc_id=vpc.id,
        cidr_block="10.0.3.0/24",
        availability_zone=azs.names[0],
        map_public_ip_on_launch=False,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"private-subnet-1-{environment}",
        },
    )

    private_subnet_2 = ec2.Subnet(
        f"private-subnet-2-{environment}",
        vpc_id=vpc.id,
        cidr_block="10.0.4.0/24",
        availability_zone=azs.names[1],
        map_public_ip_on_launch=False,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"private-subnet-2-{environment}",
        },
    )

    # Elastic IP for NAT Gateway
    eip = ec2.Eip(
        f"nat-eip-{environment}",
        vpc=True,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"nat-eip-{environment}",
        },
    )

    # NAT Gateway (cost-friendly single NAT in AZ of public_subnet_1)
    nat_gateway = ec2.NatGateway(
        f"nat-gateway-{environment}",
        allocation_id=eip.id,
        subnet_id=public_subnet_1.id,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"nat-gateway-{environment}",
        },
    )

    # Route Tables
    public_rt = ec2.RouteTable(
        f"public-rt-{environment}",
        vpc_id=vpc.id,
        routes=[
            ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
            )
        ],
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"public-rt-{environment}",
        },
    )

    private_rt = ec2.RouteTable(
        f"private-rt-{environment}",
        vpc_id=vpc.id,
        routes=[
            ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
            )
        ],
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"private-rt-{environment}",
        },
    )

    # Route Table Associations
    ec2.RouteTableAssociation(
        f"public-rta-1-{environment}", subnet_id=public_subnet_1.id, route_table_id=public_rt.id
    )
    ec2.RouteTableAssociation(
        f"public-rta-2-{environment}", subnet_id=public_subnet_2.id, route_table_id=public_rt.id
    )
    ec2.RouteTableAssociation(
        f"private-rta-1-{environment}", subnet_id=private_subnet_1.id, route_table_id=private_rt.id
    )
    ec2.RouteTableAssociation(
        f"private-rta-2-{environment}", subnet_id=private_subnet_2.id, route_table_id=private_rt.id
    )

    # ---------------------------
    # Security Groups (tightened)
    # ---------------------------
    # PUBLIC SG: Web + SSH (allowlisted). Least-priv egress (80/443/ephemeral).
    public_sg = ec2.SecurityGroup(
        f"public-sg-{environment}",
        description="Public SG: Web + SSH (allowlisted)",
        vpc_id=vpc.id,
        ingress=[
            ec2.SecurityGroupIngressArgs(
                description="SSH (allowlisted)",
                from_port=22,
                to_port=22,
                protocol="tcp",
                cidr_blocks=ssh_allowed_cidrs,
            ),
            ec2.SecurityGroupIngressArgs(
                description="HTTP",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
            ec2.SecurityGroupIngressArgs(
                description="HTTPS",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
        ],
        egress=[
            ec2.SecurityGroupEgressArgs(
                description="HTTPS egress",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
            ec2.SecurityGroupEgressArgs(
                description="HTTP egress",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
            ec2.SecurityGroupEgressArgs(
                description="Ephemeral egress",
                from_port=1024,
                to_port=65535,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
        ],
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"public-sg-{environment}",
            "SecurityLevel": "Public",
        },
    )

    # PRIVATE SG: Internal VPC only ingress; least-priv egress via NAT.
    private_sg = ec2.SecurityGroup(
        f"private-sg-{environment}",
        description="Private SG: Internal VPC only; least-priv egress",
        vpc_id=vpc.id,
        ingress=[
            ec2.SecurityGroupIngressArgs(
                description="All internal VPC traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=[vpc.cidr_block],
            )
        ],
        egress=[
            ec2.SecurityGroupEgressArgs(
                description="HTTPS egress via NAT",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
            ec2.SecurityGroupEgressArgs(
                description="HTTP egress via NAT",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
            ec2.SecurityGroupEgressArgs(
                description="Ephemeral egress via NAT",
                from_port=1024,
                to_port=65535,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
            ),
        ],
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"private-sg-{environment}",
            "SecurityLevel": "Private",
        },
    )

    # ---------------------------
    # VPC Flow Logs → CloudWatch
    # ---------------------------
    flow_logs_group = cloudwatch.LogGroup(
        f"vpc-flow-logs-{environment}",
        name=f"/vpc/{environment}/flow-logs",
        retention_in_days=14,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"vpc-flow-logs-{environment}",
        },
    )

    flow_logs_role = iam.Role(
        f"vpc-flow-logs-role-{environment}",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                        "Action": "sts:AssumeRole",
                    }
                ],
            }
        ),
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"vpc-flow-logs-role-{environment}",
        },
    )

    flow_logs_policy = iam.RolePolicy(
        f"vpc-flow-logs-policy-{environment}",
        role=flow_logs_role.id,
        policy=pulumi.Output.secret(
            json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams",
                                "logs:CreateLogGroup",
                            ],
                            "Resource": "*",
                        }
                    ],
                }
            )
        ),
    )

    vpc_flow_log = ec2.FlowLog(
        f"vpc-flow-log-{environment}",
        log_destination_type="cloud-watch-logs",
        log_group_name=flow_logs_group.name,
        iam_role_arn=flow_logs_role.arn,
        traffic_type="ALL",
        vpc_id=vpc.id,
        tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"vpc-flow-log-{environment}",
        },
    )

    # ---------------------------
    # Outputs
    # ---------------------------
    if export_outputs:
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("vpc_cidr", vpc.cidr_block)
        pulumi.export("public_subnet_ids", [public_subnet_1.id, public_subnet_2.id])
        pulumi.export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
        pulumi.export("public_security_group_id", public_sg.id)
        pulumi.export("private_security_group_id", private_sg.id)
        pulumi.export("internet_gateway_id", igw.id)
        pulumi.export("nat_gateway_id", nat_gateway.id)
        pulumi.export("availability_zones", azs.names)
        pulumi.export("flow_logs_log_group", flow_logs_group.name)
        pulumi.export("flow_logs_role_arn", flow_logs_role.arn)
        pulumi.export("flow_log_id", vpc_flow_log.id)

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": [public_subnet_1, public_subnet_2],
        "private_subnets": [private_subnet_1, private_subnet_2],
        "nat_gateway": nat_gateway,
        "public_sg": public_sg,
        "private_sg": private_sg,
        "flow_logs": {
            "log_group": flow_logs_group,
            "role": flow_logs_role,
            "policy": flow_logs_policy,
            "flow_log": vpc_flow_log,
        },
    }


# Create infrastructure when this file is run directly
if __name__ == "__main__":
    create_infrastructure()

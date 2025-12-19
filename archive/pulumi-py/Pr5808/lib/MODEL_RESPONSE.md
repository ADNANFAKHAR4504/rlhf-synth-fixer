# Pulumi Python VPC Infrastructure for Payment Processing

This implementation creates a production-ready VPC infrastructure with multi-AZ deployment for a payment processing system.

## File: tap.py

```python
import pulumi
import pulumi_aws as aws

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
region = "us-east-1"

# Tags
tags = {
    "Environment": "production",
    "Project": "payment-gateway"
}

# VPC
vpc = aws.ec2.Vpc(
    f"payment-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**tags, "Name": f"payment-vpc-{environment_suffix}"}
)

# Get availability zones
azs = aws.get_availability_zones(state="available")

# Public Subnets
public_subnets = []
for i in range(3):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={**tags, "Name": f"public-subnet-{azs.names[i][-1]}-{environment_suffix}"}
    )
    public_subnets.append(subnet)

# Private Subnets
private_subnets = []
for i in range(3):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{10 + i*2}.0/23",
        availability_zone=azs.names[i],
        tags={**tags, "Name": f"private-subnet-{azs.names[i][-1]}-{environment_suffix}"}
    )
    private_subnets.append(subnet)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"payment-igw-{environment_suffix}"}
)

# Elastic IPs and NAT Gateways
nat_gateways = []
eips = []
for i, subnet in enumerate(public_subnets):
    eip = aws.ec2.Eip(
        f"nat-eip-{i}-{environment_suffix}",
        domain="vpc",
        tags={**tags, "Name": f"nat-eip-{azs.names[i][-1]}-{environment_suffix}"}
    )
    eips.append(eip)

    nat = aws.ec2.NatGateway(
        f"nat-gateway-{i}-{environment_suffix}",
        allocation_id=eip.id,
        subnet_id=subnet.id,
        tags={**tags, "Name": f"nat-gateway-{azs.names[i][-1]}-{environment_suffix}"}
    )
    nat_gateways.append(nat)

# Public Route Table
public_rt = aws.ec2.RouteTable(
    f"public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"public-rt-{environment_suffix}"}
)

# Public Route to Internet Gateway
public_route = aws.ec2.Route(
    f"public-route-{environment_suffix}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate Public Subnets with Public Route Table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{i}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id
    )

# Private Route Tables (one per AZ for NAT Gateway)
for i, subnet in enumerate(private_subnets):
    private_rt = aws.ec2.RouteTable(
        f"private-rt-{i}-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"private-rt-{azs.names[i][-1]}-{environment_suffix}"}
    )

    aws.ec2.Route(
        f"private-route-{i}-{environment_suffix}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateways[i].id
    )

    aws.ec2.RouteTableAssociation(
        f"private-rta-{i}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id
    )

# Network ACL for Public Subnets
public_nacl = aws.ec2.NetworkAcl(
    f"public-nacl-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"public-nacl-{environment_suffix}"}
)

# Inbound rules for HTTP, HTTPS, SSH
aws.ec2.NetworkAclRule(
    f"nacl-http-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=100,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=80,
    to_port=80,
    egress=False
)

aws.ec2.NetworkAclRule(
    f"nacl-https-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=110,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=443,
    to_port=443,
    egress=False
)

aws.ec2.NetworkAclRule(
    f"nacl-ssh-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=120,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=22,
    to_port=22,
    egress=False
)

# Outbound rule - allow all
aws.ec2.NetworkAclRule(
    f"nacl-outbound-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=100,
    protocol="-1",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    egress=True
)

# Associate NACL with public subnets
for i, subnet in enumerate(public_subnets):
    aws.ec2.NetworkAclAssociation(
        f"nacl-assoc-{i}-{environment_suffix}",
        network_acl_id=public_nacl.id,
        subnet_id=subnet.id
    )

# S3 Bucket for VPC Flow Logs
flow_logs_bucket = aws.s3.Bucket(
    f"vpc-flow-logs-{environment_suffix}",
    bucket=f"payment-vpc-flow-logs-{environment_suffix}",
    tags=tags
)

# VPC Flow Logs
flow_log = aws.ec2.FlowLog(
    f"vpc-flow-log-{environment_suffix}",
    vpc_id=vpc.id,
    traffic_type="ALL",
    log_destination_type="s3",
    log_destination=flow_logs_bucket.arn,
    tags=tags
)

# Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [s.id for s in public_subnets])
pulumi.export("private_subnet_ids", [s.id for s in private_subnets])
pulumi.export("nat_gateway_ids", [n.id for n in nat_gateways])
pulumi.export("internet_gateway_id", igw.id)
pulumi.export("flow_logs_bucket", flow_logs_bucket.id)
```

## File: Pulumi.yaml

```yaml
name: payment-vpc
runtime: python
description: Production VPC infrastructure for payment processing
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: .gitignore

```
*.pyc
__pycache__/
venv/
.venv/
*.egg-info/
dist/
build/
.pulumi/
Pulumi.*.yaml
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Destroy infrastructure:
```bash
pulumi destroy
```

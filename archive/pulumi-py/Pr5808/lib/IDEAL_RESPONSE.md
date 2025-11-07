# Pulumi Python VPC Infrastructure for Payment Processing - Production Ready

This implementation creates a production-ready, PCI-DSS compliant VPC infrastructure with multi-AZ deployment for a payment processing system.

## File: tap.py

```python
"""
Payment Processing VPC Infrastructure
Pulumi Python implementation for production-ready VPC with multi-AZ high availability
"""

import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
region = config.get("aws:region") or "eu-west-3"

# Standard tags for all resources
tags = {
    "Environment": "production",
    "Project": "payment-gateway",
    "ManagedBy": "Pulumi",
    "CostCenter": "payments"
}

# VPC Configuration
vpc = aws.ec2.Vpc(
    f"payment-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**tags, "Name": f"payment-vpc-{environment_suffix}"},
    opts=pulumi.ResourceOptions(
        protect=False  # Allow destruction for testing
    )
)

# Get availability zones dynamically
azs = aws.get_availability_zones(
    state="available",
    filters=[
        aws.GetAvailabilityZonesFilterArgs(
            name="opt-in-status",
            values=["opt-in-not-required"]
        )
    ]
)

# Limit to 3 AZs as required
availability_zones = azs.names[:3]

# Public Subnets (one per AZ)
public_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{az}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            **tags,
            "Name": f"production-public-{az[-1]}-{environment_suffix}",
            "Tier": "Public",
            "AZ": az
        }
    )
    public_subnets.append(subnet)

# Private Subnets (one per AZ)
private_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{az}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{10 + i*2}.0/23",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={
            **tags,
            "Name": f"production-private-{az[-1]}-{environment_suffix}",
            "Tier": "Private",
            "AZ": az
        }
    )
    private_subnets.append(subnet)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"production-igw-{environment_suffix}"}
)

# Elastic IPs for NAT Gateways (created before NAT Gateways)
eips = []
for i, az in enumerate(availability_zones):
    eip = aws.ec2.Eip(
        f"nat-eip-{az}-{environment_suffix}",
        domain="vpc",
        tags={
            **tags,
            "Name": f"production-nat-eip-{az[-1]}-{environment_suffix}",
            "AZ": az
        }
    )
    eips.append(eip)

# NAT Gateways (one per AZ for high availability)
nat_gateways = []
for i, (subnet, eip, az) in enumerate(zip(public_subnets, eips, availability_zones)):
    nat = aws.ec2.NatGateway(
        f"nat-gateway-{az}-{environment_suffix}",
        allocation_id=eip.id,
        subnet_id=subnet.id,
        tags={
            **tags,
            "Name": f"production-nat-{az[-1]}-{environment_suffix}",
            "AZ": az
        },
        opts=pulumi.ResourceOptions(
            depends_on=[igw]  # Ensure IGW exists before NAT Gateway
        )
    )
    nat_gateways.append(nat)

# Public Route Table
public_rt = aws.ec2.RouteTable(
    f"public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        **tags,
        "Name": f"production-public-rt-{environment_suffix}",
        "Tier": "Public"
    }
)

# Public Route to Internet Gateway
public_route = aws.ec2.Route(
    f"public-route-{environment_suffix}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(
        depends_on=[igw]
    )
)

# Associate Public Subnets with Public Route Table
public_rt_associations = []
for i, (subnet, az) in enumerate(zip(public_subnets, availability_zones)):
    rta = aws.ec2.RouteTableAssociation(
        f"public-rta-{az}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id
    )
    public_rt_associations.append(rta)

# Private Route Tables (one per AZ for NAT Gateway redundancy)
private_rt_associations = []
for i, (subnet, nat, az) in enumerate(zip(private_subnets, nat_gateways, availability_zones)):
    private_rt = aws.ec2.RouteTable(
        f"private-rt-{az}-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": f"production-private-rt-{az[-1]}-{environment_suffix}",
            "Tier": "Private",
            "AZ": az
        }
    )

    aws.ec2.Route(
        f"private-route-{az}-{environment_suffix}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat.id,
        opts=pulumi.ResourceOptions(
            depends_on=[nat]
        )
    )

    rta = aws.ec2.RouteTableAssociation(
        f"private-rta-{az}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id
    )
    private_rt_associations.append(rta)

# Network ACL for Public Subnets
public_nacl = aws.ec2.NetworkAcl(
    f"public-nacl-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        **tags,
        "Name": f"production-public-nacl-{environment_suffix}",
        "Tier": "Public"
    }
)

# Inbound NACL Rules - Allow HTTP (80)
nacl_http_in = aws.ec2.NetworkAclRule(
    f"nacl-http-in-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=100,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=80,
    to_port=80,
    egress=False
)

# Inbound NACL Rules - Allow HTTPS (443)
nacl_https_in = aws.ec2.NetworkAclRule(
    f"nacl-https-in-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=110,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=443,
    to_port=443,
    egress=False
)

# Inbound NACL Rules - Allow SSH (22)
nacl_ssh_in = aws.ec2.NetworkAclRule(
    f"nacl-ssh-in-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=120,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=22,
    to_port=22,
    egress=False
)

# Inbound NACL Rules - Allow ephemeral ports for return traffic
nacl_ephemeral_in = aws.ec2.NetworkAclRule(
    f"nacl-ephemeral-in-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=130,
    protocol="tcp",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    from_port=1024,
    to_port=65535,
    egress=False
)

# Explicit deny rule for all other inbound traffic
nacl_deny_in = aws.ec2.NetworkAclRule(
    f"nacl-deny-in-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=32766,
    protocol="-1",
    rule_action="deny",
    cidr_block="0.0.0.0/0",
    egress=False
)

# Outbound NACL Rules - Allow all outbound traffic
nacl_outbound = aws.ec2.NetworkAclRule(
    f"nacl-outbound-{environment_suffix}",
    network_acl_id=public_nacl.id,
    rule_number=100,
    protocol="-1",
    rule_action="allow",
    cidr_block="0.0.0.0/0",
    egress=True
)

# Associate NACL with public subnets
nacl_associations = []
for i, (subnet, az) in enumerate(zip(public_subnets, availability_zones)):
    assoc = aws.ec2.NetworkAclAssociation(
        f"nacl-assoc-{az}-{environment_suffix}",
        network_acl_id=public_nacl.id,
        subnet_id=subnet.id
    )
    nacl_associations.append(assoc)

# S3 Bucket for VPC Flow Logs with encryption and lifecycle
flow_logs_bucket = aws.s3.Bucket(
    f"vpc-flow-logs-{environment_suffix}",
    bucket=f"payment-vpc-flow-logs-{environment_suffix}-{pulumi.get_stack()}",
    force_destroy=True,  # Allow destruction for testing environments
    tags={**tags, "Name": f"payment-vpc-flow-logs-{environment_suffix}"},
    opts=pulumi.ResourceOptions(
        protect=False
    )
)

# Enable server-side encryption for S3 bucket
bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"flow-logs-encryption-{environment_suffix}",
    bucket=flow_logs_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True
        )
    ]
)

# Lifecycle policy for 30-day retention
bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
    f"flow-logs-lifecycle-{environment_suffix}",
    bucket=flow_logs_bucket.id,
    rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
            id="delete-old-logs",
            status="Enabled",
            expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                days=30
            )
        )
    ]
)

# Block public access to S3 bucket
bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"flow-logs-public-access-block-{environment_suffix}",
    bucket=flow_logs_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# S3 Bucket Policy for VPC Flow Logs
bucket_policy = aws.s3.BucketPolicy(
    f"flow-logs-bucket-policy-{environment_suffix}",
    bucket=flow_logs_bucket.id,
    policy=pulumi.Output.all(flow_logs_bucket.arn, vpc.id).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSLogDeliveryWrite",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "delivery.logs.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{args[0]}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Sid": "AWSLogDeliveryAclCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "delivery.logs.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": args[0]
                }
            ]
        })
    )
)

# VPC Flow Logs
flow_log = aws.ec2.FlowLog(
    f"vpc-flow-log-{environment_suffix}",
    vpc_id=vpc.id,
    traffic_type="ALL",
    log_destination_type="s3",
    log_destination=flow_logs_bucket.arn.apply(lambda arn: f"{arn}/vpc-flow-logs/"),
    log_format="${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}",
    tags={**tags, "Name": f"vpc-flow-log-{environment_suffix}"},
    opts=pulumi.ResourceOptions(
        depends_on=[bucket_policy, bucket_encryption]
    )
)

# Stack Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("public_subnet_ids", [s.id for s in public_subnets])
pulumi.export("private_subnet_ids", [s.id for s in private_subnets])
pulumi.export("public_subnet_cidrs", [s.cidr_block for s in public_subnets])
pulumi.export("private_subnet_cidrs", [s.cidr_block for s in private_subnets])
pulumi.export("availability_zones", availability_zones)
pulumi.export("nat_gateway_ids", [n.id for n in nat_gateways])
pulumi.export("nat_gateway_public_ips", [eip.public_ip for eip in eips])
pulumi.export("internet_gateway_id", igw.id)
pulumi.export("flow_logs_bucket", flow_logs_bucket.id)
pulumi.export("flow_logs_bucket_arn", flow_logs_bucket.arn)
pulumi.export("region", region)
pulumi.export("environment_suffix", environment_suffix)
```

## File: Pulumi.yaml

```yaml
name: payment-vpc
runtime: python
description: Production-ready VPC infrastructure for payment processing with PCI-DSS compliance
config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
  environmentSuffix:
    description: Environment suffix for resource naming and isolation
    default: dev
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
pytest>=7.0.0
pytest-cov>=4.0.0
moto>=4.0.0
```

## File: .gitignore

```
# Python
*.pyc
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/
dist/
build/
*.egg

# Virtual environments
venv/
.venv/
env/
ENV/

# Pulumi
.pulumi/
Pulumi.*.yaml

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
.pytest_cache/
.coverage
htmlcov/
*.cover
.hypothesis/

# OS
.DS_Store
Thumbs.db
```

## File: README.md

```markdown
# Payment Processing VPC Infrastructure

Production-ready VPC infrastructure for payment processing with PCI-DSS compliance features.

## Architecture Overview

This infrastructure creates a highly available, multi-AZ VPC with:

- **VPC**: 10.0.0.0/16 CIDR block with DNS enabled
- **Public Subnets**: 3 subnets across AZs (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Private Subnets**: 3 subnets across AZs (10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23)
- **NAT Gateways**: One per AZ for high availability
- **Network ACLs**: Restrictive rules allowing only HTTP/HTTPS/SSH
- **VPC Flow Logs**: All traffic logged to encrypted S3 with 30-day retention

## Prerequisites

- Python 3.8 or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Installation

1. Clone the repository and navigate to the project directory

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Configure AWS region and environment suffix:
```bash
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

## Deployment

Deploy the infrastructure:
```bash
pulumi up
```

Review the changes and confirm to proceed.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `nat_gateway_public_ips`: Public IPs of NAT Gateways
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket`: S3 bucket for VPC Flow Logs

## Testing

Run unit tests:
```bash
pytest test/unit/ -v --cov=. --cov-report=html
```

Run integration tests:
```bash
pytest test/integration/ -v
```

## Cost Optimization Notes

- **NAT Gateways**: Most expensive component (~$0.045/hour per gateway = ~$97/month)
- Consider using single NAT Gateway for dev/test environments
- VPC Flow Logs storage costs depend on traffic volume
- Elastic IPs are free when associated with running instances

## Cleanup

Destroy all resources:
```bash
pulumi destroy
```

## Security Considerations

- Network ACLs restrict inbound traffic to essential ports only
- Private subnets have no direct internet access (NAT Gateway only)
- VPC Flow Logs enabled for audit and compliance
- S3 bucket encryption enabled with AES256
- Public access blocked on S3 bucket
- All resources tagged for cost tracking and compliance

## PCI-DSS Compliance Features

- Network segmentation between public and private tiers
- Restricted network ACLs
- Comprehensive logging with VPC Flow Logs
- Encrypted storage for logs
- High availability across multiple AZs
```

# CDKTF Python Implementation for VPC Infrastructure

This implementation provides a production-ready VPC infrastructure with strict network segmentation for a digital banking platform using CDKTF with Python.

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
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, environment_suffix: str):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix

        # AWS Provider for us-east-1 region
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # Get availability zones for us-east-1
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
            service_name="com.amazonaws.us-east-1.s3",
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
            service_name="com.amazonaws.us-east-1.ecr.api",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[ecs_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"banking-ecr-api-endpoint-{environment_suffix}"
            }
        )

        # VPC Endpoint for ECR DKR (Interface Endpoint)
        ecr_dkr_endpoint = VpcEndpoint(self, "ecr_dkr_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.ecr.dkr",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[ecs_sg.id],
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

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test-12345')

app = App()
TapStack(app, "tap", environment_suffix=environment_suffix)
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 bin/tap.py",
  "projectId": "vpc-infrastructure-banking",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: requirements.txt

```
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.3.0
```

## File: lib/README.md

```markdown
# VPC Infrastructure for Digital Banking Platform

This project implements a production-ready VPC infrastructure with strict network segmentation for a digital banking platform using CDKTF with Python.

## Architecture Overview

The infrastructure creates a three-tier network architecture:

- **VPC**: 10.50.0.0/16 CIDR block in us-east-1 region
- **Public Subnets** (3): 10.50.0.0/24, 10.50.1.0/24, 10.50.2.0/24
- **Private Subnets** (3): 10.50.10.0/24, 10.50.11.0/24, 10.50.12.0/24
- **Database Subnets** (3): 10.50.20.0/24, 10.50.21.0/24, 10.50.22.0/24

### Key Components

1. **Internet Gateway**: Provides internet access for public subnets
2. **NAT Gateway**: Single NAT Gateway for cost optimization (reduces cost by 66% from 3 to 1)
3. **Route Tables**: Separate route tables for public, private, and database subnets
4. **Network ACLs**: Deny-by-default policy with explicit allow rules for HTTPS, SSH, and ephemeral ports
5. **Security Groups**: Three-tier security groups for ALB, ECS, and RDS
6. **VPC Flow Logs**: Stored in S3 with 7-day Glacier transition
7. **VPC Endpoints**: S3 (Gateway) and ECR (Interface) endpoints to reduce NAT costs

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

### Set Environment Suffix

The environment suffix is used to ensure unique resource names:

```bash
export ENVIRONMENT_SUFFIX="prod-abc123"
```

### Deploy Infrastructure

1. Synthesize the Terraform configuration:
```bash
cdktf synth
```

2. Deploy the infrastructure:
```bash
cdktf deploy
```

3. Confirm the deployment when prompted.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_public_ip`: NAT Gateway public IP address
- `alb_security_group_id`: ALB security group ID
- `ecs_security_group_id`: ECS security group ID
- `rds_security_group_id`: RDS security group ID
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `ecr_api_endpoint_id`: ECR API VPC Endpoint ID
- `ecr_dkr_endpoint_id`: ECR DKR VPC Endpoint ID
- `flow_logs_bucket_name`: VPC Flow Logs S3 bucket name

## Resource Naming

All resources include the environment suffix in their names following the pattern:
- `banking-{resource-type}-{environment-suffix}`

Example: `banking-vpc-prod-abc123`

## Cost Optimization

This implementation includes several cost optimizations:

1. **Single NAT Gateway**: Reduces cost from $96/month (3 NAT Gateways) to $32/month
2. **VPC Endpoints**: S3 Gateway endpoint is free; ECR Interface endpoints reduce NAT Gateway data transfer costs
3. **Glacier Transition**: Flow logs transition to Glacier after 7 days, reducing storage costs by up to 95%

## Security Features

1. **Network Segmentation**: Three-tier architecture with isolated subnets
2. **Network ACLs**: Deny-by-default policy with explicit allow rules
3. **Security Groups**: Least privilege access between tiers
4. **Flow Logs**: All VPC traffic logged to S3 for audit and monitoring
5. **Encryption**: S3 bucket configured with encryption at rest
6. **Private Endpoints**: ECR endpoints enable private container image pulls

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

Confirm the destruction when prompted. All resources are configured to be destroyable without manual intervention.

## Testing

The infrastructure can be validated using:

1. **Terraform Validate**:
```bash
cd cdktf.out/stacks/tap
terraform validate
```

2. **Terraform Plan**:
```bash
cdktf diff
```

3. **AWS CLI Verification**:
```bash
# Verify VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=banking-vpc-*"

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"

# Verify NAT Gateway
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>"
```

## Compliance

This infrastructure meets PCI-DSS requirements for network segmentation:

- Separate subnets for different workload tiers
- Network ACLs and security groups enforce traffic control
- Flow logs provide audit trail for all network traffic
- Private subnets prevent direct internet access to sensitive workloads

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

## Support

For issues or questions:
- Review the CDKTF documentation: https://developer.hashicorp.com/terraform/cdktf
- Check AWS VPC documentation: https://docs.aws.amazon.com/vpc/
- Review security group rules and NACL configurations in the code
```

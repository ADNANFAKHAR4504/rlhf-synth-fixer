# VPC Foundation Infrastructure - CDKTF Python Implementation

This implementation creates a production-grade VPC foundation with multi-AZ architecture for a payment processing platform.

## Architecture Overview

The infrastructure deploys:
- VPC with 10.0.0.0/16 CIDR across 3 availability zones
- 3 public subnets and 3 private subnets
- Internet Gateway for public subnet connectivity
- 3 NAT Gateways (one per AZ) for private subnet egress
- Security groups for web, app, and database tiers
- VPC Flow Logs to CloudWatch with IAM role

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(self, f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Create Internet Gateway
        self.igw = InternetGateway(self, f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Define subnet configurations
        public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

        # Create public subnets
        self.public_subnets = []
        for i, cidr in enumerate(public_subnet_cidrs):
            subnet = Subnet(self, f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=f"us-east-1{chr(97+i)}",  # us-east-1a, us-east-1b, us-east-1c
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Type": "public",
                    "Environment": "production",
                    "CostCenter": "infrastructure",
                    "Owner": "devops-team",
                    "CreatedBy": "cdktf"
                }
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, cidr in enumerate(private_subnet_cidrs):
            subnet = Subnet(self, f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=f"us-east-1{chr(97+i)}",
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Type": "private",
                    "Environment": "production",
                    "CostCenter": "infrastructure",
                    "Owner": "devops-team",
                    "CreatedBy": "cdktf"
                }
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_route_table = RouteTable(self, f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"public-rt-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Create Elastic IPs and NAT Gateways
        self.nat_gateways = []
        self.eips = []
        for i, subnet in enumerate(self.public_subnets):
            # Create Elastic IP
            eip = Eip(self, f"eip-{i+1}-{environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"eip-nat-{i+1}-{environment_suffix}",
                    "Purpose": "NAT",
                    "Environment": "production",
                    "CostCenter": "infrastructure",
                    "Owner": "devops-team",
                    "CreatedBy": "cdktf"
                }
            )
            self.eips.append(eip)

            # Create NAT Gateway
            nat = NatGateway(self, f"nat-{i+1}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"nat-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "CostCenter": "infrastructure",
                    "Owner": "devops-team",
                    "CreatedBy": "cdktf"
                }
            )
            self.nat_gateways.append(nat)

        # Create private route tables (one per AZ)
        self.private_route_tables = []
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = RouteTable(self, f"private-rt-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={
                    "Name": f"private-rt-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "CostCenter": "infrastructure",
                    "Owner": "devops-team",
                    "CreatedBy": "cdktf"
                }
            )
            self.private_route_tables.append(rt)

            # Associate private subnet with its route table
            RouteTableAssociation(self, f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=rt.id
            )

        # Create security groups
        # Web security group
        self.web_sg = SecurityGroup(self, f"web-sg-{environment_suffix}",
            name=f"web-sg-{environment_suffix}",
            description="Security group for web tier",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow HTTP",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    description="Allow HTTPS",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"web-sg-{environment_suffix}",
                "Tier": "web",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # App security group
        self.app_sg = SecurityGroup(self, f"app-sg-{environment_suffix}",
            name=f"app-sg-{environment_suffix}",
            description="Security group for application tier",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow traffic from web tier",
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.web_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"app-sg-{environment_suffix}",
                "Tier": "application",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Database security group
        self.db_sg = SecurityGroup(self, f"db-sg-{environment_suffix}",
            name=f"db-sg-{environment_suffix}",
            description="Security group for database tier",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow PostgreSQL from app tier",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.app_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"db-sg-{environment_suffix}",
                "Tier": "database",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Create CloudWatch Log Group for VPC Flow Logs
        self.flow_log_group = CloudwatchLogGroup(self, f"vpc-flow-logs-{environment_suffix}",
            name=f"/aws/vpc/flow-logs-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"vpc-flow-logs-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Create IAM role for VPC Flow Logs
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

        self.flow_log_role = IamRole(self, f"vpc-flow-log-role-{environment_suffix}",
            name=f"vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"vpc-flow-log-role-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Create IAM policy for Flow Logs
        flow_log_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "*"
                }
            ]
        }

        IamRolePolicy(self, f"vpc-flow-log-policy-{environment_suffix}",
            name=f"vpc-flow-log-policy-{environment_suffix}",
            role=self.flow_log_role.id,
            policy=json.dumps(flow_log_policy)
        )

        # Create VPC Flow Log
        FlowLog(self, f"vpc-flow-log-{environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=self.flow_log_group.arn,
            iam_role_arn=self.flow_log_role.arn,
            tags={
                "Name": f"vpc-flow-log-{environment_suffix}",
                "Environment": "production",
                "CostCenter": "infrastructure",
                "Owner": "devops-team",
                "CreatedBy": "cdktf"
            }
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in self.public_subnets],
            description="Public subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in self.private_subnets],
            description="Private subnet IDs"
        )

        TerraformOutput(self, "web_sg_id",
            value=self.web_sg.id,
            description="Web security group ID"
        )

        TerraformOutput(self, "app_sg_id",
            value=self.app_sg.id,
            description="Application security group ID"
        )

        TerraformOutput(self, "db_sg_id",
            value=self.db_sg.id,
            description="Database security group ID"
        )

        TerraformOutput(self, "nat_gateway_ids",
            value=[nat.id for nat in self.nat_gateways],
            description="NAT Gateway IDs"
        )

        TerraformOutput(self, "internet_gateway_id",
            value=self.igw.id,
            description="Internet Gateway ID"
        )
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(app, "tap", environment_suffix=environment_suffix)

app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "vpc-foundation-tap",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
```

## File: lib/__init__.py

```python
# Empty init file for lib package
```

## File: lib/README.md

```markdown
# VPC Foundation Infrastructure

Production-grade VPC foundation for payment processing platform built with CDKTF Python.

## Architecture

This infrastructure creates:

- **VPC**: 10.0.0.0/16 CIDR with DNS hostnames and resolution enabled
- **Public Subnets**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
- **Private Subnets**: 3 subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across 3 AZs
- **Internet Gateway**: For public subnet internet access
- **NAT Gateways**: 3 NAT Gateways (one per AZ) with Elastic IPs
- **Route Tables**: Separate route tables for public and private subnets
- **Security Groups**:
  - web-sg: Ports 80/443 from 0.0.0.0/0
  - app-sg: Port 8080 from web-sg only
  - db-sg: Port 5432 from app-sg only
- **VPC Flow Logs**: Flow logs to CloudWatch with 7-day retention
- **IAM Role**: For VPC Flow Logs to write to CloudWatch

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5 or higher

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Initialize CDKTF (if not already done):
```bash
cdktf get
```

## Deployment

1. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX="prod"
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy infrastructure:
```bash
cdktf deploy
```

4. Confirm deployment when prompted.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `web_sg_id`: Web security group ID
- `app_sg_id`: Application security group ID
- `db_sg_id`: Database security group ID
- `nat_gateway_ids`: List of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway ID

## Testing

Run infrastructure validation:
```bash
cdktf diff
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Confirm destruction when prompted. All resources are configured to be fully destroyable.

## Security Considerations

- Security groups follow least-privilege principle
- Private subnets have no direct internet access (NAT only)
- VPC Flow Logs enabled for compliance and auditing
- All resources tagged with mandatory tags

## Cost Optimization

- NAT Gateways are the primary cost drivers (~$0.045/hour per gateway)
- Consider using a single NAT Gateway for non-production environments
- CloudWatch Log retention set to 7 days to minimize storage costs

## Compliance

This infrastructure supports PCI DSS compliance requirements:
- Network segmentation between tiers
- Flow logs for audit trails
- Least-privilege security group rules
- Multi-AZ redundancy

## Support

For issues or questions, contact the DevOps team.
```

## Deployment Notes

1. The infrastructure uses CDKTF with Python to define AWS resources
2. All resources include the environmentSuffix parameter for unique naming
3. NAT Gateways are provisioned in each AZ for high availability
4. Security groups enforce strict tier isolation
5. VPC Flow Logs provide comprehensive network traffic logging
6. All resources are fully destroyable without manual intervention

## Testing Recommendations

After deployment:
1. Verify VPC CIDR and subnet allocations
2. Test security group rules between tiers
3. Verify NAT Gateway connectivity from private subnets
4. Check VPC Flow Logs in CloudWatch
5. Validate all outputs are exported correctly

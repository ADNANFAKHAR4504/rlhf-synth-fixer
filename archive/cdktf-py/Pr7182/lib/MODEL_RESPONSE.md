# CDKTF Python Implementation - Financial Services VPC Infrastructure

This implementation provides a production-ready VPC infrastructure for financial services using CDKTF with Python, deployed across 3 availability zones in eu-west-1.

## File: main.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule, S3BucketLifecycleConfigurationRuleTransition
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl, NetworkAclEgress, NetworkAclIngress
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock


class VpcStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str = "prod"):
        super().__init__(scope, id)

        # AWS Provider configuration for eu-west-1
        AwsProvider(self, "AWS",
            region="eu-west-1"
        )

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DigitalBanking",
            "ManagedBy": "CDKTF"
        }

        # Define availability zones for eu-west-1
        availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

        # Create VPC with DNS support
        vpc = Vpc(self, f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(self, f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"igw-{environment_suffix}"
            }
        )

        # Create S3 bucket for VPC Flow Logs
        flow_logs_bucket = S3Bucket(self, f"flow-logs-bucket-{environment_suffix}",
            bucket=f"vpc-flow-logs-{environment_suffix}-{id}",
            force_destroy=True,
            tags={
                **common_tags,
                "Name": f"flow-logs-bucket-{environment_suffix}"
            }
        )

        # Enable versioning on S3 bucket
        S3BucketVersioningA(self, f"flow-logs-versioning-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Block public access to S3 bucket
        S3BucketPublicAccessBlock(self, f"flow-logs-public-block-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Configure S3 lifecycle policy for Glacier transition after 30 days
        S3BucketLifecycleConfiguration(self, f"flow-logs-lifecycle-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-glacier",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=30,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # Enable VPC Flow Logs to S3
        FlowLog(self, f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={
                **common_tags,
                "Name": f"vpc-flow-log-{environment_suffix}"
            }
        )

        # Create subnets (public and private) across 3 AZs
        public_subnets = []
        private_subnets = []

        for i, az in enumerate(availability_zones):
            # Public subnet in each AZ (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
            public_subnet = Subnet(self, f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public"
                }
            )
            public_subnets.append(public_subnet)

            # Private subnet in each AZ (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
            private_subnet = Subnet(self, f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private"
                }
            )
            private_subnets.append(private_subnet)

        # Create NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        nat_gateway_ips = []

        for i, public_subnet in enumerate(public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = Eip(self, f"nat-eip-{i+1}-{environment_suffix}",
                domain="vpc",
                tags={
                    **common_tags,
                    "Name": f"nat-eip-{i+1}-{environment_suffix}"
                }
            )
            nat_gateway_ips.append(eip.public_ip)

            # Create NAT Gateway in public subnet
            nat = NatGateway(self, f"nat-gateway-{i+1}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **common_tags,
                    "Name": f"nat-gateway-{i+1}-{environment_suffix}"
                }
            )
            nat_gateways.append(nat)

        # Create public route table
        public_route_table = RouteTable(self, f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"public-rt-{environment_suffix}"
            }
        )

        # Route to Internet Gateway for public subnets
        Route(self, f"public-route-{environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with public route table
        for i, public_subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=public_subnet.id,
                route_table_id=public_route_table.id
            )

        # Create private route tables (one per AZ with NAT Gateway)
        for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
            private_route_table = RouteTable(self, f"private-rt-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    **common_tags,
                    "Name": f"private-rt-{i+1}-{environment_suffix}"
                }
            )

            # Route to NAT Gateway for private subnet
            Route(self, f"private-route-{i+1}-{environment_suffix}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )

            # Associate private subnet with private route table
            RouteTableAssociation(self, f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_route_table.id
            )

        # Create custom Network ACL with deny-all baseline
        network_acl = NetworkAcl(self, f"nacl-{environment_suffix}",
            vpc_id=vpc.id,
            subnet_ids=[s.id for s in public_subnets + private_subnets],
            # Deny all inbound traffic by default
            ingress=[
                NetworkAclIngress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            # Deny all outbound traffic by default
            egress=[
                NetworkAclEgress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            tags={
                **common_tags,
                "Name": f"nacl-{environment_suffix}",
                "Note": "Baseline deny-all NACL - exceptions must be documented"
            }
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="The ID of the VPC"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="List of public subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="List of private subnet IDs"
        )

        TerraformOutput(self, "nat_gateway_ips",
            value=nat_gateway_ips,
            description="List of NAT Gateway public IP addresses"
        )

        TerraformOutput(self, "flow_logs_bucket",
            value=flow_logs_bucket.bucket,
            description="S3 bucket name for VPC Flow Logs"
        )


app = App()
VpcStack(app, "financial-vpc", environment_suffix="prod")
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "financial-vpc-infrastructure",
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

## File: .gitignore

```
# CDKTF files
cdktf.out/
.terraform/
.gen/
*.tfstate
*.tfstate.*
terraform.*.tfplan
terraform.tfvars
*.log

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
ENV/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

## File: lib/README.md

```markdown
# Financial Services VPC Infrastructure - CDKTF Python

This project deploys a production-ready VPC infrastructure for a financial services digital banking platform using CDKTF with Python.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with CIDR 10.0.0.0/16 in eu-west-1 region
- **Subnets**: 6 subnets across 3 availability zones (1 public + 1 private per AZ)
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: 3 NAT Gateways (one per AZ) for high availability
- **Route Tables**: Separate route tables for public and private subnets
- **VPC Flow Logs**: All network traffic logged to S3 with 30-day Glacier transition
- **Network ACLs**: Custom deny-all baseline for enhanced security
- **S3 Bucket**: Versioned bucket for flow logs storage

### Subnet Layout

| Subnet Type | AZ | CIDR Block | Purpose |
|-------------|-----|------------|---------|
| Public 1 | eu-west-1a | 10.0.0.0/24 | Load balancers, bastion hosts |
| Public 2 | eu-west-1b | 10.0.1.0/24 | Load balancers, bastion hosts |
| Public 3 | eu-west-1c | 10.0.2.0/24 | Load balancers, bastion hosts |
| Private 1 | eu-west-1a | 10.0.10.0/24 | Application tier |
| Private 2 | eu-west-1b | 10.0.11.0/24 | Application tier |
| Private 3 | eu-west-1c | 10.0.12.0/24 | Application tier |

## Prerequisites

- Python 3.8 or higher
- Node.js 16+ (required by CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`

## AWS Permissions Required

The AWS credentials must have permissions for:

- VPC and subnet management
- Internet Gateway and NAT Gateway creation
- Route table management
- Elastic IP allocation
- S3 bucket creation and configuration
- VPC Flow Logs configuration
- Network ACL management

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Initialize CDKTF providers:

```bash
cdktf get
```

## Configuration

The infrastructure is configured with:

- **Region**: eu-west-1 (Ireland)
- **Environment Suffix**: "prod" (can be customized)
- **VPC CIDR**: 10.0.0.0/16
- **Availability Zones**: eu-west-1a, eu-west-1b, eu-west-1c

To use a different environment suffix, modify the `VpcStack` instantiation in `main.py`:

```python
VpcStack(app, "financial-vpc", environment_suffix="staging")
```

## Deployment

1. Synthesize the Terraform configuration:

```bash
cdktf synth
```

This generates Terraform JSON configuration in the `cdktf.out` directory.

2. Deploy the infrastructure:

```bash
cdktf deploy
```

You will be prompted to approve the changes before deployment proceeds.

3. View outputs after deployment:

```bash
cdktf output
```

## Outputs

The stack provides the following outputs:

- **vpc_id**: The VPC identifier
- **public_subnet_ids**: Array of public subnet IDs
- **private_subnet_ids**: Array of private subnet IDs
- **nat_gateway_ips**: Array of NAT Gateway public IP addresses
- **flow_logs_bucket**: S3 bucket name containing VPC Flow Logs

## Testing

### Manual Verification

1. Verify VPC creation:

```bash
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-prod" --region eu-west-1
```

2. Check subnet distribution:

```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>" --region eu-west-1
```

3. Verify NAT Gateways are running:

```bash
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>" --region eu-west-1
```

4. Check VPC Flow Logs:

```bash
aws ec2 describe-flow-logs --filter "Name=resource-id,Values=<vpc-id>" --region eu-west-1
```

5. Verify S3 bucket and lifecycle policy:

```bash
aws s3api get-bucket-versioning --bucket vpc-flow-logs-prod-financial-vpc
aws s3api get-bucket-lifecycle-configuration --bucket vpc-flow-logs-prod-financial-vpc
```

### Connectivity Testing

1. Launch an EC2 instance in a private subnet
2. Verify it can reach the internet through the NAT Gateway:

```bash
# From the instance
curl -I https://www.google.com
```

3. Verify flow logs are being generated in S3

## Security Considerations

- **Network ACLs**: Default deny-all baseline implemented. Modify `NetworkAcl` configuration to add specific allow rules based on your application requirements.
- **Flow Logs**: All network traffic is logged for audit and compliance purposes.
- **Private Subnets**: Application tier resources have no direct internet access; all outbound traffic routes through NAT Gateways.
- **S3 Bucket**: Public access is blocked on the flow logs bucket.

## Cost Optimization

The infrastructure includes several cost considerations:

- **NAT Gateways**: Most expensive component (~$0.045/hour per gateway + data transfer). Consider using a single NAT Gateway in non-production environments.
- **S3 Glacier Transition**: Flow logs automatically transition to Glacier after 30 days to reduce storage costs.
- **Elastic IPs**: Charged when not associated with a running instance (handled by NAT Gateway association).

## Cleanup

To destroy all infrastructure:

```bash
cdktf destroy
```

Confirm the destruction when prompted. All resources including the S3 bucket will be removed (force_destroy is enabled).

## Troubleshooting

### Provider Download Issues

If CDKTF fails to download providers, manually initialize:

```bash
cdktf get
```

### Terraform State Conflicts

If multiple team members are deploying, consider using remote state:

```python
# Add to VpcStack.__init__
from cdktf import S3Backend

S3Backend(self,
    bucket="your-terraform-state-bucket",
    key="financial-vpc/terraform.tfstate",
    region="eu-west-1"
)
```

### NAT Gateway Creation Timeout

NAT Gateways can take several minutes to provision. If deployment times out, increase the timeout or retry.

## Compliance and Audit

- **VPC Flow Logs**: Retained in S3 with versioning for audit trail
- **Tagging**: All resources tagged with Environment=Production and Project=DigitalBanking
- **Network Isolation**: Private subnets have no direct internet access
- **Immutable Infrastructure**: All resources can be destroyed and recreated

## Future Enhancements

- Add VPC endpoints for S3 and other AWS services to reduce NAT Gateway costs
- Implement Transit Gateway for multi-VPC connectivity
- Add AWS Config rules for continuous compliance monitoring
- Implement additional Network ACL rules based on application requirements
- Add CloudWatch alarms for NAT Gateway metrics
- Implement VPC peering or PrivateLink for cross-VPC communication

## Support

For issues or questions:

1. Review AWS VPC documentation
2. Check CDKTF Python provider documentation
3. Review Terraform AWS provider documentation
4. Consult with the infrastructure team

## License

Internal use only - Financial Services Digital Banking Platform
```

## Implementation Notes

### Key Design Decisions

1. **High Availability**: NAT Gateways deployed one per AZ to eliminate single points of failure
2. **Security**: Network ACLs configured with deny-all baseline as required
3. **Compliance**: VPC Flow Logs capture ALL traffic types for complete audit trail
4. **Cost Optimization**: S3 lifecycle policy transitions logs to Glacier after 30 days
5. **Naming Convention**: All resources include environment_suffix parameter for multi-environment support
6. **Destroyability**: S3 bucket configured with force_destroy=True for clean teardown

### CDKTF Python Specifics

- Uses official AWS provider for CDKTF (`cdktf-cdktf-provider-aws`)
- All resource names include environment suffix for uniqueness
- Explicit route table associations for all subnets (no main route table reliance)
- Common tags applied consistently across all resources
- TerraformOutput used for all required outputs

### AWS Services Used

- Amazon VPC
- EC2 Subnets
- Internet Gateway
- NAT Gateway
- Elastic IP
- Route Tables
- VPC Flow Logs
- S3 (with versioning and lifecycle policies)
- Network ACLs

### Testing Recommendations

1. Validate VPC and subnet creation in AWS Console
2. Verify NAT Gateway high availability across AZs
3. Check route table associations for all subnets
4. Confirm VPC Flow Logs are writing to S3
5. Validate S3 lifecycle policy configuration
6. Test internet connectivity from private subnet instances
7. Verify Network ACL deny-all baseline is active

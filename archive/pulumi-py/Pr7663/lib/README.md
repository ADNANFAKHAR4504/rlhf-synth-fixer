
This Pulumi Python project deploys a secure multi-VPC network architecture for a fintech payment platform with Transit Gateway connectivity and centralized NAT egress.

## Architecture Overview

This infrastructure creates:

- Two VPCs (dev and prod) with isolated networks
- 3 public and 3 private subnets per VPC across 3 availability zones
- AWS Transit Gateway connecting both VPCs for selective inter-VPC communication
- Single NAT instance (t3.micro) in dev VPC for centralized internet egress
- Security groups allowing HTTPS (443) and SSH (22) from specific CIDR ranges
- VPC Flow Logs with CloudWatch Logs integration (7-day retention)
- IAM roles and policies for Flow Logs service
- Comprehensive resource tagging for management and cost tracking

## Key Features

- Network isolation between dev and prod environments
- Transit Gateway enables communication on ports 443 (HTTPS) and 5432 (PostgreSQL) between VPCs
- Cost-optimized single NAT instance instead of multiple NAT Gateways
- All private subnet traffic routes through centralized NAT for compliance auditing
- Flow logs capture all network traffic for security analysis
- Resources span 3 availability zones for high availability
- All resources include environmentSuffix for deployment isolation

## Prerequisites

- Python 3.9 or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, EC2, CloudWatch, IAM resources

## Installation

1. Create and activate virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Set required configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set pulumi-infra:environmentSuffix your-suffix
pulumi config set pulumi-infra:availabilityZones us-east-1a,us-east-1b,us-east-1c
```

The environmentSuffix is required and ensures unique resource names across deployments.

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the preview and confirm to create resources.

## Outputs

After deployment, the following outputs are available:

- dev_vpc_id: ID of the development VPC
- prod_vpc_id: ID of the production VPC
- dev_public_subnet_ids: List of public subnet IDs in dev VPC
- dev_private_subnet_ids: List of private subnet IDs in dev VPC
- prod_public_subnet_ids: List of public subnet IDs in prod VPC
- prod_private_subnet_ids: List of private subnet IDs in prod VPC
- transit_gateway_id: ID of the Transit Gateway
- transit_gateway_route_table_id: ID of the Transit Gateway route table
- nat_instance_id: ID of the NAT instance
- nat_instance_private_ip: Private IP of the NAT instance
- dev_security_group_id: ID of dev security group
- prod_security_group_id: ID of prod security group
- dev_flow_log_id: ID of dev VPC flow log
- prod_flow_log_id: ID of prod VPC flow log
- dev_log_group_name: Name of dev CloudWatch log group
- prod_log_group_name: Name of prod CloudWatch log group

View outputs:

```bash
pulumi stack output
```

## Testing

Run unit tests:

```bash
pytest tests/test_tap_stack.py -v
```

Run integration tests (requires deployed infrastructure):

```bash
pytest tests/test_integration.py -v
```

Run tests with coverage:

```bash
pytest tests/ --cov=lib --cov-report=term --cov-report=json
```

## Resource Cleanup

Destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be permanently deleted.

## Cost Considerations

- NAT instance (t3.micro): Approximately $0.01/hour
- Transit Gateway: $0.05/hour plus data processing charges
- VPC Flow Logs: CloudWatch Logs storage charges based on volume
- EC2 instances: Standard EC2 pricing for NAT instance

Estimated monthly cost: $40-60 depending on traffic volume.

## Security

- Security groups restrict access to HTTPS (443) and SSH (22) from 192.168.1.0/24 only
- Transit Gateway allows only ports 443 and 5432 between VPCs
- VPC Flow Logs enabled for audit compliance
- All egress traffic routed through single NAT instance for centralized logging
- IAM roles follow least privilege principle

## Network Design

- Dev VPC: 10.1.0.0/16
- Prod VPC: 10.2.0.0/16
- Public subnets: /20 CIDRs in each AZ
- Private subnets: /20 CIDRs in each AZ
- Non-overlapping CIDR ranges enable Transit Gateway routing
- Private subnets route internet traffic through NAT instance
- Inter-VPC traffic routes through Transit Gateway

## Troubleshooting

If deployment fails:

1. Check AWS credentials and permissions
2. Verify availability zones are valid for your region
3. Ensure environmentSuffix is set and unique
4. Check AWS service limits for VPCs, Transit Gateways, EC2 instances
5. Review Pulumi logs for specific error messages

## Support

For issues or questions, refer to:
- Pulumi documentation: https://www.pulumi.com/docs/
- AWS VPC documentation: https://docs.aws.amazon.com/vpc/
- AWS Transit Gateway documentation: https://docs.aws.amazon.com/vpc/latest/tgw/

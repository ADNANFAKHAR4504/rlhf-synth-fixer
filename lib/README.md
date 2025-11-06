# Multi-Tier VPC Infrastructure

Production-grade multi-tier VPC infrastructure for payment processing platform built with AWS CDK and Python.

## Architecture

This infrastructure creates a highly available VPC spanning 3 availability zones with three distinct subnet tiers:

- **Public Subnets**: For load balancers and bastion hosts (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Private Application Subnets**: For application workloads (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- **Private Database Subnets**: For database instances (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)

### Key Features

- 3 NAT Gateways (one per AZ) for high availability
- VPC Flow Logs to CloudWatch for network monitoring
- Proper tagging for compliance and cost tracking
- Environment-specific resource naming using suffix pattern

## Prerequisites

- Python 3.8 or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS CLI configured with appropriate credentials
- Node.js 14.x or later

## Installation

1. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Deployment

1. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

2. Deploy the infrastructure:
```bash
# Deploy with default environment suffix (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

3. View the synthesized CloudFormation template:
```bash
cdk synth
```

## Configuration

The infrastructure can be customized using CDK context variables:

- `environmentSuffix`: Suffix for resource naming (default: "dev")

Example:
```bash
cdk deploy -c environmentSuffix=staging
```

## Outputs

After deployment, the stack provides the following outputs:

- VPC ID
- Public Subnet IDs (3)
- Private Application Subnet IDs (3)
- Private Database Subnet IDs (3)

These outputs are exported and can be referenced by other stacks.

## Testing

Run unit tests:
```bash
pytest tests/unit/ -v
```

Run integration tests:
```bash
pytest tests/integration/ -v
```

Run all tests with coverage:
```bash
pytest --cov=lib --cov-report=term-missing
```

## Cleanup

To destroy the infrastructure:
```bash
cdk destroy
```

## Cost Considerations

This infrastructure includes:
- 3 NAT Gateways (significant cost component ~$0.045/hour each)
- VPC Flow Logs storage in CloudWatch
- Data transfer costs for NAT Gateway traffic

Estimated monthly cost: ~$100-150 USD (excluding data transfer)

## Security

- Private subnets have no direct internet access
- All network traffic is logged via VPC Flow Logs
- Database tier is completely isolated from internet
- Proper IAM roles for Flow Logs service

## Known Issues

1. ISSUE 1: DOCUMENTATION LOCATION - This README should be at root level, not in lib/
2. ISSUE 2: AZ SPECIFICATION - Stack uses max_azs which may not guarantee exactly 3 AZs
3. ISSUE 3: FLOW LOG INTERVAL - Setting max_aggregation_interval to 300 is invalid (AWS supports only 60 or 600)

## Support

For issues or questions, please contact the infrastructure team.

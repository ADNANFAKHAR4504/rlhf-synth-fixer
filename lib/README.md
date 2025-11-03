# VPC Infrastructure with CDKTF Python

This project implements a production-ready custom VPC architecture on AWS using CDKTF (Cloud Development Kit for Terraform) with Python.

## Architecture Overview

The infrastructure creates a fully-functional VPC environment with:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Subnets**: 4 subnets across 2 availability zones (ca-central-1a and ca-central-1b)
  - 2 Public subnets: 10.0.1.0/24, 10.0.2.0/24
  - 2 Private subnets: 10.0.11.0/24, 10.0.12.0/24
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: Single instance in first public subnet for cost optimization
- **Route Tables**: Custom public and private route tables with appropriate routing
- **VPC Flow Logs**: CloudWatch Logs integration with 5-minute capture intervals
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB
- **IAM**: Roles and policies for VPC Flow Logs

## Key Features

### Cost Optimization
- Single NAT Gateway instead of one per AZ reduces monthly costs
- Gateway VPC Endpoints for S3 and DynamoDB avoid data transfer charges

### Security
- Private subnet isolation via NAT Gateway
- VPC Flow Logs enabled for network monitoring
- All resources tagged for compliance tracking

### High Availability
- Resources deployed across 2 availability zones
- Public and private subnet pairs for workload distribution

## Prerequisites

- Python 3.9 or higher
- Node.js 18+ (required for CDKTF)
- Terraform CLI
- AWS CLI configured with appropriate credentials
- Pipenv for Python dependency management

## Installation

1. Install dependencies:
```bash
pipenv install
```

2. Install CDKTF providers:
```bash
pipenv run cdktf get
```

## Configuration

The stack accepts the following configuration parameters:

- `environment_suffix`: Unique identifier for the environment (default: "dev")
- `aws_region`: AWS region for deployment (default: "ca-central-1")
- `state_bucket`: S3 bucket for Terraform state (default: "iac-rlhf-tf-states")
- `state_bucket_region`: Region for state bucket (default: "us-east-1")
- `default_tags`: Tags applied to all resources

Environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ca-central-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export REPOSITORY="your-repo-name"
export COMMIT_AUTHOR="your-name"
```

## Deployment

### Synthesize Terraform Configuration

Generate Terraform JSON configuration:
```bash
pipenv run cdktf synth
```

### Deploy Infrastructure

Deploy the stack to AWS:
```bash
pipenv run cdktf deploy
```

The deployment will:
1. Create the VPC and subnets
2. Set up Internet Gateway and NAT Gateway
3. Configure route tables and associations
4. Enable VPC Flow Logs
5. Create VPC endpoints for S3 and DynamoDB
6. Output resource IDs for reference

### View Outputs

After deployment, outputs will be available in `cfn-outputs/flat-outputs.json`:
- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_1_id`: First public subnet ID
- `public_subnet_2_id`: Second public subnet ID
- `private_subnet_1_id`: First private subnet ID
- `private_subnet_2_id`: Second private subnet ID
- `nat_gateway_id`: NAT Gateway identifier
- `internet_gateway_id`: Internet Gateway identifier
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `dynamodb_endpoint_id`: DynamoDB VPC Endpoint ID
- `flow_log_id`: CloudWatch Log Group name

## Testing

### Unit Tests

Run unit tests to validate infrastructure configuration:
```bash
pipenv run pytest lib/tests/unit/ -v
```

Unit tests verify:
- VPC configuration (CIDR, DNS settings)
- Subnet creation and CIDR blocks
- Availability zone distribution
- Route table configuration
- NAT Gateway setup
- VPC Flow Logs configuration
- VPC Endpoints setup
- Resource tagging consistency
- Output definitions

### Integration Tests

Run integration tests against deployed infrastructure:
```bash
pipenv run pytest lib/tests/integration/ -v
```

Integration tests verify:
- VPC exists and is available
- All subnets are deployed correctly
- Internet Gateway is attached
- NAT Gateway is operational
- Route tables have correct routes
- VPC Flow Logs are enabled
- CloudWatch Log Group exists
- VPC Endpoints are available
- Network connectivity is configured
- Tags are applied consistently

## Resource Naming

All resources include the `environmentSuffix` in their names for uniqueness:
- VPC: `vpc-{environmentSuffix}`
- Subnets: `public-subnet-{1|2}-{environmentSuffix}`, `private-subnet-{1|2}-{environmentSuffix}`
- NAT Gateway: `nat-gateway-{environmentSuffix}`
- Route Tables: `public-rt-{environmentSuffix}`, `private-rt-{environmentSuffix}`
- VPC Endpoints: `s3-endpoint-{environmentSuffix}`, `dynamodb-endpoint-{environmentSuffix}`

## Tagging Strategy

All resources are tagged with:
- `Environment`: "development"
- `CostCenter`: "engineering"
- `Name`: Resource-specific name with environment suffix

Additional tags from `default_tags`:
- `Repository`: Git repository name
- `Author`: Commit author

## Cleanup

Destroy all infrastructure resources:
```bash
pipenv run cdktf destroy
```

**Warning**: This will delete all resources including the VPC, subnets, NAT Gateway, and VPC endpoints. Ensure no other resources are using this VPC before destroying.

## Cost Considerations

### Ongoing Costs
- **NAT Gateway**: ~$0.045/hour + data processing charges (~$32/month)
- **VPC Flow Logs**: CloudWatch Logs storage and ingestion charges (minimal)
- **Elastic IP**: Free while attached to NAT Gateway

### Cost Optimization
- Single NAT Gateway instead of multiple reduces costs by 50%
- Gateway VPC Endpoints for S3 and DynamoDB are free
- CloudWatch Log retention set to 7 days to minimize storage costs

## Troubleshooting

### Deployment Fails
- Ensure AWS credentials are configured correctly
- Verify the state bucket exists and is accessible
- Check AWS service quotas (VPCs, Elastic IPs, NAT Gateways)

### Tests Failing
- Ensure infrastructure is deployed before running integration tests
- Verify outputs file exists at `cfn-outputs/flat-outputs.json`
- Check AWS credentials have sufficient permissions to describe resources

### NAT Gateway Issues
- NAT Gateway requires 3-5 minutes to become available
- Elastic IP must be allocated before NAT Gateway creation
- Internet Gateway must be attached before EIP allocation

## Project Structure

```
lib/
├── PROMPT.md                    # Original requirements
├── MODEL_RESPONSE.md            # LLM-generated implementation
├── IDEAL_RESPONSE.md            # Refined implementation
├── MODEL_FAILURES.md            # Issues and improvements
├── README.md                    # This file
├── cdktf.json                   # CDKTF configuration
├── lib/
│   ├── __init__.py
│   └── tap_stack.py             # Main VPC stack implementation
└── tests/
    ├── __init__.py
    ├── conftest.py              # Test configuration
    ├── unit/
    │   ├── __init__.py
    │   └── test_tap_stack.py    # Unit tests
    └── integration/
        ├── __init__.py
        └── test_tap_stack.py    # Integration tests
```

## Additional Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [AWS NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review CDKTF and AWS VPC documentation
3. Examine CloudWatch Logs for deployment errors
4. Check Terraform state for resource status

## License

This project is part of the IAC Test Automations framework.

# Payment Gateway VPC Infrastructure

This CDKTF Python implementation creates a production-ready VPC environment with proper network segmentation for a payment gateway application.

## Architecture Overview

The infrastructure creates:

- VPC with CIDR block 10.0.0.0/16 across 3 availability zones in ap-northeast-1
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for load balancers
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for application servers
- Internet Gateway for public subnet internet access
- Single NAT Gateway in first public subnet (ap-northeast-1a) for cost optimization
- S3 VPC Endpoint (Gateway type) for private S3 access
- VPC Flow Logs to CloudWatch with 5-minute aggregation intervals
- IAM role with least privilege for VPC Flow Logs

## Components

### Networking

- **VPC**: 10.0.0.0/16 with DNS hostnames and DNS support enabled
- **Public Subnets**: 3 subnets across 3 AZs with public IP assignment enabled
- **Private Subnets**: 3 subnets across 3 AZs with no public IP assignment
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: Single NAT Gateway in ap-northeast-1a for private subnet internet access
- **Route Tables**: Separate route tables for public and private subnets with explicit associations

### Security & Monitoring

- **VPC Flow Logs**: Captures all network traffic (ACCEPT, REJECT, ALL)
- **CloudWatch Log Group**: Stores flow logs with 7-day retention
- **IAM Role**: Least privilege role for VPC Flow Logs to write to CloudWatch
- **Tags**: All resources tagged with Environment=Production and Project=PaymentGateway

### VPC Endpoints

- **S3 Gateway Endpoint**: Enables private subnet access to S3 without internet

## Prerequisites

- Python 3.9 or higher
- CDKTF CLI installed (`npm install -g cdktf-cli`)
- AWS credentials configured
- Terraform installed

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Generate CDKTF provider bindings:

```bash
cdktf get
```

## Configuration

The stack accepts the following configuration via environment variables:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: "dev")
- `AWS_REGION`: Target AWS region (default: "ap-northeast-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state (default: "iac-rlhf-tf-states")
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (default: "us-east-1")
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging

## Deployment

1. Synthesize the CDKTF configuration:

```bash
cdktf synth
```

2. Deploy the infrastructure:

```bash
cdktf deploy
```

3. Confirm deployment when prompted.

## Testing

### Unit Tests

Run unit tests to verify stack configuration:

```bash
pytest tests/unit/ -v
```

### Integration Tests

After deployment, run integration tests to verify deployed resources:

```bash
pytest tests/integration/ -v
```

Integration tests load outputs from `cfn-outputs/flat-outputs.json` and validate:

- VPC configuration and CIDR blocks
- Subnet configuration and availability zones
- Internet Gateway and NAT Gateway configuration
- Route table configurations
- S3 VPC Endpoint configuration
- VPC Flow Logs and CloudWatch Log Group settings
- Resource tags and naming conventions

## Outputs

The stack exports the following outputs for cross-stack references:

- `vpc_id`: VPC ID
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_id`: NAT Gateway ID
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `internet_gateway_id`: Internet Gateway ID

## Cost Optimization

- Single NAT Gateway instead of one per AZ (reduces costs significantly)
- Gateway VPC Endpoint for S3 (no data transfer charges)
- VPC Flow Logs with 7-day retention (minimal storage costs)

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

Confirm destruction when prompted. All resources will be removed (no Retain policies).

## Network Flow

1. **Public Subnet Traffic**:
   - Resources in public subnets → Route Table → Internet Gateway → Internet

2. **Private Subnet Traffic**:
   - Resources in private subnets → Route Table → NAT Gateway → Internet Gateway → Internet
   - Resources in private subnets → Route Table → S3 VPC Endpoint → S3 (no internet)

3. **Logging**:
   - All traffic → VPC Flow Logs → CloudWatch Log Group (5-minute intervals)

## Security Considerations

- Private subnets cannot be accessed from the internet
- Private subnets can initiate outbound connections through NAT Gateway
- S3 access from private subnets doesn't traverse the internet
- All network traffic is logged for compliance and auditing
- IAM role follows principle of least privilege
- Flow logs retained for 7 days for compliance purposes

## Compliance

This infrastructure meets the following requirements:

- Network segmentation with public/private subnets
- Comprehensive logging of all network traffic
- 7-day log retention for audit purposes
- Controlled internet access through NAT Gateway
- Private access to AWS services via VPC Endpoints
- Explicit tagging for environment identification

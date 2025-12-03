# Payment Processing Infrastructure - CDKTF TypeScript

Complete Infrastructure as Code for a PCI DSS compliant payment processing web application using CDKTF with TypeScript.

## Architecture Overview

This infrastructure deploys a highly available, secure payment processing application with the following components:

- **VPC**: 3 public and 3 private subnets across 3 availability zones in us-east-2
- **ECS Fargate**: Containerized payment service running in private subnets
- **RDS Aurora MySQL**: Multi-AZ database cluster with KMS encryption
- **Application Load Balancer**: HTTPS termination with ACM certificates
- **CloudWatch Logs**: 7-year retention for compliance
- **S3**: VPC flow logs with Glacier lifecycle policy (90 days)
- **IAM**: Least privilege roles for ECS tasks
- **KMS**: Customer-managed keys for RDS encryption
- **Secrets Manager**: Secure credential storage

## Prerequisites

1. **Node.js** (v18 or later)
2. **CDKTF CLI** (v0.20.0 or later)
3. **Terraform** (v1.5 or later)
4. **AWS CLI** configured with appropriate credentials
5. **ACM Certificate** in us-east-2 region for HTTPS

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables before deployment:

```bash
export AWS_REGION=us-east-2
export ENVIRONMENT_SUFFIX=dev
export ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-2:ACCOUNT_ID:certificate/CERT_ID
export TERRAFORM_STATE_BUCKET=your-terraform-state-bucket
export TERRAFORM_STATE_BUCKET_REGION=us-east-1
```

## Deployment

### Synthesize Terraform Configuration

```bash
cdktf synth
```

### Deploy Infrastructure

```bash
cdktf deploy
```

### Destroy Infrastructure

```bash
cdktf destroy
```

## Architecture Details

### Network Architecture

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.0.0/24, 10.0.2.0/24, 10.0.4.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.3.0/24, 10.0.5.0/24
- **NAT Gateways**: One per availability zone for high availability
- **VPC Flow Logs**: All traffic logged to S3

### Security Architecture

#### Security Groups

1. **ALB Security Group**
   - Inbound: Port 443 (HTTPS) from 0.0.0.0/0
   - Outbound: Port 8080 to ECS tasks in VPC

2. **ECS Security Group**
   - Inbound: Port 8080 from ALB only
   - Outbound: Port 443 (HTTPS) for AWS services
   - Outbound: Port 3306 (MySQL) to RDS

3. **RDS Security Group**
   - Inbound: Port 3306 from ECS tasks only
   - Outbound: Denied (no outbound connections)

#### IAM Roles

1. **ECS Task Execution Role**
   - Permissions: Pull container images, write CloudWatch logs
   - Secrets Manager: Read RDS credentials

2. **ECS Task Role**
   - Permissions: Access specific S3 bucket (flow logs)
   - Secrets Manager: Read application secrets

### Compliance Features

- **Encryption at Rest**: RDS uses customer-managed KMS keys
- **Encryption in Transit**: ALB terminates SSL/TLS, ECS to RDS uses SSL
- **Log Retention**: 7-year retention (2555 days) for CloudWatch logs
- **Audit Logging**: VPC flow logs capture all network traffic
- **Backup Retention**: RDS automated backups retained for 35 days
- **Tagging**: All resources tagged with Environment, Application, CostCenter

### High Availability

- **Multi-AZ RDS**: Aurora cluster with 2 instances across AZs
- **Multi-AZ ECS**: Tasks distributed across 3 private subnets
- **Multi-AZ ALB**: Load balancer spans 3 public subnets
- **NAT Gateway Redundancy**: One per AZ for failure isolation

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: DNS name for accessing the application
- `rds_cluster_endpoint`: Database endpoint for application configuration
- `vpc_flow_logs_bucket`: S3 bucket containing VPC flow logs
- `ecs_cluster_name`: ECS cluster name for deployments
- `kms_key_id`: KMS key ID for encryption operations

## Cost Optimization

- **ECS Fargate**: Smallest CPU/memory configuration (256/512)
- **RDS Aurora**: db.t3.small instances (can scale to serverless)
- **S3 Lifecycle**: Transition to Glacier after 90 days
- **Single-Region**: All resources in us-east-2

## Security Considerations

1. **ACM Certificate**: Obtain a valid certificate before deployment
2. **Secrets Rotation**: Implement rotation policy for RDS credentials
3. **Network ACLs**: Consider additional network ACLs for defense in depth
4. **WAF**: Consider adding AWS WAF for application-layer protection
5. **GuardDuty**: Enable GuardDuty for threat detection

## Testing

Unit and integration tests are located in the `test/` directory.

```bash
npm test
```

## Troubleshooting

### Deployment Fails with Certificate Error

Ensure `ACM_CERTIFICATE_ARN` environment variable is set to a valid certificate in us-east-2.

### ECS Tasks Fail to Start

Check CloudWatch logs at `/aws/ecs/payment-service-{environmentSuffix}` for error messages.

### RDS Connection Issues

Verify security group rules allow traffic from ECS security group to RDS security group on port 3306.

## Maintenance

### Updating ECS Task Image

Modify the `image` field in the ECS task definition in `lib/payment-processing-modules.ts`.

### Scaling ECS Service

Update the `desiredCount` in the ECS service configuration.

### Backup and Recovery

RDS automated backups are retained for 35 days. Manual snapshots can be created via AWS Console or CLI.

## License

This infrastructure code is provided as-is for educational and deployment purposes.

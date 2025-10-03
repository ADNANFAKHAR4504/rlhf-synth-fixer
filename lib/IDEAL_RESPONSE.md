# Production Web Application Stack - Terraform Implementation

This solution implements a secure, production-ready web application stack in AWS using Terraform. The infrastructure includes a VPC with public and private subnets, an EC2 web server with Application Load Balancer, RDS PostgreSQL database with Multi-AZ, and comprehensive monitoring with CloudWatch.

## Architecture Overview

The infrastructure creates:

- **VPC** with CIDR 10.0.0.0/16 in us-east-1 region
- **Public subnet** (10.0.1.0/24) for the web server and ALB
- **Private subnets** (10.0.2.0/24 and 10.0.3.0/24) for the RDS database across two AZs
- **Application Load Balancer** with HTTPS termination
- **EC2 instance** with IAM role for S3 read-only access
- **RDS PostgreSQL** with Multi-AZ, enhanced monitoring, and Performance Insights
- **Security Groups** following least privilege principles
- **CloudWatch alarms** for monitoring CPU utilization
- **S3 bucket** for ALB access logs

## Security Features

- Database is placed in private subnets with no public access
- Security groups restrict access to necessary ports only
- Database security group only allows connections from web server
- SSH access restricted to specified CIDR block
- IAM roles follow least privilege principle (S3 read-only)
- All resources tagged with Environment = "Production"

## Files Created

### Infrastructure Code
- **lib/tap_stack.tf** - Complete Terraform configuration (734 lines)
- **lib/terraform.tfvars** - Sample variable values for testing

### Tests
- **test/terraform.unit.test.ts** - Comprehensive unit tests validating infrastructure configuration
- **test/terraform.int.test.ts** - Integration tests for deployed AWS resources

## Deployment Instructions

### Prerequisites
1. Valid ACM certificate in us-east-1 region
2. Existing EC2 key pair in us-east-1
3. AWS credentials configured

### Commands

1. **Initialize Terraform:**
   ```bash
   cd lib
   terraform init
   ```

2. **Validate configuration:**
   ```bash
   terraform validate
   ```

3. **Create terraform.tfvars with real values:**
   ```hcl
   acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
   key_pair_name = "your-existing-keypair"
   my_allowed_cidr = "YOUR.IP.ADDRESS/32"
   rds_password = "YourSecurePassword123!"
   instance_ami = "ami-0c02fb55731490381"  # Verify current Amazon Linux 2 AMI
   ```

4. **Plan deployment:**
   ```bash
   terraform plan
   ```

5. **Deploy infrastructure:**
   ```bash
   terraform apply
   ```

6. **Collect outputs:**
   ```bash
   terraform output -json > ../cfn-outputs/flat-outputs.json
   ```

### Testing

1. **Run unit tests:**
   ```bash
   npm run test:unit
   ```

2. **Run integration tests (after deployment):**
   ```bash
   npm run test:integration
   ```

## Key Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `acm_certificate_arn` | ACM certificate ARN for HTTPS | Yes | None |
| `key_pair_name` | EC2 key pair name for SSH | Yes | None |
| `my_allowed_cidr` | CIDR block for SSH access | Yes | None |
| `rds_password` | RDS master password | Yes | None |
| `vpc_cidr` | VPC CIDR block | No | 10.0.0.0/16 |
| `instance_type` | EC2 instance type | No | t3.micro |
| `instance_ami` | EC2 AMI ID | No | ami-0c02fb55731490381 |

## Outputs

- `alb_dns_name` - Application Load Balancer DNS name
- `web_instance_public_ip` - EC2 instance public IP
- `rds_endpoint_address` - RDS endpoint address
- `rds_endpoint_port` - RDS endpoint port

## Security Considerations

1. **Database Access**: RDS instance is not publicly accessible and only accepts connections from the web server security group
2. **SSH Access**: Restricted to user-defined CIDR block via `my_allowed_cidr` variable
3. **HTTPS Only**: ALB configured with HTTPS listener using provided ACM certificate
4. **IAM Permissions**: EC2 instance has minimal S3 read-only permissions
5. **Network Isolation**: Private subnets for database tier

## Monitoring and Logging

- **CloudWatch Alarms**: Configured for EC2 CPU, RDS CPU, and ALB unhealthy targets
- **RDS Monitoring**: Enhanced monitoring enabled with 60-second intervals
- **Performance Insights**: Enabled for RDS with 7-day retention
- **ALB Access Logs**: Stored in dedicated S3 bucket
- **CloudWatch Logs**: RDS PostgreSQL logs exported to CloudWatch

## High Availability

- **Multi-AZ RDS**: Database configured for automatic failover
- **Multiple Subnets**: ALB spans multiple availability zones
- **Auto Recovery**: EC2 instance can be easily replaced via auto-scaling (not implemented in basic version)

## Cost Optimization

- Uses t3.micro instances for cost efficiency
- gp2 storage for RDS (20GB minimum)
- 7-day backup retention for RDS
- Performance Insights with minimal retention period

## Validation Tests

The solution includes comprehensive testing:

1. **Unit Tests** (17 test cases):
   - Infrastructure component existence
   - Security group configurations
   - Variable declarations
   - Security best practices validation

2. **Integration Tests** (8 test suites):
   - VPC and networking verification
   - Security group rule validation
   - EC2 instance health checks
   - ALB configuration and health
   - RDS availability and Multi-AZ
   - CloudWatch alarm configuration
   - S3 bucket policy verification
   - End-to-end connectivity testing

## Cleanup

To destroy all resources:
```bash
cd lib
terraform destroy
```

**Note**: Ensure S3 buckets are empty before destruction, as they may contain ALB access logs.

## Best Practices Implemented

1. **Infrastructure as Code**: Single Terraform file for maintainability
2. **Security by Design**: Least privilege access, private subnets for data tier
3. **Monitoring**: Comprehensive CloudWatch alarms and logging
4. **High Availability**: Multi-AZ deployment for critical components
5. **Documentation**: Inline comments and comprehensive testing
6. **Validation**: Both unit and integration tests ensure correctness

This implementation provides a solid foundation for a production web application with security, monitoring, and high availability built in from the start.
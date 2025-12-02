# Payment Processing Infrastructure Migration - Terraform

## Platform and Language Requirements
**CRITICAL**: This task MUST be completed using **Terraform with HCL**.
- Platform: Terraform
- Language: HCL (HashiCorp Configuration Language)
- Terraform Version: 1.5+
- AWS Provider Version: 5.x

## Background
A fintech startup needs to migrate their payment processing infrastructure from their development environment to a production environment in AWS. The development environment was manually configured and lacks proper security controls and high availability setup required for production workloads.

## Environment Context
Production environment in AWS us-east-1 region for payment processing workload migration. Infrastructure includes VPC with 3 availability zones, private subnets for compute and database tiers, public subnets for ALB, NAT gateways for outbound connectivity. Core services: RDS PostgreSQL 15.3 Multi-AZ, EC2 t3.medium instances, Application Load Balancer, S3 for static assets, CloudWatch for monitoring. Requires Terraform 1.5+, AWS provider 5.x, existing Route53 hosted zone for DNS management.

## Requirements

Create a Terraform configuration to migrate a payment processing application from development to production environment. The configuration must:

1. **VPC and Networking**: Define a VPC with CIDR 10.0.0.0/16 spanning 3 availability zones with public and private subnets.

2. **RDS Database**: Configure RDS PostgreSQL 15.3 instance with Multi-AZ deployment, encrypted storage, and automated backups retained for 7 days.

3. **Compute Auto Scaling**: Create an Auto Scaling group with minimum 2 and maximum 6 EC2 t3.medium instances in private subnets.

4. **Load Balancer**: Deploy an Application Load Balancer in public subnets with HTTPS listener using ACM certificate.

5. **S3 Storage**: Set up S3 bucket with versioning enabled and lifecycle policy to transition objects to Glacier after 90 days.

6. **Monitoring**: Configure CloudWatch alarms for CPU utilization above 80% and database connections above 90%.

7. **IAM Permissions**: Create IAM roles for EC2 instances with permissions to read from S3 and write to CloudWatch Logs.

8. **Security Groups**: Implement security groups allowing only HTTPS traffic from internet to ALB and PostgreSQL traffic from EC2 to RDS.

9. **VPC Flow Logs**: Enable VPC Flow Logs to S3 for network traffic analysis.

10. **Resource Tagging**: Tag all resources with Environment=production, Project=payment-gateway, and ManagedBy=terraform.

## Constraints

1. All data must be encrypted at rest using AWS KMS customer-managed keys
2. RDS instances must use Multi-AZ deployment for high availability
3. Application load balancers must terminate SSL/TLS with ACM certificates
4. EC2 instances must be launched in private subnets with no direct internet access
5. All IAM roles must follow the principle of least privilege with explicit deny statements

## Expected Output

A modular Terraform configuration with separate files for networking, compute, database, and security resources. Include:
- `variables.tf` for configurable parameters
- `outputs.tf` exposing ALB DNS name and RDS endpoint
- Separate modules or files for logical separation of concerns

## Critical Implementation Notes

### Resource Naming
- ALL named resources MUST include `var.environment_suffix` or `${var.environment_suffix}` to ensure uniqueness
- Example: `bucket_name = "payment-gateway-${var.environment_suffix}"`
- This prevents resource name collisions across parallel deployments

### Destroyability Requirements
- No resources should have retention policies that prevent deletion
- RDS: Set `skip_final_snapshot = true` for easier cleanup
- S3: No need for special deletion configuration (handled separately)

### Cost Optimization
- Prefer single NAT Gateway for synthetic tasks (not one per AZ)
- Use VPC Endpoints where possible (S3, DynamoDB) to avoid NAT costs
- Keep RDS backup retention minimal (7 days as specified)

### Security Best Practices
- Use KMS encryption for RDS and S3
- Implement least privilege IAM policies
- Security groups should be specific (no 0.0.0.0/0 for ingress except ALB HTTPS)
- Enable encryption in transit where applicable

### ACM Certificate Note
For this synthetic task, you may need to:
- Use a placeholder ACM certificate ARN in variables
- Document that ACM certificate must be created manually first
- Or create a self-signed certificate resource for testing purposes

## AWS Region
Default region: us-east-1 (as specified in environment context)

## Module Structure Recommendation

```
.
├── main.tf              # Root module, calls child modules
├── variables.tf         # Input variables including environment_suffix
├── outputs.tf           # Outputs for ALB DNS and RDS endpoint
├── modules/
│   ├── networking/      # VPC, subnets, NAT, IGW
│   ├── compute/         # EC2, Auto Scaling, Launch Template
│   ├── database/        # RDS PostgreSQL
│   ├── security/        # Security Groups, IAM roles
│   └── storage/         # S3 buckets
```

## Validation Checklist

Before completing the task, verify:
- [ ] All resource names include environment_suffix variable
- [ ] No hardcoded values that should be variables
- [ ] RDS has Multi-AZ enabled
- [ ] KMS encryption enabled for RDS and S3
- [ ] Security groups follow least privilege
- [ ] CloudWatch alarms configured correctly
- [ ] Terraform modules are properly structured
- [ ] Variables and outputs are documented
- [ ] All 10 requirements from the problem statement are implemented

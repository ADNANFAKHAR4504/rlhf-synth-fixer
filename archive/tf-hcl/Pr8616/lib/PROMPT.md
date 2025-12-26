# Multi-Environment E-commerce Infrastructure

Need to build infrastructure for our e-commerce platform that deploys consistently across dev, staging, and prod. Right now we maintain separate configs for each environment and its causing drift issues.

## The problem

We want a single Terraform configuration where we just pass an environment_suffix variable and it creates the same infrastructure pattern with different names. This way when we change something it applies everywhere.

## What to build

Build the full stack in Terraform HCL. Heres how the pieces connect:

### Network layer
VPC using 10.0.0.0/16 with public and private subnets across 2 AZs. Internet Gateway connects to public subnets. NAT Gateway in public subnet that routes outbound traffic from private subnets to the internet.

### Compute layer
Auto Scaling Group that launches EC2 instances in private subnets. These instances connect to the ALB through a target group for health checks. Launch template handles the user data setup.

### Load balancing
Application Load Balancer sits in public subnets and forwards traffic to the EC2 instances through target groups. Health checks monitor the instances and ALB removes unhealthy ones from rotation.

### Database
RDS MySQL in private subnets that only accepts connections from the EC2 instances through security group rules. DB subnet group spans both AZs for redundancy. KMS encrypts the data at rest.

### Storage
S3 buckets for static assets with versioning enabled. Environment prefix in bucket names for uniqueness.

### Security flow
ALB security group permits HTTP and HTTPS on ports 80 and 443 from the internet. EC2 security group only accepts requests from the ALB security group. RDS security group restricts MySQL access to the EC2 security group only. Traffic flows in a controlled chain from internet to ALB to EC2 to RDS. KMS encrypts data at rest.

### Monitoring
CloudWatch collects logs from EC2 and RDS. DynamoDB handles Terraform state locking.

## Requirements

- Deploy to us-east-1
- Use environment_suffix variable in all resource names
- Tag everything with Environment and ManagedBy
- ALB in public subnets, EC2 and RDS in private
- KMS encryption on RDS and S3
- Multi-AZ for high availability
- Resources must be destroyable for testing

## Deliverables

Terraform code in lib/ folder with tap_stack.tf for resources, variables.tf for inputs, outputs.tf for ALB DNS and RDS endpoint. Tests in test/ folder.

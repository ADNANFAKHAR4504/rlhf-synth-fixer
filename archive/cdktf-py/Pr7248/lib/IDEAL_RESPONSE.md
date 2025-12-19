# Ideal Response - Blue-Green Deployment Infrastructure

## Complete Working Implementation

All code files in this repository represent the IDEAL implementation after fixing critical CDKTF issues.

### Files
1. **tap.py** - Entry point
2. **lib/tap_stack.py** - Main orchestrator
3. **lib/network_stack.py** - VPC, subnets, NAT, IGW
4. **lib/database_stack.py** - Aurora PostgreSQL Serverless v2
5. **lib/compute_stack.py** - ALB, Auto Scaling Groups (Blue/Green), EC2, IAM, S3
6. **lib/monitoring_stack.py** - CloudWatch alarms, SNS

### Architecture

**Blue-Green Deployment Pattern** for zero-downtime migration:
- Separate Auto Scaling Groups for Blue and Green environments
- Single ALB with target groups for traffic routing
- Aurora Serverless v2 with automatic scaling (0.5-1 ACU)
- CloudWatch monitoring with SNS alerting

### Key Implementation Details

**Network Layer**:
- VPC: 10.0.0.0/16
- 2 Public subnets (us-east-1a, us-east-1b)
- 2 Private subnets (us-east-1a, us-east-1b)  
- NAT Gateway for private subnet outbound access
- Internet Gateway for public access

**Compute Layer**:
- Application Load Balancer (internet-facing)
- Blue ASG: min=1, max=4, desired=2
- Green ASG: min=1, max=4, desired=2
- Amazon Linux 2023 AMI
- t3.micro instances
- User data installs Apache httpd

**Database Layer**:
- Aurora PostgreSQL Serverless v2 cluster
- Auto-scaling: 0.5-1 ACU
- Credentials stored in Secrets Manager
- Skip final snapshot (for destroyability)

**Monitoring**:
- ALB 5XX error alarm
- Blue/Green unhealthy host alarms
- SNS topic for notifications

### Critical Fixes from MODEL_RESPONSE

See MODEL_FAILURES.md for details on the 2 critical fixes applied to make this code work with CDKTF.

### Deployment

```bash
export ENVIRONMENT_SUFFIX="synthc2r9s6m4"
export AWS_REGION="us-east-1"
npm run cdktf:synth  # Generate Terraform
npm run cdktf:deploy # Deploy to AWS
```

### Training Value

This implementation demonstrates:
1. CDKTF-specific patterns (AutoscalingGroupTag class usage)
2. Terraform function usage (Fn.split, Fn.element) for runtime value manipulation
3. Blue-Green deployment architecture
4. Multi-service integration (12 AWS services)
5. Security best practices (Secrets Manager, security groups, IAM least privilege)

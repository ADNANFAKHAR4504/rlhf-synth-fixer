# AWS Infrastructure Setup Request

Hey, I need your help setting up a production-ready AWS environment for our web application. We're looking to build something robust that can be replicated across different environments (dev, staging, prod) consistently.

## Context

We're deploying a scalable web application that needs to handle variable traffic loads and maintain high availability. The infrastructure should follow AWS best practices for security, monitoring, and disaster recovery.

## Core Requirements

### Region and Availability

- Everything needs to be in **us-east-1** region
- Spread resources across multiple availability zones for redundancy
- We need at least 2 EC2 instances in different AZs

### Storage Requirements

- **S3 bucket** for application assets with:
  - Versioning enabled (for rollback capabilities)
  - KMS encryption (compliance requirement)
  - Globally unique naming

### Compute Setup

- **EC2 instances**:
  - Use t3.micro instances (cost optimization for now)
  - Deploy through an Auto Scaling Group
  - Place them in a properly configured VPC with subnets and routing

### Database

- **DynamoDB** for application state management
- Enable on-demand backup for disaster recovery

### Security & Access

- **IAM roles** for EC2 instances to access S3 bucket
- **Security groups** with minimal open ports (principle of least privilege)
- **SSH key pairs** for secure instance access
- No unnecessary ports exposed to the internet

### Monitoring & Compliance

- **CloudWatch** monitoring for EC2 CPU utilization
- Set alarms for CPU usage above 80%
- **CloudTrail** enabled for audit logging
- Track all AWS account activities

### Resource Organization

- Tag everything with:
  - `Environment`: (dev/staging/prod)
  - `Department`: (your department name)
- Use consistent naming conventions to avoid conflicts

## Delivery Format

Please provide the solution as CloudFormation YAML templates. The templates should be:

- Modular and reusable
- Well-commented for team understanding
- Follow AWS CloudFormation best practices
- Include parameters for environment-specific values

## Additional Notes

- This needs to be production-ready, so think about aspects like:
  - Network isolation
  - Backup strategies
  - Scaling capabilities
  - Cost optimization where possible
- The solution should be easy to replicate for multiple environments
- Consider future growth - we might need to scale beyond t3.micro eventually

Can you create the CloudFormation template(s) that meet all these requirements? Please explain any design decisions you make along the way.

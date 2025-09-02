The model should output a **complete AWS CloudFormation template in JSON** that provisions a **secure, SOC2-compliant, production-grade AWS environment in the us-east-1 region**.

## Requirements

### Networking

- Define a VPC with both public and private subnets.
- Attach an Internet Gateway to the VPC and route public subnet traffic.
- Deploy a NAT Gateway in the public subnet to allow private subnet instances secure outbound internet access.
- Configure route tables, Security Groups, and NACLs for least-privilege and secure communication.

### Database

- Deploy an Amazon RDS instance in the private subnet.
- Enable storage encryption using AWS KMS.
- Ensure backups, Multi-AZ deployment, and secure parameter configurations.

### Compute & Scaling

- Provision an ECS Cluster to run containerized applications.
- Place an Application Load Balancer (ALB) in front of the ECS cluster.
- Set up an Auto Scaling Group to manage ECS container instances.

### Security & Access Control

- Use IAM policies with “deny by default” and explicitly grant necessary permissions.
- Configure IAM roles for ECS tasks, RDS access, and logging services.
- Implement Resource Access Manager (RAM) for sharing resources across accounts.

### Monitoring & Logging

- Enable AWS CloudTrail for auditing and log delivery to S3.
- Enable CloudWatch metrics and alarms for infrastructure health.
- Configure S3 buckets with lifecycle policies for application and audit logs.

### Compliance & Management

- Enforce encryption for all sensitive data (at rest and in transit).
- Apply company-standard tagging for all resources.
- Ensure all configurations align with SOC2 compliance requirements.

**Expected Output:**  
A fully valid CloudFormation JSON template containing all the above components, ready for deployment without errors.

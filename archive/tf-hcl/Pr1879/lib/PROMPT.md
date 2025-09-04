# High Availability AWS Infrastructure Terraform Prompt

This prompt outlines the requirements for generating a highly available, fault-tolerant web application infrastructure in AWS using Terraform HCL.

## Requirements

- **Multi-AZ Deployment:** Deploy EC2 instances across at least two Availability Zones in the `us-east-1` region for load balancing and fault tolerance.
- **Auto Scaling:** Manage EC2 instances using an Auto Scaling Group, maintaining a minimum of two running instances at all times.
- **Load Balancer:** Implement an Elastic Load Balancer (ELB) to distribute incoming HTTP/HTTPS traffic to the EC2 instances.
- **Rapid Recovery:** Ensure the infrastructure can automatically recover from EC2 instance failures within 120 seconds.
- **Monitoring & Scaling:** Monitor application health using CloudWatch, with alarms and scaling policies triggered by CPU usage thresholds.
- **Access Control:** Restrict direct access to EC2 instances; only allow inbound traffic through the ELB security group.
- **Notifications:** Integrate an SNS notification system to alert administrators of any auto-scaling actions or scaling events.

## Environment

Design an AWS environment in the `us-east-2` region using Terraform HCL, with the following features:

1. **VPC Setup:** A VPC spanning two Availability Zones, each with its own public and private subnet.
2. **Auto Scaling Group:** An Auto Scaling Group managing EC2 instances, configured for high availability and rapid failure recovery.
3. **Elastic Load Balancer:** An ELB distributing HTTP/HTTPS traffic across all EC2 instances.
4. **CloudWatch Integration:** CloudWatch alarms for application health and scaling, based on defined CPU usage thresholds.
5. **Security Groups:** Security group rules that restrict direct access to EC2 instances, enforcing entry only via the ELB.
6. **SNS Topic:** An SNS topic configured to send notifications to specified administrators for any auto-scaling events.

## Deliverable

Produce a complete, functional Terraform HCL configuration file named `high_availability_template.hcl` that satisfies all requirements above. The configuration must validate successfully and be ready for use, with placeholders for user-supplied values (e.g., AMI IDs, key pair names).  
**Include comments in the code to clearly indicate how each requirement is fulfilled.**  
Verification steps or test code should confirm the correct implementation of multi-AZ deployment, auto scaling, load balancing, monitoring, security controls, and notification integration.

## Instructions

- **Do not modify or omit any requirements.**
- Use Terraform idioms and best practices for high availability and security.
- Resource naming and security controls must be consistent throughout.
- The output must be a single Terraform HCL file named `high_availability_template.hcl`, directly executable by Terraform.
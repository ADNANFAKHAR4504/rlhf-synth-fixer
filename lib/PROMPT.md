# CloudFormation Deployment Prompt

## Objective
You are an expert AWS CloudFormation architect. Create a **complete YAML CloudFormation template** that automates the deployment of a **secure, highly available, and cost-efficient AWS environment** in a **single AWS region (`us-east-1`)**.

The template must strictly follow the below **requirements** and **descriptions**.

---

## Architecture Requirements

1. **Single Region High Availability**  
   - Deploy **all resources in `us-east-1`**.  
   - Use **multiple Availability Zones** within the region to achieve high availability.  
   - *Description:* Ensures redundancy and failover while keeping deployment within one AWS region.

2. **EC2 Auto Scaling Group with Load Balancer**  
   - Auto Scaling Group: **min size = 2**, **max size = 10**.  
   - Attach an **Elastic Load Balancer (ELB)** for traffic distribution.  
   - *Description:* Optimizes cost and improves availability.

3. **VPC with Public and Private Subnets**  
   - Deploy all instances in a **custom VPC**.  
   - At least **1 public and 1 private subnet per Availability Zone**.  
   - *Description:* Public subnets for internet-facing resources; private subnets for sensitive backend resources.

4. **CloudWatch Monitoring**  
   - Create alarms for **CPU utilization > 75%** on any EC2 instance.  
   - *Description:* Enables proactive scaling and performance management.

5. **S3 Buckets (Secure & Versioned)**  
   - Enable **server-side encryption** using AWS-managed keys (SSE-S3).  
   - Enable **versioning**.  
   - *Description:* Protects data with encryption and preserves file history.

6. **RDS PostgreSQL (Multi-AZ)**  
   - PostgreSQL version **12 or higher**.  
   - **Multi-AZ** enabled.  
   - *Description:* Ensures database failover and uptime.

7. **IAM Roles for EC2 to Access S3**  
   - Grant read/write permissions to S3 buckets.  
   - *Description:* Avoids storing AWS credentials on instances.

8. **Resource Tagging**  
   - All resources tagged with:  
     - `Environment` = environment name (e.g., Dev, Prod)  
     - `Project` = project name  
   - *Description:* Supports cost tracking and organization.

9. **Route 53 DNS Routing**  
   - Configure a domain to point to the Load Balancer.  
   - *Description:* User-friendly domain and DNS routing.

10. **AWS WAF Protection**  
    - Attach to Load Balancer.  
    - Block common web exploits (SQL injection, XSS).  
    - *Description:* Adds application-layer security.

11. **CloudTrail Auditing**  
    - Enable in **`us-east-1`**.  
    - *Description:* Tracks API calls and user activity for compliance and security.

---

## Constraints
- Deployment must be in **`us-east-1` only**.  
- Must follow AWS best practices for **security**, **reliability**, and **cost efficiency**.  
- Must deploy successfully with all resources functional.

---

## Expected Output
- **Full YAML CloudFormation template** including:
  - Parameters for customization (instance types, subnet CIDRs, etc.)
  - Resources for all services listed above
  - Outputs for key resource details (Load Balancer DNS, RDS endpoint, etc.)
  - All dependencies and configurations for immediate deployment
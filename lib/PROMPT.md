# CloudFormation Template Request – TapStack Infrastructure

I need a CloudFormation YAML template that sets up a **secure, highly available, and cost-efficient AWS environment** in the **us-east-1** region. The goal is to create a reusable infrastructure stack for environments like Dev or Prod.

## ✅ Infrastructure Requirements

- **Region and Availability Zones**
  - Deploy everything in `us-east-1`.
  - Use at least two Availability Zones for high availability.

- **VPC and Subnets**
  - Create a custom VPC.
  - At least one **public subnet** and one **private subnet per AZ**.
  - Public subnets are for ALB and NAT.
  - Private subnets are for EC2 instances and the database.

- **Auto Scaling Group + Load Balancer**
  - Create an Auto Scaling Group: min 2, max 10.
  - Attach an Application Load Balancer to it.
  - EC2 instances should be launched with IAM roles that can access S3.

- **RDS Database (PostgreSQL)**
  - Use PostgreSQL version 12 or above.
  - Multi-AZ enabled.
  - Password should come from Secrets Manager, not hardcoded.

- **S3 Buckets**
  - One bucket for application data (versioned, encrypted).
  - One dedicated bucket for CloudTrail logs.

- **CloudWatch Monitoring**
  - CloudWatch alarm for CPU > 75% on EC2 instances.

- **WAF Web ACL**
  - Attach AWS WAF to the Application Load Balancer.
  - Use AWS-managed rules for common threats.

- **CloudTrail**
  - Enable CloudTrail in `us-east-1`.
  - Send logs to the dedicated S3 bucket.

- **Route 53 (DNS)**
  - Add a record to map a domain name to the load balancer (domain name can be a parameter).

- **Tagging**
  - All resources should have tags:
    - `Project` (parameter)
    - `Environment` (parameter)

## 🧾 Output Requirements

The CloudFormation template should:
- Be written in YAML.
- Include Parameters for things like instance type, subnet CIDRs, environment, and project name.
- Include Outputs for:
  - VPC ID
  - ALB DNS name
  - RDS endpoint
  - S3 bucket names
  - Web ACL ID
  - Auto Scaling Group name

---

Please provide the **complete CloudFormation YAML** with Parameters, Resources, and Outputs.

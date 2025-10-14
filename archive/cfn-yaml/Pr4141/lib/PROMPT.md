# Prompt

You are an expert AWS CloudFormation engineer. Generate a complete **CloudFormation YAML template** that deploys EC2 monitoring for a SaaS company with 1,000 daily users.

## Requirements

- **Region:** `us-east-1`
- **VPC:**
  - Create a new VPC with CIDR block `10.0.0.0/16`
  - Include at least one **public subnet**
  - Attach an **Internet Gateway** and configure **Route Table** for internet access
- **Security Group:**
  - Allow inbound **HTTP (port 80)** and **SSH (port 22)** from anywhere (for testing/demo)
- **EC2 Instances:**
  - Launch **10 t3.medium** instances in the public subnet
  - Use the latest **Amazon Linux 2 AMI**
  - Assign public IP addresses
  - Include **user data** that installs and configures the **CloudWatch Agent**
- **IAM Role & Instance Profile:**
  - Create an IAM role granting permissions to:
    - Publish metrics to **CloudWatch**
    - Write logs to **CloudWatch Logs** and **S3**
- **S3 Bucket:**
  - Create a bucket for storing EC2 and CloudWatch logs
  - Use a unique name with `!Sub`
- **CloudWatch Logs:**
  - Create a log group for EC2 instance logs
- **Monitoring & Alarms:**
  - Create a **CloudWatch Alarm** for each EC2 instance
  - Trigger when **CPU utilization > 80% for 5 minutes**
  - Send alerts to an **SNS Topic** (created in the stack)
- **Outputs:**
  - VPC ID
  - Instance IDs
  - S3 bucket name
  - CloudWatch alarm names

## Additional Requirements

- Follow best practices for **naming, tagging, and parameters**
- Use **Parameters** for:
  - Instance type
  - Alarm threshold
  - Key pair name
- Keep it **simple and cost-effective**
- Ensure YAML syntax is valid for direct deployment using:
  ```bash
  aws cloudformation deploy
  ```
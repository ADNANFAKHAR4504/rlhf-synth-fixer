> **Act as an AWS Solution Architect** and write a complete **AWS CDK** project in **Python** to deploy a **secure AWS infrastructure** in the **us-west-2** region. The solution must follow AWS security best practices and include the following:

## Requirements

1. **VPC & Networking**
   - Create a VPC with one **public subnet** and one **private subnet**.
   - Configure **Internet Gateway** for the public subnet to allow web traffic.
   - Restrict **SSH access** to a specific IP range (best security practices).
   - Apply consistent tagging: `Environment: Production` to all resources.

2. **EC2 & Auto Scaling**
   - Launch EC2 instances within the configured VPC.
   - Attach **Security Group** allowing SSH only from the specified IP range.
   - Configure an **Auto Scaling Group (ASG)**:
     - Minimum instances: **2**
     - Maximum instances: **5**
     - Scaling policy: Based on **CPU utilization**.
   - Use CloudWatch alarms to trigger scale-out when CPU > 70%.

3. **IAM**
   - Create and attach a **custom IAM role** and **policies** for EC2:
     - Allow access to **S3** and **DynamoDB** resources.

4. **Database**
   - Provision an **Amazon RDS** instance within the private subnet.

5. **Monitoring**
   - Integrate **CloudWatch alarms** to send notifications when CPU usage exceeds 70%.

6. **Region**
   - Ensure all resources are deployed in **us-west-2**.

## Deliverable
  - Creates and deploys a CloudFormation stack with the above components.
  - Tags all resources with `Environment: Production`.
  - Ensures security best practices (restricted SSH, private DB).

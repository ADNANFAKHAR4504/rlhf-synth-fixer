You are an AWS Cloud Architect. Write an **AWS CDK (JavaScript)** program that provisions a **scalable and secure environment**.

### Requirements

1. **Networking**: Create a VPC with at least **two public** and **two private subnets** across multiple availability zones.
2. **Load Balancing & Compute**: Deploy an **Elastic Load Balancer** that directs traffic to **EC2 instances** running in the **private subnets**.
3. **Database**: Provision an **Amazon RDS PostgreSQL instance** with **automatic daily backups** enabled.
4. **Storage**: Create an **Amazon S3 bucket** with **versioning** and **server-side encryption** enabled.
5. **Monitoring**: Configure **CloudWatch Alarms** to trigger when **EC2 CPU utilization exceeds 80%**.
6. **Security**: Implement **IAM roles and policies** with least privilege access.

### Expected Output

A complete **AWS CDK app in JavaScript** that:

- Defines all resources programmatically using **AWS CDK constructs**.
- Outputs **Security Group IDs** for future integrations.
- Implements **best practices** for security, scalability, and availability.
- Can be deployed using `cdk deploy` without errors.

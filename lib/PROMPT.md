You are a **Senior AWS Cloud Infrastructure Engineer**.

> Produce **one** deployable **CloudFormation** template in **YAML** that implements a secure, scalable web-app environment in **us-east-1**. **Provide only the template**—no extra commentary.

**Requirements**

- **Region**: Deploy all resources in `us-east-1`.
- **Parameters & Mappings**:
  - Define a `Parameter` for `EnvironmentName` and `Owner` (tags).
  - Map AMI IDs by region if needed.

- **IAM Roles**:
  - Create IAM Roles with least-privilege policies for accessing S3 buckets.
  - Use inline policies or managed policies with `Action` and `Resource` restrictions.

- **Network Security**:
  - VPC with public/private subnets.
  - Security Groups & Network ACLs allowing **only HTTPS (TCP/443)** to EC2.

- **Data Encryption**:
  - KMS Key for S3 and RDS encryption.
  - Include KeyPolicy granting necessary roles.

- **Compute & Scaling**:
  - Launch Configuration or Launch Template for EC2.
  - Auto Scaling Group with scale-out/in policies on CPUUtilization.

- **Content Delivery**:
  - S3 bucket origin + CloudFront Distribution.
  - Define caching `Behaviors` and HTTPS viewer protocol policy.

- **Database**:
  - RDS instance in a private subnet, **PubliclyAccessible: false**.
  - Enable storage encryption with the KMS key.

- **Monitoring & Alerts**:
  - CloudWatch Alarms on EC2 `CPUUtilization` and RDS `BurstBalance`.
  - SNS Topic + Subscriptions for notifications.

- **VPC Peering**:
  - Peer to existing VPC (`10.0.0.0/16`) with route table entries.
  - Update Security Groups to allow required traffic.

- **Tags**:
  - Apply `EnvironmentName` and `Owner` tags to **all** resources.

> - Use `Fn::Sub` and `!Ref` liberally for clean, DRY templates.
> - Organize sections as: `AWSTemplateFormatVersion`, `Description`, `Parameters`, `Mappings`, `Resources`, `Outputs`.

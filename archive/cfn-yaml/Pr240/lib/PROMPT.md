# AWS CloudFormation Template - Development Environment Setup

### Objective
You are tasked with setting up a development environment within AWS using CloudFormation. All resources must be created in the **us-east-1 region**, within the existing **VPC** `vpc-12345`, and using the existing **Security Group** `sg-67890`.

### Requirements

1. **Parameterization**:
- Parameterize at least **two values** in the template to allow future updates.

2. **Tagging**:
- **Tag all resources** with the tag `Environment: Development`.

3. **Public S3 Bucket**:
- Create a **public S3 bucket** with the following configurations:
- **Bucket Policy** that allows public read access.
- Enable **CloudWatch logging** for the bucket.

4. **EC2 Instance**:
- Deploy a **t2.micro EC2 instance** with the following properties:
- **Security Group**: Associate the EC2 instance with the specified security group (`sg-67890`).
- **SSH Access**: Allow SSH access only from `203.0.113.0/24`.
- **Elastic IP**: The EC2 instance should have a **public Elastic IP**.
- **IAM Role**: Attach an **IAM role** to the EC2 instance that allows **read-only S3 access** (define the role and policy within the same template).

5. **CloudWatch Alarm**:
- Monitor the EC2 instances **CPU usage** using a **CloudWatch Alarm**:
- The alarm should trigger if the **CPU utilization** exceeds **80%** for **five consecutive minutes**.

6. **CloudFormation Outputs**:
- Use **CloudFormation Outputs** to reveal:
- The **S3 bucket name**.
- The **EC2 instances public IP address**.

7. **IAM Roles and Policies**:
- All **IAM roles**, **policies**, and **access controls** must be defined within the **same CloudFormation template**.

### Constraints
- The template must be **robust** and suitable for **repeated deployments** in a **development environment**.
- Ensure that all resource names and parameters are flexible for easy updates in the future.

---

### Expected Output:
A CloudFormation **YAML template** that:
- Successfully deploys all the required resources.
- Passes all the specified requirements.
- Returns the required **outputs**.

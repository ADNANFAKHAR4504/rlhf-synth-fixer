You are tasked with designing and implementing a secure-by-default infrastructure using **AWS CloudFormation in YAML format**. The infrastructure must align with AWS best practices and enforce strong security controls by default. Your solution must provision the following components:

### **Infrastructure Requirements:**

1. A **VPC** configured with public and private subnets.
2. An **Internet-facing Application Load Balancer** (ALB) that routes traffic to a **web server fleet** managed by an **Auto Scaling group**.
3. **Security Groups** that restrict access to only allow **HTTP (port 80)** and **HTTPS (port 443)** traffic; all other inbound access must be denied.
4. An **RDS database instance** with:

   * **Encryption at rest using AWS KMS**
   * **Automated backups enabled**
5. An **S3 bucket** to host static content with:

   * **AES256 encryption at rest**
   * **Restricted access policies** (only accessible via defined IAM Roles with least privilege)
6. **IAM Role** configuration that:

   * Grants the **least privilege** necessary
   * Can access **only the specific S3 bucket**
7. Enable **CloudWatch Logs** for all EC2 instances for real-time **logging and monitoring**.
8. Implement **AWS Config** to monitor and report on **compliance issues** across resources.
9. **Restrict SSH access** to EC2 instances by allowing access from a **specific IP CIDR block only**.
10. Enforce **MFA** (Multi-Factor Authentication) for **all IAM user accounts**.
11. Ensure **all API Gateway endpoints**, if created, are accessible **only via HTTPS**.

### **Constraints:**

* Output must be a valid **CloudFormation YAML template**.
* Use **CloudFormation-native resource types** only.
* All **security configurations** (e.g., security groups, IAM policies, encryption settings) must comply with **AWS security best practices**.
* Template must pass validation with:

  ```bash
  aws cloudformation validate-template --template-body file://template.yaml  
  ```

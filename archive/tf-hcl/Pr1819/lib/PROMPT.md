---
---

Hey there!

I need your help designing a secure and production-ready AWS environment using Terraform. Think of yourself as the lead architect on this—your expertise in building robust infrastructure is exactly what we need.

**Project:** IaC - AWS Nova Model Breaking
**Author:** ngwakoleslieelijah
**Tool:** Terraform (HCL)
**Region:** Let's stick strictly to `us-east-1` for this one.

---

### What We're Building

Our goal is to create a well-structured and secure foundation for our application. Here’s a breakdown of the key components and how they should connect.

#### **1. The Network Foundation**

First, let's lay the groundwork with a solid network setup.

- **VPC:** We'll need a VPC in `us-east-1` with the CIDR block `10.0.0.0/16`. Make sure DNS resolution is turned on.
- **Subnets:** Let's create two public subnets (`10.0.1.0/24`, `10.0.2.0/24`) and two private subnets (`10.0.10.0/24`, `10.0.20.0/24`) spread across different availability zones for high availability.
- **Internet Access:** Set up a NAT Gateway so our private resources can reach the internet for updates and other outbound traffic.
- **Routing:** Configure the route tables to ensure traffic flows correctly and our private subnets stay private.

#### **2. The Security Layer**

Security is a top priority. Let's lock things down with a few key security groups.

- **EC2 Instances:** Allow web traffic (HTTP/HTTPS on ports 80/443) from the internet. For SSH (port 22), please restrict access to our VPC's CIDR (`10.0.0.0/16`) only. **Under no circumstances should SSH be open to the world (0.0.0.0/0).**
- **RDS Database:** The database should only accept connections from our EC2 instances. Let's use a security group rule to reference the EC2 security group directly.
- **S3 VPC Endpoint:** We'll need a security group that allows HTTPS traffic from within the VPC so our services can communicate securely with S3.
- **Application Load Balancer (ALB):** This will be our front door, so let it accept HTTP/HTTPS traffic from the internet and route it to our EC2 instances.

#### **3. The Compute and Application Layer**

This is where our application will live.

- **EC2 Instances:** Launch our instances in the private subnets and attach the EC2 security group we defined earlier.
- **Load Balancer:** Place the ALB in the public subnets to distribute incoming traffic.
- **Auto Scaling:** Let's set up an Auto Scaling Group to automatically adjust the number of EC2 instances based on traffic, and connect it to the ALB's target groups.
- **IAM Role:** Create an IAM instance profile with the minimum necessary permissions for S3 access.

#### **4. The Database Layer**

Our data needs a secure home.

- **RDS Instance:** Deploy a MySQL or PostgreSQL database in the private subnets, using the RDS security group.
- **Subnet Group:** Create a DB subnet group that spans our private subnets for redundancy.
- **Encryption:** It's crucial that we enable encryption at rest using a customer-managed KMS key.

#### **5. Storage and Data**

Let's set up our S3 buckets with security in mind.

- **S3 Buckets:** We'll need two buckets: one for data and one for logs. For both, please enable KMS encryption and versioning, and make sure to block all public access.
- **VPC Endpoint for S3:** To keep traffic off the public internet, let's route all S3 communication through a VPC endpoint.
- **Bucket Policies:** Add policies that restrict access to only come from our VPC endpoint.

#### **6. Identity and Access (IAM)**

Managing who can do what is critical.

- **IAM Users:** Let's require multi-factor authentication (MFA) for all users who need console access.
- **IAM Roles:** Create specific roles for our applications with least-privilege policies for accessing S3 and RDS.
- **Auditing:** Turn on CloudTrail to log all IAM and API activity.

#### **7. Monitoring and Network Security**

Finally, let's make sure we can keep an eye on things.

- **VPC Flow Logs:** Enable these to get detailed logs of all network traffic.
- **CloudWatch:** Set up monitoring for any changes to our security groups or suspicious access attempts.
- **AWS Config:** Use this to continuously check that our security rules remain compliant.

---

### How to Structure the Code

To keep things organized and reusable, let's structure our Terraform code into modules:

- `modules/networking/`
- `modules/security/`
- `modules/compute/`
- `modules/database/`
- `modules/storage/`
- `modules/iam/`
- `modules/monitoring/`

### What I'll Need from You

Please provide the complete Terraform configuration, including the root `tap_stack.tf`, `vars.tf`, etc., as well as the seven modules. A `README.md` with deployment instructions would be fantastic too.

Thanks for your help with this. Let's build something great!

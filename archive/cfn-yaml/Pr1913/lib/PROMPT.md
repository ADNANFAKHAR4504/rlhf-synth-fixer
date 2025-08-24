# AWS CloudFormation Environment Provisioning Prompt

You are an **AWS Infrastructure as Code (IaC) expert**.  
Your task is to **generate a fully valid AWS CloudFormation YAML template** that provisions the following test environment, adhering to AWS best practices for **security, networking, monitoring, IAM, and tagging**.

---

## Requirements & Constraints

### 1. VPC & Networking
- Create a new **VPC** with CIDR `10.0.0.0/16`.  
- Enable **DNS hostnames** and **DNS support**.  
- Create **two subnets**:
  - Public Subnet → `10.0.1.0/24`  
  - Private Subnet → `10.0.2.0/24`  
- Attach an **Internet Gateway** to the VPC.  
- Configure a **public route table** to route internet traffic from the public subnet to the Internet Gateway.  
- Deploy a **NAT Gateway** (with Elastic IP) inside the **public subnet**.  
- Configure a **private route table** for the private subnet to route outbound traffic through the NAT Gateway.  

---

### 2. Security Groups
- Create a **security group** that:
  - Allows inbound **HTTP (80)** from anywhere.  
  - Allows inbound **SSH (22)** from anywhere.  
  - Allows **all outbound traffic** to any destination.  

---

### 3. Compute Resources
- Launch an **EC2 instance** (`t2.micro`) in the **public subnet** using the latest **Amazon Linux 2 AMI**.  
- Attach an **IAM Role** with **AmazonS3FullAccess** permissions.  
- Enable **detailed monitoring**.  

---

### 4. Logging & Monitoring
- Enable **CloudWatch detailed monitoring** for EC2.  
- Configure **instance-level logging** into CloudWatch.  

---

### 5. Management & Governance
- Apply these tags to **all resources**:  
  - `Environment: Test`  
  - `Owner: DevOpsTeam`  

---

### 6. Validation
- Must pass **cfn-lint** validation.  
- Must comply with **AWS Well-Architected best practices** (networking and IAM).  

---

## Expected Output
Provide a **CloudFormation YAML template** that:
- Provisions all resources above.  
- Has correct **YAML syntax and indentation**.  
- Uses **Parameters** and **Outputs** where appropriate.  
- Contains **comments** explaining key sections.  
- Is **fully deployable** without manual changes.  

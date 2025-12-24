As an expert in AWS CloudFormation and security architecture, your task is to generate a secure and compliant infrastructure definition for a financial services application using AWS CloudFormation in **YAML format**.

###  Objective:
Create a single, well-commented CloudFormation template (`infrastructure.yaml`) to define the **core infrastructure** for a **financial services application**. The stack must adhere to **financial-grade security**, **internal compliance rules**, and **AWS best practices**. It should be deployable in a testing AWS account and pass tools like **cfn-lint** or **cfn-nag**.

---

### ️ Core Components and Constraints:

#### 1. **Networking (VPC & Subnets)**
- Set up VPC with **2 public and 2 private subnets** across AZs.
- Attach Internet Gateways only if needed (e.g., for front-end services).
- Create NAT Gateways, route tables, and enable **VPC Flow Logs**.

#### 2. **IAM & Access Control**
- Define IAM roles and policies with the **least privilege** principle.
- Use inline or managed role policies as needed.
- No hard-coded secrets in Lambda; use **AWS Secrets Manager**.

#### 3. **Storage (S3, RDS, DynamoDB, EBS)**
- **S3**:
  - Default encryption (SSE-KMS)
  - Block all public access
  - Enforce access via **CloudFront OAI**
- **RDS** (PostgreSQL):
  - Encrypted at rest using **KMS**
  - Not publicly accessible
- **DynamoDB**:
  - Multi-AZ enabled
  - Encrypted at rest
- **EBS**:
  - Encrypt all volumes by default

#### 4. **Security Groups & Firewall Rules**
- No open ports to the public
- Specifically **close ports 22 (SSH)** and **3389 (RDP)**

#### 5. **Lambda & Serverless**
- Define Lambda functions using CloudFormation
- Use environment variables for secrets (securely managed)
- Apply basic security checks in template

#### 6. **DNS, CDN, and Messaging**
- **Route 53**: Use private hosted zones for internal DNS
- **CloudFront**: Access to S3 only via **Origin Access Identity (OAI)**
- **SNS Topics**: Attach policies that deny public access

#### 7. **Monitoring & Compliance**
- Enable **AWS CloudTrail** in **all regions**
- Enable **AWS Config** with compliance rules
- Deploy **AWS WAF** for protection against web threats

---

### ️ Tagging Requirements:
- All resources must include:
  - `Environment`: One of `dev`, `staging`, or `prod`
  - `Project`
  - `Owner`

---

###  Output Requirements:
- A **single YAML file**: `infrastructure.yaml`
- Modular sections (Networking, IAM, Storage, etc.)
- **Inline comments** explaining major resource blocks
- Must pass **security and syntax linting**
- Ready for **testing environment deployment**

---

Please generate the CloudFormation template accordingly.
You are an AWS CloudFormation expert.

Create a complete and production-ready CloudFormation **YAML** template that provisions a **highly available, multi-tier web application infrastructure** on AWS.

### Environment Constraints:

- Region: `us-east-1`
- VPC CIDR block: `10.0.0.0/16`
- Infrastructure must span **three Availability Zones**
- All AWS resource names must be prefixed with `hr-` (high-reliability naming convention)

---

### Infrastructure Requirements:

#### 1. **Network Layer**:

- One VPC with CIDR `10.0.0.0/16`
- Three public subnets (one per AZ)
- Three private subnets (one per AZ)
- Internet Gateway for public subnets
- NAT Gateway in **each AZ** for private subnet internet access

#### 2. **Application Tier (Web Tier)**:

- EC2 instances launched in a **Launch Template** or **Launch Configuration**
- An **Auto Scaling Group** spanning all three AZs
- Fronted by an **Application Load Balancer (ALB)** deployed in public subnets
- EC2 instances deployed in **private subnets**

#### 3. **Database Tier**:

- Amazon **RDS instance with Multi-AZ** enabled
- RDS deployed in private subnets

#### 4. **Backup & Restore**:

- Use **AWS Backup** to manage automated backups of the RDS instance
- Define a **Backup Plan** and **Backup Vault**
- Configure retention and lifecycle rules

#### 5. **Security**:

- Define IAM Roles and Policies for required services
- All roles must follow the **principle of least privilege**

---

### Template Features:

- Use **Parameters** for:
- Environment name
- EC2 instance type
- DB engine and DB name
- Include **Outputs** for:
- ALB DNS Name
- RDS Endpoint
- IAM Role Names

---

### Post-Template Checklist:

After the template, include **three validation checks**, such as:

1. Confirm all subnets and resources are deployed
2. Validate RDS is configured for **Multi-AZ failover**
3. Ensure the **Backup Plan includes the RDS** instance

The template must use only valid **CloudFormation YAML**, and follow AWS best practices for **resilience, scalability, and security**.

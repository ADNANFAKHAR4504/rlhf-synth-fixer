## Prompt: AWS CloudFormation Template Generation

### **Problem Statement**

You are tasked to set up a **foundational cloud environment** using **AWS CloudFormation**.  
The environment must be deployed in the **`us-east-1`** region and follow best practices for networking, security, monitoring, and cost allocation.  
This infrastructure will serve as a baseline for enterprise-grade applications or development environments.

### **Requirements**

#### 1. Networking
- Create a **VPC** with CIDR block `10.0.0.0/16`.
- Provision **two subnets** in different availability zones.
- Create and attach an **Internet Gateway** to the VPC.
- Configure a **Route Table** with a default route to the Internet Gateway for outbound internet access.

#### 2. Compute (EC2)
- Launch an **EC2 instance** in one of the subnets.
- Use a **specific AMI** (pass as a parameter, no hardcoding).
- Attach an **Elastic IP** to the EC2 instance.
- Create a **Security Group** allowing inbound **HTTP (80)** and **SSH (22)** traffic.
- Enable **detailed monitoring** on the EC2 instance.
- Ensure **EBS volume encryption** is enabled.

#### 3. IAM & Permissions
- Define **IAM Roles and Instance Profiles** to allow EC2 to securely access **Amazon S3**.

#### 4. Storage (S3)
- Create one **S3 bucket** for general storage with:
  - Versioning enabled
  - Encryption enabled
- Create a **second S3 bucket** dedicated to storing logs with:
  - Versioning enabled
  - Encryption enabled

#### 5. Security & Compliance
- Enforce encryption for all S3 buckets and EBS volumes.
- Apply appropriate **resource tagging** for cost allocation (e.g., `EnvName`, `ProjectName`, `Owner`, `CostCenter`).

#### 6. Monitoring & Alerts
- Configure **Amazon CloudWatch** alarms to trigger when **EC2 CPU utilization exceeds 80%**.

#### 7. Outputs
- Provide outputs for:
  - VPC ID
  - Subnet IDs
  - EC2 Instance ID
  - Elastic IP
  - S3 Bucket Names

### **Constraints & Standards**

- **Region:** `us-east-1` (use `AWS::Region` pseudoparameter; do not hardcode).
- **Cross-Account Executability:**
  - Template must work across AWS accounts without modification.
  - No assumptions tied to a specific account, region, or availability zone name.
- **No Hardcoding:**
  - No hardcoded values like Account IDs, ARNs, Region names, or AMIs.
  - Use **Parameters**, **Mappings**, or **Pseudoparameters**.
- **Security Best Practices:**
  - Encrypt all storage resources (S3, EBS).
  - Use least privilege IAM roles.
- **Cost Allocation:**
  - Consistent tagging on all resources.

### **Expected Output**

- A **fully functional CloudFormation YAML template** implementing the above requirements.
- The template must:
  - Pass deployment validation in dummy or real AWS accounts.
  - Be logically structured and human-readable.
  - Include:
    - Parameters
    - Resources
    - Outputs
    - Metadata (optional for grouping parameters)
  - Avoid all hardcoded values.
  - Use intrinsic functions like `!Ref`, `!Sub`, `!GetAtt`, and pseudoparameters (`${AWS::AccountId}`, `${AWS::Region}`).

### **Subtask**

- **Cloud Environment Setup** in `us-east-1`.

### **Additional Notes**

- Use **parameter groups and labels** in the `Metadata` section to improve readability in the CloudFormation console.
- All created resources must comply with **AWS best practices** for scalability, security, and maintainability.
- Define resource dependencies to ensure proper provisioning order.


**Example Prompt Usage:**  
> “Generate a CloudFormation YAML template that implements the above task, following the constraints and expected output. Use parameters for AMI ID, instance type, and other configurable values. Ensure the template is production-ready.”
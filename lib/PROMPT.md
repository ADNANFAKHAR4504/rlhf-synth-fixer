# CDKTF (Python) Configuration for Secure & Highly Available AWS Production Environment

**Description:**  
Using **Python CDK for Terraform (CDKTF)**, implement a secure, highly available AWS production environment in the `us-east-1` region.  
The project should have:  
- **TapStack.py** – defines all AWS resources.  
- **tap.py** – entrypoint for synthesizing the Terraform configuration.  
The synthesized Terraform output must pass `terraform validate` and meet all requirements below.

---

## Requirements

1. **AWS Provider**
   - Use AWS provider version `>= 3.0`.

2. **Tagging**
   - All resources must include:
     ```python
     tags = {
         "Environment": "Production"
     }
     ```

3. **VPC**
   - CIDR block: `10.0.0.0/16`
   - Deploy across **two Availability Zones**.
   - Create:
     - **1 public subnet** in each AZ.
     - **1 private subnet** in each AZ.

4. **NAT Gateway**
   - Place a NAT Gateway in **each public subnet**.
   - Ensure private subnets have outbound internet access via these NAT Gateways.

5. **EC2 Instances**
   - Launch **t2.micro** instances in **private subnets** (application servers).

6. **S3 Logs Bucket**
   - S3 bucket for logs with **server-side encryption enabled**.

7. **IAM Role & Policy**
   - EC2 instances must have permissions to read/write to the S3 log bucket.

8. **Security Groups**
   - Restrict inbound traffic to only required ports.
   - SSH access allowed **only** from `203.0.113.0/24`.

9. **CloudWatch Alarms**
   - Create alarms for EC2 CPU utilization exceeding **70%**.

---

## Constraints
- Use only AWS provider version **>= 3.0**.
- All resources must have `"Environment": "Production"` tag.
- Must synthesize to valid Terraform configuration and pass `terraform validate`.

---

## Output Format
- **TapStack.py** → Defines all AWS infrastructure resources.
- **tap.py** → CDKTF App entrypoint to synthesize the stack.

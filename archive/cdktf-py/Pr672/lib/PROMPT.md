### Environment:
You are working within a **multi-account AWS setup**, targeting environments such as **production, staging, and development**, and explicitly excluding the **us-east-1** region.

The infrastructure is to be deployed using **Terraform v0.14+**, implemented via **CDK for Terraform (CDKTF)** in **Python**. 
The main application entry point is `tap.py`, and the stack is defined in `tap_stack.py`.

---

### Core Requirements:

#### General Constraints:
- All resources **must be tagged** with:
- `Environment` (e.g., dev, staging, prod)
- `Owner` (e.g., team name, email)
- Must **exclude** deployment to `us-east-1` region.
- Terraform code must be **parameterized** for flexible multi-env setup.
- Set up **pre-commit hooks** to:
- Run `terraform fmt`
- Run `terraform validate`

---

### Security & Best Practices:

1. **S3 Buckets**
- Encrypted using **AES-256**
- Bucket policy must **restrict access** to only required IAM roles/services

2. **IAM**
- Implement **read-only IAM policy** for EC2 access
- Enforce **MFA for IAM users**
- IAM roles must follow **least privilege** principle

3. **RDS**
- Must **not be publicly accessible**
- Parameterized by instance type, storage, subnet group, and DB credentials (use **Secrets Manager**)

4. **CloudTrail**
- Must log to a **dedicated encrypted S3 bucket**
- Bucket policy must allow access **only to CloudTrail service**

5. **VPC**
- VPC must include **public and private subnets**
- **Flow logs** enabled, and sent to **CloudWatch Logs**

6. **Security Groups**
- Implement automated **cleanup of unused security group rules**
- Rules must be **reviewed and documented** in Terraform code

7. **Secrets Management**
- Use **AWS Secrets Manager** to store sensitive values such as RDS passwords

---

### Expected Deliverable:

- A valid `main.tf.json` synthesized from CDKTF Python app
- `tap.py` bootstraps the CDKTF app
- `tap_stack.py` defines the resources to meet all constraints
- Code must successfully pass:
- `cdktf synth`
- `cdktf deploy`
- Follow structure for scalability across environments and accounts
- All best practices must be implemented and documented

---

### Hint:

Make sure to define constructs modularly (e.g., IAM, S3, RDS, VPC, CloudTrail) within `tap_stack.py`, and synthesize them via `tap.py`.


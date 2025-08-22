# CloudFormation Infrastructure Creation Prompt.

## Environment
Create a **CloudFormation template** (`TapStack.yml`) in **YAML** format that sets up a **secure AWS environment**. The template must **adhere to strict security requirements** and implement configurations that comply with AWS best practices.

The **CloudFormation template** must meet the following **security requirements**:

1. **S3 Buckets** 
- Encrypted using **AWS KMS keys**. 
- Versioning enabled to recover from accidental deletions.
2. **IAM Roles** 
- Policies must follow the **principle of least privilege**.
3. **Security Groups** 
- Restrict inbound traffic to **specific IP ranges** only.
4. **Elasticsearch Domains** 
- Encryption at rest must be enabled.
5. **AWS Lambda** 
- Enable logging for all Lambda functions.
6. **AWS CloudTrail** 
- Enabled in **all regions** for full account activity logging.
7. **Amazon RDS** 
- Must have **at rest** and **in transit** encryption enabled.
8. **Amazon EC2** 
- EC2 instances must **not have public IP addresses**.
9. **AWS WAF** 
- Protect applications from **common web exploits**.

---

## Constraints
- All S3 buckets **KMS encryption** + **versioning enabled**. 
- IAM roles **least privilege** principle. 
- Security groups Allow only **specific IP ranges**. 
- Elasticsearch **encryption at rest** enabled. 
- Lambda Logging enabled. 
- CloudTrail Enabled **in all regions**. 
- RDS **at rest** + **in transit** encryption. 
- EC2 **no public IP addresses**. 
- AWS WAF Protect against web exploits.

---

## Expected Output
A **YAML-formatted CloudFormation template** (`lib/TapStack.yml`) that:

- Meets **all specified security constraints**.
- Passes **AWS CloudFormation validation** without errors.
- Successfully deploys in a **test AWS account**.
- Passes **security audits**.

---

## Proposed Statement
The infrastructure is hosted on AWS, spans multiple regions (**us-east-1**, **us-west-2**), and uses services including **S3, IAM, Elasticsearch, Lambda, CloudTrail, RDS, EC2, and WAF**. 
All naming conventions must follow **AWS resource naming guidelines**.

---

## Folder Structure
```plaintext
project-root/
└── lib/
└── TapStack.yml

# CloudFormation Infrastructure Creation Prompt.

## Environment

You are tasked with creating a **CloudFormation template** (`TapStack.yml`) to **secure an AWS environment comprehensively**. The environment consists of multiple AWS resources, and **security best practices** must be embedded from the outset.

The **CloudFormation template** must meet the following **requirements**:

1. **Amazon S3**
   - All S3 buckets must have **default encryption** enabled.
2. **IAM Roles**
   - All IAM roles must include policies that follow the **least privilege** principle.
3. **AWS CloudTrail**
   - Must be configured to capture and store **all account activity logs**.
4. **Multi-Factor Authentication (MFA)**
   - Enforce MFA for all IAM users.
5. **DynamoDB**
   - Enable **point-in-time recovery** for all DynamoDB tables.
6. **VPC Flow Logs**
   - Capture and securely store **VPC flow logs** for monitoring.
7. **Security Groups**
   - No rules should allow SSH access from `0.0.0.0/0`.
8. **Load Balancers**
   - Must have **HTTPS** listeners configured for secure communication.

---

## Constraints

- **S3 Buckets** → Default encryption must be enabled.
- **IAM Roles** → Use least privilege policies only.
- **CloudTrail** → Enable and log all account activity.
- **MFA** → Mandatory for all IAM users.
- **DynamoDB** → Point-in-time recovery must be enabled.
- **VPC Flow Logs** → Must be securely stored.
- **Security Groups** → No `0.0.0.0/0` SSH access.
- **Load Balancers** → Only HTTPS listeners allowed.

---

## Expected Output

A **valid CloudFormation YAML file** (`lib/TapStack.yml`) that:

- Implements **all security measures** listed above.
- Passes **AWS CloudFormation validation** without errors.
- Clearly defines **VPC IDs, Security Groups, and IAM roles**.
- Works in **us-east-1** and **us-west-2** regions.

---

## Proposed Statement

Design an **AWS Cloud environment** that follows **security best practices** across multiple AWS services, ensuring **consistency and protection** of all resources.

---

### Folder Structure

```plaintext
project-root/
└── lib/
    └── TapStack.yml
```
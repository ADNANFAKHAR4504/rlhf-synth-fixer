> **Act as a Solution Architect.**
> Design and implement a secure, compliant, and production-ready AWS infrastructure using **CloudFormation in YAML format**. The purpose of this task is to enforce **Security Configuration as Code**, aligning with modern DevSecOps best practices and regulatory compliance standards.

---

### **Objective:**

To define a **CloudFormation YAML template** that provisions a secure production environment, with strict resource tagging, encryption, and IAM access controls**without any hardcoded sensitive data**.

---

### **Key Requirements:**

#### 1. **Environment Tagging (All Resources):**

All AWS resources must be tagged with:

```yaml
Tags:
- Key: Environment
Value: production
```

This applies to EC2 instances, S3 buckets, IAM roles, KMS keys, EBS volumes, and more.

---

#### 2. **Encryption Using AWS KMS:**

You must use **AWS Key Management Service (KMS)** to encrypt all data at rest. This includes:

* **Amazon S3 Buckets**:
Use `BucketEncryption` with KMS-managed keys (SSE-KMS).

* **Amazon EBS Volumes** (attached to EC2):
Enable encryption with a custom or default KMS key.

* **AWS::KMS::Key Resource**:
If appropriate, define your own KMS key with key rotation enabled.

---

#### 3. **IAM Roles with MFA Enforcement:**

Define one or more **IAM roles** that enforce **Multi-Factor Authentication (MFA)** to be assumed. Ensure:

* Use of IAM trust policy with conditions such as:

```json
"Condition": {
"Bool": {
"aws:MultiFactorAuthPresent": "true"
}
}
```

* These roles can be assumed only if the caller has MFA enabled.

---

#### 4. **Avoid Hardcoded Sensitive Data:**

Ensure:

* No plaintext credentials or secret strings in the template.
* Use **CloudFormation Intrinsic Functions**:

* `Ref`, `Fn::Sub`, `Fn::Join`, etc.
* Use **Dynamic References** for:

* Secrets Manager
* SSM Parameter Store (`{{resolve:ssm:/secure/parameter}}`)

---

### **Resources to Include in Template:**

Heres a list of expected resources to define in the template:

| Resource | Purpose |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `AWS::S3::Bucket` | Store application data, must be encrypted with SSE-KMS and versioning enabled |
| `AWS::KMS::Key` | KMS key used for encrypting resources like S3, EBS |
| `AWS::IAM::Role` | IAM role for EC2/Lambda, enforce MFA via trust policy |
| `AWS::IAM::Policy` | Permissions adhering to least-privilege principles |
| `AWS::EC2::Instance` | (Optional) EC2 instance with encrypted EBS |
| `AWS::EC2::Volume` | Encrypted EBS volume attached to EC2 |
| `AWS::EC2::VolumeAttachment` | Attach volume to EC2 if needed |
| `AWS::SSM::Parameter` | Store secure values dynamically referenced |
| `AWS::CloudFormation::Stack` | If nesting stacks for modularity |

---

### **Expected Output:**

A **CloudFormation YAML template** that:

* Uses **secure-by-default configurations**
* Adheres to **production-level best practices**
* Passes AWS CloudFormation validation
* Contains **no hardcoded secrets**
* Is **fully documented** (comments or `Description` fields)

---
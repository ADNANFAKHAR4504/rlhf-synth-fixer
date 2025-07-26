
# `model_failure.md`

A model failure response for this prompt would occur when the CloudFormation template:

---

### ❌ **YAML / CloudFormation Syntax Failures**

* Invalid YAML structure (e.g., indentation, list misalignment).
* Incorrect use of intrinsic functions like `!Ref`, `!Sub`, `!GetAtt`.
* Use of non-existent resource types like `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` outside supported usage context.
* Use of `Fn::Sub` where no variables exist (`W1020` warning).
* Deprecated or legacy properties used (e.g., `AccessControl` on S3) — `W3045`.

---

### ❌ **Missing Core Modules**

* No **VPC** and subnet configurations — fails network isolation and AZ distribution.
* Missing **IAM Roles** and Instance Profiles for EC2 access.
* No **CloudTrail** resource or logging bucket — lacks audit and traceability.
* No **EC2SecurityGroup** enforcing limited ingress/egress rules.
* **S3 Bucket** missing or insecurely configured (see below).

---

### ❌ **Security Best Practice Violations**

* IAM policies with `"Action": "*"` or `"Resource": "*"` without least privilege scoping.
* No **SSL-only policy** enforcement in S3 bucket (missing `aws:SecureTransport` denial).
* Public access enabled:

  ```yaml
  AccessControl: PublicRead  # ❌ insecure
  ```
* EC2 Security Group allows unrestricted inbound access:

  ```yaml
  CidrIp: 0.0.0.0/0  # ❌ on all ports or on sensitive ports like 22, 80, etc.
  ```
* CloudTrail logs and app data stored in the **same S3 bucket**, violating separation of concerns.

---

### ❌ **Tagging and Parameterization Issues**

* No `Tags` applied, such as `Environment`, `Owner`, or `Name`.
* Hardcoded strings instead of using parameters or dynamic references (`!Sub`, `!Ref`).
* Missing `Owner` parameter or inconsistent usage of `EnvironmentName` across modules.
* Tags missing on critical resources like:

  * VPC, Subnets
  * S3 Buckets
  * IAM Roles
  * NAT Gateway, IGW

---

### ❌ **KMS and Encryption Gaps**

* S3 bucket encryption uses `AES256` instead of `aws:kms`:

  ```yaml
  SSEAlgorithm: AES256  # ❌ Not aligned with best practices
  ```
* No `KMSMasterKeyID` provided when `aws:kms` is used.
* No encryption policy enforcement via tags (e.g., `Encryption: Enabled-KMS`).

---

### ❌ **Routing and Networking Misconfigurations**

* SubnetRouteTableAssociation resources are missing or incorrectly defined.
* Private subnets do not have route to NAT Gateway.
* Missing multi-AZ distribution across public/private subnets.

---

### ❌ **Output and Stack Usability Issues**

* Required `Outputs` are missing:

  * VPC ID, Subnet IDs, S3 bucket names/ARNs, IAM role ARNs
* `Export` fields missing, which limits stack referencing.
* Output values do not reference actual resource attributes (`!Ref` vs `!GetAtt` misuse).

---

### ❌ **Placeholders or Uncleaned Values**

* Any use of unresolved placeholders like:

  ```yaml
  BucketName: REPLACE_ME
  KeyName: <your-key-name>
  ```

---

### 📉 Example of a Failed Template

```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: PublicRead  # ❌ insecure
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256  # ❌ should be aws:kms
```

---

> ✅ A valid model output must implement **least privilege IAM**, **SSL-only access**, **KMS encryption**, **resource tagging**, **multi-AZ subnets**, **CloudTrail with separate bucket**, and **clean, deployable YAML** free from placeholders or deprecated syntax.

Let me know if you'd like a `.md` file or zipped folder for your dataset training!

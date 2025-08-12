# Model Failures and Required Fixes

This section documents the major issues found in the **model response** for the `secure-config-us-east-1.yml` CloudFormation template, compared against the project metadata requirements.

## **1. Missing Complete Tagging Policy (Critical Compliance Issue)**

**Issue**
The model output did not apply **`Environment`** and **`Owner`** tags consistently across **all** resources. Several resources like IAM Roles, AWS Config Rules, and CloudTrail Logs lacked required tags, violating the “tag all resources” constraint.

**Fix Required**
Add a `Tags` section to **every** AWS resource in the stack, preferably using parameterized values to avoid hardcoding.

---

## **2. AWS Config Rule Coverage Incomplete**

**Issue**
The model included AWS Config but did **not** implement a **CIS Benchmark compliance rule** for EC2 instances as required. No managed AWS Config rule like `CIS-EC2-Instance-Compliance` or equivalent custom rule was provided.

**Fix Required**
Define a managed AWS Config rule to check EC2 instance settings against CIS Benchmarks, and ensure it is associated with the Configuration Recorder and Delivery Channel.

---

## **3. S3 Encryption Missing KMS Key Rotation**

**Issue**
While S3 buckets were encrypted, the template did not configure a **KMS key with rotation enabled**. This is a compliance gap since the project explicitly requires KMS rotation for S3 encryption.

**Fix Required**
Create an `AWS::KMS::Key` resource with `EnableKeyRotation: true` and reference it in all S3 bucket encryption configurations.

---

## **4. IAM Policies Not Least Privilege**

**Issue**
IAM roles for EC2 and S3 access used overly broad permissions (e.g., `s3:*` instead of resource-scoped and action-specific permissions).

**Fix Required**
Refactor IAM policies to explicitly list required actions and resource ARNs. Remove wildcard `*` where not strictly necessary.

---

## **5. VPC Architecture Not Meeting Requirements**

**Issue**
The VPC in the model only contained public and private subnets — the **isolated subnet** requirement was missing.

**Fix Required**
Add an isolated subnet for security-sensitive workloads (like RDS) with **no Internet Gateway route**.

---

## **6. CloudTrail Encryption Not Configured**

**Issue**
CloudTrail logs were sent to S3 but not encrypted using the project KMS key.

**Fix Required**
Enable SSE-KMS encryption on the CloudTrail S3 bucket and reference the rotation-enabled KMS key.

---

## **7. RDS Public Exposure Risk**

**Issue**
RDS was deployed in a public subnet in the model’s output.

**Fix Required**
Deploy RDS into private subnets only and update its security group to restrict inbound access to **application layer only**.

---

## **8. Security Groups Overly Permissive**

**Issue**
Inbound rules allowed `0.0.0.0/0` for multiple ports without business justification.

**Fix Required**
Restrict inbound access to only required IP ranges and ports per the **principle of least privilege**.

---

## **9. EC2 Patch Management Missing**

**Issue**
No AWS Systems Manager Patch Manager configuration was provided to automate EC2 patching.

**Fix Required**
Add an `AWS::SSM::PatchBaseline` and associate it with EC2 instances through Maintenance Windows.

---

## **10. No Encryption in Transit Configurations**

**Issue**
Services like RDS, S3, and CloudFront lacked explicit TLS enforcement.

**Fix Required**
Enable `RequireSSL` for RDS parameter groups, enforce HTTPS for CloudFront distributions, and configure S3 bucket policies to deny non-SSL requests.

---

## **11. WAF Integration Missing**

**Issue**
AWS WAF was not included to protect web-facing applications.

**Fix Required**
Add an `AWS::WAFv2::WebACL` with managed rule groups and associate it with the CloudFront distribution.

---

## **12. CloudWatch Alarm Coverage Missing**

**Issue**
No CloudWatch metric filter or alarm for unauthorized API calls was provided.

**Fix Required**
Create a `AWS::Logs::MetricFilter` for `AccessDenied` events and a corresponding `AWS::CloudWatch::Alarm`.

---

## **Problem Statement**

The current CloudFormation template fails to meet multiple critical **security**, **compliance**, and **architecture** requirements outlined in the project metadata. The absence of complete tagging, least-privilege IAM roles, proper network segmentation, encryption configurations, and security monitoring mechanisms makes the environment **non-compliant** with the expected **PCI-DSS** and **CIS Benchmark** standards.

---

## **Code Extract Showing Issues**

Below is an example snippet from the model output highlighting missing encryption, tags, and least-privilege configurations:

```yaml
Resources:
  MyS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-app-bucket
      # Missing SSE-KMS encryption configuration
      # Missing required tags 'Environment' and 'Owner'

  MyIAMRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3FullAccess # Too broad, violates least privilege
      # Missing tags
```
---

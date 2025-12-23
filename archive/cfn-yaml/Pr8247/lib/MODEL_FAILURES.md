# MODEL_FAILURES

## Overview

This document records where a baseline LLM/model response typically **fails** to meet the prompt’s security and IaC requirements, and how the final implementation addresses those gaps. It’s meant to be a quick audit aid and regression reference.

## Summary of Common Failures

1. **S3 privacy not fully enforced**
   - Missing `PublicAccessBlockConfiguration` or incomplete bucket policies (e.g., no explicit deny for `aws:SecureTransport = false`)
   - No server-side encryption by default or wrong algorithm (AES256 instead of KMS when KMS is required)

2. **KMS key policy too permissive**
   - Over-broad `"Resource": "*"`, principals like `*`, or missing key usage constraints
   - Lacks separation of administrative vs. usage permissions

3. **IAM least privilege violations**
   - Policies use `"Action": "*"`, `"Resource": "*"`
   - Inline policies grant write/list on all buckets (not restricted to project buckets)

4. **EC2 root volume encryption gaps**
   - `BlockDeviceMappings.Ebs.Encrypted` omitted
   - No explicit `KmsKeyId` reference to the project KMS key

5. **Security group ingress too wide**
   - Uses `0.0.0.0/0` for SSH instead of a parameter‑driven /32 CIDR

6. **Logging not centralized**
   - S3 access logs sent to the same bucket or disabled entirely
   - No dedicated logs bucket with KMS encryption

7. **Hard‑coding / fragile substitutions**
   - Static ARNs and names instead of `Fn::Sub` + parameters for environment, uniqueness, and portability
   - Hard‑coded AMI IDs vs SSM public parameter resolution

8. **Missing required Outputs/Tags**
   - No exports for stack outputs needed by tests/integration
   - No `Environment`, `Owner`, `Project` tags

## Concrete Examples (from typical model output)

### (A) S3 bucket not fully private

**Problem snippet (model):**

```yaml
BucketPolicy:
  Statement:
    - Effect: Allow
      Principal: '*'
      Action: s3:GetObject
      Resource: !Sub arn:aws:s3:::my-bucket/*
```

**Issues**

- Public read allowed
- No HTTPS‑only guard (`aws:SecureTransport`)
- No Public Access Block

**Fix used**

- Add `PublicAccessBlockConfiguration` to buckets
- Restrictive bucket policy with explicit deny on insecure transport
- Scope access only to the application role and logging service

---

### (B) KMS key policy too broad

**Problem snippet (model):**

```yaml
KeyPolicy:
  Statement:
    - Effect: Allow
      Principal: '*'
      Action: 'kms:*'
      Resource: '*'
```

**Issues**

- World-writable KMS key policy
- No separation between admin ops and data‑plane usage

**Fix used**

- Explicit principals (account root for admin, specific roles for encrypt/decrypt)
- Limit actions by use case (Describe, Encrypt/Decrypt, GenerateDataKey)

---

### (C) IAM policies not least‑privileged

**Problem snippet (model):**

```yaml
Policies:
  - PolicyName: TooBroad
    PolicyDocument:
      Statement:
        - Effect: Allow
          Action: s3:*
          Resource: '*'
```

**Issues**

- Allows access to every bucket and object
- Violates least privilege

**Fix used**

- Restrict to project buckets with exact ARNs
- Split read vs write statements; remove wildcards

---

### (D) EC2 EBS encryption omitted

**Problem snippet (model):**

```yaml
Properties:
  BlockDeviceMappings:
    - DeviceName: /dev/xvda
      Ebs:
        VolumeSize: 20
        # Encrypted and KmsKeyId missing
```

**Fix used**

- Set `Encrypted: true` and `KmsKeyId: !Ref InfrastructureKMSKey`

---

### (E) Overly open SSH ingress

**Problem snippet (model):**

```yaml
SecurityGroupIngress:
  - IpProtocol: tcp
    FromPort: 22
    ToPort: 22
    CidrIp: 0.0.0.0/0
```

**Fix used**

- Parameterize `YourPublicIP` and require `/32`
- Validate with regex pattern in parameter constraints

---

## How the Final Template Addresses These

- **Buckets**: KMS encryption (CMK), full Public Access Block, HTTPS‑only via deny on insecure transport, centralized access logging to a dedicated logs bucket.
- **KMS**: Tight key policy with distinct admin vs usage permissions; app role limited to encrypt/decrypt/data key operations.
- **IAM**: Granular S3 statements per bucket path; no wildcard actions/resources.
- **EC2**: Root volume encryption enabled and pinned to project KMS key; AMI resolved via SSM public parameter.
- **Networking**: SSH restricted to parameterized `/32`.
- **Hygiene**: `Fn::Sub` and parameters for names/ARNs; required Outputs and Tags present.

## Out‑of‑Scope / Control‑Plane Items

These are **not** provisioned in this stack but are tracked as security controls at the account/organization level or separate stacks:

- **MFA for all console users** (AWS Organizations/IdP/SCIM/guardrails)
- **Account password policy** (can be done via `AWS::IAM::AccountPasswordPolicy` in a separate security baseline stack)
- **AWS Config rules framework** (recommended as a dedicated compliance stack)
- **CloudTrail org trails / centralization** (usually managed once per account/org)
- **CloudFront + WAF** (app‑edge stack when a distribution exists)
- **RDS non‑public, ElastiCache in VPC, ASG** (not required by this particular template; covered when those services are in scope)

## Regression Checks Added

- Unit tests enforce:
  - S3 KMS encryption + Public Access Block + logging to a dedicated bucket
  - IAM least‑privilege statements (no `*` on `Action`/`Resource`)
  - EC2 EBS encryption with `KmsKeyId`
  - Parameter validation (YourPublicIP, UniqueId)
  - Stable Outputs and Tag conventions

- Integration tests (where applicable) validate live resources’ effective policies and encryption posture.

## Known Limitations / Future Work

- Promote account‑wide controls (MFA, password policy, Config, CloudTrail) into a **baseline security** stack.
- Add optional modules for CloudFront+WAF and RDS/ElastiCache/ASG when those components are introduced.

---

**Status:** All failures observed in typical model responses are addressed in the implemented template; tests protect against regressions.

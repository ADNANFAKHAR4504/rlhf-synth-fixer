# MODEL FAILURES

### 1. S3 Buckets Must Be Private and Deny Public Access

**Requirement:** Buckets must be private by default, with explicit policies that deny public access.

**Model issue (invalid bucket policy `Resource` and brittle conditions):**

```yaml
CloudTrailLogsBucketPolicy:
  Properties:
    Bucket: !Ref CloudTrailLogsBucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: DenyPublicAccess
          Effect: Deny
          Principal: '*'
          Action: 's3:*'
          Resource:
            - !Sub '${CloudTrailLogsBucket}/*'
            - !Ref CloudTrailLogsBucket
          Condition:
            Bool:
              'aws:PrincipalIsAWSService': 'false'
            StringNotEquals:
              'aws:PrincipalServiceName':
                - cloudtrail.amazonaws.com
```

* **Why it fails:** `Resource` must be **ARNs**, e.g., `arn:aws:s3:::bucket` and `arn:aws:s3:::bucket/*`. The above uses a bucket **name** and a `!Ref` without `arn:` prefix. Also, conditions like `aws:PrincipalIsAWSService` / `aws:PrincipalServiceName` are non-standard for S3 bucket policies and add risk of invalid policy.
* **Impact:** Observed `CREATE_FAILED: Policy has invalid resource`.
* **Ideal fix (as in `tapstack.yml`):**

  * Use correct ARNs:

    * `arn:aws:s3:::${CloudTrailLogsBucket}`
    * `arn:aws:s3:::${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*`
  * Keep policy minimal and valid; rely on **PublicAccessBlock** for global block + precise `Allow` for service principals.



### 2. CloudTrail Must Be Enabled Across All Regions & Survive Quotas

**Requirement:** Multi-region CloudTrail with auditing; must deploy cleanly in accounts that already have trails.

**Model issue (no reuse/conditional path; quota collisions):**

```yaml
CloudTrail:
  Type: AWS::CloudTrail::Trail
  DependsOn: CloudTrailLogsBucketPolicy
  Properties:
    TrailName: !Sub 'secure-cloudtrail-${Environment}'
    S3BucketName: !Ref CloudTrailLogsBucket
    IncludeGlobalServiceEvents: true
    IsMultiRegionTrail: true
    EnableLogFileValidation: true
    KMSKeyId: !Ref CloudTrailKMSKey
```

* **Why it fails:** If the account already has trails (e.g., 6 in `us-east-1`), stack **fails**. No parameter/condition to **reuse an existing trail** or **skip creation**.
* **Impact:** `User: ... already has 6 trails ...` → hard failure blocks the stack.
* **Ideal fix:** Parameterized toggles (`CreateCloudTrailTrail`) and reuse inputs (`UseExistingCloudTrailBucket`, `UseExistingKMSCloudTrailKey`), so the stack **skips creation** or **reuses** existing resources without error.



### 3. AWS Config Must Monitor Tagging Compliance Across All Resources

**Requirement:** AWS Config must check tags (e.g., `Environment`, `Purpose`), and deliver to S3.

**Model issues:**

* **Wrong `InputParameters` type** (string blob instead of map):

```yaml
RequiredTagsRule:
  Properties:
    Source:
      Owner: AWS
      SourceIdentifier: REQUIRED_TAGS
    InputParameters: |
      {
        "tag1Key": "Environment",
        "tag2Key": "Purpose"
      }
```

* **Why it fails:** `InputParameters` must be a **map**, not a JSON string.
* **Bucket policy `Resource` invalid** (same S3 ARN mistake as CloudTrail bucket policy).
* **Delivery channel not guarded:** Only **one** `DeliveryChannel` per account/region. The model unconditionally creates one—fragile if one already exists.

**Impact:** Policy and type errors → `CREATE_FAILED` and **ConfigurationRecorder** gets **cancelled** due to dependencies.

**Ideal fix:**

* Use map form:

```yaml
InputParameters:
  tag1Key: Environment
  tag2Key: Purpose
```

* Correct S3 ARNs.
* Add `CreateConfigDeliveryChannel` toggle and parameterized bucket reuse.



### 4. Lambda Functions Must Run in a VPC

**Requirement:** Lambda must be in VPC.

**Model status:** **Meets core requirement**

```yaml
SecureLambdaFunction:
  Properties:
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds: !Ref PrivateSubnetIds
```

* **Note:** Good. The ideal response adds **conditional creation** (`CreateLambdaInVpc`) and **role reuse** to handle pre-existing roles—more robust for production.



### 5. RDS Must Use KMS CMK for Encryption

**Requirement:** Data at rest encrypted with **Customer Managed Key**.

**Model status:** **Meets requirement** (with room to improve resilience)

```yaml
SecureRDSInstance:
  Properties:
    StorageEncrypted: true
    KmsKeyId: !Ref RDSKMSKey
```

* **Note:** Correct. The ideal response adds **`UseExistingKMSRDSKey`** and **`UseExistingRDSSubnetGroup`** to avoid churn and failures in busy accounts.



### 6. Only IAM Roles Should Be Assumable; Avoid Root Principal Use

**Requirement:** Do not rely on root for role assumptions; enforce least-privilege.

**Model issues:**

* **Unnecessary deny on root in trust policy:**

```yaml
LambdaExecutionRole:
  Properties:
    AssumeRolePolicyDocument:
      Statement:
        - Effect: Allow
          Principal: { Service: lambda.amazonaws.com }
          Action: sts:AssumeRole
        - Effect: Deny
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: sts:AssumeRole
```

* **Why it’s problematic:** The additional `Deny` is redundant and can be misleading; trust should simply allow the **service principal** and not enumerate denials.
* **KMS key policies:** Model grants account root `kms:*` (common bootstrap pattern), but does not scope principals with least privilege.

**Ideal fix:**

* Keep trust minimal (service principal only).
* In KMS, keep the required root bootstrap but prefer **scoped statements** for services that need the key.

---

### 7. ALB Must Enforce SSL/TLS and Be Correctly Placed

**Requirement:** HTTPS-only for ALB; TLS policy enforced; redirect HTTP→HTTPS.

**Model issues:**

* **Subnet misplacement:**

```yaml
ApplicationLoadBalancer:
  Properties:
    Scheme: internet-facing
    Subnets: !Ref PrivateSubnetIds   # should be public subnets
```

* **Hard-coded certificate ARN:**

```yaml
HTTPSListener:
  Properties:
    Certificates:
      - CertificateArn: !Sub 'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/example-cert-id'
```

* **Why it fails:** An internet-facing ALB must be deployed in **public subnets**; using private subnets will prevent external access. Hard-coded ACM ARN blocks portability and fails if the certificate doesn’t exist.

**Ideal fix:**

* Use `PublicSubnetIds` for internet-facing ALB and parameterize the certificate via `AcmCertificateArn`.
* TLS policy updated to modern baseline in ideal response (`ELBSecurityPolicy-TLS13-1-2-2021-06`).



### 8. Resilience in Busy / Contended Environments (Reuse vs. Create)

**Requirement (implicit from deployment constraints):** Template must succeed when quotas are reached or resources already exist.

**Model issues:**

* No `UseExisting*` or `Create*` controls for **CloudTrail**, **S3 buckets**, **KMS keys**, **IAM roles**, **RDS subnet group**, **RDS instance**, **Config delivery channel**.
* **Observed impacts:**

  * CloudTrail quota reached → hard fail.
  * S3 policy invalid → cascade cancellations (Config recorder).

**Ideal fix:**

* Comprehensive conditional toggles and reuse parameters:

  * `CreateCloudTrailTrail`, `UseExistingCloudTrailBucket`, `UseExistingKMSCloudTrailKey`
  * `CreateConfigDeliveryChannel`, `UseExistingConfigBucket`
  * `UseExistingLambdaRole`, `UseExistingRDSSubnetGroup`, `UseExistingRDS`, `UseExistingKMSRDSKey`
* Add **`Retain`** policies for buckets to avoid destructive replacements.



## Additional Observations

* **Ordering & Dependencies:** Model used `DependsOn` for CloudTrail→BucketPolicy, but the root issue was invalid S3 ARNs; ideal response corrects policy resources and reduces brittle coupling via conditions.
* **Tagging Coverage:** Model tags major resources; ideal response enforces required tags via AWS Config rule using correct parameter type.
* **Parameterization & Portability:** Ideal response removes hard-coded values (e.g., ACM cert) and replaces with parameters, improving reuse across accounts/regions.



## Conclusion

The **model response** satisfies parts of the brief (Lambda in VPC, RDS with CMK, ALB HTTPS listener), but **fails** key production-grade requirements:

* Invalid S3 bucket policy ARNs and brittle conditions.
* No conditional/reuse strategy → breaks in real, quota-limited accounts.
* AWS Config rule typed incorrectly; delivery channel unguarded.
* ALB deployed to private subnets for an internet-facing load balancer.
* Hard-coded ACM certificate.

The **ideal response** corrects these by:

* Fixing S3 policy ARNs and simplifying conditions.
* Introducing comprehensive **create/reuse** toggles.
* Correcting AWS Config parameters and delivery channel guard.
* Ensuring ALB is in **public** subnets and TLS is strictly enforced.
* Parameterizing external dependencies (ACM cert, existing resources) and adding `Retain` where appropriate.

## **Model Failures**

### **1. CloudTrail Setup**

**Failure Statement:**
The model attempted to create CloudTrail resources without checking for existing trails. In environments with quotas already reached, this caused `CREATE_FAILED` errors.

**Requirement in Prompt:**

* Enable AWS CloudTrail logging in all regions for auditing purposes.
* Must handle environments where trails already exist.

**Model Response Issue:**

```yaml
Resources:
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      S3BucketName: !Ref CloudTrailLogsBucket
```

* No conditional logic or `DependsOn` to check existing trails.
* No handling for quota limits.

**Corrected Implementation:**

* Uses a **condition to create CloudTrail only if it doesn’t exist**.
* References the proper **S3 bucket** and ensures bucket creation before applying policies.

---

### **2. CloudTrail Logs Bucket Policy**

**Failure Statement:**
Bucket policy in model response failed because it referenced a bucket that might not exist yet.

**Requirement in Prompt:**

* S3 buckets must be private and deny public access.
* Policies must attach correctly only after bucket creation.

**Model Response Issue:**

```yaml
Resources:
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Statement:
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource: !Sub "${CloudTrailLogsBucket.Arn}/*"
```

* Direct reference to bucket ARN failed if bucket not yet created.

**Corrected Implementation:**

* Conditional creation using `!If` or parameters for existing buckets.
* Ensures bucket exists before applying the policy.

---

### **3. Config S3 Bucket & Bucket Policy**

**Failure Statement:**
AWS Config bucket and its policy failed because CloudTrail creation failed first; model didn’t consider dependency order.

**Requirement in Prompt:**

* AWS Config should monitor compliance and store logs in S3.
* Bucket must exist before policy or recorder creation.

**Model Response Issue:**

```yaml
Resources:
  ConfigBucket:
    Type: AWS::S3::Bucket
  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
```

* Policy references bucket directly without dependency checks.
* No conditional logic for existing bucket.

**Corrected Implementation:**

* Implements **dependency on bucket creation**.
* Adds condition to **reuse existing bucket** if it already exists.

---

### **4. Configuration Recorder**

**Failure Statement:**
Creation failed because dependent resources (S3 bucket, IAM role) didn’t exist.

**Requirement in Prompt:**

* Must ensure AWS Config recorder starts successfully.

**Model Response Issue:**

```yaml
Resources:
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
```

* No check if `ConfigRole` exists.
* Cancels automatically if bucket or role creation fails.

**Corrected Implementation:**

* Adds **conditional creation for recorder**.
* Ensures **roles and buckets exist** first.

---

### **5. Lambda Functions in VPC**

**Failure Statement:**
The model did not enforce VPC deployment for Lambda functions as required.

**Requirement in Prompt:**

* Ensure Lambda runs **inside a VPC**.

**Model Response Issue:**

```yaml
Resources:
  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
```

* No `VpcConfig` property.

**Corrected Implementation:**

* Adds `VpcConfig` with `SubnetIds` and `SecurityGroupIds`.

---

### **6. RDS CMK Encryption**

**Failure Statement:**
RDS instance in model response did not reference a KMS CMK for encryption.

**Requirement in Prompt:**

* RDS data at rest must use **KMS Customer Managed Key**.

**Model Response Issue:**

```yaml
Resources:
  MyRDS:
    Type: AWS::RDS::DBInstance
    Properties:
      StorageEncrypted: true
```

* Uses default KMS key instead of CMK.

**Corrected Implementation:**

* References **existing or new KMS CMK** for encryption.

---

### **7. ALB SSL Enforcement**

**Failure Statement:**
Application Load Balancer listeners did not enforce HTTPS / TLS.

**Requirement in Prompt:**

* All ALB listeners must enforce **SSL/TLS**.

**Model Response Issue:**

```yaml
Resources:
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
```

* No `Certificates` or `Protocol` enforcement for HTTPS.

**Corrected Implementation:**

* Adds `Protocol: HTTPS` and certificate references.
* Adds HTTP → HTTPS redirection where applicable.



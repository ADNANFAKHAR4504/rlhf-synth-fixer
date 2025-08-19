### MODEL_FAILURES.md

The following are three significant issues in `MODEL_RESPONSE.md`, based on expert-level criteria and in comparison with `IDEAL_RESPONSE.md`:

---

#### 1. Missing Lambda Deployment (Critical)

**Issue:**  
The model defines an IAM role intended for Lambda but never instantiates a Lambda function or related resources.

**Why it matters:**  
This violates a core requirement:  
> "Employ AWS Lambda for region-specific computation needs based on Python runtime."  
Without Lambda, the infrastructure is functionally incomplete.

---

#### 2. Hardcoded AMI Reference (Critical)

**Issue:**  
The EC2 instance configuration uses a hardcoded AMI tied to `us-east-1`.

**Why it matters:**  
This breaks the multi-region deployment requirement and undermines portability. The `IDEAL_RESPONSE.md` correctly uses `aws.ec2.get_ami()` to dynamically fetch region-specific AMIs.

---

#### 3. Incorrect and Overcomplicated S3 Encryption Configuration (Moderate)

**Issue:**  
The model uses `BucketServerSideEncryptionConfigurationV2` with unnecessary nesting and potentially incorrect fields.

**Why it matters:**  
This complicates the implementation and may lead to drift or errors. The ideal implementation uses the simpler and idiomatic `BucketServerSideEncryptionConfiguration` approach aligned with Pulumi best practices.

---

#### 4. Missing Monitoring/CloudWatch Integration (Critical)

**Issue:**  
There is no monitoring component in the model. It lacks any CloudWatch metric alarms, log groups, or alerting configuration.

**Why it matters:**  
This violates the explicit requirement to monitor infrastructure using CloudWatch and set alarms for unexpected behavior. Without monitoring, the system lacks operational observability and resilience.

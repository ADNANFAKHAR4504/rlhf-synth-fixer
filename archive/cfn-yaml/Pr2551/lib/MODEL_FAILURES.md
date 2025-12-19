The common mistakes and deployment/lint failures that occurred during iterative generation of `lib/TapStack.yml`.

---

## 1. Availability Zone (AZ) Errors
**Error:**
Template error: Fn::Select cannot select nonexistent value at index 1

markdown
Copy code

**Cause:**
- Used `!Select [1, !GetAZs ""]` in a region with only **1 Availability Zone**.
- Attempting to spread subnets across AZs without checking availability.

**Fix:**
- Defaulted all subnets to **AZ0** (`!Select [0, !GetAZs ""]`) for a single-AZ safe template.
- Alternatively, multi-AZ variant must explicitly require 2 AZs.

---

## 2. Hardcoded AMI Errors
**Error:**
The image id 'ami-0c55b159cbfafe1f0' does not exist

rust
Copy code

**Cause:**
- AMI IDs are region-specific and change frequently.
- Hardcoding an AMI caused invalid references.

**Fix:**
- Use **SSM Parameter Store lookups**:
  ```yaml
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
3. CloudTrail Errors
a. Bucket Policy Missing
Error:

csharp
Copy code
Invalid request provided: Incorrect S3 bucket policy is detected for bucket...
Cause:

CloudTrail requires a specific S3 bucket policy to deliver logs.

Fix:

Added TrailBucketPolicy with s3:GetBucketAcl and s3:PutObject for CloudTrail service principal.

b. Trail Quota Exceeded
Error:

sql
Copy code
User already has 5 trails in us-east-1
Cause:

AWS allows a maximum of 5 trails per region.

Template tried to create a new trail, exceeding quota.

Fix:

Removed AWS::CloudTrail::Trail resource.

Kept only S3 bucket + policy for central logging.

4. AWS Config Errors
Error:

pgsql
Copy code
Failed to put configuration recorder because you have reached the limit for the maximum number of customer managed configuration records: (1)
Cause:

Only 1 ConfigurationRecorder is allowed per region.

Template attempted to create a duplicate.

Fix:

Made AWS Config optional:

yaml
Copy code
EnableConfig: {Default: "false"}
Condition: CreateConfig
Config resources (ConfigRole, ConfigRecorder) created only if explicitly enabled.

5. Lint Errors
a. Invalid SSM Declaration
Error:

rust
Copy code
Resource type 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>' does not exist
Cause:

Declared LatestAmiId as a Resource instead of Parameter.

Fix:

Moved to Parameters section.

b. Unused Parameters
Error:

sql
Copy code
W2001 Parameter EnvironmentName not used
Cause:

EnvironmentName defined but not referenced.

Fix:

Added Tags with EnvironmentName across resources.

6. Overly Aggressive IAM Policies
Error:

pgsql
Copy code
Policy arn:aws:iam::aws:policy/service-role/AWSConfigRole does not exist or is not attachable
Cause:

Mistyped policy ARN.

Fix:

Correct ARN: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole.

7. General Design Failures
Tried to enforce multi-AZ RDS in regions with only 1 AZ → failed AZ coverage requirement.

Introduced duplicate sections (Conditions) in YAML.

Misused properties (SecureString type in Parameters, unsupported KeyId field in BucketEncryption).

Summary of Failure Modes
AZ index selection → Fixed with single-AZ fallback.

Hardcoded AMI → Fixed with SSM lookup.

CloudTrail quota/policy → Fixed by skipping trail, only making bucket+policy.

Config quota → Fixed by making Config optional.

Lint warnings → Fixed with correct parameter/resource usage and tagging.

Typos in AWS ARNs/properties → Corrected to valid values.
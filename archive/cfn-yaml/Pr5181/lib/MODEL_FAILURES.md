# model_failure

## Frequent failure modes and how to avoid them

### 1 Multiple YAML documents or prose in file

**Symptom:** Parser error like “expected a single document” or unexpected tokens.
**Root cause:** Narrative text or Markdown placed above the YAML.
**Fix:** Ensure the file contains **only** YAML. No headings, no comments outside YAML.

### 2 Required parameter not set (`KeyName`)

**Symptom:** Validation error indicating `Parameters:[KeyName] must have values`.
**Root cause:** `KeyName` defined without a default and not supplied at deploy time.
**Fix:** Make `KeyName` optional with an empty default and a `UseKeyName` condition. Omit the property with `AWS::NoValue` when empty.

### 3 Incorrect EIP association in VPC

**Symptom:** EIP association fails.
**Root cause:** Using the `EIP` property instead of `AllocationId` for VPC EIPs.
**Fix:** Use `AllocationId: !GetAtt ElasticIP.AllocationId` in `AWS::EC2::EIPAssociation`.

### 4 CloudTrail cannot write to S3

**Symptom:** CloudTrail create/logging errors referencing S3 policy or ACL.
**Root cause:** Missing `GetBucketAcl` or `PutObject` with `bucket-owner-full-control`.
**Fix:** Add bucket policy statements for ACL check and `PutObject` to `AWSLogs/${AccountId}/*` with the ACL condition.

### 5 KMS policy blocks CloudTrail

**Symptom:** CloudTrail errors about KMS access or decrypt/generate key failures.
**Root cause:** CMK policy missing CloudTrail permissions or encryption context.
**Fix:** Add a statement allowing `cloudtrail.amazonaws.com` `kms:Encrypt/Decrypt/ReEncrypt*/GenerateDataKey*/DescribeKey` with the CloudTrail encryption context condition.

### 6 Alarm actions don’t trigger scaling

**Symptom:** Alarms transition state but ASG capacity doesn’t change.
**Root cause:** Alarm `AlarmActions` using `Ref` instead of scaling policy **ARN**.
**Fix:** Use `!GetAtt Scale{In,Out}Policy.Arn` in the alarm actions.

### 7 Linter warnings for unnecessary substitutions

**Symptom:** `W1020 'Fn::Sub' isn't needed` warnings.
**Root cause:** Using `Fn::Sub` where no placeholders are present.
**Fix:** Replace with plain literal or a simpler intrinsic; keep `Fn::Sub` only where variables are interpolated.

### 8 Missing encryption or public access block on S3

**Symptom:** Security review or compliance failures.
**Root cause:** No SSE-KMS or missing PublicAccessBlock configuration.
**Fix:** Define `BucketEncryption` with CMK and enable all four PublicAccessBlock settings.

### 9 SSM patching has no effect

**Symptom:** Association created but patching doesn’t run.
**Root cause:** Instances not managed by SSM or targets don’t match.
**Fix:** Attach `AmazonSSMManagedInstanceCore` to the role and ensure instances/ASG instances carry the targeted `Project=TapStack` tag.

### 10 AZ portability issues

**Symptom:** Stack fails in some accounts/regions.
**Root cause:** Hardcoded AZ names or insufficient AZ count assumptions.
**Fix:** Derive AZs using `Fn::GetAZs` and `Select` indices.

## Regression checklist

* Single YAML document, no stray text.
* `KeyName` empty by default; `UseKeyName` condition omits the property across Instances and Launch Template.
* EIP association uses `AllocationId`.
* S3 bucket has versioning, KMS encryption, full public access block.
* Bucket policy includes ACL check and `PutObject` with `bucket-owner-full-control`.
* KMS policy allows CloudTrail with correct actions and context.
* CloudWatch alarms reference scaling policy **ARNs**.
* UserData installs and serves a simple HTML page for port 80 validation.
* All resources tagged with `Environment=prod` and `Project=TapStack`.
* `cfn-lint` runs cleanly with no errors; remove avoidable warnings such as unnecessary substitutions.

## Notes

* The design intentionally keeps instances in **public subnets** with an IGW and SG allowing 80/22 as required by the prompt.
* The pattern is minimal yet production-grade on security (KMS, least privilege, SSM, logging) and can be extended to private subnets + NAT/ALB without refactoring core components.

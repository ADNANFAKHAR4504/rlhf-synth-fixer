This document outlines the failures encountered during iterative generation of the `lib/TapStack.yml` CloudFormation template.  
Each failure category includes the error message, cause, and resolution applied in later versions.

---

## Parameter & Secrets Issues

### 1. `W1011 Use dynamic references over parameters for secrets`
- **Cause**: Direct use of `DBPassword` parameter as RDS password.  
- **Fix**: Introduced `AWS::SecretsManager::Secret` to store the password securely, resolved with `{{resolve:secretsmanager:...}}`.

### 2. `Could not parse SecretString JSON`
- **Cause**: Secrets Manager expects JSON, but raw string was stored.  
- **Fix**: Stored password in JSON format (`{"password":"...value..."}`), and referenced via `{{resolve:secretsmanager:...::password}}`.

### 3. `DBPassword` Parameter Not Used
- **Cause**: Earlier refactoring left parameter defined but unused.  
- **Fix**: Ensured parameter was embedded in `DBSecret.SecretString`.

### 4. RDS Username Error
- **Error**:  
MasterUsername admin cannot be used as it is a reserved word

yaml
Copy code
- **Cause**: `admin` is reserved in PostgreSQL.  
- **Fix**: Changed default to `dbmaster`.

---

## Config Service Limits

### 5. Config Delivery Channel Error
- **Error**:  
MaxNumberOfDeliveryChannelsExceededException

markdown
Copy code
- **Cause**: AWS allows only one delivery channel per account/region.  
- **Fix**: Removed `AWS::Config::DeliveryChannel`.

### 6. Config Recorder Error
- **Error**:  
MaxNumberOfConfigurationRecordersExceededException

yaml
Copy code
- **Cause**: AWS allows only one configuration recorder per account/region.  
- **Fix**: Removed `AWS::Config::ConfigurationRecorder`.

---

## CloudTrail Issues

### 7. CloudTrail Create Failed — Incorrect Bucket Policy
- **Error**:  
Invalid request provided: Incorrect S3 bucket policy is detected for bucket

markdown
Copy code
- **Cause**: Missing required permissions for CloudTrail service principal.  
- **Fix**: Added explicit `s3:GetBucketAcl` and `s3:PutObject` with condition `s3:x-amz-acl: bucket-owner-full-control` on bucket policy.

---

## Miscellaneous Issues

### 8. KeyPairName Parameter Required
- **Cause**: Initially stack required EC2 key pair for bastion.  
- **Fix**: Removed key pair requirement and switched to SSM Session Manager for bastion access.

### 9. Lint Errors (`E3030 'SecureString' is not one of ...`)
- **Cause**: Tried to define parameter type as `SecureString`.  
- **Fix**: Replaced with `String` and stored securely in Secrets Manager instead.

---

## Lessons Learned
- Always use **Secrets Manager JSON** for passwords instead of raw strings.  
- Remove account-wide unique resources (Config Recorder, Delivery Channel) from templates meant to be reusable.  
- Respect RDS reserved usernames (`admin`, `postgres`, `rdsadmin`).  
- CloudTrail **must** have very strict bucket policy alignment.  
- Bastion hosts should rely on **SSM Session Manager**, not SSH key pairs.  

---
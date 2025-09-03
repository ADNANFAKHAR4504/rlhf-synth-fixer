## Purpose

This document lists common failure scenarios during the deployment of the `secure-single-region-setup.json` CloudFormation template and provides guidance on how to diagnose and resolve them effectively.

---

## 1. Template Validation Failure

**Error Message:**

```
Template format error: JSON not well-formed
```

**Cause:**

* Missing commas, quotes, or unescaped characters in the JSON.
* Improper structure or use of unsupported functions.

**Resolution:**

* Use `aws cloudformation validate-template` before deployment:

  ```bash
  aws cloudformation validate-template --template-body file://secure-single-region-setup.json
  ```
* Use a JSON linter or online validator to confirm formatting.

---

## 2. IAM Role Creation Failure

**Error Message:**

```
API: iam:CreateRole User is not authorized to perform: iam:CreateRole
```

**Cause:**

* Insufficient IAM permissions to create roles or attach managed policies.

**Resolution:**

* Ensure the deploying user or role has the following permissions:

  * `iam:CreateRole`
  * `iam:AttachRolePolicy`
  * `iam:PassRole`
* Use an administrator role or request permissions from your security team.

---

## 3. KMS Key or Encryption Errors

**Error Message:**

```
KMS key does not exist or is not usable
```

**Cause:**

* Incorrect KMS key reference.
* Missing permissions to use or manage the KMS key.

**Resolution:**

* Confirm the key exists and has the correct alias (`alias/secureKey`).
* Ensure the necessary services (e.g., S3, ALB) are granted `kms:Encrypt` and `kms:Decrypt` permissions via the key policy.

---

## 4. Shield Protection Resource Failure

**Error Message:**

```
Shield Advanced subscription required
```

**Cause:**

* Shield Advanced is not activated in your account.

**Resolution:**

* Subscribe to AWS Shield Advanced from the AWS console under **AWS Shield**.
* If not required, you can remove the `AWS::Shield::Protection` resource from the template.

---

## 5. WAF Association Failure

**Error Message:**

```
ResourceArn is not valid for WAF WebACL association
```

**Cause:**

* The ARN format for API Gateway association is incorrect or the deployment is incomplete.

**Resolution:**

* Ensure the API Gateway is fully deployed with a valid stage (`prod`).
* Double-check that the ARN follows this format:

  ```
  arn:aws:apigateway:{region}::/restapis/{rest-api-id}/stages/{stage-name}
  ```

---

## 6. Lambda VPC Configuration Errors

**Error Message:**

```
Subnet IDs or Security Group IDs not valid
```

**Cause:**

* Lambda is referencing subnets or security groups that don't exist or aren't properly configured.

**Resolution:**

* Make sure the referenced private subnets exist.
* Attach a valid security group (even an empty one will prevent the error).
* Ensure Lambda has network access to resources it needs (e.g., Secrets Manager, VPC endpoints).

---

## 7. CloudWatch Alarm Configuration Failure

**Error Message:**

```
Invalid metric or dimension
```

**Cause:**

* EC2 metrics specified without proper dimensions (e.g., missing InstanceId).

**Resolution:**

* Either add a specific EC2 instance and its `InstanceId` as a dimension or use a different metric with no required dimension.

---

## 8. S3 Bucket Access Denied

**Error Message:**

```
Access Denied when writing ALB logs or AWS Config data
```

**Cause:**

* The necessary services (e.g., ALB, AWS Config) do not have permissions to write to the S3 bucket.

**Resolution:**

* Ensure the S3 bucket policy allows:

  * `delivery.logs.amazonaws.com` for ALB
  * `config.amazonaws.com` for AWS Config
* Ensure bucket encryption is properly set with a valid KMS key.

---

## 9. Stack Rollback on Resource Creation

**Error Message:**

```
The following resource(s) failed to create: [ResourceName]
```

**Cause:**

* Dependency failure or misconfigured parameters.

**Resolution:**

* Check the CloudFormation **Events** tab for the failure reason.
* Validate parameter values such as VPC CIDRs and thresholds.
* Test smaller sections of the template if needed.

---

## 10. General Stack Deployment Failure

**Possible Causes:**

* Region-specific service availability (e.g., Shield Advanced, WAF).
* Hardcoded availability zones that don’t exist in the chosen region.
* Missing required capabilities like `CAPABILITY_NAMED_IAM`.

**Resolution:**

* Always deploy using:

  ```bash
  aws cloudformation deploy \
    --template-file secure-single-region-setup.json \
    --stack-name secure-env \
    --capabilities CAPABILITY_NAMED_IAM
  ```

---
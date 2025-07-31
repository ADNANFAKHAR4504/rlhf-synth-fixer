# MODEL_FAILURES.md

## Analysis of Faults in MODEL_RESPONSE.md

Below are the critical issues identified when comparing `MODEL_RESPONSE.md` with `IDEAL_RESPONSE.md`:

---

### **1. Incorrect use of S3 bucket for pipeline source**
- **Fault:**  
  The pipeline `S3SourceAction` in `MODEL_RESPONSE.md` uses the same S3 bucket that hosts the static website as the source bucket:
  ```python
  source_action = cpactions.S3SourceAction(
      action_name="S3Source",
      bucket=site_bucket,   # Using site bucket as source
      bucket_key="site.zip",
      ...
  )
  ```
- **Why it's a problem:**  
  This mixes responsibilities and violates best practices. The artifact bucket used for pipeline sources should be separate from the static site bucket.

- **Correct (from IDEAL_RESPONSE.md):**  
  Uses a dedicated artifact bucket (`ArtifactBucket`) for pipeline sources and uploads the zip via `BucketDeployment`.

---

### **2. Overly permissive IAM policies**
- **Fault:**  
  The CodeBuild role in `MODEL_RESPONSE.md` is granted `AdministratorAccess`:
  ```python
  managed_policies=[
      iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess")
  ]
  ```
- **Why it's a problem:**  
  This violates the principle of least privilege and gives CodeBuild unrestricted access to the AWS account.

- **Correct (from IDEAL_RESPONSE.md):**  
  IAM roles are defined with specific permissions for S3, CloudWatch, CodePipeline, CloudFront, Route53, and ACM, instead of broad admin access.

---

### **3. Static site resources not implemented in Terraform as required**
- **Fault:**  
  `MODEL_RESPONSE.md` provisions the static website bucket, CloudFront distribution, and Route53 records directly in CDK:
  ```python
  self.site_bucket = s3.Bucket(...)
  self.distribution = cloudfront.Distribution(...)
  route53.ARecord(...)
  ```

- **Why it's a problem:**  
  The prompt explicitly requires static site resources (S3, CloudFront, Route53) to be deployed using **Terraform**, while CDK should only handle the CI/CD pipeline.

- **Correct (from IDEAL_RESPONSE.md):**  
  Static site resources are fully implemented in Terraform, including bucket policies, ACM validation, CloudFront distribution, and Route53 records.

---

## Summary
1. Pipeline uses the same bucket as the static site bucket for sources (wrong separation of responsibilities).
2. IAM policies are overly permissive (`AdministratorAccess`) instead of least privilege.
3. Violates requirement to deploy static site infrastructure (S3, CloudFront, Route53) in Terraform.
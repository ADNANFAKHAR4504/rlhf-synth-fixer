## Model-Failures & Weaknesses Given Your Constraints

### 1. Lack of explicit AWS CodePipeline/CodeBuild/CodeDeploy resources

The prompt emphasizes CI/CD pipeline integration, but the model does not define AWS CodePipeline, CodeBuild, or CodeDeploy resources explicitly.  
Instead, it provides a rollback Lambda as a custom function to manage rollback logic, implying that pipeline orchestration is either external or minimal.  
This divergence means the deployed infrastructure itself does not create or manage the CI/CD pipeline.

---

### 2. Rollback logic as Lambda function, not native AWS rollback features

The rollback function is implemented as a custom Lambda that attempts to detect failure and trigger rollback, rather than using CodeDeploy’s built-in auto-rollback features.  
While understandable given the lack of direct CI/CD account access, this deviates from production best practices and the expectations of the prompt.

---

### 3. Simplified or placeholder centralized logging

The model provisions a CloudWatch Dashboard and a centralized S3 bucket but does not implement true cross-region log aggregation or export (e.g., cross-account/event routing).  
This results in more of a conceptual dashboard than a fully integrated observability solution.

---

### 4. Lambda runtime version mismatch

The Lambdas use **Python 3.9**, even though the prompt expects **Python 3.11**.

---

### 5. Older or basic S3 encryption configuration

The model relies on `BucketServerSideEncryptionConfiguration (v1)` instead of the newer and preferred `BucketServerSideEncryptionConfigurationV2`.

---

### 6. Permissive IAM policies in rollback Lambda

The rollback Lambda uses `"Resource": "*"` in its IAM policy, granting overly broad permissions rather than scoped, least-privilege access.

---

### 7. Async/concurrent patterns are complex for Pulumi

The rollback Lambda leverages Python concurrency (`ThreadPoolExecutor`) for health checks. While clever, this adds unnecessary complexity, making the solution harder to maintain and test.

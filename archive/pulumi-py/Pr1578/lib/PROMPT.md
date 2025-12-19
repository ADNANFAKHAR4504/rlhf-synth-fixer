## Prompt

You are an expert DevOps engineer tasked with designing and implementing an expert-level CI/CD pipeline integration using Pulumi and Python.

Due to project limitations, note the following constraints before implementation:

- We do **not** have direct access to the AWS account (provisioning and validation are tested via Pulumi mocks and boto3 integration tests).
- The **CI/CD pipeline flow cannot be modified**. Instead, we provision the pipeline infrastructure within Pulumi itself.
- Where AWS lookups may fail (e.g., CodeCommit repositories not available), **dummy values** and safe fallbacks must be used so that the Pulumi program compiles and runs in all environments.

---

### Core Requirements

- **Multi-Region Deployment**  
  Provision the serverless application concurrently across three AWS regions:  
  `us-east-1`, `us-west-2`, and `eu-central-1`.  
  Use separate providers inside the Pulumi program, ensuring resources are created consistently.

- **Automatic Rollback**  
  Since CI/CD rollback hooks cannot be altered, emulate rollback safety by:
  - Using **aliases for Lambda functions** and deploying through **traffic-shift strategies** (e.g., CodeDeploy-style blue/green).
  - Ensuring that failed resources in one region do not leave partial infrastructure behind (Pulumi stack consistency across providers).

- **Tagging Standardization**  
  Apply the following tags to **all resources**:
  - `Environment: Production`
  - `Project: CICDIntegration`

  Use Pulumi `default_tags` to enforce this globally.

- **Deployment Speed**  
  Ensure resources are provisioned **in parallel** across regions to complete within **15 minutes** wall-clock time.  
  Avoid unnecessary sequential dependencies.

- **Pulumi State Security**  
  Use a single **S3 bucket** for Pulumi state management:
  - Versioning enabled
  - Public access blocked
  - SSE-KMS encryption enforced

  Bucket naming should follow a deterministic, globally unique pattern.

- **Centralized Observability**  
  Implement **CloudWatch logging and metrics aggregation**:
  - Each region’s Lambda functions send logs to a CloudWatch LogGroup.
  - Logs are exported or aggregated into a **primary region (us-east-1)** for central access.
  - Monitoring dashboards and alarms are provisioned in the primary region.

---

### Implementation Notes

- **CodeCommit & Pipeline Handling**
  - If repository lookups fail, define safe dummy outputs (`repo_name_out`, `repo_arn_out`, `repo_clone_http_out`) to avoid runtime crashes.
  - CodePipeline Source and IAM policies must reference these dummy values.

- **IAM Policies**
  - Default to least privilege, but where exact ARNs cannot be known (due to fallbacks), use `"Resource": "*"` with documented justification.
  - Regional providers must use `aws.get_region()` assigned to a variable before referencing (avoid `aws.get_region..` syntax errors).

- **Providers**  
  A provider is explicitly created per region (`us-east-1`, `us-west-2`, `eu-central-1`), and stored in a dictionary for clean use across resources.

---

**Areas for improvement:**

- **IAM Policy Scope:**  
  Some IAM policies assign `"Resource": "*"` broadly for Lambda and API Gateway actions. Tightening those to specific ARNs where possible would improve security (least privilege).

- **No Explicit Rollback Stage in Pipeline:**  
  Rollbacks could be better emphasized by using CodePipeline's native rollback actions or AWS Lambda deployment preferences.

- **No Deploy Stage in CodePipeline:**  
  The pipeline contains Source and Build stages but lacks an explicit deployment stage that updates Lambda alias or infrastructure.

- **Buildspec Could Be More Detailed:**  
  The buildspec currently updates Lambda code and alias but could also run infrastructure provisioning (Pulumi CLI commands) if needed.

- **Minor Styling and Documentation:**  
  The script could benefit from inline comments explaining key sections or helper functions for reusability.

- **No Separate Environments Handling:**  
  Multi-environment isolation (e.g., dev/staging/prod) isn’t shown explicitly.

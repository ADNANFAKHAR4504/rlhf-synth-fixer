# Model Failures: Comparison of MODEL_RESPONSE.md vs IDEAL_RESPONSE.md

## 1. Missing Modularity and Key Constructs

- The model output does not modularize the infrastructure into reusable constructs for KMS key, IAM role, Lambda, and API Gateway. Only S3 and API Gateway constructs are present.
- **Impact:** Reduces maintainability, testability, and reusability of the codebase.
- **Reference:** IDEAL_RESPONSE.md provides separate constructs for each major resource in `lib/constructs/`.

## 2. Overly Broad IAM Permissions and Security Gaps

- The IAM roles and policies in the model output are not as tightly scoped as in the ideal solution. The S3 access role grants broad permissions, and the Lambda execution role is not least-privilege.
- **Impact:** Increases security risk due to excessive permissions and lack of strict least-privilege enforcement.
- **Reference:** IDEAL_RESPONSE.md uses a dedicated `ApiLambdaRole` construct with only the minimum required permissions for S3 and KMS.

## 3. Missing or Incomplete Resource Types and Features

- The model output omits several critical resources and features:
  - No dedicated KMS key construct or explicit key rotation configuration.
  - No explicit enforcement of SSL for S3 bucket access via bucket policy.
  - No modular Lambda construct; Lambda code is embedded inside the API Gateway construct.
  - No support for custom domains or certificate management in the API Gateway construct.
- **Impact:** The solution is less secure, less flexible, and does not meet all requirements for production-grade infrastructure.
- **Reference:** IDEAL_RESPONSE.md includes all these features as separate, reusable constructs.

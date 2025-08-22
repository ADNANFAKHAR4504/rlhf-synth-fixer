# Model Failures / Weaknesses

- Large portions of inline Lambda function code appear poorly formatted or incomplete due to missing line breaks, improper imports, and unstructured string quoting, which will cause runtime syntax errors unless fixed manually.

- Secret generation is limited to placeholders only (`"PLACEHOLDER_GENERATED_AT_RUNTIME"`, `"PLACEHOLDER_OPENAI_KEY"`), without a dynamic generation or secure injection method, falling short of truly mandatory no-hardcoded-secret demand.

- Policy-as-code implementation is basic and limited to a couple of AWS Config rules; more advanced or custom compliance checks requested by the prompt are not demonstrated.

- Automatic rollback is referenced but relies on Pulumi’s native mechanisms; explicit CI/CD workflow rollback steps or pipeline-level failure handling are absent.

- Some minor inconsistencies or omissions:
  - The DynamoDB table resource name `"nova-application-data"` is hardcoded instead of based on project/stack prefix.
  - The S3 bucket creation lacks explicit encryption configuration for KMS CMK (the resource uses KMS ARN but without explicit assurance on bucket encryption settings).
  - Lack of any automated test invocation or validation integrated within the stack or CI/CD beyond deployment and budget enforcement.
  - The output shows exceptions always raise after exporting, which might disrupt deployment workflows if not carefully handled.
  - Expensive resource configurations such as Lambda memory (256MB) and Lambda timeout (300s) could impact the $15 budget target easily if not reviewed.

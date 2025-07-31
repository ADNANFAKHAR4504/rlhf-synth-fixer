## Model Failures

1. ❌ **Incorrect Python Packaging Path**
   - The model set the `lambdaAsset` path as `"lib/lambda"` using `path.resolve`, while the expected packaging should reflect the actual project structure (e.g., using relative `__dirname` with validation). This may cause resolution errors if the directory changes.

2. ❌ **Missing Environment Tagging on All Resources**
   - While `commonTags` were applied, there's no explicit validation in the model output that **all** resources (SNS topic, SQS queue, CloudWatch Log Group, IAM Role, etc.) are tagged with `Environment: Production`.

3. ❌ **SNS Topic ARN Handling**
   - In the Lambda, the model fetches `SNS_TOPIC_ARN` from environment variables, but it fails to validate or handle the error gracefully in all execution paths. The ideal response includes a defensive `ValueError` and logging before rethrowing.

4. ❌ **Incomplete DLQ Invocation Logic**
   - Although the DLQ configuration is correct in CDKTF, the model’s Python handler lacks an explicit simulation of DLQ-triggered error handling beyond a generic rethrow. Ideal response includes logging and clear rethrowing intent for DLQ routing.

5. ❌ **Lack of Log Group Retention and Naming Strategy**
   - The model does not explicitly configure CloudWatch log retention (e.g., 14 days) or dedicated naming per function. This was present in the ideal implementation as part of observability and cost control.

6. ❌ **Simulated Processing Function Not Explained or Modularized**
   - The `simulate_image_processing()` function is included, but without documentation comments, modularity, or realistic logic explanations. The ideal output simulates processing with timing, result shaping, and logging.

7. ❌ **Lambda Logging Not Granular**
   - Logs in the model are minimal. The ideal output includes logs for:
     - Each record processed
     - SNS publish result
     - Final processing summary

8. ❌ **No Validation for Missing Event Keys**
   - The model assumes `record['s3']['bucket']['name']` and others always exist, which is unsafe. Ideal response uses `.get()` and includes fallback handling or error logging for malformed events.

9. ❌ **SNS Subject and Message Formatting**
   - The model sends SNS messages without `indent=2` or detailed structure for readability/debuggability. Ideal output includes a nested `details` object in the message body with clearly structured metadata.

10. ❌ **Stack ID Mismatch**
    - The `cdktf.json` from the model uses `"projectId": "image-processing-pipeline"`, but the actual TypeScript code uses `TapStack`. Consistency across config and source was expected.
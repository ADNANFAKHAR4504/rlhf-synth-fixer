These are common ways the model might fail to meet the requirements:

1. **Wrong Format**

   - Outputs YAML instead of JSON.
   - Outputs pseudocode, partial JSON, or mixes explanatory text with the template.

2. **Incomplete Networking**

   - Creates only one subnet instead of both public and private.
   - Forgets to associate subnets with route tables.
   - Adds internet access to the private subnet route table (non-compliant).

3. **S3 Bucket**

   - Fails to enable encryption (no SSE-KMS).
   - Uses SSE-S3 instead of KMS encryption.
   - Does not add a restrictive bucket policy (missing IP restriction).

4. **IAM Role**

   - Grants overly broad permissions (e.g., full `s3:*` instead of least-privilege read-only).
   - Omits the instance profile binding the IAM role to EC2.

5. **CloudTrail**

   - Enables CloudTrail but does not direct logs to the S3 bucket.
   - Omits CloudTrail entirely.

6. **Security Group**

   - Allows SSH from `0.0.0.0/0` instead of restricting to trusted IP ranges.
   - Forgets to parameterize allowed IPs.

7. **KMS**

   - Uses default S3-managed encryption keys instead of a managed KMS CMK.
   - Does not define or attach a proper key policy.

8. **Outputs**

   - Omits required outputs (VPC ID, subnet IDs, Security Group ID).
   - Mislabels or incorrectly references resources in outputs.

9. **Tags & Best Practices**

   - Forgets to tag resources with `Environment=Production`.
   - Hard-codes credentials, violating security requirements.
   - Leaves resources unnamed or inconsistently tagged.

10. **Validation**

- Produces JSON that fails `aws cloudformation validate-template`.
- Includes comments or trailing commas (invalid JSON).


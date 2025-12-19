# model\_failure.md

## Examples of responses that would be considered failures

1. **Includes AWS Config resources**

   * Adds a Configuration Recorder, Delivery Channel, or Config rules after the prompt explicitly removed them.
   * Causes singleton/limit errors or `NoAvailableDeliveryChannel/Recorder` errors on deploy.

2. **References existing resources**

   * Imports or refers to pre-existing KMS keys, S3 buckets, or an existing GuardDuty detector instead of creating them.
   * Hardcodes ARNs that aren’t created in the same template.

3. **Uses unsupported/incorrect resource types or properties**

   * Tries to use `AWS::EC2::EBSEncryptionByDefault` (not a valid CFN resource).
   * Includes region-unsupported features or wrong property names (e.g., invalid WAF scope or CloudTrail properties).

4. **Creates HTTPS listeners or ACM resources**

   * Violates the explicit exclusion (ALB must be HTTP-only for now).

5. **Over-permissive IAM/KMS**

   * Uses `Action: "*"`, `Resource: "*"`, or broad grants without conditions when scoping is feasible.
   * Omits the specific statements needed by CloudTrail/CloudWatch Logs on the CMK.

6. **Improper S3 bucket policies or names**

   * S3 names not DNS-safe (uppercase/underscores).
   * Missing TLS enforcement (`aws:SecureTransport`).
   * Missing “deny unencrypted put” on the CloudTrail bucket.
   * Missing CloudTrail service principal permissions and `bucket-owner-full-control` requirement.

7. **Security group mistakes / circular dependencies**

   * Bidirectional SG references creating circular dependencies.
   * ALB SG egress targeting EC2 SG directly instead of CIDR, causing circular references.

8. **ASG doesn’t stabilize due to KMS issues**

   * Launch template sets `KmsKeyId` to the new CMK; instances fail if the key isn’t ready.
   * Not accounting for health checks or app on the wrong port/path.

9. **WAF not actually protecting ALB**

   * Creates a WebACL but forgets the `WebACLAssociation`.

10. **Fails validation or linting**

* Missing required properties (e.g., `IsLogging` for CloudTrail).
* Invalid property enums (e.g., wrong delivery frequency strings).
* Schema violations flagged by `cfn-lint`.

11. **Adds Config delivery channel text to the prompt or the template**

* Conflicts with the updated requirement to remove Config components, leading to confusion and deployment failures.

12. **Outputs are incomplete or not useful**

* Omits key outputs (e.g., VPC endpoint IDs, bucket names/ARNs, trail info, KMS ARN).
* Uses vague or non-exportable values.
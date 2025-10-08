# Failures

- **Event trigger missing or incomplete**  
  The response does not configure S3 event notifications to automatically invoke the Lambda function on image upload — the core automation requirement is unfulfilled.

- **Thumbnail generation logic absent**  
  The Lambda function code does not include actual image resizing logic using Pillow; the requirement for creating thumbnails is missing.

- **Destination bucket undefined**  
  Only one bucket is defined; no separate destination bucket is created to store resized or processed images.

- **Public access restriction insufficient**  
  Public access settings only use ACL or basic flags but no explicit S3 BucketPolicy to deny public principals or enforce TLS, violating the “strict bucket policy” requirement.

- **IAM policy too broad**  
  The Lambda execution role allows full `s3:*` actions or attaches managed policies without fine-grained restrictfixeions. Does not meet the least-privilege IAM requirement.

- **CloudWatch logging setup incomplete**  
  Logging appears assumed but no explicit log group creation, retention policy, or error/throttle alarms are configured.

- **Lambda packaging not modular or reproducible**  
  Code bundling and dependency handling are not modularized via `AssetArchive` or an external build step. Pulumi configuration mixes runtime logic and packaging.

- **No validation or deployment readiness checks**  
  The solution does not include Pulumi policy validation, resource assertions, or AWS validation routines as required.

- **Region configuration missing**  
  No explicit provider or region parameter; deployment is not guaranteed to target a defined or configurable region.

- **Security best-practice gaps**  
  No encryption configuration for buckets, no environment variable secrets handling, and no TLS enforcement on S3 access.

- **No inline comments or modular structure**  
  The response lacks adequate comments explaining each resource and function; modules are not separated cleanly for reuse.

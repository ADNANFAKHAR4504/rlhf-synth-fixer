Typical failure modes and how to avoid them
1) “Access Denied for bucket … Please check S3bucket permission”

Root cause: Bucket policy didn’t grant the regional ELB account for us-east-1 (127311923021) the right actions on the exact object path, or it used the wrong principal/conditions/ACL requirements.
Prevention:

Principal should be arn:aws:iam::127311923021:root for us-east-1.

Allow s3:PutObject on arn:aws:s3:::<bucket>/alb/AWSLogs/<your-account-id>/*.

Allow s3:GetBucketAcl on the bucket ARN.

Include OwnershipControls (BucketOwnerPreferred) and keep public access blocks on.

Optional, but helpful: restrict using aws:SourceAccount and aws:SourceArn patterns without introducing circular references.

2) Targets remain unhealthy

Root cause: Health check path or port mismatch, or the app never returns 200.
Prevention:

Ensure UserData installs and starts the web server.

Create a plain text /health that returns OK with status 200.

Align Target Group port (80) with instance listening port (80).

3) NAT routing not actually HA

Root cause: Single NAT Gateway shared across AZs or private routes pointing to the wrong NAT.
Prevention:

Create one NAT per AZ in the public subnets.

Private route tables in each AZ must default to the NAT in the same AZ.

4) Lint warnings about unnecessary substitutions

Root cause: Using string substitution where no variables are present.
Prevention:

Keep substitutions only where placeholders exist (e.g., using account ID, region, or mapped values).

Use plain string literals when no placeholders are needed.

5) Name collisions on globally-unique buckets or ALB names

Root cause: Static names reused across accounts/regions.
Prevention:

Compose names with ${AccountId} and ${Region} (or stack name for ALB display names).

6) Launch Template can’t attach instance profile

Root cause: Referencing the profile before it exists or using the wrong property.
Prevention:

Create the instance profile resource and reference its ARN in the Launch Template IamInstanceProfile.Arn.

7) EC2 cannot reach internet for bootstrapping

Root cause: Missing NAT or incorrect private routing.
Prevention:

Verify private route tables have default route to the NAT in their AZ.

Ensure NAT Gateways sit in public subnets with a route to the IGW.

8) Security groups too permissive or too strict

Root cause: Opening private instances to the internet, or blocking ALB→EC2.
Prevention:

App SG inbound must be only from ALB SG on port 80.

ALB SG inbound 80/443 from 0.0.0.0/0; outbound open.

Triage steps if something still breaks

Read the stack events for the failing resource; note the first error.

For S3 log issues, test by manually putting an object with the ELB account principal assumptions (or re-check the policy).

Validate Target Group health: confirm instances listen on port 80 and /health returns 200.

Check route tables in the console: private subnets must default through the correct NAT.

Re-run the linter and fix any new warnings.
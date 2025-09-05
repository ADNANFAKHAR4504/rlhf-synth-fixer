When this would be considered a failure

Any of the following means the response does not meet the bar:

The template can’t be deployed cleanly in a fresh account/region.

Subnets are not spread across distinct AZs or routing is incorrect.

Private subnets have no NAT egress (or incorrect route to NAT).

EC2 instances receive public IPs or don’t enforce IMDSv2 or encrypted volumes.

S3 bucket lacks public access block, encryption, versioning, or lifecycle.

IAM policy is not least-privilege or is not scoped to the created bucket.

KeyName parameter blocks deployment when empty.

Bucket naming collides or violates DNS naming (e.g., uppercase).

Hardcoded AZ names or account IDs break StackSets usage.

Missing or incorrect outputs, or outputs do not reflect created resources.

Common root causes and fixes

Key Pair validation error
Cause: KeyName parameter typed as AWS::EC2::KeyPair::KeyName without a valid existing key.
Fix: Make KeyName a String and set a condition to include it on the instance only when non-empty.

Bucket name invalid
Cause: Uppercase characters or unsafe tokens in name.
Fix: Constrain ProjectName to lowercase DNS-safe and compose bucket name with ${AccountId} and ${Region} for uniqueness.

Lifecycle policy rejected
Cause: Using deprecated or wrong lifecycle properties (e.g., NoncurrentVersionExpirationInDays).
Fix: Use NoncurrentVersionExpiration with NoncurrentDays; verify transitions/expiration keys.

No egress from private subnets
Cause: Missing NAT gateway or route association.
Fix: Ensure NAT(s) exist in public subnets, and private RTs default route 0.0.0.0/0 → NAT.

AZ hardcoding
Cause: Using explicit AZ names.
Fix: Use GetAZs + Select to derive AZs dynamically.

Over-permissive IAM
Cause: Wildcard S3 permissions.
Fix: Scope to bucket for ListBucket and bucket/* for object actions only.

Public EC2
Cause: Launching in public subnets or enabling public IPs.
Fix: Place instances in private subnets and disable public IP assignment; rely on SSM.

StackSets breaks
Cause: Region/account assumptions or external references.
Fix: Keep all resources in one template; avoid pre-existing dependencies; parameterize all environment specifics.

Exit criteria

Stack deploys without error in a clean account/region.

All validation checklist items pass.

Security posture (IMDSv2, encryption, least privilege, blocked public S3) is confirmed.

StackSet instantiation succeeds across target accounts/regions.
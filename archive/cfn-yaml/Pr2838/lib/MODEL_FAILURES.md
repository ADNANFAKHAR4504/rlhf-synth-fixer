Below are the issues encountered during iterations and how they were addressed.

1) Circular Security Group dependencies

Symptoms:
E3004 Circular Dependencies for resource AppSecurityGroup/RDSSecurityGroup
Root cause: App SG egress referenced RDS SG, and RDS SG ingress referenced App SG → cycle.
Fix: Removed the explicit App→RDS egress and kept only RDS ingress from App SG. SGs are stateful; return traffic is allowed.

2) Invalid S3 bucket names / Warnings

Symptoms:
W1031 ... does not match '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
Root cause: Using ${EnvironmentName} (“Production”/“Staging”) created uppercase letters in bucket names.
Fix: Added a mapping to lowercase slugs (production/staging) and substituted those in names.

3) KMS alias misuse for LogGroup

Symptoms:
E3031 'alias/aws/logs' does not match '^arn:...
Root cause: KmsKeyId on LogGroup expects a key ARN or key ID, not a plain alias string.
Fix: Created a CMK (LogsKmsKey) with a permissive policy for CloudWatch Logs and provided its ARN to the LogGroup. Added an alias for convenience.

4) SSM SecureString misuse

Symptoms:
E3030 'SecureString' is not one of ['String', 'StringList']
Root cause: Attempted to create SSM SecureString values without a KMS or used where secrets weren’t appropriate.
Fix: Moved the DB password to Secrets Manager (generated in-stack). Kept SSM for non-secret values only.

5) Outputs schema errors

Symptoms:
E3001 'Type' is a required property and related errors under Outputs/Tags.
Root cause: Malformed sections (e.g., using Tags schema where a map is expected).
Fix: Corrected Outputs schema and removed invalid Tag formats from resources that don’t support list-style tags.

6) Unnecessary Fn::Sub warnings

Symptoms:
W1020 'Fn::Sub' isn't needed because there are no variables
Root cause: Fn::Sub wrapped static strings (e.g., AMI SSM parameter).
Fix: Replaced with a direct dynamic reference string where appropriate.

7) RDS engine version not available (hard-pinned)

Symptoms:
Cannot find version 14.9 for postgres
Root cause: Minor versions vary by region/time.
Fix: Parameterized DBEngineVersion with default auto and a condition: when auto, omit the property so RDS picks a valid version; otherwise allow pinning (e.g., 14.11, 15.6, 16.3).

8) Launch template tag error

Symptoms:
'instance' is not a valid taggable resource type for this operation
Root cause: Some CreateLaunchTemplate paths reject TagSpecifications for instance.
Fix: Removed TagSpecifications from the LaunchTemplate. Tags are set on the ASG with PropagateAtLaunch: true.

9) Internet-facing ALB subnets

Observation: An internet-facing ALB should use two public subnets across two AZs. With fixed CIDRs (one public, one private), a future improvement is to add a second public subnet (e.g., 10.0.3.0/24) in another AZ. VPC endpoints mitigate the lack of NAT for private instances.
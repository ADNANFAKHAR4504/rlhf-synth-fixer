Goal:
Produce a single CloudFormation YAML template that creates a highly secure AWS infrastructure implementing the exact requirements below. The template must be ready to deploy from the CloudFormation console (or aws cloudformation deploy) in a test AWS account and must pass the validation and tests described in the acceptance checklist.

⸻

Requirements (functional) 1. VPC & Networking
• Create a VPC (parameterize the CIDR, default 10.0.0.0/16).
• Create at least two public subnets and two private subnets across different Availability Zones (parameterize AZ selection or pick first two AZs in the region).
• Create an Internet Gateway attached to the VPC and a public route table associated with public subnets.
• Create NAT Gateway(s) in the public subnets for private-subnet outbound access; private subnets must route 0.0.0.0/0 to NAT Gateway(s).
• Ensure EC2 instances in private subnets do not have public IPs and cannot be reached from the internet directly. 2. EC2
• Create a Launch Template or Launch Configuration + AutoScalingGroup (minimum one EC2 instance in private subnet for demonstration).
• Use an AMI resolved dynamically (do not hardcode region-specific AMI IDs; use SSM Parameter or accept AMI as parameter).
• Ensure EBS root and additional volumes (if any) are encrypted using a KMS key created in this template (see KMS section).
• Attach an IAM instance role with least privilege required to:
• Use SSM (AmazonSSMManagedInstanceCore) for session manager (no SSH port open).
• Read specific S3 bucket (if the app needs S3) or read Secrets Manager secret (if present) — but restrict to resources created in this template using exact ARNs.
• Do not open SSH (22) to 0.0.0.0/0. If SSH is required, make it parameterized and default to a safe CIDR. 3. IAM / Least Privilege
• Create IAM roles and policies with least privilege for:
• Lambda/EC2 roles where needed (only required actions on the created resources).
• CloudFormation-created users/roles if required (keep minimal).
• Avoid wildcards in resource ARNs; reference resources in the same template via !Ref / !GetAtt.
• Include ManagedPolicyArns only where appropriate; prefer scoped inline policies for resource-specific access. 4. KMS & Encryption
• Create a customer-managed AWS KMS Key (symmetric) in this template with an appropriate key policy that:
• Allows administration by the account root and CloudFormation service principal and allows the created roles to use it.
• Grants encryption/decryption to the specific IAM roles that need it (EC2 instance profile, potential Lambda role, etc.).
• Use the KMS key to encrypt:
• EBS volumes (via KmsKeyId on AWS::EC2::Volume or BlockDeviceMappings in LaunchTemplate).
• S3 bucket server-side encryption (default encryption configuration using the KMS key).
• Any other resources created (RDS, EFS, Secrets Manager) — if included, ensure KmsKeyId is used.
• Ensure the KMS key is configured with a sensible EnableKeyRotation (optional but recommended). 5. S3
• Create an S3 bucket with:
• Default encryption using the KMS key.
• Public access blocked (BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets).
• Bucket policy that permits only the necessary roles/services from this stack; no public access. 6. Secrets & Sensitive Data
• If any secrets are needed (DB password etc.), create an AWS::SecretsManager::Secret and store password there; grant minimal access to the required IAM role.
• Do not store plaintext secrets in the template. 7. CloudFormation Best Practices
• Parameterize common values: Environment, VpcCidr, PublicSubnetCidrs, PrivateSubnetCidrs, InstanceType, KeyPairName (optional), EnableNatGateway boolean.
• Add tagging on all resources (Environment, Project, Owner).
• Include DeletionPolicy where appropriate (e.g., for KMS key/Secrets decide carefully — if template will be tested and then deleted, do not set Retain unless explained).
• Template must declare required capabilities in deployment instructions (CAPABILITY_NAMED_IAM) if needed.

⸻

Non-functional / Constraints
• Output format: Single YAML CloudFormation template only (no nested stacks or multiple files).
• No hardcoded region-dependent AMI IDs; prefer SSM parameter store or accept AMI param.
• Everything should be deployable from CloudFormation console: no manual post-deploy actions required to make the stack succeed.
• Minimize broad permissions (no Resource: "\*") — use specific ARNs or !Sub with resource names created in the stack.
• For testing: the template must work in a fresh test account (limits permitting) in us-east-1 or any specified region.

⸻

Required Outputs (CloudFormation Outputs)

The template must include outputs that will be validated in tests:
• VpcId
• PublicSubnetIds (comma-separated or list)
• PrivateSubnetIds (comma-separated or list)
• KmsKeyId (and KmsKeyArn)
• S3BucketName
• InstanceIds (or AutoScalingGroup name)
• InstancePrivateIps (for test instance)
• IAM roles ARNs created for EC2/Lambda
• SecretsManager secret ARN (if created)

⸻

Validation & Acceptance Checklist

The submitted template will be validated against the following checks (the template must pass them): 1. Lint & Syntax
• cfn-lint passes with no errors.
• YAML is valid and CloudFormation ValidateTemplate succeeds. 2. Deployability
• Stack can be created via CloudFormation console (test account).
• No manual post-deployment steps are required to complete CREATE_COMPLETE. 3. Network
• Private EC2 instances have no public IPs.
• Private subnets route 0.0.0.0/0 through NAT Gateway(s).
• Public subnets have Internet Gateway route. 4. Encryption
• S3 bucket default encryption uses the created KMS key (check BucketEncryption).
• EC2 EBS volumes reference KmsKeyId pointing to created KMS key.
• KMS key policy allows CloudFormation and principals that need to use it. 5. IAM
• IAM policies are scoped to created resources (no \* unless essential with clear justification).
• EC2 role has AmazonSSMManagedInstanceCore (or equivalent) and permission to use the KMS key.
• No CloudFormation creation failures due to IAM permission issues. 6. Secrets
• Any secret is stored in Secrets Manager and access is restricted to the required IAM role. 7. Security
• No public S3 bucket access.
• No open SSH to 0.0.0.0/0 (if SSH allowed it must be parameterized).
• ALB/NLB or external endpoints (if present) follow least-privilege exposure rules. 8. Outputs
• All required outputs are present and populated.

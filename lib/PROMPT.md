Design a single CloudFormation template in YAML named TapStack.yml that provisions a brand-new, secure, production-ready AWS infrastructure in us-west-2. The template must be self-contained (no external modules or pre-existing resources), declare all parameters with sensible default example values, include brief in-line comments explaining major components, and define comprehensive Outputs for verification.

## Functional scope (build everything new):

* VPC with two public and two private subnets spread across at least two Availability Zones in us-west-2
* Internet Gateway, two NAT Gateways (one per AZ), route tables, and associations
* Bastion host EC2 instance in a public subnet for SSH access, restricted by a parameterized CIDR
* Application EC2 instance in a private subnet using the latest Amazon Linux 2 AMI via SSM Parameter; attach an instance profile/role limited to the created S3 bucket and SSM access
* S3 application bucket using SSE-KMS, public access blocked, TLS-only policy, and server access logging to a dedicated S3 logs bucket (also SSE-KMS)
* KMS customer-managed keys with appropriate key policies for S3, RDS, CloudTrail, and CloudWatch Logs
* RDS Multi-AZ instance (for example db.t3.micro) in private subnets only, storage encrypted with KMS, engine selectable (default postgres), master credentials sourced securely (no inline secrets)
* IAM roles and least-privilege policies:

  * EC2 App Role: read-only access to the specific application S3 bucket, SSM core, and basic CloudWatch metrics
  * Bastion Role: SSM core only
* Security groups:

  * Bastion SG: allow TCP/22 only from AllowedSshCidr
  * App SG: allow TCP/22 only from the Bastion SG
  * RDS SG: allow database port only from the App SG (engine-aware port)
* CloudTrail (management events) delivered to the logs bucket with log file validation and KMS encryption
* CloudWatch alarms with an SNS topic (and optional email subscription) for:

  * EC2 app CPUUtilization > 80% for 5 minutes
  * RDS CPUUtilization > 80% for 5 minutes
  * EC2 StatusCheckFailed > 0 for 5 minutes on the app instance
* Outputs for IDs/ARNs/endpoints covering VPC, subnets, security groups, S3 bucket names, KMS keys, RDS endpoint/ARN, Bastion EIP, App instance ID, CloudTrail ARN, and SNS topic ARN

Non-negotiable constraints:

* Region fixed to us-west-2
* All taggable resources include Environment=Production and Project=TapStack
* Public access to both S3 buckets must be blocked
* KMS is used for all encryption points (S3, RDS, CloudTrail, CloudWatch Logs if created)
* Only create resources in the scope above
* EC2 AMI fetched via SSM: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64 (or AL2 equivalent for the region)
* Private subnets get outbound internet through NAT Gateways
* SSH restricted by the AllowedSshCidr parameter
* Template must pass aws cloudformation validate-template and be cfn-lint clean

Template structure and style:

* Single file: TapStack.yml
* Include AWSTemplateFormatVersion and Description
* Metadata section with AWS::CloudFormation::Interface to group and label parameters
* Parameters: provide sensible defaults so the stack can launch in a clean account; no inter-stack references
* Conditions: at minimum, a toggle to create an email subscription only when AlarmEmail is provided
* Resources: fully defined, no imports
* Outputs: explicit, human-readable, and sufficient for verification
* In-line comments before major blocks explaining intent and key security choices
* Naming: logical IDs prefixed with TapStack and consistent Name tags
* IAM policies must scope to created resources; avoid wildcard actions or resources where not required
* No plaintext secrets in the template

Inputs (with example defaults):

* ProjectName (TapStack)
* Environment (Production)
* VpcCidr (10.0.0.0/16)
* PublicSubnet1Cidr (10.0.0.0/24)
* PublicSubnet2Cidr (10.0.1.0/24)
* PrivateSubnet1Cidr (10.0.10.0/24)
* PrivateSubnet2Cidr (10.0.11.0/24)
* AllowedSshCidr (203.0.113.0/24; replace with the real corporate CIDR)
* KeyName (may be empty; when empty rely on SSM Session Manager)
* AppInstanceType (t3.micro)
* BastionInstanceType (t3.micro)
* DbEngine (postgres)
* DbEngineVersion (16.3 example)
* DbInstanceClass (db.t3.micro)
* DbName (appdb)
* DbUsername (example non-secret; actual password handled securely)
* AlarmEmail (optional)

Security and compliance expectations:

* S3 app bucket: SSE-KMS with a dedicated key, TLS-only bucket policy, logging to the logs bucket
* S3 logs bucket: SSE-KMS, versioning enabled, access restricted; include a straightforward 90-day transition rule
* RDS: Multi-AZ, encrypted at rest, not publicly accessible, in private subnets only
* CloudTrail: management events and global service events enabled, validation on, delivered to logs bucket with KMS
* CloudWatch: alarms configured to notify the SNS topic
* IAM: least privilege across EC2 roles and S3 access; SSM enabled for operational access

## Deliverable:

Provide TapStack.yml that:

* Declares and labels all parameters and conditions needed to deploy a clean, self-contained stack in us-west-2
* Builds the complete scope above without referencing existing resources
* Applies required tags, enforces S3 public access blocks, and uses KMS keys for encryption
* Restricts SSH to AllowedSshCidr and places application instances in private subnets behind NAT
* Retrieves the latest Amazon Linux 2 AMI via SSM
* Includes concise comments explaining each major decision
* Exposes comprehensive Outputs to verify the deployment end-to-end
* Validates with aws cloudformation validate-template and passes cfn-lint without warnings

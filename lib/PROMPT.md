I’m putting together a small AWS CDK project in TypeScript and I’d like the initial skeleton + stack code generated. Nothing fancy, just clean and idiomatic CDK.

What I’m building

Single-account, single-region app that lives entirely in one VPC in us-west-2. It includes a couple of EC2 instances, one RDS instance, a few Lambda functions, and some S3 buckets. Please wire things so they can talk to each other safely inside the VPC and keep public access locked down.

Project layout (please stick to this)

bin/tap.ts – app entry point

lib/tapstack.ts – main stack definition

test/ – CDK tests (basic assertions are fine)

Naming

We use a simple convention: corp-<projectName>-<resourceType>.
Examples: corp-nova-ec2, corp-nova-s3, etc. Please apply this consistently across everything you create.

VPC / networking

All resources live in one VPC in us-west-2.

EC2 and Lambda go into that VPC.

RDS goes into private subnets only.

Use security groups (not NACLs) to control access.

EC2

Launch inside the VPC.

No embedded credentials; use IAM roles.

SSH must be restricted to a specific CIDR (make this a prop/parameter so it’s easy to change). Security group should only allow port 22 from that CIDR.

RDS

The database runs in the VPC’s private subnets.

Encrypt at rest.

Inbound allowed only from the approved sources via security groups (EC2/Lambda SGs and/or a list of IPs). Don’t open to the world.

Lambda

Deploy the functions into the same VPC.

Enable CloudWatch logging.

Sensitive values (DB creds, etc.) should come from AWS Secrets Manager—no hardcoded secrets.

S3

Bucket names must follow the company naming convention above: corp-<project>-<resource-type>.

Turn on server-side encryption.

Block all public access settings.

IAM

Keep to least privilege.

Attach only what EC2, RDS, and Lambda actually need.

Enforce MFA for AWS Management Console access (an IAM account-level policy or equivalent is fine).

Out of scope

Do not add AWS Config Rules or CloudTrail to this stack.

What I’d like back

TypeScript CDK code that implements the above:

bin/tap.ts creates the app and instantiates the stack with reasonable props (project name, sshCidr, etc.).

lib/tapstack.ts defines the VPC, EC2, RDS, Lambda, S3, IAM pieces and wires them together.

Minimal tests in test/ proving key bits are set (encryption, public access block, RDS in private subnets, etc.).

Please keep things readable with brief comments where choices might be non-obvious.
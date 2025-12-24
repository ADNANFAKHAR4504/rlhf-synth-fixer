I’m putting together a secure AWS foundation with CloudFormation and want a single YAML template I can reuse across environments. Please generate one deployable file named SecureInfraSetup.yaml (YAML only). No extra commentary—just the template. Keep it region-agnostic so it works anywhere without hard-coded region bits.

What I’m aiming for: a VPC spread across multiple AZs with public and private subnets, tight security groups (no wide-open ingress; inbound only from specific IP ranges we pass in), and conservative NACLs. Traffic to S3 should stay on the AWS network via VPC endpoints. Absolutely no public S3 buckets—block public access and use bucket policies that enforce it. Everything at rest should be encrypted with customer-managed KMS keys (sensible key policies; don’t over-broaden principals).

I want full audit/visibility out of the box: CloudTrail capturing all API activity with logs written to an encrypted S3 bucket, AWS Config recording and delivering to S3, and GuardDuty turned on including malware protection for S3. For service-to-service comms inside the environment, wire in VPC Lattice.

IAM should follow least privilege. Where it makes sense for this stack, enforce MFA for IAM users. Any roles for services (EC2, Config, CloudTrail, etc.) should have only what they actually need.

Make the template parameterized so I can pass things like environment name (dev/stage/prod), project, owner, allowed inbound CIDRs, and any values that can’t be inferred. Tag every resource consistently with Environment, Project, and Owner. Avoid hardcoding—prefer !Ref, !Sub, !GetAtt, dynamic references, etc. Add short, practical comments so another engineer can skim and understand why something exists.

Please include the usual outputs I’ll need later (VPC ID, subnet IDs, security group IDs, S3 bucket names—including the logging/config/trail buckets—KMS key ARNs, VPC endpoint IDs, CloudTrail trail ARN, anything else obviously useful). S3 buckets you create should have encryption and (where appropriate) access logging turned on.

A couple of preferences: prioritize security over convenience if there’s a tradeoff; keep things idempotent; and stick to clean, readable YAML. Again, just return the one YAML file contents for SecureInfraSetup.yaml—no explanation text around it.
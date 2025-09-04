Write a single TypeScript file using the AWS CDK (v2) that synthesizes to CloudFormation and deploys a production-ready, secure, and highly available AWS environment. Follow AWS best practices and implement the exact specifications below. The result must be deployable as-is with cdk deploy and pass validation.

Scope and requirements

    1.	Regions (multi-region HA)
    •	Target regions: us-east-1 (N. Virginia) and us-west-2 (Oregon).
    •	Provide a primary stack and a secondary stack with identical topology.
    •	Make region selection configurable (context/props) while defaulting to the two regions above.
    •	Keep design cost-efficient (e.g., minimal NAT per AZ if required, use endpoints to reduce NAT egress).

    2.	VPC and networking
    •	Create a VPC with CIDR 10.0.0.0/16.
    •	Two public and two private subnets, spread across two AZs.
    •	Associate each subnet with the correct route table.
    •	Create and attach an Internet Gateway to the VPC.
    •	Create NAT Gateways in the public subnets for outbound internet from private subnets.
    •	Add an Interface/Gateway S3 VPC Endpoint (choose the correct type for S3; Gateway endpoint) so private subnets can reach S3 without NAT.
    •	Tag and name all resources using a prod-level naming convention (e.g., prod-{app}-{region}-{component}).

    3.	Compute and database placement
    •	Launch EC2 instances in the public subnets (use a Launch Template or simple Instance; parameterize instance type).
    •	Deploy RDS PostgreSQL in the private subnets across two AZs (Multi-AZ enabled).
    •	Enable storage encryption, automated backups, deletion protection, and secure parameter handling for DB credentials (use SSM Parameter Store or Secrets Manager; reference via SSM if using Secrets Manager).

    4.	Security
    •	Create strict Security Groups:
    •	EC2 SG: allow inbound only on required ports (parameterize, e.g., 22/80/443) from trusted CIDRs; outbound as needed.
    •	RDS SG: allow inbound only from EC2 SG or specific app SGs; no public access.
    •	Block public access on any S3 buckets you create; enforce encryption at rest (SSE-S3) and in transit (HTTPS endpoints).
    •	Use least-privilege IAM roles/policies for any instance roles.
    •	Ensure VPC endpoint policies are least-privilege.

    5.	Endpoints and routing details
    •	Public subnets: default route to IGW.
    •	Private subnets: default route to NAT; S3 traffic routed via S3 Gateway Endpoint.
    •	Explicitly associate route tables and document in comments.

    6.	Naming and tagging
    •	Apply a consistent production naming scheme and tags to all resources (e.g., Environment=prod, Application={appName}, Region={region}, Owner={team}).

Implementation constraints
• Use AWS CDK v2 (aws-cdk-lib, constructs).
• Everything lives in one TypeScript file (e.g., bin/app.ts-style single entry or a single stack.ts that includes App + two Stack instantiations).
• No external files; inline JSON for any IAM policies if needed.
• Include clear comments explaining key security and HA choices.
• Provide reasonable defaults via CDK context/stack props (e.g., instance type, allowed CIDRs, DB engine version, naming prefix).
• Ensure the template is idempotent and deployable to both regions.

Deliverables (in that single file)
• CDK App and two Stack instances (one per region), or a parameterized stack that can be deployed twice with different env.
• VPC with 2× public + 2× private subnets across two AZs, IGW, NATs, route tables/associations.
• S3 Gateway VPC Endpoint configured and routed for private subnets.
• EC2 instances in public subnets with minimal IAM role.
• RDS PostgreSQL (Multi-AZ) in private subnets with encryption, backups, deletion protection, and credentials in SSM/Secrets (referenced securely).
• Security Groups with strict ingress/egress rules as described.
• Consistent prod-level naming and tags.
• Brief instructions in comments on how to deploy to both regions (e.g., cdk bootstrap, then cdk deploy per region).

Acceptance criteria
• cdk synth produces valid CloudFormation.
• Subnets, route tables, IGW, NATs, and S3 endpoint are correctly configured and associated.
• EC2 is reachable only as permitted; RDS is private and reachable only from allowed SGs.
• RDS is Multi-AZ, encrypted, with backups and deletion protection enabled.
• All resources carry the required production naming and tags.
• The same topology can be deployed to us-east-1 and us-west-2 without code changes (only by setting env/context).
• The design minimizes unnecessary cost (e.g., uses S3 endpoint to reduce NAT egress) while preserving HA and security.

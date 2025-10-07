Generate a production-ready AWS CDKTF TypeScript project that deploys a secure, scalable multi-AZ AWS environment in the us-east-1 region.

REQUIREMENTS:
- Use AWS CDKTF (TypeScript) and organize code into ONLY TWO FILES:
  - lib/tap-stack.ts: main stack composing all modules.
  - lib/modules.ts: reusable modular constructs (VPC, subnets, IGW, NAT, route tables, RDS, security groups, outputs).
- Region: us-east-1
- Single AWS account.

NETWORK SETUP:
- Create a VPC with CIDR 10.0.0.0/16.
- Two public subnets: 10.0.1.0/24, 10.0.2.0/24.
- Two private subnets: 10.0.3.0/24, 10.0.4.0/24.
- Attach an Internet Gateway and route public subnets (0.0.0.0/0 → IGW).
- Add a NAT Gateway (with EIP) in one public subnet for private subnet outbound access (0.0.0.0/0 → NAT).
- Tag subnets as "public" or "private".

DATABASE (RDS):
- Deploy an RDS MySQL instance in private subnets.
- Enable Multi-AZ deployment.
- Use AWS-managed credentials (do not create Secrets Manager secrets manually).
- Allow access only from private subnet instances via a security group.
- Enable backups, deletion protection, and parameterize instance class (default: db.t3.medium).

SECURITY GROUPS:
- Public SG: allow HTTP (80) & HTTPS (443) from 0.0.0.0/0, SSH (22) only from sshAllowedCidr.
- RDS SG: allow MySQL (3306) only from private instance SG.
- Apply least-privilege rules and follow AWS best practices.

TAGS & NAMING:
- Tag all resources with:
  - Name, Project, Environment, Owner, ManagedBy.
- Naming format: <project>-<env>-<resource> (e.g., prod-db, prod-sg).

OUTPUTS
Export the following:
- VPC ID
- Public & Private Subnet IDs
- Route Table IDs
- NAT Gateway ID & EIP
- Security Group IDs
- RDS Endpoint & ARN

VARIABLES
Make configurable:
- projectName, environment, region (default us-east-1), sshAllowedCidr,
  dbInstanceClass, dbStorageGb, dbBackupRetentionDays, enableDeletionProtection.

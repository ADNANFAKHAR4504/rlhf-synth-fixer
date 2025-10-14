We need a highly available, production-ready relational database for an e-commerce platform that handles ~50,000 orders per day and is read-heavy. The system must prioritize availability, performance, and auditability. Please produce one self-contained CloudFormation YAML template file that provisions the following, with sensible defaults and parameters for customization:

Core requirements

    •	RDS for PostgreSQL (engine: postgres) using instance class db.m5.large for primary.
    •	Read replicas: at least two read replicas deployed in two separate Availability Zones to handle read traffic.
    •	Multi-AZ/high-availability for the primary (Multi-AZ deployment enabled).
    •	VPC with private subnets: create a VPC and two private subnets with CIDRs 10.0.10.0/24 and 10.0.20.0/24. Include NAT/route basics as needed for backups/monitoring access.
    •	Security Group allowing only port 5432 from application subnets and management CIDRs (parameterized).
    •	KMS encryption: enable storage encryption using a KMS key created in the template (or accept a KMS key ARN parameter).
    •	Automated backups with a configurable retention period (default 7 days) and daily backup window.
    •	Performance Insights and Enhanced Monitoring enabled (parameterize retention and granularity).
    •	CloudWatch metrics & alarms: include alarms for high CPU (>75%), high replica lag, and read/write latency thresholds. Also include a CloudWatch dashboard output URL.
    •	S3 for exports/backups: include an S3 bucket for exporting snapshots or storing exported data (with lifecycle policy), and IAM permissions to allow snapshot export if requested.
    •	IAM database authentication: enable IAM DB authentication for administrative access; include the necessary IAM role/policy and show how to generate temporary auth tokens.
    •	Parameterization: allow overriding EnvironmentSuffix (dev/staging/prod), instance class, AZs, DB name, master username (no plaintext password in template — use Secrets Manager or parameter referencing SecureString), backup retention days, and KMS key selection.
    •	Least-privilege IAM: create minimal IAM roles/policies for RDS export jobs, snapshot export, and monitoring.
    •	Tags & naming: apply consistent tags and include an EnvironmentSuffix parameter.

You are an AWS Solutions Architect. Generate a production-ready CloudFormation YAML template that deploys a single regional environment.

Important:

Do not include global resources (e.g., CloudFront distributions, Route 53 hosted zones).

The template must be idempotent, parameterized, and pass both:

cfn-lint

aws cloudformation validate-template

Scope (Regional Only)

Include

VPC, subnets, NACLs, security groups

IAM roles/policies

Launch Template + Auto Scaling Group

Regional S3 bucket

Regional RDS (Multi-AZ)

Secrets Manager secret

AWS Config (recorder, delivery channel, managed rules)

Optional: Route 53 records (only if a hosted zone ID is provided)

Exclude

CloudFront

Global ACM certs

Route 53 hosted zone creation

Organizations

Global S3 features requiring another region

S3 Replication (Optional)

Support via parameters

If ReplicationDestinationBucketArn is passed enable CRR

Otherwise skip (via Condition)

Functional Requirements
Parameters

Environment

EnvironmentName (e.g., prod-eu)

Region (default: stack region)

VpcCidr (default: 10.0.0.0/16)

AZCount (≥2)

PublicSubnetCidrs (list)

PrivateSubnetCidrs (list)

S3

S3BucketName (globally unique)

EnableS3Replication (true/false)

ReplicationDestinationBucketArn (optional)

RDS

DBUsernameParamName and DBPasswordParamName (Secrets Manager) or DBSecretArn

DBInstanceClass = db.m5.large

DBName

Engine (postgres/mysql)

EC2/ASG

EC2InstanceType = t3.medium

AsgMinSize (≥2)

AsgMaxSize

AsgDesiredCapacity (≥2)

Networking & DNS

AllowedCidrIngress (list for SSH/HTTP/HTTPS)

HostedZoneId (optional; create Route 53 records only if set)

VPC & Networking

VPC (10.0.0.0/16)

At least two AZs with public & private subnets per AZ

Internet Gateway + NAT Gateways (1 per AZ)

Route tables + associations

NACLs: deny by default, allow only required traffic

Security

Security Groups: web tier, app tier, db tier

No 0.0.0.0/0 except parameterized ingress

IAM

Instance role + profile for EC2 (SSM, Secrets Manager, S3 access)

Role for RDS enhanced monitoring

AWS Config service-linked role (if supported)

KMS (optional): use AWS managed keys unless explicitly parameterized

EC2 Auto Scaling

AMI: Amazon Linux 2 (via SSM Parameter)

Launch Template with:

t3.medium

IMDSv2 required

EBS encrypted

Detailed monitoring enabled

ASG across private subnets (≥2 AZs)

Min size = 2

Optional: ALB in public subnets (HTTP/HTTPS listeners)

If HTTPS ACM cert ARN must be passed as parameter

RDS

Engine: postgres/mysql

Multi-AZ enabled

Instance class: db.m5.large

Storage encrypted

Backup retention ≥ 7 days

Deletion protection (parameterized)

Subnet group in private subnets

SG allows only from app tier SG

Credentials pulled from Secrets Manager

S3 (Regional)

Create a regional bucket

Block public access

Default encryption (SSE-S3 or SSE-KMS if parameterized)

Optional: CRR (if enabled & destination bucket ARN provided)

AWS Config (Regional)

Delivery channel (to created S3 bucket or parameterized central bucket)

Recorder enabled

Managed rules:

IAM_PASSWORD_POLICY

RDS_MULTI_AZ_SUPPORT

EC2_INSTANCE_NO_PUBLIC_IP

S3_BUCKET_PUBLIC_READ_PROHIBITED

S3_BUCKET_PUBLIC_WRITE_PROHIBITED

EC2_IMDSV2_CHECK

Outputs

VPC ID

Subnet IDs (public/private)

Security Group IDs

ASG name

Launch Template ID

RDS endpoint

S3 bucket name/ARN

AWS Config recorder status

Optional: ALB DNS name + Route 53 record names

Template Style & Quality

YAML only (no prose, no markdown inside)

Use Conditions for optional features (CRR, Route 53, ALB/HTTPS)

Use !Ref, !Sub, !If, !GetAtt only where necessary

Tag all resources with: Project, Environment, Region, Owner

Ensure IAM policies are least-privilege

Must synthesize cleanly with no errors

Deliverable: A single CloudFormation YAML template implementing everything above for one AWS region.
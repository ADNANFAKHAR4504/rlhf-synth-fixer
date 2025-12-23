# CloudFormation Template for Multi-Tier Web App

Need a production-ready CloudFormation template in YAML that sets up a complete web application infrastructure with high availability.

## What to Deploy

Core components:
- Application Load Balancer distributing traffic to EC2 instances
- Auto Scaling Group managing EC2 fleet (scales based on demand)
- Multi-AZ RDS database (MySQL or Postgres) that the EC2 instances connect to
- S3 bucket for application storage that EC2 instances can write to
- CloudWatch for logs from ALB, EC2, and RDS
- VPC with proper networking (public/private subnets, NAT, IGW)
- Security Groups controlling traffic between ALB, EC2, RDS, and S3
- IAM roles letting EC2 access S3, RDS, and CloudWatch

## Service Connectivity

The ALB sits in public subnets and forwards traffic to EC2 instances in private subnets. EC2 instances connect to the RDS database in private subnets through security group rules. EC2 instances write logs to CloudWatch and store files in S3 using IAM role permissions. All database credentials stored in Secrets Manager and accessed by EC2 at runtime.

Internet traffic hits ALB on port 80/443, ALB forwards to EC2 target group, EC2 connects to RDS on port 3306/5432, EC2 pushes logs to CloudWatch Logs, EC2 writes/reads from S3 bucket.

## Required Parameters

Must include this exact parameter:

```yaml
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (like PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

Also need:
- ProjectName
- Environment (dev/test/prod)
- AllowedCidr (which IPs can access the ALB)
- InstanceType
- DBName, DBUsername, DBPassword (use NoEcho: true)
- VpcCidrBlock

## Naming Convention

Every resource name must follow this pattern:

`Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-<resource-type>"`

Examples:
- VPC name: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- Public subnet: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`
- EC2 instance: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance`
- ALB: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb`

This is required for all resources.

## Security Requirements

- S3 buckets must use server-side encryption (AES256)
- CloudWatch Logs for app logs, system logs, and database logs
- Security Groups restrict access to AllowedCidr range only
- IAM roles grant minimum permissions needed (no wildcards)
- RDS in private subnets only, accessible through security groups

## Architecture

Networking:
- VPC spanning 2 availability zones
- Public subnets (for ALB)
- Private subnets (for EC2 and RDS)
- Internet Gateway and NAT Gateways
- Route tables for each subnet type

Compute:
- Launch Template with user data
- Auto Scaling Group (min 2 instances for HA)
- ALB with target group health checks

Database:
- Multi-AZ RDS for failover
- Encrypted storage
- Log exports to CloudWatch

Storage:
- S3 bucket with versioning
- Server-side encryption enabled

IAM:
- Instance profile for EC2
- Policy allowing S3 read/write
- Policy allowing CloudWatch Logs write
- Policy allowing RDS Describe (for connection)

## Output

Single YAML file that:
- Deploys without manual steps
- Works in any AWS account/region (use pseudo parameters)
- Includes comments for each section
- Passes `aws cloudformation validate-template`
- Uses proper CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt)

The stack should be production-ready - handle failures, scale automatically, log everything, and be secure by default.

# Task Context for Phase 2 - Task ID: 101912468

## Task Identification
- Task ID: 101912468
- Region: us-east-1
- Platform: CloudFormation (MANDATORY)
- Language: JSON (MANDATORY)
- Difficulty: hard
- Subtask: AWS CloudFormation
- Status: in_progress

## Full Task Description

### Background
A financial services startup needs to deploy their transaction processing web application in AWS with high availability requirements. The application consists of a web tier handling customer requests and a backend API that processes financial transactions, requiring strict security controls and multi-AZ redundancy.

### Problem Statement
Create a CloudFormation template to deploy a highly available web application infrastructure across multiple availability zones.

#### MANDATORY REQUIREMENTS (Must complete):
1. Create a VPC with 3 public subnets and 3 private subnets across 3 AZs (CORE: VPC)
2. Deploy an RDS Aurora MySQL cluster with one writer and one reader instance (CORE: RDS)
3. Configure an Application Load Balancer in public subnets with target group health checks
4. Set up an Auto Scaling Group with min 2, max 6 EC2 t3.medium instances in private subnets
5. Implement NAT Gateways in each AZ for outbound internet access from private subnets
6. Create all necessary security groups with explicit ingress/egress rules
7. Configure CloudWatch Logs for VPC Flow Logs with specified retention
8. Use Secrets Manager for RDS credentials with Lambda-based rotation

#### OPTIONAL ENHANCEMENTS (If time permits):
- Add CloudFront distribution for static content caching (OPTIONAL: CloudFront) - improves performance globally
- Implement AWS WAF rules on ALB (OPTIONAL: WAF) - adds web application firewall protection
- Add Route 53 health checks with failover routing (OPTIONAL: Route 53) - enables DNS-based failover

### Environment
Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Core services include Application Load Balancer for traffic distribution, Auto Scaling Group with EC2 instances running Amazon Linux 2023, and RDS Aurora MySQL cluster for data persistence. VPC configuration includes public subnets for ALB, private subnets for EC2 instances, and database subnets for RDS. NAT Gateways provide outbound internet access for private instances. Requires AWS CLI configured with appropriate IAM permissions for CloudFormation, EC2, RDS, VPC, and Secrets Manager services.

## Constraints (MANDATORY)

1. All database credentials must be stored in AWS Secrets Manager with automatic rotation enabled
2. The RDS instance must use encrypted storage with customer-managed KMS keys
3. Application Load Balancer must enforce HTTPS-only connections with SSL termination
4. EC2 instances must use IMDSv2 (Instance Metadata Service Version 2) exclusively
5. All resources must be tagged with Environment, Project, and CostCenter tags
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs with 30-day retention
7. Security groups must follow least-privilege principle with no 0.0.0.0/0 inbound rules
8. CloudFormation stack must support blue-green deployments via parameter updates

## AWS Services Required

### Core Services (MANDATORY):
- VPC - Virtual Private Cloud with multi-AZ subnets
- RDS - Aurora MySQL cluster with encrypted storage
- ELB - Application Load Balancer with HTTPS
- Auto Scaling - EC2 Auto Scaling Groups
- EC2 - Compute instances (t3.medium, Amazon Linux 2023)
- Secrets Manager - Database credential management with rotation
- KMS - Customer-managed encryption keys
- CloudWatch - VPC Flow Logs with 30-day retention

### Optional Services (If time permits):
- CloudFront - CDN for static content
- WAF - Web Application Firewall rules
- Route 53 - Health checks and failover routing

## Platform Requirements (MANDATORY)

- Platform: CloudFormation
- Language: JSON
- Output: Single CloudFormation JSON template
- Parameters: Must include parameters for environment-specific configuration
- Outputs: Must output key resource IDs and endpoints (VPC ID, ALB DNS, RDS endpoint, etc.)
- Dependencies: Must define proper resource dependencies
- Blue-Green Support: Stack must support blue-green deployments via parameter updates

## Expected Deliverables

1. CloudFormation JSON template in `/var/www/turing/iac-test-automations/worktree/synth-101912468/lib/template.json`
2. All 8 mandatory requirements implemented
3. Proper resource dependencies configured
4. Parameters for environment-specific values
5. Outputs for all key resources
6. All constraints satisfied
7. Test files validating the infrastructure

## Working Directory
- Worktree Path: /var/www/turing/iac-test-automations/worktree/synth-101912468
- Template Directory: /var/www/turing/iac-test-automations/worktree/synth-101912468/templates/cfn-json
- Library Directory: /var/www/turing/iac-test-automations/worktree/synth-101912468/lib
- Test Directory: /var/www/turing/iac-test-automations/worktree/synth-101912468/test

## Subject Labels
- aws
- infrastructure
- cloud-environment-setup

## Next Steps for Phase 2
1. Change directory to worktree: `cd /var/www/turing/iac-test-automations/worktree/synth-101912468`
2. Review the PROMPT.md for complete requirements
3. Copy appropriate template from templates/cfn-json/
4. Implement all 8 mandatory requirements
5. Ensure all 8 constraints are satisfied
6. Create comprehensive tests
7. Validate using CloudFormation validation tools

# Environment Migration - CloudFormation Infrastructure

## Background
A financial services company is migrating their monolithic application from on-premises infrastructure to AWS. The application currently runs in a traditional data center with dedicated database servers and application servers. They need to replicate their existing three-tier architecture in AWS while maintaining data consistency during the migration phase.

## Problem Statement
Create a CloudFormation template in JSON format to build a migration-ready infrastructure for moving a legacy application to AWS. The configuration must:

1. Create a VPC with public and private subnets across 2 availability zones
2. Deploy an Application Load Balancer in public subnets with health checks
3. Set up Auto Scaling Groups with launch templates for application servers in private subnets
4. Configure RDS PostgreSQL instance in private subnets with Multi-AZ enabled
5. Create separate target groups for blue and green deployments
6. Implement security groups that allow ALB to communicate with app servers on port 8080
7. Configure app servers to connect to RDS on port 5432
8. Store database credentials in Secrets Manager with automatic rotation
9. Tag all resources with Environment='migration' and MigrationPhase tags
10. Output the ALB DNS name and RDS endpoint for application configuration

## Constraints
1. The RDS instance must use Multi-AZ deployment with automated backups retained for 7 days
2. All compute resources must be deployed across at least 2 availability zones
3. Database credentials must be stored in AWS Secrets Manager and rotated automatically
4. The migration must support blue-green deployment strategy with separate target groups
5. Network traffic between tiers must be restricted using security groups with least privilege access

## Environment Details
- Migration environment in eu-central-2 region
- Three-tier architecture: Application Load Balancer, Auto Scaling Groups for EC2 instances, and RDS PostgreSQL database
- Infrastructure spans across 2 availability zones
- Public subnets for ALB, private subnets for application and database tiers
- VPC CIDR: 10.0.0.0/16 with subnet allocation across AZs
- NAT Gateways provide outbound internet access for private instances

## Expected Output
A CloudFormation template (JSON format) that creates the complete infrastructure with:
- Proper network isolation across tiers
- Automated scaling capabilities
- Secure credential management
- Clear resource dependencies and logical grouping
- Comprehensive outputs for ALB DNS name and RDS endpoint

## Platform Transformation Note
**IMPORTANT**: The original task description mentioned "Pulumi with Python", but per CSV mandate, this implementation MUST use CloudFormation with JSON. All Pulumi-specific concepts (stacks, ComponentResource patterns, etc.) should be adapted to CloudFormation equivalents (nested stacks, logical resource grouping, etc.).

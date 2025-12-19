# Infrastructure as Code Task: Environment Migration

## Background
Your company is migrating from an on-premises data center to AWS. The legacy application uses a three-tier architecture with web servers, application servers, and database servers that must be replicated in AWS while maintaining strict network isolation and security boundaries.

## Problem Statement
Create a CloudFormation template to migrate your on-premises three-tier application network architecture to AWS VPC. The configuration must: 1. Create a VPC with CIDR 10.0.0.0/16 in us-east-1 region. 2. Deploy 6 subnets across 2 availability zones: public subnets (10.0.1.0/24, 10.0.2.0/24), private app subnets (10.0.11.0/24, 10.0.12.0/24), and isolated database subnets (10.0.21.0/24, 10.0.22.0/24). 3. Configure Internet Gateway for public subnets and NAT Gateways (one per AZ) for private subnet outbound traffic. 4. Create security groups: WebServerSG (ports 80, 443 from 0.0.0.0/0), AppServerSG (port 8080 from WebServerSG only), DatabaseSG (port 3306 from AppServerSG only). 5. Implement Network ACLs that deny all traffic by default and explicitly allow only required ports between tiers. 6. Add CloudFormation parameters for ProjectName and EnvironmentType. 7. Tag all resources with Environment and MigrationPhase tags. 8. Configure route tables ensuring database subnets have no internet routes. 9. Export all subnet IDs and security group IDs as stack outputs for use by application deployment stacks. Expected output: A complete JSON CloudFormation template that creates a production-ready VPC matching the on-premises network segmentation, with proper isolation between web, application, and database tiers, ready for application migration.

## Environment
Production-ready VPC infrastructure in us-east-1 region for migrating three-tier application from on-premises to AWS. Requires CloudFormation JSON template creating VPC with 6 subnets across 3 availability zones - 2 public subnets for web tier, 2 private subnets for application tier, and 2 isolated subnets for database tier. NAT Gateways in each AZ for outbound connectivity. Internet Gateway for public subnets. Network ACLs and Security Groups enforcing strict traffic flow between tiers.

## Constraints
1. Use JSON format exclusively for the CloudFormation template
2. VPC CIDR must be 10.0.0.0/16 with specific subnet allocation
3. Database subnets must have no direct internet access
4. Application subnets must access internet only through NAT Gateway
5. Security groups must follow least-privilege principle
6. All resources must be tagged with Environment and MigrationPhase tags
7. Use CloudFormation parameters for reusable values
8. Network ACLs must explicitly deny all traffic except required ports
9. Output values must include all subnet IDs and security group IDs

Hey team,

We need to build a secure VPC infrastructure for our new fintech payment processing application. The business is getting serious about PCI-DSS compliance and they want proper network segmentation from day one. I've been asked to create this using AWS CDK with TypeScript since that's what we're standardizing on.

The payment processing platform needs to run in a production-ready multi-AZ environment in us-east-1. We're talking about the full three-tier architecture with load balancers in public subnets, application containers in private subnets, and eventually an Aurora PostgreSQL database in completely isolated database subnets. Security is the top priority here because we're handling payment data.

The team has given me pretty specific requirements about the network topology. They want three availability zones for redundancy, NAT Gateways in each AZ for high availability, and VPC Flow Logs going to S3 so we can audit all the traffic. Plus we need VPC endpoints for S3 and DynamoDB to keep costs down and improve security.

## What we need to build

Create a production-ready VPC infrastructure using **AWS CDK with TypeScript** for a PCI-DSS compliant payment processing application.

### Core Requirements

1. **VPC Configuration**
   - VPC with CIDR block 10.0.0.0/16
   - Span three availability zones in us-east-1
   - Enable DNS hostnames and DNS resolution
   - Total of 6 subnets (3 public + 3 private)

2. **Public Subnets**
   - One public subnet per availability zone
   - Internet Gateway attached
   - Route tables configured for internet access
   - Will host Application Load Balancers

3. **Private Subnets**
   - One private subnet per availability zone
   - No direct internet gateway attachment
   - NAT Gateway in each AZ for outbound connectivity
   - Will host ECS Fargate containers

4. **Security Groups**
   - ALB security group (ports 80/443 ingress)
   - ECS security group (port 8080 ingress from ALB)
   - RDS security group (port 5432 ingress from ECS)
   - Follow least privilege principle

5. **VPC Flow Logs**
   - Log all VPC traffic to S3 bucket
   - 5-minute aggregation intervals
   - S3 bucket with proper lifecycle policies

6. **VPC Endpoints**
   - S3 gateway endpoint for cost savings
   - DynamoDB gateway endpoint for cost savings
   - Reduce data transfer costs and improve security

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **EC2.Vpc** construct for VPC creation
- Use **EC2.SecurityGroup** for security groups
- Use **S3.Bucket** for Flow Logs storage
- Use **EC2.FlowLog** for traffic logging
- Use **EC2.GatewayVpcEndpoint** for S3 and DynamoDB
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- NAT Gateways required (no NAT instances)

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Must have exactly 6 subnets across 3 availability zones
- Database traffic must remain in private subnets
- NAT instances are prohibited - use NAT Gateways only
- Security groups must use explicit port definitions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Mandatory Tagging

All resources must include these tags:
- Environment: 'production'
- Project: 'payment-processor'
- CostCenter: 'engineering'

### CloudFormation Outputs

Export the following as stack outputs:
- VPC ID
- Public subnet IDs (all three)
- Private subnet IDs (all three)
- ALB security group ID
- ECS security group ID
- RDS security group ID

## Success Criteria

- Functionality: VPC with proper multi-AZ setup, NAT Gateways, and security groups
- Security: Flow Logs enabled, security groups follow least privilege
- Performance: VPC endpoints configured for S3 and DynamoDB
- Compliance: PCI-DSS ready network segmentation
- Resource Naming: All resources include environmentSuffix
- Code Quality: TypeScript, well-tested, documented
- Synthesizes: cdk synth produces valid CloudFormation template
- Deployable: cdk deploy creates all resources successfully

## What to deliver

- Complete AWS CDK TypeScript implementation
- VPC with 10.0.0.0/16 CIDR across 3 AZs
- 3 public subnets with Internet Gateway
- 3 private subnets with NAT Gateways
- Security groups for ALB, ECS, and RDS
- VPC Flow Logs to S3 bucket
- VPC endpoints for S3 and DynamoDB
- Unit tests for all components
- Integration tests for deployment validation
- Documentation and deployment instructions

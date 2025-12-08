Hey team,

We need to build infrastructure for a payment processing web application that handles sensitive financial transactions. A fintech startup has tasked us with creating this infrastructure, and they have strict compliance requirements for data isolation and audit logging. The application must maintain PCI DSS compliance with complete infrastructure traceability.

I've been asked to create this using TypeScript with CDKTF (Terraform CDK). The business wants a fully functional, production-ready infrastructure that can deploy their payment processing application securely and reliably.

The main challenge here is meeting all the compliance requirements while maintaining high availability and security. We need to ensure proper network isolation, encrypted data at rest and in transit, comprehensive logging, and strict access controls. Every component needs to be tagged for cost tracking and compliance auditing.

## What we need to build

Create a payment processing infrastructure using **CDKTF with TypeScript** for a fintech application with PCI DSS compliance requirements.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with 3 public and 3 private subnets across different availability zones in us-east-2
   - Deploy NAT Gateways for private subnet internet access
   - Configure route tables for public and private subnets
   - Enable DNS hostnames and DNS support

2. **ECS Deployment**
   - Deploy ECS cluster with Fargate launch type
   - Create task definition for payment service container
   - Configure tasks to run in private subnets only (no direct internet access)
   - Set specific CPU and memory limits for tasks
   - Deploy tasks behind Application Load Balancer

3. **Database Layer**
   - Set up RDS Aurora MySQL cluster with multi-AZ deployment
   - Enable encryption at rest using customer-managed KMS keys
   - Configure automated backups with 35 days minimum retention
   - Enable slow query logs to CloudWatch
   - Deploy in private subnets

4. **Load Balancer**
   - Configure Application Load Balancer in public subnets
   - Set up HTTPS listener with SSL termination using ACM certificates
   - Create target group for ECS tasks
   - Configure health checks for ECS services

5. **Logging and Monitoring**
   - Implement CloudWatch Log Groups for ECS tasks with 7-year retention (2555 days)
   - Implement CloudWatch Log Groups for RDS slow query logs with 7-year retention
   - Enable VPC flow logs and route to S3 bucket
   - Configure proper log format and aggregation

6. **Storage**
   - Create S3 bucket for VPC flow logs
   - Configure lifecycle rules to transition logs to Glacier after 90 days
   - Enable versioning and encryption for S3 buckets
   - Set up proper access policies

7. **IAM Roles and Policies**
   - Create ECS task execution role (for pulling images, writing logs)
   - Create ECS task role with specific permissions for S3 and Secrets Manager
   - Follow principle of least privilege (no wildcard permissions)
   - All policies must specify exact resources and actions

8. **Security Groups**
   - Configure ALB security group allowing only HTTPS (port 443) inbound
   - Configure ECS task security group allowing traffic only from ALB
   - Configure RDS security group allowing connections only from ECS tasks
   - All security groups must explicitly deny all other traffic

9. **VPC Flow Logs**
   - Enable VPC flow logs at VPC level
   - Route flow logs to S3 bucket
   - Configure proper IAM policies for flow log delivery
   - Capture all traffic (accepted and rejected)

10. **Secrets Management**
    - Store RDS master password in AWS Secrets Manager
    - Store application secrets in AWS Secrets Manager
    - Use CDKTF variables with sensitive flag for other sensitive data
    - Grant ECS task role access to required secrets

11. **Resource Tagging**
    - Apply consistent tags across all resources: Environment, Application, CostCenter
    - Use meaningful tag values for cost tracking and compliance

12. **Infrastructure Outputs**
    - Export ALB DNS name for application access
    - Export RDS cluster endpoint for database connections
    - Export S3 bucket name for flow logs

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **VPC** with proper subnet isolation and routing
- Use **ECS Fargate** for containerized application deployment
- Use **RDS Aurora MySQL** for database with encryption and multi-AZ
- Use **Application Load Balancer** for traffic distribution and SSL termination
- Use **CloudWatch Logs** for centralized logging with long-term retention
- Use **S3** for VPC flow log storage with lifecycle management
- Use **IAM** for granular access control with least privilege
- Use **KMS** for encryption key management
- Use **Secrets Manager** for credential storage
- Use **ACM** for SSL certificate management
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (use removal_policy = "DESTROY", no RETAIN policies)
- Include proper error handling and validation

### Deployment Requirements (CRITICAL)

- **Destroyability**: All resources must use removal_policy = "DESTROY" or equivalent. FORBIDDEN: Any RETAIN policies on S3 buckets, RDS clusters, or other resources. The infrastructure must be fully destroyable for testing purposes.
- **Resource Naming**: All resources MUST include an environmentSuffix parameter (passed as CDKTF variable) to ensure unique names across deployments. Format: resource-type-${environmentSuffix}
- **No Hardcoded Values**: Use CDKTF variables for region, CIDR blocks, instance types, and other configurable values
- **Secrets Handling**: Never hardcode passwords or secrets. Use sensitive variables or AWS Secrets Manager with generated passwords

### Constraints

1. VPC flow logs must be enabled and stored in S3 with lifecycle policies (transition to Glacier after 90 days)
2. All security groups must explicitly deny all traffic except required ports (HTTPS for ALB, database port for RDS)
3. All RDS instances must use encrypted storage with customer-managed KMS keys
4. Application Load Balancer must terminate SSL with ACM certificates (use certificate ARN as variable)
5. ECS task definitions must use specific CPU and memory limits (256 CPU units, 512 MB memory minimum)
6. IAM roles must follow principle of least privilege with no wildcard permissions on resources
7. ECS tasks must run in private subnets with no direct internet access
8. All resources must be tagged with Environment, Application, and CostCenter tags
9. RDS automated backups must be retained for 35 days minimum
10. CloudWatch Logs retention must be set to 7 years (2555 days) for compliance

### Service-Specific Requirements

- **RDS Aurora**: Use serverless v2 if possible for cost optimization, or provisioned with smallest instance type (db.t3.small or db.t4g.small)
- **NAT Gateway**: Required for private subnet internet access (for ECS tasks pulling images), but can use single NAT for cost optimization in non-production
- **KMS Keys**: Create customer-managed KMS key with alias for RDS encryption
- **ACM Certificate**: Accept certificate ARN as input variable (certificate must exist before deployment)
- **Secrets Manager**: Use generated passwords for RDS master user, grant ECS task role read access

## Success Criteria

- **Functionality**: Complete CDKTF TypeScript infrastructure that synthesizes and deploys successfully
- **Security**: All security groups properly configured, encryption enabled, secrets managed securely
- **Compliance**: VPC flow logs enabled, 7-year log retention, proper tagging, encrypted storage
- **High Availability**: Multi-AZ RDS deployment, multiple availability zones for subnets, ALB with health checks
- **Network Isolation**: Private subnets for ECS and RDS, public subnets for ALB and NAT, proper security group rules
- **IAM Security**: Least privilege policies, no wildcard permissions, separate execution and task roles
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be destroyed (no RETAIN policies)
- **Code Quality**: TypeScript code follows CDKTF best practices, properly typed, well-documented

## What to deliver

- Complete CDKTF TypeScript implementation in lib/ directory
- VPC with public/private subnets, NAT Gateways, route tables, security groups
- ECS cluster with Fargate task definition for payment service
- RDS Aurora MySQL cluster with KMS encryption and multi-AZ
- Application Load Balancer with HTTPS listener and target group
- CloudWatch Log Groups with 7-year retention
- S3 bucket for VPC flow logs with Glacier lifecycle policy
- IAM roles for ECS execution and task with least privilege policies
- Secrets Manager configuration for RDS credentials
- KMS key for RDS encryption
- Proper resource tagging scheme across all resources
- Infrastructure outputs for ALB DNS, RDS endpoint, S3 bucket name
- Configuration variables for environmentSuffix, region, certificate ARN
- Complete documentation in README.md with deployment instructions

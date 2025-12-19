# Multi-Environment Payment Processing Infrastructure

Hey team,

We need to build a robust multi-environment deployment system for our payment processing infrastructure. A fintech startup has been struggling with configuration drift between their dev, staging, and production environments, which has led to some nasty production incidents. They need a solution that guarantees environment parity while still allowing controlled variations for things like instance sizes and scaling thresholds.

The business wants us to deploy identical payment processing infrastructure across three environments using **Pulumi with TypeScript**. They're currently running their payment processors in containers on ECS Fargate, backed by RDS Aurora PostgreSQL databases. Each environment needs to be deployed in a different AWS region (us-east-1 for prod, us-west-2 for staging, and eu-west-1 for dev), but the infrastructure topology must be identical across all three.

The key challenge here is maintaining strict parity while still allowing necessary variations. For example, the dev environment should use smaller db.t3.medium instances to save costs, while production needs beefy db.r5.xlarge instances for performance. Similarly, auto-scaling policies should be identical in structure but with different CPU thresholds per environment. The team wants to use Pulumi's stack configuration system to manage these variations without duplicating code.

## What we need to build

Create a **Pulumi with TypeScript** solution for deploying identical payment processing infrastructure across multiple environments with parameterized variations.

### Core Requirements

1. **ECS Fargate Services**
   - Deploy containerized payment processors in each environment
   - Use shared ECR repository across all environments
   - Identical service definitions with environment-specific scaling

2. **RDS Aurora PostgreSQL Databases**
   - Environment-specific instance sizing: db.t3.medium (dev), db.r5.large (staging), db.r5.xlarge (prod)
   - Database passwords generated via Pulumi random provider
   - Store credentials in AWS Secrets Manager

3. **VPC Infrastructure**
   - Identical topology across environments with 3 availability zones
   - Environment-specific CIDR blocks: 10.0.0.0/16 (dev), 10.1.0.0/16 (staging), 10.2.0.0/16 (prod)
   - Public and private subnets in each AZ
   - Validate CIDR blocks don't overlap before deployment

4. **Route53 Private Hosted Zones**
   - Service discovery within each environment
   - Environment-specific DNS namespaces

5. **Application Load Balancers**
   - Identical path-based routing rules across environments
   - Environment-specific health check configurations

6. **Auto-Scaling Policies**
   - Defined in single location and parameterized
   - Environment-specific CPU thresholds: 50% (dev), 70% (staging/prod)

7. **Cross-Stack References**
   - Share common resources like ECR repositories between environments
   - Component resources for reusability

8. **Comparison Report**
   - Output structured JSON showing configuration differences between environments

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **ECS Fargate** for container orchestration
- Use **RDS Aurora PostgreSQL** for persistence
- Use **Route53** for DNS management
- Use **VPC** with public/private subnets across 3 AZs
- Use **Application Load Balancer (ALB)** for traffic distribution
- Use **ECR** for container registry (shared across environments)
- Use **CloudWatch** for monitoring and auto-scaling
- Use **Secrets Manager** for credential storage
- Implement reusable Pulumi ComponentResource classes
- Create stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- Stack config files must not exceed 50 lines each
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{env}-{service}-{resource}`
- Multi-region deployment: us-east-1 (prod), us-west-2 (staging), eu-west-1 (dev)
- Requires Pulumi CLI 3.x, Node.js 18+, TypeScript 5.x
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming
- Resource naming pattern: `{env}-{service}-{resource}` (e.g., prod-payment-db, dev-payment-alb)
- All resources must use RemovalPolicy.DESTROY or equivalent to ensure destroyability
- NO resources should use Retain policies
- Network ACLs must be identical across environments (no hardcoded values)
- Security group rules must be defined through shared modules
- All infrastructure components must be defined as reusable ComponentResource classes
- Cross-stack references for shared resources like ECR repositories

### Constraints

- Stack configuration files limited to 50 lines maximum
- Single shared ECR repository across all environments
- Database passwords must be randomly generated (never hardcoded)
- Security group rules must be identical across environments
- Network ACLs must be parameterized (no hardcoded values)
- CIDR blocks must be validated for non-overlap
- All configuration variations managed through Pulumi stack configs
- All resources must be destroyable for testing purposes
- Proper error handling and validation

## Success Criteria

- **Functionality**: Infrastructure deploys successfully across all three environments
- **Environment Parity**: Identical topology and configuration across dev/staging/prod
- **Configuration Management**: Environment-specific values managed via stack configs
- **Resource Naming**: All resources include environmentSuffix following {env}-{service}-{resource} pattern
- **Destroyability**: All resources can be torn down cleanly (no Retain policies)
- **Reusability**: ComponentResource classes can be reused for new environments
- **Validation**: CIDR overlap validation prevents deployment conflicts
- **Security**: Credentials stored securely in Secrets Manager
- **Comparison Report**: JSON output showing configuration differences between environments
- **Code Quality**: TypeScript, well-tested, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/
- ComponentResource classes for VPC, ECS, RDS, ALB, Route53
- Stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- Index file (index.ts) orchestrating environment-specific deployments
- ECS Fargate service definitions
- RDS Aurora PostgreSQL cluster configurations
- VPC with public/private subnets across 3 AZs per environment
- Application Load Balancer with path-based routing
- Route53 private hosted zones
- CloudWatch auto-scaling policies
- Secrets Manager integration for database credentials
- Unit tests for all components in test/
- Documentation and deployment instructions in lib/README.md
- Comparison report generation logic outputting structured JSON

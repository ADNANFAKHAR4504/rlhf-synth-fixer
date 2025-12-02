Hey team,

We need to refactor an existing ECS Fargate deployment that has accumulated technical debt over time. The current Pulumi TypeScript code has several issues that are making it hard to maintain and costing us more than it should. I've been asked to clean this up and optimize the configuration.

The deployment works, but the code is messy. We have hardcoded values all over the place, inefficient resource loops, and missing cost controls. The ops team is also complaining that they can't track which environment resources belong to because naming is inconsistent.

## What we need to build

Refactor and optimize an ECS Fargate deployment using **Pulumi with TypeScript**.

### Core Requirements

1. **Parameterize Container Configuration**
   - Replace hardcoded memory and CPU values with configurable stack parameters
   - Make it easy to adjust resource allocation per environment
   - Use Pulumi config for environment-specific settings

2. **Fix Resource Naming**
   - Implement consistent naming convention using stack name prefixes
   - All resources must include environmentSuffix for uniqueness
   - Follow pattern: `{resource-type}-{environmentSuffix}`

3. **Add Cost Allocation Tags**
   - Tag all resources with Environment, Team, and Project
   - Enable proper cost tracking and attribution
   - Make tags consistent across all AWS resources
   - **Include tags on ALL resources**: VPC, subnets, security groups, IAM roles, ECS resources, etc.

4. **Fix Target Group Loop**
   - Current code creates 10 separate target groups in a loop
   - This is wasteful and causes deployment issues
   - Refactor to use a single target group properly configured

5. **Configure Health Checks**
   - Add proper health check configuration to ALB target group
   - Set reasonable timeouts and intervals
   - Configure healthy/unhealthy thresholds
   - **Make health check path configurable** (default: `/`)

6. **Consolidate IAM Roles**
   - Remove duplicate IAM role definitions
   - Use a single execution role for ECS tasks
   - Ensure proper permissions for CloudWatch Logs

7. **Add Log Retention Policy**
   - Configure CloudWatch log retention to 7 days
   - Reduce storage costs from indefinite retention
   - Ensure logs are kept long enough for debugging

8. **Export Key Outputs**
   - Export ALB DNS name for accessing the application
   - Export ECS service ARN for monitoring and automation
   - Make outputs easily consumable by other stacks

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon ECS Fargate** for container orchestration
- **Application Load Balancer** for traffic distribution
- **CloudWatch Logs** for container logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- **Use `aws.getRegion()` for dynamic region detection** in CloudWatch log configuration (avoid hardcoding region)

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names
- Resource naming pattern: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (FORBIDDEN: RemovalPolicy.RETAIN or DeletionProtection)
- This ensures clean teardown after testing
- **Support `ENVIRONMENT_SUFFIX` environment variable** as fallback for Pulumi config

### Constraints

- Maintain backward compatibility with existing deployments
- All resources must be properly tagged for cost tracking
- No hardcoded configuration values
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation
- Code must be production-ready and well-documented

### Configuration Parameters

The following should be configurable via Pulumi config or environment variables:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `environmentSuffix` | (required) | Environment identifier (e.g., `dev`, `prod`, `pr123`) |
| `containerMemory` | `512` | Container memory in MB |
| `containerCpu` | `256` | Container CPU units |
| `desiredCount` | `2` | Number of ECS tasks to run |
| `team` | `platform` | Team name for cost allocation tags |
| `project` | `ecs-optimization` | Project name for cost allocation tags |

### Design Decisions & Notes

The following are **intentional design choices** for this demo/test infrastructure:

1. **ALB Security Group allows 0.0.0.0/0**: This is expected for a public-facing ALB. In production, consider restricting to specific IP ranges or using WAF.

2. **Tasks have public IPs**: Required for Fargate tasks in public subnets to pull images from ECR/Docker Hub without NAT Gateway. For production, use private subnets with NAT Gateway.

3. **Uses nginx:latest image**: This is a demo deployment. For production, always use versioned/immutable tags.

4. **VPC created inline**: This stack creates its own VPC for isolation. For production, consider accepting VPC/subnet IDs as parameters.

5. **No KMS encryption**: CloudWatch logs and other resources use default encryption. For sensitive workloads, add KMS key parameter.

## Success Criteria

- **Functionality**: All 8 requirements implemented and working
- **Maintainability**: Configuration values externalized and parameterized
- **Cost Optimization**: Log retention policy and single target group reduce costs
- **Operability**: Proper tags enable cost tracking and resource management
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean TypeScript code, properly typed, well-documented

## What to deliver

- Complete Pulumi TypeScript implementation
- Parameterized container configuration using Pulumi config
- Consistent resource naming with environmentSuffix
- Cost allocation tags on all resources
- Single properly configured ALB target group
- Health check configuration
- Consolidated IAM roles
- CloudWatch log retention policy (7 days)
- Stack outputs for ALB DNS and service ARN

## Files NOT Required

The following files are **NOT required** for this Pulumi TypeScript project:

- **README.md**: Deployment documentation is not required; this PROMPT.md serves as the specification
- **requirements.txt**: This is a TypeScript/Node.js project, not Python. Dependencies are managed via `package.json`
- **Pipfile**: Python dependencies are only for the optimization script, not the IaC code

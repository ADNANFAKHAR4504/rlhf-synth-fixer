# Multi-Environment Fraud Detection Infrastructure

Hey team,

We need to build a multi-environment fraud detection infrastructure for a financial services company. They're running real-time fraud detection systems and need identical infrastructure across development, staging, and production environments. The challenge is maintaining zero configuration drift while allowing environment-specific configurations like resource sizing and permissions. I've been asked to create this using **Pulumi with Python** to leverage its component resource model and automation capabilities.

The company currently struggles with inconsistent configurations across environments. Dev has different database schemas than prod, staging uses different IAM permissions, and nobody's sure if the infrastructure matches what's in code. They need a solution that enforces consistency through reusable components while still allowing necessary environment-specific variations.

## What we need to build

Create a multi-environment fraud detection infrastructure using **Pulumi with Python** that maintains consistency across three AWS environments (dev, staging, prod) deployed to different regions (us-east-1, us-west-2, eu-west-1). The solution must use Pulumi's ComponentResource pattern and Automation API for drift detection.

### Core Requirements

1. **Base Component Architecture**
   - Define a ComponentResource class that encapsulates the complete fraud detection stack
   - Include ECS Fargate cluster for containerized services
   - Include RDS Aurora PostgreSQL cluster for transaction data storage
   - Include DynamoDB table for real-time fraud scoring rules
   - Make all resource configurations parameterizable

2. **Environment-Specific Stacks**
   - Create three separate Pulumi stacks: dev, staging, prod
   - Each stack instantiates the base component with environment-specific configs
   - Use Pulumi config files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml) for parameters
   - Deploy to different regions: prod to us-east-1, staging to us-west-2, dev to eu-west-1

3. **Cross-Region Data Replication**
   - Implement Aurora read replicas from prod (us-east-1) to staging and dev regions
   - Configure DynamoDB global tables for multi-region replication of scoring rules
   - Set up VPC peering between regions for secure replication traffic
   - Ensure data flows from production to lower environments for realistic testing

4. **ECS Service Configuration**
   - Deploy containerized fraud detection services on ECS Fargate
   - Use environment-specific container images (different versions for dev/staging/prod)
   - Configure environment-specific CPU and memory allocations
   - Implement auto-scaling policies based on request volume

5. **Application Load Balancer Setup**
   - Create ALBs in public subnets for each environment
   - Configure path-based routing to different service versions
   - Set up health checks for fraud detection services
   - Implement SSL termination with ACM certificates

6. **IAM Security Model**
   - Create environment-appropriate IAM roles and policies
   - Dev environment: read-only access to production data replicas
   - Staging environment: limited write access for testing
   - Prod environment: full access with strict audit logging
   - Follow principle of least privilege

7. **Monitoring and Observability**
   - Create CloudWatch dashboards that aggregate metrics across all environments
   - Include key metrics: transaction processing rate, fraud detection accuracy, latency
   - Set up cross-environment comparison views
   - Enable detailed ECS and Aurora metrics

8. **Alerting Configuration**
   - Set up SNS topics for each environment with different alert routing
   - Configure environment-specific alert thresholds (stricter for prod)
   - Dev alerts: email to dev team
   - Staging alerts: email and Slack
   - Prod alerts: PagerDuty integration for 24/7 response

9. **Stack Outputs and Cross-Stack References**
   - Export critical resource ARNs (ECS cluster, Aurora endpoint, DynamoDB table)
   - Export ALB DNS names and endpoints
   - Use Pulumi StackReference to allow staging/dev stacks to reference prod resources
   - Enable secure cross-stack data sharing

10. **Drift Detection Implementation**
    - Create a Python script using Pulumi Automation API
    - Compare actual AWS resource state vs desired Pulumi state
    - Detect configuration drift across all three environments
    - Generate drift reports showing discrepancies
    - Run as scheduled job or on-demand

11. **Resource Tagging Strategy**
    - Tag all resources with Environment (dev/staging/prod)
    - Tag with Owner (team name)
    - Tag with CostCenter for billing allocation
    - Use consistent tag naming across all resources
    - Enable tag-based cost reporting

12. **Network Architecture**
    - VPC in each region with 3 availability zones
    - Private subnets for ECS tasks and Aurora databases
    - Public subnets for ALBs and NAT gateways
    - Configure security groups for proper network isolation
    - Set up VPC peering for cross-region replication

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use Pulumi 3.x with Python 3.9 or higher
- Use **ECS Fargate** for containerized workloads
- Use **RDS Aurora PostgreSQL** for transaction storage with cross-region read replicas
- Use **DynamoDB Global Tables** for multi-region scoring rule replication
- Use **Application Load Balancer** for path-based routing
- Use **CloudWatch** for dashboards and metrics aggregation
- Use **SNS** for environment-specific alerting
- Use **IAM** for environment-appropriate permissions
- Use **VPC** with proper network segmentation
- Deploy to three regions: us-east-1 (prod), us-west-2 (staging), eu-west-1 (dev)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {env}-{region}-{resource}-{suffix}
- Use explicit AWS provider configurations for multi-region deployments
- Implement custom ComponentResource classes for reusability
- All environment-specific values from Pulumi config, not hardcoded
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** parameter in their names
- Resource naming pattern: {env}-{region}-{resource}-{environmentSuffix}
- All resources MUST be destroyable - no RemovalPolicy.RETAIN or RETAIN deletion policies
- Use RemovalPolicy.DESTROY or DELETE for all resources including databases
- Do NOT create GuardDuty detectors (account-level resource, only one per account)
- For AWS Config: use service-role/AWS_ConfigRole managed policy for IAM role
- For Lambda with Node.js 18+: import AWS SDK v3 modules explicitly (not included by default)

### Constraints

- Use Pulumi StackReference for sharing outputs between stacks
- Implement drift detection using Pulumi Automation API
- No hardcoded credentials or configuration values
- All secrets must use Pulumi config with --secret flag
- Follow AWS best practices for security and high availability
- Resources must be in private subnets except ALBs
- Enable encryption at rest for Aurora and DynamoDB
- Enable encryption in transit for all data transfers
- All resources must be destroyable for cost management
- Include proper error handling and validation in all code
- Use type hints in Python code for clarity

## Success Criteria

- **Functionality**: Three working environments with identical infrastructure patterns
- **Consistency**: All environments use same base ComponentResource with only config differences
- **Replication**: Aurora read replicas and DynamoDB global tables working across regions
- **Monitoring**: CloudWatch dashboards showing aggregated metrics from all environments
- **Security**: IAM roles properly scoped per environment (read-only dev, limited staging, full prod)
- **Drift Detection**: Automation API script successfully detects configuration drift
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with Environment, Owner, CostCenter
- **Cross-Stack**: StackReference successfully shares prod outputs to staging and dev
- **Code Quality**: Python code with type hints, well-documented, follows Pulumi best practices
- **Testing**: Comprehensive unit and integration tests for all components

## What to deliver

- Complete **Pulumi with Python** implementation
- ECS Fargate clusters with containerized fraud detection services
- RDS Aurora PostgreSQL with cross-region read replicas
- DynamoDB global tables for multi-region rule replication
- Application Load Balancers with path-based routing
- IAM roles with environment-appropriate permissions
- CloudWatch dashboards aggregating cross-environment metrics
- SNS topics for environment-specific alerting
- VPC networking with multi-region peering
- Drift detection script using Automation API
- Pulumi.yaml stack configuration file
- Environment-specific config files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- ComponentResource class for reusable stack pattern
- Main Pulumi program (__main__.py)
- Unit tests for all components (100% coverage target)
- Integration tests for multi-environment scenarios
- README.md with deployment instructions
- Documentation of architecture decisions

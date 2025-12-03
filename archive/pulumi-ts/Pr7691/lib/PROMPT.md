Hey team,

We've got an ECS deployment that's been running for a while, but we're seeing some issues with resource utilization and missing monitoring. The current setup is over-provisioned with excessive CPU allocation, hard-coded configuration values, and IAM permissions that are way too broad. We need to refactor this infrastructure to be more cost-effective, secure, and production-ready.

The task is to optimize an existing ECS deployment using **Pulumi with TypeScript**. We're looking at reducing costs through right-sizing, implementing proper autoscaling, adding monitoring and alerting, and fixing security issues. The business wants to maintain application performance while reducing infrastructure costs and improving operational visibility.

## What we need to build

Refactor and optimize an existing ECS deployment using **Pulumi with TypeScript** to address resource over-provisioning, missing monitoring, and security issues.

### Core Requirements

1. **Resource Optimization**
   - Reduce ECS task CPU allocation from 2048 to 512 units while maintaining performance
   - Implement memory autoscaling between 1GB and 4GB based on actual usage patterns
   - Right-size resources to match actual workload requirements

2. **Configuration Management**
   - Convert hard-coded container image URIs to configurable stack parameters
   - Make configuration flexible and environment-specific
   - Support easy updates without code changes

3. **Monitoring and Alerting**
   - Add CloudWatch alarm for CPU utilization above 80 percent
   - Add CloudWatch alarm for memory usage above 90 percent
   - Enable proper alerting for operational issues

4. **Security Improvements**
   - Fix IAM role permissions that grant excessive s3:* access
   - Implement least privilege principle with only GetObject permission
   - Review and tighten security posture

5. **Best Practices Implementation**
   - Replace deprecated TaskDefinition properties with current best practices
   - Implement proper resource tagging for cost allocation across development teams
   - Enable ECS container insights for enhanced monitoring capabilities

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **ECS** for container orchestration
- Use **CloudWatch** for monitoring and alarms
- Use **Application Auto Scaling** for memory autoscaling
- Use **IAM** roles with least privilege permissions
- Use **VPC** for network configuration
- Use **ECR** for container image registry
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming across environments
- All resources must be destroyable with no RemovalPolicy RETAIN or DeletionPolicy Retain
- Use DESTROY removal policy for all resources to enable proper cleanup
- Container images must be parameterized, not hard-coded
- Enable proper logging and monitoring for all ECS tasks

### Constraints

- Maintain application performance while reducing CPU from 2048 to 512 units
- Memory autoscaling must respond appropriately to load changes
- All IAM permissions must follow least privilege principle
- CloudWatch alarms must trigger at appropriate thresholds
- All resources must be destroyable for testing and cleanup
- No hard-coded values in infrastructure code
- Proper error handling and validation required

## Success Criteria

- **Functionality**: ECS tasks run successfully with reduced CPU allocation
- **Autoscaling**: Memory scales between 1GB and 4GB based on usage
- **Monitoring**: CloudWatch alarms trigger at 80 percent CPU and 90 percent memory
- **Security**: IAM roles grant only s3:GetObject permission, not s3:*
- **Configuration**: Container images configurable via stack parameters
- **Best Practices**: Deprecated properties replaced, resources tagged, container insights enabled
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript with proper types, well-tested, documented
- **Destroyability**: All resources can be cleaned up without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- ECS task definition with optimized CPU (512) and memory autoscaling
- CloudWatch alarms for CPU and memory thresholds
- IAM roles with least privilege permissions
- Application Auto Scaling configuration for memory
- Container insights enabled on ECS cluster
- Resource tagging for cost allocation
- Configurable container image parameters
- package.json with all required Pulumi dependencies
- Comprehensive unit tests for infrastructure code
- Documentation with deployment instructions and configuration guidance
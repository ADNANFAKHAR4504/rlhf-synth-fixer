# Multi-Environment Infrastructure Deployment

Hey team,

We need to tackle configuration drift in our microservices platform. Recent incidents have shown us that inconsistencies between development, staging, and production environments are causing real problems with deployment failures and making debugging significantly harder. Management has decided we need to implement proper Infrastructure as Code to ensure all three environments stay perfectly consistent.

I've been asked to create this using **Pulumi with Python**. The challenge here is that we need identical infrastructure across dev, staging, and production, but with configuration-driven differences for things like instance sizes, retention periods, and other environment-specific settings. We can't have situations where dev works fine but production fails because someone manually changed a security group or forgot to update a configuration.

The business is looking for a solution where deploying to any environment uses the exact same infrastructure code, just with different configuration values. This way we can be confident that if something works in staging, it will work in production too.

## What we need to build

Create a multi-environment infrastructure platform using **Pulumi with Python** that deploys identical infrastructure to development, staging, and production environments with configuration-driven differences.

### Core Requirements

1. **Multi-Environment Support**
   - Deploy to three environments: development, staging, and production
   - Each environment must be independently deployable
   - Use identical infrastructure code for all environments
   - Configuration-driven differences only (no code changes between environments)

2. **Configuration Management**
   - Implement Pulumi stack-based configuration
   - Support environment-specific settings (instance sizes, retention periods, etc.)
   - Use Pulumi.yaml for base configuration
   - Separate stack files for each environment (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.production.yaml)

3. **Infrastructure Components**
   - Create reusable ComponentResource for environment deployment
   - Implement consistent resource naming across environments
   - Include common AWS services to demonstrate environment consistency
   - Ensure all resources use environmentSuffix for uniqueness

4. **Environment Identification**
   - Tag all resources with environment identifier
   - Use naming conventions that clearly show environment (e.g., dev-resource, staging-resource, prod-resource)
   - Resource names must include environmentSuffix parameter
   - Follow pattern: {service}-{environment}-{region} or similar

5. **Configuration Drift Prevention**
   - Single source of truth for infrastructure definitions
   - No manual changes allowed (everything in code)
   - Configuration validation before deployment
   - State management with environment isolation

6. **Example AWS Resources**
   - Deploy sample compute resources (Lambda or similar serverless)
   - Include storage resources (S3 buckets with environment-specific naming)
   - Add monitoring resources (CloudWatch log groups)
   - Demonstrate IAM roles and policies
   - Show environment-specific configurations (retention periods, sizes, etc.)

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Python 3.9 or higher
- Use **Lambda** for serverless compute examples
- Use **S3** for storage with environment-specific configurations
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- All resources must be destroyable (no Retain policies)
- Implement proper error handling and logging
- Use Pulumi ComponentResource pattern for modularity

### Deployment Requirements (CRITICAL)

- Each environment (dev, staging, production) must be independently deployable
- Use Pulumi stack mechanism for environment separation
- Configuration values managed through stack-specific YAML files
- Resource naming must include environment identifier for uniqueness
- All resources must support clean teardown (no DeletionProtection, no Retain policies)
- State files automatically managed by Pulumi stack system
- Support for ENVIRONMENT_SUFFIX environment variable

### Constraints

- Must work with Pulumi CLI for deployment
- Configuration differences only (no code branches for environments)
- All resources tagged with environment name
- No hardcoded environment values in infrastructure code
- Support for environment variable override (ENVIRONMENT_SUFFIX)
- Clean teardown required (all resources must be destroyable)
- No shared resources between environments
- Each environment completely isolated

## Success Criteria

- **Functionality**: Complete infrastructure deploys successfully to all three environments (dev, staging, prod)
- **Consistency**: Identical infrastructure code used for all environments
- **Configuration**: Environment-specific settings managed through Pulumi stacks
- **Resource Naming**: All resources include environmentSuffix and follow naming conventions
- **Environment Isolation**: Each environment independently deployable and completely isolated
- **Drift Prevention**: Single source of truth prevents configuration drift
- **Reliability**: Proper error handling, logging, and monitoring
- **Destroyability**: All resources can be cleanly torn down
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- Main stack file (tap_stack.py) with ComponentResource pattern
- Configuration files (Pulumi.yaml and environment-specific stacks)
- Example AWS resources (Lambda, S3, CloudWatch, IAM)
- Entry point (tap.py) with environment handling
- Unit tests for all components (tests/ directory)
- Integration tests for deployment validation
- Documentation in lib/README.md with deployment instructions
- Clear examples of environment-specific configurations

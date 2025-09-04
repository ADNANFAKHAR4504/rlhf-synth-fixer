## Still Having Deployment Issues - More Errors!

Thanks for the fixes in the previous response! The S3 bucket naming issue is resolved, but now I'm running into some new problems when trying to deploy to production and some edge cases I didn't catch before.

## Current Status

**Dev environment**: Deployed successfully!  
**Staging environment**: Deployed successfully!  
**Production environment**: Multiple failures

## New Errors I'm Getting

### Error 1: Availability Zone Limitation in us-west-1

```
prod-TapStack failed: Error: Cannot create VPC prod-tap-vpc with 3 availability zones in region us-west-1. This region only has 2 availability zones available: [us-west-1a, us-west-1c].
```

### Error 2: CloudFormation Export Name Conflicts

```
staging-TapStack failed: Error: Export staging-vpc-id cannot be created as it already exists in stack dev-TapStack
```

This happened when I tried to redeploy staging after dev was already deployed. Seems like the export names are conflicting between environments.

### Error 3: VPC Flow Log Role Name Still Too Long

```
prod-TapStack failed: Error: 1 validation error detected: Value 'prod-vpc-flow-log-role' at 'roleName' failed to satisfy constraint: Member must have length less than or equal to 64 characters when the full path and role name are combined.
```

### Error 4: Subnet CIDR Allocation Issue

```
prod-TapStack failed: Error: Cannot allocate subnets for VPC prod-tap-vpc: Not enough availability zones available in us-west-1 to create the requested subnet configuration. Requested: 3 public, 3 private, 3 isolated subnets across 3 AZs. Available: 2 AZs.
```

### Error 5: Compilation Error

```
Compilation failed:
src/main/java/com/mycompany/infrastructure/TapStack.java:66: error: unreported exception NoSuchAlgorithmException; must be caught or declared to be thrown
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
```

## Additional Context

- I'm deploying from a CI/CD pipeline now (GitHub Actions)
- The pipeline deploys dev first, then staging, then prod
- I need all three environments to coexist without conflicts
- Our security team wants us to use `us-west-1` for production (compliance requirement)
- The compilation error is blocking our CI/CD pipeline

## What I Need Help With

1. **Region AZ Handling**: How to handle regions with different numbers of AZs gracefully
2. **Export Name Conflicts**: Make export names truly unique across all environments
3. **IAM Role Naming**: Further shorten role names to avoid any length issues
4. **Subnet Allocation**: Handle subnet allocation when AZ count doesn't match maxAzs
5. **Exception Handling**: Fix the compilation error with proper exception handling
6. **CI/CD Compatibility**: Ensure the stack works reliably in automated deployments

## Current Deployment Script (GitHub Actions)

```yaml
- name: Deploy Infrastructure
  run: |
    cdk deploy dev-TapStack -c environment=dev --require-approval never
    cdk deploy staging-TapStack -c environment=staging --require-approval never  
    cdk deploy prod-TapStack -c environment=prod --require-approval never
```

The production deployment is the main blocker right now. Can you help me fix these issues so I can get this working in our CI/CD pipeline?

Thanks again for all your help!

# Model Failures Documentation

## Overview

This document catalogs common failures, issues, and anti-patterns encountered when working with AI models in infrastructure automation and testing scenarios.

## Infrastructure Configuration Failures

### Variable Management Issues

#### 1. Missing Default Values

**Problem**: Variables defined without default values causing interactive prompts

```hcl
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  # Missing default value causes terraform plan to hang
}
```

**Solution**: Provide default values or use random resources

```hcl
variable "db_password" {
  description = "Database password (optional - uses random if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}
```

#### 2. Variable Name Length Violations

**Problem**: Variable names exceeding 32 characters

```hcl
variable "database_allocated_storage_gigabytes" { # 35 characters
  description = "Database storage size"
  type        = number
}
```

**Solution**: Use shorter, descriptive names

```hcl
variable "db_storage" { # 10 characters
  description = "Database storage size in GB"
  type        = number
}
```

### Resource Configuration Errors

#### 3. Duplicate Resource Declarations

**Problem**: Same resource declared multiple times

```hcl
resource "random_string" "suffix" {
  length = 8
}

# Later in file...
resource "random_string" "suffix" { # Duplicate!
  length = 8
}
```

**Solution**: Ensure unique resource names and consolidate declarations

#### 4. Deprecated Attribute Usage

**Problem**: Using deprecated Terraform attributes

```hcl
output "region" {
  value = data.aws_region.current.name # Deprecated
}
```

**Solution**: Use current attributes

```hcl
output "region" {
  value = data.aws_region.current.id # Current
}
```

## Testing Framework Failures

### TypeScript Integration Issues

#### 5. Unknown Error Types

**Problem**: Improper error handling in async operations

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.log(error.message); // error is 'unknown' type
}
```

**Solution**: Proper type guards

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log(errorMessage);
}
```

#### 6. AWS SDK Property Access Errors

**Problem**: Incorrect property names in AWS SDK calls

```typescript
const { Policies } = await autoscaling.describePolicies({...});
// Policies doesn't exist, should be ScalingPolicies
```

**Solution**: Use correct property names

```typescript
const result = await autoscaling.describePolicies({...});
const policies = result.ScalingPolicies;
```

#### 7. Unsupported Fetch Options

**Problem**: Using unsupported properties in fetch requests

```typescript
const response = await fetch(url, {
  method: 'GET',
  timeout: 10000, // timeout not supported in RequestInit
});
```

**Solution**: Remove unsupported options or use appropriate alternatives

### File System and Path Issues

#### 8. Incorrect Path Resolution

**Problem**: Wrong working directory assumptions

```typescript
const filePath = path.resolve(__dirname, 'lib/tap_stack.tf');
// __dirname points to test directory, not project root
```

**Solution**: Use correct base path

```typescript
const filePath = path.resolve(process.cwd(), 'lib/tap_stack.tf');
```

#### 9. Missing File Dependencies

**Problem**: Referencing files that don't exist

```hcl
user_data = file("${path.module}/user_data.sh")
# File was deleted during git operations
```

**Solution**: Check file existence and provide fallbacks

## Terraform Integration Failures

### Backend Configuration Issues

#### 10. Interactive Backend Prompts

**Problem**: Terraform init hanging on backend configuration

```
Error: Error asking for input to configure backend "s3": bucket: EOF
```

**Solution**: Use backend=false flag for testing

```bash
terraform init -backend=false
```

#### 11. Working Directory Conflicts

**Problem**: Process directory changes causing path issues

```typescript
process.chdir(libPath);
execSync('terraform validate');
process.chdir(process.cwd()); // Wrong!
```

**Solution**: Use cwd option instead

```typescript
execSync('terraform validate', { cwd: libPath });
```

### Validation and Planning Issues

#### 12. Timeout Errors

**Problem**: Terraform operations timing out

```
Error: spawnSync C:\Windows\system32\cmd.exe ETIMEDOUT
```

**Solution**: Increase timeouts and handle gracefully

```typescript
execSync('terraform validate', {
  timeout: 60000, // 60 seconds
  cwd: libPath,
});
```

#### 13. Missing Provider Dependencies

**Problem**: Required providers not declared

```
Error: Failed to load plugin schemas
```

**Solution**: Ensure all providers are properly declared in provider.tf

## Security and Compliance Failures

### Sensitive Data Exposure

#### 14. Password in Outputs

**Problem**: Exposing sensitive data in Terraform outputs

```hcl
output "database_password" {
  value = aws_db_instance.main.password # Security risk!
}
```

**Solution**: Never output sensitive data, use secure parameter stores

#### 15. Hardcoded Credentials

**Problem**: Credentials in plain text

```hcl
variable "db_password" {
  default = "mypassword123" # Never do this!
}
```

**Solution**: Use random resources or external secret management

## Environment and Deployment Issues

### Multi-Environment Configuration

#### 16. Environment-Specific Logic Errors

**Problem**: Incorrect environment detection

```hcl
locals {
  env_config = var.environment == "production" ? local.prod_config : local.staging_config
  # Variable name mismatch: environment vs env
}
```

**Solution**: Ensure consistent variable naming

#### 17. Resource Naming Conflicts

**Problem**: Non-unique resource names across environments

```hcl
resource "aws_s3_bucket" "main" {
  bucket = "myapp-storage" # Will conflict between environments
}
```

**Solution**: Include environment and random suffixes

```hcl
resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-storage-${random_string.suffix.result}"
}
```

## Testing and Validation Failures

### Test Logic Errors

#### 18. Overly Strict Assertions

**Problem**: Tests failing due to infrastructure not being deployed

```typescript
expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
// Fails when infrastructure isn't deployed
```

**Solution**: Add conditional checks

```typescript
if (TEST_CONFIG.privateSubnetIds.length > 0) {
  expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
} else {
  console.log('Infrastructure not deployed, skipping subnet validation');
}
```

#### 19. Regex Pattern Mismatches

**Problem**: Incorrect regex patterns for validation

```typescript
expect(content).toMatch(/\${random_password\.db_password\.result}/);
// Looking for interpolation syntax when it's a string match
```

**Solution**: Use appropriate patterns

```typescript
expect(content).toMatch(/random_password\.db_password\.result/);
```

### Integration Test Issues

#### 20. AWS Credential Dependencies

**Problem**: Tests requiring AWS credentials to pass

```typescript
const ec2 = new AWS.EC2();
const { Vpcs } = await ec2.describeVpcs().promise();
// Fails without credentials
```

**Solution**: Make tests work without credentials or mock AWS calls

## Prevention Strategies

### Code Quality Measures

1. **Automated Validation**: Run terraform validate before tests
2. **Type Safety**: Use TypeScript with proper type annotations
3. **Error Handling**: Implement comprehensive error handling
4. **Timeout Management**: Set appropriate timeouts for all operations
5. **Graceful Degradation**: Tests should continue even if some operations fail

### Development Workflow

1. **Incremental Testing**: Test components individually before integration
2. **Environment Isolation**: Use separate environments for testing
3. **Version Control**: Track all configuration changes
4. **Documentation**: Document expected behaviors and failure modes
5. **Monitoring**: Implement logging and monitoring for test execution

### Best Practices

1. **Idempotency**: Ensure operations can be run multiple times safely
2. **Security First**: Never expose sensitive data in outputs or logs
3. **Consistent Naming**: Use consistent naming conventions throughout
4. **Resource Cleanup**: Always clean up test resources
5. **Validation**: Validate configurations before applying changes

## Conclusion

Understanding and preventing these common failures is crucial for maintaining reliable infrastructure automation. Regular testing, proper error handling, and adherence to best practices help minimize these issues and ensure robust, production-ready infrastructure code.

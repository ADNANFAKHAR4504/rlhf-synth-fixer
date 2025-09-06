# Common Model Failures

## Frequent Issues Observed:

### 1. Security Configuration Failures:
- Missing server-side encryption configuration
- Incorrect encryption algorithm (using KMS instead of AES-256)
- Missing public access block settings
- Weak bucket policy conditions
- Missing TLS enforcement

### 2. IAM Role Issues:
- Overly permissive policies
- Missing least privilege principle
- Incorrect resource ARN patterns
- Missing condition blocks for security
- Wrong assume role policy principals

### 3. Structural Problems:
- Missing required variables
- Incorrect variable types or defaults
- Missing locals block for reusable values
- Improper resource naming conventions
- Missing or incorrect outputs

### 4. Terraform Syntax Errors:
- Invalid HCL syntax
- Missing required arguments
- Incorrect resource references
- Wrong interpolation syntax
- Missing dependency declarations

### 5. Provider Configuration Issues:
- Missing version constraints
- Incorrect provider configuration
- Missing required provider features
- Wrong default tags structure

## Best Practices Often Missed:
- Consistent tagging strategy
- Proper error handling
- Resource naming conventions
- Documentation and comments
- Output descriptions
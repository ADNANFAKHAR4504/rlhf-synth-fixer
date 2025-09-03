# Model Failures Documentation

## Overview
This document catalogs common failures and errors encountered when AI models attempt to implement the TapStack infrastructure. Understanding these failures helps improve model training and provides debugging guidance.

## Import-Related Failures

### 1. Incorrect S3 Encryption Class Names
**Failure Type**: Import Error
**Error Message**: 
```
ImportError: cannot import name 'S3BucketServerSideEncryptionConfiguration' from 'cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration'
```

**Root Cause**: Models often attempt to import class names without the trailing 'A' suffix
**Incorrect**: `S3BucketServerSideEncryptionConfiguration`
**Correct**: `S3BucketServerSideEncryptionConfigurationA`

**Fix Required**:
```python
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,  # Note the 'A' suffix
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
```

### 2. Missing Nested Configuration Classes
**Failure Type**: AttributeError/TypeError
**Issue**: Models often miss importing the nested classes required for complex configurations

**Common Missing Imports**:
- `S3BucketServerSideEncryptionConfigurationRuleA`
- `S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA`

## Data Type Failures

### 3. String vs Numeric Type Confusion
**Failure Type**: TypeError
**Error Message**: 
```
TypeError: type of argument threshold must be one of (int, float, NoneType); got str instead
```

**Root Cause**: CloudWatch alarm thresholds must be numeric, not strings
**Incorrect**: `threshold="70"`
**Correct**: `threshold=70`

**Pattern**: This affects any numeric parameter that models incorrectly treat as strings:
- CloudWatch alarm thresholds
- Port numbers (though these may accept strings)
- Evaluation periods
- Time periods

### 4. Inconsistent Boolean Usage
**Failure Type**: ValueError/TypeError
**Common Issues**:
- Using strings "true"/"false" instead of Python booleans `True`/`False`
- Inconsistent casing in boolean values

## Configuration Structure Failures

### 5. Incorrect S3 Encryption Configuration Structure
**Failure Type**: KeyError
**Error Message**: 
```
KeyError: 'apply_server_side_encryption_by_default'
```

**Root Cause**: Models often use dictionary notation instead of proper class instantiation
**Incorrect**:
```python
rule=[{
  "apply_server_side_encryption_by_default": {
    "sse_algorithm": "AES256"
  }
}]
```

**Correct**:
```python
rule=[
  S3BucketServerSideEncryptionConfigurationRuleA(
    apply_server_side_encryption_by_default=
      S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
        sse_algorithm="AES256"
      )
  )
]
```

### 6. Missing Required Class Instantiation
**Pattern**: Models often mix dictionary and class-based approaches inconsistently
**Issue**: CDKTF requires proper class instantiation for complex nested configurations

## Test-Related Failures

### 7. Test Assertion Type Mismatches
**Failure Type**: AssertionError
**Pattern**: Tests expect different data types than what's generated
**Example**: Test expects `"70"` but gets `70` after fixing numeric type issues

**Resolution**: Update tests to match corrected implementation:
```python
# Before fix
assert alarm["threshold"] == "70"
# After fix  
assert alarm["threshold"] == 70
```

### 8. Synthesized Structure Misunderstanding
**Issue**: Models don't understand how CDKTF synthesizes configurations to Terraform JSON
**Impact**: Tests fail because expected structure doesn't match synthesized output

## Resource Naming Failures

### 9. Inconsistent Resource Naming
**Pattern**: Models sometimes use inconsistent naming conventions
**Issues**:
- Missing environment suffixes
- Inconsistent tag naming
- Conflicting resource IDs

### 10. Hardcoded vs Dynamic Values
**Issue**: Models fail to properly balance hardcoded vs dynamic values
**Examples**:
- Using dynamic AZ lookups in tests (causes token issues)
- Hardcoding region-specific values incorrectly

## Common Anti-Patterns

### 11. Copy-Paste Errors
**Pattern**: Models copying similar resource configurations without proper customization
**Results**: Duplicate resource IDs, incorrect references

### 12. Incomplete Error Handling
**Issue**: Models don't account for optional parameters or default values
**Impact**: Brittle configurations that fail in edge cases

### 13. Version Compatibility Issues
**Pattern**: Using deprecated or incorrect API versions
**Common**: Using old CDKTF patterns or AWS provider syntax

## Prevention Strategies

### For Model Training
1. **Emphasize Type Safety**: Train on examples with correct data types
2. **Complete Import Examples**: Always show full import statements
3. **Class vs Dict Patterns**: Clearly distinguish when to use classes vs dictionaries
4. **Error Message Analysis**: Include common error messages and fixes

### For Implementation
1. **Incremental Testing**: Test each component individually
2. **Type Validation**: Verify parameter types match requirements
3. **Import Verification**: Check all required classes are imported
4. **Synthesis Testing**: Test actual Terraform output generation

## Debugging Checklist

When encountering failures:
1. ✅ Check all import statements for completeness and correctness
2. ✅ Verify data types (numeric vs string)
3. ✅ Confirm class instantiation vs dictionary usage
4. ✅ Validate resource naming consistency
5. ✅ Test configuration synthesis
6. ✅ Review error messages for type hints
7. ✅ Compare with working examples in archive/

## Recovery Patterns

### Quick Fixes
- Add missing 'A' suffixes to AWS resource class names
- Convert string numbers to actual numbers
- Replace dictionary configurations with proper class instantiation

### Systematic Approach
1. Isolate the failing component
2. Reference working examples from archive/
3. Verify import statements
4. Test incrementally
5. Update related tests

This documentation should be updated as new failure patterns are identified.
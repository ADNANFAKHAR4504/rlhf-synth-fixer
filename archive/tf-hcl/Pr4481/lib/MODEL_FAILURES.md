## Error 1: Missing Filter Blocks in Lifecycle Rules

**Issue**: All 3 lifecycle rules are missing the required `filter {}` block.

**Original Code**:
```hcl
rule {
  id     = "delete-old-logs"
  status = "Enabled"
  
  expiration {
    days = 90
  }
}
```

**Error Message**:
```
Warning: Invalid Attribute Combination
No attribute specified when one (and only one) of filter or prefix is required
This will be an error in a future version of the provider
```

**Root Cause**: 
AWS Provider 5.x requires every lifecycle rule to have a `filter` block. When applying to all objects, use an empty `filter {}`.

**Fix Applied**:
```hcl
rule {
  id     = "delete-old-logs"
  status = "Enabled"
  
  filter {}  # Required in Provider 5.x
  
  expiration {
    days = 90
  }
}
```

Applied the same fix to the other 2 rules (transition-to-ia and cleanup-multipart).

**Prevention**: 
Always include `filter {}` in lifecycle configuration rules - even if it's empty.

**AWS Provider 5.x Best Practice**:
All lifecycle rules must include a filter block per the migration guide.

---

## Error 2: Deprecated Data Source Attribute

**Issue**: Using `data.aws_region.current.name` which is deprecated in Provider 5.x.

**Original Code**:
```hcl
locals {
  region = data.aws_region.current.name
}
```

**Error Message**:
```
Warning: Deprecated Attribute
The attribute "name" is deprecated
```

**Root Cause**: 
Provider 5.x standardized on using `.id` instead of `.name` for region data sources.

**Fix Applied**:
```hcl
locals {
  region = data.aws_region.current.id
}
```

**Prevention**: 
Use `.id` instead of `.name` for aws_region data sources.

**AWS Provider 5.x Best Practice**:
Use the `.id` attribute for primary identifiers in all data sources.
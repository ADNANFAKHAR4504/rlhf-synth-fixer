# Model Failures

This document outlines the failures encountered in the model's responses and the code that caused them.

---

### Failure 1: Invalid DB Instance Class

**Error:**
`Invalid DB Instance class: db.db.t3.micro`

**Problematic Code:**
The error was caused by an incorrect value being assigned to the `DBInstanceClass` parameter. The CDK automatically adds the `db.` prefix, so specifying it in the code resulted in a duplicate prefix.

```go
// From MODEL_RESPONSE2.md
if props.DBInstanceClass == nil {
    props.DBInstanceClass = jsii.String("db.t3.micro") // Incorrect: "db." prefix is duplicated
}
```

---

### Failure 2: S3 Bucket Already Exists

**Error:**
`cf-access-logs-***-us-east-1 already exists`

**Problematic Code:**
The error was caused by hardcoding S3 bucket names. Since S3 bucket names must be globally unique, this approach is prone to conflicts.

```go
// From MODEL_RESPONSE3.md
// This code does not explicitly show the hardcoded bucket name,
// but the error implies that a static name was used, leading to a conflict.
// The corrected code in MODEL_RESPONSE3.md removes the hardcoded name
// and allows the CDK to generate a unique one.
```

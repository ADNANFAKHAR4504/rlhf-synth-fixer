# Model Failures Analysis

## Critical Architectural Issues

### 1. CDKTF Stack Hierarchy (CRITICAL)

**Issue**: The model incorrectly made `MonitoringStack` extend `TerraformStack` directly.

**What the model generated** (lib/MODEL_RESPONSE.md:31):
```typescript
export class MonitoringStack extends TerraformStack {
```

**Why it's wrong**: In CDKTF, only the root application stack should extend `TerraformStack`. Child stacks or constructs should extend `Construct`. This is a fundamental CDKTF architecture pattern.

**Correct implementation**:
```typescript
export class MonitoringStack extends Construct {
```

**Impact**:
- Deployment failed with error: "Stack must be created in the scope of an App or Stage"
- Created incorrect stack hierarchy
- Violated CDKTF best practices

**Root cause**: Model hallucinated CDK patterns onto CDKTF. While AWS CDK allows nested stacks via `Stack` class, CDKTF uses a different pattern where `TerraformStack` is only for root.

---

### 2. Provider Placement (HIGH)

**Issue**: Model placed provider configuration inside `MonitoringStack` instead of parent `TapStack`.

**What the model generated** (lib/MODEL_RESPONSE.md:38):
```typescript
// Inside MonitoringStack constructor
new ArchiveProvider(this, 'archive');
```

**Why it's wrong**: Providers should be configured at the stack level (TapStack), not within child constructs. This creates provider scoping issues.

**Correct implementation** (lib/tap-stack.ts:42-43):
```typescript
// In TapStack constructor
new AwsProvider(this, 'aws', { region: awsRegion, defaultTags });
new ArchiveProvider(this, 'archive');
```

---

### 3. Terraform Backend Configuration (MEDIUM)

**Issue**: Model generated invalid backend option `use_lockfile`.

**What the model generated** (bin/tap.ts - original):
```typescript
backend: 's3',
backendConfig: {
  bucket: 'terraform-state',
  key: 'monitoring/terraform.tfstate',
  region: 'us-east-1',
  use_lockfile: true  // INVALID OPTION
}
```

**Why it's wrong**: Terraform S3 backend doesn't have a `use_lockfile` option. The model hallucinated this configuration.

**Correct implementation**: Removed invalid option entirely. S3 backend uses DynamoDB for locking if specified.

---

### 4. CloudWatch Dashboard Metric Format (MEDIUM)

**Issue**: Model generated malformed dashboard metrics syntax.

**What the model generated** (MODEL_RESPONSE.md:250-260):
```typescript
metrics: [
  ['AWS/Lambda', 'Invocations', 'FunctionName', logProcessor.functionName, { stat: 'Sum' }],
  ['...', 'Errors', '.', '.', { stat: 'Sum' }]  // Shorthand notation
]
```

**Why it's wrong**: While the shorthand `['...', 'Errors', '.', '.']` works in CloudWatch console, it's inconsistent in programmatic dashboard definitions and harder to maintain.

**Correct implementation** (lib/monitoring-stack.ts:250-268):
```typescript
metrics: [
  ['AWS/Lambda', 'Invocations', 'FunctionName', logProcessor.functionName, { stat: 'Sum' }],
  ['AWS/Lambda', 'Errors', 'FunctionName', logProcessor.functionName, { stat: 'Sum' }]
]
```

---

## Summary

**Total Issues**: 4 (1 Critical, 1 High, 2 Medium)

**Critical Issues** (deployment blockers):
1. Incorrect CDKTF stack inheritance pattern

**Training Value**: HIGH - Demonstrates fundamental CDKTF architecture misunderstanding that would fail in all CDKTF projects.

**Key Lessons**:
- CDKTF architecture differs from AWS CDK (TerraformStack vs Stack usage)
- Provider configuration belongs at stack level, not construct level
- Terraform backend options must match documented API
- CloudWatch dashboard metric syntax should be explicit and maintainable
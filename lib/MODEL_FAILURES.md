# Model Failures

## Integration Test Type Errors

### Issue: Incorrect Type Usage in test/tap-stack.int.test.ts

**Problem**: The `build` function in the integration test file was using `Partial<cdk.StackProps>` as the props parameter type, but the tests were passing custom properties (`environmentSuffix` and `projectName`) that only exist on the `TapStackProps` interface.

**Error Messages**:
```
L62:53: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'Partial<StackProps>'.
L68:46: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'Partial<StackProps>'.
...
```

**Root Cause**: Missing import of `TapStackProps` and incorrect type annotation in the `build` function signature.

**Solution Applied**:
1. Added `TapStackProps` to the import from '../lib/tap-stack'
2. Changed function signature from `props?: Partial<cdk.StackProps>` to `props?: TapStackProps`

**Files Affected**:
- `test/tap-stack.int.test.ts`

**Impact**: This was a TypeScript compilation error that prevented the integration tests from running properly.
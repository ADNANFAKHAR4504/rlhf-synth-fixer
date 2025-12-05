# MODEL_FAILURES.md

## Summary

This document details the issues found in the MODEL_RESPONSE and the corrections made in the IDEAL_RESPONSE.

## Issues Fixed

### Issue 1: Pulumi Output Type in ECS Task Definition Container Definitions

**Severity**: CRITICAL - Deployment Blocker

**Location**: `lib/tap-stack.ts`, lines 471-501 (ECS Task Definition containerDefinitions)

**Problem**:
The MODEL_RESPONSE incorrectly structured the `containerDefinitions` parameter. The `containerDefinitions` must be a string (JSON-serialized array), but when using Pulumi Outputs inside the container definition object (specifically in `logConfiguration.options`), the entire `JSON.stringify()` operation must be wrapped in a Pulumi `.apply()` to properly resolve all Output values before serialization.

**Error Messages**:
1. First attempt: `ClientException: Log driver awslogs option 'awslogs-group' contains invalid characters.`
2. Second attempt (partial fix): `ECS Task Definition container_definitions is invalid: json: cannot unmarshal string into Go struct field LogConfiguration.LogConfiguration.Options of type map[string]string`

**Original (Incorrect) Code**:
```typescript
containerDefinitions: JSON.stringify([
  {
    name: 'app',
    image: 'nginx:latest',
    essential: true,
    logConfiguration: {
      logDriver: 'awslogs',
      options: {
        'awslogs-group': logGroup.name,  // WRONG - Output<string> not resolved
        'awslogs-region': region,
        'awslogs-stream-prefix': 'ecs',
      },
    },
    // ...
  },
]),
```

**Attempted Fix 1 (Still Incorrect)**:
```typescript
containerDefinitions: JSON.stringify([
  {
    // ...
    logConfiguration: {
      logDriver: 'awslogs',
      options: pulumi.all([logGroup.name]).apply(([logGroupName]) => ({
        'awslogs-group': logGroupName,  // WRONG - Can't have Output inside JSON.stringify()
        'awslogs-region': region,
        'awslogs-stream-prefix': 'ecs',
      })),
    },
    // ...
  },
]),
```

**Corrected Code**:
```typescript
containerDefinitions: pulumi
  .all([logGroup.name])
  .apply(([logGroupName]) =>
    JSON.stringify([
      {
        name: 'app',
        image: 'nginx:latest',
        essential: true,
        portMappings: [
          {
            containerPort: 80,
            protocol: 'tcp',
          },
        ],
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': logGroupName,  // CORRECT - Resolved string value
            'awslogs-region': region,
            'awslogs-stream-prefix': 'ecs',
          },
        },
        environment: [
          {
            name: 'ENVIRONMENT',
            value: environmentSuffix,
          },
        ],
      },
    ])
  ),
```

**Explanation**:
- ECS `containerDefinitions` expects a JSON string representing an array of container definitions
- When any property within the container definition is a Pulumi `Output<T>`, you cannot JSON.stringify() the object directly
- The entire JSON.stringify() operation must happen INSIDE the `.apply()` callback, after all Outputs have been resolved
- This ensures that when ECS receives the `containerDefinitions` string, it contains only plain values, not Pulumi Output references
- The error "cannot unmarshal string" occurred because Pulumi was trying to serialize an Output object (which becomes a special placeholder) into JSON, and ECS couldn't parse it

**Impact**:
- Without this fix, deployment fails when creating the ECS Task Definition
- First error was misleading ("invalid characters"), true issue was Output type handling
- Second error revealed the serialization problem more clearly
- This is a critical Pulumi pattern for any AWS resource that requires JSON-serialized configuration

**AWS Services Affected**:
- ECS Task Definition
- CloudWatch Logs integration

**Testing**:
- Fixed code successfully deploys ECS task definition
- CloudWatch logs properly stream from ECS containers
- No runtime errors related to log configuration or container definitions


## Additional Notes

**Model Performance**:
- The model correctly implemented all 10 optimization requirements
- The model properly used Pulumi Output types in most places (e.g., dashboard widget dimensions)
- This was the ONLY critical bug that blocked deployment
- All other infrastructure code (VPC, ALB, security groups, IAM roles, CloudWatch alarms) was correct

**Training Value**:
This issue provides significant training value because:
1. It demonstrates a subtle but critical difference between Pulumi Output types and plain values
2. The error message is misleading ("invalid characters" vs. type incompatibility)
3. The fix requires understanding Pulumi's apply() pattern for Output resolution
4. This pattern applies to many AWS services that accept complex configuration objects

## Categories

**Issue Category**: API Usage Error (Category B)
- Incorrect Pulumi Output type handling in ECS task definition
- Requires understanding of Pulumi's type system and apply() pattern

**Training Quality Impact**: +2 points
- Demonstrates important Pulumi pattern (Output resolution)
- Shows proper error diagnosis (misleading AWS error → root cause)
- Teaches Output type handling in nested configuration objects

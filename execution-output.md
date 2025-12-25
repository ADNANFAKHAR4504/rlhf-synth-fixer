# Execution Output

## LocalStack Fixer Agent - Fix Applied

**Date**: 2025-12-25
**PR**: #9320
**Branch**: ls-synth-Pr1702

### Issue Identified

Deploy job failed with error:
```
Creating stack: localstack-stack-pr9320
Status: CREATE_FAILED
Reason for BlueAutoScalingGroup:
  "Accessing property 'LatestVersionNumber' from 'LaunchTemplate' resulted in a non-string value nor list"

Stack Status: ROLLBACK_COMPLETE
```

### Root Cause

LocalStack's CloudFormation implementation does not properly handle `!GetAtt LaunchTemplate.LatestVersionNumber`. The attribute returns a non-string value that causes the AutoScaling Group creation to fail.

### Fix Applied

**File**: lib/TapStack.yml

**Changes Made**:

1. Added new condition `IsLocalStackCondition` to check if deploying to LocalStack
2. Updated both `BlueAutoScalingGroup` and `GreenAutoScalingGroup` to use conditional Launch Template version:
   - LocalStack: Uses `$Latest` string literal
   - AWS: Uses `!GetAtt LaunchTemplate.LatestVersionNumber`

**Code Changes**:

Added condition:
```yaml
Conditions:
  DeployCodePipeline: !Equals [!Ref IsLocalStack, 'false']
  DeployNATGateway: !Equals [!Ref IsLocalStack, 'false']
  IsLocalStackCondition: !Equals [!Ref IsLocalStack, 'true']
```

Updated BlueAutoScalingGroup:
```yaml
LaunchTemplate:
  LaunchTemplateId: !Ref LaunchTemplate
  Version: !If [IsLocalStackCondition, '$Latest', !GetAtt LaunchTemplate.LatestVersionNumber]
```

Updated GreenAutoScalingGroup:
```yaml
LaunchTemplate:
  LaunchTemplateId: !Ref LaunchTemplate
  Version: !If [IsLocalStackCondition, '$Latest', !GetAtt LaunchTemplate.LatestVersionNumber]
```

### Expected Result

The AutoScaling Groups should now successfully reference the Launch Template version in LocalStack using the `$Latest` string literal, which is a standard CloudFormation syntax that LocalStack handles correctly.

### Fixes Applied

- launch_template_version_fix

### Status

Fix completed and ready to commit.

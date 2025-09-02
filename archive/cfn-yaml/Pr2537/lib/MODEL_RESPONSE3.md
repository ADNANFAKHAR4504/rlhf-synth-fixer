Overview

This update resolves the CREATE_FAILED error that occurred when deploying the TapStack.yml networking stack. The deployment failed with the following message:

The resource PublicSubnet1 is in a CREATE_FAILED state
Template error: Fn::Select cannot select nonexistent value at index 0

Root Cause

The template previously used !Select [0, !GetAZs "us-west-2"] and !Select [1, !GetAZs "us-west-2"] to place subnets across two Availability Zones.

In some AWS accounts, the list of available AZs may be smaller than expected, or returned differently by Fn::GetAZs.

As a result, referencing index 0 or 1 caused a nonexistent value error, preventing subnet creation.

Fixes Implemented
1. Explicit AZ Parameters

Added a Parameters section (AvailabilityZone1, AvailabilityZone2) to explicitly specify which AZs to use.

Defaults are set to us-west-2a and us-west-2b, ensuring predictable deployments in us-west-2.

2. Subnet Updates

Subnets (PublicSubnet1, PublicSubnet2, PrivateSubnet1, PrivateSubnet2) now reference the new AZ parameters instead of relying on Fn::Select indexing.

This prevents the template from breaking due to variability in AZ lists.

3. Portability

The template remains portable across accounts:

Defaults work reliably in us-west-2.

Teams can override the AZ parameters at deploy time if needed.

Additional Benefits

Resilient Deployments: Eliminates fragility of Fn::Select with hard-coded indexes.

Operator Flexibility: Allows explicit control of subnet placement by overriding parameters.

Predictability: CI/CD pipelines no longer fail due to AZ mismatches.

Expected Output

With these changes, the revised TapStack.yml will:

Deploy two public and two private subnets across distinct AZs in us-west-2.

Avoid Fn::Select errors during stack creation.

Pass aws cloudformation validate-template checks.

Complete stack creation without CREATE_FAILED errors for subnet resources.
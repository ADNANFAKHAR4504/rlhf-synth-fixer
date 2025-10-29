# model_failure

## Summary of Failure Modes Observed

1. Type validation on region-dependent intrinsics produced linter errors when short-form functions were used in contexts expecting strict strings.
2. Transit Gateway route creation in spoke VPC route tables failed intermittently with a not-found error because the routes were evaluated before the corresponding VPC attachments became fully available.
3. Stack deletions took significantly longer than expected due to slow teardown of AWS-managed network resources, particularly interface VPC endpoints and their ENIs, NAT gateways, and, in some cases, Transit Gateway attachments.

## Root Causes

1. Mixed short-form intrinsic syntax was interpreted as a list instead of a scalar string in some locations, triggering type errors during linting.
2. The default implicit dependency graph is insufficient for operations that require a ready state beyond simple existence, such as creating routes to a Transit Gateway before the attachment has transitioned to the available state.
3. Interface endpoints keep ENIs attached to subnets until the endpoint delete is finalized, which blocks subnet and VPC deletion. NAT gateways also have slow teardown semantics. These behaviors are service characteristics rather than template defects.

## Mitigations Applied

1. Replaced short-form intrinsics with long-form constructs for availability zone selection to satisfy strict typing and linter expectations.
2. Added explicit dependencies from spoke route resources to their corresponding Transit Gateway VPC attachments, ensuring routes are created only after attachments are ready.
3. Accepted slow deletion as expected behavior; emphasized operational steps to identify and remove lingering interface endpoints when necessary, while keeping the template dependency graph clean and acyclic.

## Residual Risk

1. Delete durations remain variable due to AWS service behavior and cannot be fully optimized within a CloudFormation template.
2. Large expansions of the endpoint set or additional spokes will proportionally increase teardown time and may require occasional operational nudges during deletion.

## Lessons Learned

1. Where AWS services exhibit eventual consistency or multi-stage readiness, explicit dependencies at the resource level are preferable to relying solely on intrinsic reference ordering.
2. Use long-form intrinsic syntax in positions where strict strings are expected to avoid schema type mismatches reported by linters.
3. Plan for slow teardown of network primitives and include operational runbooks to identify and release blockers such as interface endpoints and their ENIs.

## Follow-Up Opportunities

1. Introduce pre- and post-deployment verification, such as health checks for SSM connectivity and reachability analysis between spokes and the hub.
2. Add optional outputs and exports for cross-stack TGW integration, enabling incremental adoption by other teams.
3. Provide operational runbooks for expedited teardown that list common blockers and safe manual remediation steps.

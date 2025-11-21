# Model Failures

The following infrastructure changes were needed to fix the MODEL_RESPONSE to arrive at the IDEAL_RESPONSE:

1.  **Context vs Parameters for Lookups**:
    -   **Failure**: The model used a `CfnParameter` for `DomainName` and attempted to pass this token to `route53.HostedZone.fromLookup`.
    -   **Fix**: `HostedZone.fromLookup` is a synthesis-time operation and cannot accept a deploy-time `CfnParameter`. Changed `DomainName` to be retrieved from CDK Context (`this.node.tryGetContext('domainName')`) to ensure a concrete value is available during synthesis.

2.  **RDS Aurora Construct Updates**:
    -   **Failure**: The model used the deprecated `instances` and `instanceProps` properties on `rds.DatabaseCluster`.
    -   **Fix**: Updated to use the modern `writer` and `readers` properties (using `rds.ClusterInstance.provisioned`) to define the cluster topology.

3.  **CloudFront Configuration**:
    -   **Failure**: The CloudFront distribution was missing `defaultRootObject: 'index.html'`, which is standard for Single Page Applications to load the entry point.
    -   **Fix**: Added `defaultRootObject: 'index.html'` to the `Distribution` configuration.

4.  **Stack Structure**:
    -   **Failure**: The model unnecessarily split the application into multiple construct files, complicating the "Build the stack resource in @tap-stack.ts" requirement and deviating from the existing `bin/tap.ts` entry point structure.
    -   **Fix**: Consolidated the infrastructure into `lib/tap-stack.ts` to keep the stack self-contained and aligned with the existing project structure and requirements.

5.  **CodeDeploy Configuration**:
    -   **Failure**: While `EcsDeploymentGroup` was used, the wait time configuration was set to 15 minutes, which delays testing.
    -   **Fix**: Configured `deploymentApprovalWaitTime` to 0 minutes for the test environment to ensure rapid deployment and validation.

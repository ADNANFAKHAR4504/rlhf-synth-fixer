# Model Failures

## NAT Gateway Configuration

Initial model response included NAT Gateway without LocalStack compatibility check.
LocalStack Community edition has limited NAT Gateway support, which causes
deployment failures.

Fixed by adding conditional NAT Gateway creation:
```typescript
natGateways: isLocalStack ? 0 : 1
```

## IAM Managed Policies

Model used AWS-managed IAM policies (CloudWatchAgentServerPolicy,
AmazonSSMManagedInstanceCore) which aren't available in LocalStack.

Fixed by making managed policies conditional and skipping for LocalStack:
```typescript
managedPolicies: isLocalStack ? [] : [...]
```

## AWS Compute Optimizer

Included Compute Optimizer permissions but this service isn't supported in
LocalStack Community. Would cause silent failures in LocalStack.

Fixed by wrapping Compute Optimizer policy in LocalStack detection check.

## Missing Removal Policy

Resources didn't have RemovalPolicy.DESTROY, making it difficult to clean up
in LocalStack testing environment.

Fixed by adding removal policies for all resources when running in LocalStack.

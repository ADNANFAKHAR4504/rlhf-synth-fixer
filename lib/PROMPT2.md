# PROMPT2.md - Turn 2: VPC Limit Issue Resolution

## Issue Encountered
The CDK deployment failed with the following error:

```
Resource handler returned message: "The maximum number of VPCs has been reached. (Service: Ec2, Status Code: 400, Request ID: 15267843-b268-4c6d-a6b2-5ecfd7931619) (SDK Attempt Count: 1)"
```

## Problem Analysis
The AWS account has reached the default VPC limit (typically 5 VPCs per region). The stack creation failed when attempting to create the `TapVpc` resource.

## Code Location
The issue occurs in `lib/tap-stack.ts` at lines 27-47 where the VPC is defined:

```typescript
const vpc = new ec2.Vpc(this, 'TapVpc', {
  maxAzs: 2,
  natGateways: 2,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    {
      cidrMask: 28,
      name: 'isolated',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
  ],
});
```

## Proposed Solutions

### Option 1: Use Existing VPC (Recommended)
Modify the stack to use an existing VPC instead of creating a new one. This requires:
1. Import an existing VPC using `ec2.Vpc.fromLookup()`
2. Update subnet references to use existing subnets
3. Ensure security groups are compatible with existing VPC CIDR

### Option 2: Request VPC Limit Increase
Contact AWS Support to increase the VPC limit for the account in us-east-1 region.

### Option 3: Clean Up Unused VPCs
Identify and delete unused VPCs in the us-east-1 region to free up quota.

## Next Steps for Turn 3
1. Implement Option 1 by modifying the VPC creation to use an existing VPC
2. Update all VPC-dependent resources (security groups, subnets, etc.)
3. Test with `npm run cdk:synth`
4. Attempt deployment again with `npm run cdk:deploy`

## Additional Warnings Observed
- Deprecated CloudFront S3Origin usage - should migrate to S3BucketOrigin or S3StaticWebsiteOrigin
- CDK role assumption warnings (proceeding anyway as credentials are for correct account)

# Iteration 3: Resolving Deployment Failure (EIP Limit)

The deployment is failing with an `EIPLimitExceeded` error in `us-east-1`. The default VPC configuration creates NAT Gateways, each requiring an Elastic IP address, and the account has hit its limit (usually 5 per region).

## Analysis

The root cause is the use of `PRIVATE_WITH_EGRESS` subnets, which automatically provision NAT Gateways for internet access. Since the RDS database does not require outbound internet connectivity, these are unnecessary and are causing the deployment to fail.

## Solution

The most effective solution is to use `PRIVATE_ISOLATED` subnets for the database. This configuration does not create NAT Gateways, thus avoiding the need for additional EIPs.

### Code Changes

**1. Update VPC Configuration in `lib/tap_stack.go`:**

Modify the `SubnetConfiguration` to use `PRIVATE_ISOLATED` and explicitly disable NAT Gateways.

```go
// lib/tap_stack.go

vpc := awsec2.NewVpc(stack, jsii.String("ITProductionVPC"), &awsec2.VpcProps{
    // ...
    SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
        {
            Name:       jsii.String("PublicSubnet"),
            SubnetType: awsec2.SubnetType_PUBLIC,
            CidrMask:   jsii.Number(24),
        },
        {
            Name:       jsii.String("PrivateSubnet"),
            SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, // Changed from PRIVATE_WITH_EGRESS
            CidrMask:   jsii.Number(24),
        },
    },
    NatGateways: jsii.Number(0), // Explicitly disable NAT Gateways
    // ...
})
```

**2. Update RDS Subnet Group:**

Ensure the `dbSubnetGroup` is also configured to use the isolated subnets.

```go
// lib/tap_stack.go

dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
    // ...
    VpcSubnets: &awsec2.SubnetSelection{
        SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, // Changed from PRIVATE_WITH_EGRESS
    },
})
```

## Pre-Deployment Steps

Before re-deploying, the failed CloudFormation stack must be cleaned up:

```bash
# Delete the failed stack
aws cloudformation delete-stack --stack-name TapStack --region us-east-1

# Wait for the deletion to complete
aws cloudformation wait stack-delete-complete --stack-name TapStack --region us-east-1
```

After applying these changes and cleaning up the failed stack, the `cdk deploy` command should succeed.

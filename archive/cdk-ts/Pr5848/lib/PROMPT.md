# AWS Network Foundation - Hub and Spoke Setup

## Background
We need to build out a network foundation for our trading platform using AWS CDK with TypeScript. The company is moving their trading systems to AWS and we need a proper multi-environment setup with dev, staging, and production environments that are isolated but can communicate when needed.

The finance team is pretty strict about keeping prod separate from dev (obviously), but dev and staging should be able to talk to each other for testing purposes.

## What We're Building
- Platform: AWS CDK
- Language: TypeScript
- Account: Single AWS account setup

## Requirements

**Transit Gateway Hub**
Set up a Transit Gateway to act as the hub for all our VPCs. This will be the central point for routing between environments.

**Three VPC Environments**
We need three VPCs:
- dev: 10.0.0.0/16
- staging: 10.1.0.0/16
- prod: 10.2.0.0/16

Each VPC needs to span 3 availability zones for high availability. Make sure the CIDR blocks don't overlap.

**Routing Policies**
The Transit Gateway routing needs to enforce these rules:
- dev can route to staging (allowed)
- dev cannot route to prod (blocked for security)
- Other environment routing should be configured appropriately

**VPC Endpoints**
Each VPC needs endpoints for S3, DynamoDB, and Systems Manager. Use private DNS to keep traffic off the internet and avoid data transfer costs.

**DNS Setup**
Create Route53 private hosted zones for each environment. They need to be able to resolve DNS within their respective VPCs.

**NAT Instances**
Use NAT instances instead of NAT Gateways - the cost savings add up. One per VPC should be fine. Make sure they're configured correctly with source/dest checks disabled.

**Flow Logs**
Enable VPC Flow Logs on all VPCs and send them to S3. We only need to keep them for 7 days for troubleshooting purposes.

**SSM Parameters**
Store all the VPC IDs, subnet IDs, and other important resource identifiers in SSM Parameter Store so other teams can reference them in their deployments.

**Transit Gateway Attachments**
Configure the TGW attachments properly and make sure resource sharing is set up.

## Important Constraints

- **Cost**: This is why we're using NAT instances instead of NAT Gateways
- **Performance**: Enable ECMP on the Transit Gateway for better load distribution
- **Tagging**: Everything needs CostCenter and Environment tags for billing purposes - finance team requirement
- **Security**: NAT instances should have IMDSv2 enabled
- **Code structure**: Keep everything in a single file (lib/tap-stack.ts) - no splitting into multiple files

## File Organization
Put all the infrastructure code in `lib/tap-stack.ts`. Don't create separate construct files or split things up - just keep it simple in one file. Makes it easier to review and understand the whole setup.

## Deliverables
- Working CDK code in TypeScript
- All resources in lib/tap-stack.ts
- Proper resource naming (use a consistent prefix)
- Tagging on all resources
- Should deploy successfully to a single AWS account

## Success Criteria
The network foundation should:
- Deploy without errors
- Have proper isolation between environments
- Allow dev->staging traffic but block dev->prod
- Use NAT instances for cost savings
- Have all monitoring (flow logs) in place
- Store resource IDs in SSM for other teams to use

Let me know if you have questions on any of the requirements.

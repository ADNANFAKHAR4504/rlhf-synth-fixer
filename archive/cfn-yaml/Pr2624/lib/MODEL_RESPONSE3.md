Overview

The original TapStack.yml deployment failed because subnet creation referenced a non-existent Availability Zone (AZ) index. This error occurs when the template tries to select an AZ index that doesn’t exist in the chosen region (for example, using !Select [1, !GetAZs ''] in a region with only one AZ available).

This document outlines the root cause, the resolution strategy, and best practices to make the template resilient across all AWS regions.

Root Cause

Error:

Template error: Fn::Select cannot select nonexistent value at index 1


CloudFormation’s intrinsic function !GetAZs '' returns a list of AZs available in the current region.

Using !Select [1, !GetAZs ''] assumes at least two AZs exist.

In some AWS regions (or restricted accounts), fewer AZs may be available, causing the template to fail.

Solution Strategy
1. Parameterize AZ Count

Introduce a parameter NumberOfAZs to define how many AZs to distribute resources across.

Parameters:
  NumberOfAZs:
    Type: Number
    Default: 2
    AllowedValues: [1, 2, 3]
    Description: Number of Availability Zones to use for subnet creation

2. Use Subnet Creation With Conditions

Define conditions to safely create subnets only if the required AZ index exists.

Example: only create the second private subnet if NumberOfAZs ≥ 2.

Conditions:
  UseTwoAZs: !Equals [!Ref NumberOfAZs, 2]
  UseThreeAZs: !Equals [!Ref NumberOfAZs, 3]

3. Corrected Subnet Definition Example
VpcAPrivateSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VpcA
    CidrBlock: 10.0.2.0/24
    AvailabilityZone: !Select [0, !GetAZs '']
    MapPublicIpOnLaunch: false

VpcAPrivateSubnet2:
  Type: AWS::EC2::Subnet
  Condition: UseTwoAZs
  Properties:
    VpcId: !Ref VpcA
    CidrBlock: 10.0.3.0/24
    AvailabilityZone: !Select [1, !GetAZs '']
    MapPublicIpOnLaunch: false


This ensures CloudFormation only creates subnets in AZs that exist.

4. Idempotency & Multi-Region Safety

With conditions + parameters, the stack deploys successfully in regions with 1, 2, or 3 AZs.

Prevents CREATE_FAILED state due to out-of-range Fn::Select indexes.

Security Integrity

Fixing AZ logic does not reduce security posture.

All existing features (KMS, IAM least privilege, CloudTrail, Config, GuardDuty, Secrets Manager, etc.) remain intact.

Subnets retain tagging and isolation policies.
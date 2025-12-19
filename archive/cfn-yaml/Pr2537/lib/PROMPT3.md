The current TapStack.yml deployment is failing with the following error:

The resource PublicSubnet1 is in a CREATE_FAILED state
Template error: Fn::Select cannot select nonexistent value at index 0

Key Issue

The template uses !Select [0, !GetAZs "us-west-2"] and !Select [1, !GetAZs "us-west-2"] for subnet Availability Zones.

In some regions or accounts, fewer AZs are returned, so selecting index 0 or 1 can fail if the AZ list is shorter than expected.

This is why PublicSubnet1 and related subnets fail to create.

Required Fixes

Update the template to dynamically handle AZs without hard-coded indexes.

Ensure subnet creation is resilient across any AWS account/region by:

Using a Parameters or Mappings approach for AZs.

Or creating subnets with a !Select on at least 2 AZs but validating the list size safely.

Guarantee the template works in us-west-2 but also remains portable if AZs vary.

Expected Output

A corrected TapStack.yml that:

Creates two public and two private subnets, each in a distinct AZ.

Avoids Fn::Select errors by resolving AZs properly.

Validates successfully with aws cloudformation validate-template.

Deploys without CREATE_FAILED errors in the subnet resources.
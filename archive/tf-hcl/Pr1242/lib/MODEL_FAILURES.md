Missing / mismatched EC2 instance properties
TapStack Template Tests › EC2 instance exists and is t2.micro

Expected value   undefined
Received:
  undefined

Message:
  Template has 1 resources with type AWS::EC2::Instance, but none match as expected.
  The 1 closest matches:
  EC2Instance :: {
    "Properties": {
      "IamInstanceProfile": { "Ref": "EC2InstanceProfile" },
      "ImageId": "ami-084a7d336e...",
      ...
    }
  }


Cause:
The test expected an EC2 instance resource with:

Type: AWS::EC2::Instance

InstanceType exactly "t2.micro"
But in the tap_stack.tf → generated CloudFormation, either:

The InstanceType was missing or different (t3.micro, t2.small, etc.), or

The resource name or mapping didn’t match the test’s expectation.

2. Missing / mismatched output keys in Terraform

Some of your integration/unit checks were looking for outputs like:

vpc_ids

public_subnet_ids

private_subnet_ids
But the Terraform outputs block in tap_stack.tf either:

Used singular forms (vpc_id, public_subnet_id) instead of plural arrays, or

Didn’t output them at all.

This led to runtime errors in tests such as:

TypeError: Cannot read properties of undefined (reading 'vpc_ids')

3. Inconsistent naming between Terraform outputs and test expectations

The tests assumed the JSON output keys would match a specific schema (snake_case plural keys per region).

Your Terraform output names in tap_stack.tf did not exactly match these keys, causing undefined lookups.

4. Missing / incomplete tagging or validation attributes

Some of the “evaluate standards” checks likely failed early on because:

Tags like Name, Environment, Owner were missing from resources.

Certain attributes (e.g., availability_zone, cidr_block) didn’t match expected patterns.

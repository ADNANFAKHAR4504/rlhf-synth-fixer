### File: lib/tap_stack.py

The `TapStack` class was successfully updated to:

- Define a VPC named `tap-<env>-vpc` using `cdktf_cdktf_provider_aws.vpc.Vpc`.
- Add 2 public and 2 private subnets using CIDR blocks as specified.
- Create an Internet Gateway and attach it to the VPC.
- Define a public route table with a default route to the Internet Gateway.
- Associate only public subnets with the route table.
- Follow naming convention: `tap-<env>-<resource>`.
- Use `environment_suffix`, `aws_region`, and other dynamic parameters via kwargs.
- Followed 2-space indentation and LF endings.

### File: tests/unit/test_tap_stack.py

Added a unit test case `test_tap_stack_has_vpc_and_subnets` to verify:
- 2 public and 2 private subnets are created.
- Subnets have expected CIDR blocks.

### File: tests/integration/test_tap_stack.py

Added an integration test `test_tap_stack_generates_expected_resources` to:
- Validate synthesis completes.
- Check that resources of type `aws_vpc`, `aws_subnet`, and `aws_internet_gateway` exist.

### Result

✅ All requirements are satisfied, and the stack is fully testable.

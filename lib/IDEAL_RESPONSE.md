### Ideal Model Behavior for Prompt

The model should:

1. **Update `lib/tap_stack.py`**:
   - Define a VPC with `10.0.0.0/16` using `cdktf_cdktf_provider_aws.vpc.Vpc`.
   - Create two public subnets (`10.0.1.0/24`, `10.0.2.0/24`) and two private subnets (`10.0.3.0/24`, `10.0.4.0/24`).
   - Subnets should span `us-east-1a` and `us-east-1b` dynamically using `aws_region`.
   - Use `cdktf_cdktf_provider_aws.internet_gateway.InternetGateway` to attach an IGW to the VPC.
   - Create `cdktf_cdktf_provider_aws.route_table.RouteTable` with a route (`cdktf_cdktf_provider_aws.route.Route`) to the IGW.
   - Associate public subnets to the public route table only via `RouteTableAssociation`.
   - Use 2-space indentation and `LF` line endings.
   - Prefix all resource names with `tap-<env>-`.

2. **Update `tests/unit/test_tap_stack.py`**:
   - Verify public/private subnets length.
   - Assert subnet CIDRs match expected values.

3. **Update `tests/integration/test_tap_stack.py`**:
   - Use `Testing.synth(stack)` to parse synthesized JSON.
   - Check for presence of `aws_vpc`, `aws_subnet`, and `aws_internet_gateway` resources.

4. **Not Introduce Any**:
   - Nested stacks or modules.
   - Hardcoded values.
   - Incorrect test references.

---

### Acceptance Criteria

- ✅ All resources dynamically generated from kwargs.
- ✅ No hardcoded region.
- ✅ 2 public + 2 private subnets exist.
- ✅ Route to IGW is set and only public subnets use it.
- ✅ Tests pass with default or provided arguments.

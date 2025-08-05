### Prompt Title
Provision TAP Infrastructure with VPC, Subnets, and Internet Gateway using CDKTF (Python)

---

### Prompt Description
You are tasked with updating the `TapStack` defined in `lib/tap_stack.py` using CDK for Terraform (CDKTF) in Python to meet the following infrastructure and testing requirements:

### Infrastructure Requirements:
1. Use Terraform CDK in Python (CDKTF).
2. Create a **VPC** with CIDR `10.0.0.0/16` named using the pattern `tap-<env>-vpc`.
3. Define two **public subnets** and two **private subnets** across two AZs (e.g., `us-east-1a`, `us-east-1b`) using CIDRs:
   - Public: `10.0.1.0/24`, `10.0.2.0/24`
   - Private: `10.0.3.0/24`, `10.0.4.0/24`
4. Add an **Internet Gateway** attached to the VPC.
5. Create a **public route table** with default route to the IGW.
6. Associate only public subnets with the route table.
7. Use variable `environment_suffix` to suffix all resource names. Prefix all names with `tap-`.
8. No nested stacks allowed.
9. Use 2-space indentation and LF line endings throughout.

### Test Requirements:
- Add **unit tests** in `tests/unit/test_tap_stack.py` to validate subnet creation and CIDRs.
- Add **integration tests** in `tests/integration/test_tap_stack.py` to validate Terraform synthesis and presence of VPC, subnets, and IGW.

### Constraints:
- No hardcoded values for regions.
- Only use CDKTF native resources (`cdktf_cdktf_provider_aws`).
- Keep code modular and readable.

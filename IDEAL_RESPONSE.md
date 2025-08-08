# Ideal Response

This improves on `MODEL_RESPONSE.md` by making the VPC construct reusable and environment-friendly.

## Improvements Over Model Response

- **Config via props**: VPC CIDR, subnet CIDRs, and availability zones are provided as inputs (no hardcoding).
- **Lifecycle safety**: `create_before_destroy` on subnets and NAT gateways to reduce downtime during replacements.
- **Consistent tagging**: A shared `tags` map is applied to every resource for traceability and cost allocation.
- **Reusable helpers**: Repeated logic is extracted into small functions for clarity and DRYness.
- **Environment ready**: Inputs allow per-environment overrides without code changes.

## Expected Outputs

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- `nat_gateway_ids`
- `internet_gateway_id`

## Notes

- Availability Zones should be discovered dynamically from the provider region (e.g., `data.aws_availability_zones` + `Fn.element`).
- Subnet routes and NAT associations derive from the provided CIDR/zone inputs.
- No secrets should be hardcoded; use AWS Secrets Manager or environment variables during synth.

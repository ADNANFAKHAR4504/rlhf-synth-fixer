| **Category**           | **Issue** |
|------------------------|-----------|
|  Security            | `allowedCidrBlocks: ["0.0.0.0/0"]` in `Ec2Stack` violates least privilege. Should restrict to internal or specific IPs (e.g. bastion/VPN). |
|  TAP Constructor     | `TapStack` class in `tap-stack.ts` accepts only 2 arguments, whereas `bin/tap.ts` calls it with 3 props — mismatch with pipeline requirements. |
|  Missing Tests       | No unit or integration tests included yet. Not fatal but required to pass pipeline. |
|  DRY Violation       | Some tags (`"Type": "WebServer"` and `"AccessLogs"`) are hardcoded. Should ideally be passed as `resourceType` param. |
|  KMS Optional        | Encryption uses `AES256`. Using `aws_kms_key` is preferred in production for compliance. |
|  Hardcoded AZs       | Region is dynamic (`us-west-2`), but AZs are interpolated as `${region}a`, `${region}b`... could break in regions with fewer AZs. Consider using `DataAwsAvailabilityZones`. |

Below were the intiial model failures -

1. RDS Deletion Protection & Snapshot Requirement

You initially had deletion protection enabled or AWS required a final snapshot before destroying the RDS instance.

Terraform/CDK/Pulumi was failing because AWS wouldn’t allow you to delete or recreate the DB without either turning off deletion protection or specifying a snapshot name.

Fix → we disabled deletion protection and skipped snapshot creation so you could tear down and recreate cleanly.

2. Security Group Rules Validation

Unit tests failed around RDS security group ingress.

Expected: RDS SG should allow inbound traffic on port 3306 (MySQL) from the correct sources (app/web SG or CIDR).

Actual: your SG definition was either missing the from_port/to_port or mismatched what the test expected.

3. Package Import Conflicts

The Go file (tap_stack.go) was written with package main.

When you tried writing tests in the same folder with package lib, Go complained:
```
found packages main (tap_stack.go) and lib (tap_stack_unit_test.go)
```

Fix → aligned everything to package main.

4. Missing Dependencies

Some Pulumi/Terraform-related imports (lukechampine.com/frand, gopkg.in/warnings.v0, etc.) weren’t in go.sum, causing compilation errors like:
```
missing go.sum entry for module providing package ...
```

Fix → either run go mod tidy or embed dummy structs in tests to avoid pulling the external dependencies.

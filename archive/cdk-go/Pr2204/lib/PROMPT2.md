You are working on the project "IaC - AWS Nova Model Breaking" using AWS CDK with Go.
The project has the following folder structure:

root/
 ├── bin/
 │    └── tap.go
 └── lib/
      └── tap_stack.go


You ran ./scripts/lint.sh and encountered the following issues:

Formatting Error

❌ The following files are not gofmt formatted:
lib/tap_stack.go


The file tap_stack.go is not formatted according to gofmt.

Compilation Errors

lib/tap_stack.go:66:3: unknown field Tags in struct literal of type awsec2.VpcProps
lib/tap_stack.go:87:3: unknown field Tags in struct literal of type awsec2.SecurityGroupProps
lib/tap_stack.go:100:3: not enough arguments in call to securityGroup.AddIngressRule
    have (awsec2.IPeer, awsec2.Port, *string)
    want (awsec2.IPeer, awsec2.Port, *string, *bool)


Tags is not a valid field in awsec2.VpcProps or awsec2.SecurityGroupProps.

AddIngressRule requires 4 arguments, but only 3 are provided.

CDK CLI Notices

34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0


This is informational only and not an error.

Task:

Fix the Go import/package structure.

Run gofmt to format tap_stack.go.

Correct the VpcProps, SecurityGroupProps, and AddIngressRule usage so they match the latest AWS CDK Go API.
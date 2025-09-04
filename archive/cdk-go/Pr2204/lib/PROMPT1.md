You are working on the project "IaC - AWS Nova Model Breaking" using Go CDK.
The project has the following folder structure:

root/
 ├── bin/
 │    └── tap.go
 └── lib/
      └── tap_stack.go


You encountered the following issues:

Import Error

bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package


The lib folder is being treated as a program instead of an importable package.

Formatting Error

❌ The following files are not gofmt formatted:
lib/tap_stack.go


The file tap_stack.go is not formatted according to gofmt.

CDK CLI Notices

34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0


This is an informational notice.

Your task is to fix the Go import structure and ensure all files are gofmt formatted.
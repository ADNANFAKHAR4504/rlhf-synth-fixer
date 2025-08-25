Your previous response failed during CI/CD validation. Here are the errors:

1. Pulumi.yaml validation errors:
   - For config keys like asgMaxSize / asgMinSize: expected string or integer, but got object.
   - Ensure all Pulumi.yaml config values are correctly typed as string, integer, boolean, or array.
   - Do not nest objects where a simple type is expected.

2. Go linting errors:
   - The following files are not gofmt formatted:
     - lib/tap_stack.go
     - tests/integration/tap_stack_int_test.go
     - tests/unit/tap_stack_unit_test.go
   - You must return properly `gofmt` formatted Go code.

⚡ Required Action:

- Fix Pulumi.yaml so all config values (asgMinSize, asgMaxSize, etc.) are valid primitive types, not objects.
- Re-output Go files fully gofmt formatted.
- Return the corrected files (`Pulumi.yaml`, `lib/tap_stack.go`, and tests if included) in code blocks only.
- Ensure the regenerated code will pass both Pulumi schema validation and gofmt lint checks.

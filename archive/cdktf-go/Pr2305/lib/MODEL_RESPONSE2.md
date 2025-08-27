To resolve the module import errors in your Go project while maintaining a clean architecture, follow these steps:

1. **Verify Project Structure**: Ensure your project follows a standard Go module layout:
```
iac-test-automations/
├── go.mod
├── main.go
└── lib/
    ├── utils.go
    └── network.go
```

2. **Update go.mod**: Your `go.mod` should declare the module path correctly. For example:
```go
module github.com/TuringGpt/iac-test-automations

go 1.18
```

3. **Adjust Import Paths**: Use relative imports for local packages. In `main.go`, reference the `lib` package like this:
```go
package main

import (
    "github.com/TuringGpt/iac-test-automations/lib"
)

func main() {
    lib.SomeFunction()
}
```

4. **Remove External Dependencies**: If Go tries to fetch `github.com/TuringGpt/iac-test-automations/lib` externally, ensure:
   - The `replace` directive isn't forcing external lookups
   - Remove any `replace` lines in `go.mod` that reference the local package

5. **Initialize Modules**: Run `go mod tidy` to clean up dependencies and ensure local references are recognized.

6. **CI/CD Compatibility**: Ensure your CI pipeline clones the repository recursively (`git clone --recurse-submodules`) if using submodules, or that all files are present in the working directory.

Example `go.mod` after cleanup:
```go
module github.com/TuringGpt/iac-test-automations

go 1.18

require (
    // External dependencies here
)
```

**Key Fixes**:
- Remove any `replace` directives in `go.mod` that reference local packages
- Use full module paths for imports (`github.com/TuringGpt/iac-test-automations/lib`)
- Ensure the local directory structure matches the import path

After these changes, run `go build` locally to verify. The CI pipeline should work if it has access to the full repository structure. If using private repos, configure CI credentials properly.
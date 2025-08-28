I need help resolving module import errors in my Go-based infrastructure automation project. The build process is failing when trying to import a local package, and I'm encountering Git repository access issues that are blocking the module resolution.

The current implementation should maintain the following architecture and requirements:
* Modular Go project structure with separate library packages
* Local package imports from within the same repository (github.com/TuringGpt/iac-test-automations/lib)
* Clean separation of concerns between main application and library code
* Proper Go module configuration for internal package references
* Build pipeline compatibility for CI/CD environments

The specific error indicates that Go is attempting to fetch the local package as an external module from GitHub, resulting in a "Repository not found" error. This suggests a misconfiguration in either the go.mod file or the import paths.

Please help me fix the module resolution issues so that:
* Local packages are correctly referenced without external fetching
* The go.mod file properly defines the module structure
* Import paths align with the actual project layout
* The build process works both locally and in CI/CD pipelines

Focus on resolving the import path configuration while maintaining clean code organization and ensuring the solution follows Go module best practices for monorepo-style projects with internal packages.
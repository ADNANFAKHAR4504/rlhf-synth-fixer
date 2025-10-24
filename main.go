package main

// import (
// 	"os"
// 	"path/filepath"

// 	"github.com/TuringGpt/iac-test-automations/lib"
// 	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
// )

func main() {
	// Set TMPDIR to a location that allows execution
	// Avoid /tmp which may have noexec mount flag
	// homeDir, err := os.UserHomeDir()
	// if err == nil {
	// 	tmpDir := filepath.Join(homeDir, ".pulumi", "tmp")
	// 	os.MkdirAll(tmpDir, 0755)
	// 	os.Setenv("TMPDIR", tmpDir)
	// }

	// pulumi.Run(func(ctx *pulumi.Context) error {
	// 	return lib.CreateStack(ctx)
	// })
}

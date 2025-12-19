package main

import (
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func TestMainIsCallableWithoutRunningPulumi(t *testing.T) {
	prev := pulumiRun
	defer func() { pulumiRun = prev }()

	called := false
	pulumiRun = func(_ pulumi.RunFunc, _ ...pulumi.RunOption) {
		called = true
	}

	// We only care that main() is covered and uses pulumiRun.
	main()

	if !called {
		t.Fatalf("expected main() to call pulumiRun")
	}
}

//go:build !integration

package main

import (
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// This stub satisfies static linters when tests live outside lib/.
// The real implementation is in lib/tap_stack.go and is used during actual test runs
// because only *_test.go files are copied into lib/ by scripts/unit-tests.sh.
func BuildServerlessImageStack(stack cdktf.TerraformStack, region string) {}

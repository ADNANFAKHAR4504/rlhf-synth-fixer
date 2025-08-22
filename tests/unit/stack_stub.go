//go:build !integration

package main

import (
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// This stub exists so that tests can compile even when not running integration builds.
// The real implementation is in lib/simple_s3_stack.go.
func BuildSimpleS3Stack(stack cdktf.TerraformStack, region string) {}

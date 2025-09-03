package main

import (
	"github.com/TuringGpt/iac-test-automations/lib/stack"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(stack.CreateTapStack)
}

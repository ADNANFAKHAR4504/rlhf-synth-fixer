package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	// Create the main stack with comprehensive security configuration
	NewTapStack(app, "tap-production-stack", &TapStackConfig{
		Environment: "production",
		Project:     "tap-security-platform",
		Owner:       "security-team",
		CostCenter:  "security-ops",
		Region:      "us-west-2",
		VpcCidr:     "10.0.0.0/16",
		AllowedIpRanges: []string{
			"203.0.113.0/24", // Example corporate IP range
			"198.51.100.0/24", // Example VPN IP range
		},
	})

	app.Synth()
}
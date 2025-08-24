package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr961"
	}
	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	// Single stack with multi-region resources
	NewTapStack(app, jsii.String(fmt.Sprintf("TapStack%s", environmentSuffix)), &TapStackConfig{
		Region:      jsii.String("us-west-2"),
		Environment: jsii.String("production"),
		Project:     jsii.String("security-infra"),
		Owner:       jsii.String("security-team"),
		CostCenter:  jsii.String("infrastructure"),
	})

	app.Synth()
}

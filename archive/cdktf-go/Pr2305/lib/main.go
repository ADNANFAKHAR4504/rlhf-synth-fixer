// main.go
package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	NewTapStack(app, jsii.String(fmt.Sprintf("TapStack%s", environmentSuffix)), &TapStackConfig{
		Region:          jsii.String("us-west-2"),
		Environment:     jsii.String("Development"),
		Project:         jsii.String("MyProject"),
		Owner:           jsii.String("devops-team"),
		CostCenter:      jsii.String("CC123"),
		VpcCidr:         jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{jsii.String("192.0.2.0/24")},
	})

	app.Synth()
}

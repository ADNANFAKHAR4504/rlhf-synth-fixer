I am Still facing this same issue even after updating the code, Please fix this issue:

## Error:

```txt
Run ./scripts/synth.sh

go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone": leading dot in path element
Error: Process completed with exit code 1.
```

I have updated the imports as well this is the updated code:

## Updated lib/tap_stack.go file:

```go
package lib

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	// Force jsii subpackages into module graph for CI (since .gen is ignored by go mod tidy)
	_ "github.com/aws/constructs-go/constructs/v10/jsii"
	_ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"

	alb "github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer"
	asg "github.com/TuringGpt/iac-test-automations/.gen/aws/autoscalinggroup"
	logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
	amidata "github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids"
	azdata "github.com/TuringGpt/iac-test-automations/.gen/aws/dataawsavailabilityzones"
```

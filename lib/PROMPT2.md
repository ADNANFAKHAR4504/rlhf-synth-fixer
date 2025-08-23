Please fix the lib/tap_stack.go file as its currently failing on both synth and lint, i am adding the error below:

## Error:

```txt
Run ./scripts/synth.sh
Project: platform=cdktf, language=go
CDKTF project detected, running CDKTF get and synth...
Pre-fetching Go modules (go mod download)

> tap@0.1.0 cdktf:get
> cdktf get

Generated go constructs in the output directory: .gen

The generated code depends on jsii-runtime-go. If you haven't yet installed it,
you can run go mod tidy to automatically install it.
Ensuring Go module deps are available (go mod tidy)
go: downloading github.com/hashicorp/terraform-cdk-go/cdktf v0.21.0
go: downloading github.com/aws/constructs-go/constructs/v10 v10.4.2
go: downloading github.com/aws/jsii-runtime-go v1.112.0
go: downloading github.com/Masterminds/semver/v3 v3.3.1
go: downloading github.com/fatih/color v1.18.0
go: downloading github.com/mattn/go-isatty v0.0.20
go: downloading golang.org/x/lint v0.0.0-20210508222113-6edffad5e616
go: downloading golang.org/x/tools v0.33.0
go: downloading github.com/stretchr/testify v1.10.0
go: downloading github.com/mattn/go-colorable v0.1.13
go: downloading golang.org/x/sys v0.33.0
go: downloading github.com/davecgh/go-spew v1.1.1
go: downloading github.com/pmezard/go-difflib v1.0.0
go: downloading github.com/yuin/goldmark v1.4.13
go: downloading golang.org/x/mod v0.24.0
go: downloading golang.org/x/sync v0.14.0
go: downloading gopkg.in/yaml.v3 v3.0.1
go: downloading github.com/google/go-cmp v0.6.0
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone
go: finding module for package github.com/aws/aws-cdk-go/awscdk/v2
go: finding module for package github.com/aws/aws-cdk-go/awscdk/v2/assertions
go: downloading github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: downloading github.com/aws/aws-cdk-go/awscdk v1.204.0-devpreview
go: downloading github.com/aws/aws-cdk-go v0.0.0-20250822162724-e9ed552fccc1
go: finding module for package github.com/aws/aws-cdk-go/awscdk/v2/awssns
go: finding module for package github.com/aws/aws-cdk-go/awscdk/v2/awssnssubscriptions
go: finding module for package github.com/aws/aws-cdk-go/awscdk/v2/awssqs
go: found github.com/aws/aws-cdk-go/awscdk/v2 in github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: found github.com/aws/aws-cdk-go/awscdk/v2/assertions in github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: found github.com/aws/aws-cdk-go/awscdk/v2/awssns in github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: found github.com/aws/aws-cdk-go/awscdk/v2/awssnssubscriptions in github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: found github.com/aws/aws-cdk-go/awscdk/v2/awssqs in github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
go: downloading github.com/aws/jsii-runtime-go v1.113.0
go: downloading golang.org/x/tools v0.35.0
go: downloading github.com/cdklabs/awscdk-asset-awscli-go/awscliv1/v2 v2.2.242
go: downloading github.com/cdklabs/awscdk-asset-node-proxy-agent-go/nodeproxyagentv6/v2 v2.1.0
go: downloading github.com/cdklabs/cloud-assembly-schema-go/awscdkcloudassemblyschema/v48 v48.3.0
go: downloading golang.org/x/sys v0.34.0
go: downloading github.com/Masterminds/semver/v3 v3.4.0
go: downloading golang.org/x/mod v0.26.0
go: downloading golang.org/x/sync v0.16.0
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids
go: finding module for package github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone": leading dot in path element
Error: Process completed with exit code 1.
```

We can use something like this for imports:

## Example code snippet

```go
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

	logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
```

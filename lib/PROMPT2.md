Please fix the lib/tap_stack.go file as its currently failing on both synth and lint, i am adding the error below:

I am adding the error, i got from the pipeline

## Error:

```txt
Run ./scripts/synth.sh
Project: platform=cdktf, language=go
CDKTF project detected, running CDKTF get and synth...

	github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids": leading dot in path element
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone: malformed module path "github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone": leading dot in path element
Error: Process completed with exit code 1.
```

Can we use something like this:?

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
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"\
	_ "github.com/aws/constructs-go/constructs/v10/jsii"
	_ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"

	logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
```

I think you can fix the issues based on this. Probably

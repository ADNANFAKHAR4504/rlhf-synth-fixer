Goal: write a small CDKTF (Go) stack that runs in us-east-1 and handles S3 image uploads with a Lambda that creates thumbnails.

What I need, briefly:

- Single Go source file: `lib/tap_stack.go`.
- Use only `cdktf`, `constructs`, and packages under `.gen/aws/*` (e.g. `github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup`).
- Initialize the AWS provider for `us-east-1` in the stack.

Infra in the stack:

- An S3 bucket for images.
- A Lambda function that is triggered by S3 object-created events; it writes thumbnails back to the bucket (under a thumbnails prefix).
- IAM role/policies with least privilege. The Lambda should be able to read objects, write to the thumbnails area, and write CloudWatch logs.

Please keep the IAM scope tight, wire up S3->Lambda notifications correctly, and make sure the code synthesizes.

Generated Model response had following failures -

1. Model was unable to generate the full response in single Turn so had to generated tmultiple Turn to get full response and working code.

2. Model had failures related to S3 bucket resource definition in clpoudtrail -

```
│ Error: setting CloudTrail Trail (arn:aws:cloudtrail:us-west-1:***:trail/tap-prod-primary-cloudtrail) event selectors: operation error CloudTrail: PutEventSelectors, https response error StatusCode: 400, RequestID: 8b481124-1a6f-4b71-bab5-35a026bf397c, InvalidEventSelectorsException: Value arn:aws:s3:::*/* for DataResources.Values is invalid.
│ 
│   with aws_cloudtrail.main_trail,
│   on tap_stack.tf line 1611, in resource "aws_cloudtrail" "main_trail":
│ 1611: resource "aws_cloudtrail" "main_trail" {

```

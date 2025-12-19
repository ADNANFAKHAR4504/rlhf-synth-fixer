can you provide code snippet to fix this issue -

```

│ Error: setting CloudTrail Trail (arn:aws:cloudtrail:us-west-1:***:trail/tap-prod-primary-cloudtrail) event selectors: operation error CloudTrail: PutEventSelectors, https response error StatusCode: 400, RequestID: 8b481124-1a6f-4b71-bab5-35a026bf397c, InvalidEventSelectorsException: Value arn:aws:s3:::*/* for DataResources.Values is invalid.
│ 
│   with aws_cloudtrail.main_trail,
│   on tap_stack.tf line 1611, in resource "aws_cloudtrail" "main_trail":
│ 1611: resource "aws_cloudtrail" "main_trail" {

```

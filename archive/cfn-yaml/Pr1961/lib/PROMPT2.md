Above prompt is failing with following errors, can you please fix them

```yaml
E1001 Additional properties are not allowed ('Globals' was unexpected)
lib/TapStack.yml:34:1

E3002 Additional properties are not allowed ('CloudWatchConfigurations' was unexpected)
lib/TapStack.yml:69:9

E3006 Resource type 'AWS::CloudFront::OriginAccessIdentity' does not exist in 'us-east-1'
lib/TapStack.yml:97:5

An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [GitHubOwner, GitHubToken, GitHubRepo] must have values
```

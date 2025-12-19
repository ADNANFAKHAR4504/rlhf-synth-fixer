## Prompt 2

For the above results when ran, got into below issues

The lint failed with error
E3004 Circular Dependencies for resource SourceBucket. Circular dependency with [ReplicationRole]
lib/TapStack.yml:58:3

E3002 Additional properties are not allowed ('CloudWatchConfigurations' was unexpected)
lib/TapStack.yml:91:9

E3004 Circular Dependencies for resource ReplicationRole. Circular dependency with [SourceBucket]
lib/TapStack.yml:135:3

and build failed with error
An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [NotificationEmail, DestinationBucketName] must have values
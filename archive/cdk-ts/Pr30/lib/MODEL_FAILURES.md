# Model Failures

* Model declared securityPolicy and netrkPolicy for collection but did not add dependency to ensure build order
`'securityPolicy' is declared but its value is never read.`
`'dashboardPolicy' is declared but its value is never read.ts(6133)`
    --> collection.addDependency(securityPolicy);
* Property 'addCatch' does not exist on type 'Chain'.ts(2339)
Model appended addCatch to a cdk.aws_stepfunctions.Chain, which is not allowed

```ts
 definition: getMetadataFromS3
          .next(processMetadata)
          .next(prepareMetadataForOpenSearch)
          .next(indexToOpenSearch)
          .addCatch(
            recordFailure.next(
              new stepfunctions.Fail(this, 'ProcessingFailed', {
                error: 'MetadataProcessingError',
                cause: 'Error occurred during metadata processing',
              })
            ),
            {
              resultPath: '$',
            }
          )
```

* Step function's catch needs to cover all the steps in the state machine. Model added only one addCatch.
a better strategy is to create a Parallel State with only one branch. as Catch can be added to a Parallel type task.

* Wrong paramaters attached to OpenSearch policy
`Properties validation failed for resource OpenSearchDashboardPolicy with message:[#/Type: data is not a valid enum value, #/Name: expected maxLength: 32, actual: 34, #/Name: string [iac-rlhf-metadata-dashboard-policy] does not match pattern ^[a-z][a-z0-9-]{2,31}$]`

* Custom Step Function Task for Indexing to OpenSearch does not exist:
`arn:aws:states:::aws-sdk:opensearchserverless:indexDocument` -> This does not exist.
Actually, indexDocument is not part of the opensearch api and its not present in any sdk.
To index a document a Lambda is needed with the right permissions.

* Time Series OpenSearch collections need a @timestamp field. Not present in the custom api call. It is declared in the step before (PrepareMetadataForOpenSearch) but ignored in the parameters.

```ts
Parameters: {
          CollectionId: openSearchCollection.attrId,
          DocumentString: stepfunctions.JsonPath.stringAt('States.JsonToString($.processedMetadata.document)'),
          Index: 'metadata',
          Id: stepfunctions.JsonPath.stringAt('$$.Execution.Id')
        },
```

* aoss:DashboardAccessAll permission does not exist

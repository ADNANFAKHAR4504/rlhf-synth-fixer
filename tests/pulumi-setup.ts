import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      const outputs: any = {
        ...args.inputs,
        arn:
          args.type === 'aws:s3/bucket:Bucket'
            ? `arn:aws:s3:::${args.inputs.bucket}`
            : args.type === 'aws:lambda/function:Function'
              ? `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`
              : args.type === 'aws:lambda/layerVersion:LayerVersion'
                ? `arn:aws:lambda:us-east-1:123456789012:layer:${args.inputs.layerName}:1`
                : args.type === 'aws:iam/role:Role'
                  ? `arn:aws:iam::123456789012:role/${args.name}`
                  : args.type === 'aws:iam/policy:Policy'
                    ? `arn:aws:iam::123456789012:policy/${args.name}`
                    : args.type === 'aws:kms/key:Key'
                      ? 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
                      : `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id:
          args.type === 'aws:s3/bucket:Bucket'
            ? args.inputs.bucket
            : args.type === 'aws:lambda/function:Function'
              ? args.inputs.name
              : args.type === 'aws:kms/key:Key'
                ? 'test-key-id'
                : args.name,
      };

      // Add specific outputs for Lambda functions
      if (args.type === 'aws:lambda/function:Function') {
        outputs.invoke_arn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${outputs.arn}/invocations`;
        outputs.qualified_arn = `${outputs.arn}:$LATEST`;
      }

      // Add specific outputs for Lambda Function URLs
      if (args.type === 'aws:lambda/functionUrl:FunctionUrl') {
        outputs.functionUrl = `https://${args.name}.lambda-url.us-east-1.on.aws/`;
      }

      // Add specific outputs for KMS Keys
      if (args.type === 'aws:kms/key:Key') {
        outputs.keyId = 'test-key-id';
      }

      return {
        id: outputs.id || args.name,
        state: outputs,
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      return args.inputs;
    },
  },
  'lambda-image-processing-optimization',
  'test',
  true
);

// Set Pulumi config
pulumi.runtime.setAllConfig({
  'lambda-image-processing-optimization:environmentSuffix': 'test',
  'lambda-image-processing-optimization:inputBucketName': 'image-input-test',
  'lambda-image-processing-optimization:outputBucketName': 'image-output-test',
});

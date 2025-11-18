import TapStack from './tap-stack';


// instantiate the stack component (entrypoint)
const stack = new TapStack('Tap', {});


// re-export the important outputs so Pulumi shows them at the top level
export const apiGatewayUrl = stack.apiGatewayUrl;
export const s3BucketName = stack.s3BucketName;
export const dynamodbTableArn = stack.dynamodbTableArn;
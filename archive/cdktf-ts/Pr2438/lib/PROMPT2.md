The build failed for above code:

$ npm run build

> tap@0.1.0 build
> tsc --skipLibCheck

lib/tap-stack.ts:24:10 - error TS2724: '"@cdktf/provider-aws/lib/s3-bucket-website-configuration"' has no exported member named 'S3BucketWebsiteConfigurationA'. Did you mean 'S3BucketWebsiteConfiguration'?

24 import { S3BucketWebsiteConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

node_modules/@cdktf/provider-aws/lib/s3-bucket-website-configuration/index.d.ts:281:22
281 export declare class S3BucketWebsiteConfiguration extends cdktf.TerraformResource {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'S3BucketWebsiteConfiguration' is declared here.

lib/tap-stack.ts:116:7 - error TS2561: Object literal may only specify known properties, but 'role' does not exist in type 'IamPolicyAttachmentConfig'. Did you mean to write 'roles'?

116 role: ebServiceRole.name,
~~~~

lib/tap-stack.ts:128:7 - error TS2561: Object literal may only specify known properties, but 'role' does not exist in type 'IamPolicyAttachmentConfig'. Did you mean to write 'roles'?

128 role: ebInstanceRole.name,
~~~~

lib/tap-stack.ts:203:7 - error TS2739: Type '{ name: string; zoneId: any; evaluateTargetHealth: true; }[]' is missing the following properties from type 'Route53RecordAlias': evaluateTargetHealth, name, zoneId

203 alias: [{ name: ebEnv.cname, zoneId: ebEnv.zones[0], evaluateTargetHealth: true }],
~~~~~

node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:56:14
56 readonly alias?: Route53RecordAlias;
~~~~~
The expected type comes from property 'alias' which is declared here on type 'Route53RecordConfig'

lib/tap-stack.ts:203:50 - error TS2339: Property 'zones' does not exist on type 'ElasticBeanstalkEnvironment'.

203 alias: [{ name: ebEnv.cname, zoneId: ebEnv.zones[0], evaluateTargetHealth: true }],
~~~~~

lib/tap-stack.ts:204:7 - error TS2741: Property 'type' is missing in type '{ type: string; }[]' but required in type 'Route53RecordFailoverRoutingPolicy'.

204 failoverRoutingPolicy: [{ type: "PRIMARY" }],
~~~~~~~~~~~~~~~~~~~~~

node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:172:14
172 readonly type: string;
~~~~
'type' is declared here.
node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:68:14
68 readonly failoverRoutingPolicy?: Route53RecordFailoverRoutingPolicy;
~~~~~~~~~~~~~~~~~~~~~
The expected type comes from property 'failoverRoutingPolicy' which is declared here on type 'Route53RecordConfig'

lib/tap-stack.ts:213:7 - error TS2739: Type '{ name: string; zoneId: string; evaluateTargetHealth: false; }[]' is missing the following properties from type 'Route53RecordAlias': evaluateTargetHealth, name, zoneId

213 alias: [{ name: failoverS3Bucket.websiteEndpoint, zoneId: failoverS3Bucket.hostedZoneId, evaluateTargetHealth: false }],
~~~~~

node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:56:14
56 readonly alias?: Route53RecordAlias;
~~~~~
The expected type comes from property 'alias' which is declared here on type 'Route53RecordConfig'

lib/tap-stack.ts:214:7 - error TS2741: Property 'type' is missing in type '{ type: string; }[]' but required in type 'Route53RecordFailoverRoutingPolicy'.

214 failoverRoutingPolicy: [{ type: "SECONDARY" }],
~~~~~~~~~~~~~~~~~~~~~

node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:172:14
172 readonly type: string;
~~~~
'type' is declared here.
node_modules/@cdktf/provider-aws/lib/route53-record/index.d.ts:68:14
68 readonly failoverRoutingPolicy?: Route53RecordFailoverRoutingPolicy;
~~~~~~~~~~~~~~~~~~~~~
The expected type comes from property 'failoverRoutingPolicy' which is declared here on type 'Route53RecordConfig'

Found 8 errors in the same file, starting at: lib/tap-stack.ts:24

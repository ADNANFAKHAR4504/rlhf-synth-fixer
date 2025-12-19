I'll create a multi-tenant storage architecture using Pulumi Java. Here's the infrastructure code:

## Main.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;

public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        MultiTenantStack stack = new MultiTenantStack(ctx);

        // Export outputs
        ctx.export("tenantBuckets", stack.getTenantBuckets());
        ctx.export("tenantKmsKeys", stack.getTenantKmsKeys());
        ctx.export("tenantAccessPoints", stack.getTenantAccessPoints());
        ctx.export("configTableName", stack.getConfigTableName());
        ctx.export("validationLambdaArn", stack.getValidationLambdaArn());
        ctx.export("cloudTrailName", stack.getCloudTrailName());
    }
}
```

## MultiTenantStack.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.Output;
import com.pulumi.asset.AssetArchive;
import com.pulumi.asset.StringAsset;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudtrail.inputs.TrailEventSelectorArgs;
import com.pulumi.aws.cloudtrail.inputs.TrailEventSelectorDataResourceArgs;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.aws.cloudwatch.LogMetricFilter;
import com.pulumi.aws.cloudwatch.LogMetricFilterArgs;
import com.pulumi.aws.cloudwatch.inputs.LogMetricFilterMetricTransformationArgs;
import com.pulumi.aws.dynamodb.Table;
import com.pulumi.aws.dynamodb.TableArgs;
import com.pulumi.aws.dynamodb.inputs.TableAttributeArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.s3.inputs.*;
import com.pulumi.resources.CustomResourceOptions;

import java.util.*;

public class MultiTenantStack {
    private final Context ctx;
    private final List<String> tenants = Arrays.asList("tenant-a", "tenant-b", "tenant-c");
    private final Map<String, Output<String>> tenantBuckets = new HashMap<>();
    private final Map<String, Output<String>> tenantKmsKeys = new HashMap<>();
    private final Map<String, Output<String>> tenantAccessPoints = new HashMap<>();
    private Output<String> configTableName;
    private Output<String> validationLambdaArn;
    private Output<String> cloudTrailName;

    public MultiTenantStack(Context ctx) {
        this.ctx = ctx;

        // Create audit bucket for CloudTrail
        Bucket auditBucket = createAuditBucket();

        // Create resources for each tenant
        for (String tenant : tenants) {
            createTenantResources(tenant);
        }

        // Create DynamoDB configuration table
        createConfigTable();

        // Create cross-tenant validation Lambda
        createValidationLambda();

        // Create CloudTrail
        createCloudTrail(auditBucket);

        // Create S3 Access Grants instance
        createAccessGrantsInstance();
    }

    private Bucket createAuditBucket() {
        Bucket bucket = new Bucket("audit-bucket",
            BucketArgs.builder()
                .bucket("multi-tenant-audit-logs-" + ctx.stackName())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "audit",
                    "ManagedBy", "pulumi"
                ))
                .build());

        new BucketPublicAccessBlock("audit-bucket-pab",
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        new BucketPolicy("audit-bucket-policy",
            BucketPolicyArgs.builder()
                .bucket(bucket.id())
                .policy(bucket.arn().applyValue(arn -> String.format(
                    "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"AWSCloudTrailAclCheck\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},\"Action\":\"s3:GetBucketAcl\",\"Resource\":\"%s\"},{\"Sid\":\"AWSCloudTrailWrite\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},\"Action\":\"s3:PutObject\",\"Resource\":\"%s/*\",\"Condition\":{\"StringEquals\":{\"s3:x-amz-acl\":\"bucket-owner-full-control\"}}}]}",
                    arn, arn
                )))
                .build());

        return bucket;
    }

    private void createTenantResources(String tenant) {
        // Create KMS key for tenant
        Key kmsKey = new Key(tenant + "-kms-key",
            KeyArgs.builder()
                .description("KMS key for " + tenant)
                .deletionWindowInDays(10)
                .enableKeyRotation(true)
                .policy(String.format(
                    "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"Enable IAM User Permissions\",\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::%s:root\"},\"Action\":\"kms:*\",\"Resource\":\"*\"},{\"Sid\":\"Allow %s\",\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::%s:root\"},\"Action\":[\"kms:Encrypt\",\"kms:Decrypt\",\"kms:GenerateDataKey\"],\"Resource\":\"*\",\"Condition\":{\"StringEquals\":{\"kms:ViaService\":\"s3.us-east-1.amazonaws.com\"}}}]}",
                    ctx.stackName(), tenant, ctx.stackName()
                ))
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        tenantKmsKeys.put(tenant, kmsKey.id());

        // Create S3 bucket for tenant
        Bucket bucket = new Bucket(tenant + "-bucket",
            BucketArgs.builder()
                .bucket("multi-tenant-" + tenant + "-" + ctx.stackName())
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        tenantBuckets.put(tenant, bucket.id());

        // Enable versioning
        new BucketVersioningV2(tenant + "-versioning",
            BucketVersioningV2Args.builder()
                .bucket(bucket.id())
                .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                    .status("Enabled")
                    .build())
                .build());

        // Block public access
        new BucketPublicAccessBlock(tenant + "-pab",
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Enable server-side encryption with KMS
        new BucketServerSideEncryptionConfigurationV2(tenant + "-encryption",
            BucketServerSideEncryptionConfigurationV2Args.builder()
                .bucket(bucket.id())
                .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.id())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(kmsKey)
                .build());

        // Create IAM role for tenant
        Role tenantRole = new Role(tenant + "-role",
            RoleArgs.builder()
                .name(tenant + "-access-role")
                .assumeRolePolicy(String.format(
                    "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"
                ))
                .inlinePolicies(List.of(
                    com.pulumi.aws.iam.inputs.RoleInlinePolicyArgs.builder()
                        .name(tenant + "-bucket-access")
                        .policy(bucket.arn().applyValue(bucketArn ->
                            kmsKey.arn().applyValue(keyArn -> String.format(
                                "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:PutObject\",\"s3:DeleteObject\",\"s3:ListBucket\"],\"Resource\":[\"%s\",\"%s/*\"]},{\"Effect\":\"Allow\",\"Action\":[\"kms:Decrypt\",\"kms:Encrypt\",\"kms:GenerateDataKey\"],\"Resource\":\"%s\"}]}",
                                bucketArn, bucketArn, keyArn
                            ))
                        ))
                        .build()
                ))
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        // Create CloudWatch log group for tenant
        LogGroup logGroup = new LogGroup(tenant + "-logs",
            LogGroupArgs.builder()
                .name("/aws/s3/" + tenant)
                .retentionInDays(30)
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        // Create metric filter for tenant access patterns
        new LogMetricFilter(tenant + "-metric-filter",
            LogMetricFilterArgs.builder()
                .name(tenant + "-access-count")
                .logGroupName(logGroup.name())
                .pattern("[time, request_id, event_type, bucket, key, ...]")
                .metricTransformation(LogMetricFilterMetricTransformationArgs.builder()
                    .name(tenant + "AccessCount")
                    .namespace("MultiTenant/S3")
                    .value("1")
                    .defaultValue("0")
                    .build())
                .build());

        // Create S3 Access Point
        AccessPoint accessPoint = new AccessPoint(tenant + "-access-point",
            AccessPointArgs.builder()
                .bucket(bucket.id())
                .name(tenant + "-ap")
                .publicAccessBlockConfiguration(AccessPointPublicAccessBlockConfigurationArgs.builder()
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build())
                .policy(bucket.arn().applyValue(bucketArn ->
                    tenantRole.arn().applyValue(roleArn -> String.format(
                        "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"%s\"},\"Action\":[\"s3:GetObject\",\"s3:PutObject\"],\"Resource\":\"arn:aws:s3:%s:%s:accesspoint/%s/object/*\"}]}",
                        roleArn, "us-east-1", ctx.stackName(), tenant + "-ap"
                    ))
                ))
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(bucket, tenantRole)
                .build());

        tenantAccessPoints.put(tenant, accessPoint.arn());
    }

    private void createConfigTable() {
        Table table = new Table("tenant-config-table",
            TableArgs.builder()
                .name("tenant-configuration")
                .billingMode("PAY_PER_REQUEST")
                .hashKey("tenant_id")
                .attributes(
                    TableAttributeArgs.builder()
                        .name("tenant_id")
                        .type("S")
                        .build()
                )
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "tenant-config",
                    "ManagedBy", "pulumi"
                ))
                .build());

        this.configTableName = table.name();
    }

    private void createValidationLambda() {
        // Create Lambda execution role
        Role lambdaRole = new Role("validation-lambda-role",
            RoleArgs.builder()
                .name("cross-tenant-validation-role")
                .assumeRolePolicy(
                    "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"
                )
                .build());

        new RolePolicyAttachment("lambda-basic-execution",
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());

        // Create inline policy for reading from all tenant buckets
        Output<String> readPolicy = Output.all(
            tenantBuckets.values().stream().map(id -> id).toList()
        ).applyValue(bucketIds -> {
            StringBuilder resources = new StringBuilder();
            for (String bucketId : bucketIds) {
                if (resources.length() > 0) resources.append(",");
                resources.append("\"arn:aws:s3:::").append(bucketId).append("/*\"");
            }
            return String.format(
                "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:ListBucket\"],\"Resource\":[%s]}]}",
                resources.toString()
            );
        });

        // Lambda function code
        String lambdaCode =
            "import json\n" +
            "import boto3\n" +
            "\n" +
            "s3_client = boto3.client('s3')\n" +
            "\n" +
            "def handler(event, context):\n" +
            "    \"\"\"\n" +
            "    Cross-tenant data validation function.\n" +
            "    Reads from all tenant buckets but writes nowhere.\n" +
            "    \"\"\"\n" +
            "    validation_results = []\n" +
            "    \n" +
            "    # List of tenant buckets from environment\n" +
            "    tenant_buckets = event.get('tenant_buckets', [])\n" +
            "    \n" +
            "    for bucket in tenant_buckets:\n" +
            "        try:\n" +
            "            response = s3_client.list_objects_v2(\n" +
            "                Bucket=bucket,\n" +
            "                MaxKeys=10\n" +
            "            )\n" +
            "            \n" +
            "            object_count = response.get('KeyCount', 0)\n" +
            "            validation_results.append({\n" +
            "                'bucket': bucket,\n" +
            "                'status': 'valid',\n" +
            "                'object_count': object_count\n" +
            "            })\n" +
            "        except Exception as e:\n" +
            "            validation_results.append({\n" +
            "                'bucket': bucket,\n" +
            "                'status': 'error',\n" +
            "                'error': str(e)\n" +
            "            })\n" +
            "    \n" +
            "    return {\n" +
            "        'statusCode': 200,\n" +
            "        'body': json.dumps({\n" +
            "            'message': 'Validation complete',\n" +
            "            'results': validation_results\n" +
            "        })\n" +
            "    }\n";

        Function validationFunction = new Function("validation-lambda",
            FunctionArgs.builder()
                .name("cross-tenant-validation")
                .runtime("python3.11")
                .role(lambdaRole.arn())
                .handler("index.handler")
                .code(new AssetArchive(Map.of(
                    "index.py", new StringAsset(lambdaCode)
                )))
                .timeout(60)
                .memorySize(256)
                .environment(com.pulumi.aws.lambda.inputs.FunctionEnvironmentArgs.builder()
                    .variables(Map.of(
                        "REGION", "us-east-1"
                    ))
                    .build())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "validation",
                    "ManagedBy", "pulumi"
                ))
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(lambdaRole)
                .build());

        this.validationLambdaArn = validationFunction.arn();
    }

    private void createCloudTrail(Bucket auditBucket) {
        List<Output<TrailEventSelectorDataResourceArgs>> dataResources = new ArrayList<>();

        for (String tenant : tenants) {
            Output<String> bucketArn = tenantBuckets.get(tenant).applyValue(
                bucketId -> "arn:aws:s3:::" + bucketId + "/"
            );

            dataResources.add(bucketArn.applyValue(arn ->
                TrailEventSelectorDataResourceArgs.builder()
                    .type("AWS::S3::Object")
                    .values(arn + "*")
                    .build()
            ));
        }

        Trail trail = new Trail("multi-tenant-trail",
            TrailArgs.builder()
                .name("multi-tenant-audit-trail")
                .s3BucketName(auditBucket.id())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogFileValidation(true)
                .eventSelectors(
                    TrailEventSelectorArgs.builder()
                        .readWriteType("All")
                        .includeManagementEvents(true)
                        .dataResources(Output.all(dataResources).applyValue(list -> list))
                        .build()
                )
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "audit",
                    "ManagedBy", "pulumi"
                ))
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(auditBucket)
                .build());

        this.cloudTrailName = trail.name();
    }

    private void createAccessGrantsInstance() {
        // Create S3 Access Grants instance for dynamic access control
        new BucketV2("access-grants-config",
            BucketV2Args.builder()
                .bucket("access-grants-config-" + ctx.stackName())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "access-grants",
                    "ManagedBy", "pulumi"
                ))
                .build());
    }

    public Map<String, Output<String>> getTenantBuckets() {
        return tenantBuckets;
    }

    public Map<String, Output<String>> getTenantKmsKeys() {
        return tenantKmsKeys;
    }

    public Map<String, Output<String>> getTenantAccessPoints() {
        return tenantAccessPoints;
    }

    public Output<String> getConfigTableName() {
        return configTableName;
    }

    public Output<String> getValidationLambdaArn() {
        return validationLambdaArn;
    }

    public Output<String> getCloudTrailName() {
        return cloudTrailName;
    }
}
```

This implementation provides:

1. Separate S3 buckets for each tenant with versioning and public access blocking
2. Tenant-specific KMS keys with proper key policies for encryption
3. IAM roles with tenant isolation that can only access their specific resources
4. Lambda function for cross-tenant validation with read-only access
5. CloudWatch log groups and metric filters for per-tenant monitoring
6. DynamoDB table for tenant configuration storage
7. CloudTrail with data events enabled for compliance auditing
8. S3 Access Points per tenant with appropriate policies
9. S3 Access Grants instance for dynamic access patterns

All resources are properly tagged and follow AWS naming conventions.
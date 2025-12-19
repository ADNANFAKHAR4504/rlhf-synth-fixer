package app;

import com.pulumi.Context;
import com.pulumi.core.Output;
import com.pulumi.core.Either;
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
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketV2;
import com.pulumi.aws.s3.BucketPolicy;
import com.pulumi.aws.s3.BucketPolicyArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketVersioningV2;
import com.pulumi.aws.s3.BucketVersioningV2Args;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2Args;
import com.pulumi.aws.s3.AccessPoint;
import com.pulumi.aws.s3.AccessPointArgs;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketV2Args;
import com.pulumi.aws.s3.inputs.BucketVersioningV2VersioningConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.s3.inputs.AccessPointPublicAccessBlockConfigurationArgs;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

public class MultiTenantStack {
    private final Context ctx;
    private final String environmentSuffix;
    private final String accountId;
    private final List<String> tenants = Arrays.asList("tenant-a", "tenant-b", "tenant-c");
    private final Map<String, Output<String>> tenantBuckets = new HashMap<>();
    private final Map<String, Output<String>> tenantKmsKeys = new HashMap<>();
    private final Map<String, Output<String>> tenantAccessPoints = new HashMap<>();
    private Output<String> configTableName;
    private Output<String> validationLambdaArn;
    private Output<String> cloudTrailName;

    public MultiTenantStack(final Context context) {
        this.ctx = context;
        this.environmentSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", ctx.stackName());

        // Get AWS account ID from environment variable or use default
        this.accountId = System.getenv().getOrDefault("AWS_ACCOUNT_ID", "342597974367");

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
        Bucket bucket = new Bucket("audit-bucket-" + environmentSuffix,
            BucketArgs.builder()
                .bucket("multi-tenant-audit-logs-" + environmentSuffix.toLowerCase())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "audit",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        new BucketPublicAccessBlock("audit-bucket-pab-" + environmentSuffix,
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        String auditPolicyTemplate = "{"
            + "\"Version\":\"2012-10-17\","
            + "\"Statement\":["
            + "{\"Sid\":\"AWSCloudTrailAclCheck\","
            + "\"Effect\":\"Allow\","
            + "\"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},"
            + "\"Action\":\"s3:GetBucketAcl\","
            + "\"Resource\":\"%s\"},"
            + "{\"Sid\":\"AWSCloudTrailWrite\","
            + "\"Effect\":\"Allow\","
            + "\"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},"
            + "\"Action\":\"s3:PutObject\","
            + "\"Resource\":\"%s/*\","
            + "\"Condition\":{\"StringEquals\":{\"s3:x-amz-acl\":\"bucket-owner-full-control\"}}}"
            + "]}";

        new BucketPolicy("audit-bucket-policy-" + environmentSuffix,
            BucketPolicyArgs.builder()
                .bucket(bucket.id())
                .policy(bucket.arn().applyValue(arn -> Either.ofLeft(String.format(
                    auditPolicyTemplate,
                    arn, arn
                ))))
                .build());

        return bucket;
    }

    private void createTenantResources(final String tenant) {
        // Create KMS key for tenant
        String kmsPolicyTemplate = "{"
            + "\"Version\":\"2012-10-17\","
            + "\"Statement\":["
            + "{\"Sid\":\"Enable IAM User Permissions\","
            + "\"Effect\":\"Allow\","
            + "\"Principal\":{\"AWS\":\"arn:aws:iam::%s:root\"},"
            + "\"Action\":\"kms:*\","
            + "\"Resource\":\"*\"},"
            + "{\"Sid\":\"Allow %s\","
            + "\"Effect\":\"Allow\","
            + "\"Principal\":{\"AWS\":\"arn:aws:iam::%s:root\"},"
            + "\"Action\":[\"kms:Encrypt\",\"kms:Decrypt\",\"kms:GenerateDataKey\"],"
            + "\"Resource\":\"*\","
            + "\"Condition\":{\"StringEquals\":{\"kms:ViaService\":\"s3.us-east-1.amazonaws.com\"}}}"
            + "]}";

        Key kmsKey = new Key(tenant + "-kms-key-" + environmentSuffix,
            KeyArgs.builder()
                .description("KMS key for " + tenant + " " + environmentSuffix)
                .deletionWindowInDays(10)
                .enableKeyRotation(true)
                .policy(String.format(kmsPolicyTemplate, accountId, tenant, accountId))
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        tenantKmsKeys.put(tenant, kmsKey.id());

        // Create S3 bucket for tenant
        Bucket bucket = new Bucket(tenant + "-bucket-" + environmentSuffix,
            BucketArgs.builder()
                .bucket("multi-tenant-" + tenant + "-" + environmentSuffix.toLowerCase())
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        tenantBuckets.put(tenant, bucket.id());

        // Enable versioning
        new BucketVersioningV2(tenant + "-versioning-" + environmentSuffix,
            BucketVersioningV2Args.builder()
                .bucket(bucket.id())
                .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                    .status("Enabled")
                    .build())
                .build());

        // Block public access
        new BucketPublicAccessBlock(tenant + "-pab-" + environmentSuffix,
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Enable server-side encryption with KMS
        new BucketServerSideEncryptionConfigurationV2(tenant + "-encryption-" + environmentSuffix,
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
        String assumePolicyTemplate = "{"
            + "\"Version\":\"2012-10-17\","
            + "\"Statement\":[{\"Effect\":\"Allow\","
            + "\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},"
            + "\"Action\":\"sts:AssumeRole\"}]}";

        Role tenantRole = new Role(tenant + "-role-" + environmentSuffix,
            RoleArgs.builder()
                .name(tenant + "-access-role-" + environmentSuffix)
                .assumeRolePolicy(assumePolicyTemplate)
                .inlinePolicies(Output.all(bucket.arn(), kmsKey.arn()).applyValue(arns -> {
                    String inlinePolicyTemplate = "{"
                        + "\"Version\":\"2012-10-17\","
                        + "\"Statement\":[{\"Effect\":\"Allow\","
                        + "\"Action\":[\"s3:GetObject\",\"s3:PutObject\","
                        + "\"s3:DeleteObject\",\"s3:ListBucket\"],"
                        + "\"Resource\":[\"%s\",\"%s/*\"]},"
                        + "{\"Effect\":\"Allow\","
                        + "\"Action\":[\"kms:Decrypt\",\"kms:Encrypt\",\"kms:GenerateDataKey\"],"
                        + "\"Resource\":\"%s\"}]}";
                    return List.of(
                        com.pulumi.aws.iam.inputs.RoleInlinePolicyArgs.builder()
                            .name(tenant + "-bucket-access")
                            .policy(String.format(
                                inlinePolicyTemplate,
                                arns.get(0), arns.get(0), arns.get(1)
                            ))
                            .build()
                    );
                }))
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        // Create CloudWatch log group for tenant
        LogGroup logGroup = new LogGroup(tenant + "-logs-" + environmentSuffix,
            LogGroupArgs.builder()
                .name("/aws/s3/" + tenant + "-" + environmentSuffix)
                .retentionInDays(30)
                .tags(Map.of(
                    "Tenant", tenant,
                    "Environment", "production",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        // Create metric filter for tenant access patterns
        new LogMetricFilter(tenant + "-metric-filter-" + environmentSuffix,
            LogMetricFilterArgs.builder()
                .name(tenant + "-access-count-" + environmentSuffix)
                .logGroupName(logGroup.name())
                .pattern("[time, request_id, event_type, bucket, key, ...]")
                .metricTransformation(LogMetricFilterMetricTransformationArgs.builder()
                    .name(tenant + "AccessCount" + environmentSuffix)
                    .namespace("MultiTenant/S3")
                    .value("1")
                    .defaultValue("0")
                    .build())
                .build());

        // Create S3 Access Point
        AccessPoint accessPoint = new AccessPoint(tenant + "-access-point-" + environmentSuffix,
            AccessPointArgs.builder()
                .bucket(bucket.id())
                .name(tenant + "-ap-" + environmentSuffix.toLowerCase())
                .publicAccessBlockConfiguration(AccessPointPublicAccessBlockConfigurationArgs.builder()
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build())
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(bucket, tenantRole)
                .build());

        tenantAccessPoints.put(tenant, accessPoint.arn());
    }

    private void createConfigTable() {
        Table table = new Table("tenant-config-table-" + environmentSuffix,
            TableArgs.builder()
                .name("tenant-configuration-" + environmentSuffix)
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
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        this.configTableName = table.name();
    }

    private void createValidationLambda() {
        // Create Lambda execution role
        String lambdaAssumePolicy = "{"
            + "\"Version\":\"2012-10-17\","
            + "\"Statement\":[{\"Effect\":\"Allow\","
            + "\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},"
            + "\"Action\":\"sts:AssumeRole\"}]}";

        Role lambdaRole = new Role("validation-lambda-role-" + environmentSuffix,
            RoleArgs.builder()
                .name("cross-tenant-validation-role-" + environmentSuffix)
                .assumeRolePolicy(lambdaAssumePolicy)
                .tags(Map.of(
                    "Environment", "production",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build());

        String basicExecPolicyArn = "arn:aws:iam::aws:policy/"
            + "service-role/AWSLambdaBasicExecutionRole";
        new RolePolicyAttachment("lambda-basic-execution-" + environmentSuffix,
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn(basicExecPolicyArn)
                .build());

        // Create inline policy for reading from all tenant buckets
        Output<String> readPolicy = Output.all(
            tenantBuckets.values().stream().map(id -> id).toList()
        ).applyValue(bucketIds -> {
            StringBuilder resources = new StringBuilder();
            for (String bucketId : bucketIds) {
                if (resources.length() > 0) {
                    resources.append(",");
                }
                resources.append("\"arn:aws:s3:::").append(bucketId).append("/*\"");
            }
            String readPolicyTemplate = "{"
                + "\"Version\":\"2012-10-17\","
                + "\"Statement\":[{\"Effect\":\"Allow\","
                + "\"Action\":[\"s3:GetObject\",\"s3:ListBucket\"],"
                + "\"Resource\":[%s]}]}";
            return String.format(readPolicyTemplate, resources.toString());
        });

        // Lambda function code
        String lambdaCode = "import json\n"
            + "import boto3\n"
            + "\n"
            + "s3_client = boto3.client('s3')\n"
            + "\n"
            + "def handler(event, context):\n"
            + "    \"\"\"\n"
            + "    Cross-tenant data validation function.\n"
            + "    Reads from all tenant buckets but writes nowhere.\n"
            + "    \"\"\"\n"
            + "    validation_results = []\n"
            + "    \n"
            + "    # List of tenant buckets from environment\n"
            + "    tenant_buckets = event.get('tenant_buckets', [])\n"
            + "    \n"
            + "    for bucket in tenant_buckets:\n"
            + "        try:\n"
            + "            response = s3_client.list_objects_v2(\n"
            + "                Bucket=bucket,\n"
            + "                MaxKeys=10\n"
            + "            )\n"
            + "            \n"
            + "            object_count = response.get('KeyCount', 0)\n"
            + "            validation_results.append({\n"
            + "                'bucket': bucket,\n"
            + "                'status': 'valid',\n"
            + "                'object_count': object_count\n"
            + "            })\n"
            + "        except Exception as e:\n"
            + "            validation_results.append({\n"
            + "                'bucket': bucket,\n"
            + "                'status': 'error',\n"
            + "                'error': str(e)\n"
            + "            })\n"
            + "    \n"
            + "    return {\n"
            + "        'statusCode': 200,\n"
            + "        'body': json.dumps({\n"
            + "            'message': 'Validation complete',\n"
            + "            'results': validation_results\n"
            + "        })\n"
            + "    }\n";

        Function validationFunction = new Function("validation-lambda-" + environmentSuffix,
            FunctionArgs.builder()
                .name("cross-tenant-validation-" + environmentSuffix)
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
                        "REGION", "us-east-1",
                        "ENVIRONMENT_SUFFIX", environmentSuffix
                    ))
                    .build())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "validation",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(lambdaRole)
                .build());

        this.validationLambdaArn = validationFunction.arn();
    }

    private void createCloudTrail(final Bucket auditBucket) {
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

        Trail trail = new Trail("multi-tenant-trail-" + environmentSuffix,
            TrailArgs.builder()
                .name("multi-tenant-audit-trail-" + environmentSuffix)
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
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
                ))
                .build(),
            CustomResourceOptions.builder()
                .dependsOn(auditBucket)
                .build());

        this.cloudTrailName = trail.name();
    }

    private void createAccessGrantsInstance() {
        // Create S3 Access Grants instance for dynamic access control
        new BucketV2("access-grants-config-" + environmentSuffix,
            BucketV2Args.builder()
                .bucket("access-grants-config-" + environmentSuffix.toLowerCase())
                .tags(Map.of(
                    "Environment", "production",
                    "Purpose", "access-grants",
                    "ManagedBy", "pulumi",
                    "EnvironmentSuffix", environmentSuffix
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

package app.components;

import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.cloudtrail.*;
import com.pulumi.aws.cloudtrail.inputs.*;
import com.pulumi.aws.cloudwatch.*;
import com.pulumi.aws.cloudwatch.inputs.*;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.inputs.GetCallerIdentityArgs;
import com.pulumi.aws.outputs.GetCallerIdentityResult;
import com.pulumi.aws.s3.*;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;

import static app.components.IamComponent.buildResourceTags;

public class AuditingComponent extends ComponentResource {
    private final Trail cloudTrail;
    private final LogGroup cloudTrailLogGroup;
    private final Output<String> accountId;

    public AuditingComponent(String name, StorageComponent storage, String region) {
        this(name, storage, region, null);
    }

    public AuditingComponent(String name, StorageComponent storage, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:AuditingComponent", name, opts);

        var identity = AwsFunctions.getCallerIdentity(GetCallerIdentityArgs.builder().build());

        this.accountId = identity.applyValue(GetCallerIdentityResult::accountId);

        // Create CloudWatch Log Group for CloudTrail
        this.cloudTrailLogGroup = createCloudTrailLogGroup(name);

        // Configure CloudTrail bucket policy
        var bucketPolicy = configureBucketPolicy(name, storage);

        // Create CloudTrail with comprehensive logging (depends on bucket policy)
        this.cloudTrail = createCloudTrail(name, storage, region, bucketPolicy);

        // Create security monitoring
        createSecurityEventFilter(name);

        createSecurityEventAlarm(name);
    }

    private LogGroup createCloudTrailLogGroup(String name) {
        return new LogGroup(name + "-cloudtrail-logs", LogGroupArgs.builder()
                .name("/aws/cloudtrail/" + name)
                .retentionInDays(90)
                .tags(getTags(name + "-cloudtrail-logs", "LogGroup", Map.of("Purpose", "AuditLogs")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private BucketPolicy configureBucketPolicy(String name, StorageComponent storage) {
        return new BucketPolicy(name + "-cloudtrail-bucket-policy", BucketPolicyArgs.builder()
                .bucket(storage.getCloudTrailBucketName())
                .policy(Output.all(storage.getCloudTrailBucketName(), accountId)
                        .applyValue(values -> {
                            var bucketName = (String) values.get(0);
                            var account = (String) values.get(1);
                            return Either.ofLeft(createCloudTrailBucketPolicy(bucketName, account));
                        }))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private String createCloudTrailBucketPolicy(String bucketName, String accountId) {
        return """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:GetBucketAcl",
                        "Resource": "arn:aws:s3:::%s"
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": "arn:aws:s3:::%s/AWSLogs/%s/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    },
                    {
                        "Sid": "AWSCloudTrailDeliveryRolePolicy",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:GetBucketLocation",
                        "Resource": "arn:aws:s3:::%s"
                    }
                ]
            }
            """.formatted(bucketName, bucketName, accountId, bucketName);
    }

    private Trail createCloudTrail(String name, StorageComponent storage, String region, BucketPolicy bucketPolicy) {
        return new Trail(name + "-cloudtrail", TrailArgs.builder()
                .name(name + "-security-audit-trail")
                .s3BucketName(storage.getCloudTrailBucketName())
                .kmsKeyId(storage.getKmsKeyArn())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogging(true)
                .enableLogFileValidation(true)
                .advancedEventSelectors(
                        TrailAdvancedEventSelectorArgs.builder()
                                .name("Security-Critical Events")
                                .fieldSelectors(
                                        TrailAdvancedEventSelectorFieldSelectorArgs.builder()
                                                .field("eventCategory")
                                                .equals_("Management")
                                                .build()
                                ).build(),
                        TrailAdvancedEventSelectorArgs.builder()
                                .name("Security-Critical Events")
                                .fieldSelectors(
                                        TrailAdvancedEventSelectorFieldSelectorArgs.builder()
                                                .field("eventName")
                                                .equals_(List.of(
                                                        "CreateRole", "DeleteRole", "AttachRolePolicy", "DetachRolePolicy",
                                                        "CreateUser", "DeleteUser", "AttachUserPolicy", "DetachUserPolicy",
                                                        "CreatePolicy", "DeletePolicy", "CreateAccessKey", "DeleteAccessKey"
                                                ))
                                                .build()
                                ).build(),
                        TrailAdvancedEventSelectorArgs.builder()
                                .name("Root Account Usage")
                                .fieldSelectors(
                                        TrailAdvancedEventSelectorFieldSelectorArgs.builder()
                                                .field("userIdentity.arn")
                                                .equals_(List.of("arn:aws:iam::" + accountId + ":root"))
                                                .build()
                                )
                                .build()
                )
                .cloudWatchLogsGroupArn(Output.format("%s:*", cloudTrailLogGroup.arn()))
                .cloudWatchLogsRoleArn(createCloudTrailRole())
                .tags(getTags(name + "-cloudtrail", "CloudTrail", Map.of(
                        "Purpose", "SecurityAudit",
                        "Compliance", "Required"
                )))
                .build(), CustomResourceOptions.builder().parent(this).dependsOn(bucketPolicy).build());
    }

    private Output<String> createCloudTrailRole() {
        Role cloudTrailRole = new Role("cloudtrail-logs-role",
                RoleArgs.builder()
                        .name("CloudTrail-LogsRole")
                        .assumeRolePolicy("""
                            {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Principal": {
                                            "Service": "cloudtrail.amazonaws.com"
                                        },
                                        "Action": "sts:AssumeRole"
                                    }
                                ]
                            }
                    """)
                        .build(), CustomResourceOptions.builder().parent(this).build());

        Policy cloudTrailPolicy = new Policy("cloudtrail-logs-policy",
                PolicyArgs.builder()
                        .name("CloudTrail-LogsPolicy")
                        .policy(cloudTrailLogGroup.arn().applyValue(logGroupArn -> Either.ofLeft(String.format("""
                            {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "logs:CreateLogGroup",
                                            "logs:CreateLogStream",
                                            "logs:PutLogEvents"
                                        ],
                                        "Resource": "%s:*"
                                    }
                                ]
                            }
                            """, logGroupArn))))
                        .build(), CustomResourceOptions.builder().parent(this).build());

        new RolePolicyAttachment("cloudtrail-logs-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(cloudTrailRole.name())
                        .policyArn(cloudTrailPolicy.arn())
                        .build(), CustomResourceOptions.builder().parent(this).build());

        return cloudTrailRole.arn();
    }

    private void createSecurityEventFilter(String name) {
        new LogMetricFilter(name + "-security-events", LogMetricFilterArgs.builder()
                .name(name + "-security-events-filter")
                .logGroupName(cloudTrailLogGroup.name())
                .pattern("""
                    { ($.errorCode = "*UnauthorizedOperation") ||
                      ($.errorCode = "AccessDenied*") ||
                      ($.userIdentity.arn = "Root") ||
                      ($.eventName = "ConsoleLogin" && $.responseElements.ConsoleLogin = "Failure") ||
                      ($.eventName = "CreateUser") ||
                      ($.eventName = "DeleteUser") ||
                      ($.eventName = "CreateRole") ||
                      ($.eventName = "DeleteRole") ||
                      ($.eventName = "AttachRolePolicy") ||
                      ($.eventName = "DetachRolePolicy") }
                    """)
                .metricTransformation(LogMetricFilterMetricTransformationArgs.builder()
                        .name("SecurityEvents")
                        .namespace("SecureInfrastructure/Security")
                        .value("1")
                        .defaultValue("0")
                        .build())
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private void createSecurityEventAlarm(String name) {
        new MetricAlarm(name + "-security-alarm", MetricAlarmArgs.builder()
                .name(name + "-security-events-alarm")
                .alarmDescription("Alarm for security-related events in CloudTrail")
                .metricName("SecurityEvents")
                .namespace("SecureInfrastructure/Security")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .alarmActions()
                .tags(getTags(name + "-security-alarm", "CloudWatchAlarm", Map.of()))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        return buildResourceTags(name, resourceType, additional);
    }

    // Getters
    public Output<String> getCloudTrailArn() { return cloudTrail.arn(); }
}
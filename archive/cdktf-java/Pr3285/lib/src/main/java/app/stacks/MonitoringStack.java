package app.stacks;

import com.hashicorp.cdktf.providers.aws.api_gateway_account.ApiGatewayAccount;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.data_aws_caller_identity.DataAwsCallerIdentity;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals;
import com.hashicorp.cdktf.providers.aws.data_aws_region.DataAwsRegion;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKeyConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sqs_queue.SqsQueue;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class MonitoringStack {
    private final SnsTopic snsTopic;
    private final CloudwatchLogGroup lambdaLogGroup;
    private final CloudwatchLogGroup apiLogGroup;
    private final SqsQueue deadLetterQueue;
    private final KmsKey logsKmsKey;
    private final ApiGatewayAccount apiGatewayAccount;

    public MonitoringStack(final Construct scope, final String id) {

        DataAwsCallerIdentity current = new DataAwsCallerIdentity(scope, "current");
        DataAwsRegion currentRegion = new DataAwsRegion(scope, "current-region");

        // Use the non-deprecated region ID instead of name
        String currentRegionName = currentRegion.getId();

        // Create IAM role for API Gateway CloudWatch logging
        DataAwsIamPolicyDocument apiGatewayAssumeRole = DataAwsIamPolicyDocument.Builder.create(scope, id + "-api-gateway-assume-role")
                .statement(List.of(DataAwsIamPolicyDocumentStatement.builder()
                        .effect("Allow")
                        .principals(List.of(DataAwsIamPolicyDocumentStatementPrincipals.builder()
                                .type("Service")
                                .identifiers(List.of("apigateway.amazonaws.com"))
                                .build()))
                        .actions(List.of("sts:AssumeRole"))
                        .build()))
                .build();

        IamRole apiGatewayCloudwatchRole = IamRole.Builder.create(scope, id + "-api-gateway-cloudwatch-role")
                .name("api-gateway-cloudwatch-logs-role")
                .assumeRolePolicy(apiGatewayAssumeRole.getJson())
                .tags(Map.of("Name", "api-gateway-cloudwatch-role"))
                .build();

        IamRolePolicyAttachment.Builder.create(scope, id + "-api-gateway-cloudwatch-policy")
                .role(apiGatewayCloudwatchRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs")
                .build();

        // Set API Gateway account settings with CloudWatch Logs role
        this.apiGatewayAccount = ApiGatewayAccount.Builder.create(scope, id + "-api-gateway-account")
                .cloudwatchRoleArn(apiGatewayCloudwatchRole.getArn())
                .build();

        // Create KMS key for SNS
        KmsKey snsKmsKey = createSnsKmsKey(scope, id, current);

        // Create KMS key for CloudWatch Logs encryption
        this.logsKmsKey = createLogsKmsKey(scope, id, currentRegionName, current);

        // Create KMS alias for the logs key
        KmsAlias.Builder.create(scope, id + "-logs-kms-alias")
                .name("alias/serverless-logs-key")
                .targetKeyId(this.logsKmsKey.getKeyId())
                .build();

        // Create SNS topic for error notifications
        this.snsTopic = SnsTopic.Builder.create(scope, id + "-error-topic")
                .name("serverless-error-notifications")
                .kmsMasterKeyId(snsKmsKey.getId())
                .tags(Map.of("Name", "error-notifications"))
                .build();

        // Create SNS subscription (email)
        SnsTopicSubscription.Builder.create(scope, id + "-email-subscription")
                .topicArn(snsTopic.getArn())
                .protocol("email")
                .endpoint("ops-team@example.com")
                .build();

        // Create CloudWatch Log Groups with KMS encryption
        this.lambdaLogGroup = CloudwatchLogGroup.Builder.create(scope, id + "-lambda-logs")
                .name("/aws/lambda/serverless-processor")
                .retentionInDays(30)
                .kmsKeyId(this.logsKmsKey.getArn())
                .tags(Map.of("Name", "lambda-logs"))
                .build();

        this.apiLogGroup = CloudwatchLogGroup.Builder.create(scope, id + "-api-logs")
                .name("/aws/apigateway/serverless-api")
                .retentionInDays(30)
                .kmsKeyId(this.logsKmsKey.getArn())
                .tags(Map.of("Name", "api-logs"))
                .build();

        // Create Dead Letter Queue
        this.deadLetterQueue = SqsQueue.Builder.create(scope, id + "-dlq")
                .name("serverless-dlq")
                .messageRetentionSeconds(1209600) // 14 days
                .kmsMasterKeyId(snsKmsKey.getId())
                .tags(Map.of("Name", "dead-letter-queue"))
                .build();

        // Create CloudWatch Alarms
        CloudwatchMetricAlarm.Builder.create(scope, id + "-lambda-error-alarm")
                .alarmName("lambda-high-error-rate")
                .alarmDescription("Alert when Lambda error rate is high")
                .metricName("Errors")
                .namespace("AWS/Lambda")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(5.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "FunctionName", "serverless-processor"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "lambda-error-alarm"))
                .build();

        CloudwatchMetricAlarm.Builder.create(scope, id + "-lambda-throttle-alarm")
                .alarmName("lambda-throttles")
                .alarmDescription("Alert when Lambda is throttled")
                .metricName("Throttles")
                .namespace("AWS/Lambda")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(10.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "FunctionName", "serverless-processor"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "lambda-throttle-alarm"))
                .build();

        CloudwatchMetricAlarm.Builder.create(scope, id + "-api-4xx-alarm")
                .alarmName("api-high-4xx-rate")
                .alarmDescription("Alert when API has high 4xx error rate")
                .metricName("4XXError")
                .namespace("AWS/ApiGateway")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(2)
                .threshold(20.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "ApiName", "serverless-api"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "api-4xx-alarm"))
                .build();
    }

    private KmsKey createSnsKmsKey(final Construct scope, final String id, final DataAwsCallerIdentity current) {
        return KmsKey.Builder.create(scope, id + "-sns-kms-key")
                .description("KMS key for SNS topic encryption")
                .enableKeyRotation(true)
                .policy(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Sid": "Enable IAM User Permissions",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": "arn:aws:iam::%s:root"
                                },
                                "Action": "kms:*",
                                "Resource": "*"
                            },
                            {
                                "Sid": "Allow SNS to use the key",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "sns.amazonaws.com"
                                },
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                "Resource": "*"
                            }]
                        }
                        """, current.getAccountId()))
                .tags(Map.of("Name", "sns-encryption-key"))
                .build();

    }

    private KmsKey createLogsKmsKey(final Construct scope, final String id, final String currentRegionName,
                                    final DataAwsCallerIdentity current) {
        return new KmsKey(scope, id + "-logs-kms-key", KmsKeyConfig.builder()
                .description("KMS key for CloudWatch Logs encryption")
                .enableKeyRotation(true)
                .policy(String.format("""
                                {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Sid": "Enable IAM User Permissions",
                                            "Effect": "Allow",
                                            "Principal": {
                                                "AWS": "arn:aws:iam::%s:root"
                                            },
                                            "Action": "kms:*",
                                            "Resource": "*"
                                        },
                                        {
                                            "Sid": "Allow CloudWatch Logs Service",
                                            "Effect": "Allow",
                                            "Principal": {
                                                "Service": "logs.%s.amazonaws.com"
                                            },
                                            "Action": [
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                            ],
                                            "Resource": "*",
                                            "Condition": {
                                                "ArnEquals": {
                                                    "kms:EncryptionContext:aws:logs:arn": [
                                                        "arn:aws:logs:%s:%s:log-group:/aws/lambda/serverless-processor",
                                                        "arn:aws:logs:%s:%s:log-group:/aws/apigateway/serverless-api"
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                                """,
                        current.getAccountId(),
                        currentRegionName,
                        currentRegionName, current.getAccountId(),
                        currentRegionName, current.getAccountId()
                ))
                .tags(Map.of("Name", "logs-encryption-key"))
                .build());
    }

    // Getters
    public SnsTopic getSnsTopic() {
        return snsTopic;
    }

    public CloudwatchLogGroup getLambdaLogGroup() {
        return lambdaLogGroup;
    }

    public CloudwatchLogGroup getApiLogGroup() {
        return apiLogGroup;
    }

    public SqsQueue getDeadLetterQueue() {
        return deadLetterQueue;
    }

    public KmsKey getLogsKmsKey() {
        return logsKmsKey;
    }

    public ApiGatewayAccount getApiGatewayAccount() {
        return apiGatewayAccount;
    }
}

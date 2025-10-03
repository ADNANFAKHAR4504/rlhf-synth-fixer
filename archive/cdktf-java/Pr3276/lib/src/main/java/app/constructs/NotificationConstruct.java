package app.constructs;

import app.config.Config;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_rule.CloudwatchEventRule;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_rule.CloudwatchEventRuleConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_target.CloudwatchEventTarget;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_target.CloudwatchEventTargetConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopicConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscriptionConfig;
import software.constructs.Construct;

public class NotificationConstruct extends Construct {

    private final SnsTopic snsTopic;
    private final CloudwatchEventRule buildFailedRule;

    public NotificationConstruct(final Construct scope, final String id, final Config config) {
        super(scope, id);

        // Create SNS Topic
        this.snsTopic = new SnsTopic(this, "pipeline-notifications",
                SnsTopicConfig.builder()
                        .name(config.resourceName(config.projectName() + "-pipeline-notifications"))
                        .displayName("Pipeline Notifications")
                        .build());

        // Create SNS Subscription
        new SnsTopicSubscription(this, "email-subscription",
                SnsTopicSubscriptionConfig.builder()
                        .topicArn(snsTopic.getArn())
                        .protocol("email")
                        .endpoint(config.notificationEmail())
                        .build());

        // EventBridge Rule for CodeBuild Failed Builds
        this.buildFailedRule = new CloudwatchEventRule(this, "build-failed-rule",
                CloudwatchEventRuleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-build-failed"))
                        .description("Trigger notification when build fails")
                        .eventPattern("""
                                {
                                    "source": ["aws.codebuild"],
                                    "detail-type": ["CodeBuild Build State Change"],
                                    "detail": {
                                        "build-status": ["FAILED"],
                                        "project-name": [{
                                            "prefix": "%s"
                                        }]
                                    }
                                }
                                """.formatted(config.projectName()))
                        .build());

        new CloudwatchEventTarget(this, "build-failed-target",
                CloudwatchEventTargetConfig.builder()
                        .rule(buildFailedRule.getName())
                        .arn(snsTopic.getArn())
                        .targetId("SendToSNS")
                        .build());

        // EventBridge Rule for Pipeline State Changes
        CloudwatchEventRule pipelineStateRule = new CloudwatchEventRule(this, "pipeline-state-rule",
                CloudwatchEventRuleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-pipeline-state"))
                        .description("Trigger notification on pipeline state changes")
                        .eventPattern("""
                                {
                                    "source": ["aws.codepipeline"],
                                    "detail-type": ["CodePipeline Pipeline Execution State Change"],
                                    "detail": {
                                        "state": ["FAILED"],
                                        "pipeline": ["%s"]
                                    }
                                }
                                """.formatted(config.projectName() + "-pipeline"))
                        .build());

        new CloudwatchEventTarget(this, "pipeline-state-target",
                CloudwatchEventTargetConfig.builder()
                        .rule(pipelineStateRule.getName())
                        .arn(snsTopic.getArn())
                        .targetId("SendPipelineStateToSNS")
                        .build());

        // EventBridge Rule for Deployment Failures
        CloudwatchEventRule deploymentFailedRule = new CloudwatchEventRule(this, "deployment-failed-rule",
                CloudwatchEventRuleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-deployment-failed"))
                        .description("Trigger notification when deployment fails")
                        .eventPattern("""
                                {
                                    "source": ["aws.codedeploy"],
                                    "detail-type": ["CodeDeploy Deployment State-change Notification"],
                                    "detail": {
                                        "state": ["FAILURE"],
                                        "application-name": [{
                                            "prefix": "%s"
                                        }]
                                    }
                                }
                                """.formatted(config.projectName()))
                        .build());

        new CloudwatchEventTarget(this, "deployment-failed-target",
                CloudwatchEventTargetConfig.builder()
                        .rule(deploymentFailedRule.getName())
                        .arn(snsTopic.getArn())
                        .targetId("SendDeploymentFailureToSNS")
                        .build());
    }

    public SnsTopic getSnsTopic() {
        return snsTopic;
    }

    public CloudwatchEventRule getBuildFailedRule() {
        return buildFailedRule;
    }
}

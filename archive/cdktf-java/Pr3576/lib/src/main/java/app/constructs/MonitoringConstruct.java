package app.constructs;

import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.ssm_association.SsmAssociation;
import com.hashicorp.cdktf.providers.aws.ssm_association.SsmAssociationTargets;
import com.hashicorp.cdktf.providers.aws.ssm_document.SsmDocument;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class MonitoringConstruct extends Construct {

    private final SnsTopic alertTopic;

    private final CloudwatchMetricAlarm cpuAlarm;

    private final SsmDocument patchDocument;

    public MonitoringConstruct(final Construct scope, final String id, final SecurityConfig config, final String asgName,
                               final String instanceId) {
        super(scope, id);

        // Create SNS topic for alerts
        this.alertTopic = SnsTopic.Builder.create(this, "alert-topic")
                .name("infrastructure-alerts")
                .displayName("Infrastructure Alerts")
                .build();

        // Create email subscription (replace with actual email)
        SnsTopicSubscription.Builder.create(this, "alert-subscription")
                .topicArn(alertTopic.getArn())
                .protocol("email")
                .endpoint("admin@example.com")
                .build();

        // Create CPU utilization alarm
        this.cpuAlarm = CloudwatchMetricAlarm.Builder.create(this, "cpu-alarm")
                .alarmName("high-cpu-utilization")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(config.cpuAlarmEvaluationPeriods())
                .metricName("CPUUtilization")
                .namespace("AWS/EC2")
                .period(300) // 5 minutes
                .statistic("Average")
                .threshold((double) config.cpuAlarmThreshold())
                .alarmDescription("Trigger when CPU exceeds " + config.cpuAlarmThreshold() + "%")
                .alarmActions(List.of(alertTopic.getArn()))
                .dimensions(Map.of("AutoScalingGroupName", asgName))
                .treatMissingData("breaching")
                .build();

        // Create SSM document for patching
        this.patchDocument = createPatchDocument();

        // Create SSM association for patching
        SsmAssociation.Builder.create(this, "patch-association")
                .name(patchDocument.getName())
                .targets(List.of(SsmAssociationTargets.builder()
                        .key("tag:Environment")
                        .values(List.of("Production"))
                        .build()))
                .scheduleExpression("cron(0 2 ? * SUN *)")
                .complianceSeverity("HIGH")
                .build();
    }

    private SsmDocument createPatchDocument() {
        String documentContent = """
                {
                  "schemaVersion": "2.2",
                  "description": "Automated patching document",
                  "mainSteps": [
                    {
                      "action": "aws:runShellScript",
                      "name": "UpdateSystem",
                      "inputs": {
                        "timeoutSeconds": "3600",
                        "runCommand": [
                          "#!/bin/bash",
                          "echo 'Starting system update'",
                          "yum update -y",
                          "echo 'System update completed'",
                          "needs-restarting -r || reboot"
                        ]
                      }
                    }
                  ]
                }
                """;

        return SsmDocument.Builder.create(this, "patch-document")
                .name("automated-patching")
                .documentType("Command")
                .content(documentContent)
                .documentFormat("JSON")
                .tags(Map.of("Name", "Automated Patching Document"))
                .build();
    }

    // Additional alarms can be added here (RDS, ALB, etc.)
    public void addDatabaseAlarms(final String dbInstanceId) {
        CloudwatchMetricAlarm.Builder.create(this, "db-cpu-alarm")
                .alarmName("rds-high-cpu")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("CPUUtilization")
                .namespace("AWS/RDS")
                .period(300)
                .statistic("Average")
                .threshold(80.0)
                .alarmDescription("RDS CPU utilization is high")
                .alarmActions(List.of(alertTopic.getArn()))
                .dimensions(Map.of("DBInstanceIdentifier", dbInstanceId))
                .build();

        CloudwatchMetricAlarm.Builder.create(this, "db-storage-alarm")
                .alarmName("rds-low-storage")
                .comparisonOperator("LessThanThreshold")
                .evaluationPeriods(1)
                .metricName("FreeStorageSpace")
                .namespace("AWS/RDS")
                .period(300)
                .statistic("Average")
                .threshold(1073741824.0) // 1GB in bytes
                .alarmDescription("RDS free storage is low")
                .alarmActions(List.of(alertTopic.getArn()))
                .dimensions(Map.of("DBInstanceIdentifier", dbInstanceId))
                .build();
    }

    // Getters
    public SnsTopic getAlertTopic() {
        return alertTopic;
    }

    public CloudwatchMetricAlarm getCpuAlarm() {
        return cpuAlarm;
    }

    public SsmDocument getPatchDocument() {
        return patchDocument;
    }
}

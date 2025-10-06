**app/config/ComputeConfig.java**
```java
package app.config;

public record ComputeConfig(String instanceType, int minSize, int maxSize, int desiredCapacity, String amiId,
                            int healthCheckGracePeriod, String applicationName, String environmentName) {
    public static ComputeConfig defaultConfig() {
        return new ComputeConfig(
                "t3.medium",
                2,
                5,
                2,
                "ami-0c02fb55956c7d316", // Amazon Linux 2 in us-east-1
                300,
                "web-application",
                "production"
        );
    }
}
```

**app/config/DatabaseConfig.java**
```java
package app.config;

public record DatabaseConfig(String engine, String engineVersion, String instanceClass, int allocatedStorage,
                             String databaseName, String masterUsername, boolean multiAz, int backupRetentionPeriod,
                             String backupWindow, String maintenanceWindow) {
    public static DatabaseConfig defaultConfig() {
        return new DatabaseConfig(
                "mysql",
                "8.0",
                "db.t3.medium",
                20,
                "webappdb",
                "admin",
                true,
                7,
                "03:00-04:00",
                "sun:04:00-sun:05:00"
        );
    }
}
```

**app/config/NetworkConfig.java**
```java
package app.config;

import java.util.List;
import java.util.Map;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                             List<String> availabilityZones, Map<String, String> tags) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig(
                "10.0.0.0/16",
                List.of("10.0.10.0/24", "10.0.11.0/24"),
                List.of("10.0.20.0/24", "10.0.21.0/24"),
                List.of("us-east-1a", "us-east-1b"),
                Map.of(
                        "Environment", "Production",
                        "ManagedBy", "CDKTF"
                )
        );
    }
}
```

**app/config/SecurityConfig.java**
```java
package app.config;

import java.util.List;

public record SecurityConfig(List<String> allowedSshIpRanges, List<String> allowedHttpPorts, boolean enableFlowLogs,
                             int cpuAlarmThreshold, int cpuAlarmEvaluationPeriods, String sslCertificateArn) {
    public static SecurityConfig defaultConfig() {
        return new SecurityConfig(
                List.of("0.0.0.0/32"),
                List.of("80", "443"),
                true,
                70,
                1,
                "" // SSL certificate ARN
        );
    }
}
```

**app/constructs/ComputeConstruct.java**
```java
package app.constructs;

import app.config.ComputeConfig;
import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.alb.Alb;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListener;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionRedirect;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroup;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroup;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupLaunchTemplate;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupTag;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_application.ElasticBeanstalkApplication;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfileConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplate;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateConfig;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateIamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateMonitoring;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateTagSpecifications;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import software.constructs.Construct;

import java.util.Base64;
import java.util.List;
import java.util.Map;

public class ComputeConstruct extends Construct {

    private final Alb alb;

    private final AutoscalingGroup asg;

    private final SecurityGroup albSecurityGroup;

    private final SecurityGroup ec2SecurityGroup;

    private final ElasticBeanstalkApplication ebApp;

    private final ElasticBeanstalkEnvironment ebEnv;

    private final IamInstanceProfile instanceProfile;

    public ComputeConstruct(final Construct scope, final String id, final ComputeConfig config,
                            final SecurityConfig securityConfig, final String vpcId, final List<String> publicSubnetIds,
                            final List<String> privateSubnetIds) {
        super(scope, id);

        // Create security groups
        this.albSecurityGroup = createAlbSecurityGroup(vpcId);
        this.ec2SecurityGroup = createEc2SecurityGroup(vpcId, securityConfig);

        // Create IAM role for EC2 instances
        IamRole ec2Role = createEc2Role();

        this.instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile",
                IamInstanceProfileConfig.builder()
                        .name("ec2-instance-profile")
                        .role(ec2Role.getName())
                        .build());

        // Create ALB
        this.alb = Alb.Builder.create(this, "alb")
                .name("web-app-alb")
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(albSecurityGroup.getId()))
                .subnets(publicSubnetIds)
                .enableHttp2(true)
                .enableDeletionProtection(true)
                .tags(Map.of("Name", "Web App ALB"))
                .build();

        // Create Target Group
        AlbTargetGroup targetGroup = AlbTargetGroup.Builder.create(this, "target-group")
                .name("web-app-tg")
                .port(80)
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("instance")
                .healthCheck(AlbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .path("/health")
                        .interval(30)
                        .timeout(5)
                        .healthyThreshold(2)
                        .unhealthyThreshold(2)
                        .build())
                .deregistrationDelay("30")
                .build();

        // Create HTTP Listener (redirects to HTTPS)
        AlbListener.Builder.create(this, "alb-http-listener")
                .loadBalancerArn(alb.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("redirect")
                        .redirect(AlbListenerDefaultActionRedirect.builder()
                                .port("443")
                                .protocol("HTTPS")
                                .statusCode("HTTP_301")
                                .build())
                        .build()))
                .build();

        // Create HTTPS Listener
        AlbListener.Builder.create(this, "alb-https-listener")
                .loadBalancerArn(alb.getArn())
                .port(443)
                .protocol("HTTPS")
                .sslPolicy("ELBSecurityPolicy-TLS-1-2-2017-01")
                .certificateArn(securityConfig.sslCertificateArn())
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("forward")
                        .targetGroupArn(targetGroup.getArn())
                        .build()))
                .build();

        // Create Launch Template
        LaunchTemplate launchTemplate = new LaunchTemplate(this, "launch-template",
                LaunchTemplateConfig.builder()
                        .name("web-app-lt")
                        .imageId(config.amiId())
                        .instanceType(config.instanceType())
                        .vpcSecurityGroupIds(List.of(ec2SecurityGroup.getId()))
                        .iamInstanceProfile(LaunchTemplateIamInstanceProfile.builder()
                                .arn(instanceProfile.getArn())
                                .build())
                        .monitoring(LaunchTemplateMonitoring.builder()
                                .enabled(true)
                                .build())
                        .userData(getEc2UserData())
                        .tagSpecifications(List.of(
                                LaunchTemplateTagSpecifications.builder()
                                        .resourceType("instance")
                                        .tags(Map.of(
                                                "Name", "Web App Instance",
                                                "Environment", "Production"
                                        ))
                                        .build()
                        ))
                        .build());

        // Create Auto Scaling Group
        this.asg = AutoscalingGroup.Builder.create(this, "asg")
                .name("web-app-asg")
                .minSize(config.minSize())
                .maxSize(config.maxSize())
                .desiredCapacity(config.desiredCapacity())
                .vpcZoneIdentifier(privateSubnetIds)
                .targetGroupArns(List.of(targetGroup.getArn()))
                .healthCheckType("ELB")
                .healthCheckGracePeriod(config.healthCheckGracePeriod())
                .launchTemplate(AutoscalingGroupLaunchTemplate.builder()
                        .id(launchTemplate.getId())
                        .version("$Latest")
                        .build())
                .enabledMetrics(List.of("GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity",
                        "GroupInServiceInstances", "GroupTotalInstances"))
                .tag(List.of(
                        AutoscalingGroupTag.builder()
                                .key("Name")
                                .value("Web App ASG Instance")
                                .propagateAtLaunch(true)
                                .build()
                ))
                .build();

        // Setup Elastic Beanstalk
        this.ebApp = setupElasticBeanstalkApplication(config);

        // Setup Elastic Beanstalk Environment
        this.ebEnv = setupElasticBeanstalkEnvironment(config, vpcId, privateSubnetIds);
    }

    private SecurityGroup createAlbSecurityGroup(final String vpcId) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "alb-sg")
                .name("alb-security-group")
                .description("Security group for ALB")
                .vpcId(vpcId)
                .tags(Map.of("Name", "ALB Security Group"))
                .build();

        // Allow HTTP
        SecurityGroupRule.Builder.create(this, "alb-http-rule")
                .type("ingress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        // Allow HTTPS
        SecurityGroupRule.Builder.create(this, "alb-https-rule")
                .type("ingress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        return sg;
    }

    private SecurityGroup createEc2SecurityGroup(final String vpcId, final SecurityConfig securityConfig) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "ec2-sg")
                .name("ec2-security-group")
                .description("Security group for EC2 instances")
                .vpcId(vpcId)
                .tags(Map.of("Name", "EC2 Security Group"))
                .build();

        // Allow traffic from ALB
        SecurityGroupRule.Builder.create(this, "ec2-alb-rule")
                .type("ingress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .sourceSecurityGroupId(albSecurityGroup.getId())
                .securityGroupId(sg.getId())
                .build();

        // Allow SSH from specific IP ranges
        for (String ipRange : securityConfig.allowedSshIpRanges()) {
            SecurityGroupRule.Builder.create(this, "ec2-ssh-rule-" + ipRange
                            .replace(".", "-").replace("/", "-"))
                    .type("ingress")
                    .fromPort(22)
                    .toPort(22)
                    .protocol("tcp")
                    .cidrBlocks(List.of(ipRange))
                    .securityGroupId(sg.getId())
                    .build();
        }

        // Allow all outbound traffic
        SecurityGroupRule.Builder.create(this, "ec2-egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        return sg;
    }

    private IamRole createEc2Role() {
        String assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """;

        IamRole role = IamRole.Builder.create(this, "ec2-role")
                .name("ec2-instance-role")
                .assumeRolePolicy(assumeRolePolicy)
                .build();

        // Attach necessary managed policies
        IamRolePolicyAttachment.Builder.create(this, "ssm-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build();

        IamRolePolicyAttachment.Builder.create(this, "cloudwatch-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build();

        return role;
    }

    private String getEc2UserData() {
        String script = """
                #!/bin/bash
                yum update -y
                yum install -y amazon-cloudwatch-agent

                # Install web server
                yum install -y nginx
                systemctl start nginx
                systemctl enable nginx

                # Create health check endpoint
                echo "OK" > /usr/share/nginx/html/health
                """;
        return Base64.getEncoder().encodeToString(script.getBytes());
    }

    private ElasticBeanstalkApplication setupElasticBeanstalkApplication(final ComputeConfig config) {
        return ElasticBeanstalkApplication.Builder.create(this, "eb-app")
                .name(config.applicationName())
                .description("Web application deployed via Elastic Beanstalk")
                .build();
    }

    private ElasticBeanstalkEnvironment setupElasticBeanstalkEnvironment(final ComputeConfig config, final String vpcId,
                                                                         final List<String> subnetIds) {
        List<ElasticBeanstalkEnvironmentSetting> settings = List.of(
                // VPC settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:ec2:vpc")
                        .name("VPCId")
                        .value(vpcId)
                        .build(),
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:ec2:vpc")
                        .name("Subnets")
                        .value(String.join(",", subnetIds))
                        .build(),
                // IAM Instance Profile
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:launchconfiguration")
                        .name("IamInstanceProfile")
                        .value(instanceProfile.getName())
                        .build(),
                // Instance type settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:launchconfiguration")
                        .name("InstanceType")
                        .value(config.instanceType())
                        .build(),
                // Auto Scaling settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:asg")
                        .name("MinSize")
                        .value(String.valueOf(config.minSize()))
                        .build(),
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:asg")
                        .name("MaxSize")
                        .value(String.valueOf(config.maxSize()))
                        .build()
        );

        return ElasticBeanstalkEnvironment.Builder.create(this, "eb-env")
                .name(config.environmentName())
                .application(ebApp.getName())
                .solutionStackName("64bit Amazon Linux 2023 v4.7.2 running Python 3.11")
                .tier("WebServer")
                .setting(settings)
                .build();
    }

    // Getters
    public Alb getAlb() {
        return alb;
    }

    public AutoscalingGroup getAsg() {
        return asg;
    }

    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }

    public SecurityGroup getEc2SecurityGroup() {
        return ec2SecurityGroup;
    }

    public ElasticBeanstalkApplication getEbApp() {
        return ebApp;
    }

    public ElasticBeanstalkEnvironment getEbEnv() {
        return ebEnv;
    }
}
```

**app/constructs/DatabaseConstruct.java**
```java
package app.constructs;

import app.config.DatabaseConfig;
import com.hashicorp.cdktf.providers.aws.db_instance.DbInstance;
import com.hashicorp.cdktf.providers.aws.db_subnet_group.DbSubnetGroup;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.secretsmanager_secret.SecretsmanagerSecret;
import com.hashicorp.cdktf.providers.aws.secretsmanager_secret_version.SecretsmanagerSecretVersion;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import com.hashicorp.cdktf.providers.random_provider.password.Password;
import com.hashicorp.cdktf.providers.random_provider.password.PasswordConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class DatabaseConstruct extends Construct {

    private final DbInstance database;

    private final SecretsmanagerSecret dbSecret;

    private final KmsKey kmsKey;

    private final SecurityGroup dbSecurityGroup;

    public DatabaseConstruct(final Construct scope, final String id, final DatabaseConfig config, final String vpcId,
                             final List<String> subnetIds, final String appSecurityGroupId) {
        super(scope, id);

        // Create KMS key for encryption
        this.kmsKey = KmsKey.Builder.create(this, "db-kms-key")
                .description("KMS key for RDS encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "RDS Encryption Key"))
                .build();

        KmsAlias.Builder.create(this, "db-kms-alias")
                .name("alias/rds-encryption")
                .targetKeyId(kmsKey.getId())
                .build();

        // Create DB subnet group
        DbSubnetGroup dbSubnetGroup = DbSubnetGroup.Builder.create(this, "db-subnet-group")
                .name("web-app-db-subnet-group")
                .subnetIds(subnetIds)
                .tags(Map.of("Name", "Database Subnet Group"))
                .build();

        // Create security group for RDS
        this.dbSecurityGroup = createDbSecurityGroup(vpcId, appSecurityGroupId);

        Password dbPassword = new Password(this, "db-password",
                PasswordConfig.builder()
                        .length(32)
                        .special(true)
                        .overrideSpecial("!#$%&*()-_=+[]{}:?")
                        .build());

        this.dbSecret = SecretsmanagerSecret.Builder.create(this, "db-secret")
                .name("rds-credentials")
                .description("RDS database credentials")
                .kmsKeyId(kmsKey.getId())
                .build();

        SecretsmanagerSecretVersion.Builder.create(this, "db-secret-version")
                .secretId(dbSecret.getId())
                .secretString(dbPassword.getResult())
                .build();

        // Create RDS instance
        this.database = DbInstance.Builder.create(this, "database")
                .identifier("web-app-db")
                .engine(config.engine())
                .engineVersion(config.engineVersion())
                .instanceClass(config.instanceClass())
                .allocatedStorage(config.allocatedStorage())
                .storageType("gp3")
                .storageEncrypted(true)
                .kmsKeyId(kmsKey.getArn())
                .dbName(config.databaseName())
                .username(config.masterUsername())
                .password(dbPassword.getResult())
                .dbSubnetGroupName(dbSubnetGroup.getName())
                .vpcSecurityGroupIds(List.of(dbSecurityGroup.getId()))
                .multiAz(config.multiAz())
                .backupRetentionPeriod(config.backupRetentionPeriod())
                .backupWindow(config.backupWindow())
                .maintenanceWindow(config.maintenanceWindow())
                .autoMinorVersionUpgrade(true)
                .deletionProtection(true)
                .enabledCloudwatchLogsExports(List.of("error", "general", "slowquery"))
                .performanceInsightsEnabled(true)
                .performanceInsightsRetentionPeriod(7)
                .tags(Map.of(
                        "Name", "Web App Database",
                        "Environment", "Production"
                ))
                .build();
    }

    private SecurityGroup createDbSecurityGroup(final String vpcId, final String appSecurityGroupId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "db-sg")
                .name("rds-security-group")
                .description("Security group for RDS database")
                .vpcId(vpcId)
                .tags(Map.of("Name", "RDS Security Group"))
                .build();

        // Allow traffic from app security group
        SecurityGroupRule.Builder.create(this, "db-app-rule")
                .type("ingress")
                .fromPort(3306)
                .toPort(3306)
                .protocol("tcp")
                .sourceSecurityGroupId(appSecurityGroupId)
                .securityGroupId(securityGroup.getId())
                .build();

        return securityGroup;
    }

    // Getters
    public DbInstance getDatabase() {
        return database;
    }

    public SecretsmanagerSecret getDbSecret() {
        return dbSecret;
    }

    public KmsKey getKmsKey() {
        return kmsKey;
    }

    public SecurityGroup getDbSecurityGroup() {
        return dbSecurityGroup;
    }
}
```

**app/constructs/MonitoringConstruct.java**
```java
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
```

**app/constructs/NetworkConstruct.java**
```java
package app.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.flow_log.FlowLog;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import app.config.NetworkConfig;
import app.config.SecurityConfig;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NetworkConstruct extends Construct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    private final InternetGateway internetGateway;

    private final NatGateway natGateway;

    public NetworkConstruct(final Construct scope, final String id, final NetworkConfig config,
                            final SecurityConfig securityConfig) {
        super(scope, id);

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(config.vpcCidr())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(config.tags())
                .build();

        // Create Internet Gateway
        this.internetGateway = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(config.tags())
                .build();

        // Create Public Subnets
        this.publicSubnets = new ArrayList<>();
        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(merge(config.tags(), Map.of("Name", "Public Subnet " + (i + 1))))
                    .build();
            publicSubnets.add(subnet);
        }

        // Create Private Subnets
        this.privateSubnets = new ArrayList<>();
        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .tags(merge(config.tags(), Map.of("Name", "Private Subnet " + (i + 1))))
                    .build();
            privateSubnets.add(subnet);
        }

        // Create Elastic IP for NAT Gateway
        Eip natEip = Eip.Builder.create(this, "nat-eip")
                .domain("vpc")
                .tags(config.tags())
                .build();

        // Create NAT Gateway (in first public subnet)
        this.natGateway = NatGateway.Builder.create(this, "nat-gateway")
                .allocationId(natEip.getId())
                .subnetId(publicSubnets.get(0).getId())
                .tags(config.tags())
                .build();

        // Configure routing
        configureRouting(config);

        // Setup VPC Flow Logs if enabled
        if (securityConfig.enableFlowLogs()) {
            setupVpcFlowLogs(config);
        }
    }

    private void configureRouting(final NetworkConfig config) {
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(merge(config.tags(), Map.of("Name", "Public Route Table")))
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.getId())
                .build();

        // Associate all public subnets
        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .subnetId(publicSubnets.get(i).getId())
                    .routeTableId(publicRouteTable.getId())
                    .build();
        }

        // Private Route Table
        RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt")
                .vpcId(vpc.getId())
                .tags(merge(config.tags(), Map.of("Name", "Private Route Table")))
                .build();

        Route.Builder.create(this, "private-route")
                .routeTableId(privateRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getId())
                .build();

        // Associate all private subnets
        for (int i = 0; i < privateSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                    .subnetId(privateSubnets.get(i).getId())
                    .routeTableId(privateRouteTable.getId())
                    .build();
        }
    }

    private void setupVpcFlowLogs(final NetworkConfig config) {
        CloudwatchLogGroup logGroup = CloudwatchLogGroup.Builder.create(this, "vpc-flow-logs")
                .name("/aws/vpc/flowlogs")
                .retentionInDays(7)
                .tags(config.tags())
                .build();

        String flowLogPolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "vpc-flow-logs.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """;

        IamRole flowLogRole = IamRole.Builder.create(this, "flow-log-role")
                .name("vpc-flow-log-role")
                .assumeRolePolicy(flowLogPolicy)
                .build();

        String flowLogPolicyDocument = """
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
                            "Resource": "*"
                        }
                    ]
                }
                """;

        IamRolePolicy.Builder.create(this, "flow-log-policy")
                .role(flowLogRole.getId())
                .policy(flowLogPolicyDocument)
                .build();

        FlowLog.Builder.create(this, "vpc-flow-log")
                .vpcId(vpc.getId())
                .trafficType("ALL")
                .logDestinationType("cloud-watch-logs")
                .logDestination(logGroup.getArn())
                .iamRoleArn(flowLogRole.getArn())
                .tags(config.tags())
                .build();
    }

    private Map<String, String> merge(final Map<String, String> map1, final Map<String, String> map2) {
        Map<String, String> result = new HashMap<>(map1);
        result.putAll(map2);
        return result;
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public List<Subnet> getPublicSubnets() {
        return publicSubnets;
    }

    public List<Subnet> getPrivateSubnets() {
        return privateSubnets;
    }

    // For backward compatibility - returns first subnet
    public Subnet getPublicSubnet() {
        return publicSubnets.get(0);
    }

    public Subnet getPrivateSubnet() {
        return privateSubnets.get(0);
    }

    public InternetGateway getInternetGateway() {
        return internetGateway;
    }

    public NatGateway getNatGateway() {
        return natGateway;
    }
}
```

**app/constructs/StorageConstruct.java**
```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRule;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfiguration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class StorageConstruct extends Construct {

    private final S3Bucket assetsBucket;

    private final S3Bucket backupBucket;

    public StorageConstruct(final Construct scope, final String id, final String kmsKeyArn) {
        super(scope, id);

        // Create assets bucket
        this.assetsBucket = createS3Bucket("assets", "web-app-assets", kmsKeyArn);

        // Create backup bucket
        this.backupBucket = createS3Bucket("backup", "web-app-backups", kmsKeyArn);

        // Configure lifecycle policies
        configureLifecyclePolicy(assetsBucket.getId(), "assets");
        configureLifecyclePolicy(backupBucket.getId(), "backup");
    }

    private S3Bucket createS3Bucket(final String bucketId, final String bucketName, final String kmsKeyArn) {
        S3Bucket bucket = S3Bucket.Builder.create(this, bucketId + "-bucket".toLowerCase())
                .bucket(bucketName + "-" + System.currentTimeMillis())
                .tags(Map.of(
                        "Name", bucketName,
                        "Environment", "Production"
                ))
                .build();

        // Enable versioning
        S3BucketVersioningA.Builder.create(this, bucketId + "-versioning")
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build();

        // Enable encryption
        S3BucketServerSideEncryptionConfigurationA.Builder.create(this, bucketId + "-encryption")
                .bucket(bucket.getId())
                .rule(List.of(
                        S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(kmsKeyArn)
                                                .build())
                                .bucketKeyEnabled(true)
                                .build()
                ))
                .build();

        // Block public access
        S3BucketPublicAccessBlock.Builder.create(this, bucketId + "-public-access-block")
                .bucket(bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build();

        return bucket;
    }

    private void configureLifecyclePolicy(final String bucketId, final String bucketType) {
        S3BucketLifecycleConfigurationRule rule;

        if ("backup".equals(bucketType)) {
            rule = S3BucketLifecycleConfigurationRule.builder()
                    .id("backup-lifecycle")
                    .status("Enabled")
                    .filter(List.of(S3BucketLifecycleConfigurationRuleFilter.builder()
                            .prefix("")
                            .build()))
                    .transition(List.of(
                            S3BucketLifecycleConfigurationRuleTransition.builder()
                                    .days(30)
                                    .storageClass("STANDARD_IA")
                                    .build(),
                            S3BucketLifecycleConfigurationRuleTransition.builder()
                                    .days(90)
                                    .storageClass("GLACIER")
                                    .build()
                    ))
                    .expiration(List.of(S3BucketLifecycleConfigurationRuleExpiration.builder()
                            .days(365)
                            .build()))
                    .build();
        } else {
            rule = S3BucketLifecycleConfigurationRule.builder()
                    .id("assets-lifecycle")
                    .status("Enabled")
                    .filter(List.of(S3BucketLifecycleConfigurationRuleFilter.builder()
                            .prefix("")
                            .build()))
                    .transition(List.of(
                            S3BucketLifecycleConfigurationRuleTransition.builder()
                                    .days(60)
                                    .storageClass("STANDARD_IA")
                                    .build()
                    ))
                    .noncurrentVersionTransition(List.of(
                            S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition.builder()
                                    .noncurrentDays(30)
                                    .storageClass("STANDARD_IA")
                                    .build()
                    ))
                    .noncurrentVersionExpiration(List.of(
                            S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration.builder()
                                    .noncurrentDays(90)
                                    .build()))
                    .build();
        }

        S3BucketLifecycleConfiguration.Builder.create(this, bucketType + "-lifecycle")
                .bucket(bucketId)
                .rule(List.of(rule))
                .build();
    }

    // Getters
    public S3Bucket getAssetsBucket() {
        return assetsBucket;
    }

    public S3Bucket getBackupBucket() {
        return backupBucket;
    }
}
```

**app/Main.java**
```java
package app;

import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;

import com.hashicorp.cdktf.App;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        MainStack stack = new MainStack(app, "web-application-infrastructure");

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("prs/" + System.getenv("ENVIRONMENT_SUFFIX") + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv("TERRAFORM_STATE_BUCKET_REGION"))
                .encrypt(true)
                .build());

        app.synth();
    }
}
```

**app/MainStack.java**
```java
package app;

import app.config.ComputeConfig;
import app.config.DatabaseConfig;
import app.config.NetworkConfig;
import app.config.SecurityConfig;
import app.constructs.MonitoringConstruct;
import app.constructs.StorageConstruct;
import app.constructs.ComputeConstruct;
import app.constructs.DatabaseConstruct;
import app.constructs.NetworkConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificate;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificateConfig;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.random_provider.provider.RandomProvider;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKey;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKeyConfig;
import com.hashicorp.cdktf.providers.tls.provider.TlsProvider;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCert;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertSubject;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.List;
import java.util.Map;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * <p>
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {
    /**
     * Creates a new MainStack with basic AWS resources.
     *
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws")
                .region("us-east-1")
                .build();

        new TlsProvider(this, "tls");

        new RandomProvider(this, "random");

        AcmCertificate certificate = createSslCertificate();

        // Load configurations
        NetworkConfig networkConfig = NetworkConfig.defaultConfig();
        ComputeConfig computeConfig = ComputeConfig.defaultConfig();
        DatabaseConfig databaseConfig = DatabaseConfig.defaultConfig();

        SecurityConfig securityConfig = new SecurityConfig(List.of("0.0.0.0/32"), List.of("80", "443"), true, 70, 1,
                certificate.getArn());

        // Create Network Infrastructure
        NetworkConstruct network = new NetworkConstruct(this, "network", networkConfig, securityConfig);

        // Create Compute Infrastructure
        ComputeConstruct compute = new ComputeConstruct(this, "compute", computeConfig, securityConfig,
                network.getVpc().getId(), network.getPublicSubnets().stream().map(Subnet::getId).toList(),
                network.getPrivateSubnets().stream().map(Subnet::getId).toList());

        // Create Database Infrastructure
        DatabaseConstruct database = new DatabaseConstruct(this, "database", databaseConfig,
                network.getVpc().getId(), network.getPrivateSubnets().stream().map(Subnet::getId).toList(),
                compute.getEc2SecurityGroup().getId());

        // Create Storage Infrastructure
        StorageConstruct storage = new StorageConstruct(this, "storage", database.getKmsKey().getArn());

        // Create Monitoring Infrastructure
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", securityConfig,
                compute.getAsg().getName(), compute.getAsg().getId());

        // Add database alarms
        monitoring.addDatabaseAlarms(database.getDatabase().getId());

        // Outputs
        TerraformOutput.Builder.create(this, "alb-dns")
                .value(compute.getAlb().getDnsName())
                .description("ALB DNS name")
                .build();

        TerraformOutput.Builder.create(this, "alb-arn")
                .value(compute.getAlb().getArn())
                .description("ALB ARN")
                .build();

        TerraformOutput.Builder.create(this, "asg-name")
                .value(compute.getAsg().getName())
                .description("Auto Scaling Group name")
                .build();

        TerraformOutput.Builder.create(this, "vpc-id")
                .value(network.getVpc().getId())
                .description("VPC ID")
                .build();

        TerraformOutput.Builder.create(this, "public-subnet-id")
                .value(network.getPublicSubnet().getId())
                .description("Public subnet ID")
                .build();

        TerraformOutput.Builder.create(this, "private-subnet-id")
                .value(network.getPrivateSubnet().getId())
                .description("Private subnet ID")
                .build();

        TerraformOutput.Builder.create(this, "db-endpoint")
                .value(database.getDatabase().getEndpoint())
                .description("RDS endpoint")
                .sensitive(true)
                .build();

        TerraformOutput.Builder.create(this, "db-name")
                .value(database.getDatabase().getDbName())
                .description("RDS database name")
                .build();

        TerraformOutput.Builder.create(this, "db-id")
                .value(database.getDatabase().getId())
                .description("RDS instance ID")
                .build();

        TerraformOutput.Builder.create(this, "assets-bucket")
                .value(storage.getAssetsBucket().getBucket())
                .description("Assets S3 bucket name")
                .build();

        TerraformOutput.Builder.create(this, "kms-key-id")
                .value(database.getKmsKey().getKeyId())
                .description("KMS key ID")
                .build();

        TerraformOutput.Builder.create(this, "kms-key-arn")
                .value(database.getKmsKey().getArn())
                .description("KMS key ARN")
                .build();

        TerraformOutput.Builder.create(this, "sns-topic-arn")
                .value(monitoring.getAlertTopic().getArn())
                .description("SNS topic ARN for alarms")
                .build();
    }

    private AcmCertificate createSslCertificate() {

        // Generate private key
        PrivateKey privateKey = new PrivateKey(this, "ssl-cert-key",
                PrivateKeyConfig.builder()
                        .algorithm("RSA")
                        .rsaBits(2048)
                        .build());

        // Create self-signed certificate
        SelfSignedCert selfSignedCert = new SelfSignedCert(this, "ssl-self-signed",
                SelfSignedCertConfig.builder()
                        .privateKeyPem(privateKey.getPrivateKeyPem())
                        .validityPeriodHours(365 * 24)
                        .subject(List.of(
                                SelfSignedCertSubject.builder()
                                        .commonName("turing.com")
                                        .organization("My Organization")
                                        .country("US")
                                        .province("CA")
                                        .locality("San Francisco")
                                        .build()
                        ))
                        .dnsNames(List.of("turing.com", "*." + "turing.com"))
                        .allowedUses(List.of("key_encipherment", "data_encipherment", "server_auth"))
                        .build());

        // Import to ACM
        return new AcmCertificate(this, "acm-cert", AcmCertificateConfig.builder()
                .privateKey(privateKey.getPrivateKeyPem())
                .certificateBody(selfSignedCert.getCertPem())
                .tags(Map.of(
                        "Name", String.format("%s-%s-cert", "Web App Certificate", "Production"),
                        "Environment", "Production"
                ))
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}
```
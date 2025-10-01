package app.constructs;

import app.config.Config;
import com.hashicorp.cdktf.providers.aws.codedeploy_app.CodedeployApp;
import com.hashicorp.cdktf.providers.aws.codedeploy_app.CodedeployAppConfig;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroup;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroupConfig;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSetEc2TagFilter;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration;
import com.hashicorp.cdktf.providers.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;

public class CodeDeployConstruct extends Construct {
    private final CodedeployApp application;
    private final CodedeployDeploymentGroup stagingDeploymentGroup;
    private final CodedeployDeploymentGroup productionDeploymentGroup;

    public CodeDeployConstruct(final Construct scope, final String id, final Config config,
                               final String component, final IamRole serviceRole) {
        super(scope, id);

        // Create CodeDeploy Application
        this.application = new CodedeployApp(this, component + "-app",
                CodedeployAppConfig.builder()
                        .name(config.resourceName(config.projectName() + "-" + component))
                        .computePlatform("Server")
                        .build());

        // Create Staging Deployment Group
        this.stagingDeploymentGroup = new CodedeployDeploymentGroup(this,
                component + "-staging-deployment-group",
                CodedeployDeploymentGroupConfig.builder()
                        .appName(application.getName())
                        .deploymentGroupName(config.resourceName(component + "-staging"))
                        .serviceRoleArn(serviceRole.getArn())
                        .deploymentConfigName("CodeDeployDefault.OneAtATime")
                        .ec2TagSet(List.of(
                                CodedeployDeploymentGroupEc2TagSet.builder()
                                        .ec2TagFilter(Arrays.asList(
                                                CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                                        .type("KEY_AND_VALUE")
                                                        .key("Environment")
                                                        .value("Staging")
                                                        .build(),
                                                CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                                        .type("KEY_AND_VALUE")
                                                        .key("Component")
                                                        .value(component)
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .autoRollbackConfiguration(CodedeployDeploymentGroupAutoRollbackConfiguration.builder()
                                .enabled(true)
                                .events(Arrays.asList("DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"))
                                .build())
                        .deploymentStyle(CodedeployDeploymentGroupDeploymentStyle.builder()
                                .deploymentType("IN_PLACE")
                                .deploymentOption("WITHOUT_TRAFFIC_CONTROL")
                                .build())
                        .build());

        // Create Production Deployment Group
        this.productionDeploymentGroup = new CodedeployDeploymentGroup(this,
                component + "-production-deployment-group",
                CodedeployDeploymentGroupConfig.builder()
                        .appName(application.getName())
                        .deploymentGroupName(config.resourceName(component + "-production"))
                        .serviceRoleArn(serviceRole.getArn())
                        .deploymentConfigName("CodeDeployDefault.OneAtATime")
                        .ec2TagSet(List.of(
                                CodedeployDeploymentGroupEc2TagSet.builder()
                                        .ec2TagFilter(Arrays.asList(
                                                CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                                        .type("KEY_AND_VALUE")
                                                        .key("Environment")
                                                        .value("Production")
                                                        .build(),
                                                CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                                        .type("KEY_AND_VALUE")
                                                        .key("Component")
                                                        .value(component)
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .autoRollbackConfiguration(CodedeployDeploymentGroupAutoRollbackConfiguration.builder()
                                .enabled(true)
                                .events(Arrays.asList("DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"))
                                .build())
                        .deploymentStyle(CodedeployDeploymentGroupDeploymentStyle.builder()
                                .deploymentType("IN_PLACE")
                                .deploymentOption("WITHOUT_TRAFFIC_CONTROL")
                                .build())
                        .build());
    }

    public CodedeployApp getApplication() {
        return application;
    }

    public CodedeployDeploymentGroup getStagingDeploymentGroup() {
        return stagingDeploymentGroup;
    }

    public CodedeployDeploymentGroup getProductionDeploymentGroup() {
        return productionDeploymentGroup;
    }
}

package app;

import app.components.CrossAccountRoleSetup;
import app.components.IAMRoles;
import app.components.ObservabilityDashboard;
import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import app.config.DeploymentConfig;
import app.components.WebApplicationStackSet;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.resources.ComponentResourceOptions;

/**
 * Main class for Java Pulumi infrastructure as code.
 * <p>
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the Pulumi program.
     * <p>
     * This method defines the infrastructure resources to be created.
     * Pulumi will execute this code to determine what resources to create,
     * update, or delete based on the current state.
     *
     * @param args Command line arguments (not used in this example)
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * <p>
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {

        var config = new DeploymentConfig(ctx);

        // Create AWS Provider for management account
        var managementProvider = new Provider("management-provider", ProviderArgs.builder()
                .region(config.getManagementRegion())
                .build());

        // Create IAM roles for StackSet operations in management account
        var iamRoles = new IAMRoles("stackset-iam-roles", managementProvider);

        // Set up cross-account execution roles
        var crossAccountSetup = new CrossAccountRoleSetup("cross-account-setup",
                CrossAccountRoleSetup.CrossAccountRoleSetupArgs.builder()
                        .config(config)
                        .administrationRoleArn(iamRoles.getAdministrationRoleArn())
                        .build(), ComponentResourceOptions.Empty);

        // Create the web application StackSet (after cross-account setup)
        var webAppStackSet = new WebApplicationStackSet("web-app-stackset",
                WebApplicationStackSet.WebApplicationStackSetArgs.builder()
                        .config(config)
                        .administrationRoleArn(iamRoles.getAdministrationRoleArn())
                        .executionRoleName(iamRoles.getExecutionRoleName())
                        .crossAccountSetup(crossAccountSetup)
                        .build(),
                managementProvider);

        // Create observability dashboard
        var dashboard = new ObservabilityDashboard("web-app-dashboard",
                ObservabilityDashboard.ObservabilityDashboardArgs.builder()
                        .stackSetId(webAppStackSet.getStackSetId())
                        .regions(config.getTargetRegions())
                        .build(),
                managementProvider);

        // Export outputs
        ctx.export("stackSetId", webAppStackSet.getStackSetId());
        ctx.export("stackSetArn", webAppStackSet.getStackSetArn());
        ctx.export("administrationRoleArn", iamRoles.getAdministrationRoleArn());
        ctx.export("executionRoleName", iamRoles.getExecutionRoleName());
        ctx.export("dashboardUrl", dashboard.getDashboardUrl());

        // Export application endpoints for each region
        config.getTargetRegions().forEach(region -> {
            ctx.export("applicationEndpoint-" + region,
                    webAppStackSet.getApplicationEndpoint(region));
        });
    }
}
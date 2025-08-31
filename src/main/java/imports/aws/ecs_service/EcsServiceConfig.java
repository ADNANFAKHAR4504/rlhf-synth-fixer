package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceConfig")
@software.amazon.jsii.Jsii.Proxy(EcsServiceConfig.Jsii$Proxy.class)
public interface EcsServiceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#name EcsService#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * alarms block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#alarms EcsService#alarms}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceAlarms getAlarms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#availability_zone_rebalancing EcsService#availability_zone_rebalancing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneRebalancing() {
        return null;
    }

    /**
     * capacity_provider_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#capacity_provider_strategy EcsService#capacity_provider_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#cluster EcsService#cluster}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCluster() {
        return null;
    }

    /**
     * deployment_circuit_breaker block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_circuit_breaker EcsService#deployment_circuit_breaker}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker getDeploymentCircuitBreaker() {
        return null;
    }

    /**
     * deployment_controller block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_controller EcsService#deployment_controller}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceDeploymentController getDeploymentController() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_maximum_percent EcsService#deployment_maximum_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeploymentMaximumPercent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_minimum_healthy_percent EcsService#deployment_minimum_healthy_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeploymentMinimumHealthyPercent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#desired_count EcsService#desired_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_ecs_managed_tags EcsService#enable_ecs_managed_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableEcsManagedTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_execute_command EcsService#enable_execute_command}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableExecuteCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_delete EcsService#force_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_new_deployment EcsService#force_new_deployment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceNewDeployment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#health_check_grace_period_seconds EcsService#health_check_grace_period_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckGracePeriodSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#iam_role EcsService#iam_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#id EcsService#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#launch_type EcsService#launch_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchType() {
        return null;
    }

    /**
     * load_balancer block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#load_balancer EcsService#load_balancer}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLoadBalancer() {
        return null;
    }

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#network_configuration EcsService#network_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceNetworkConfiguration getNetworkConfiguration() {
        return null;
    }

    /**
     * ordered_placement_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#ordered_placement_strategy EcsService#ordered_placement_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOrderedPlacementStrategy() {
        return null;
    }

    /**
     * placement_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#placement_constraints EcsService#placement_constraints}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraints() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#platform_version EcsService#platform_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#propagate_tags EcsService#propagate_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPropagateTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#scheduling_strategy EcsService#scheduling_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchedulingStrategy() {
        return null;
    }

    /**
     * service_connect_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service_connect_configuration EcsService#service_connect_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfiguration getServiceConnectConfiguration() {
        return null;
    }

    /**
     * service_registries block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service_registries EcsService#service_registries}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceRegistries getServiceRegistries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tags EcsService#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tags_all EcsService#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#task_definition EcsService#task_definition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskDefinition() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#timeouts EcsService#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#triggers EcsService#triggers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTriggers() {
        return null;
    }

    /**
     * volume_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_configuration EcsService#volume_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfiguration getVolumeConfiguration() {
        return null;
    }

    /**
     * vpc_lattice_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#vpc_lattice_configurations EcsService#vpc_lattice_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpcLatticeConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#wait_for_steady_state EcsService#wait_for_steady_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitForSteadyState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceConfig> {
        java.lang.String name;
        imports.aws.ecs_service.EcsServiceAlarms alarms;
        java.lang.String availabilityZoneRebalancing;
        java.lang.Object capacityProviderStrategy;
        java.lang.String cluster;
        imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker deploymentCircuitBreaker;
        imports.aws.ecs_service.EcsServiceDeploymentController deploymentController;
        java.lang.Number deploymentMaximumPercent;
        java.lang.Number deploymentMinimumHealthyPercent;
        java.lang.Number desiredCount;
        java.lang.Object enableEcsManagedTags;
        java.lang.Object enableExecuteCommand;
        java.lang.Object forceDelete;
        java.lang.Object forceNewDeployment;
        java.lang.Number healthCheckGracePeriodSeconds;
        java.lang.String iamRole;
        java.lang.String id;
        java.lang.String launchType;
        java.lang.Object loadBalancer;
        imports.aws.ecs_service.EcsServiceNetworkConfiguration networkConfiguration;
        java.lang.Object orderedPlacementStrategy;
        java.lang.Object placementConstraints;
        java.lang.String platformVersion;
        java.lang.String propagateTags;
        java.lang.String schedulingStrategy;
        imports.aws.ecs_service.EcsServiceServiceConnectConfiguration serviceConnectConfiguration;
        imports.aws.ecs_service.EcsServiceServiceRegistries serviceRegistries;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String taskDefinition;
        imports.aws.ecs_service.EcsServiceTimeouts timeouts;
        java.util.Map<java.lang.String, java.lang.String> triggers;
        imports.aws.ecs_service.EcsServiceVolumeConfiguration volumeConfiguration;
        java.lang.Object vpcLatticeConfigurations;
        java.lang.Object waitForSteadyState;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EcsServiceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#name EcsService#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getAlarms}
         * @param alarms alarms block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#alarms EcsService#alarms}
         * @return {@code this}
         */
        public Builder alarms(imports.aws.ecs_service.EcsServiceAlarms alarms) {
            this.alarms = alarms;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getAvailabilityZoneRebalancing}
         * @param availabilityZoneRebalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#availability_zone_rebalancing EcsService#availability_zone_rebalancing}.
         * @return {@code this}
         */
        public Builder availabilityZoneRebalancing(java.lang.String availabilityZoneRebalancing) {
            this.availabilityZoneRebalancing = availabilityZoneRebalancing;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#capacity_provider_strategy EcsService#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(com.hashicorp.cdktf.IResolvable capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#capacity_provider_strategy EcsService#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(java.util.List<? extends imports.aws.ecs_service.EcsServiceCapacityProviderStrategy> capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getCluster}
         * @param cluster Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#cluster EcsService#cluster}.
         * @return {@code this}
         */
        public Builder cluster(java.lang.String cluster) {
            this.cluster = cluster;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDeploymentCircuitBreaker}
         * @param deploymentCircuitBreaker deployment_circuit_breaker block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_circuit_breaker EcsService#deployment_circuit_breaker}
         * @return {@code this}
         */
        public Builder deploymentCircuitBreaker(imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker deploymentCircuitBreaker) {
            this.deploymentCircuitBreaker = deploymentCircuitBreaker;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDeploymentController}
         * @param deploymentController deployment_controller block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_controller EcsService#deployment_controller}
         * @return {@code this}
         */
        public Builder deploymentController(imports.aws.ecs_service.EcsServiceDeploymentController deploymentController) {
            this.deploymentController = deploymentController;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDeploymentMaximumPercent}
         * @param deploymentMaximumPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_maximum_percent EcsService#deployment_maximum_percent}.
         * @return {@code this}
         */
        public Builder deploymentMaximumPercent(java.lang.Number deploymentMaximumPercent) {
            this.deploymentMaximumPercent = deploymentMaximumPercent;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDeploymentMinimumHealthyPercent}
         * @param deploymentMinimumHealthyPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#deployment_minimum_healthy_percent EcsService#deployment_minimum_healthy_percent}.
         * @return {@code this}
         */
        public Builder deploymentMinimumHealthyPercent(java.lang.Number deploymentMinimumHealthyPercent) {
            this.deploymentMinimumHealthyPercent = deploymentMinimumHealthyPercent;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDesiredCount}
         * @param desiredCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#desired_count EcsService#desired_count}.
         * @return {@code this}
         */
        public Builder desiredCount(java.lang.Number desiredCount) {
            this.desiredCount = desiredCount;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getEnableEcsManagedTags}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_ecs_managed_tags EcsService#enable_ecs_managed_tags}.
         * @return {@code this}
         */
        public Builder enableEcsManagedTags(java.lang.Boolean enableEcsManagedTags) {
            this.enableEcsManagedTags = enableEcsManagedTags;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getEnableEcsManagedTags}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_ecs_managed_tags EcsService#enable_ecs_managed_tags}.
         * @return {@code this}
         */
        public Builder enableEcsManagedTags(com.hashicorp.cdktf.IResolvable enableEcsManagedTags) {
            this.enableEcsManagedTags = enableEcsManagedTags;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getEnableExecuteCommand}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_execute_command EcsService#enable_execute_command}.
         * @return {@code this}
         */
        public Builder enableExecuteCommand(java.lang.Boolean enableExecuteCommand) {
            this.enableExecuteCommand = enableExecuteCommand;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getEnableExecuteCommand}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable_execute_command EcsService#enable_execute_command}.
         * @return {@code this}
         */
        public Builder enableExecuteCommand(com.hashicorp.cdktf.IResolvable enableExecuteCommand) {
            this.enableExecuteCommand = enableExecuteCommand;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_delete EcsService#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(java.lang.Boolean forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_delete EcsService#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(com.hashicorp.cdktf.IResolvable forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getForceNewDeployment}
         * @param forceNewDeployment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_new_deployment EcsService#force_new_deployment}.
         * @return {@code this}
         */
        public Builder forceNewDeployment(java.lang.Boolean forceNewDeployment) {
            this.forceNewDeployment = forceNewDeployment;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getForceNewDeployment}
         * @param forceNewDeployment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#force_new_deployment EcsService#force_new_deployment}.
         * @return {@code this}
         */
        public Builder forceNewDeployment(com.hashicorp.cdktf.IResolvable forceNewDeployment) {
            this.forceNewDeployment = forceNewDeployment;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getHealthCheckGracePeriodSeconds}
         * @param healthCheckGracePeriodSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#health_check_grace_period_seconds EcsService#health_check_grace_period_seconds}.
         * @return {@code this}
         */
        public Builder healthCheckGracePeriodSeconds(java.lang.Number healthCheckGracePeriodSeconds) {
            this.healthCheckGracePeriodSeconds = healthCheckGracePeriodSeconds;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getIamRole}
         * @param iamRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#iam_role EcsService#iam_role}.
         * @return {@code this}
         */
        public Builder iamRole(java.lang.String iamRole) {
            this.iamRole = iamRole;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#id EcsService#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getLaunchType}
         * @param launchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#launch_type EcsService#launch_type}.
         * @return {@code this}
         */
        public Builder launchType(java.lang.String launchType) {
            this.launchType = launchType;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getLoadBalancer}
         * @param loadBalancer load_balancer block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#load_balancer EcsService#load_balancer}
         * @return {@code this}
         */
        public Builder loadBalancer(com.hashicorp.cdktf.IResolvable loadBalancer) {
            this.loadBalancer = loadBalancer;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getLoadBalancer}
         * @param loadBalancer load_balancer block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#load_balancer EcsService#load_balancer}
         * @return {@code this}
         */
        public Builder loadBalancer(java.util.List<? extends imports.aws.ecs_service.EcsServiceLoadBalancer> loadBalancer) {
            this.loadBalancer = loadBalancer;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#network_configuration EcsService#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.ecs_service.EcsServiceNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getOrderedPlacementStrategy}
         * @param orderedPlacementStrategy ordered_placement_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#ordered_placement_strategy EcsService#ordered_placement_strategy}
         * @return {@code this}
         */
        public Builder orderedPlacementStrategy(com.hashicorp.cdktf.IResolvable orderedPlacementStrategy) {
            this.orderedPlacementStrategy = orderedPlacementStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getOrderedPlacementStrategy}
         * @param orderedPlacementStrategy ordered_placement_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#ordered_placement_strategy EcsService#ordered_placement_strategy}
         * @return {@code this}
         */
        public Builder orderedPlacementStrategy(java.util.List<? extends imports.aws.ecs_service.EcsServiceOrderedPlacementStrategy> orderedPlacementStrategy) {
            this.orderedPlacementStrategy = orderedPlacementStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#placement_constraints EcsService#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(com.hashicorp.cdktf.IResolvable placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#placement_constraints EcsService#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(java.util.List<? extends imports.aws.ecs_service.EcsServicePlacementConstraints> placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getPlatformVersion}
         * @param platformVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#platform_version EcsService#platform_version}.
         * @return {@code this}
         */
        public Builder platformVersion(java.lang.String platformVersion) {
            this.platformVersion = platformVersion;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getPropagateTags}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#propagate_tags EcsService#propagate_tags}.
         * @return {@code this}
         */
        public Builder propagateTags(java.lang.String propagateTags) {
            this.propagateTags = propagateTags;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getSchedulingStrategy}
         * @param schedulingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#scheduling_strategy EcsService#scheduling_strategy}.
         * @return {@code this}
         */
        public Builder schedulingStrategy(java.lang.String schedulingStrategy) {
            this.schedulingStrategy = schedulingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getServiceConnectConfiguration}
         * @param serviceConnectConfiguration service_connect_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service_connect_configuration EcsService#service_connect_configuration}
         * @return {@code this}
         */
        public Builder serviceConnectConfiguration(imports.aws.ecs_service.EcsServiceServiceConnectConfiguration serviceConnectConfiguration) {
            this.serviceConnectConfiguration = serviceConnectConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getServiceRegistries}
         * @param serviceRegistries service_registries block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service_registries EcsService#service_registries}
         * @return {@code this}
         */
        public Builder serviceRegistries(imports.aws.ecs_service.EcsServiceServiceRegistries serviceRegistries) {
            this.serviceRegistries = serviceRegistries;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tags EcsService#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tags_all EcsService#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getTaskDefinition}
         * @param taskDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#task_definition EcsService#task_definition}.
         * @return {@code this}
         */
        public Builder taskDefinition(java.lang.String taskDefinition) {
            this.taskDefinition = taskDefinition;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#timeouts EcsService#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ecs_service.EcsServiceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getTriggers}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#triggers EcsService#triggers}.
         * @return {@code this}
         */
        public Builder triggers(java.util.Map<java.lang.String, java.lang.String> triggers) {
            this.triggers = triggers;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getVolumeConfiguration}
         * @param volumeConfiguration volume_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_configuration EcsService#volume_configuration}
         * @return {@code this}
         */
        public Builder volumeConfiguration(imports.aws.ecs_service.EcsServiceVolumeConfiguration volumeConfiguration) {
            this.volumeConfiguration = volumeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getVpcLatticeConfigurations}
         * @param vpcLatticeConfigurations vpc_lattice_configurations block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#vpc_lattice_configurations EcsService#vpc_lattice_configurations}
         * @return {@code this}
         */
        public Builder vpcLatticeConfigurations(com.hashicorp.cdktf.IResolvable vpcLatticeConfigurations) {
            this.vpcLatticeConfigurations = vpcLatticeConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getVpcLatticeConfigurations}
         * @param vpcLatticeConfigurations vpc_lattice_configurations block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#vpc_lattice_configurations EcsService#vpc_lattice_configurations}
         * @return {@code this}
         */
        public Builder vpcLatticeConfigurations(java.util.List<? extends imports.aws.ecs_service.EcsServiceVpcLatticeConfigurations> vpcLatticeConfigurations) {
            this.vpcLatticeConfigurations = vpcLatticeConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getWaitForSteadyState}
         * @param waitForSteadyState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#wait_for_steady_state EcsService#wait_for_steady_state}.
         * @return {@code this}
         */
        public Builder waitForSteadyState(java.lang.Boolean waitForSteadyState) {
            this.waitForSteadyState = waitForSteadyState;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getWaitForSteadyState}
         * @param waitForSteadyState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#wait_for_steady_state EcsService#wait_for_steady_state}.
         * @return {@code this}
         */
        public Builder waitForSteadyState(com.hashicorp.cdktf.IResolvable waitForSteadyState) {
            this.waitForSteadyState = waitForSteadyState;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceConfig {
        private final java.lang.String name;
        private final imports.aws.ecs_service.EcsServiceAlarms alarms;
        private final java.lang.String availabilityZoneRebalancing;
        private final java.lang.Object capacityProviderStrategy;
        private final java.lang.String cluster;
        private final imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker deploymentCircuitBreaker;
        private final imports.aws.ecs_service.EcsServiceDeploymentController deploymentController;
        private final java.lang.Number deploymentMaximumPercent;
        private final java.lang.Number deploymentMinimumHealthyPercent;
        private final java.lang.Number desiredCount;
        private final java.lang.Object enableEcsManagedTags;
        private final java.lang.Object enableExecuteCommand;
        private final java.lang.Object forceDelete;
        private final java.lang.Object forceNewDeployment;
        private final java.lang.Number healthCheckGracePeriodSeconds;
        private final java.lang.String iamRole;
        private final java.lang.String id;
        private final java.lang.String launchType;
        private final java.lang.Object loadBalancer;
        private final imports.aws.ecs_service.EcsServiceNetworkConfiguration networkConfiguration;
        private final java.lang.Object orderedPlacementStrategy;
        private final java.lang.Object placementConstraints;
        private final java.lang.String platformVersion;
        private final java.lang.String propagateTags;
        private final java.lang.String schedulingStrategy;
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfiguration serviceConnectConfiguration;
        private final imports.aws.ecs_service.EcsServiceServiceRegistries serviceRegistries;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String taskDefinition;
        private final imports.aws.ecs_service.EcsServiceTimeouts timeouts;
        private final java.util.Map<java.lang.String, java.lang.String> triggers;
        private final imports.aws.ecs_service.EcsServiceVolumeConfiguration volumeConfiguration;
        private final java.lang.Object vpcLatticeConfigurations;
        private final java.lang.Object waitForSteadyState;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alarms = software.amazon.jsii.Kernel.get(this, "alarms", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceAlarms.class));
            this.availabilityZoneRebalancing = software.amazon.jsii.Kernel.get(this, "availabilityZoneRebalancing", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityProviderStrategy = software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cluster = software.amazon.jsii.Kernel.get(this, "cluster", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentCircuitBreaker = software.amazon.jsii.Kernel.get(this, "deploymentCircuitBreaker", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker.class));
            this.deploymentController = software.amazon.jsii.Kernel.get(this, "deploymentController", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceDeploymentController.class));
            this.deploymentMaximumPercent = software.amazon.jsii.Kernel.get(this, "deploymentMaximumPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.deploymentMinimumHealthyPercent = software.amazon.jsii.Kernel.get(this, "deploymentMinimumHealthyPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredCount = software.amazon.jsii.Kernel.get(this, "desiredCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enableEcsManagedTags = software.amazon.jsii.Kernel.get(this, "enableEcsManagedTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableExecuteCommand = software.amazon.jsii.Kernel.get(this, "enableExecuteCommand", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceDelete = software.amazon.jsii.Kernel.get(this, "forceDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceNewDeployment = software.amazon.jsii.Kernel.get(this, "forceNewDeployment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheckGracePeriodSeconds = software.amazon.jsii.Kernel.get(this, "healthCheckGracePeriodSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.iamRole = software.amazon.jsii.Kernel.get(this, "iamRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchType = software.amazon.jsii.Kernel.get(this, "launchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancer = software.amazon.jsii.Kernel.get(this, "loadBalancer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceNetworkConfiguration.class));
            this.orderedPlacementStrategy = software.amazon.jsii.Kernel.get(this, "orderedPlacementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.placementConstraints = software.amazon.jsii.Kernel.get(this, "placementConstraints", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.platformVersion = software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.propagateTags = software.amazon.jsii.Kernel.get(this, "propagateTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schedulingStrategy = software.amazon.jsii.Kernel.get(this, "schedulingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceConnectConfiguration = software.amazon.jsii.Kernel.get(this, "serviceConnectConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfiguration.class));
            this.serviceRegistries = software.amazon.jsii.Kernel.get(this, "serviceRegistries", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceRegistries.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taskDefinition = software.amazon.jsii.Kernel.get(this, "taskDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceTimeouts.class));
            this.triggers = software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.volumeConfiguration = software.amazon.jsii.Kernel.get(this, "volumeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfiguration.class));
            this.vpcLatticeConfigurations = software.amazon.jsii.Kernel.get(this, "vpcLatticeConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.waitForSteadyState = software.amazon.jsii.Kernel.get(this, "waitForSteadyState", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.alarms = builder.alarms;
            this.availabilityZoneRebalancing = builder.availabilityZoneRebalancing;
            this.capacityProviderStrategy = builder.capacityProviderStrategy;
            this.cluster = builder.cluster;
            this.deploymentCircuitBreaker = builder.deploymentCircuitBreaker;
            this.deploymentController = builder.deploymentController;
            this.deploymentMaximumPercent = builder.deploymentMaximumPercent;
            this.deploymentMinimumHealthyPercent = builder.deploymentMinimumHealthyPercent;
            this.desiredCount = builder.desiredCount;
            this.enableEcsManagedTags = builder.enableEcsManagedTags;
            this.enableExecuteCommand = builder.enableExecuteCommand;
            this.forceDelete = builder.forceDelete;
            this.forceNewDeployment = builder.forceNewDeployment;
            this.healthCheckGracePeriodSeconds = builder.healthCheckGracePeriodSeconds;
            this.iamRole = builder.iamRole;
            this.id = builder.id;
            this.launchType = builder.launchType;
            this.loadBalancer = builder.loadBalancer;
            this.networkConfiguration = builder.networkConfiguration;
            this.orderedPlacementStrategy = builder.orderedPlacementStrategy;
            this.placementConstraints = builder.placementConstraints;
            this.platformVersion = builder.platformVersion;
            this.propagateTags = builder.propagateTags;
            this.schedulingStrategy = builder.schedulingStrategy;
            this.serviceConnectConfiguration = builder.serviceConnectConfiguration;
            this.serviceRegistries = builder.serviceRegistries;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.taskDefinition = builder.taskDefinition;
            this.timeouts = builder.timeouts;
            this.triggers = builder.triggers;
            this.volumeConfiguration = builder.volumeConfiguration;
            this.vpcLatticeConfigurations = builder.vpcLatticeConfigurations;
            this.waitForSteadyState = builder.waitForSteadyState;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceAlarms getAlarms() {
            return this.alarms;
        }

        @Override
        public final java.lang.String getAvailabilityZoneRebalancing() {
            return this.availabilityZoneRebalancing;
        }

        @Override
        public final java.lang.Object getCapacityProviderStrategy() {
            return this.capacityProviderStrategy;
        }

        @Override
        public final java.lang.String getCluster() {
            return this.cluster;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker getDeploymentCircuitBreaker() {
            return this.deploymentCircuitBreaker;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceDeploymentController getDeploymentController() {
            return this.deploymentController;
        }

        @Override
        public final java.lang.Number getDeploymentMaximumPercent() {
            return this.deploymentMaximumPercent;
        }

        @Override
        public final java.lang.Number getDeploymentMinimumHealthyPercent() {
            return this.deploymentMinimumHealthyPercent;
        }

        @Override
        public final java.lang.Number getDesiredCount() {
            return this.desiredCount;
        }

        @Override
        public final java.lang.Object getEnableEcsManagedTags() {
            return this.enableEcsManagedTags;
        }

        @Override
        public final java.lang.Object getEnableExecuteCommand() {
            return this.enableExecuteCommand;
        }

        @Override
        public final java.lang.Object getForceDelete() {
            return this.forceDelete;
        }

        @Override
        public final java.lang.Object getForceNewDeployment() {
            return this.forceNewDeployment;
        }

        @Override
        public final java.lang.Number getHealthCheckGracePeriodSeconds() {
            return this.healthCheckGracePeriodSeconds;
        }

        @Override
        public final java.lang.String getIamRole() {
            return this.iamRole;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLaunchType() {
            return this.launchType;
        }

        @Override
        public final java.lang.Object getLoadBalancer() {
            return this.loadBalancer;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
        }

        @Override
        public final java.lang.Object getOrderedPlacementStrategy() {
            return this.orderedPlacementStrategy;
        }

        @Override
        public final java.lang.Object getPlacementConstraints() {
            return this.placementConstraints;
        }

        @Override
        public final java.lang.String getPlatformVersion() {
            return this.platformVersion;
        }

        @Override
        public final java.lang.String getPropagateTags() {
            return this.propagateTags;
        }

        @Override
        public final java.lang.String getSchedulingStrategy() {
            return this.schedulingStrategy;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfiguration getServiceConnectConfiguration() {
            return this.serviceConnectConfiguration;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceRegistries getServiceRegistries() {
            return this.serviceRegistries;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.String getTaskDefinition() {
            return this.taskDefinition;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTriggers() {
            return this.triggers;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceVolumeConfiguration getVolumeConfiguration() {
            return this.volumeConfiguration;
        }

        @Override
        public final java.lang.Object getVpcLatticeConfigurations() {
            return this.vpcLatticeConfigurations;
        }

        @Override
        public final java.lang.Object getWaitForSteadyState() {
            return this.waitForSteadyState;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAlarms() != null) {
                data.set("alarms", om.valueToTree(this.getAlarms()));
            }
            if (this.getAvailabilityZoneRebalancing() != null) {
                data.set("availabilityZoneRebalancing", om.valueToTree(this.getAvailabilityZoneRebalancing()));
            }
            if (this.getCapacityProviderStrategy() != null) {
                data.set("capacityProviderStrategy", om.valueToTree(this.getCapacityProviderStrategy()));
            }
            if (this.getCluster() != null) {
                data.set("cluster", om.valueToTree(this.getCluster()));
            }
            if (this.getDeploymentCircuitBreaker() != null) {
                data.set("deploymentCircuitBreaker", om.valueToTree(this.getDeploymentCircuitBreaker()));
            }
            if (this.getDeploymentController() != null) {
                data.set("deploymentController", om.valueToTree(this.getDeploymentController()));
            }
            if (this.getDeploymentMaximumPercent() != null) {
                data.set("deploymentMaximumPercent", om.valueToTree(this.getDeploymentMaximumPercent()));
            }
            if (this.getDeploymentMinimumHealthyPercent() != null) {
                data.set("deploymentMinimumHealthyPercent", om.valueToTree(this.getDeploymentMinimumHealthyPercent()));
            }
            if (this.getDesiredCount() != null) {
                data.set("desiredCount", om.valueToTree(this.getDesiredCount()));
            }
            if (this.getEnableEcsManagedTags() != null) {
                data.set("enableEcsManagedTags", om.valueToTree(this.getEnableEcsManagedTags()));
            }
            if (this.getEnableExecuteCommand() != null) {
                data.set("enableExecuteCommand", om.valueToTree(this.getEnableExecuteCommand()));
            }
            if (this.getForceDelete() != null) {
                data.set("forceDelete", om.valueToTree(this.getForceDelete()));
            }
            if (this.getForceNewDeployment() != null) {
                data.set("forceNewDeployment", om.valueToTree(this.getForceNewDeployment()));
            }
            if (this.getHealthCheckGracePeriodSeconds() != null) {
                data.set("healthCheckGracePeriodSeconds", om.valueToTree(this.getHealthCheckGracePeriodSeconds()));
            }
            if (this.getIamRole() != null) {
                data.set("iamRole", om.valueToTree(this.getIamRole()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLaunchType() != null) {
                data.set("launchType", om.valueToTree(this.getLaunchType()));
            }
            if (this.getLoadBalancer() != null) {
                data.set("loadBalancer", om.valueToTree(this.getLoadBalancer()));
            }
            if (this.getNetworkConfiguration() != null) {
                data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
            }
            if (this.getOrderedPlacementStrategy() != null) {
                data.set("orderedPlacementStrategy", om.valueToTree(this.getOrderedPlacementStrategy()));
            }
            if (this.getPlacementConstraints() != null) {
                data.set("placementConstraints", om.valueToTree(this.getPlacementConstraints()));
            }
            if (this.getPlatformVersion() != null) {
                data.set("platformVersion", om.valueToTree(this.getPlatformVersion()));
            }
            if (this.getPropagateTags() != null) {
                data.set("propagateTags", om.valueToTree(this.getPropagateTags()));
            }
            if (this.getSchedulingStrategy() != null) {
                data.set("schedulingStrategy", om.valueToTree(this.getSchedulingStrategy()));
            }
            if (this.getServiceConnectConfiguration() != null) {
                data.set("serviceConnectConfiguration", om.valueToTree(this.getServiceConnectConfiguration()));
            }
            if (this.getServiceRegistries() != null) {
                data.set("serviceRegistries", om.valueToTree(this.getServiceRegistries()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTaskDefinition() != null) {
                data.set("taskDefinition", om.valueToTree(this.getTaskDefinition()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTriggers() != null) {
                data.set("triggers", om.valueToTree(this.getTriggers()));
            }
            if (this.getVolumeConfiguration() != null) {
                data.set("volumeConfiguration", om.valueToTree(this.getVolumeConfiguration()));
            }
            if (this.getVpcLatticeConfigurations() != null) {
                data.set("vpcLatticeConfigurations", om.valueToTree(this.getVpcLatticeConfigurations()));
            }
            if (this.getWaitForSteadyState() != null) {
                data.set("waitForSteadyState", om.valueToTree(this.getWaitForSteadyState()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceConfig.Jsii$Proxy that = (EcsServiceConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.alarms != null ? !this.alarms.equals(that.alarms) : that.alarms != null) return false;
            if (this.availabilityZoneRebalancing != null ? !this.availabilityZoneRebalancing.equals(that.availabilityZoneRebalancing) : that.availabilityZoneRebalancing != null) return false;
            if (this.capacityProviderStrategy != null ? !this.capacityProviderStrategy.equals(that.capacityProviderStrategy) : that.capacityProviderStrategy != null) return false;
            if (this.cluster != null ? !this.cluster.equals(that.cluster) : that.cluster != null) return false;
            if (this.deploymentCircuitBreaker != null ? !this.deploymentCircuitBreaker.equals(that.deploymentCircuitBreaker) : that.deploymentCircuitBreaker != null) return false;
            if (this.deploymentController != null ? !this.deploymentController.equals(that.deploymentController) : that.deploymentController != null) return false;
            if (this.deploymentMaximumPercent != null ? !this.deploymentMaximumPercent.equals(that.deploymentMaximumPercent) : that.deploymentMaximumPercent != null) return false;
            if (this.deploymentMinimumHealthyPercent != null ? !this.deploymentMinimumHealthyPercent.equals(that.deploymentMinimumHealthyPercent) : that.deploymentMinimumHealthyPercent != null) return false;
            if (this.desiredCount != null ? !this.desiredCount.equals(that.desiredCount) : that.desiredCount != null) return false;
            if (this.enableEcsManagedTags != null ? !this.enableEcsManagedTags.equals(that.enableEcsManagedTags) : that.enableEcsManagedTags != null) return false;
            if (this.enableExecuteCommand != null ? !this.enableExecuteCommand.equals(that.enableExecuteCommand) : that.enableExecuteCommand != null) return false;
            if (this.forceDelete != null ? !this.forceDelete.equals(that.forceDelete) : that.forceDelete != null) return false;
            if (this.forceNewDeployment != null ? !this.forceNewDeployment.equals(that.forceNewDeployment) : that.forceNewDeployment != null) return false;
            if (this.healthCheckGracePeriodSeconds != null ? !this.healthCheckGracePeriodSeconds.equals(that.healthCheckGracePeriodSeconds) : that.healthCheckGracePeriodSeconds != null) return false;
            if (this.iamRole != null ? !this.iamRole.equals(that.iamRole) : that.iamRole != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.launchType != null ? !this.launchType.equals(that.launchType) : that.launchType != null) return false;
            if (this.loadBalancer != null ? !this.loadBalancer.equals(that.loadBalancer) : that.loadBalancer != null) return false;
            if (this.networkConfiguration != null ? !this.networkConfiguration.equals(that.networkConfiguration) : that.networkConfiguration != null) return false;
            if (this.orderedPlacementStrategy != null ? !this.orderedPlacementStrategy.equals(that.orderedPlacementStrategy) : that.orderedPlacementStrategy != null) return false;
            if (this.placementConstraints != null ? !this.placementConstraints.equals(that.placementConstraints) : that.placementConstraints != null) return false;
            if (this.platformVersion != null ? !this.platformVersion.equals(that.platformVersion) : that.platformVersion != null) return false;
            if (this.propagateTags != null ? !this.propagateTags.equals(that.propagateTags) : that.propagateTags != null) return false;
            if (this.schedulingStrategy != null ? !this.schedulingStrategy.equals(that.schedulingStrategy) : that.schedulingStrategy != null) return false;
            if (this.serviceConnectConfiguration != null ? !this.serviceConnectConfiguration.equals(that.serviceConnectConfiguration) : that.serviceConnectConfiguration != null) return false;
            if (this.serviceRegistries != null ? !this.serviceRegistries.equals(that.serviceRegistries) : that.serviceRegistries != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.taskDefinition != null ? !this.taskDefinition.equals(that.taskDefinition) : that.taskDefinition != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.triggers != null ? !this.triggers.equals(that.triggers) : that.triggers != null) return false;
            if (this.volumeConfiguration != null ? !this.volumeConfiguration.equals(that.volumeConfiguration) : that.volumeConfiguration != null) return false;
            if (this.vpcLatticeConfigurations != null ? !this.vpcLatticeConfigurations.equals(that.vpcLatticeConfigurations) : that.vpcLatticeConfigurations != null) return false;
            if (this.waitForSteadyState != null ? !this.waitForSteadyState.equals(that.waitForSteadyState) : that.waitForSteadyState != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.alarms != null ? this.alarms.hashCode() : 0);
            result = 31 * result + (this.availabilityZoneRebalancing != null ? this.availabilityZoneRebalancing.hashCode() : 0);
            result = 31 * result + (this.capacityProviderStrategy != null ? this.capacityProviderStrategy.hashCode() : 0);
            result = 31 * result + (this.cluster != null ? this.cluster.hashCode() : 0);
            result = 31 * result + (this.deploymentCircuitBreaker != null ? this.deploymentCircuitBreaker.hashCode() : 0);
            result = 31 * result + (this.deploymentController != null ? this.deploymentController.hashCode() : 0);
            result = 31 * result + (this.deploymentMaximumPercent != null ? this.deploymentMaximumPercent.hashCode() : 0);
            result = 31 * result + (this.deploymentMinimumHealthyPercent != null ? this.deploymentMinimumHealthyPercent.hashCode() : 0);
            result = 31 * result + (this.desiredCount != null ? this.desiredCount.hashCode() : 0);
            result = 31 * result + (this.enableEcsManagedTags != null ? this.enableEcsManagedTags.hashCode() : 0);
            result = 31 * result + (this.enableExecuteCommand != null ? this.enableExecuteCommand.hashCode() : 0);
            result = 31 * result + (this.forceDelete != null ? this.forceDelete.hashCode() : 0);
            result = 31 * result + (this.forceNewDeployment != null ? this.forceNewDeployment.hashCode() : 0);
            result = 31 * result + (this.healthCheckGracePeriodSeconds != null ? this.healthCheckGracePeriodSeconds.hashCode() : 0);
            result = 31 * result + (this.iamRole != null ? this.iamRole.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.launchType != null ? this.launchType.hashCode() : 0);
            result = 31 * result + (this.loadBalancer != null ? this.loadBalancer.hashCode() : 0);
            result = 31 * result + (this.networkConfiguration != null ? this.networkConfiguration.hashCode() : 0);
            result = 31 * result + (this.orderedPlacementStrategy != null ? this.orderedPlacementStrategy.hashCode() : 0);
            result = 31 * result + (this.placementConstraints != null ? this.placementConstraints.hashCode() : 0);
            result = 31 * result + (this.platformVersion != null ? this.platformVersion.hashCode() : 0);
            result = 31 * result + (this.propagateTags != null ? this.propagateTags.hashCode() : 0);
            result = 31 * result + (this.schedulingStrategy != null ? this.schedulingStrategy.hashCode() : 0);
            result = 31 * result + (this.serviceConnectConfiguration != null ? this.serviceConnectConfiguration.hashCode() : 0);
            result = 31 * result + (this.serviceRegistries != null ? this.serviceRegistries.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.taskDefinition != null ? this.taskDefinition.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.triggers != null ? this.triggers.hashCode() : 0);
            result = 31 * result + (this.volumeConfiguration != null ? this.volumeConfiguration.hashCode() : 0);
            result = 31 * result + (this.vpcLatticeConfigurations != null ? this.vpcLatticeConfigurations.hashCode() : 0);
            result = 31 * result + (this.waitForSteadyState != null ? this.waitForSteadyState.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}

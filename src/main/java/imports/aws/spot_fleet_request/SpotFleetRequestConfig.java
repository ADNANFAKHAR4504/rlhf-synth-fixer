package imports.aws.spot_fleet_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequestConfig")
@software.amazon.jsii.Jsii.Proxy(SpotFleetRequestConfig.Jsii$Proxy.class)
public interface SpotFleetRequestConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#iam_fleet_role SpotFleetRequest#iam_fleet_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamFleetRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity SpotFleetRequest#target_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTargetCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#allocation_strategy SpotFleetRequest#allocation_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#context SpotFleetRequest#context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#excess_capacity_termination_policy SpotFleetRequest#excess_capacity_termination_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExcessCapacityTerminationPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#fleet_type SpotFleetRequest#fleet_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#id SpotFleetRequest#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_interruption_behaviour SpotFleetRequest#instance_interruption_behaviour}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehaviour() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_pools_to_use_count SpotFleetRequest#instance_pools_to_use_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstancePoolsToUseCount() {
        return null;
    }

    /**
     * launch_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_specification SpotFleetRequest#launch_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLaunchSpecification() {
        return null;
    }

    /**
     * launch_template_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_config SpotFleetRequest#launch_template_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLaunchTemplateConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#load_balancers SpotFleetRequest#load_balancers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLoadBalancers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_allocation_strategy SpotFleetRequest#on_demand_allocation_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnDemandAllocationStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_max_total_price SpotFleetRequest#on_demand_max_total_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnDemandMaxTotalPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_target_capacity SpotFleetRequest#on_demand_target_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandTargetCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplaceUnhealthyInstances() {
        return null;
    }

    /**
     * spot_maintenance_strategies block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_maintenance_strategies SpotFleetRequest#spot_maintenance_strategies}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies getSpotMaintenanceStrategies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_price SpotFleetRequest#spot_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags SpotFleetRequest#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags_all SpotFleetRequest#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity_unit_type SpotFleetRequest#target_capacity_unit_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetCapacityUnitType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_group_arns SpotFleetRequest#target_group_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetGroupArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_on_delete SpotFleetRequest#terminate_instances_on_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTerminateInstancesOnDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstancesWithExpiration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#timeouts SpotFleetRequest#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_from SpotFleetRequest#valid_from}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidFrom() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_until SpotFleetRequest#valid_until}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidUntil() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitForFulfillment() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotFleetRequestConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotFleetRequestConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotFleetRequestConfig> {
        java.lang.String iamFleetRole;
        java.lang.Number targetCapacity;
        java.lang.String allocationStrategy;
        java.lang.String context;
        java.lang.String excessCapacityTerminationPolicy;
        java.lang.String fleetType;
        java.lang.String id;
        java.lang.String instanceInterruptionBehaviour;
        java.lang.Number instancePoolsToUseCount;
        java.lang.Object launchSpecification;
        java.lang.Object launchTemplateConfig;
        java.util.List<java.lang.String> loadBalancers;
        java.lang.String onDemandAllocationStrategy;
        java.lang.String onDemandMaxTotalPrice;
        java.lang.Number onDemandTargetCapacity;
        java.lang.Object replaceUnhealthyInstances;
        imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies spotMaintenanceStrategies;
        java.lang.String spotPrice;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String targetCapacityUnitType;
        java.util.List<java.lang.String> targetGroupArns;
        java.lang.String terminateInstancesOnDelete;
        java.lang.Object terminateInstancesWithExpiration;
        imports.aws.spot_fleet_request.SpotFleetRequestTimeouts timeouts;
        java.lang.String validFrom;
        java.lang.String validUntil;
        java.lang.Object waitForFulfillment;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getIamFleetRole}
         * @param iamFleetRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#iam_fleet_role SpotFleetRequest#iam_fleet_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamFleetRole(java.lang.String iamFleetRole) {
            this.iamFleetRole = iamFleetRole;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTargetCapacity}
         * @param targetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity SpotFleetRequest#target_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetCapacity(java.lang.Number targetCapacity) {
            this.targetCapacity = targetCapacity;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#allocation_strategy SpotFleetRequest#allocation_strategy}.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getContext}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#context SpotFleetRequest#context}.
         * @return {@code this}
         */
        public Builder context(java.lang.String context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getExcessCapacityTerminationPolicy}
         * @param excessCapacityTerminationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#excess_capacity_termination_policy SpotFleetRequest#excess_capacity_termination_policy}.
         * @return {@code this}
         */
        public Builder excessCapacityTerminationPolicy(java.lang.String excessCapacityTerminationPolicy) {
            this.excessCapacityTerminationPolicy = excessCapacityTerminationPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getFleetType}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#fleet_type SpotFleetRequest#fleet_type}.
         * @return {@code this}
         */
        public Builder fleetType(java.lang.String fleetType) {
            this.fleetType = fleetType;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#id SpotFleetRequest#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getInstanceInterruptionBehaviour}
         * @param instanceInterruptionBehaviour Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_interruption_behaviour SpotFleetRequest#instance_interruption_behaviour}.
         * @return {@code this}
         */
        public Builder instanceInterruptionBehaviour(java.lang.String instanceInterruptionBehaviour) {
            this.instanceInterruptionBehaviour = instanceInterruptionBehaviour;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getInstancePoolsToUseCount}
         * @param instancePoolsToUseCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_pools_to_use_count SpotFleetRequest#instance_pools_to_use_count}.
         * @return {@code this}
         */
        public Builder instancePoolsToUseCount(java.lang.Number instancePoolsToUseCount) {
            this.instancePoolsToUseCount = instancePoolsToUseCount;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLaunchSpecification}
         * @param launchSpecification launch_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_specification SpotFleetRequest#launch_specification}
         * @return {@code this}
         */
        public Builder launchSpecification(com.hashicorp.cdktf.IResolvable launchSpecification) {
            this.launchSpecification = launchSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLaunchSpecification}
         * @param launchSpecification launch_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_specification SpotFleetRequest#launch_specification}
         * @return {@code this}
         */
        public Builder launchSpecification(java.util.List<? extends imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification> launchSpecification) {
            this.launchSpecification = launchSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLaunchTemplateConfig}
         * @param launchTemplateConfig launch_template_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_config SpotFleetRequest#launch_template_config}
         * @return {@code this}
         */
        public Builder launchTemplateConfig(com.hashicorp.cdktf.IResolvable launchTemplateConfig) {
            this.launchTemplateConfig = launchTemplateConfig;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLaunchTemplateConfig}
         * @param launchTemplateConfig launch_template_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_config SpotFleetRequest#launch_template_config}
         * @return {@code this}
         */
        public Builder launchTemplateConfig(java.util.List<? extends imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig> launchTemplateConfig) {
            this.launchTemplateConfig = launchTemplateConfig;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLoadBalancers}
         * @param loadBalancers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#load_balancers SpotFleetRequest#load_balancers}.
         * @return {@code this}
         */
        public Builder loadBalancers(java.util.List<java.lang.String> loadBalancers) {
            this.loadBalancers = loadBalancers;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getOnDemandAllocationStrategy}
         * @param onDemandAllocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_allocation_strategy SpotFleetRequest#on_demand_allocation_strategy}.
         * @return {@code this}
         */
        public Builder onDemandAllocationStrategy(java.lang.String onDemandAllocationStrategy) {
            this.onDemandAllocationStrategy = onDemandAllocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getOnDemandMaxTotalPrice}
         * @param onDemandMaxTotalPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_max_total_price SpotFleetRequest#on_demand_max_total_price}.
         * @return {@code this}
         */
        public Builder onDemandMaxTotalPrice(java.lang.String onDemandMaxTotalPrice) {
            this.onDemandMaxTotalPrice = onDemandMaxTotalPrice;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getOnDemandTargetCapacity}
         * @param onDemandTargetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_target_capacity SpotFleetRequest#on_demand_target_capacity}.
         * @return {@code this}
         */
        public Builder onDemandTargetCapacity(java.lang.Number onDemandTargetCapacity) {
            this.onDemandTargetCapacity = onDemandTargetCapacity;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getReplaceUnhealthyInstances}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}.
         * @return {@code this}
         */
        public Builder replaceUnhealthyInstances(java.lang.Boolean replaceUnhealthyInstances) {
            this.replaceUnhealthyInstances = replaceUnhealthyInstances;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getReplaceUnhealthyInstances}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}.
         * @return {@code this}
         */
        public Builder replaceUnhealthyInstances(com.hashicorp.cdktf.IResolvable replaceUnhealthyInstances) {
            this.replaceUnhealthyInstances = replaceUnhealthyInstances;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getSpotMaintenanceStrategies}
         * @param spotMaintenanceStrategies spot_maintenance_strategies block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_maintenance_strategies SpotFleetRequest#spot_maintenance_strategies}
         * @return {@code this}
         */
        public Builder spotMaintenanceStrategies(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies spotMaintenanceStrategies) {
            this.spotMaintenanceStrategies = spotMaintenanceStrategies;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getSpotPrice}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_price SpotFleetRequest#spot_price}.
         * @return {@code this}
         */
        public Builder spotPrice(java.lang.String spotPrice) {
            this.spotPrice = spotPrice;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags SpotFleetRequest#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags_all SpotFleetRequest#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTargetCapacityUnitType}
         * @param targetCapacityUnitType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity_unit_type SpotFleetRequest#target_capacity_unit_type}.
         * @return {@code this}
         */
        public Builder targetCapacityUnitType(java.lang.String targetCapacityUnitType) {
            this.targetCapacityUnitType = targetCapacityUnitType;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTargetGroupArns}
         * @param targetGroupArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_group_arns SpotFleetRequest#target_group_arns}.
         * @return {@code this}
         */
        public Builder targetGroupArns(java.util.List<java.lang.String> targetGroupArns) {
            this.targetGroupArns = targetGroupArns;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTerminateInstancesOnDelete}
         * @param terminateInstancesOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_on_delete SpotFleetRequest#terminate_instances_on_delete}.
         * @return {@code this}
         */
        public Builder terminateInstancesOnDelete(java.lang.String terminateInstancesOnDelete) {
            this.terminateInstancesOnDelete = terminateInstancesOnDelete;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTerminateInstancesWithExpiration}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}.
         * @return {@code this}
         */
        public Builder terminateInstancesWithExpiration(java.lang.Boolean terminateInstancesWithExpiration) {
            this.terminateInstancesWithExpiration = terminateInstancesWithExpiration;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTerminateInstancesWithExpiration}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}.
         * @return {@code this}
         */
        public Builder terminateInstancesWithExpiration(com.hashicorp.cdktf.IResolvable terminateInstancesWithExpiration) {
            this.terminateInstancesWithExpiration = terminateInstancesWithExpiration;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#timeouts SpotFleetRequest#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.spot_fleet_request.SpotFleetRequestTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getValidFrom}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_from SpotFleetRequest#valid_from}.
         * @return {@code this}
         */
        public Builder validFrom(java.lang.String validFrom) {
            this.validFrom = validFrom;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getValidUntil}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_until SpotFleetRequest#valid_until}.
         * @return {@code this}
         */
        public Builder validUntil(java.lang.String validUntil) {
            this.validUntil = validUntil;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getWaitForFulfillment}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}.
         * @return {@code this}
         */
        public Builder waitForFulfillment(java.lang.Boolean waitForFulfillment) {
            this.waitForFulfillment = waitForFulfillment;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getWaitForFulfillment}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}.
         * @return {@code this}
         */
        public Builder waitForFulfillment(com.hashicorp.cdktf.IResolvable waitForFulfillment) {
            this.waitForFulfillment = waitForFulfillment;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getDependsOn}
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
         * Sets the value of {@link SpotFleetRequestConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestConfig#getProvisioners}
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
         * @return a new instance of {@link SpotFleetRequestConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotFleetRequestConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotFleetRequestConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotFleetRequestConfig {
        private final java.lang.String iamFleetRole;
        private final java.lang.Number targetCapacity;
        private final java.lang.String allocationStrategy;
        private final java.lang.String context;
        private final java.lang.String excessCapacityTerminationPolicy;
        private final java.lang.String fleetType;
        private final java.lang.String id;
        private final java.lang.String instanceInterruptionBehaviour;
        private final java.lang.Number instancePoolsToUseCount;
        private final java.lang.Object launchSpecification;
        private final java.lang.Object launchTemplateConfig;
        private final java.util.List<java.lang.String> loadBalancers;
        private final java.lang.String onDemandAllocationStrategy;
        private final java.lang.String onDemandMaxTotalPrice;
        private final java.lang.Number onDemandTargetCapacity;
        private final java.lang.Object replaceUnhealthyInstances;
        private final imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies spotMaintenanceStrategies;
        private final java.lang.String spotPrice;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String targetCapacityUnitType;
        private final java.util.List<java.lang.String> targetGroupArns;
        private final java.lang.String terminateInstancesOnDelete;
        private final java.lang.Object terminateInstancesWithExpiration;
        private final imports.aws.spot_fleet_request.SpotFleetRequestTimeouts timeouts;
        private final java.lang.String validFrom;
        private final java.lang.String validUntil;
        private final java.lang.Object waitForFulfillment;
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
            this.iamFleetRole = software.amazon.jsii.Kernel.get(this, "iamFleetRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetCapacity = software.amazon.jsii.Kernel.get(this, "targetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allocationStrategy = software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excessCapacityTerminationPolicy = software.amazon.jsii.Kernel.get(this, "excessCapacityTerminationPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fleetType = software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInterruptionBehaviour = software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehaviour", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instancePoolsToUseCount = software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.launchSpecification = software.amazon.jsii.Kernel.get(this, "launchSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.launchTemplateConfig = software.amazon.jsii.Kernel.get(this, "launchTemplateConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.loadBalancers = software.amazon.jsii.Kernel.get(this, "loadBalancers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.onDemandAllocationStrategy = software.amazon.jsii.Kernel.get(this, "onDemandAllocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onDemandMaxTotalPrice = software.amazon.jsii.Kernel.get(this, "onDemandMaxTotalPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onDemandTargetCapacity = software.amazon.jsii.Kernel.get(this, "onDemandTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.replaceUnhealthyInstances = software.amazon.jsii.Kernel.get(this, "replaceUnhealthyInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.spotMaintenanceStrategies = software.amazon.jsii.Kernel.get(this, "spotMaintenanceStrategies", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies.class));
            this.spotPrice = software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetCapacityUnitType = software.amazon.jsii.Kernel.get(this, "targetCapacityUnitType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetGroupArns = software.amazon.jsii.Kernel.get(this, "targetGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.terminateInstancesOnDelete = software.amazon.jsii.Kernel.get(this, "terminateInstancesOnDelete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.terminateInstancesWithExpiration = software.amazon.jsii.Kernel.get(this, "terminateInstancesWithExpiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestTimeouts.class));
            this.validFrom = software.amazon.jsii.Kernel.get(this, "validFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validUntil = software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.waitForFulfillment = software.amazon.jsii.Kernel.get(this, "waitForFulfillment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.iamFleetRole = java.util.Objects.requireNonNull(builder.iamFleetRole, "iamFleetRole is required");
            this.targetCapacity = java.util.Objects.requireNonNull(builder.targetCapacity, "targetCapacity is required");
            this.allocationStrategy = builder.allocationStrategy;
            this.context = builder.context;
            this.excessCapacityTerminationPolicy = builder.excessCapacityTerminationPolicy;
            this.fleetType = builder.fleetType;
            this.id = builder.id;
            this.instanceInterruptionBehaviour = builder.instanceInterruptionBehaviour;
            this.instancePoolsToUseCount = builder.instancePoolsToUseCount;
            this.launchSpecification = builder.launchSpecification;
            this.launchTemplateConfig = builder.launchTemplateConfig;
            this.loadBalancers = builder.loadBalancers;
            this.onDemandAllocationStrategy = builder.onDemandAllocationStrategy;
            this.onDemandMaxTotalPrice = builder.onDemandMaxTotalPrice;
            this.onDemandTargetCapacity = builder.onDemandTargetCapacity;
            this.replaceUnhealthyInstances = builder.replaceUnhealthyInstances;
            this.spotMaintenanceStrategies = builder.spotMaintenanceStrategies;
            this.spotPrice = builder.spotPrice;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.targetCapacityUnitType = builder.targetCapacityUnitType;
            this.targetGroupArns = builder.targetGroupArns;
            this.terminateInstancesOnDelete = builder.terminateInstancesOnDelete;
            this.terminateInstancesWithExpiration = builder.terminateInstancesWithExpiration;
            this.timeouts = builder.timeouts;
            this.validFrom = builder.validFrom;
            this.validUntil = builder.validUntil;
            this.waitForFulfillment = builder.waitForFulfillment;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIamFleetRole() {
            return this.iamFleetRole;
        }

        @Override
        public final java.lang.Number getTargetCapacity() {
            return this.targetCapacity;
        }

        @Override
        public final java.lang.String getAllocationStrategy() {
            return this.allocationStrategy;
        }

        @Override
        public final java.lang.String getContext() {
            return this.context;
        }

        @Override
        public final java.lang.String getExcessCapacityTerminationPolicy() {
            return this.excessCapacityTerminationPolicy;
        }

        @Override
        public final java.lang.String getFleetType() {
            return this.fleetType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceInterruptionBehaviour() {
            return this.instanceInterruptionBehaviour;
        }

        @Override
        public final java.lang.Number getInstancePoolsToUseCount() {
            return this.instancePoolsToUseCount;
        }

        @Override
        public final java.lang.Object getLaunchSpecification() {
            return this.launchSpecification;
        }

        @Override
        public final java.lang.Object getLaunchTemplateConfig() {
            return this.launchTemplateConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getLoadBalancers() {
            return this.loadBalancers;
        }

        @Override
        public final java.lang.String getOnDemandAllocationStrategy() {
            return this.onDemandAllocationStrategy;
        }

        @Override
        public final java.lang.String getOnDemandMaxTotalPrice() {
            return this.onDemandMaxTotalPrice;
        }

        @Override
        public final java.lang.Number getOnDemandTargetCapacity() {
            return this.onDemandTargetCapacity;
        }

        @Override
        public final java.lang.Object getReplaceUnhealthyInstances() {
            return this.replaceUnhealthyInstances;
        }

        @Override
        public final imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies getSpotMaintenanceStrategies() {
            return this.spotMaintenanceStrategies;
        }

        @Override
        public final java.lang.String getSpotPrice() {
            return this.spotPrice;
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
        public final java.lang.String getTargetCapacityUnitType() {
            return this.targetCapacityUnitType;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetGroupArns() {
            return this.targetGroupArns;
        }

        @Override
        public final java.lang.String getTerminateInstancesOnDelete() {
            return this.terminateInstancesOnDelete;
        }

        @Override
        public final java.lang.Object getTerminateInstancesWithExpiration() {
            return this.terminateInstancesWithExpiration;
        }

        @Override
        public final imports.aws.spot_fleet_request.SpotFleetRequestTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getValidFrom() {
            return this.validFrom;
        }

        @Override
        public final java.lang.String getValidUntil() {
            return this.validUntil;
        }

        @Override
        public final java.lang.Object getWaitForFulfillment() {
            return this.waitForFulfillment;
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

            data.set("iamFleetRole", om.valueToTree(this.getIamFleetRole()));
            data.set("targetCapacity", om.valueToTree(this.getTargetCapacity()));
            if (this.getAllocationStrategy() != null) {
                data.set("allocationStrategy", om.valueToTree(this.getAllocationStrategy()));
            }
            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getExcessCapacityTerminationPolicy() != null) {
                data.set("excessCapacityTerminationPolicy", om.valueToTree(this.getExcessCapacityTerminationPolicy()));
            }
            if (this.getFleetType() != null) {
                data.set("fleetType", om.valueToTree(this.getFleetType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceInterruptionBehaviour() != null) {
                data.set("instanceInterruptionBehaviour", om.valueToTree(this.getInstanceInterruptionBehaviour()));
            }
            if (this.getInstancePoolsToUseCount() != null) {
                data.set("instancePoolsToUseCount", om.valueToTree(this.getInstancePoolsToUseCount()));
            }
            if (this.getLaunchSpecification() != null) {
                data.set("launchSpecification", om.valueToTree(this.getLaunchSpecification()));
            }
            if (this.getLaunchTemplateConfig() != null) {
                data.set("launchTemplateConfig", om.valueToTree(this.getLaunchTemplateConfig()));
            }
            if (this.getLoadBalancers() != null) {
                data.set("loadBalancers", om.valueToTree(this.getLoadBalancers()));
            }
            if (this.getOnDemandAllocationStrategy() != null) {
                data.set("onDemandAllocationStrategy", om.valueToTree(this.getOnDemandAllocationStrategy()));
            }
            if (this.getOnDemandMaxTotalPrice() != null) {
                data.set("onDemandMaxTotalPrice", om.valueToTree(this.getOnDemandMaxTotalPrice()));
            }
            if (this.getOnDemandTargetCapacity() != null) {
                data.set("onDemandTargetCapacity", om.valueToTree(this.getOnDemandTargetCapacity()));
            }
            if (this.getReplaceUnhealthyInstances() != null) {
                data.set("replaceUnhealthyInstances", om.valueToTree(this.getReplaceUnhealthyInstances()));
            }
            if (this.getSpotMaintenanceStrategies() != null) {
                data.set("spotMaintenanceStrategies", om.valueToTree(this.getSpotMaintenanceStrategies()));
            }
            if (this.getSpotPrice() != null) {
                data.set("spotPrice", om.valueToTree(this.getSpotPrice()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTargetCapacityUnitType() != null) {
                data.set("targetCapacityUnitType", om.valueToTree(this.getTargetCapacityUnitType()));
            }
            if (this.getTargetGroupArns() != null) {
                data.set("targetGroupArns", om.valueToTree(this.getTargetGroupArns()));
            }
            if (this.getTerminateInstancesOnDelete() != null) {
                data.set("terminateInstancesOnDelete", om.valueToTree(this.getTerminateInstancesOnDelete()));
            }
            if (this.getTerminateInstancesWithExpiration() != null) {
                data.set("terminateInstancesWithExpiration", om.valueToTree(this.getTerminateInstancesWithExpiration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getValidFrom() != null) {
                data.set("validFrom", om.valueToTree(this.getValidFrom()));
            }
            if (this.getValidUntil() != null) {
                data.set("validUntil", om.valueToTree(this.getValidUntil()));
            }
            if (this.getWaitForFulfillment() != null) {
                data.set("waitForFulfillment", om.valueToTree(this.getWaitForFulfillment()));
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
            struct.set("fqn", om.valueToTree("aws.spotFleetRequest.SpotFleetRequestConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotFleetRequestConfig.Jsii$Proxy that = (SpotFleetRequestConfig.Jsii$Proxy) o;

            if (!iamFleetRole.equals(that.iamFleetRole)) return false;
            if (!targetCapacity.equals(that.targetCapacity)) return false;
            if (this.allocationStrategy != null ? !this.allocationStrategy.equals(that.allocationStrategy) : that.allocationStrategy != null) return false;
            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            if (this.excessCapacityTerminationPolicy != null ? !this.excessCapacityTerminationPolicy.equals(that.excessCapacityTerminationPolicy) : that.excessCapacityTerminationPolicy != null) return false;
            if (this.fleetType != null ? !this.fleetType.equals(that.fleetType) : that.fleetType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceInterruptionBehaviour != null ? !this.instanceInterruptionBehaviour.equals(that.instanceInterruptionBehaviour) : that.instanceInterruptionBehaviour != null) return false;
            if (this.instancePoolsToUseCount != null ? !this.instancePoolsToUseCount.equals(that.instancePoolsToUseCount) : that.instancePoolsToUseCount != null) return false;
            if (this.launchSpecification != null ? !this.launchSpecification.equals(that.launchSpecification) : that.launchSpecification != null) return false;
            if (this.launchTemplateConfig != null ? !this.launchTemplateConfig.equals(that.launchTemplateConfig) : that.launchTemplateConfig != null) return false;
            if (this.loadBalancers != null ? !this.loadBalancers.equals(that.loadBalancers) : that.loadBalancers != null) return false;
            if (this.onDemandAllocationStrategy != null ? !this.onDemandAllocationStrategy.equals(that.onDemandAllocationStrategy) : that.onDemandAllocationStrategy != null) return false;
            if (this.onDemandMaxTotalPrice != null ? !this.onDemandMaxTotalPrice.equals(that.onDemandMaxTotalPrice) : that.onDemandMaxTotalPrice != null) return false;
            if (this.onDemandTargetCapacity != null ? !this.onDemandTargetCapacity.equals(that.onDemandTargetCapacity) : that.onDemandTargetCapacity != null) return false;
            if (this.replaceUnhealthyInstances != null ? !this.replaceUnhealthyInstances.equals(that.replaceUnhealthyInstances) : that.replaceUnhealthyInstances != null) return false;
            if (this.spotMaintenanceStrategies != null ? !this.spotMaintenanceStrategies.equals(that.spotMaintenanceStrategies) : that.spotMaintenanceStrategies != null) return false;
            if (this.spotPrice != null ? !this.spotPrice.equals(that.spotPrice) : that.spotPrice != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.targetCapacityUnitType != null ? !this.targetCapacityUnitType.equals(that.targetCapacityUnitType) : that.targetCapacityUnitType != null) return false;
            if (this.targetGroupArns != null ? !this.targetGroupArns.equals(that.targetGroupArns) : that.targetGroupArns != null) return false;
            if (this.terminateInstancesOnDelete != null ? !this.terminateInstancesOnDelete.equals(that.terminateInstancesOnDelete) : that.terminateInstancesOnDelete != null) return false;
            if (this.terminateInstancesWithExpiration != null ? !this.terminateInstancesWithExpiration.equals(that.terminateInstancesWithExpiration) : that.terminateInstancesWithExpiration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.validFrom != null ? !this.validFrom.equals(that.validFrom) : that.validFrom != null) return false;
            if (this.validUntil != null ? !this.validUntil.equals(that.validUntil) : that.validUntil != null) return false;
            if (this.waitForFulfillment != null ? !this.waitForFulfillment.equals(that.waitForFulfillment) : that.waitForFulfillment != null) return false;
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
            int result = this.iamFleetRole.hashCode();
            result = 31 * result + (this.targetCapacity.hashCode());
            result = 31 * result + (this.allocationStrategy != null ? this.allocationStrategy.hashCode() : 0);
            result = 31 * result + (this.context != null ? this.context.hashCode() : 0);
            result = 31 * result + (this.excessCapacityTerminationPolicy != null ? this.excessCapacityTerminationPolicy.hashCode() : 0);
            result = 31 * result + (this.fleetType != null ? this.fleetType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceInterruptionBehaviour != null ? this.instanceInterruptionBehaviour.hashCode() : 0);
            result = 31 * result + (this.instancePoolsToUseCount != null ? this.instancePoolsToUseCount.hashCode() : 0);
            result = 31 * result + (this.launchSpecification != null ? this.launchSpecification.hashCode() : 0);
            result = 31 * result + (this.launchTemplateConfig != null ? this.launchTemplateConfig.hashCode() : 0);
            result = 31 * result + (this.loadBalancers != null ? this.loadBalancers.hashCode() : 0);
            result = 31 * result + (this.onDemandAllocationStrategy != null ? this.onDemandAllocationStrategy.hashCode() : 0);
            result = 31 * result + (this.onDemandMaxTotalPrice != null ? this.onDemandMaxTotalPrice.hashCode() : 0);
            result = 31 * result + (this.onDemandTargetCapacity != null ? this.onDemandTargetCapacity.hashCode() : 0);
            result = 31 * result + (this.replaceUnhealthyInstances != null ? this.replaceUnhealthyInstances.hashCode() : 0);
            result = 31 * result + (this.spotMaintenanceStrategies != null ? this.spotMaintenanceStrategies.hashCode() : 0);
            result = 31 * result + (this.spotPrice != null ? this.spotPrice.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.targetCapacityUnitType != null ? this.targetCapacityUnitType.hashCode() : 0);
            result = 31 * result + (this.targetGroupArns != null ? this.targetGroupArns.hashCode() : 0);
            result = 31 * result + (this.terminateInstancesOnDelete != null ? this.terminateInstancesOnDelete.hashCode() : 0);
            result = 31 * result + (this.terminateInstancesWithExpiration != null ? this.terminateInstancesWithExpiration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.validFrom != null ? this.validFrom.hashCode() : 0);
            result = 31 * result + (this.validUntil != null ? this.validUntil.hashCode() : 0);
            result = 31 * result + (this.waitForFulfillment != null ? this.waitForFulfillment.hashCode() : 0);
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

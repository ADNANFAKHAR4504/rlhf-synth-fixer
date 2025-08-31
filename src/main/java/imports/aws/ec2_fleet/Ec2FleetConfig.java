package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetConfig.Jsii$Proxy.class)
public interface Ec2FleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * launch_template_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getLaunchTemplateConfig();

    /**
     * target_capacity_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification getTargetCapacitySpecification();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExcessCapacityTerminationPolicy() {
        return null;
    }

    /**
     * fleet_instance_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFleetInstanceSet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFulfilledCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFulfilledOnDemandCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * on_demand_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptions getOnDemandOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplaceUnhealthyInstances() {
        return null;
    }

    /**
     * spot_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptions getSpotOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstances() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstancesWithExpiration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidFrom() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidUntil() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetConfig> {
        java.lang.Object launchTemplateConfig;
        imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification targetCapacitySpecification;
        java.lang.String context;
        java.lang.String excessCapacityTerminationPolicy;
        java.lang.Object fleetInstanceSet;
        java.lang.String fleetState;
        java.lang.Number fulfilledCapacity;
        java.lang.Number fulfilledOnDemandCapacity;
        java.lang.String id;
        imports.aws.ec2_fleet.Ec2FleetOnDemandOptions onDemandOptions;
        java.lang.Object replaceUnhealthyInstances;
        imports.aws.ec2_fleet.Ec2FleetSpotOptions spotOptions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object terminateInstances;
        java.lang.Object terminateInstancesWithExpiration;
        imports.aws.ec2_fleet.Ec2FleetTimeouts timeouts;
        java.lang.String type;
        java.lang.String validFrom;
        java.lang.String validUntil;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2FleetConfig#getLaunchTemplateConfig}
         * @param launchTemplateConfig launch_template_config block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
         * @return {@code this}
         */
        public Builder launchTemplateConfig(com.hashicorp.cdktf.IResolvable launchTemplateConfig) {
            this.launchTemplateConfig = launchTemplateConfig;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getLaunchTemplateConfig}
         * @param launchTemplateConfig launch_template_config block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
         * @return {@code this}
         */
        public Builder launchTemplateConfig(java.util.List<? extends imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig> launchTemplateConfig) {
            this.launchTemplateConfig = launchTemplateConfig;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTargetCapacitySpecification}
         * @param targetCapacitySpecification target_capacity_specification block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
         * @return {@code this}
         */
        public Builder targetCapacitySpecification(imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification targetCapacitySpecification) {
            this.targetCapacitySpecification = targetCapacitySpecification;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getContext}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.
         * @return {@code this}
         */
        public Builder context(java.lang.String context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getExcessCapacityTerminationPolicy}
         * @param excessCapacityTerminationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.
         * @return {@code this}
         */
        public Builder excessCapacityTerminationPolicy(java.lang.String excessCapacityTerminationPolicy) {
            this.excessCapacityTerminationPolicy = excessCapacityTerminationPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getFleetInstanceSet}
         * @param fleetInstanceSet fleet_instance_set block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
         * @return {@code this}
         */
        public Builder fleetInstanceSet(com.hashicorp.cdktf.IResolvable fleetInstanceSet) {
            this.fleetInstanceSet = fleetInstanceSet;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getFleetInstanceSet}
         * @param fleetInstanceSet fleet_instance_set block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
         * @return {@code this}
         */
        public Builder fleetInstanceSet(java.util.List<? extends imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet> fleetInstanceSet) {
            this.fleetInstanceSet = fleetInstanceSet;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getFleetState}
         * @param fleetState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.
         * @return {@code this}
         */
        public Builder fleetState(java.lang.String fleetState) {
            this.fleetState = fleetState;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getFulfilledCapacity}
         * @param fulfilledCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.
         * @return {@code this}
         */
        public Builder fulfilledCapacity(java.lang.Number fulfilledCapacity) {
            this.fulfilledCapacity = fulfilledCapacity;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getFulfilledOnDemandCapacity}
         * @param fulfilledOnDemandCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.
         * @return {@code this}
         */
        public Builder fulfilledOnDemandCapacity(java.lang.Number fulfilledOnDemandCapacity) {
            this.fulfilledOnDemandCapacity = fulfilledOnDemandCapacity;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getOnDemandOptions}
         * @param onDemandOptions on_demand_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
         * @return {@code this}
         */
        public Builder onDemandOptions(imports.aws.ec2_fleet.Ec2FleetOnDemandOptions onDemandOptions) {
            this.onDemandOptions = onDemandOptions;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getReplaceUnhealthyInstances}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
         * @return {@code this}
         */
        public Builder replaceUnhealthyInstances(java.lang.Boolean replaceUnhealthyInstances) {
            this.replaceUnhealthyInstances = replaceUnhealthyInstances;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getReplaceUnhealthyInstances}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
         * @return {@code this}
         */
        public Builder replaceUnhealthyInstances(com.hashicorp.cdktf.IResolvable replaceUnhealthyInstances) {
            this.replaceUnhealthyInstances = replaceUnhealthyInstances;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getSpotOptions}
         * @param spotOptions spot_options block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
         * @return {@code this}
         */
        public Builder spotOptions(imports.aws.ec2_fleet.Ec2FleetSpotOptions spotOptions) {
            this.spotOptions = spotOptions;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTerminateInstances}
         * @param terminateInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
         * @return {@code this}
         */
        public Builder terminateInstances(java.lang.Boolean terminateInstances) {
            this.terminateInstances = terminateInstances;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTerminateInstances}
         * @param terminateInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
         * @return {@code this}
         */
        public Builder terminateInstances(com.hashicorp.cdktf.IResolvable terminateInstances) {
            this.terminateInstances = terminateInstances;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTerminateInstancesWithExpiration}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
         * @return {@code this}
         */
        public Builder terminateInstancesWithExpiration(java.lang.Boolean terminateInstancesWithExpiration) {
            this.terminateInstancesWithExpiration = terminateInstancesWithExpiration;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTerminateInstancesWithExpiration}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
         * @return {@code this}
         */
        public Builder terminateInstancesWithExpiration(com.hashicorp.cdktf.IResolvable terminateInstancesWithExpiration) {
            this.terminateInstancesWithExpiration = terminateInstancesWithExpiration;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ec2_fleet.Ec2FleetTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getValidFrom}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.
         * @return {@code this}
         */
        public Builder validFrom(java.lang.String validFrom) {
            this.validFrom = validFrom;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getValidUntil}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.
         * @return {@code this}
         */
        public Builder validUntil(java.lang.String validUntil) {
            this.validUntil = validUntil;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getDependsOn}
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
         * Sets the value of {@link Ec2FleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2FleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetConfig {
        private final java.lang.Object launchTemplateConfig;
        private final imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification targetCapacitySpecification;
        private final java.lang.String context;
        private final java.lang.String excessCapacityTerminationPolicy;
        private final java.lang.Object fleetInstanceSet;
        private final java.lang.String fleetState;
        private final java.lang.Number fulfilledCapacity;
        private final java.lang.Number fulfilledOnDemandCapacity;
        private final java.lang.String id;
        private final imports.aws.ec2_fleet.Ec2FleetOnDemandOptions onDemandOptions;
        private final java.lang.Object replaceUnhealthyInstances;
        private final imports.aws.ec2_fleet.Ec2FleetSpotOptions spotOptions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object terminateInstances;
        private final java.lang.Object terminateInstancesWithExpiration;
        private final imports.aws.ec2_fleet.Ec2FleetTimeouts timeouts;
        private final java.lang.String type;
        private final java.lang.String validFrom;
        private final java.lang.String validUntil;
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
            this.launchTemplateConfig = software.amazon.jsii.Kernel.get(this, "launchTemplateConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetCapacitySpecification = software.amazon.jsii.Kernel.get(this, "targetCapacitySpecification", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification.class));
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excessCapacityTerminationPolicy = software.amazon.jsii.Kernel.get(this, "excessCapacityTerminationPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fleetInstanceSet = software.amazon.jsii.Kernel.get(this, "fleetInstanceSet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fleetState = software.amazon.jsii.Kernel.get(this, "fleetState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fulfilledCapacity = software.amazon.jsii.Kernel.get(this, "fulfilledCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.fulfilledOnDemandCapacity = software.amazon.jsii.Kernel.get(this, "fulfilledOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onDemandOptions = software.amazon.jsii.Kernel.get(this, "onDemandOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptions.class));
            this.replaceUnhealthyInstances = software.amazon.jsii.Kernel.get(this, "replaceUnhealthyInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.spotOptions = software.amazon.jsii.Kernel.get(this, "spotOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptions.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.terminateInstances = software.amazon.jsii.Kernel.get(this, "terminateInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.terminateInstancesWithExpiration = software.amazon.jsii.Kernel.get(this, "terminateInstancesWithExpiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validFrom = software.amazon.jsii.Kernel.get(this, "validFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validUntil = software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.launchTemplateConfig = java.util.Objects.requireNonNull(builder.launchTemplateConfig, "launchTemplateConfig is required");
            this.targetCapacitySpecification = java.util.Objects.requireNonNull(builder.targetCapacitySpecification, "targetCapacitySpecification is required");
            this.context = builder.context;
            this.excessCapacityTerminationPolicy = builder.excessCapacityTerminationPolicy;
            this.fleetInstanceSet = builder.fleetInstanceSet;
            this.fleetState = builder.fleetState;
            this.fulfilledCapacity = builder.fulfilledCapacity;
            this.fulfilledOnDemandCapacity = builder.fulfilledOnDemandCapacity;
            this.id = builder.id;
            this.onDemandOptions = builder.onDemandOptions;
            this.replaceUnhealthyInstances = builder.replaceUnhealthyInstances;
            this.spotOptions = builder.spotOptions;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.terminateInstances = builder.terminateInstances;
            this.terminateInstancesWithExpiration = builder.terminateInstancesWithExpiration;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.validFrom = builder.validFrom;
            this.validUntil = builder.validUntil;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getLaunchTemplateConfig() {
            return this.launchTemplateConfig;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification getTargetCapacitySpecification() {
            return this.targetCapacitySpecification;
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
        public final java.lang.Object getFleetInstanceSet() {
            return this.fleetInstanceSet;
        }

        @Override
        public final java.lang.String getFleetState() {
            return this.fleetState;
        }

        @Override
        public final java.lang.Number getFulfilledCapacity() {
            return this.fulfilledCapacity;
        }

        @Override
        public final java.lang.Number getFulfilledOnDemandCapacity() {
            return this.fulfilledOnDemandCapacity;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetOnDemandOptions getOnDemandOptions() {
            return this.onDemandOptions;
        }

        @Override
        public final java.lang.Object getReplaceUnhealthyInstances() {
            return this.replaceUnhealthyInstances;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetSpotOptions getSpotOptions() {
            return this.spotOptions;
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
        public final java.lang.Object getTerminateInstances() {
            return this.terminateInstances;
        }

        @Override
        public final java.lang.Object getTerminateInstancesWithExpiration() {
            return this.terminateInstancesWithExpiration;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
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

            data.set("launchTemplateConfig", om.valueToTree(this.getLaunchTemplateConfig()));
            data.set("targetCapacitySpecification", om.valueToTree(this.getTargetCapacitySpecification()));
            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getExcessCapacityTerminationPolicy() != null) {
                data.set("excessCapacityTerminationPolicy", om.valueToTree(this.getExcessCapacityTerminationPolicy()));
            }
            if (this.getFleetInstanceSet() != null) {
                data.set("fleetInstanceSet", om.valueToTree(this.getFleetInstanceSet()));
            }
            if (this.getFleetState() != null) {
                data.set("fleetState", om.valueToTree(this.getFleetState()));
            }
            if (this.getFulfilledCapacity() != null) {
                data.set("fulfilledCapacity", om.valueToTree(this.getFulfilledCapacity()));
            }
            if (this.getFulfilledOnDemandCapacity() != null) {
                data.set("fulfilledOnDemandCapacity", om.valueToTree(this.getFulfilledOnDemandCapacity()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOnDemandOptions() != null) {
                data.set("onDemandOptions", om.valueToTree(this.getOnDemandOptions()));
            }
            if (this.getReplaceUnhealthyInstances() != null) {
                data.set("replaceUnhealthyInstances", om.valueToTree(this.getReplaceUnhealthyInstances()));
            }
            if (this.getSpotOptions() != null) {
                data.set("spotOptions", om.valueToTree(this.getSpotOptions()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTerminateInstances() != null) {
                data.set("terminateInstances", om.valueToTree(this.getTerminateInstances()));
            }
            if (this.getTerminateInstancesWithExpiration() != null) {
                data.set("terminateInstancesWithExpiration", om.valueToTree(this.getTerminateInstancesWithExpiration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getValidFrom() != null) {
                data.set("validFrom", om.valueToTree(this.getValidFrom()));
            }
            if (this.getValidUntil() != null) {
                data.set("validUntil", om.valueToTree(this.getValidUntil()));
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
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetConfig.Jsii$Proxy that = (Ec2FleetConfig.Jsii$Proxy) o;

            if (!launchTemplateConfig.equals(that.launchTemplateConfig)) return false;
            if (!targetCapacitySpecification.equals(that.targetCapacitySpecification)) return false;
            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            if (this.excessCapacityTerminationPolicy != null ? !this.excessCapacityTerminationPolicy.equals(that.excessCapacityTerminationPolicy) : that.excessCapacityTerminationPolicy != null) return false;
            if (this.fleetInstanceSet != null ? !this.fleetInstanceSet.equals(that.fleetInstanceSet) : that.fleetInstanceSet != null) return false;
            if (this.fleetState != null ? !this.fleetState.equals(that.fleetState) : that.fleetState != null) return false;
            if (this.fulfilledCapacity != null ? !this.fulfilledCapacity.equals(that.fulfilledCapacity) : that.fulfilledCapacity != null) return false;
            if (this.fulfilledOnDemandCapacity != null ? !this.fulfilledOnDemandCapacity.equals(that.fulfilledOnDemandCapacity) : that.fulfilledOnDemandCapacity != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.onDemandOptions != null ? !this.onDemandOptions.equals(that.onDemandOptions) : that.onDemandOptions != null) return false;
            if (this.replaceUnhealthyInstances != null ? !this.replaceUnhealthyInstances.equals(that.replaceUnhealthyInstances) : that.replaceUnhealthyInstances != null) return false;
            if (this.spotOptions != null ? !this.spotOptions.equals(that.spotOptions) : that.spotOptions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.terminateInstances != null ? !this.terminateInstances.equals(that.terminateInstances) : that.terminateInstances != null) return false;
            if (this.terminateInstancesWithExpiration != null ? !this.terminateInstancesWithExpiration.equals(that.terminateInstancesWithExpiration) : that.terminateInstancesWithExpiration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.validFrom != null ? !this.validFrom.equals(that.validFrom) : that.validFrom != null) return false;
            if (this.validUntil != null ? !this.validUntil.equals(that.validUntil) : that.validUntil != null) return false;
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
            int result = this.launchTemplateConfig.hashCode();
            result = 31 * result + (this.targetCapacitySpecification.hashCode());
            result = 31 * result + (this.context != null ? this.context.hashCode() : 0);
            result = 31 * result + (this.excessCapacityTerminationPolicy != null ? this.excessCapacityTerminationPolicy.hashCode() : 0);
            result = 31 * result + (this.fleetInstanceSet != null ? this.fleetInstanceSet.hashCode() : 0);
            result = 31 * result + (this.fleetState != null ? this.fleetState.hashCode() : 0);
            result = 31 * result + (this.fulfilledCapacity != null ? this.fulfilledCapacity.hashCode() : 0);
            result = 31 * result + (this.fulfilledOnDemandCapacity != null ? this.fulfilledOnDemandCapacity.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.onDemandOptions != null ? this.onDemandOptions.hashCode() : 0);
            result = 31 * result + (this.replaceUnhealthyInstances != null ? this.replaceUnhealthyInstances.hashCode() : 0);
            result = 31 * result + (this.spotOptions != null ? this.spotOptions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.terminateInstances != null ? this.terminateInstances.hashCode() : 0);
            result = 31 * result + (this.terminateInstancesWithExpiration != null ? this.terminateInstancesWithExpiration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.validFrom != null ? this.validFrom.hashCode() : 0);
            result = 31 * result + (this.validUntil != null ? this.validUntil.hashCode() : 0);
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

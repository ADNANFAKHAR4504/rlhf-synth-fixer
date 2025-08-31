package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupConfig")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupConfig.Jsii$Proxy.class)
public interface AutoscalingGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinSize();

    /**
     * availability_zone_distribution block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution getAvailabilityZoneDistribution() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZones() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCapacityRebalance() {
        return null;
    }

    /**
     * capacity_reservation_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification getCapacityReservationSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultCooldown() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultInstanceWarmup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDesiredCapacityType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledMetrics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDeleteWarmPool() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckGracePeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreFailedScalingActivities() {
        return null;
    }

    /**
     * initial_lifecycle_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInitialLifecycleHook() {
        return null;
    }

    /**
     * instance_maintenance_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy getInstanceMaintenancePolicy() {
        return null;
    }

    /**
     * instance_refresh block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh getInstanceRefresh() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchConfiguration() {
        return null;
    }

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLoadBalancers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxInstanceLifetime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricsGranularity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinElbCapacity() {
        return null;
    }

    /**
     * mixed_instances_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy getMixedInstancesPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProtectFromScaleIn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceLinkedRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSuspendedProcesses() {
        return null;
    }

    /**
     * tag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTag() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetGroupArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTerminationPolicies() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * traffic_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTrafficSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcZoneIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWaitForCapacityTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWaitForElbCapacity() {
        return null;
    }

    /**
     * warm_pool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupWarmPool getWarmPool() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupConfig> {
        java.lang.Number maxSize;
        java.lang.Number minSize;
        imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution availabilityZoneDistribution;
        java.util.List<java.lang.String> availabilityZones;
        java.lang.Object capacityRebalance;
        imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification capacityReservationSpecification;
        java.lang.String context;
        java.lang.Number defaultCooldown;
        java.lang.Number defaultInstanceWarmup;
        java.lang.Number desiredCapacity;
        java.lang.String desiredCapacityType;
        java.util.List<java.lang.String> enabledMetrics;
        java.lang.Object forceDelete;
        java.lang.Object forceDeleteWarmPool;
        java.lang.Number healthCheckGracePeriod;
        java.lang.String healthCheckType;
        java.lang.String id;
        java.lang.Object ignoreFailedScalingActivities;
        java.lang.Object initialLifecycleHook;
        imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy instanceMaintenancePolicy;
        imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh instanceRefresh;
        java.lang.String launchConfiguration;
        imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate launchTemplate;
        java.util.List<java.lang.String> loadBalancers;
        java.lang.Number maxInstanceLifetime;
        java.lang.String metricsGranularity;
        java.lang.Number minElbCapacity;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy mixedInstancesPolicy;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String placementGroup;
        java.lang.Object protectFromScaleIn;
        java.lang.String serviceLinkedRoleArn;
        java.util.List<java.lang.String> suspendedProcesses;
        java.lang.Object tag;
        java.util.List<java.lang.String> targetGroupArns;
        java.util.List<java.lang.String> terminationPolicies;
        imports.aws.autoscaling_group.AutoscalingGroupTimeouts timeouts;
        java.lang.Object trafficSource;
        java.util.List<java.lang.String> vpcZoneIdentifier;
        java.lang.String waitForCapacityTimeout;
        java.lang.Number waitForElbCapacity;
        imports.aws.autoscaling_group.AutoscalingGroupWarmPool warmPool;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMaxSize}
         * @param maxSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxSize(java.lang.Number maxSize) {
            this.maxSize = maxSize;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMinSize}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder minSize(java.lang.Number minSize) {
            this.minSize = minSize;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getAvailabilityZoneDistribution}
         * @param availabilityZoneDistribution availability_zone_distribution block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
         * @return {@code this}
         */
        public Builder availabilityZoneDistribution(imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution availabilityZoneDistribution) {
            this.availabilityZoneDistribution = availabilityZoneDistribution;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getAvailabilityZones}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.
         * @return {@code this}
         */
        public Builder availabilityZones(java.util.List<java.lang.String> availabilityZones) {
            this.availabilityZones = availabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getCapacityRebalance}
         * @param capacityRebalance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
         * @return {@code this}
         */
        public Builder capacityRebalance(java.lang.Boolean capacityRebalance) {
            this.capacityRebalance = capacityRebalance;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getCapacityRebalance}
         * @param capacityRebalance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
         * @return {@code this}
         */
        public Builder capacityRebalance(com.hashicorp.cdktf.IResolvable capacityRebalance) {
            this.capacityRebalance = capacityRebalance;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getCapacityReservationSpecification}
         * @param capacityReservationSpecification capacity_reservation_specification block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
         * @return {@code this}
         */
        public Builder capacityReservationSpecification(imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification capacityReservationSpecification) {
            this.capacityReservationSpecification = capacityReservationSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getContext}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.
         * @return {@code this}
         */
        public Builder context(java.lang.String context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getDefaultCooldown}
         * @param defaultCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.
         * @return {@code this}
         */
        public Builder defaultCooldown(java.lang.Number defaultCooldown) {
            this.defaultCooldown = defaultCooldown;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getDefaultInstanceWarmup}
         * @param defaultInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.
         * @return {@code this}
         */
        public Builder defaultInstanceWarmup(java.lang.Number defaultInstanceWarmup) {
            this.defaultInstanceWarmup = defaultInstanceWarmup;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getDesiredCapacity}
         * @param desiredCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.
         * @return {@code this}
         */
        public Builder desiredCapacity(java.lang.Number desiredCapacity) {
            this.desiredCapacity = desiredCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getDesiredCapacityType}
         * @param desiredCapacityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.
         * @return {@code this}
         */
        public Builder desiredCapacityType(java.lang.String desiredCapacityType) {
            this.desiredCapacityType = desiredCapacityType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getEnabledMetrics}
         * @param enabledMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.
         * @return {@code this}
         */
        public Builder enabledMetrics(java.util.List<java.lang.String> enabledMetrics) {
            this.enabledMetrics = enabledMetrics;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(java.lang.Boolean forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(com.hashicorp.cdktf.IResolvable forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getForceDeleteWarmPool}
         * @param forceDeleteWarmPool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
         * @return {@code this}
         */
        public Builder forceDeleteWarmPool(java.lang.Boolean forceDeleteWarmPool) {
            this.forceDeleteWarmPool = forceDeleteWarmPool;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getForceDeleteWarmPool}
         * @param forceDeleteWarmPool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
         * @return {@code this}
         */
        public Builder forceDeleteWarmPool(com.hashicorp.cdktf.IResolvable forceDeleteWarmPool) {
            this.forceDeleteWarmPool = forceDeleteWarmPool;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getHealthCheckGracePeriod}
         * @param healthCheckGracePeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.
         * @return {@code this}
         */
        public Builder healthCheckGracePeriod(java.lang.Number healthCheckGracePeriod) {
            this.healthCheckGracePeriod = healthCheckGracePeriod;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getHealthCheckType}
         * @param healthCheckType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.
         * @return {@code this}
         */
        public Builder healthCheckType(java.lang.String healthCheckType) {
            this.healthCheckType = healthCheckType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getIgnoreFailedScalingActivities}
         * @param ignoreFailedScalingActivities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
         * @return {@code this}
         */
        public Builder ignoreFailedScalingActivities(java.lang.Boolean ignoreFailedScalingActivities) {
            this.ignoreFailedScalingActivities = ignoreFailedScalingActivities;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getIgnoreFailedScalingActivities}
         * @param ignoreFailedScalingActivities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
         * @return {@code this}
         */
        public Builder ignoreFailedScalingActivities(com.hashicorp.cdktf.IResolvable ignoreFailedScalingActivities) {
            this.ignoreFailedScalingActivities = ignoreFailedScalingActivities;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getInitialLifecycleHook}
         * @param initialLifecycleHook initial_lifecycle_hook block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
         * @return {@code this}
         */
        public Builder initialLifecycleHook(com.hashicorp.cdktf.IResolvable initialLifecycleHook) {
            this.initialLifecycleHook = initialLifecycleHook;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getInitialLifecycleHook}
         * @param initialLifecycleHook initial_lifecycle_hook block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
         * @return {@code this}
         */
        public Builder initialLifecycleHook(java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook> initialLifecycleHook) {
            this.initialLifecycleHook = initialLifecycleHook;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getInstanceMaintenancePolicy}
         * @param instanceMaintenancePolicy instance_maintenance_policy block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
         * @return {@code this}
         */
        public Builder instanceMaintenancePolicy(imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy instanceMaintenancePolicy) {
            this.instanceMaintenancePolicy = instanceMaintenancePolicy;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getInstanceRefresh}
         * @param instanceRefresh instance_refresh block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
         * @return {@code this}
         */
        public Builder instanceRefresh(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh instanceRefresh) {
            this.instanceRefresh = instanceRefresh;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getLaunchConfiguration}
         * @param launchConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.
         * @return {@code this}
         */
        public Builder launchConfiguration(java.lang.String launchConfiguration) {
            this.launchConfiguration = launchConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getLoadBalancers}
         * @param loadBalancers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.
         * @return {@code this}
         */
        public Builder loadBalancers(java.util.List<java.lang.String> loadBalancers) {
            this.loadBalancers = loadBalancers;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMaxInstanceLifetime}
         * @param maxInstanceLifetime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.
         * @return {@code this}
         */
        public Builder maxInstanceLifetime(java.lang.Number maxInstanceLifetime) {
            this.maxInstanceLifetime = maxInstanceLifetime;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMetricsGranularity}
         * @param metricsGranularity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.
         * @return {@code this}
         */
        public Builder metricsGranularity(java.lang.String metricsGranularity) {
            this.metricsGranularity = metricsGranularity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMinElbCapacity}
         * @param minElbCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.
         * @return {@code this}
         */
        public Builder minElbCapacity(java.lang.Number minElbCapacity) {
            this.minElbCapacity = minElbCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getMixedInstancesPolicy}
         * @param mixedInstancesPolicy mixed_instances_policy block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
         * @return {@code this}
         */
        public Builder mixedInstancesPolicy(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy mixedInstancesPolicy) {
            this.mixedInstancesPolicy = mixedInstancesPolicy;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getPlacementGroup}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.
         * @return {@code this}
         */
        public Builder placementGroup(java.lang.String placementGroup) {
            this.placementGroup = placementGroup;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getProtectFromScaleIn}
         * @param protectFromScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
         * @return {@code this}
         */
        public Builder protectFromScaleIn(java.lang.Boolean protectFromScaleIn) {
            this.protectFromScaleIn = protectFromScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getProtectFromScaleIn}
         * @param protectFromScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
         * @return {@code this}
         */
        public Builder protectFromScaleIn(com.hashicorp.cdktf.IResolvable protectFromScaleIn) {
            this.protectFromScaleIn = protectFromScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getServiceLinkedRoleArn}
         * @param serviceLinkedRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.
         * @return {@code this}
         */
        public Builder serviceLinkedRoleArn(java.lang.String serviceLinkedRoleArn) {
            this.serviceLinkedRoleArn = serviceLinkedRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getSuspendedProcesses}
         * @param suspendedProcesses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.
         * @return {@code this}
         */
        public Builder suspendedProcesses(java.util.List<java.lang.String> suspendedProcesses) {
            this.suspendedProcesses = suspendedProcesses;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTag}
         * @param tag tag block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
         * @return {@code this}
         */
        public Builder tag(com.hashicorp.cdktf.IResolvable tag) {
            this.tag = tag;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTag}
         * @param tag tag block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
         * @return {@code this}
         */
        public Builder tag(java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupTag> tag) {
            this.tag = tag;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTargetGroupArns}
         * @param targetGroupArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.
         * @return {@code this}
         */
        public Builder targetGroupArns(java.util.List<java.lang.String> targetGroupArns) {
            this.targetGroupArns = targetGroupArns;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTerminationPolicies}
         * @param terminationPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.
         * @return {@code this}
         */
        public Builder terminationPolicies(java.util.List<java.lang.String> terminationPolicies) {
            this.terminationPolicies = terminationPolicies;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.autoscaling_group.AutoscalingGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTrafficSource}
         * @param trafficSource traffic_source block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
         * @return {@code this}
         */
        public Builder trafficSource(com.hashicorp.cdktf.IResolvable trafficSource) {
            this.trafficSource = trafficSource;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getTrafficSource}
         * @param trafficSource traffic_source block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
         * @return {@code this}
         */
        public Builder trafficSource(java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupTrafficSource> trafficSource) {
            this.trafficSource = trafficSource;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getVpcZoneIdentifier}
         * @param vpcZoneIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.
         * @return {@code this}
         */
        public Builder vpcZoneIdentifier(java.util.List<java.lang.String> vpcZoneIdentifier) {
            this.vpcZoneIdentifier = vpcZoneIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getWaitForCapacityTimeout}
         * @param waitForCapacityTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.
         * @return {@code this}
         */
        public Builder waitForCapacityTimeout(java.lang.String waitForCapacityTimeout) {
            this.waitForCapacityTimeout = waitForCapacityTimeout;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getWaitForElbCapacity}
         * @param waitForElbCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.
         * @return {@code this}
         */
        public Builder waitForElbCapacity(java.lang.Number waitForElbCapacity) {
            this.waitForElbCapacity = waitForElbCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getWarmPool}
         * @param warmPool warm_pool block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
         * @return {@code this}
         */
        public Builder warmPool(imports.aws.autoscaling_group.AutoscalingGroupWarmPool warmPool) {
            this.warmPool = warmPool;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getDependsOn}
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
         * Sets the value of {@link AutoscalingGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupConfig#getProvisioners}
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
         * @return a new instance of {@link AutoscalingGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupConfig {
        private final java.lang.Number maxSize;
        private final java.lang.Number minSize;
        private final imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution availabilityZoneDistribution;
        private final java.util.List<java.lang.String> availabilityZones;
        private final java.lang.Object capacityRebalance;
        private final imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification capacityReservationSpecification;
        private final java.lang.String context;
        private final java.lang.Number defaultCooldown;
        private final java.lang.Number defaultInstanceWarmup;
        private final java.lang.Number desiredCapacity;
        private final java.lang.String desiredCapacityType;
        private final java.util.List<java.lang.String> enabledMetrics;
        private final java.lang.Object forceDelete;
        private final java.lang.Object forceDeleteWarmPool;
        private final java.lang.Number healthCheckGracePeriod;
        private final java.lang.String healthCheckType;
        private final java.lang.String id;
        private final java.lang.Object ignoreFailedScalingActivities;
        private final java.lang.Object initialLifecycleHook;
        private final imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy instanceMaintenancePolicy;
        private final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh instanceRefresh;
        private final java.lang.String launchConfiguration;
        private final imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate launchTemplate;
        private final java.util.List<java.lang.String> loadBalancers;
        private final java.lang.Number maxInstanceLifetime;
        private final java.lang.String metricsGranularity;
        private final java.lang.Number minElbCapacity;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy mixedInstancesPolicy;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String placementGroup;
        private final java.lang.Object protectFromScaleIn;
        private final java.lang.String serviceLinkedRoleArn;
        private final java.util.List<java.lang.String> suspendedProcesses;
        private final java.lang.Object tag;
        private final java.util.List<java.lang.String> targetGroupArns;
        private final java.util.List<java.lang.String> terminationPolicies;
        private final imports.aws.autoscaling_group.AutoscalingGroupTimeouts timeouts;
        private final java.lang.Object trafficSource;
        private final java.util.List<java.lang.String> vpcZoneIdentifier;
        private final java.lang.String waitForCapacityTimeout;
        private final java.lang.Number waitForElbCapacity;
        private final imports.aws.autoscaling_group.AutoscalingGroupWarmPool warmPool;
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
            this.maxSize = software.amazon.jsii.Kernel.get(this, "maxSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minSize = software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.availabilityZoneDistribution = software.amazon.jsii.Kernel.get(this, "availabilityZoneDistribution", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution.class));
            this.availabilityZones = software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.capacityRebalance = software.amazon.jsii.Kernel.get(this, "capacityRebalance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.capacityReservationSpecification = software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification.class));
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultCooldown = software.amazon.jsii.Kernel.get(this, "defaultCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.defaultInstanceWarmup = software.amazon.jsii.Kernel.get(this, "defaultInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredCapacity = software.amazon.jsii.Kernel.get(this, "desiredCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredCapacityType = software.amazon.jsii.Kernel.get(this, "desiredCapacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabledMetrics = software.amazon.jsii.Kernel.get(this, "enabledMetrics", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.forceDelete = software.amazon.jsii.Kernel.get(this, "forceDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceDeleteWarmPool = software.amazon.jsii.Kernel.get(this, "forceDeleteWarmPool", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheckGracePeriod = software.amazon.jsii.Kernel.get(this, "healthCheckGracePeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthCheckType = software.amazon.jsii.Kernel.get(this, "healthCheckType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignoreFailedScalingActivities = software.amazon.jsii.Kernel.get(this, "ignoreFailedScalingActivities", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.initialLifecycleHook = software.amazon.jsii.Kernel.get(this, "initialLifecycleHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.instanceMaintenancePolicy = software.amazon.jsii.Kernel.get(this, "instanceMaintenancePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy.class));
            this.instanceRefresh = software.amazon.jsii.Kernel.get(this, "instanceRefresh", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh.class));
            this.launchConfiguration = software.amazon.jsii.Kernel.get(this, "launchConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate.class));
            this.loadBalancers = software.amazon.jsii.Kernel.get(this, "loadBalancers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxInstanceLifetime = software.amazon.jsii.Kernel.get(this, "maxInstanceLifetime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.metricsGranularity = software.amazon.jsii.Kernel.get(this, "metricsGranularity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minElbCapacity = software.amazon.jsii.Kernel.get(this, "minElbCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mixedInstancesPolicy = software.amazon.jsii.Kernel.get(this, "mixedInstancesPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementGroup = software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protectFromScaleIn = software.amazon.jsii.Kernel.get(this, "protectFromScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serviceLinkedRoleArn = software.amazon.jsii.Kernel.get(this, "serviceLinkedRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.suspendedProcesses = software.amazon.jsii.Kernel.get(this, "suspendedProcesses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tag = software.amazon.jsii.Kernel.get(this, "tag", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetGroupArns = software.amazon.jsii.Kernel.get(this, "targetGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.terminationPolicies = software.amazon.jsii.Kernel.get(this, "terminationPolicies", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupTimeouts.class));
            this.trafficSource = software.amazon.jsii.Kernel.get(this, "trafficSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpcZoneIdentifier = software.amazon.jsii.Kernel.get(this, "vpcZoneIdentifier", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.waitForCapacityTimeout = software.amazon.jsii.Kernel.get(this, "waitForCapacityTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.waitForElbCapacity = software.amazon.jsii.Kernel.get(this, "waitForElbCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.warmPool = software.amazon.jsii.Kernel.get(this, "warmPool", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupWarmPool.class));
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
            this.maxSize = java.util.Objects.requireNonNull(builder.maxSize, "maxSize is required");
            this.minSize = java.util.Objects.requireNonNull(builder.minSize, "minSize is required");
            this.availabilityZoneDistribution = builder.availabilityZoneDistribution;
            this.availabilityZones = builder.availabilityZones;
            this.capacityRebalance = builder.capacityRebalance;
            this.capacityReservationSpecification = builder.capacityReservationSpecification;
            this.context = builder.context;
            this.defaultCooldown = builder.defaultCooldown;
            this.defaultInstanceWarmup = builder.defaultInstanceWarmup;
            this.desiredCapacity = builder.desiredCapacity;
            this.desiredCapacityType = builder.desiredCapacityType;
            this.enabledMetrics = builder.enabledMetrics;
            this.forceDelete = builder.forceDelete;
            this.forceDeleteWarmPool = builder.forceDeleteWarmPool;
            this.healthCheckGracePeriod = builder.healthCheckGracePeriod;
            this.healthCheckType = builder.healthCheckType;
            this.id = builder.id;
            this.ignoreFailedScalingActivities = builder.ignoreFailedScalingActivities;
            this.initialLifecycleHook = builder.initialLifecycleHook;
            this.instanceMaintenancePolicy = builder.instanceMaintenancePolicy;
            this.instanceRefresh = builder.instanceRefresh;
            this.launchConfiguration = builder.launchConfiguration;
            this.launchTemplate = builder.launchTemplate;
            this.loadBalancers = builder.loadBalancers;
            this.maxInstanceLifetime = builder.maxInstanceLifetime;
            this.metricsGranularity = builder.metricsGranularity;
            this.minElbCapacity = builder.minElbCapacity;
            this.mixedInstancesPolicy = builder.mixedInstancesPolicy;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.placementGroup = builder.placementGroup;
            this.protectFromScaleIn = builder.protectFromScaleIn;
            this.serviceLinkedRoleArn = builder.serviceLinkedRoleArn;
            this.suspendedProcesses = builder.suspendedProcesses;
            this.tag = builder.tag;
            this.targetGroupArns = builder.targetGroupArns;
            this.terminationPolicies = builder.terminationPolicies;
            this.timeouts = builder.timeouts;
            this.trafficSource = builder.trafficSource;
            this.vpcZoneIdentifier = builder.vpcZoneIdentifier;
            this.waitForCapacityTimeout = builder.waitForCapacityTimeout;
            this.waitForElbCapacity = builder.waitForElbCapacity;
            this.warmPool = builder.warmPool;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getMaxSize() {
            return this.maxSize;
        }

        @Override
        public final java.lang.Number getMinSize() {
            return this.minSize;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution getAvailabilityZoneDistribution() {
            return this.availabilityZoneDistribution;
        }

        @Override
        public final java.util.List<java.lang.String> getAvailabilityZones() {
            return this.availabilityZones;
        }

        @Override
        public final java.lang.Object getCapacityRebalance() {
            return this.capacityRebalance;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification getCapacityReservationSpecification() {
            return this.capacityReservationSpecification;
        }

        @Override
        public final java.lang.String getContext() {
            return this.context;
        }

        @Override
        public final java.lang.Number getDefaultCooldown() {
            return this.defaultCooldown;
        }

        @Override
        public final java.lang.Number getDefaultInstanceWarmup() {
            return this.defaultInstanceWarmup;
        }

        @Override
        public final java.lang.Number getDesiredCapacity() {
            return this.desiredCapacity;
        }

        @Override
        public final java.lang.String getDesiredCapacityType() {
            return this.desiredCapacityType;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledMetrics() {
            return this.enabledMetrics;
        }

        @Override
        public final java.lang.Object getForceDelete() {
            return this.forceDelete;
        }

        @Override
        public final java.lang.Object getForceDeleteWarmPool() {
            return this.forceDeleteWarmPool;
        }

        @Override
        public final java.lang.Number getHealthCheckGracePeriod() {
            return this.healthCheckGracePeriod;
        }

        @Override
        public final java.lang.String getHealthCheckType() {
            return this.healthCheckType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIgnoreFailedScalingActivities() {
            return this.ignoreFailedScalingActivities;
        }

        @Override
        public final java.lang.Object getInitialLifecycleHook() {
            return this.initialLifecycleHook;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy getInstanceMaintenancePolicy() {
            return this.instanceMaintenancePolicy;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh getInstanceRefresh() {
            return this.instanceRefresh;
        }

        @Override
        public final java.lang.String getLaunchConfiguration() {
            return this.launchConfiguration;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final java.util.List<java.lang.String> getLoadBalancers() {
            return this.loadBalancers;
        }

        @Override
        public final java.lang.Number getMaxInstanceLifetime() {
            return this.maxInstanceLifetime;
        }

        @Override
        public final java.lang.String getMetricsGranularity() {
            return this.metricsGranularity;
        }

        @Override
        public final java.lang.Number getMinElbCapacity() {
            return this.minElbCapacity;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy getMixedInstancesPolicy() {
            return this.mixedInstancesPolicy;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.String getPlacementGroup() {
            return this.placementGroup;
        }

        @Override
        public final java.lang.Object getProtectFromScaleIn() {
            return this.protectFromScaleIn;
        }

        @Override
        public final java.lang.String getServiceLinkedRoleArn() {
            return this.serviceLinkedRoleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getSuspendedProcesses() {
            return this.suspendedProcesses;
        }

        @Override
        public final java.lang.Object getTag() {
            return this.tag;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetGroupArns() {
            return this.targetGroupArns;
        }

        @Override
        public final java.util.List<java.lang.String> getTerminationPolicies() {
            return this.terminationPolicies;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTrafficSource() {
            return this.trafficSource;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcZoneIdentifier() {
            return this.vpcZoneIdentifier;
        }

        @Override
        public final java.lang.String getWaitForCapacityTimeout() {
            return this.waitForCapacityTimeout;
        }

        @Override
        public final java.lang.Number getWaitForElbCapacity() {
            return this.waitForElbCapacity;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupWarmPool getWarmPool() {
            return this.warmPool;
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

            data.set("maxSize", om.valueToTree(this.getMaxSize()));
            data.set("minSize", om.valueToTree(this.getMinSize()));
            if (this.getAvailabilityZoneDistribution() != null) {
                data.set("availabilityZoneDistribution", om.valueToTree(this.getAvailabilityZoneDistribution()));
            }
            if (this.getAvailabilityZones() != null) {
                data.set("availabilityZones", om.valueToTree(this.getAvailabilityZones()));
            }
            if (this.getCapacityRebalance() != null) {
                data.set("capacityRebalance", om.valueToTree(this.getCapacityRebalance()));
            }
            if (this.getCapacityReservationSpecification() != null) {
                data.set("capacityReservationSpecification", om.valueToTree(this.getCapacityReservationSpecification()));
            }
            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getDefaultCooldown() != null) {
                data.set("defaultCooldown", om.valueToTree(this.getDefaultCooldown()));
            }
            if (this.getDefaultInstanceWarmup() != null) {
                data.set("defaultInstanceWarmup", om.valueToTree(this.getDefaultInstanceWarmup()));
            }
            if (this.getDesiredCapacity() != null) {
                data.set("desiredCapacity", om.valueToTree(this.getDesiredCapacity()));
            }
            if (this.getDesiredCapacityType() != null) {
                data.set("desiredCapacityType", om.valueToTree(this.getDesiredCapacityType()));
            }
            if (this.getEnabledMetrics() != null) {
                data.set("enabledMetrics", om.valueToTree(this.getEnabledMetrics()));
            }
            if (this.getForceDelete() != null) {
                data.set("forceDelete", om.valueToTree(this.getForceDelete()));
            }
            if (this.getForceDeleteWarmPool() != null) {
                data.set("forceDeleteWarmPool", om.valueToTree(this.getForceDeleteWarmPool()));
            }
            if (this.getHealthCheckGracePeriod() != null) {
                data.set("healthCheckGracePeriod", om.valueToTree(this.getHealthCheckGracePeriod()));
            }
            if (this.getHealthCheckType() != null) {
                data.set("healthCheckType", om.valueToTree(this.getHealthCheckType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIgnoreFailedScalingActivities() != null) {
                data.set("ignoreFailedScalingActivities", om.valueToTree(this.getIgnoreFailedScalingActivities()));
            }
            if (this.getInitialLifecycleHook() != null) {
                data.set("initialLifecycleHook", om.valueToTree(this.getInitialLifecycleHook()));
            }
            if (this.getInstanceMaintenancePolicy() != null) {
                data.set("instanceMaintenancePolicy", om.valueToTree(this.getInstanceMaintenancePolicy()));
            }
            if (this.getInstanceRefresh() != null) {
                data.set("instanceRefresh", om.valueToTree(this.getInstanceRefresh()));
            }
            if (this.getLaunchConfiguration() != null) {
                data.set("launchConfiguration", om.valueToTree(this.getLaunchConfiguration()));
            }
            if (this.getLaunchTemplate() != null) {
                data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            }
            if (this.getLoadBalancers() != null) {
                data.set("loadBalancers", om.valueToTree(this.getLoadBalancers()));
            }
            if (this.getMaxInstanceLifetime() != null) {
                data.set("maxInstanceLifetime", om.valueToTree(this.getMaxInstanceLifetime()));
            }
            if (this.getMetricsGranularity() != null) {
                data.set("metricsGranularity", om.valueToTree(this.getMetricsGranularity()));
            }
            if (this.getMinElbCapacity() != null) {
                data.set("minElbCapacity", om.valueToTree(this.getMinElbCapacity()));
            }
            if (this.getMixedInstancesPolicy() != null) {
                data.set("mixedInstancesPolicy", om.valueToTree(this.getMixedInstancesPolicy()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPlacementGroup() != null) {
                data.set("placementGroup", om.valueToTree(this.getPlacementGroup()));
            }
            if (this.getProtectFromScaleIn() != null) {
                data.set("protectFromScaleIn", om.valueToTree(this.getProtectFromScaleIn()));
            }
            if (this.getServiceLinkedRoleArn() != null) {
                data.set("serviceLinkedRoleArn", om.valueToTree(this.getServiceLinkedRoleArn()));
            }
            if (this.getSuspendedProcesses() != null) {
                data.set("suspendedProcesses", om.valueToTree(this.getSuspendedProcesses()));
            }
            if (this.getTag() != null) {
                data.set("tag", om.valueToTree(this.getTag()));
            }
            if (this.getTargetGroupArns() != null) {
                data.set("targetGroupArns", om.valueToTree(this.getTargetGroupArns()));
            }
            if (this.getTerminationPolicies() != null) {
                data.set("terminationPolicies", om.valueToTree(this.getTerminationPolicies()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTrafficSource() != null) {
                data.set("trafficSource", om.valueToTree(this.getTrafficSource()));
            }
            if (this.getVpcZoneIdentifier() != null) {
                data.set("vpcZoneIdentifier", om.valueToTree(this.getVpcZoneIdentifier()));
            }
            if (this.getWaitForCapacityTimeout() != null) {
                data.set("waitForCapacityTimeout", om.valueToTree(this.getWaitForCapacityTimeout()));
            }
            if (this.getWaitForElbCapacity() != null) {
                data.set("waitForElbCapacity", om.valueToTree(this.getWaitForElbCapacity()));
            }
            if (this.getWarmPool() != null) {
                data.set("warmPool", om.valueToTree(this.getWarmPool()));
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
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupConfig.Jsii$Proxy that = (AutoscalingGroupConfig.Jsii$Proxy) o;

            if (!maxSize.equals(that.maxSize)) return false;
            if (!minSize.equals(that.minSize)) return false;
            if (this.availabilityZoneDistribution != null ? !this.availabilityZoneDistribution.equals(that.availabilityZoneDistribution) : that.availabilityZoneDistribution != null) return false;
            if (this.availabilityZones != null ? !this.availabilityZones.equals(that.availabilityZones) : that.availabilityZones != null) return false;
            if (this.capacityRebalance != null ? !this.capacityRebalance.equals(that.capacityRebalance) : that.capacityRebalance != null) return false;
            if (this.capacityReservationSpecification != null ? !this.capacityReservationSpecification.equals(that.capacityReservationSpecification) : that.capacityReservationSpecification != null) return false;
            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            if (this.defaultCooldown != null ? !this.defaultCooldown.equals(that.defaultCooldown) : that.defaultCooldown != null) return false;
            if (this.defaultInstanceWarmup != null ? !this.defaultInstanceWarmup.equals(that.defaultInstanceWarmup) : that.defaultInstanceWarmup != null) return false;
            if (this.desiredCapacity != null ? !this.desiredCapacity.equals(that.desiredCapacity) : that.desiredCapacity != null) return false;
            if (this.desiredCapacityType != null ? !this.desiredCapacityType.equals(that.desiredCapacityType) : that.desiredCapacityType != null) return false;
            if (this.enabledMetrics != null ? !this.enabledMetrics.equals(that.enabledMetrics) : that.enabledMetrics != null) return false;
            if (this.forceDelete != null ? !this.forceDelete.equals(that.forceDelete) : that.forceDelete != null) return false;
            if (this.forceDeleteWarmPool != null ? !this.forceDeleteWarmPool.equals(that.forceDeleteWarmPool) : that.forceDeleteWarmPool != null) return false;
            if (this.healthCheckGracePeriod != null ? !this.healthCheckGracePeriod.equals(that.healthCheckGracePeriod) : that.healthCheckGracePeriod != null) return false;
            if (this.healthCheckType != null ? !this.healthCheckType.equals(that.healthCheckType) : that.healthCheckType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ignoreFailedScalingActivities != null ? !this.ignoreFailedScalingActivities.equals(that.ignoreFailedScalingActivities) : that.ignoreFailedScalingActivities != null) return false;
            if (this.initialLifecycleHook != null ? !this.initialLifecycleHook.equals(that.initialLifecycleHook) : that.initialLifecycleHook != null) return false;
            if (this.instanceMaintenancePolicy != null ? !this.instanceMaintenancePolicy.equals(that.instanceMaintenancePolicy) : that.instanceMaintenancePolicy != null) return false;
            if (this.instanceRefresh != null ? !this.instanceRefresh.equals(that.instanceRefresh) : that.instanceRefresh != null) return false;
            if (this.launchConfiguration != null ? !this.launchConfiguration.equals(that.launchConfiguration) : that.launchConfiguration != null) return false;
            if (this.launchTemplate != null ? !this.launchTemplate.equals(that.launchTemplate) : that.launchTemplate != null) return false;
            if (this.loadBalancers != null ? !this.loadBalancers.equals(that.loadBalancers) : that.loadBalancers != null) return false;
            if (this.maxInstanceLifetime != null ? !this.maxInstanceLifetime.equals(that.maxInstanceLifetime) : that.maxInstanceLifetime != null) return false;
            if (this.metricsGranularity != null ? !this.metricsGranularity.equals(that.metricsGranularity) : that.metricsGranularity != null) return false;
            if (this.minElbCapacity != null ? !this.minElbCapacity.equals(that.minElbCapacity) : that.minElbCapacity != null) return false;
            if (this.mixedInstancesPolicy != null ? !this.mixedInstancesPolicy.equals(that.mixedInstancesPolicy) : that.mixedInstancesPolicy != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.placementGroup != null ? !this.placementGroup.equals(that.placementGroup) : that.placementGroup != null) return false;
            if (this.protectFromScaleIn != null ? !this.protectFromScaleIn.equals(that.protectFromScaleIn) : that.protectFromScaleIn != null) return false;
            if (this.serviceLinkedRoleArn != null ? !this.serviceLinkedRoleArn.equals(that.serviceLinkedRoleArn) : that.serviceLinkedRoleArn != null) return false;
            if (this.suspendedProcesses != null ? !this.suspendedProcesses.equals(that.suspendedProcesses) : that.suspendedProcesses != null) return false;
            if (this.tag != null ? !this.tag.equals(that.tag) : that.tag != null) return false;
            if (this.targetGroupArns != null ? !this.targetGroupArns.equals(that.targetGroupArns) : that.targetGroupArns != null) return false;
            if (this.terminationPolicies != null ? !this.terminationPolicies.equals(that.terminationPolicies) : that.terminationPolicies != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.trafficSource != null ? !this.trafficSource.equals(that.trafficSource) : that.trafficSource != null) return false;
            if (this.vpcZoneIdentifier != null ? !this.vpcZoneIdentifier.equals(that.vpcZoneIdentifier) : that.vpcZoneIdentifier != null) return false;
            if (this.waitForCapacityTimeout != null ? !this.waitForCapacityTimeout.equals(that.waitForCapacityTimeout) : that.waitForCapacityTimeout != null) return false;
            if (this.waitForElbCapacity != null ? !this.waitForElbCapacity.equals(that.waitForElbCapacity) : that.waitForElbCapacity != null) return false;
            if (this.warmPool != null ? !this.warmPool.equals(that.warmPool) : that.warmPool != null) return false;
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
            int result = this.maxSize.hashCode();
            result = 31 * result + (this.minSize.hashCode());
            result = 31 * result + (this.availabilityZoneDistribution != null ? this.availabilityZoneDistribution.hashCode() : 0);
            result = 31 * result + (this.availabilityZones != null ? this.availabilityZones.hashCode() : 0);
            result = 31 * result + (this.capacityRebalance != null ? this.capacityRebalance.hashCode() : 0);
            result = 31 * result + (this.capacityReservationSpecification != null ? this.capacityReservationSpecification.hashCode() : 0);
            result = 31 * result + (this.context != null ? this.context.hashCode() : 0);
            result = 31 * result + (this.defaultCooldown != null ? this.defaultCooldown.hashCode() : 0);
            result = 31 * result + (this.defaultInstanceWarmup != null ? this.defaultInstanceWarmup.hashCode() : 0);
            result = 31 * result + (this.desiredCapacity != null ? this.desiredCapacity.hashCode() : 0);
            result = 31 * result + (this.desiredCapacityType != null ? this.desiredCapacityType.hashCode() : 0);
            result = 31 * result + (this.enabledMetrics != null ? this.enabledMetrics.hashCode() : 0);
            result = 31 * result + (this.forceDelete != null ? this.forceDelete.hashCode() : 0);
            result = 31 * result + (this.forceDeleteWarmPool != null ? this.forceDeleteWarmPool.hashCode() : 0);
            result = 31 * result + (this.healthCheckGracePeriod != null ? this.healthCheckGracePeriod.hashCode() : 0);
            result = 31 * result + (this.healthCheckType != null ? this.healthCheckType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ignoreFailedScalingActivities != null ? this.ignoreFailedScalingActivities.hashCode() : 0);
            result = 31 * result + (this.initialLifecycleHook != null ? this.initialLifecycleHook.hashCode() : 0);
            result = 31 * result + (this.instanceMaintenancePolicy != null ? this.instanceMaintenancePolicy.hashCode() : 0);
            result = 31 * result + (this.instanceRefresh != null ? this.instanceRefresh.hashCode() : 0);
            result = 31 * result + (this.launchConfiguration != null ? this.launchConfiguration.hashCode() : 0);
            result = 31 * result + (this.launchTemplate != null ? this.launchTemplate.hashCode() : 0);
            result = 31 * result + (this.loadBalancers != null ? this.loadBalancers.hashCode() : 0);
            result = 31 * result + (this.maxInstanceLifetime != null ? this.maxInstanceLifetime.hashCode() : 0);
            result = 31 * result + (this.metricsGranularity != null ? this.metricsGranularity.hashCode() : 0);
            result = 31 * result + (this.minElbCapacity != null ? this.minElbCapacity.hashCode() : 0);
            result = 31 * result + (this.mixedInstancesPolicy != null ? this.mixedInstancesPolicy.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.placementGroup != null ? this.placementGroup.hashCode() : 0);
            result = 31 * result + (this.protectFromScaleIn != null ? this.protectFromScaleIn.hashCode() : 0);
            result = 31 * result + (this.serviceLinkedRoleArn != null ? this.serviceLinkedRoleArn.hashCode() : 0);
            result = 31 * result + (this.suspendedProcesses != null ? this.suspendedProcesses.hashCode() : 0);
            result = 31 * result + (this.tag != null ? this.tag.hashCode() : 0);
            result = 31 * result + (this.targetGroupArns != null ? this.targetGroupArns.hashCode() : 0);
            result = 31 * result + (this.terminationPolicies != null ? this.terminationPolicies.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.trafficSource != null ? this.trafficSource.hashCode() : 0);
            result = 31 * result + (this.vpcZoneIdentifier != null ? this.vpcZoneIdentifier.hashCode() : 0);
            result = 31 * result + (this.waitForCapacityTimeout != null ? this.waitForCapacityTimeout.hashCode() : 0);
            result = 31 * result + (this.waitForElbCapacity != null ? this.waitForElbCapacity.hashCode() : 0);
            result = 31 * result + (this.warmPool != null ? this.warmPool.hashCode() : 0);
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

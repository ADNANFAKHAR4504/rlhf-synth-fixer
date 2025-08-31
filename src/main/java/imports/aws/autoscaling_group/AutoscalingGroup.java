package imports.aws.autoscaling_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group aws_autoscaling_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.090Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroup")
public class AutoscalingGroup extends com.hashicorp.cdktf.TerraformResource {

    protected AutoscalingGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.autoscaling_group.AutoscalingGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group aws_autoscaling_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AutoscalingGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingGroup to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AutoscalingGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_group.AutoscalingGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingGroup to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_group.AutoscalingGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAvailabilityZoneDistribution(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution value) {
        software.amazon.jsii.Kernel.call(this, "putAvailabilityZoneDistribution", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCapacityReservationSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInitialLifecycleHook(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInitialLifecycleHook", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceMaintenancePolicy(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceMaintenancePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceRefresh(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceRefresh", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMixedInstancesPolicy(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putMixedInstancesPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTag(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTag>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTag> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTag>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_group.AutoscalingGroupTag __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTag", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTrafficSource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTrafficSource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTrafficSource> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_group.AutoscalingGroupTrafficSource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_group.AutoscalingGroupTrafficSource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTrafficSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWarmPool(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupWarmPool value) {
        software.amazon.jsii.Kernel.call(this, "putWarmPool", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAvailabilityZoneDistribution() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneDistribution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZones() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZones", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityRebalance() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityRebalance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultCooldown() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultCooldown", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultInstanceWarmup() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultInstanceWarmup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredCapacityType() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredCapacityType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabledMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetEnabledMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDelete() {
        software.amazon.jsii.Kernel.call(this, "resetForceDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDeleteWarmPool() {
        software.amazon.jsii.Kernel.call(this, "resetForceDeleteWarmPool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckGracePeriod() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckGracePeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckType() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreFailedScalingActivities() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreFailedScalingActivities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialLifecycleHook() {
        software.amazon.jsii.Kernel.call(this, "resetInitialLifecycleHook", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceMaintenancePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceMaintenancePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceRefresh() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceRefresh", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancers() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxInstanceLifetime() {
        software.amazon.jsii.Kernel.call(this, "resetMaxInstanceLifetime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricsGranularity() {
        software.amazon.jsii.Kernel.call(this, "resetMetricsGranularity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinElbCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMinElbCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMixedInstancesPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetMixedInstancesPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementGroup() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtectFromScaleIn() {
        software.amazon.jsii.Kernel.call(this, "resetProtectFromScaleIn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceLinkedRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceLinkedRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuspendedProcesses() {
        software.amazon.jsii.Kernel.call(this, "resetSuspendedProcesses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTag() {
        software.amazon.jsii.Kernel.call(this, "resetTag", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupArns() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminationPolicies() {
        software.amazon.jsii.Kernel.call(this, "resetTerminationPolicies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrafficSource() {
        software.amazon.jsii.Kernel.call(this, "resetTrafficSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcZoneIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetVpcZoneIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForCapacityTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForCapacityTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForElbCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForElbCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarmPool() {
        software.amazon.jsii.Kernel.call(this, "resetWarmPool", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistributionOutputReference getAvailabilityZoneDistribution() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneDistribution", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistributionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecificationOutputReference getCapacityReservationSpecification() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHookList getInitialLifecycleHook() {
        return software.amazon.jsii.Kernel.get(this, "initialLifecycleHook", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHookList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicyOutputReference getInstanceMaintenancePolicy() {
        return software.amazon.jsii.Kernel.get(this, "instanceMaintenancePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshOutputReference getInstanceRefresh() {
        return software.amazon.jsii.Kernel.get(this, "instanceRefresh", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyOutputReference getMixedInstancesPolicy() {
        return software.amazon.jsii.Kernel.get(this, "mixedInstancesPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPredictedCapacity() {
        return software.amazon.jsii.Kernel.get(this, "predictedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupTagList getTag() {
        return software.amazon.jsii.Kernel.get(this, "tag", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupTagList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupTrafficSourceList getTrafficSource() {
        return software.amazon.jsii.Kernel.get(this, "trafficSource", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupTrafficSourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupWarmPoolOutputReference getWarmPool() {
        return software.amazon.jsii.Kernel.get(this, "warmPool", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupWarmPoolOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWarmPoolSize() {
        return software.amazon.jsii.Kernel.get(this, "warmPoolSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution getAvailabilityZoneDistributionInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneDistributionInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZonesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "availabilityZonesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCapacityRebalanceInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityRebalanceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification getCapacityReservationSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContextInput() {
        return software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultCooldownInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultCooldownInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultInstanceWarmupInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultInstanceWarmupInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDesiredCapacityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledMetricsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledMetricsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDeleteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDeleteWarmPoolInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDeleteWarmPoolInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckGracePeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckGracePeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreFailedScalingActivitiesInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreFailedScalingActivitiesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInitialLifecycleHookInput() {
        return software.amazon.jsii.Kernel.get(this, "initialLifecycleHookInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy getInstanceMaintenancePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceMaintenancePolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh getInstanceRefreshInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceRefreshInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "launchConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLoadBalancersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "loadBalancersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxInstanceLifetimeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxInstanceLifetimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricsGranularityInput() {
        return software.amazon.jsii.Kernel.get(this, "metricsGranularityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinElbCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "minElbCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "minSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy getMixedInstancesPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "mixedInstancesPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "placementGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProtectFromScaleInInput() {
        return software.amazon.jsii.Kernel.get(this, "protectFromScaleInInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceLinkedRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceLinkedRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSuspendedProcessesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "suspendedProcessesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTagInput() {
        return software.amazon.jsii.Kernel.get(this, "tagInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetGroupArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "targetGroupArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTerminationPoliciesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "terminationPoliciesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTrafficSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcZoneIdentifierInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcZoneIdentifierInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWaitForCapacityTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForCapacityTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitForElbCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForElbCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupWarmPool getWarmPoolInput() {
        return software.amazon.jsii.Kernel.get(this, "warmPoolInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupWarmPool.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAvailabilityZones(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZones", java.util.Objects.requireNonNull(value, "availabilityZones is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCapacityRebalance() {
        return software.amazon.jsii.Kernel.get(this, "capacityRebalance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCapacityRebalance(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "capacityRebalance", java.util.Objects.requireNonNull(value, "capacityRebalance is required"));
    }

    public void setCapacityRebalance(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "capacityRebalance", java.util.Objects.requireNonNull(value, "capacityRebalance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContext() {
        return software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContext(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "context", java.util.Objects.requireNonNull(value, "context is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultCooldown() {
        return software.amazon.jsii.Kernel.get(this, "defaultCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultCooldown(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultCooldown", java.util.Objects.requireNonNull(value, "defaultCooldown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultInstanceWarmup() {
        return software.amazon.jsii.Kernel.get(this, "defaultInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultInstanceWarmup(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultInstanceWarmup", java.util.Objects.requireNonNull(value, "defaultInstanceWarmup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredCapacity() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredCapacity", java.util.Objects.requireNonNull(value, "desiredCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDesiredCapacityType() {
        return software.amazon.jsii.Kernel.get(this, "desiredCapacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDesiredCapacityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "desiredCapacityType", java.util.Objects.requireNonNull(value, "desiredCapacityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledMetrics() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledMetrics", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledMetrics(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledMetrics", java.util.Objects.requireNonNull(value, "enabledMetrics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDelete() {
        return software.amazon.jsii.Kernel.get(this, "forceDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDelete(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDelete", java.util.Objects.requireNonNull(value, "forceDelete is required"));
    }

    public void setForceDelete(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDelete", java.util.Objects.requireNonNull(value, "forceDelete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDeleteWarmPool() {
        return software.amazon.jsii.Kernel.get(this, "forceDeleteWarmPool", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDeleteWarmPool(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDeleteWarmPool", java.util.Objects.requireNonNull(value, "forceDeleteWarmPool is required"));
    }

    public void setForceDeleteWarmPool(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDeleteWarmPool", java.util.Objects.requireNonNull(value, "forceDeleteWarmPool is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHealthCheckGracePeriod() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckGracePeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHealthCheckGracePeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckGracePeriod", java.util.Objects.requireNonNull(value, "healthCheckGracePeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHealthCheckType() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHealthCheckType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckType", java.util.Objects.requireNonNull(value, "healthCheckType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnoreFailedScalingActivities() {
        return software.amazon.jsii.Kernel.get(this, "ignoreFailedScalingActivities", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnoreFailedScalingActivities(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignoreFailedScalingActivities", java.util.Objects.requireNonNull(value, "ignoreFailedScalingActivities is required"));
    }

    public void setIgnoreFailedScalingActivities(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignoreFailedScalingActivities", java.util.Objects.requireNonNull(value, "ignoreFailedScalingActivities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "launchConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchConfiguration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchConfiguration", java.util.Objects.requireNonNull(value, "launchConfiguration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLoadBalancers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "loadBalancers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLoadBalancers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancers", java.util.Objects.requireNonNull(value, "loadBalancers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxInstanceLifetime() {
        return software.amazon.jsii.Kernel.get(this, "maxInstanceLifetime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxInstanceLifetime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxInstanceLifetime", java.util.Objects.requireNonNull(value, "maxInstanceLifetime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSize() {
        return software.amazon.jsii.Kernel.get(this, "maxSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSize", java.util.Objects.requireNonNull(value, "maxSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricsGranularity() {
        return software.amazon.jsii.Kernel.get(this, "metricsGranularity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricsGranularity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricsGranularity", java.util.Objects.requireNonNull(value, "metricsGranularity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinElbCapacity() {
        return software.amazon.jsii.Kernel.get(this, "minElbCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinElbCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minElbCapacity", java.util.Objects.requireNonNull(value, "minElbCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinSize() {
        return software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minSize", java.util.Objects.requireNonNull(value, "minSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlacementGroup() {
        return software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlacementGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "placementGroup", java.util.Objects.requireNonNull(value, "placementGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getProtectFromScaleIn() {
        return software.amazon.jsii.Kernel.get(this, "protectFromScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setProtectFromScaleIn(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "protectFromScaleIn", java.util.Objects.requireNonNull(value, "protectFromScaleIn is required"));
    }

    public void setProtectFromScaleIn(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "protectFromScaleIn", java.util.Objects.requireNonNull(value, "protectFromScaleIn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceLinkedRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceLinkedRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceLinkedRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceLinkedRoleArn", java.util.Objects.requireNonNull(value, "serviceLinkedRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSuspendedProcesses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "suspendedProcesses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSuspendedProcesses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "suspendedProcesses", java.util.Objects.requireNonNull(value, "suspendedProcesses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetGroupArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "targetGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTargetGroupArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "targetGroupArns", java.util.Objects.requireNonNull(value, "targetGroupArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTerminationPolicies() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "terminationPolicies", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTerminationPolicies(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "terminationPolicies", java.util.Objects.requireNonNull(value, "terminationPolicies is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcZoneIdentifier() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcZoneIdentifier", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcZoneIdentifier(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcZoneIdentifier", java.util.Objects.requireNonNull(value, "vpcZoneIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWaitForCapacityTimeout() {
        return software.amazon.jsii.Kernel.get(this, "waitForCapacityTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWaitForCapacityTimeout(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "waitForCapacityTimeout", java.util.Objects.requireNonNull(value, "waitForCapacityTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitForElbCapacity() {
        return software.amazon.jsii.Kernel.get(this, "waitForElbCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitForElbCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitForElbCapacity", java.util.Objects.requireNonNull(value, "waitForElbCapacity is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.autoscaling_group.AutoscalingGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.autoscaling_group.AutoscalingGroup> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.autoscaling_group.AutoscalingGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.autoscaling_group.AutoscalingGroupConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}.
         * <p>
         * @return {@code this}
         * @param maxSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}. This parameter is required.
         */
        public Builder maxSize(final java.lang.Number maxSize) {
            this.config.maxSize(maxSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
         * <p>
         * @return {@code this}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}. This parameter is required.
         */
        public Builder minSize(final java.lang.Number minSize) {
            this.config.minSize(minSize);
            return this;
        }

        /**
         * availability_zone_distribution block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
         * <p>
         * @return {@code this}
         * @param availabilityZoneDistribution availability_zone_distribution block. This parameter is required.
         */
        public Builder availabilityZoneDistribution(final imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution availabilityZoneDistribution) {
            this.config.availabilityZoneDistribution(availabilityZoneDistribution);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.
         * <p>
         * @return {@code this}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}. This parameter is required.
         */
        public Builder availabilityZones(final java.util.List<java.lang.String> availabilityZones) {
            this.config.availabilityZones(availabilityZones);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
         * <p>
         * @return {@code this}
         * @param capacityRebalance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}. This parameter is required.
         */
        public Builder capacityRebalance(final java.lang.Boolean capacityRebalance) {
            this.config.capacityRebalance(capacityRebalance);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
         * <p>
         * @return {@code this}
         * @param capacityRebalance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}. This parameter is required.
         */
        public Builder capacityRebalance(final com.hashicorp.cdktf.IResolvable capacityRebalance) {
            this.config.capacityRebalance(capacityRebalance);
            return this;
        }

        /**
         * capacity_reservation_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
         * <p>
         * @return {@code this}
         * @param capacityReservationSpecification capacity_reservation_specification block. This parameter is required.
         */
        public Builder capacityReservationSpecification(final imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecification capacityReservationSpecification) {
            this.config.capacityReservationSpecification(capacityReservationSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.
         * <p>
         * @return {@code this}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}. This parameter is required.
         */
        public Builder context(final java.lang.String context) {
            this.config.context(context);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.
         * <p>
         * @return {@code this}
         * @param defaultCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}. This parameter is required.
         */
        public Builder defaultCooldown(final java.lang.Number defaultCooldown) {
            this.config.defaultCooldown(defaultCooldown);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.
         * <p>
         * @return {@code this}
         * @param defaultInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}. This parameter is required.
         */
        public Builder defaultInstanceWarmup(final java.lang.Number defaultInstanceWarmup) {
            this.config.defaultInstanceWarmup(defaultInstanceWarmup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.
         * <p>
         * @return {@code this}
         * @param desiredCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}. This parameter is required.
         */
        public Builder desiredCapacity(final java.lang.Number desiredCapacity) {
            this.config.desiredCapacity(desiredCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.
         * <p>
         * @return {@code this}
         * @param desiredCapacityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}. This parameter is required.
         */
        public Builder desiredCapacityType(final java.lang.String desiredCapacityType) {
            this.config.desiredCapacityType(desiredCapacityType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.
         * <p>
         * @return {@code this}
         * @param enabledMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}. This parameter is required.
         */
        public Builder enabledMetrics(final java.util.List<java.lang.String> enabledMetrics) {
            this.config.enabledMetrics(enabledMetrics);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
         * <p>
         * @return {@code this}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}. This parameter is required.
         */
        public Builder forceDelete(final java.lang.Boolean forceDelete) {
            this.config.forceDelete(forceDelete);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
         * <p>
         * @return {@code this}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}. This parameter is required.
         */
        public Builder forceDelete(final com.hashicorp.cdktf.IResolvable forceDelete) {
            this.config.forceDelete(forceDelete);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
         * <p>
         * @return {@code this}
         * @param forceDeleteWarmPool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}. This parameter is required.
         */
        public Builder forceDeleteWarmPool(final java.lang.Boolean forceDeleteWarmPool) {
            this.config.forceDeleteWarmPool(forceDeleteWarmPool);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
         * <p>
         * @return {@code this}
         * @param forceDeleteWarmPool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}. This parameter is required.
         */
        public Builder forceDeleteWarmPool(final com.hashicorp.cdktf.IResolvable forceDeleteWarmPool) {
            this.config.forceDeleteWarmPool(forceDeleteWarmPool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.
         * <p>
         * @return {@code this}
         * @param healthCheckGracePeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}. This parameter is required.
         */
        public Builder healthCheckGracePeriod(final java.lang.Number healthCheckGracePeriod) {
            this.config.healthCheckGracePeriod(healthCheckGracePeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.
         * <p>
         * @return {@code this}
         * @param healthCheckType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}. This parameter is required.
         */
        public Builder healthCheckType(final java.lang.String healthCheckType) {
            this.config.healthCheckType(healthCheckType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
         * <p>
         * @return {@code this}
         * @param ignoreFailedScalingActivities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}. This parameter is required.
         */
        public Builder ignoreFailedScalingActivities(final java.lang.Boolean ignoreFailedScalingActivities) {
            this.config.ignoreFailedScalingActivities(ignoreFailedScalingActivities);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
         * <p>
         * @return {@code this}
         * @param ignoreFailedScalingActivities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}. This parameter is required.
         */
        public Builder ignoreFailedScalingActivities(final com.hashicorp.cdktf.IResolvable ignoreFailedScalingActivities) {
            this.config.ignoreFailedScalingActivities(ignoreFailedScalingActivities);
            return this;
        }

        /**
         * initial_lifecycle_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
         * <p>
         * @return {@code this}
         * @param initialLifecycleHook initial_lifecycle_hook block. This parameter is required.
         */
        public Builder initialLifecycleHook(final com.hashicorp.cdktf.IResolvable initialLifecycleHook) {
            this.config.initialLifecycleHook(initialLifecycleHook);
            return this;
        }
        /**
         * initial_lifecycle_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
         * <p>
         * @return {@code this}
         * @param initialLifecycleHook initial_lifecycle_hook block. This parameter is required.
         */
        public Builder initialLifecycleHook(final java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook> initialLifecycleHook) {
            this.config.initialLifecycleHook(initialLifecycleHook);
            return this;
        }

        /**
         * instance_maintenance_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
         * <p>
         * @return {@code this}
         * @param instanceMaintenancePolicy instance_maintenance_policy block. This parameter is required.
         */
        public Builder instanceMaintenancePolicy(final imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy instanceMaintenancePolicy) {
            this.config.instanceMaintenancePolicy(instanceMaintenancePolicy);
            return this;
        }

        /**
         * instance_refresh block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
         * <p>
         * @return {@code this}
         * @param instanceRefresh instance_refresh block. This parameter is required.
         */
        public Builder instanceRefresh(final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh instanceRefresh) {
            this.config.instanceRefresh(instanceRefresh);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.
         * <p>
         * @return {@code this}
         * @param launchConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}. This parameter is required.
         */
        public Builder launchConfiguration(final java.lang.String launchConfiguration) {
            this.config.launchConfiguration(launchConfiguration);
            return this;
        }

        /**
         * launch_template block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
         * <p>
         * @return {@code this}
         * @param launchTemplate launch_template block. This parameter is required.
         */
        public Builder launchTemplate(final imports.aws.autoscaling_group.AutoscalingGroupLaunchTemplate launchTemplate) {
            this.config.launchTemplate(launchTemplate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.
         * <p>
         * @return {@code this}
         * @param loadBalancers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}. This parameter is required.
         */
        public Builder loadBalancers(final java.util.List<java.lang.String> loadBalancers) {
            this.config.loadBalancers(loadBalancers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.
         * <p>
         * @return {@code this}
         * @param maxInstanceLifetime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}. This parameter is required.
         */
        public Builder maxInstanceLifetime(final java.lang.Number maxInstanceLifetime) {
            this.config.maxInstanceLifetime(maxInstanceLifetime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.
         * <p>
         * @return {@code this}
         * @param metricsGranularity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}. This parameter is required.
         */
        public Builder metricsGranularity(final java.lang.String metricsGranularity) {
            this.config.metricsGranularity(metricsGranularity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.
         * <p>
         * @return {@code this}
         * @param minElbCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}. This parameter is required.
         */
        public Builder minElbCapacity(final java.lang.Number minElbCapacity) {
            this.config.minElbCapacity(minElbCapacity);
            return this;
        }

        /**
         * mixed_instances_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
         * <p>
         * @return {@code this}
         * @param mixedInstancesPolicy mixed_instances_policy block. This parameter is required.
         */
        public Builder mixedInstancesPolicy(final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy mixedInstancesPolicy) {
            this.config.mixedInstancesPolicy(mixedInstancesPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.
         * <p>
         * @return {@code this}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}. This parameter is required.
         */
        public Builder placementGroup(final java.lang.String placementGroup) {
            this.config.placementGroup(placementGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
         * <p>
         * @return {@code this}
         * @param protectFromScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}. This parameter is required.
         */
        public Builder protectFromScaleIn(final java.lang.Boolean protectFromScaleIn) {
            this.config.protectFromScaleIn(protectFromScaleIn);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
         * <p>
         * @return {@code this}
         * @param protectFromScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}. This parameter is required.
         */
        public Builder protectFromScaleIn(final com.hashicorp.cdktf.IResolvable protectFromScaleIn) {
            this.config.protectFromScaleIn(protectFromScaleIn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceLinkedRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}. This parameter is required.
         */
        public Builder serviceLinkedRoleArn(final java.lang.String serviceLinkedRoleArn) {
            this.config.serviceLinkedRoleArn(serviceLinkedRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.
         * <p>
         * @return {@code this}
         * @param suspendedProcesses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}. This parameter is required.
         */
        public Builder suspendedProcesses(final java.util.List<java.lang.String> suspendedProcesses) {
            this.config.suspendedProcesses(suspendedProcesses);
            return this;
        }

        /**
         * tag block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
         * <p>
         * @return {@code this}
         * @param tag tag block. This parameter is required.
         */
        public Builder tag(final com.hashicorp.cdktf.IResolvable tag) {
            this.config.tag(tag);
            return this;
        }
        /**
         * tag block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
         * <p>
         * @return {@code this}
         * @param tag tag block. This parameter is required.
         */
        public Builder tag(final java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupTag> tag) {
            this.config.tag(tag);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.
         * <p>
         * @return {@code this}
         * @param targetGroupArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}. This parameter is required.
         */
        public Builder targetGroupArns(final java.util.List<java.lang.String> targetGroupArns) {
            this.config.targetGroupArns(targetGroupArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.
         * <p>
         * @return {@code this}
         * @param terminationPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}. This parameter is required.
         */
        public Builder terminationPolicies(final java.util.List<java.lang.String> terminationPolicies) {
            this.config.terminationPolicies(terminationPolicies);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.autoscaling_group.AutoscalingGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * traffic_source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
         * <p>
         * @return {@code this}
         * @param trafficSource traffic_source block. This parameter is required.
         */
        public Builder trafficSource(final com.hashicorp.cdktf.IResolvable trafficSource) {
            this.config.trafficSource(trafficSource);
            return this;
        }
        /**
         * traffic_source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
         * <p>
         * @return {@code this}
         * @param trafficSource traffic_source block. This parameter is required.
         */
        public Builder trafficSource(final java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupTrafficSource> trafficSource) {
            this.config.trafficSource(trafficSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.
         * <p>
         * @return {@code this}
         * @param vpcZoneIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}. This parameter is required.
         */
        public Builder vpcZoneIdentifier(final java.util.List<java.lang.String> vpcZoneIdentifier) {
            this.config.vpcZoneIdentifier(vpcZoneIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.
         * <p>
         * @return {@code this}
         * @param waitForCapacityTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}. This parameter is required.
         */
        public Builder waitForCapacityTimeout(final java.lang.String waitForCapacityTimeout) {
            this.config.waitForCapacityTimeout(waitForCapacityTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.
         * <p>
         * @return {@code this}
         * @param waitForElbCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}. This parameter is required.
         */
        public Builder waitForElbCapacity(final java.lang.Number waitForElbCapacity) {
            this.config.waitForElbCapacity(waitForElbCapacity);
            return this;
        }

        /**
         * warm_pool block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
         * <p>
         * @return {@code this}
         * @param warmPool warm_pool block. This parameter is required.
         */
        public Builder warmPool(final imports.aws.autoscaling_group.AutoscalingGroupWarmPool warmPool) {
            this.config.warmPool(warmPool);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.autoscaling_group.AutoscalingGroup}.
         */
        @Override
        public imports.aws.autoscaling_group.AutoscalingGroup build() {
            return new imports.aws.autoscaling_group.AutoscalingGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

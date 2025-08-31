package imports.aws.spot_fleet_request;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request aws_spot_fleet_request}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequest")
public class SpotFleetRequest extends com.hashicorp.cdktf.TerraformResource {

    protected SpotFleetRequest(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotFleetRequest(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.spot_fleet_request.SpotFleetRequest.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request aws_spot_fleet_request} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SpotFleetRequest(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SpotFleetRequest resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SpotFleetRequest to import. This parameter is required.
     * @param importFromId The id of the existing SpotFleetRequest that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SpotFleetRequest to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.spot_fleet_request.SpotFleetRequest.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SpotFleetRequest resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SpotFleetRequest to import. This parameter is required.
     * @param importFromId The id of the existing SpotFleetRequest that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.spot_fleet_request.SpotFleetRequest.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLaunchSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification> __cast_cd4240 = (java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLaunchSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplateConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig> __cast_cd4240 = (java.util.List<imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplateConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpotMaintenanceStrategies(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies value) {
        software.amazon.jsii.Kernel.call(this, "putSpotMaintenanceStrategies", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcessCapacityTerminationPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetExcessCapacityTerminationPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetType() {
        software.amazon.jsii.Kernel.call(this, "resetFleetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceInterruptionBehaviour() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceInterruptionBehaviour", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstancePoolsToUseCount() {
        software.amazon.jsii.Kernel.call(this, "resetInstancePoolsToUseCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplateConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancers() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandMaxTotalPrice() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandMaxTotalPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandTargetCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandTargetCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceUnhealthyInstances() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceUnhealthyInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotMaintenanceStrategies() {
        software.amazon.jsii.Kernel.call(this, "resetSpotMaintenanceStrategies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotPrice() {
        software.amazon.jsii.Kernel.call(this, "resetSpotPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetCapacityUnitType() {
        software.amazon.jsii.Kernel.call(this, "resetTargetCapacityUnitType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupArns() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminateInstancesOnDelete() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateInstancesOnDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminateInstancesWithExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateInstancesWithExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidFrom() {
        software.amazon.jsii.Kernel.call(this, "resetValidFrom", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidUntil() {
        software.amazon.jsii.Kernel.call(this, "resetValidUntil", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForFulfillment() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForFulfillment", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getClientToken() {
        return software.amazon.jsii.Kernel.get(this, "clientToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecificationList getLaunchSpecification() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigList getLaunchTemplateConfig() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfig", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesOutputReference getSpotMaintenanceStrategies() {
        return software.amazon.jsii.Kernel.get(this, "spotMaintenanceStrategies", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotRequestState() {
        return software.amazon.jsii.Kernel.get(this, "spotRequestState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContextInput() {
        return software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExcessCapacityTerminationPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "excessCapacityTerminationPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFleetTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamFleetRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "iamFleetRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehaviourInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehaviourInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstancePoolsToUseCountInput() {
        return software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLaunchSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLaunchTemplateConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLoadBalancersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "loadBalancersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnDemandAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandAllocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnDemandMaxTotalPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandMaxTotalPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandTargetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReplaceUnhealthyInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceUnhealthyInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies getSpotMaintenanceStrategiesInput() {
        return software.amazon.jsii.Kernel.get(this, "spotMaintenanceStrategiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "spotPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetCapacityUnitTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityUnitTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetGroupArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "targetGroupArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTerminateInstancesOnDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesOnDeleteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstancesWithExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesWithExpirationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValidFromInput() {
        return software.amazon.jsii.Kernel.get(this, "validFromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValidUntilInput() {
        return software.amazon.jsii.Kernel.get(this, "validUntilInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitForFulfillmentInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForFulfillmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allocationStrategy", java.util.Objects.requireNonNull(value, "allocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContext() {
        return software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContext(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "context", java.util.Objects.requireNonNull(value, "context is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExcessCapacityTerminationPolicy() {
        return software.amazon.jsii.Kernel.get(this, "excessCapacityTerminationPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExcessCapacityTerminationPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "excessCapacityTerminationPolicy", java.util.Objects.requireNonNull(value, "excessCapacityTerminationPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFleetType() {
        return software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFleetType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fleetType", java.util.Objects.requireNonNull(value, "fleetType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamFleetRole() {
        return software.amazon.jsii.Kernel.get(this, "iamFleetRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamFleetRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamFleetRole", java.util.Objects.requireNonNull(value, "iamFleetRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceInterruptionBehaviour() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehaviour", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceInterruptionBehaviour(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceInterruptionBehaviour", java.util.Objects.requireNonNull(value, "instanceInterruptionBehaviour is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstancePoolsToUseCount() {
        return software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstancePoolsToUseCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instancePoolsToUseCount", java.util.Objects.requireNonNull(value, "instancePoolsToUseCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLoadBalancers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "loadBalancers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLoadBalancers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancers", java.util.Objects.requireNonNull(value, "loadBalancers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnDemandAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "onDemandAllocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnDemandAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onDemandAllocationStrategy", java.util.Objects.requireNonNull(value, "onDemandAllocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnDemandMaxTotalPrice() {
        return software.amazon.jsii.Kernel.get(this, "onDemandMaxTotalPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnDemandMaxTotalPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onDemandMaxTotalPrice", java.util.Objects.requireNonNull(value, "onDemandMaxTotalPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOnDemandTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "onDemandTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOnDemandTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "onDemandTargetCapacity", java.util.Objects.requireNonNull(value, "onDemandTargetCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReplaceUnhealthyInstances() {
        return software.amazon.jsii.Kernel.get(this, "replaceUnhealthyInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReplaceUnhealthyInstances(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "replaceUnhealthyInstances", java.util.Objects.requireNonNull(value, "replaceUnhealthyInstances is required"));
    }

    public void setReplaceUnhealthyInstances(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "replaceUnhealthyInstances", java.util.Objects.requireNonNull(value, "replaceUnhealthyInstances is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotPrice() {
        return software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotPrice", java.util.Objects.requireNonNull(value, "spotPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetCapacity", java.util.Objects.requireNonNull(value, "targetCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetCapacityUnitType() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityUnitType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetCapacityUnitType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetCapacityUnitType", java.util.Objects.requireNonNull(value, "targetCapacityUnitType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetGroupArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "targetGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTargetGroupArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "targetGroupArns", java.util.Objects.requireNonNull(value, "targetGroupArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTerminateInstancesOnDelete() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesOnDelete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTerminateInstancesOnDelete(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstancesOnDelete", java.util.Objects.requireNonNull(value, "terminateInstancesOnDelete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTerminateInstancesWithExpiration() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesWithExpiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTerminateInstancesWithExpiration(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstancesWithExpiration", java.util.Objects.requireNonNull(value, "terminateInstancesWithExpiration is required"));
    }

    public void setTerminateInstancesWithExpiration(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstancesWithExpiration", java.util.Objects.requireNonNull(value, "terminateInstancesWithExpiration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValidFrom() {
        return software.amazon.jsii.Kernel.get(this, "validFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValidFrom(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "validFrom", java.util.Objects.requireNonNull(value, "validFrom is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValidUntil() {
        return software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValidUntil(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "validUntil", java.util.Objects.requireNonNull(value, "validUntil is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWaitForFulfillment() {
        return software.amazon.jsii.Kernel.get(this, "waitForFulfillment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWaitForFulfillment(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "waitForFulfillment", java.util.Objects.requireNonNull(value, "waitForFulfillment is required"));
    }

    public void setWaitForFulfillment(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "waitForFulfillment", java.util.Objects.requireNonNull(value, "waitForFulfillment is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.spot_fleet_request.SpotFleetRequest}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.spot_fleet_request.SpotFleetRequest> {
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
        private final imports.aws.spot_fleet_request.SpotFleetRequestConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.spot_fleet_request.SpotFleetRequestConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#iam_fleet_role SpotFleetRequest#iam_fleet_role}.
         * <p>
         * @return {@code this}
         * @param iamFleetRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#iam_fleet_role SpotFleetRequest#iam_fleet_role}. This parameter is required.
         */
        public Builder iamFleetRole(final java.lang.String iamFleetRole) {
            this.config.iamFleetRole(iamFleetRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity SpotFleetRequest#target_capacity}.
         * <p>
         * @return {@code this}
         * @param targetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity SpotFleetRequest#target_capacity}. This parameter is required.
         */
        public Builder targetCapacity(final java.lang.Number targetCapacity) {
            this.config.targetCapacity(targetCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#allocation_strategy SpotFleetRequest#allocation_strategy}.
         * <p>
         * @return {@code this}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#allocation_strategy SpotFleetRequest#allocation_strategy}. This parameter is required.
         */
        public Builder allocationStrategy(final java.lang.String allocationStrategy) {
            this.config.allocationStrategy(allocationStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#context SpotFleetRequest#context}.
         * <p>
         * @return {@code this}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#context SpotFleetRequest#context}. This parameter is required.
         */
        public Builder context(final java.lang.String context) {
            this.config.context(context);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#excess_capacity_termination_policy SpotFleetRequest#excess_capacity_termination_policy}.
         * <p>
         * @return {@code this}
         * @param excessCapacityTerminationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#excess_capacity_termination_policy SpotFleetRequest#excess_capacity_termination_policy}. This parameter is required.
         */
        public Builder excessCapacityTerminationPolicy(final java.lang.String excessCapacityTerminationPolicy) {
            this.config.excessCapacityTerminationPolicy(excessCapacityTerminationPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#fleet_type SpotFleetRequest#fleet_type}.
         * <p>
         * @return {@code this}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#fleet_type SpotFleetRequest#fleet_type}. This parameter is required.
         */
        public Builder fleetType(final java.lang.String fleetType) {
            this.config.fleetType(fleetType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#id SpotFleetRequest#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#id SpotFleetRequest#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_interruption_behaviour SpotFleetRequest#instance_interruption_behaviour}.
         * <p>
         * @return {@code this}
         * @param instanceInterruptionBehaviour Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_interruption_behaviour SpotFleetRequest#instance_interruption_behaviour}. This parameter is required.
         */
        public Builder instanceInterruptionBehaviour(final java.lang.String instanceInterruptionBehaviour) {
            this.config.instanceInterruptionBehaviour(instanceInterruptionBehaviour);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_pools_to_use_count SpotFleetRequest#instance_pools_to_use_count}.
         * <p>
         * @return {@code this}
         * @param instancePoolsToUseCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#instance_pools_to_use_count SpotFleetRequest#instance_pools_to_use_count}. This parameter is required.
         */
        public Builder instancePoolsToUseCount(final java.lang.Number instancePoolsToUseCount) {
            this.config.instancePoolsToUseCount(instancePoolsToUseCount);
            return this;
        }

        /**
         * launch_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_specification SpotFleetRequest#launch_specification}
         * <p>
         * @return {@code this}
         * @param launchSpecification launch_specification block. This parameter is required.
         */
        public Builder launchSpecification(final com.hashicorp.cdktf.IResolvable launchSpecification) {
            this.config.launchSpecification(launchSpecification);
            return this;
        }
        /**
         * launch_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_specification SpotFleetRequest#launch_specification}
         * <p>
         * @return {@code this}
         * @param launchSpecification launch_specification block. This parameter is required.
         */
        public Builder launchSpecification(final java.util.List<? extends imports.aws.spot_fleet_request.SpotFleetRequestLaunchSpecification> launchSpecification) {
            this.config.launchSpecification(launchSpecification);
            return this;
        }

        /**
         * launch_template_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_config SpotFleetRequest#launch_template_config}
         * <p>
         * @return {@code this}
         * @param launchTemplateConfig launch_template_config block. This parameter is required.
         */
        public Builder launchTemplateConfig(final com.hashicorp.cdktf.IResolvable launchTemplateConfig) {
            this.config.launchTemplateConfig(launchTemplateConfig);
            return this;
        }
        /**
         * launch_template_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_config SpotFleetRequest#launch_template_config}
         * <p>
         * @return {@code this}
         * @param launchTemplateConfig launch_template_config block. This parameter is required.
         */
        public Builder launchTemplateConfig(final java.util.List<? extends imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfig> launchTemplateConfig) {
            this.config.launchTemplateConfig(launchTemplateConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#load_balancers SpotFleetRequest#load_balancers}.
         * <p>
         * @return {@code this}
         * @param loadBalancers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#load_balancers SpotFleetRequest#load_balancers}. This parameter is required.
         */
        public Builder loadBalancers(final java.util.List<java.lang.String> loadBalancers) {
            this.config.loadBalancers(loadBalancers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_allocation_strategy SpotFleetRequest#on_demand_allocation_strategy}.
         * <p>
         * @return {@code this}
         * @param onDemandAllocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_allocation_strategy SpotFleetRequest#on_demand_allocation_strategy}. This parameter is required.
         */
        public Builder onDemandAllocationStrategy(final java.lang.String onDemandAllocationStrategy) {
            this.config.onDemandAllocationStrategy(onDemandAllocationStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_max_total_price SpotFleetRequest#on_demand_max_total_price}.
         * <p>
         * @return {@code this}
         * @param onDemandMaxTotalPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_max_total_price SpotFleetRequest#on_demand_max_total_price}. This parameter is required.
         */
        public Builder onDemandMaxTotalPrice(final java.lang.String onDemandMaxTotalPrice) {
            this.config.onDemandMaxTotalPrice(onDemandMaxTotalPrice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_target_capacity SpotFleetRequest#on_demand_target_capacity}.
         * <p>
         * @return {@code this}
         * @param onDemandTargetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#on_demand_target_capacity SpotFleetRequest#on_demand_target_capacity}. This parameter is required.
         */
        public Builder onDemandTargetCapacity(final java.lang.Number onDemandTargetCapacity) {
            this.config.onDemandTargetCapacity(onDemandTargetCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}.
         * <p>
         * @return {@code this}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}. This parameter is required.
         */
        public Builder replaceUnhealthyInstances(final java.lang.Boolean replaceUnhealthyInstances) {
            this.config.replaceUnhealthyInstances(replaceUnhealthyInstances);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}.
         * <p>
         * @return {@code this}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replace_unhealthy_instances SpotFleetRequest#replace_unhealthy_instances}. This parameter is required.
         */
        public Builder replaceUnhealthyInstances(final com.hashicorp.cdktf.IResolvable replaceUnhealthyInstances) {
            this.config.replaceUnhealthyInstances(replaceUnhealthyInstances);
            return this;
        }

        /**
         * spot_maintenance_strategies block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_maintenance_strategies SpotFleetRequest#spot_maintenance_strategies}
         * <p>
         * @return {@code this}
         * @param spotMaintenanceStrategies spot_maintenance_strategies block. This parameter is required.
         */
        public Builder spotMaintenanceStrategies(final imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategies spotMaintenanceStrategies) {
            this.config.spotMaintenanceStrategies(spotMaintenanceStrategies);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_price SpotFleetRequest#spot_price}.
         * <p>
         * @return {@code this}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#spot_price SpotFleetRequest#spot_price}. This parameter is required.
         */
        public Builder spotPrice(final java.lang.String spotPrice) {
            this.config.spotPrice(spotPrice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags SpotFleetRequest#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags SpotFleetRequest#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags_all SpotFleetRequest#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#tags_all SpotFleetRequest#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity_unit_type SpotFleetRequest#target_capacity_unit_type}.
         * <p>
         * @return {@code this}
         * @param targetCapacityUnitType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_capacity_unit_type SpotFleetRequest#target_capacity_unit_type}. This parameter is required.
         */
        public Builder targetCapacityUnitType(final java.lang.String targetCapacityUnitType) {
            this.config.targetCapacityUnitType(targetCapacityUnitType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_group_arns SpotFleetRequest#target_group_arns}.
         * <p>
         * @return {@code this}
         * @param targetGroupArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#target_group_arns SpotFleetRequest#target_group_arns}. This parameter is required.
         */
        public Builder targetGroupArns(final java.util.List<java.lang.String> targetGroupArns) {
            this.config.targetGroupArns(targetGroupArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_on_delete SpotFleetRequest#terminate_instances_on_delete}.
         * <p>
         * @return {@code this}
         * @param terminateInstancesOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_on_delete SpotFleetRequest#terminate_instances_on_delete}. This parameter is required.
         */
        public Builder terminateInstancesOnDelete(final java.lang.String terminateInstancesOnDelete) {
            this.config.terminateInstancesOnDelete(terminateInstancesOnDelete);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}.
         * <p>
         * @return {@code this}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}. This parameter is required.
         */
        public Builder terminateInstancesWithExpiration(final java.lang.Boolean terminateInstancesWithExpiration) {
            this.config.terminateInstancesWithExpiration(terminateInstancesWithExpiration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}.
         * <p>
         * @return {@code this}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#terminate_instances_with_expiration SpotFleetRequest#terminate_instances_with_expiration}. This parameter is required.
         */
        public Builder terminateInstancesWithExpiration(final com.hashicorp.cdktf.IResolvable terminateInstancesWithExpiration) {
            this.config.terminateInstancesWithExpiration(terminateInstancesWithExpiration);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#timeouts SpotFleetRequest#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.spot_fleet_request.SpotFleetRequestTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_from SpotFleetRequest#valid_from}.
         * <p>
         * @return {@code this}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_from SpotFleetRequest#valid_from}. This parameter is required.
         */
        public Builder validFrom(final java.lang.String validFrom) {
            this.config.validFrom(validFrom);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_until SpotFleetRequest#valid_until}.
         * <p>
         * @return {@code this}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#valid_until SpotFleetRequest#valid_until}. This parameter is required.
         */
        public Builder validUntil(final java.lang.String validUntil) {
            this.config.validUntil(validUntil);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}.
         * <p>
         * @return {@code this}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}. This parameter is required.
         */
        public Builder waitForFulfillment(final java.lang.Boolean waitForFulfillment) {
            this.config.waitForFulfillment(waitForFulfillment);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}.
         * <p>
         * @return {@code this}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#wait_for_fulfillment SpotFleetRequest#wait_for_fulfillment}. This parameter is required.
         */
        public Builder waitForFulfillment(final com.hashicorp.cdktf.IResolvable waitForFulfillment) {
            this.config.waitForFulfillment(waitForFulfillment);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.spot_fleet_request.SpotFleetRequest}.
         */
        @Override
        public imports.aws.spot_fleet_request.SpotFleetRequest build() {
            return new imports.aws.spot_fleet_request.SpotFleetRequest(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

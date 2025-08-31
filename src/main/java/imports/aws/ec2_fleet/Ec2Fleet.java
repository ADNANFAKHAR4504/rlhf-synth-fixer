package imports.aws.ec2_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet aws_ec2_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.074Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2Fleet")
public class Ec2Fleet extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2Fleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2Fleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_fleet.Ec2Fleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet aws_ec2_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2Fleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2Fleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2Fleet to import. This parameter is required.
     * @param importFromId The id of the existing Ec2Fleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2Fleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_fleet.Ec2Fleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2Fleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2Fleet to import. This parameter is required.
     * @param importFromId The id of the existing Ec2Fleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_fleet.Ec2Fleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putFleetInstanceSet(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet> __cast_cd4240 = (java.util.List<imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFleetInstanceSet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig> __cast_cd4240 = (java.util.List<imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplateConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOnDemandOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetOnDemandOptions value) {
        software.amazon.jsii.Kernel.call(this, "putOnDemandOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpotOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptions value) {
        software.amazon.jsii.Kernel.call(this, "putSpotOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetCapacitySpecification(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification value) {
        software.amazon.jsii.Kernel.call(this, "putTargetCapacitySpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcessCapacityTerminationPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetExcessCapacityTerminationPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetInstanceSet() {
        software.amazon.jsii.Kernel.call(this, "resetFleetInstanceSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetState() {
        software.amazon.jsii.Kernel.call(this, "resetFleetState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFulfilledCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetFulfilledCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFulfilledOnDemandCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetFulfilledOnDemandCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandOptions() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceUnhealthyInstances() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceUnhealthyInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSpotOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminateInstances() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminateInstancesWithExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateInstancesWithExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidFrom() {
        software.amazon.jsii.Kernel.call(this, "resetValidFrom", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidUntil() {
        software.amazon.jsii.Kernel.call(this, "resetValidUntil", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetFleetInstanceSetList getFleetInstanceSet() {
        return software.amazon.jsii.Kernel.get(this, "fleetInstanceSet", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetFleetInstanceSetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigList getLaunchTemplateConfig() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsOutputReference getOnDemandOptions() {
        return software.amazon.jsii.Kernel.get(this, "onDemandOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptionsOutputReference getSpotOptions() {
        return software.amazon.jsii.Kernel.get(this, "spotOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecificationOutputReference getTargetCapacitySpecification() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacitySpecification", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContextInput() {
        return software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExcessCapacityTerminationPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "excessCapacityTerminationPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFleetInstanceSetInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetInstanceSetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFleetStateInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFulfilledCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "fulfilledCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFulfilledOnDemandCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "fulfilledOnDemandCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLaunchTemplateConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptions getOnDemandOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReplaceUnhealthyInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceUnhealthyInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptions getSpotOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "spotOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification getTargetCapacitySpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacitySpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstancesWithExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstancesWithExpirationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValidFromInput() {
        return software.amazon.jsii.Kernel.get(this, "validFromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValidUntilInput() {
        return software.amazon.jsii.Kernel.get(this, "validUntilInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getFleetState() {
        return software.amazon.jsii.Kernel.get(this, "fleetState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFleetState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fleetState", java.util.Objects.requireNonNull(value, "fleetState is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFulfilledCapacity() {
        return software.amazon.jsii.Kernel.get(this, "fulfilledCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFulfilledCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fulfilledCapacity", java.util.Objects.requireNonNull(value, "fulfilledCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFulfilledOnDemandCapacity() {
        return software.amazon.jsii.Kernel.get(this, "fulfilledOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFulfilledOnDemandCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fulfilledOnDemandCapacity", java.util.Objects.requireNonNull(value, "fulfilledOnDemandCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getTerminateInstances() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTerminateInstances(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstances", java.util.Objects.requireNonNull(value, "terminateInstances is required"));
    }

    public void setTerminateInstances(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstances", java.util.Objects.requireNonNull(value, "terminateInstances is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
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

    /**
     * A fluent builder for {@link imports.aws.ec2_fleet.Ec2Fleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_fleet.Ec2Fleet> {
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
        private final imports.aws.ec2_fleet.Ec2FleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_fleet.Ec2FleetConfig.Builder();
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
         * launch_template_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
         * <p>
         * @return {@code this}
         * @param launchTemplateConfig launch_template_config block. This parameter is required.
         */
        public Builder launchTemplateConfig(final java.util.List<? extends imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfig> launchTemplateConfig) {
            this.config.launchTemplateConfig(launchTemplateConfig);
            return this;
        }

        /**
         * target_capacity_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
         * <p>
         * @return {@code this}
         * @param targetCapacitySpecification target_capacity_specification block. This parameter is required.
         */
        public Builder targetCapacitySpecification(final imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification targetCapacitySpecification) {
            this.config.targetCapacitySpecification(targetCapacitySpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.
         * <p>
         * @return {@code this}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}. This parameter is required.
         */
        public Builder context(final java.lang.String context) {
            this.config.context(context);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.
         * <p>
         * @return {@code this}
         * @param excessCapacityTerminationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}. This parameter is required.
         */
        public Builder excessCapacityTerminationPolicy(final java.lang.String excessCapacityTerminationPolicy) {
            this.config.excessCapacityTerminationPolicy(excessCapacityTerminationPolicy);
            return this;
        }

        /**
         * fleet_instance_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
         * <p>
         * @return {@code this}
         * @param fleetInstanceSet fleet_instance_set block. This parameter is required.
         */
        public Builder fleetInstanceSet(final com.hashicorp.cdktf.IResolvable fleetInstanceSet) {
            this.config.fleetInstanceSet(fleetInstanceSet);
            return this;
        }
        /**
         * fleet_instance_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
         * <p>
         * @return {@code this}
         * @param fleetInstanceSet fleet_instance_set block. This parameter is required.
         */
        public Builder fleetInstanceSet(final java.util.List<? extends imports.aws.ec2_fleet.Ec2FleetFleetInstanceSet> fleetInstanceSet) {
            this.config.fleetInstanceSet(fleetInstanceSet);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.
         * <p>
         * @return {@code this}
         * @param fleetState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}. This parameter is required.
         */
        public Builder fleetState(final java.lang.String fleetState) {
            this.config.fleetState(fleetState);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.
         * <p>
         * @return {@code this}
         * @param fulfilledCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}. This parameter is required.
         */
        public Builder fulfilledCapacity(final java.lang.Number fulfilledCapacity) {
            this.config.fulfilledCapacity(fulfilledCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.
         * <p>
         * @return {@code this}
         * @param fulfilledOnDemandCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}. This parameter is required.
         */
        public Builder fulfilledOnDemandCapacity(final java.lang.Number fulfilledOnDemandCapacity) {
            this.config.fulfilledOnDemandCapacity(fulfilledOnDemandCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * on_demand_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
         * <p>
         * @return {@code this}
         * @param onDemandOptions on_demand_options block. This parameter is required.
         */
        public Builder onDemandOptions(final imports.aws.ec2_fleet.Ec2FleetOnDemandOptions onDemandOptions) {
            this.config.onDemandOptions(onDemandOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
         * <p>
         * @return {@code this}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}. This parameter is required.
         */
        public Builder replaceUnhealthyInstances(final java.lang.Boolean replaceUnhealthyInstances) {
            this.config.replaceUnhealthyInstances(replaceUnhealthyInstances);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
         * <p>
         * @return {@code this}
         * @param replaceUnhealthyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}. This parameter is required.
         */
        public Builder replaceUnhealthyInstances(final com.hashicorp.cdktf.IResolvable replaceUnhealthyInstances) {
            this.config.replaceUnhealthyInstances(replaceUnhealthyInstances);
            return this;
        }

        /**
         * spot_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
         * <p>
         * @return {@code this}
         * @param spotOptions spot_options block. This parameter is required.
         */
        public Builder spotOptions(final imports.aws.ec2_fleet.Ec2FleetSpotOptions spotOptions) {
            this.config.spotOptions(spotOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
         * <p>
         * @return {@code this}
         * @param terminateInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}. This parameter is required.
         */
        public Builder terminateInstances(final java.lang.Boolean terminateInstances) {
            this.config.terminateInstances(terminateInstances);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
         * <p>
         * @return {@code this}
         * @param terminateInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}. This parameter is required.
         */
        public Builder terminateInstances(final com.hashicorp.cdktf.IResolvable terminateInstances) {
            this.config.terminateInstances(terminateInstances);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
         * <p>
         * @return {@code this}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}. This parameter is required.
         */
        public Builder terminateInstancesWithExpiration(final java.lang.Boolean terminateInstancesWithExpiration) {
            this.config.terminateInstancesWithExpiration(terminateInstancesWithExpiration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
         * <p>
         * @return {@code this}
         * @param terminateInstancesWithExpiration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}. This parameter is required.
         */
        public Builder terminateInstancesWithExpiration(final com.hashicorp.cdktf.IResolvable terminateInstancesWithExpiration) {
            this.config.terminateInstancesWithExpiration(terminateInstancesWithExpiration);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ec2_fleet.Ec2FleetTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.
         * <p>
         * @return {@code this}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}. This parameter is required.
         */
        public Builder validFrom(final java.lang.String validFrom) {
            this.config.validFrom(validFrom);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.
         * <p>
         * @return {@code this}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}. This parameter is required.
         */
        public Builder validUntil(final java.lang.String validUntil) {
            this.config.validUntil(validUntil);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_fleet.Ec2Fleet}.
         */
        @Override
        public imports.aws.ec2_fleet.Ec2Fleet build() {
            return new imports.aws.ec2_fleet.Ec2Fleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

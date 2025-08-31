package imports.aws.elb;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb aws_elb}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.189Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elb.Elb")
public class Elb extends com.hashicorp.cdktf.TerraformResource {

    protected Elb(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Elb(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elb.Elb.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb aws_elb} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Elb(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elb.ElbConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Elb resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Elb to import. This parameter is required.
     * @param importFromId The id of the existing Elb that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Elb to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elb.Elb.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Elb resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Elb to import. This parameter is required.
     * @param importFromId The id of the existing Elb that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elb.Elb.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessLogs(final @org.jetbrains.annotations.NotNull imports.aws.elb.ElbAccessLogs value) {
        software.amazon.jsii.Kernel.call(this, "putAccessLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHealthCheck(final @org.jetbrains.annotations.NotNull imports.aws.elb.ElbHealthCheck value) {
        software.amazon.jsii.Kernel.call(this, "putHealthCheck", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putListener(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elb.ElbListener>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elb.ElbListener> __cast_cd4240 = (java.util.List<imports.aws.elb.ElbListener>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elb.ElbListener __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putListener", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.elb.ElbTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessLogs() {
        software.amazon.jsii.Kernel.call(this, "resetAccessLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZones() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZones", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionDraining() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionDraining", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionDrainingTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionDrainingTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrossZoneLoadBalancing() {
        software.amazon.jsii.Kernel.call(this, "resetCrossZoneLoadBalancing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesyncMitigationMode() {
        software.amazon.jsii.Kernel.call(this, "resetDesyncMitigationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheck() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdleTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetIdleTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstances() {
        software.amazon.jsii.Kernel.call(this, "resetInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInternal() {
        software.amazon.jsii.Kernel.call(this, "resetInternal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceSecurityGroup() {
        software.amazon.jsii.Kernel.call(this, "resetSourceSecurityGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnets() {
        software.amazon.jsii.Kernel.call(this, "resetSubnets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.elb.ElbAccessLogsOutputReference getAccessLogs() {
        return software.amazon.jsii.Kernel.get(this, "accessLogs", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbAccessLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elb.ElbHealthCheckOutputReference getHealthCheck() {
        return software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbHealthCheckOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elb.ElbListenerList getListener() {
        return software.amazon.jsii.Kernel.get(this, "listener", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbListenerList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "sourceSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elb.ElbTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getZoneId() {
        return software.amazon.jsii.Kernel.get(this, "zoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elb.ElbAccessLogs getAccessLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "accessLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbAccessLogs.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZonesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "availabilityZonesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConnectionDrainingInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionDrainingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionDrainingTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionDrainingTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCrossZoneLoadBalancingInput() {
        return software.amazon.jsii.Kernel.get(this, "crossZoneLoadBalancingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDesyncMitigationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "desyncMitigationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elb.ElbHealthCheck getHealthCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckInput", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbHealthCheck.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstancesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "instancesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalInput() {
        return software.amazon.jsii.Kernel.get(this, "internalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getListenerInput() {
        return software.amazon.jsii.Kernel.get(this, "listenerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceSecurityGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceSecurityGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAvailabilityZones(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZones", java.util.Objects.requireNonNull(value, "availabilityZones is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConnectionDraining() {
        return software.amazon.jsii.Kernel.get(this, "connectionDraining", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConnectionDraining(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "connectionDraining", java.util.Objects.requireNonNull(value, "connectionDraining is required"));
    }

    public void setConnectionDraining(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "connectionDraining", java.util.Objects.requireNonNull(value, "connectionDraining is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionDrainingTimeout() {
        return software.amazon.jsii.Kernel.get(this, "connectionDrainingTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionDrainingTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionDrainingTimeout", java.util.Objects.requireNonNull(value, "connectionDrainingTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCrossZoneLoadBalancing() {
        return software.amazon.jsii.Kernel.get(this, "crossZoneLoadBalancing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCrossZoneLoadBalancing(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "crossZoneLoadBalancing", java.util.Objects.requireNonNull(value, "crossZoneLoadBalancing is required"));
    }

    public void setCrossZoneLoadBalancing(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "crossZoneLoadBalancing", java.util.Objects.requireNonNull(value, "crossZoneLoadBalancing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDesyncMitigationMode() {
        return software.amazon.jsii.Kernel.get(this, "desyncMitigationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDesyncMitigationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "desyncMitigationMode", java.util.Objects.requireNonNull(value, "desyncMitigationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleTimeout() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleTimeout", java.util.Objects.requireNonNull(value, "idleTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstances() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInstances(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "instances", java.util.Objects.requireNonNull(value, "instances is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInternal() {
        return software.amazon.jsii.Kernel.get(this, "internal", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternal(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "internal", java.util.Objects.requireNonNull(value, "internal is required"));
    }

    public void setInternal(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internal", java.util.Objects.requireNonNull(value, "internal is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "sourceSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceSecurityGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceSecurityGroup", java.util.Objects.requireNonNull(value, "sourceSecurityGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnets", java.util.Objects.requireNonNull(value, "subnets is required"));
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

    /**
     * A fluent builder for {@link imports.aws.elb.Elb}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elb.Elb> {
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
        private final imports.aws.elb.ElbConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elb.ElbConfig.Builder();
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
         * listener block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#listener Elb#listener}
         * <p>
         * @return {@code this}
         * @param listener listener block. This parameter is required.
         */
        public Builder listener(final com.hashicorp.cdktf.IResolvable listener) {
            this.config.listener(listener);
            return this;
        }
        /**
         * listener block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#listener Elb#listener}
         * <p>
         * @return {@code this}
         * @param listener listener block. This parameter is required.
         */
        public Builder listener(final java.util.List<? extends imports.aws.elb.ElbListener> listener) {
            this.config.listener(listener);
            return this;
        }

        /**
         * access_logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#access_logs Elb#access_logs}
         * <p>
         * @return {@code this}
         * @param accessLogs access_logs block. This parameter is required.
         */
        public Builder accessLogs(final imports.aws.elb.ElbAccessLogs accessLogs) {
            this.config.accessLogs(accessLogs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#availability_zones Elb#availability_zones}.
         * <p>
         * @return {@code this}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#availability_zones Elb#availability_zones}. This parameter is required.
         */
        public Builder availabilityZones(final java.util.List<java.lang.String> availabilityZones) {
            this.config.availabilityZones(availabilityZones);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}.
         * <p>
         * @return {@code this}
         * @param connectionDraining Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}. This parameter is required.
         */
        public Builder connectionDraining(final java.lang.Boolean connectionDraining) {
            this.config.connectionDraining(connectionDraining);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}.
         * <p>
         * @return {@code this}
         * @param connectionDraining Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}. This parameter is required.
         */
        public Builder connectionDraining(final com.hashicorp.cdktf.IResolvable connectionDraining) {
            this.config.connectionDraining(connectionDraining);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining_timeout Elb#connection_draining_timeout}.
         * <p>
         * @return {@code this}
         * @param connectionDrainingTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining_timeout Elb#connection_draining_timeout}. This parameter is required.
         */
        public Builder connectionDrainingTimeout(final java.lang.Number connectionDrainingTimeout) {
            this.config.connectionDrainingTimeout(connectionDrainingTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}.
         * <p>
         * @return {@code this}
         * @param crossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}. This parameter is required.
         */
        public Builder crossZoneLoadBalancing(final java.lang.Boolean crossZoneLoadBalancing) {
            this.config.crossZoneLoadBalancing(crossZoneLoadBalancing);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}.
         * <p>
         * @return {@code this}
         * @param crossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}. This parameter is required.
         */
        public Builder crossZoneLoadBalancing(final com.hashicorp.cdktf.IResolvable crossZoneLoadBalancing) {
            this.config.crossZoneLoadBalancing(crossZoneLoadBalancing);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#desync_mitigation_mode Elb#desync_mitigation_mode}.
         * <p>
         * @return {@code this}
         * @param desyncMitigationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#desync_mitigation_mode Elb#desync_mitigation_mode}. This parameter is required.
         */
        public Builder desyncMitigationMode(final java.lang.String desyncMitigationMode) {
            this.config.desyncMitigationMode(desyncMitigationMode);
            return this;
        }

        /**
         * health_check block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#health_check Elb#health_check}
         * <p>
         * @return {@code this}
         * @param healthCheck health_check block. This parameter is required.
         */
        public Builder healthCheck(final imports.aws.elb.ElbHealthCheck healthCheck) {
            this.config.healthCheck(healthCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#id Elb#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#id Elb#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#idle_timeout Elb#idle_timeout}.
         * <p>
         * @return {@code this}
         * @param idleTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#idle_timeout Elb#idle_timeout}. This parameter is required.
         */
        public Builder idleTimeout(final java.lang.Number idleTimeout) {
            this.config.idleTimeout(idleTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instances Elb#instances}.
         * <p>
         * @return {@code this}
         * @param instances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instances Elb#instances}. This parameter is required.
         */
        public Builder instances(final java.util.List<java.lang.String> instances) {
            this.config.instances(instances);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}.
         * <p>
         * @return {@code this}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}. This parameter is required.
         */
        public Builder internal(final java.lang.Boolean internal) {
            this.config.internal(internal);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}.
         * <p>
         * @return {@code this}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}. This parameter is required.
         */
        public Builder internal(final com.hashicorp.cdktf.IResolvable internal) {
            this.config.internal(internal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name Elb#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name Elb#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name_prefix Elb#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name_prefix Elb#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#security_groups Elb#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#security_groups Elb#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config.securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#source_security_group Elb#source_security_group}.
         * <p>
         * @return {@code this}
         * @param sourceSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#source_security_group Elb#source_security_group}. This parameter is required.
         */
        public Builder sourceSecurityGroup(final java.lang.String sourceSecurityGroup) {
            this.config.sourceSecurityGroup(sourceSecurityGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#subnets Elb#subnets}.
         * <p>
         * @return {@code this}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#subnets Elb#subnets}. This parameter is required.
         */
        public Builder subnets(final java.util.List<java.lang.String> subnets) {
            this.config.subnets(subnets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags Elb#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags Elb#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags_all Elb#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags_all Elb#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#timeouts Elb#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.elb.ElbTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elb.Elb}.
         */
        @Override
        public imports.aws.elb.Elb build() {
            return new imports.aws.elb.Elb(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

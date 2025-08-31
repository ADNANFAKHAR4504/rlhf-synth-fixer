package imports.aws.alb;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb aws_alb}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.899Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.alb.Alb")
public class Alb extends com.hashicorp.cdktf.TerraformResource {

    protected Alb(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Alb(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.alb.Alb.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb aws_alb} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public Alb(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.alb.AlbConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb aws_alb} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public Alb(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a Alb resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Alb to import. This parameter is required.
     * @param importFromId The id of the existing Alb that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Alb to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.alb.Alb.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Alb resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Alb to import. This parameter is required.
     * @param importFromId The id of the existing Alb that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.alb.Alb.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessLogs(final @org.jetbrains.annotations.NotNull imports.aws.alb.AlbAccessLogs value) {
        software.amazon.jsii.Kernel.call(this, "putAccessLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConnectionLogs(final @org.jetbrains.annotations.NotNull imports.aws.alb.AlbConnectionLogs value) {
        software.amazon.jsii.Kernel.call(this, "putConnectionLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIpamPools(final @org.jetbrains.annotations.NotNull imports.aws.alb.AlbIpamPools value) {
        software.amazon.jsii.Kernel.call(this, "putIpamPools", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMinimumLoadBalancerCapacity(final @org.jetbrains.annotations.NotNull imports.aws.alb.AlbMinimumLoadBalancerCapacity value) {
        software.amazon.jsii.Kernel.call(this, "putMinimumLoadBalancerCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSubnetMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.alb.AlbSubnetMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.alb.AlbSubnetMapping> __cast_cd4240 = (java.util.List<imports.aws.alb.AlbSubnetMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.alb.AlbSubnetMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSubnetMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.alb.AlbTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessLogs() {
        software.amazon.jsii.Kernel.call(this, "resetAccessLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientKeepAlive() {
        software.amazon.jsii.Kernel.call(this, "resetClientKeepAlive", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionLogs() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerOwnedIpv4Pool() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerOwnedIpv4Pool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesyncMitigationMode() {
        software.amazon.jsii.Kernel.call(this, "resetDesyncMitigationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDnsRecordClientRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetDnsRecordClientRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDropInvalidHeaderFields() {
        software.amazon.jsii.Kernel.call(this, "resetDropInvalidHeaderFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableCrossZoneLoadBalancing() {
        software.amazon.jsii.Kernel.call(this, "resetEnableCrossZoneLoadBalancing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDeletionProtection() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDeletionProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableHttp2() {
        software.amazon.jsii.Kernel.call(this, "resetEnableHttp2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableTlsVersionAndCipherSuiteHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetEnableTlsVersionAndCipherSuiteHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableWafFailOpen() {
        software.amazon.jsii.Kernel.call(this, "resetEnableWafFailOpen", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableXffClientPort() {
        software.amazon.jsii.Kernel.call(this, "resetEnableXffClientPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableZonalShift() {
        software.amazon.jsii.Kernel.call(this, "resetEnableZonalShift", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic() {
        software.amazon.jsii.Kernel.call(this, "resetEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdleTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetIdleTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInternal() {
        software.amazon.jsii.Kernel.call(this, "resetInternal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpamPools() {
        software.amazon.jsii.Kernel.call(this, "resetIpamPools", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancerType() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancerType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumLoadBalancerCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumLoadBalancerCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveHostHeader() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveHostHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetMapping() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetMapping", software.amazon.jsii.NativeType.VOID);
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

    public void resetXffHeaderProcessingMode() {
        software.amazon.jsii.Kernel.call(this, "resetXffHeaderProcessingMode", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbAccessLogsOutputReference getAccessLogs() {
        return software.amazon.jsii.Kernel.get(this, "accessLogs", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbAccessLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArnSuffix() {
        return software.amazon.jsii.Kernel.get(this, "arnSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbConnectionLogsOutputReference getConnectionLogs() {
        return software.amazon.jsii.Kernel.get(this, "connectionLogs", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbConnectionLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbIpamPoolsOutputReference getIpamPools() {
        return software.amazon.jsii.Kernel.get(this, "ipamPools", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbIpamPoolsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbMinimumLoadBalancerCapacityOutputReference getMinimumLoadBalancerCapacity() {
        return software.amazon.jsii.Kernel.get(this, "minimumLoadBalancerCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbMinimumLoadBalancerCapacityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbSubnetMappingList getSubnetMapping() {
        return software.amazon.jsii.Kernel.get(this, "subnetMapping", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbSubnetMappingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb.AlbTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getZoneId() {
        return software.amazon.jsii.Kernel.get(this, "zoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb.AlbAccessLogs getAccessLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "accessLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbAccessLogs.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getClientKeepAliveInput() {
        return software.amazon.jsii.Kernel.get(this, "clientKeepAliveInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb.AlbConnectionLogs getConnectionLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbConnectionLogs.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDesyncMitigationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "desyncMitigationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDnsRecordClientRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecordClientRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDropInvalidHeaderFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "dropInvalidHeaderFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableCrossZoneLoadBalancingInput() {
        return software.amazon.jsii.Kernel.get(this, "enableCrossZoneLoadBalancingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDeletionProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDeletionProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableHttp2Input() {
        return software.amazon.jsii.Kernel.get(this, "enableHttp2Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableTlsVersionAndCipherSuiteHeadersInput() {
        return software.amazon.jsii.Kernel.get(this, "enableTlsVersionAndCipherSuiteHeadersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableWafFailOpenInput() {
        return software.amazon.jsii.Kernel.get(this, "enableWafFailOpenInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableXffClientPortInput() {
        return software.amazon.jsii.Kernel.get(this, "enableXffClientPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableZonalShiftInput() {
        return software.amazon.jsii.Kernel.get(this, "enableZonalShiftInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnforceSecurityGroupInboundRulesOnPrivateLinkTrafficInput() {
        return software.amazon.jsii.Kernel.get(this, "enforceSecurityGroupInboundRulesOnPrivateLinkTrafficInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalInput() {
        return software.amazon.jsii.Kernel.get(this, "internalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb.AlbIpamPools getIpamPoolsInput() {
        return software.amazon.jsii.Kernel.get(this, "ipamPoolsInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbIpamPools.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancerTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb.AlbMinimumLoadBalancerCapacity getMinimumLoadBalancerCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumLoadBalancerCapacityInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbMinimumLoadBalancerCapacity.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreserveHostHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveHostHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSubnetMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getXffHeaderProcessingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "xffHeaderProcessingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getClientKeepAlive() {
        return software.amazon.jsii.Kernel.get(this, "clientKeepAlive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setClientKeepAlive(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "clientKeepAlive", java.util.Objects.requireNonNull(value, "clientKeepAlive is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerOwnedIpv4Pool() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerOwnedIpv4Pool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerOwnedIpv4Pool", java.util.Objects.requireNonNull(value, "customerOwnedIpv4Pool is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDesyncMitigationMode() {
        return software.amazon.jsii.Kernel.get(this, "desyncMitigationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDesyncMitigationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "desyncMitigationMode", java.util.Objects.requireNonNull(value, "desyncMitigationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsRecordClientRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecordClientRoutingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDnsRecordClientRoutingPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dnsRecordClientRoutingPolicy", java.util.Objects.requireNonNull(value, "dnsRecordClientRoutingPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDropInvalidHeaderFields() {
        return software.amazon.jsii.Kernel.get(this, "dropInvalidHeaderFields", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDropInvalidHeaderFields(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dropInvalidHeaderFields", java.util.Objects.requireNonNull(value, "dropInvalidHeaderFields is required"));
    }

    public void setDropInvalidHeaderFields(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dropInvalidHeaderFields", java.util.Objects.requireNonNull(value, "dropInvalidHeaderFields is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableCrossZoneLoadBalancing() {
        return software.amazon.jsii.Kernel.get(this, "enableCrossZoneLoadBalancing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableCrossZoneLoadBalancing(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableCrossZoneLoadBalancing", java.util.Objects.requireNonNull(value, "enableCrossZoneLoadBalancing is required"));
    }

    public void setEnableCrossZoneLoadBalancing(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableCrossZoneLoadBalancing", java.util.Objects.requireNonNull(value, "enableCrossZoneLoadBalancing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDeletionProtection() {
        return software.amazon.jsii.Kernel.get(this, "enableDeletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDeletionProtection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDeletionProtection", java.util.Objects.requireNonNull(value, "enableDeletionProtection is required"));
    }

    public void setEnableDeletionProtection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDeletionProtection", java.util.Objects.requireNonNull(value, "enableDeletionProtection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableHttp2() {
        return software.amazon.jsii.Kernel.get(this, "enableHttp2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableHttp2(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableHttp2", java.util.Objects.requireNonNull(value, "enableHttp2 is required"));
    }

    public void setEnableHttp2(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableHttp2", java.util.Objects.requireNonNull(value, "enableHttp2 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableTlsVersionAndCipherSuiteHeaders() {
        return software.amazon.jsii.Kernel.get(this, "enableTlsVersionAndCipherSuiteHeaders", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableTlsVersionAndCipherSuiteHeaders(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableTlsVersionAndCipherSuiteHeaders", java.util.Objects.requireNonNull(value, "enableTlsVersionAndCipherSuiteHeaders is required"));
    }

    public void setEnableTlsVersionAndCipherSuiteHeaders(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableTlsVersionAndCipherSuiteHeaders", java.util.Objects.requireNonNull(value, "enableTlsVersionAndCipherSuiteHeaders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableWafFailOpen() {
        return software.amazon.jsii.Kernel.get(this, "enableWafFailOpen", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableWafFailOpen(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableWafFailOpen", java.util.Objects.requireNonNull(value, "enableWafFailOpen is required"));
    }

    public void setEnableWafFailOpen(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableWafFailOpen", java.util.Objects.requireNonNull(value, "enableWafFailOpen is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableXffClientPort() {
        return software.amazon.jsii.Kernel.get(this, "enableXffClientPort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableXffClientPort(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableXffClientPort", java.util.Objects.requireNonNull(value, "enableXffClientPort is required"));
    }

    public void setEnableXffClientPort(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableXffClientPort", java.util.Objects.requireNonNull(value, "enableXffClientPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableZonalShift() {
        return software.amazon.jsii.Kernel.get(this, "enableZonalShift", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableZonalShift(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableZonalShift", java.util.Objects.requireNonNull(value, "enableZonalShift is required"));
    }

    public void setEnableZonalShift(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableZonalShift", java.util.Objects.requireNonNull(value, "enableZonalShift is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic() {
        return software.amazon.jsii.Kernel.get(this, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", java.util.Objects.requireNonNull(value, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getInternal() {
        return software.amazon.jsii.Kernel.get(this, "internal", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternal(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "internal", java.util.Objects.requireNonNull(value, "internal is required"));
    }

    public void setInternal(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internal", java.util.Objects.requireNonNull(value, "internal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancerType() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoadBalancerType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancerType", java.util.Objects.requireNonNull(value, "loadBalancerType is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getPreserveHostHeader() {
        return software.amazon.jsii.Kernel.get(this, "preserveHostHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPreserveHostHeader(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "preserveHostHeader", java.util.Objects.requireNonNull(value, "preserveHostHeader is required"));
    }

    public void setPreserveHostHeader(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "preserveHostHeader", java.util.Objects.requireNonNull(value, "preserveHostHeader is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getXffHeaderProcessingMode() {
        return software.amazon.jsii.Kernel.get(this, "xffHeaderProcessingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXffHeaderProcessingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xffHeaderProcessingMode", java.util.Objects.requireNonNull(value, "xffHeaderProcessingMode is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.alb.Alb}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.alb.Alb> {
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
        private imports.aws.alb.AlbConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * access_logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#access_logs Alb#access_logs}
         * <p>
         * @return {@code this}
         * @param accessLogs access_logs block. This parameter is required.
         */
        public Builder accessLogs(final imports.aws.alb.AlbAccessLogs accessLogs) {
            this.config().accessLogs(accessLogs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#client_keep_alive Alb#client_keep_alive}.
         * <p>
         * @return {@code this}
         * @param clientKeepAlive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#client_keep_alive Alb#client_keep_alive}. This parameter is required.
         */
        public Builder clientKeepAlive(final java.lang.Number clientKeepAlive) {
            this.config().clientKeepAlive(clientKeepAlive);
            return this;
        }

        /**
         * connection_logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#connection_logs Alb#connection_logs}
         * <p>
         * @return {@code this}
         * @param connectionLogs connection_logs block. This parameter is required.
         */
        public Builder connectionLogs(final imports.aws.alb.AlbConnectionLogs connectionLogs) {
            this.config().connectionLogs(connectionLogs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#customer_owned_ipv4_pool Alb#customer_owned_ipv4_pool}.
         * <p>
         * @return {@code this}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#customer_owned_ipv4_pool Alb#customer_owned_ipv4_pool}. This parameter is required.
         */
        public Builder customerOwnedIpv4Pool(final java.lang.String customerOwnedIpv4Pool) {
            this.config().customerOwnedIpv4Pool(customerOwnedIpv4Pool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#desync_mitigation_mode Alb#desync_mitigation_mode}.
         * <p>
         * @return {@code this}
         * @param desyncMitigationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#desync_mitigation_mode Alb#desync_mitigation_mode}. This parameter is required.
         */
        public Builder desyncMitigationMode(final java.lang.String desyncMitigationMode) {
            this.config().desyncMitigationMode(desyncMitigationMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#dns_record_client_routing_policy Alb#dns_record_client_routing_policy}.
         * <p>
         * @return {@code this}
         * @param dnsRecordClientRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#dns_record_client_routing_policy Alb#dns_record_client_routing_policy}. This parameter is required.
         */
        public Builder dnsRecordClientRoutingPolicy(final java.lang.String dnsRecordClientRoutingPolicy) {
            this.config().dnsRecordClientRoutingPolicy(dnsRecordClientRoutingPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}.
         * <p>
         * @return {@code this}
         * @param dropInvalidHeaderFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}. This parameter is required.
         */
        public Builder dropInvalidHeaderFields(final java.lang.Boolean dropInvalidHeaderFields) {
            this.config().dropInvalidHeaderFields(dropInvalidHeaderFields);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}.
         * <p>
         * @return {@code this}
         * @param dropInvalidHeaderFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}. This parameter is required.
         */
        public Builder dropInvalidHeaderFields(final com.hashicorp.cdktf.IResolvable dropInvalidHeaderFields) {
            this.config().dropInvalidHeaderFields(dropInvalidHeaderFields);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}.
         * <p>
         * @return {@code this}
         * @param enableCrossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}. This parameter is required.
         */
        public Builder enableCrossZoneLoadBalancing(final java.lang.Boolean enableCrossZoneLoadBalancing) {
            this.config().enableCrossZoneLoadBalancing(enableCrossZoneLoadBalancing);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}.
         * <p>
         * @return {@code this}
         * @param enableCrossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}. This parameter is required.
         */
        public Builder enableCrossZoneLoadBalancing(final com.hashicorp.cdktf.IResolvable enableCrossZoneLoadBalancing) {
            this.config().enableCrossZoneLoadBalancing(enableCrossZoneLoadBalancing);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}.
         * <p>
         * @return {@code this}
         * @param enableDeletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}. This parameter is required.
         */
        public Builder enableDeletionProtection(final java.lang.Boolean enableDeletionProtection) {
            this.config().enableDeletionProtection(enableDeletionProtection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}.
         * <p>
         * @return {@code this}
         * @param enableDeletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}. This parameter is required.
         */
        public Builder enableDeletionProtection(final com.hashicorp.cdktf.IResolvable enableDeletionProtection) {
            this.config().enableDeletionProtection(enableDeletionProtection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}.
         * <p>
         * @return {@code this}
         * @param enableHttp2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}. This parameter is required.
         */
        public Builder enableHttp2(final java.lang.Boolean enableHttp2) {
            this.config().enableHttp2(enableHttp2);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}.
         * <p>
         * @return {@code this}
         * @param enableHttp2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}. This parameter is required.
         */
        public Builder enableHttp2(final com.hashicorp.cdktf.IResolvable enableHttp2) {
            this.config().enableHttp2(enableHttp2);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}.
         * <p>
         * @return {@code this}
         * @param enableTlsVersionAndCipherSuiteHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}. This parameter is required.
         */
        public Builder enableTlsVersionAndCipherSuiteHeaders(final java.lang.Boolean enableTlsVersionAndCipherSuiteHeaders) {
            this.config().enableTlsVersionAndCipherSuiteHeaders(enableTlsVersionAndCipherSuiteHeaders);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}.
         * <p>
         * @return {@code this}
         * @param enableTlsVersionAndCipherSuiteHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}. This parameter is required.
         */
        public Builder enableTlsVersionAndCipherSuiteHeaders(final com.hashicorp.cdktf.IResolvable enableTlsVersionAndCipherSuiteHeaders) {
            this.config().enableTlsVersionAndCipherSuiteHeaders(enableTlsVersionAndCipherSuiteHeaders);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}.
         * <p>
         * @return {@code this}
         * @param enableWafFailOpen Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}. This parameter is required.
         */
        public Builder enableWafFailOpen(final java.lang.Boolean enableWafFailOpen) {
            this.config().enableWafFailOpen(enableWafFailOpen);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}.
         * <p>
         * @return {@code this}
         * @param enableWafFailOpen Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}. This parameter is required.
         */
        public Builder enableWafFailOpen(final com.hashicorp.cdktf.IResolvable enableWafFailOpen) {
            this.config().enableWafFailOpen(enableWafFailOpen);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}.
         * <p>
         * @return {@code this}
         * @param enableXffClientPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}. This parameter is required.
         */
        public Builder enableXffClientPort(final java.lang.Boolean enableXffClientPort) {
            this.config().enableXffClientPort(enableXffClientPort);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}.
         * <p>
         * @return {@code this}
         * @param enableXffClientPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}. This parameter is required.
         */
        public Builder enableXffClientPort(final com.hashicorp.cdktf.IResolvable enableXffClientPort) {
            this.config().enableXffClientPort(enableXffClientPort);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}.
         * <p>
         * @return {@code this}
         * @param enableZonalShift Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}. This parameter is required.
         */
        public Builder enableZonalShift(final java.lang.Boolean enableZonalShift) {
            this.config().enableZonalShift(enableZonalShift);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}.
         * <p>
         * @return {@code this}
         * @param enableZonalShift Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}. This parameter is required.
         */
        public Builder enableZonalShift(final com.hashicorp.cdktf.IResolvable enableZonalShift) {
            this.config().enableZonalShift(enableZonalShift);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enforce_security_group_inbound_rules_on_private_link_traffic Alb#enforce_security_group_inbound_rules_on_private_link_traffic}.
         * <p>
         * @return {@code this}
         * @param enforceSecurityGroupInboundRulesOnPrivateLinkTraffic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enforce_security_group_inbound_rules_on_private_link_traffic Alb#enforce_security_group_inbound_rules_on_private_link_traffic}. This parameter is required.
         */
        public Builder enforceSecurityGroupInboundRulesOnPrivateLinkTraffic(final java.lang.String enforceSecurityGroupInboundRulesOnPrivateLinkTraffic) {
            this.config().enforceSecurityGroupInboundRulesOnPrivateLinkTraffic(enforceSecurityGroupInboundRulesOnPrivateLinkTraffic);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#id Alb#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#id Alb#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#idle_timeout Alb#idle_timeout}.
         * <p>
         * @return {@code this}
         * @param idleTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#idle_timeout Alb#idle_timeout}. This parameter is required.
         */
        public Builder idleTimeout(final java.lang.Number idleTimeout) {
            this.config().idleTimeout(idleTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}.
         * <p>
         * @return {@code this}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}. This parameter is required.
         */
        public Builder internal(final java.lang.Boolean internal) {
            this.config().internal(internal);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}.
         * <p>
         * @return {@code this}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}. This parameter is required.
         */
        public Builder internal(final com.hashicorp.cdktf.IResolvable internal) {
            this.config().internal(internal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ip_address_type Alb#ip_address_type}.
         * <p>
         * @return {@code this}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ip_address_type Alb#ip_address_type}. This parameter is required.
         */
        public Builder ipAddressType(final java.lang.String ipAddressType) {
            this.config().ipAddressType(ipAddressType);
            return this;
        }

        /**
         * ipam_pools block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipam_pools Alb#ipam_pools}
         * <p>
         * @return {@code this}
         * @param ipamPools ipam_pools block. This parameter is required.
         */
        public Builder ipamPools(final imports.aws.alb.AlbIpamPools ipamPools) {
            this.config().ipamPools(ipamPools);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#load_balancer_type Alb#load_balancer_type}.
         * <p>
         * @return {@code this}
         * @param loadBalancerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#load_balancer_type Alb#load_balancer_type}. This parameter is required.
         */
        public Builder loadBalancerType(final java.lang.String loadBalancerType) {
            this.config().loadBalancerType(loadBalancerType);
            return this;
        }

        /**
         * minimum_load_balancer_capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#minimum_load_balancer_capacity Alb#minimum_load_balancer_capacity}
         * <p>
         * @return {@code this}
         * @param minimumLoadBalancerCapacity minimum_load_balancer_capacity block. This parameter is required.
         */
        public Builder minimumLoadBalancerCapacity(final imports.aws.alb.AlbMinimumLoadBalancerCapacity minimumLoadBalancerCapacity) {
            this.config().minimumLoadBalancerCapacity(minimumLoadBalancerCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name Alb#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name Alb#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config().name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name_prefix Alb#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name_prefix Alb#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config().namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}.
         * <p>
         * @return {@code this}
         * @param preserveHostHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}. This parameter is required.
         */
        public Builder preserveHostHeader(final java.lang.Boolean preserveHostHeader) {
            this.config().preserveHostHeader(preserveHostHeader);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}.
         * <p>
         * @return {@code this}
         * @param preserveHostHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}. This parameter is required.
         */
        public Builder preserveHostHeader(final com.hashicorp.cdktf.IResolvable preserveHostHeader) {
            this.config().preserveHostHeader(preserveHostHeader);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#security_groups Alb#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#security_groups Alb#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config().securityGroups(securityGroups);
            return this;
        }

        /**
         * subnet_mapping block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_mapping Alb#subnet_mapping}
         * <p>
         * @return {@code this}
         * @param subnetMapping subnet_mapping block. This parameter is required.
         */
        public Builder subnetMapping(final com.hashicorp.cdktf.IResolvable subnetMapping) {
            this.config().subnetMapping(subnetMapping);
            return this;
        }
        /**
         * subnet_mapping block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_mapping Alb#subnet_mapping}
         * <p>
         * @return {@code this}
         * @param subnetMapping subnet_mapping block. This parameter is required.
         */
        public Builder subnetMapping(final java.util.List<? extends imports.aws.alb.AlbSubnetMapping> subnetMapping) {
            this.config().subnetMapping(subnetMapping);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnets Alb#subnets}.
         * <p>
         * @return {@code this}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnets Alb#subnets}. This parameter is required.
         */
        public Builder subnets(final java.util.List<java.lang.String> subnets) {
            this.config().subnets(subnets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags Alb#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags Alb#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags_all Alb#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags_all Alb#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#timeouts Alb#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.alb.AlbTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#xff_header_processing_mode Alb#xff_header_processing_mode}.
         * <p>
         * @return {@code this}
         * @param xffHeaderProcessingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#xff_header_processing_mode Alb#xff_header_processing_mode}. This parameter is required.
         */
        public Builder xffHeaderProcessingMode(final java.lang.String xffHeaderProcessingMode) {
            this.config().xffHeaderProcessingMode(xffHeaderProcessingMode);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.alb.Alb}.
         */
        @Override
        public imports.aws.alb.Alb build() {
            return new imports.aws.alb.Alb(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.alb.AlbConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.alb.AlbConfig.Builder();
            }
            return this.config;
        }
    }
}

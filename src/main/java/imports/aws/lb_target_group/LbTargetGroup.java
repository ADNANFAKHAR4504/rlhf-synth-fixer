package imports.aws.lb_target_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group aws_lb_target_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroup")
public class LbTargetGroup extends com.hashicorp.cdktf.TerraformResource {

    protected LbTargetGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbTargetGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lb_target_group.LbTargetGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group aws_lb_target_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public LbTargetGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group aws_lb_target_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public LbTargetGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a LbTargetGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbTargetGroup to import. This parameter is required.
     * @param importFromId The id of the existing LbTargetGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LbTargetGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_target_group.LbTargetGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LbTargetGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbTargetGroup to import. This parameter is required.
     * @param importFromId The id of the existing LbTargetGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_target_group.LbTargetGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putHealthCheck(final @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupHealthCheck value) {
        software.amazon.jsii.Kernel.call(this, "putHealthCheck", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStickiness(final @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupStickiness value) {
        software.amazon.jsii.Kernel.call(this, "putStickiness", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetFailover(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetFailover>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetFailover> __cast_cd4240 = (java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetFailover>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lb_target_group.LbTargetGroupTargetFailover __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetFailover", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetGroupHealth(final @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth value) {
        software.amazon.jsii.Kernel.call(this, "putTargetGroupHealth", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetHealthState(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetHealthState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetHealthState> __cast_cd4240 = (java.util.List<imports.aws.lb_target_group.LbTargetGroupTargetHealthState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lb_target_group.LbTargetGroupTargetHealthState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetHealthState", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConnectionTermination() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionTermination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeregistrationDelay() {
        software.amazon.jsii.Kernel.call(this, "resetDeregistrationDelay", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheck() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaMultiValueHeadersEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaMultiValueHeadersEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancingAlgorithmType() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancingAlgorithmType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancingAnomalyMitigation() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancingAnomalyMitigation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancingCrossZoneEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancingCrossZoneEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveClientIp() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveClientIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocolVersion() {
        software.amazon.jsii.Kernel.call(this, "resetProtocolVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProxyProtocolV2() {
        software.amazon.jsii.Kernel.call(this, "resetProxyProtocolV2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlowStart() {
        software.amazon.jsii.Kernel.call(this, "resetSlowStart", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStickiness() {
        software.amazon.jsii.Kernel.call(this, "resetStickiness", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetFailover() {
        software.amazon.jsii.Kernel.call(this, "resetTargetFailover", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupHealth() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupHealth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetHealthState() {
        software.amazon.jsii.Kernel.call(this, "resetTargetHealthState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetType() {
        software.amazon.jsii.Kernel.call(this, "resetTargetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArnSuffix() {
        return software.amazon.jsii.Kernel.get(this, "arnSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupHealthCheckOutputReference getHealthCheck() {
        return software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupHealthCheckOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLoadBalancerArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "loadBalancerArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupStickinessOutputReference getStickiness() {
        return software.amazon.jsii.Kernel.get(this, "stickiness", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupStickinessOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetFailoverList getTargetFailover() {
        return software.amazon.jsii.Kernel.get(this, "targetFailover", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetFailoverList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthOutputReference getTargetGroupHealth() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupHealth", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetHealthStateList getTargetHealthState() {
        return software.amazon.jsii.Kernel.get(this, "targetHealthState", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetHealthStateList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConnectionTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeregistrationDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "deregistrationDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupHealthCheck getHealthCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupHealthCheck.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaMultiValueHeadersEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaMultiValueHeadersEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingAlgorithmTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingAlgorithmTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingAnomalyMitigationInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingAnomalyMitigationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingCrossZoneEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingCrossZoneEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreserveClientIpInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveClientIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProxyProtocolV2Input() {
        return software.amazon.jsii.Kernel.get(this, "proxyProtocolV2Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSlowStartInput() {
        return software.amazon.jsii.Kernel.get(this, "slowStartInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupStickiness getStickinessInput() {
        return software.amazon.jsii.Kernel.get(this, "stickinessInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupStickiness.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetFailoverInput() {
        return software.amazon.jsii.Kernel.get(this, "targetFailoverInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth getTargetGroupHealthInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupHealthInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetHealthStateInput() {
        return software.amazon.jsii.Kernel.get(this, "targetHealthStateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "targetTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConnectionTermination() {
        return software.amazon.jsii.Kernel.get(this, "connectionTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConnectionTermination(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "connectionTermination", java.util.Objects.requireNonNull(value, "connectionTermination is required"));
    }

    public void setConnectionTermination(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "connectionTermination", java.util.Objects.requireNonNull(value, "connectionTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeregistrationDelay() {
        return software.amazon.jsii.Kernel.get(this, "deregistrationDelay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeregistrationDelay(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deregistrationDelay", java.util.Objects.requireNonNull(value, "deregistrationDelay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLambdaMultiValueHeadersEnabled() {
        return software.amazon.jsii.Kernel.get(this, "lambdaMultiValueHeadersEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLambdaMultiValueHeadersEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "lambdaMultiValueHeadersEnabled", java.util.Objects.requireNonNull(value, "lambdaMultiValueHeadersEnabled is required"));
    }

    public void setLambdaMultiValueHeadersEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "lambdaMultiValueHeadersEnabled", java.util.Objects.requireNonNull(value, "lambdaMultiValueHeadersEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancingAlgorithmType() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingAlgorithmType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoadBalancingAlgorithmType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancingAlgorithmType", java.util.Objects.requireNonNull(value, "loadBalancingAlgorithmType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancingAnomalyMitigation() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingAnomalyMitigation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoadBalancingAnomalyMitigation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancingAnomalyMitigation", java.util.Objects.requireNonNull(value, "loadBalancingAnomalyMitigation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancingCrossZoneEnabled() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancingCrossZoneEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoadBalancingCrossZoneEnabled(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancingCrossZoneEnabled", java.util.Objects.requireNonNull(value, "loadBalancingCrossZoneEnabled is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreserveClientIp() {
        return software.amazon.jsii.Kernel.get(this, "preserveClientIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreserveClientIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preserveClientIp", java.util.Objects.requireNonNull(value, "preserveClientIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocolVersion() {
        return software.amazon.jsii.Kernel.get(this, "protocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocolVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocolVersion", java.util.Objects.requireNonNull(value, "protocolVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getProxyProtocolV2() {
        return software.amazon.jsii.Kernel.get(this, "proxyProtocolV2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setProxyProtocolV2(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "proxyProtocolV2", java.util.Objects.requireNonNull(value, "proxyProtocolV2 is required"));
    }

    public void setProxyProtocolV2(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "proxyProtocolV2", java.util.Objects.requireNonNull(value, "proxyProtocolV2 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSlowStart() {
        return software.amazon.jsii.Kernel.get(this, "slowStart", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSlowStart(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "slowStart", java.util.Objects.requireNonNull(value, "slowStart is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetType() {
        return software.amazon.jsii.Kernel.get(this, "targetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetType", java.util.Objects.requireNonNull(value, "targetType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lb_target_group.LbTargetGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lb_target_group.LbTargetGroup> {
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
        private imports.aws.lb_target_group.LbTargetGroupConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}.
         * <p>
         * @return {@code this}
         * @param connectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}. This parameter is required.
         */
        public Builder connectionTermination(final java.lang.Boolean connectionTermination) {
            this.config().connectionTermination(connectionTermination);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}.
         * <p>
         * @return {@code this}
         * @param connectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}. This parameter is required.
         */
        public Builder connectionTermination(final com.hashicorp.cdktf.IResolvable connectionTermination) {
            this.config().connectionTermination(connectionTermination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#deregistration_delay LbTargetGroup#deregistration_delay}.
         * <p>
         * @return {@code this}
         * @param deregistrationDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#deregistration_delay LbTargetGroup#deregistration_delay}. This parameter is required.
         */
        public Builder deregistrationDelay(final java.lang.String deregistrationDelay) {
            this.config().deregistrationDelay(deregistrationDelay);
            return this;
        }

        /**
         * health_check block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#health_check LbTargetGroup#health_check}
         * <p>
         * @return {@code this}
         * @param healthCheck health_check block. This parameter is required.
         */
        public Builder healthCheck(final imports.aws.lb_target_group.LbTargetGroupHealthCheck healthCheck) {
            this.config().healthCheck(healthCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#id LbTargetGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#id LbTargetGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#ip_address_type LbTargetGroup#ip_address_type}.
         * <p>
         * @return {@code this}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#ip_address_type LbTargetGroup#ip_address_type}. This parameter is required.
         */
        public Builder ipAddressType(final java.lang.String ipAddressType) {
            this.config().ipAddressType(ipAddressType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}.
         * <p>
         * @return {@code this}
         * @param lambdaMultiValueHeadersEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}. This parameter is required.
         */
        public Builder lambdaMultiValueHeadersEnabled(final java.lang.Boolean lambdaMultiValueHeadersEnabled) {
            this.config().lambdaMultiValueHeadersEnabled(lambdaMultiValueHeadersEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}.
         * <p>
         * @return {@code this}
         * @param lambdaMultiValueHeadersEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}. This parameter is required.
         */
        public Builder lambdaMultiValueHeadersEnabled(final com.hashicorp.cdktf.IResolvable lambdaMultiValueHeadersEnabled) {
            this.config().lambdaMultiValueHeadersEnabled(lambdaMultiValueHeadersEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_algorithm_type LbTargetGroup#load_balancing_algorithm_type}.
         * <p>
         * @return {@code this}
         * @param loadBalancingAlgorithmType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_algorithm_type LbTargetGroup#load_balancing_algorithm_type}. This parameter is required.
         */
        public Builder loadBalancingAlgorithmType(final java.lang.String loadBalancingAlgorithmType) {
            this.config().loadBalancingAlgorithmType(loadBalancingAlgorithmType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_anomaly_mitigation LbTargetGroup#load_balancing_anomaly_mitigation}.
         * <p>
         * @return {@code this}
         * @param loadBalancingAnomalyMitigation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_anomaly_mitigation LbTargetGroup#load_balancing_anomaly_mitigation}. This parameter is required.
         */
        public Builder loadBalancingAnomalyMitigation(final java.lang.String loadBalancingAnomalyMitigation) {
            this.config().loadBalancingAnomalyMitigation(loadBalancingAnomalyMitigation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_cross_zone_enabled LbTargetGroup#load_balancing_cross_zone_enabled}.
         * <p>
         * @return {@code this}
         * @param loadBalancingCrossZoneEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_cross_zone_enabled LbTargetGroup#load_balancing_cross_zone_enabled}. This parameter is required.
         */
        public Builder loadBalancingCrossZoneEnabled(final java.lang.String loadBalancingCrossZoneEnabled) {
            this.config().loadBalancingCrossZoneEnabled(loadBalancingCrossZoneEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name LbTargetGroup#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name LbTargetGroup#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config().name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name_prefix LbTargetGroup#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name_prefix LbTargetGroup#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config().namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#port LbTargetGroup#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#port LbTargetGroup#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config().port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#preserve_client_ip LbTargetGroup#preserve_client_ip}.
         * <p>
         * @return {@code this}
         * @param preserveClientIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#preserve_client_ip LbTargetGroup#preserve_client_ip}. This parameter is required.
         */
        public Builder preserveClientIp(final java.lang.String preserveClientIp) {
            this.config().preserveClientIp(preserveClientIp);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol LbTargetGroup#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol LbTargetGroup#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.String protocol) {
            this.config().protocol(protocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol_version LbTargetGroup#protocol_version}.
         * <p>
         * @return {@code this}
         * @param protocolVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol_version LbTargetGroup#protocol_version}. This parameter is required.
         */
        public Builder protocolVersion(final java.lang.String protocolVersion) {
            this.config().protocolVersion(protocolVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}.
         * <p>
         * @return {@code this}
         * @param proxyProtocolV2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}. This parameter is required.
         */
        public Builder proxyProtocolV2(final java.lang.Boolean proxyProtocolV2) {
            this.config().proxyProtocolV2(proxyProtocolV2);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}.
         * <p>
         * @return {@code this}
         * @param proxyProtocolV2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}. This parameter is required.
         */
        public Builder proxyProtocolV2(final com.hashicorp.cdktf.IResolvable proxyProtocolV2) {
            this.config().proxyProtocolV2(proxyProtocolV2);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#slow_start LbTargetGroup#slow_start}.
         * <p>
         * @return {@code this}
         * @param slowStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#slow_start LbTargetGroup#slow_start}. This parameter is required.
         */
        public Builder slowStart(final java.lang.Number slowStart) {
            this.config().slowStart(slowStart);
            return this;
        }

        /**
         * stickiness block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#stickiness LbTargetGroup#stickiness}
         * <p>
         * @return {@code this}
         * @param stickiness stickiness block. This parameter is required.
         */
        public Builder stickiness(final imports.aws.lb_target_group.LbTargetGroupStickiness stickiness) {
            this.config().stickiness(stickiness);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags LbTargetGroup#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags LbTargetGroup#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags_all LbTargetGroup#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags_all LbTargetGroup#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * target_failover block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_failover LbTargetGroup#target_failover}
         * <p>
         * @return {@code this}
         * @param targetFailover target_failover block. This parameter is required.
         */
        public Builder targetFailover(final com.hashicorp.cdktf.IResolvable targetFailover) {
            this.config().targetFailover(targetFailover);
            return this;
        }
        /**
         * target_failover block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_failover LbTargetGroup#target_failover}
         * <p>
         * @return {@code this}
         * @param targetFailover target_failover block. This parameter is required.
         */
        public Builder targetFailover(final java.util.List<? extends imports.aws.lb_target_group.LbTargetGroupTargetFailover> targetFailover) {
            this.config().targetFailover(targetFailover);
            return this;
        }

        /**
         * target_group_health block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_group_health LbTargetGroup#target_group_health}
         * <p>
         * @return {@code this}
         * @param targetGroupHealth target_group_health block. This parameter is required.
         */
        public Builder targetGroupHealth(final imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth targetGroupHealth) {
            this.config().targetGroupHealth(targetGroupHealth);
            return this;
        }

        /**
         * target_health_state block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_health_state LbTargetGroup#target_health_state}
         * <p>
         * @return {@code this}
         * @param targetHealthState target_health_state block. This parameter is required.
         */
        public Builder targetHealthState(final com.hashicorp.cdktf.IResolvable targetHealthState) {
            this.config().targetHealthState(targetHealthState);
            return this;
        }
        /**
         * target_health_state block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_health_state LbTargetGroup#target_health_state}
         * <p>
         * @return {@code this}
         * @param targetHealthState target_health_state block. This parameter is required.
         */
        public Builder targetHealthState(final java.util.List<? extends imports.aws.lb_target_group.LbTargetGroupTargetHealthState> targetHealthState) {
            this.config().targetHealthState(targetHealthState);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_type LbTargetGroup#target_type}.
         * <p>
         * @return {@code this}
         * @param targetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_type LbTargetGroup#target_type}. This parameter is required.
         */
        public Builder targetType(final java.lang.String targetType) {
            this.config().targetType(targetType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#vpc_id LbTargetGroup#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#vpc_id LbTargetGroup#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config().vpcId(vpcId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lb_target_group.LbTargetGroup}.
         */
        @Override
        public imports.aws.lb_target_group.LbTargetGroup build() {
            return new imports.aws.lb_target_group.LbTargetGroup(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.lb_target_group.LbTargetGroupConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.lb_target_group.LbTargetGroupConfig.Builder();
            }
            return this.config;
        }
    }
}

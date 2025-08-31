package imports.aws.route53_record;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record aws_route53_record}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.213Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53Record")
public class Route53Record extends com.hashicorp.cdktf.TerraformResource {

    protected Route53Record(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53Record(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.route53_record.Route53Record.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record aws_route53_record} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Route53Record(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Route53Record resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53Record to import. This parameter is required.
     * @param importFromId The id of the existing Route53Record that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Route53Record to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_record.Route53Record.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Route53Record resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53Record to import. This parameter is required.
     * @param importFromId The id of the existing Route53Record that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_record.Route53Record.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAlias(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordAlias value) {
        software.amazon.jsii.Kernel.call(this, "putAlias", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCidrRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordCidrRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putCidrRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFailoverRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordFailoverRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putFailoverRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGeolocationRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putGeolocationRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGeoproximityRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putGeoproximityRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLatencyRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordLatencyRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putLatencyRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWeightedRoutingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordWeightedRoutingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putWeightedRoutingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlias() {
        software.amazon.jsii.Kernel.call(this, "resetAlias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowOverwrite() {
        software.amazon.jsii.Kernel.call(this, "resetAllowOverwrite", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCidrRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetCidrRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailoverRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetFailoverRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeolocationRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetGeolocationRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeoproximityRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetGeoproximityRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckId() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLatencyRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetLatencyRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultivalueAnswerRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetMultivalueAnswerRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecords() {
        software.amazon.jsii.Kernel.call(this, "resetRecords", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSetIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSetIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTtl() {
        software.amazon.jsii.Kernel.call(this, "resetTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeightedRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetWeightedRoutingPolicy", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordAliasOutputReference getAlias() {
        return software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordAliasOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordCidrRoutingPolicyOutputReference getCidrRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "cidrRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordCidrRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordFailoverRoutingPolicyOutputReference getFailoverRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "failoverRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordFailoverRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFqdn() {
        return software.amazon.jsii.Kernel.get(this, "fqdn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordGeolocationRoutingPolicyOutputReference getGeolocationRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "geolocationRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeolocationRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicyOutputReference getGeoproximityRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "geoproximityRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordLatencyRoutingPolicyOutputReference getLatencyRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "latencyRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordLatencyRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_record.Route53RecordWeightedRoutingPolicyOutputReference getWeightedRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "weightedRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordWeightedRoutingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordAlias getAliasInput() {
        return software.amazon.jsii.Kernel.get(this, "aliasInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordAlias.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowOverwriteInput() {
        return software.amazon.jsii.Kernel.get(this, "allowOverwriteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordCidrRoutingPolicy getCidrRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "cidrRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordCidrRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordFailoverRoutingPolicy getFailoverRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "failoverRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordFailoverRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy getGeolocationRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "geolocationRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy getGeoproximityRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "geoproximityRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckIdInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordLatencyRoutingPolicy getLatencyRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "latencyRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordLatencyRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultivalueAnswerRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "multivalueAnswerRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecordsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "recordsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSetIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "setIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "ttlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordWeightedRoutingPolicy getWeightedRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "weightedRoutingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordWeightedRoutingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getZoneIdInput() {
        return software.amazon.jsii.Kernel.get(this, "zoneIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowOverwrite() {
        return software.amazon.jsii.Kernel.get(this, "allowOverwrite", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowOverwrite(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowOverwrite", java.util.Objects.requireNonNull(value, "allowOverwrite is required"));
    }

    public void setAllowOverwrite(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowOverwrite", java.util.Objects.requireNonNull(value, "allowOverwrite is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHealthCheckId() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHealthCheckId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckId", java.util.Objects.requireNonNull(value, "healthCheckId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultivalueAnswerRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "multivalueAnswerRoutingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultivalueAnswerRoutingPolicy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multivalueAnswerRoutingPolicy", java.util.Objects.requireNonNull(value, "multivalueAnswerRoutingPolicy is required"));
    }

    public void setMultivalueAnswerRoutingPolicy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multivalueAnswerRoutingPolicy", java.util.Objects.requireNonNull(value, "multivalueAnswerRoutingPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRecords() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "records", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRecords(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "records", java.util.Objects.requireNonNull(value, "records is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSetIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "setIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSetIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "setIdentifier", java.util.Objects.requireNonNull(value, "setIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTtl() {
        return software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ttl", java.util.Objects.requireNonNull(value, "ttl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getZoneId() {
        return software.amazon.jsii.Kernel.get(this, "zoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setZoneId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "zoneId", java.util.Objects.requireNonNull(value, "zoneId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.route53_record.Route53Record}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.route53_record.Route53Record> {
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
        private final imports.aws.route53_record.Route53RecordConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.route53_record.Route53RecordConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#name Route53Record#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#name Route53Record#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#type Route53Record#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#type Route53Record#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#zone_id Route53Record#zone_id}.
         * <p>
         * @return {@code this}
         * @param zoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#zone_id Route53Record#zone_id}. This parameter is required.
         */
        public Builder zoneId(final java.lang.String zoneId) {
            this.config.zoneId(zoneId);
            return this;
        }

        /**
         * alias block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#alias Route53Record#alias}
         * <p>
         * @return {@code this}
         * @param alias alias block. This parameter is required.
         */
        public Builder alias(final imports.aws.route53_record.Route53RecordAlias alias) {
            this.config.alias(alias);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}.
         * <p>
         * @return {@code this}
         * @param allowOverwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}. This parameter is required.
         */
        public Builder allowOverwrite(final java.lang.Boolean allowOverwrite) {
            this.config.allowOverwrite(allowOverwrite);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}.
         * <p>
         * @return {@code this}
         * @param allowOverwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}. This parameter is required.
         */
        public Builder allowOverwrite(final com.hashicorp.cdktf.IResolvable allowOverwrite) {
            this.config.allowOverwrite(allowOverwrite);
            return this;
        }

        /**
         * cidr_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#cidr_routing_policy Route53Record#cidr_routing_policy}
         * <p>
         * @return {@code this}
         * @param cidrRoutingPolicy cidr_routing_policy block. This parameter is required.
         */
        public Builder cidrRoutingPolicy(final imports.aws.route53_record.Route53RecordCidrRoutingPolicy cidrRoutingPolicy) {
            this.config.cidrRoutingPolicy(cidrRoutingPolicy);
            return this;
        }

        /**
         * failover_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#failover_routing_policy Route53Record#failover_routing_policy}
         * <p>
         * @return {@code this}
         * @param failoverRoutingPolicy failover_routing_policy block. This parameter is required.
         */
        public Builder failoverRoutingPolicy(final imports.aws.route53_record.Route53RecordFailoverRoutingPolicy failoverRoutingPolicy) {
            this.config.failoverRoutingPolicy(failoverRoutingPolicy);
            return this;
        }

        /**
         * geolocation_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geolocation_routing_policy Route53Record#geolocation_routing_policy}
         * <p>
         * @return {@code this}
         * @param geolocationRoutingPolicy geolocation_routing_policy block. This parameter is required.
         */
        public Builder geolocationRoutingPolicy(final imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy geolocationRoutingPolicy) {
            this.config.geolocationRoutingPolicy(geolocationRoutingPolicy);
            return this;
        }

        /**
         * geoproximity_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geoproximity_routing_policy Route53Record#geoproximity_routing_policy}
         * <p>
         * @return {@code this}
         * @param geoproximityRoutingPolicy geoproximity_routing_policy block. This parameter is required.
         */
        public Builder geoproximityRoutingPolicy(final imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy geoproximityRoutingPolicy) {
            this.config.geoproximityRoutingPolicy(geoproximityRoutingPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#health_check_id Route53Record#health_check_id}.
         * <p>
         * @return {@code this}
         * @param healthCheckId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#health_check_id Route53Record#health_check_id}. This parameter is required.
         */
        public Builder healthCheckId(final java.lang.String healthCheckId) {
            this.config.healthCheckId(healthCheckId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#id Route53Record#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#id Route53Record#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * latency_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#latency_routing_policy Route53Record#latency_routing_policy}
         * <p>
         * @return {@code this}
         * @param latencyRoutingPolicy latency_routing_policy block. This parameter is required.
         */
        public Builder latencyRoutingPolicy(final imports.aws.route53_record.Route53RecordLatencyRoutingPolicy latencyRoutingPolicy) {
            this.config.latencyRoutingPolicy(latencyRoutingPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}.
         * <p>
         * @return {@code this}
         * @param multivalueAnswerRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}. This parameter is required.
         */
        public Builder multivalueAnswerRoutingPolicy(final java.lang.Boolean multivalueAnswerRoutingPolicy) {
            this.config.multivalueAnswerRoutingPolicy(multivalueAnswerRoutingPolicy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}.
         * <p>
         * @return {@code this}
         * @param multivalueAnswerRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}. This parameter is required.
         */
        public Builder multivalueAnswerRoutingPolicy(final com.hashicorp.cdktf.IResolvable multivalueAnswerRoutingPolicy) {
            this.config.multivalueAnswerRoutingPolicy(multivalueAnswerRoutingPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#records Route53Record#records}.
         * <p>
         * @return {@code this}
         * @param records Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#records Route53Record#records}. This parameter is required.
         */
        public Builder records(final java.util.List<java.lang.String> records) {
            this.config.records(records);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#set_identifier Route53Record#set_identifier}.
         * <p>
         * @return {@code this}
         * @param setIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#set_identifier Route53Record#set_identifier}. This parameter is required.
         */
        public Builder setIdentifier(final java.lang.String setIdentifier) {
            this.config.setIdentifier(setIdentifier);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#timeouts Route53Record#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.route53_record.Route53RecordTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#ttl Route53Record#ttl}.
         * <p>
         * @return {@code this}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#ttl Route53Record#ttl}. This parameter is required.
         */
        public Builder ttl(final java.lang.Number ttl) {
            this.config.ttl(ttl);
            return this;
        }

        /**
         * weighted_routing_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#weighted_routing_policy Route53Record#weighted_routing_policy}
         * <p>
         * @return {@code this}
         * @param weightedRoutingPolicy weighted_routing_policy block. This parameter is required.
         */
        public Builder weightedRoutingPolicy(final imports.aws.route53_record.Route53RecordWeightedRoutingPolicy weightedRoutingPolicy) {
            this.config.weightedRoutingPolicy(weightedRoutingPolicy);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.route53_record.Route53Record}.
         */
        @Override
        public imports.aws.route53_record.Route53Record build() {
            return new imports.aws.route53_record.Route53Record(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

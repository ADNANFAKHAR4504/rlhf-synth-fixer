package imports.aws.connect_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance aws_connect_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.384Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstance.ConnectInstance")
public class ConnectInstance extends com.hashicorp.cdktf.TerraformResource {

    protected ConnectInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.connect_instance.ConnectInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance aws_connect_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ConnectInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.connect_instance.ConnectInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ConnectInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ConnectInstance to import. This parameter is required.
     * @param importFromId The id of the existing ConnectInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ConnectInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.connect_instance.ConnectInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ConnectInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ConnectInstance to import. This parameter is required.
     * @param importFromId The id of the existing ConnectInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.connect_instance.ConnectInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.connect_instance.ConnectInstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoResolveBestVoicesEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutoResolveBestVoicesEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContactFlowLogsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetContactFlowLogsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContactLensEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetContactLensEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEarlyMediaEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEarlyMediaEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceAlias() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceAlias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiPartyConferenceEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetMultiPartyConferenceEnabled", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_instance.ConnectInstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance.ConnectInstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoResolveBestVoicesEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "autoResolveBestVoicesEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContactFlowLogsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "contactFlowLogsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContactLensEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "contactLensEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEarlyMediaEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "earlyMediaEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityManagementTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "identityManagementTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInboundCallsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "inboundCallsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceAliasInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceAliasInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiPartyConferenceEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "multiPartyConferenceEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOutboundCallsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "outboundCallsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoResolveBestVoicesEnabled() {
        return software.amazon.jsii.Kernel.get(this, "autoResolveBestVoicesEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoResolveBestVoicesEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoResolveBestVoicesEnabled", java.util.Objects.requireNonNull(value, "autoResolveBestVoicesEnabled is required"));
    }

    public void setAutoResolveBestVoicesEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoResolveBestVoicesEnabled", java.util.Objects.requireNonNull(value, "autoResolveBestVoicesEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getContactFlowLogsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "contactFlowLogsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setContactFlowLogsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "contactFlowLogsEnabled", java.util.Objects.requireNonNull(value, "contactFlowLogsEnabled is required"));
    }

    public void setContactFlowLogsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "contactFlowLogsEnabled", java.util.Objects.requireNonNull(value, "contactFlowLogsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getContactLensEnabled() {
        return software.amazon.jsii.Kernel.get(this, "contactLensEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setContactLensEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "contactLensEnabled", java.util.Objects.requireNonNull(value, "contactLensEnabled is required"));
    }

    public void setContactLensEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "contactLensEnabled", java.util.Objects.requireNonNull(value, "contactLensEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEarlyMediaEnabled() {
        return software.amazon.jsii.Kernel.get(this, "earlyMediaEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEarlyMediaEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "earlyMediaEnabled", java.util.Objects.requireNonNull(value, "earlyMediaEnabled is required"));
    }

    public void setEarlyMediaEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "earlyMediaEnabled", java.util.Objects.requireNonNull(value, "earlyMediaEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityManagementType() {
        return software.amazon.jsii.Kernel.get(this, "identityManagementType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityManagementType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityManagementType", java.util.Objects.requireNonNull(value, "identityManagementType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInboundCallsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "inboundCallsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInboundCallsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "inboundCallsEnabled", java.util.Objects.requireNonNull(value, "inboundCallsEnabled is required"));
    }

    public void setInboundCallsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "inboundCallsEnabled", java.util.Objects.requireNonNull(value, "inboundCallsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceAlias() {
        return software.amazon.jsii.Kernel.get(this, "instanceAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceAlias(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceAlias", java.util.Objects.requireNonNull(value, "instanceAlias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiPartyConferenceEnabled() {
        return software.amazon.jsii.Kernel.get(this, "multiPartyConferenceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiPartyConferenceEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiPartyConferenceEnabled", java.util.Objects.requireNonNull(value, "multiPartyConferenceEnabled is required"));
    }

    public void setMultiPartyConferenceEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiPartyConferenceEnabled", java.util.Objects.requireNonNull(value, "multiPartyConferenceEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOutboundCallsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "outboundCallsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOutboundCallsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "outboundCallsEnabled", java.util.Objects.requireNonNull(value, "outboundCallsEnabled is required"));
    }

    public void setOutboundCallsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "outboundCallsEnabled", java.util.Objects.requireNonNull(value, "outboundCallsEnabled is required"));
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
     * A fluent builder for {@link imports.aws.connect_instance.ConnectInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.connect_instance.ConnectInstance> {
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
        private final imports.aws.connect_instance.ConnectInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.connect_instance.ConnectInstanceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#identity_management_type ConnectInstance#identity_management_type}.
         * <p>
         * @return {@code this}
         * @param identityManagementType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#identity_management_type ConnectInstance#identity_management_type}. This parameter is required.
         */
        public Builder identityManagementType(final java.lang.String identityManagementType) {
            this.config.identityManagementType(identityManagementType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}.
         * <p>
         * @return {@code this}
         * @param inboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}. This parameter is required.
         */
        public Builder inboundCallsEnabled(final java.lang.Boolean inboundCallsEnabled) {
            this.config.inboundCallsEnabled(inboundCallsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}.
         * <p>
         * @return {@code this}
         * @param inboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}. This parameter is required.
         */
        public Builder inboundCallsEnabled(final com.hashicorp.cdktf.IResolvable inboundCallsEnabled) {
            this.config.inboundCallsEnabled(inboundCallsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}.
         * <p>
         * @return {@code this}
         * @param outboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}. This parameter is required.
         */
        public Builder outboundCallsEnabled(final java.lang.Boolean outboundCallsEnabled) {
            this.config.outboundCallsEnabled(outboundCallsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}.
         * <p>
         * @return {@code this}
         * @param outboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}. This parameter is required.
         */
        public Builder outboundCallsEnabled(final com.hashicorp.cdktf.IResolvable outboundCallsEnabled) {
            this.config.outboundCallsEnabled(outboundCallsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}.
         * <p>
         * @return {@code this}
         * @param autoResolveBestVoicesEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}. This parameter is required.
         */
        public Builder autoResolveBestVoicesEnabled(final java.lang.Boolean autoResolveBestVoicesEnabled) {
            this.config.autoResolveBestVoicesEnabled(autoResolveBestVoicesEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}.
         * <p>
         * @return {@code this}
         * @param autoResolveBestVoicesEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}. This parameter is required.
         */
        public Builder autoResolveBestVoicesEnabled(final com.hashicorp.cdktf.IResolvable autoResolveBestVoicesEnabled) {
            this.config.autoResolveBestVoicesEnabled(autoResolveBestVoicesEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}.
         * <p>
         * @return {@code this}
         * @param contactFlowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}. This parameter is required.
         */
        public Builder contactFlowLogsEnabled(final java.lang.Boolean contactFlowLogsEnabled) {
            this.config.contactFlowLogsEnabled(contactFlowLogsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}.
         * <p>
         * @return {@code this}
         * @param contactFlowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}. This parameter is required.
         */
        public Builder contactFlowLogsEnabled(final com.hashicorp.cdktf.IResolvable contactFlowLogsEnabled) {
            this.config.contactFlowLogsEnabled(contactFlowLogsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}.
         * <p>
         * @return {@code this}
         * @param contactLensEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}. This parameter is required.
         */
        public Builder contactLensEnabled(final java.lang.Boolean contactLensEnabled) {
            this.config.contactLensEnabled(contactLensEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}.
         * <p>
         * @return {@code this}
         * @param contactLensEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}. This parameter is required.
         */
        public Builder contactLensEnabled(final com.hashicorp.cdktf.IResolvable contactLensEnabled) {
            this.config.contactLensEnabled(contactLensEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#directory_id ConnectInstance#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#directory_id ConnectInstance#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config.directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}.
         * <p>
         * @return {@code this}
         * @param earlyMediaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}. This parameter is required.
         */
        public Builder earlyMediaEnabled(final java.lang.Boolean earlyMediaEnabled) {
            this.config.earlyMediaEnabled(earlyMediaEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}.
         * <p>
         * @return {@code this}
         * @param earlyMediaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}. This parameter is required.
         */
        public Builder earlyMediaEnabled(final com.hashicorp.cdktf.IResolvable earlyMediaEnabled) {
            this.config.earlyMediaEnabled(earlyMediaEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#id ConnectInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#id ConnectInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#instance_alias ConnectInstance#instance_alias}.
         * <p>
         * @return {@code this}
         * @param instanceAlias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#instance_alias ConnectInstance#instance_alias}. This parameter is required.
         */
        public Builder instanceAlias(final java.lang.String instanceAlias) {
            this.config.instanceAlias(instanceAlias);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}.
         * <p>
         * @return {@code this}
         * @param multiPartyConferenceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}. This parameter is required.
         */
        public Builder multiPartyConferenceEnabled(final java.lang.Boolean multiPartyConferenceEnabled) {
            this.config.multiPartyConferenceEnabled(multiPartyConferenceEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}.
         * <p>
         * @return {@code this}
         * @param multiPartyConferenceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}. This parameter is required.
         */
        public Builder multiPartyConferenceEnabled(final com.hashicorp.cdktf.IResolvable multiPartyConferenceEnabled) {
            this.config.multiPartyConferenceEnabled(multiPartyConferenceEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags ConnectInstance#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags ConnectInstance#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags_all ConnectInstance#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags_all ConnectInstance#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#timeouts ConnectInstance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.connect_instance.ConnectInstanceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.connect_instance.ConnectInstance}.
         */
        @Override
        public imports.aws.connect_instance.ConnectInstance build() {
            return new imports.aws.connect_instance.ConnectInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

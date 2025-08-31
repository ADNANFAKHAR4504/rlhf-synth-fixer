package imports.aws.chime_voice_connector_logging;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging aws_chime_voice_connector_logging}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.203Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorLogging.ChimeVoiceConnectorLogging")
public class ChimeVoiceConnectorLogging extends com.hashicorp.cdktf.TerraformResource {

    protected ChimeVoiceConnectorLogging(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimeVoiceConnectorLogging(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging aws_chime_voice_connector_logging} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ChimeVoiceConnectorLogging(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLoggingConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ChimeVoiceConnectorLogging resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ChimeVoiceConnectorLogging to import. This parameter is required.
     * @param importFromId The id of the existing ChimeVoiceConnectorLogging that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ChimeVoiceConnectorLogging to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ChimeVoiceConnectorLogging resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ChimeVoiceConnectorLogging to import. This parameter is required.
     * @param importFromId The id of the existing ChimeVoiceConnectorLogging that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetEnableMediaMetricLogs() {
        software.amazon.jsii.Kernel.call(this, "resetEnableMediaMetricLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableSipLogs() {
        software.amazon.jsii.Kernel.call(this, "resetEnableSipLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableMediaMetricLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableMediaMetricLogsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableSipLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableSipLogsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVoiceConnectorIdInput() {
        return software.amazon.jsii.Kernel.get(this, "voiceConnectorIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableMediaMetricLogs() {
        return software.amazon.jsii.Kernel.get(this, "enableMediaMetricLogs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableMediaMetricLogs(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableMediaMetricLogs", java.util.Objects.requireNonNull(value, "enableMediaMetricLogs is required"));
    }

    public void setEnableMediaMetricLogs(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableMediaMetricLogs", java.util.Objects.requireNonNull(value, "enableMediaMetricLogs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableSipLogs() {
        return software.amazon.jsii.Kernel.get(this, "enableSipLogs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableSipLogs(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableSipLogs", java.util.Objects.requireNonNull(value, "enableSipLogs is required"));
    }

    public void setEnableSipLogs(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableSipLogs", java.util.Objects.requireNonNull(value, "enableSipLogs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVoiceConnectorId() {
        return software.amazon.jsii.Kernel.get(this, "voiceConnectorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVoiceConnectorId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "voiceConnectorId", java.util.Objects.requireNonNull(value, "voiceConnectorId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging> {
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
        private final imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLoggingConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLoggingConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#voice_connector_id ChimeVoiceConnectorLogging#voice_connector_id}.
         * <p>
         * @return {@code this}
         * @param voiceConnectorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#voice_connector_id ChimeVoiceConnectorLogging#voice_connector_id}. This parameter is required.
         */
        public Builder voiceConnectorId(final java.lang.String voiceConnectorId) {
            this.config.voiceConnectorId(voiceConnectorId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_media_metric_logs ChimeVoiceConnectorLogging#enable_media_metric_logs}.
         * <p>
         * @return {@code this}
         * @param enableMediaMetricLogs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_media_metric_logs ChimeVoiceConnectorLogging#enable_media_metric_logs}. This parameter is required.
         */
        public Builder enableMediaMetricLogs(final java.lang.Boolean enableMediaMetricLogs) {
            this.config.enableMediaMetricLogs(enableMediaMetricLogs);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_media_metric_logs ChimeVoiceConnectorLogging#enable_media_metric_logs}.
         * <p>
         * @return {@code this}
         * @param enableMediaMetricLogs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_media_metric_logs ChimeVoiceConnectorLogging#enable_media_metric_logs}. This parameter is required.
         */
        public Builder enableMediaMetricLogs(final com.hashicorp.cdktf.IResolvable enableMediaMetricLogs) {
            this.config.enableMediaMetricLogs(enableMediaMetricLogs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_sip_logs ChimeVoiceConnectorLogging#enable_sip_logs}.
         * <p>
         * @return {@code this}
         * @param enableSipLogs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_sip_logs ChimeVoiceConnectorLogging#enable_sip_logs}. This parameter is required.
         */
        public Builder enableSipLogs(final java.lang.Boolean enableSipLogs) {
            this.config.enableSipLogs(enableSipLogs);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_sip_logs ChimeVoiceConnectorLogging#enable_sip_logs}.
         * <p>
         * @return {@code this}
         * @param enableSipLogs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#enable_sip_logs ChimeVoiceConnectorLogging#enable_sip_logs}. This parameter is required.
         */
        public Builder enableSipLogs(final com.hashicorp.cdktf.IResolvable enableSipLogs) {
            this.config.enableSipLogs(enableSipLogs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#id ChimeVoiceConnectorLogging#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_logging#id ChimeVoiceConnectorLogging#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging}.
         */
        @Override
        public imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging build() {
            return new imports.aws.chime_voice_connector_logging.ChimeVoiceConnectorLogging(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

package imports.aws.ses_configuration_set;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set aws_ses_configuration_set}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesConfigurationSet.SesConfigurationSet")
public class SesConfigurationSet extends com.hashicorp.cdktf.TerraformResource {

    protected SesConfigurationSet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesConfigurationSet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ses_configuration_set.SesConfigurationSet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set aws_ses_configuration_set} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SesConfigurationSet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ses_configuration_set.SesConfigurationSetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SesConfigurationSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesConfigurationSet to import. This parameter is required.
     * @param importFromId The id of the existing SesConfigurationSet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SesConfigurationSet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_configuration_set.SesConfigurationSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SesConfigurationSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesConfigurationSet to import. This parameter is required.
     * @param importFromId The id of the existing SesConfigurationSet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_configuration_set.SesConfigurationSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeliveryOptions(final @org.jetbrains.annotations.NotNull imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDeliveryOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTrackingOptions(final @org.jetbrains.annotations.NotNull imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putTrackingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeliveryOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReputationMetricsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetReputationMetricsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSendingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetSendingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrackingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetTrackingOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptionsOutputReference getDeliveryOptions() {
        return software.amazon.jsii.Kernel.get(this, "deliveryOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastFreshStart() {
        return software.amazon.jsii.Kernel.get(this, "lastFreshStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptionsOutputReference getTrackingOptions() {
        return software.amazon.jsii.Kernel.get(this, "trackingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions getDeliveryOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReputationMetricsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "reputationMetricsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSendingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "sendingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions getTrackingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "trackingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReputationMetricsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "reputationMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReputationMetricsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "reputationMetricsEnabled", java.util.Objects.requireNonNull(value, "reputationMetricsEnabled is required"));
    }

    public void setReputationMetricsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "reputationMetricsEnabled", java.util.Objects.requireNonNull(value, "reputationMetricsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSendingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "sendingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSendingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sendingEnabled", java.util.Objects.requireNonNull(value, "sendingEnabled is required"));
    }

    public void setSendingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sendingEnabled", java.util.Objects.requireNonNull(value, "sendingEnabled is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ses_configuration_set.SesConfigurationSet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ses_configuration_set.SesConfigurationSet> {
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
        private final imports.aws.ses_configuration_set.SesConfigurationSetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ses_configuration_set.SesConfigurationSetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#name SesConfigurationSet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#name SesConfigurationSet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * delivery_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#delivery_options SesConfigurationSet#delivery_options}
         * <p>
         * @return {@code this}
         * @param deliveryOptions delivery_options block. This parameter is required.
         */
        public Builder deliveryOptions(final imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions deliveryOptions) {
            this.config.deliveryOptions(deliveryOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#id SesConfigurationSet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#id SesConfigurationSet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}.
         * <p>
         * @return {@code this}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}. This parameter is required.
         */
        public Builder reputationMetricsEnabled(final java.lang.Boolean reputationMetricsEnabled) {
            this.config.reputationMetricsEnabled(reputationMetricsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}.
         * <p>
         * @return {@code this}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#reputation_metrics_enabled SesConfigurationSet#reputation_metrics_enabled}. This parameter is required.
         */
        public Builder reputationMetricsEnabled(final com.hashicorp.cdktf.IResolvable reputationMetricsEnabled) {
            this.config.reputationMetricsEnabled(reputationMetricsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}.
         * <p>
         * @return {@code this}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}. This parameter is required.
         */
        public Builder sendingEnabled(final java.lang.Boolean sendingEnabled) {
            this.config.sendingEnabled(sendingEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}.
         * <p>
         * @return {@code this}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#sending_enabled SesConfigurationSet#sending_enabled}. This parameter is required.
         */
        public Builder sendingEnabled(final com.hashicorp.cdktf.IResolvable sendingEnabled) {
            this.config.sendingEnabled(sendingEnabled);
            return this;
        }

        /**
         * tracking_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#tracking_options SesConfigurationSet#tracking_options}
         * <p>
         * @return {@code this}
         * @param trackingOptions tracking_options block. This parameter is required.
         */
        public Builder trackingOptions(final imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions trackingOptions) {
            this.config.trackingOptions(trackingOptions);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ses_configuration_set.SesConfigurationSet}.
         */
        @Override
        public imports.aws.ses_configuration_set.SesConfigurationSet build() {
            return new imports.aws.ses_configuration_set.SesConfigurationSet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

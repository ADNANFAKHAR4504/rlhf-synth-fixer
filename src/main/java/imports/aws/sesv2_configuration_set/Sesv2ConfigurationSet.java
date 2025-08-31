package imports.aws.sesv2_configuration_set;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set aws_sesv2_configuration_set}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.455Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSet")
public class Sesv2ConfigurationSet extends com.hashicorp.cdktf.TerraformResource {

    protected Sesv2ConfigurationSet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set aws_sesv2_configuration_set} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Sesv2ConfigurationSet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Sesv2ConfigurationSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2ConfigurationSet to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2ConfigurationSet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Sesv2ConfigurationSet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Sesv2ConfigurationSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2ConfigurationSet to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2ConfigurationSet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeliveryOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDeliveryOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putReputationOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions value) {
        software.amazon.jsii.Kernel.call(this, "putReputationOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSendingOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putSendingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSuppressionOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions value) {
        software.amazon.jsii.Kernel.call(this, "putSuppressionOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTrackingOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putTrackingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVdmOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions value) {
        software.amazon.jsii.Kernel.call(this, "putVdmOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeliveryOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReputationOptions() {
        software.amazon.jsii.Kernel.call(this, "resetReputationOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSendingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSendingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuppressionOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSuppressionOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrackingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetTrackingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVdmOptions() {
        software.amazon.jsii.Kernel.call(this, "resetVdmOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptionsOutputReference getDeliveryOptions() {
        return software.amazon.jsii.Kernel.get(this, "deliveryOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptionsOutputReference getReputationOptions() {
        return software.amazon.jsii.Kernel.get(this, "reputationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptionsOutputReference getSendingOptions() {
        return software.amazon.jsii.Kernel.get(this, "sendingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptionsOutputReference getSuppressionOptions() {
        return software.amazon.jsii.Kernel.get(this, "suppressionOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptionsOutputReference getTrackingOptions() {
        return software.amazon.jsii.Kernel.get(this, "trackingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsOutputReference getVdmOptions() {
        return software.amazon.jsii.Kernel.get(this, "vdmOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions getDeliveryOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions getReputationOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "reputationOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions getSendingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "sendingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions getSuppressionOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "suppressionOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions getTrackingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "trackingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions getVdmOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "vdmOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSetName() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationSetName", java.util.Objects.requireNonNull(value, "configurationSetName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
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
     * A fluent builder for {@link imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet> {
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
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}.
         * <p>
         * @return {@code this}
         * @param configurationSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}. This parameter is required.
         */
        public Builder configurationSetName(final java.lang.String configurationSetName) {
            this.config.configurationSetName(configurationSetName);
            return this;
        }

        /**
         * delivery_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
         * <p>
         * @return {@code this}
         * @param deliveryOptions delivery_options block. This parameter is required.
         */
        public Builder deliveryOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions deliveryOptions) {
            this.config.deliveryOptions(deliveryOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * reputation_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
         * <p>
         * @return {@code this}
         * @param reputationOptions reputation_options block. This parameter is required.
         */
        public Builder reputationOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions reputationOptions) {
            this.config.reputationOptions(reputationOptions);
            return this;
        }

        /**
         * sending_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
         * <p>
         * @return {@code this}
         * @param sendingOptions sending_options block. This parameter is required.
         */
        public Builder sendingOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions sendingOptions) {
            this.config.sendingOptions(sendingOptions);
            return this;
        }

        /**
         * suppression_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
         * <p>
         * @return {@code this}
         * @param suppressionOptions suppression_options block. This parameter is required.
         */
        public Builder suppressionOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions suppressionOptions) {
            this.config.suppressionOptions(suppressionOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * tracking_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
         * <p>
         * @return {@code this}
         * @param trackingOptions tracking_options block. This parameter is required.
         */
        public Builder trackingOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions trackingOptions) {
            this.config.trackingOptions(trackingOptions);
            return this;
        }

        /**
         * vdm_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
         * <p>
         * @return {@code this}
         * @param vdmOptions vdm_options block. This parameter is required.
         */
        public Builder vdmOptions(final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions vdmOptions) {
            this.config.vdmOptions(vdmOptions);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet}.
         */
        @Override
        public imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet build() {
            return new imports.aws.sesv2_configuration_set.Sesv2ConfigurationSet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

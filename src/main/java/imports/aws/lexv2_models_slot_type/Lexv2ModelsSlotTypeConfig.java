package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.812Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeConfig")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeConfig.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocaleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * composite_slot_type_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCompositeSlotTypeSetting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * external_source_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExternalSourceSetting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParentSlotTypeSignature() {
        return null;
    }

    /**
     * slot_type_values block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSlotTypeValues() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts getTimeouts() {
        return null;
    }

    /**
     * value_selection_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValueSelectionSetting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeConfig> {
        java.lang.String botId;
        java.lang.String botVersion;
        java.lang.String localeId;
        java.lang.String name;
        java.lang.Object compositeSlotTypeSetting;
        java.lang.String description;
        java.lang.Object externalSourceSetting;
        java.lang.String parentSlotTypeSignature;
        java.lang.Object slotTypeValues;
        imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts timeouts;
        java.lang.Object valueSelectionSetting;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getBotId}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder botId(java.lang.String botId) {
            this.botId = botId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getBotVersion}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder botVersion(java.lang.String botVersion) {
            this.botVersion = botVersion;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getLocaleId}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder localeId(java.lang.String localeId) {
            this.localeId = localeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getCompositeSlotTypeSetting}
         * @param compositeSlotTypeSetting composite_slot_type_setting block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
         * @return {@code this}
         */
        public Builder compositeSlotTypeSetting(com.hashicorp.cdktf.IResolvable compositeSlotTypeSetting) {
            this.compositeSlotTypeSetting = compositeSlotTypeSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getCompositeSlotTypeSetting}
         * @param compositeSlotTypeSetting composite_slot_type_setting block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
         * @return {@code this}
         */
        public Builder compositeSlotTypeSetting(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting> compositeSlotTypeSetting) {
            this.compositeSlotTypeSetting = compositeSlotTypeSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getExternalSourceSetting}
         * @param externalSourceSetting external_source_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
         * @return {@code this}
         */
        public Builder externalSourceSetting(com.hashicorp.cdktf.IResolvable externalSourceSetting) {
            this.externalSourceSetting = externalSourceSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getExternalSourceSetting}
         * @param externalSourceSetting external_source_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
         * @return {@code this}
         */
        public Builder externalSourceSetting(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting> externalSourceSetting) {
            this.externalSourceSetting = externalSourceSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getParentSlotTypeSignature}
         * @param parentSlotTypeSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.
         * @return {@code this}
         */
        public Builder parentSlotTypeSignature(java.lang.String parentSlotTypeSignature) {
            this.parentSlotTypeSignature = parentSlotTypeSignature;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getSlotTypeValues}
         * @param slotTypeValues slot_type_values block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
         * @return {@code this}
         */
        public Builder slotTypeValues(com.hashicorp.cdktf.IResolvable slotTypeValues) {
            this.slotTypeValues = slotTypeValues;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getSlotTypeValues}
         * @param slotTypeValues slot_type_values block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
         * @return {@code this}
         */
        public Builder slotTypeValues(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues> slotTypeValues) {
            this.slotTypeValues = slotTypeValues;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getValueSelectionSetting}
         * @param valueSelectionSetting value_selection_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
         * @return {@code this}
         */
        public Builder valueSelectionSetting(com.hashicorp.cdktf.IResolvable valueSelectionSetting) {
            this.valueSelectionSetting = valueSelectionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getValueSelectionSetting}
         * @param valueSelectionSetting value_selection_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
         * @return {@code this}
         */
        public Builder valueSelectionSetting(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting> valueSelectionSetting) {
            this.valueSelectionSetting = valueSelectionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeConfig {
        private final java.lang.String botId;
        private final java.lang.String botVersion;
        private final java.lang.String localeId;
        private final java.lang.String name;
        private final java.lang.Object compositeSlotTypeSetting;
        private final java.lang.String description;
        private final java.lang.Object externalSourceSetting;
        private final java.lang.String parentSlotTypeSignature;
        private final java.lang.Object slotTypeValues;
        private final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts timeouts;
        private final java.lang.Object valueSelectionSetting;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.botId = software.amazon.jsii.Kernel.get(this, "botId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.botVersion = software.amazon.jsii.Kernel.get(this, "botVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localeId = software.amazon.jsii.Kernel.get(this, "localeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.compositeSlotTypeSetting = software.amazon.jsii.Kernel.get(this, "compositeSlotTypeSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.externalSourceSetting = software.amazon.jsii.Kernel.get(this, "externalSourceSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parentSlotTypeSignature = software.amazon.jsii.Kernel.get(this, "parentSlotTypeSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotTypeValues = software.amazon.jsii.Kernel.get(this, "slotTypeValues", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts.class));
            this.valueSelectionSetting = software.amazon.jsii.Kernel.get(this, "valueSelectionSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.botId = java.util.Objects.requireNonNull(builder.botId, "botId is required");
            this.botVersion = java.util.Objects.requireNonNull(builder.botVersion, "botVersion is required");
            this.localeId = java.util.Objects.requireNonNull(builder.localeId, "localeId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.compositeSlotTypeSetting = builder.compositeSlotTypeSetting;
            this.description = builder.description;
            this.externalSourceSetting = builder.externalSourceSetting;
            this.parentSlotTypeSignature = builder.parentSlotTypeSignature;
            this.slotTypeValues = builder.slotTypeValues;
            this.timeouts = builder.timeouts;
            this.valueSelectionSetting = builder.valueSelectionSetting;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBotId() {
            return this.botId;
        }

        @Override
        public final java.lang.String getBotVersion() {
            return this.botVersion;
        }

        @Override
        public final java.lang.String getLocaleId() {
            return this.localeId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getCompositeSlotTypeSetting() {
            return this.compositeSlotTypeSetting;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getExternalSourceSetting() {
            return this.externalSourceSetting;
        }

        @Override
        public final java.lang.String getParentSlotTypeSignature() {
            return this.parentSlotTypeSignature;
        }

        @Override
        public final java.lang.Object getSlotTypeValues() {
            return this.slotTypeValues;
        }

        @Override
        public final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getValueSelectionSetting() {
            return this.valueSelectionSetting;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("botId", om.valueToTree(this.getBotId()));
            data.set("botVersion", om.valueToTree(this.getBotVersion()));
            data.set("localeId", om.valueToTree(this.getLocaleId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCompositeSlotTypeSetting() != null) {
                data.set("compositeSlotTypeSetting", om.valueToTree(this.getCompositeSlotTypeSetting()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExternalSourceSetting() != null) {
                data.set("externalSourceSetting", om.valueToTree(this.getExternalSourceSetting()));
            }
            if (this.getParentSlotTypeSignature() != null) {
                data.set("parentSlotTypeSignature", om.valueToTree(this.getParentSlotTypeSignature()));
            }
            if (this.getSlotTypeValues() != null) {
                data.set("slotTypeValues", om.valueToTree(this.getSlotTypeValues()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getValueSelectionSetting() != null) {
                data.set("valueSelectionSetting", om.valueToTree(this.getValueSelectionSetting()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeConfig.Jsii$Proxy that = (Lexv2ModelsSlotTypeConfig.Jsii$Proxy) o;

            if (!botId.equals(that.botId)) return false;
            if (!botVersion.equals(that.botVersion)) return false;
            if (!localeId.equals(that.localeId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.compositeSlotTypeSetting != null ? !this.compositeSlotTypeSetting.equals(that.compositeSlotTypeSetting) : that.compositeSlotTypeSetting != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.externalSourceSetting != null ? !this.externalSourceSetting.equals(that.externalSourceSetting) : that.externalSourceSetting != null) return false;
            if (this.parentSlotTypeSignature != null ? !this.parentSlotTypeSignature.equals(that.parentSlotTypeSignature) : that.parentSlotTypeSignature != null) return false;
            if (this.slotTypeValues != null ? !this.slotTypeValues.equals(that.slotTypeValues) : that.slotTypeValues != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.valueSelectionSetting != null ? !this.valueSelectionSetting.equals(that.valueSelectionSetting) : that.valueSelectionSetting != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.botId.hashCode();
            result = 31 * result + (this.botVersion.hashCode());
            result = 31 * result + (this.localeId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.compositeSlotTypeSetting != null ? this.compositeSlotTypeSetting.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.externalSourceSetting != null ? this.externalSourceSetting.hashCode() : 0);
            result = 31 * result + (this.parentSlotTypeSignature != null ? this.parentSlotTypeSignature.hashCode() : 0);
            result = 31 * result + (this.slotTypeValues != null ? this.slotTypeValues.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.valueSelectionSetting != null ? this.valueSelectionSetting.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}

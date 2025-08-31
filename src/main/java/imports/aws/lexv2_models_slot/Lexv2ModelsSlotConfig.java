package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.778Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotConfig")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotConfig.Jsii$Proxy.class)
public interface Lexv2ModelsSlotConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#bot_id Lexv2ModelsSlot#bot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#bot_version Lexv2ModelsSlot#bot_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#intent_id Lexv2ModelsSlot#intent_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#locale_id Lexv2ModelsSlot#locale_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocaleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#name Lexv2ModelsSlot#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#description Lexv2ModelsSlot#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * multiple_values_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#multiple_values_setting Lexv2ModelsSlot#multiple_values_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultipleValuesSetting() {
        return null;
    }

    /**
     * obfuscation_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#obfuscation_setting Lexv2ModelsSlot#obfuscation_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getObfuscationSetting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_type_id Lexv2ModelsSlot#slot_type_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSlotTypeId() {
        return null;
    }

    /**
     * sub_slot_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sub_slot_setting Lexv2ModelsSlot#sub_slot_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubSlotSetting() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#timeouts Lexv2ModelsSlot#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts getTimeouts() {
        return null;
    }

    /**
     * value_elicitation_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValueElicitationSetting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotConfig> {
        java.lang.String botId;
        java.lang.String botVersion;
        java.lang.String intentId;
        java.lang.String localeId;
        java.lang.String name;
        java.lang.String description;
        java.lang.Object multipleValuesSetting;
        java.lang.Object obfuscationSetting;
        java.lang.String slotTypeId;
        java.lang.Object subSlotSetting;
        imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts timeouts;
        java.lang.Object valueElicitationSetting;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getBotId}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#bot_id Lexv2ModelsSlot#bot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder botId(java.lang.String botId) {
            this.botId = botId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getBotVersion}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#bot_version Lexv2ModelsSlot#bot_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder botVersion(java.lang.String botVersion) {
            this.botVersion = botVersion;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getIntentId}
         * @param intentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#intent_id Lexv2ModelsSlot#intent_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder intentId(java.lang.String intentId) {
            this.intentId = intentId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getLocaleId}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#locale_id Lexv2ModelsSlot#locale_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder localeId(java.lang.String localeId) {
            this.localeId = localeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#name Lexv2ModelsSlot#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#description Lexv2ModelsSlot#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getMultipleValuesSetting}
         * @param multipleValuesSetting multiple_values_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#multiple_values_setting Lexv2ModelsSlot#multiple_values_setting}
         * @return {@code this}
         */
        public Builder multipleValuesSetting(com.hashicorp.cdktf.IResolvable multipleValuesSetting) {
            this.multipleValuesSetting = multipleValuesSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getMultipleValuesSetting}
         * @param multipleValuesSetting multiple_values_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#multiple_values_setting Lexv2ModelsSlot#multiple_values_setting}
         * @return {@code this}
         */
        public Builder multipleValuesSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotMultipleValuesSetting> multipleValuesSetting) {
            this.multipleValuesSetting = multipleValuesSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getObfuscationSetting}
         * @param obfuscationSetting obfuscation_setting block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#obfuscation_setting Lexv2ModelsSlot#obfuscation_setting}
         * @return {@code this}
         */
        public Builder obfuscationSetting(com.hashicorp.cdktf.IResolvable obfuscationSetting) {
            this.obfuscationSetting = obfuscationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getObfuscationSetting}
         * @param obfuscationSetting obfuscation_setting block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#obfuscation_setting Lexv2ModelsSlot#obfuscation_setting}
         * @return {@code this}
         */
        public Builder obfuscationSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotObfuscationSetting> obfuscationSetting) {
            this.obfuscationSetting = obfuscationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getSlotTypeId}
         * @param slotTypeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_type_id Lexv2ModelsSlot#slot_type_id}.
         * @return {@code this}
         */
        public Builder slotTypeId(java.lang.String slotTypeId) {
            this.slotTypeId = slotTypeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getSubSlotSetting}
         * @param subSlotSetting sub_slot_setting block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sub_slot_setting Lexv2ModelsSlot#sub_slot_setting}
         * @return {@code this}
         */
        public Builder subSlotSetting(com.hashicorp.cdktf.IResolvable subSlotSetting) {
            this.subSlotSetting = subSlotSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getSubSlotSetting}
         * @param subSlotSetting sub_slot_setting block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sub_slot_setting Lexv2ModelsSlot#sub_slot_setting}
         * @return {@code this}
         */
        public Builder subSlotSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSetting> subSlotSetting) {
            this.subSlotSetting = subSlotSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#timeouts Lexv2ModelsSlot#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getValueElicitationSetting}
         * @param valueElicitationSetting value_elicitation_setting block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
         * @return {@code this}
         */
        public Builder valueElicitationSetting(com.hashicorp.cdktf.IResolvable valueElicitationSetting) {
            this.valueElicitationSetting = valueElicitationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getValueElicitationSetting}
         * @param valueElicitationSetting value_elicitation_setting block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
         * @return {@code this}
         */
        public Builder valueElicitationSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSetting> valueElicitationSetting) {
            this.valueElicitationSetting = valueElicitationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getDependsOn}
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
         * Sets the value of {@link Lexv2ModelsSlotConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotConfig#getProvisioners}
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
         * @return a new instance of {@link Lexv2ModelsSlotConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotConfig {
        private final java.lang.String botId;
        private final java.lang.String botVersion;
        private final java.lang.String intentId;
        private final java.lang.String localeId;
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Object multipleValuesSetting;
        private final java.lang.Object obfuscationSetting;
        private final java.lang.String slotTypeId;
        private final java.lang.Object subSlotSetting;
        private final imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts timeouts;
        private final java.lang.Object valueElicitationSetting;
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
            this.intentId = software.amazon.jsii.Kernel.get(this, "intentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localeId = software.amazon.jsii.Kernel.get(this, "localeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multipleValuesSetting = software.amazon.jsii.Kernel.get(this, "multipleValuesSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.obfuscationSetting = software.amazon.jsii.Kernel.get(this, "obfuscationSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.slotTypeId = software.amazon.jsii.Kernel.get(this, "slotTypeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subSlotSetting = software.amazon.jsii.Kernel.get(this, "subSlotSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts.class));
            this.valueElicitationSetting = software.amazon.jsii.Kernel.get(this, "valueElicitationSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.intentId = java.util.Objects.requireNonNull(builder.intentId, "intentId is required");
            this.localeId = java.util.Objects.requireNonNull(builder.localeId, "localeId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.multipleValuesSetting = builder.multipleValuesSetting;
            this.obfuscationSetting = builder.obfuscationSetting;
            this.slotTypeId = builder.slotTypeId;
            this.subSlotSetting = builder.subSlotSetting;
            this.timeouts = builder.timeouts;
            this.valueElicitationSetting = builder.valueElicitationSetting;
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
        public final java.lang.String getIntentId() {
            return this.intentId;
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
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getMultipleValuesSetting() {
            return this.multipleValuesSetting;
        }

        @Override
        public final java.lang.Object getObfuscationSetting() {
            return this.obfuscationSetting;
        }

        @Override
        public final java.lang.String getSlotTypeId() {
            return this.slotTypeId;
        }

        @Override
        public final java.lang.Object getSubSlotSetting() {
            return this.subSlotSetting;
        }

        @Override
        public final imports.aws.lexv2_models_slot.Lexv2ModelsSlotTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getValueElicitationSetting() {
            return this.valueElicitationSetting;
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
            data.set("intentId", om.valueToTree(this.getIntentId()));
            data.set("localeId", om.valueToTree(this.getLocaleId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getMultipleValuesSetting() != null) {
                data.set("multipleValuesSetting", om.valueToTree(this.getMultipleValuesSetting()));
            }
            if (this.getObfuscationSetting() != null) {
                data.set("obfuscationSetting", om.valueToTree(this.getObfuscationSetting()));
            }
            if (this.getSlotTypeId() != null) {
                data.set("slotTypeId", om.valueToTree(this.getSlotTypeId()));
            }
            if (this.getSubSlotSetting() != null) {
                data.set("subSlotSetting", om.valueToTree(this.getSubSlotSetting()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getValueElicitationSetting() != null) {
                data.set("valueElicitationSetting", om.valueToTree(this.getValueElicitationSetting()));
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
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotConfig.Jsii$Proxy that = (Lexv2ModelsSlotConfig.Jsii$Proxy) o;

            if (!botId.equals(that.botId)) return false;
            if (!botVersion.equals(that.botVersion)) return false;
            if (!intentId.equals(that.intentId)) return false;
            if (!localeId.equals(that.localeId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.multipleValuesSetting != null ? !this.multipleValuesSetting.equals(that.multipleValuesSetting) : that.multipleValuesSetting != null) return false;
            if (this.obfuscationSetting != null ? !this.obfuscationSetting.equals(that.obfuscationSetting) : that.obfuscationSetting != null) return false;
            if (this.slotTypeId != null ? !this.slotTypeId.equals(that.slotTypeId) : that.slotTypeId != null) return false;
            if (this.subSlotSetting != null ? !this.subSlotSetting.equals(that.subSlotSetting) : that.subSlotSetting != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.valueElicitationSetting != null ? !this.valueElicitationSetting.equals(that.valueElicitationSetting) : that.valueElicitationSetting != null) return false;
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
            result = 31 * result + (this.intentId.hashCode());
            result = 31 * result + (this.localeId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.multipleValuesSetting != null ? this.multipleValuesSetting.hashCode() : 0);
            result = 31 * result + (this.obfuscationSetting != null ? this.obfuscationSetting.hashCode() : 0);
            result = 31 * result + (this.slotTypeId != null ? this.slotTypeId.hashCode() : 0);
            result = 31 * result + (this.subSlotSetting != null ? this.subSlotSetting.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.valueElicitationSetting != null ? this.valueElicitationSetting.hashCode() : 0);
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

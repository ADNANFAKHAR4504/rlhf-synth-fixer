package imports.aws.lexv2_models_bot_locale;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale aws_lexv2models_bot_locale}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.548Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBotLocale.Lexv2ModelsBotLocale")
public class Lexv2ModelsBotLocale extends com.hashicorp.cdktf.TerraformResource {

    protected Lexv2ModelsBotLocale(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsBotLocale(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale aws_lexv2models_bot_locale} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Lexv2ModelsBotLocale(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsBotLocale resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsBotLocale to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsBotLocale that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Lexv2ModelsBotLocale to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsBotLocale resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsBotLocale to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsBotLocale that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVoiceSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVoiceSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVoiceSettings() {
        software.amazon.jsii.Kernel.call(this, "resetVoiceSettings", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettingsList getVoiceSettings() {
        return software.amazon.jsii.Kernel.get(this, "voiceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettingsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "botIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "botVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocaleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "localeIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNLuIntentConfidenceThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "nLuIntentConfidenceThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVoiceSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "voiceSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBotId() {
        return software.amazon.jsii.Kernel.get(this, "botId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBotId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "botId", java.util.Objects.requireNonNull(value, "botId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBotVersion() {
        return software.amazon.jsii.Kernel.get(this, "botVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBotVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "botVersion", java.util.Objects.requireNonNull(value, "botVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocaleId() {
        return software.amazon.jsii.Kernel.get(this, "localeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocaleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localeId", java.util.Objects.requireNonNull(value, "localeId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNLuIntentConfidenceThreshold() {
        return software.amazon.jsii.Kernel.get(this, "nLuIntentConfidenceThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNLuIntentConfidenceThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "nLuIntentConfidenceThreshold", java.util.Objects.requireNonNull(value, "nLuIntentConfidenceThreshold is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale> {
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
        private final imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_id Lexv2ModelsBotLocale#bot_id}.
         * <p>
         * @return {@code this}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_id Lexv2ModelsBotLocale#bot_id}. This parameter is required.
         */
        public Builder botId(final java.lang.String botId) {
            this.config.botId(botId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_version Lexv2ModelsBotLocale#bot_version}.
         * <p>
         * @return {@code this}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_version Lexv2ModelsBotLocale#bot_version}. This parameter is required.
         */
        public Builder botVersion(final java.lang.String botVersion) {
            this.config.botVersion(botVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#locale_id Lexv2ModelsBotLocale#locale_id}.
         * <p>
         * @return {@code this}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#locale_id Lexv2ModelsBotLocale#locale_id}. This parameter is required.
         */
        public Builder localeId(final java.lang.String localeId) {
            this.config.localeId(localeId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#n_lu_intent_confidence_threshold Lexv2ModelsBotLocale#n_lu_intent_confidence_threshold}.
         * <p>
         * @return {@code this}
         * @param nLuIntentConfidenceThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#n_lu_intent_confidence_threshold Lexv2ModelsBotLocale#n_lu_intent_confidence_threshold}. This parameter is required.
         */
        public Builder nLuIntentConfidenceThreshold(final java.lang.Number nLuIntentConfidenceThreshold) {
            this.config.nLuIntentConfidenceThreshold(nLuIntentConfidenceThreshold);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#description Lexv2ModelsBotLocale#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#description Lexv2ModelsBotLocale#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#name Lexv2ModelsBotLocale#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#name Lexv2ModelsBotLocale#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#timeouts Lexv2ModelsBotLocale#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * voice_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_settings Lexv2ModelsBotLocale#voice_settings}
         * <p>
         * @return {@code this}
         * @param voiceSettings voice_settings block. This parameter is required.
         */
        public Builder voiceSettings(final com.hashicorp.cdktf.IResolvable voiceSettings) {
            this.config.voiceSettings(voiceSettings);
            return this;
        }
        /**
         * voice_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_settings Lexv2ModelsBotLocale#voice_settings}
         * <p>
         * @return {@code this}
         * @param voiceSettings voice_settings block. This parameter is required.
         */
        public Builder voiceSettings(final java.util.List<? extends imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings> voiceSettings) {
            this.config.voiceSettings(voiceSettings);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale}.
         */
        @Override
        public imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale build() {
            return new imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocale(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

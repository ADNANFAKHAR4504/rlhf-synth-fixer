package imports.aws.lexv2_models_bot_locale;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.549Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBotLocale.Lexv2ModelsBotLocaleConfig")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsBotLocaleConfig.Jsii$Proxy.class)
public interface Lexv2ModelsBotLocaleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_id Lexv2ModelsBotLocale#bot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_version Lexv2ModelsBotLocale#bot_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#locale_id Lexv2ModelsBotLocale#locale_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocaleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#n_lu_intent_confidence_threshold Lexv2ModelsBotLocale#n_lu_intent_confidence_threshold}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNLuIntentConfidenceThreshold();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#description Lexv2ModelsBotLocale#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#name Lexv2ModelsBotLocale#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#timeouts Lexv2ModelsBotLocale#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts getTimeouts() {
        return null;
    }

    /**
     * voice_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_settings Lexv2ModelsBotLocale#voice_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVoiceSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsBotLocaleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsBotLocaleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsBotLocaleConfig> {
        java.lang.String botId;
        java.lang.String botVersion;
        java.lang.String localeId;
        java.lang.Number nLuIntentConfidenceThreshold;
        java.lang.String description;
        java.lang.String name;
        imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts timeouts;
        java.lang.Object voiceSettings;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getBotId}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_id Lexv2ModelsBotLocale#bot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder botId(java.lang.String botId) {
            this.botId = botId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getBotVersion}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#bot_version Lexv2ModelsBotLocale#bot_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder botVersion(java.lang.String botVersion) {
            this.botVersion = botVersion;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getLocaleId}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#locale_id Lexv2ModelsBotLocale#locale_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder localeId(java.lang.String localeId) {
            this.localeId = localeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getNLuIntentConfidenceThreshold}
         * @param nLuIntentConfidenceThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#n_lu_intent_confidence_threshold Lexv2ModelsBotLocale#n_lu_intent_confidence_threshold}. This parameter is required.
         * @return {@code this}
         */
        public Builder nLuIntentConfidenceThreshold(java.lang.Number nLuIntentConfidenceThreshold) {
            this.nLuIntentConfidenceThreshold = nLuIntentConfidenceThreshold;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#description Lexv2ModelsBotLocale#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#name Lexv2ModelsBotLocale#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#timeouts Lexv2ModelsBotLocale#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getVoiceSettings}
         * @param voiceSettings voice_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_settings Lexv2ModelsBotLocale#voice_settings}
         * @return {@code this}
         */
        public Builder voiceSettings(com.hashicorp.cdktf.IResolvable voiceSettings) {
            this.voiceSettings = voiceSettings;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getVoiceSettings}
         * @param voiceSettings voice_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_settings Lexv2ModelsBotLocale#voice_settings}
         * @return {@code this}
         */
        public Builder voiceSettings(java.util.List<? extends imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleVoiceSettings> voiceSettings) {
            this.voiceSettings = voiceSettings;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getDependsOn}
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
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleConfig#getProvisioners}
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
         * @return a new instance of {@link Lexv2ModelsBotLocaleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsBotLocaleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsBotLocaleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsBotLocaleConfig {
        private final java.lang.String botId;
        private final java.lang.String botVersion;
        private final java.lang.String localeId;
        private final java.lang.Number nLuIntentConfidenceThreshold;
        private final java.lang.String description;
        private final java.lang.String name;
        private final imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts timeouts;
        private final java.lang.Object voiceSettings;
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
            this.nLuIntentConfidenceThreshold = software.amazon.jsii.Kernel.get(this, "nLuIntentConfidenceThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts.class));
            this.voiceSettings = software.amazon.jsii.Kernel.get(this, "voiceSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.nLuIntentConfidenceThreshold = java.util.Objects.requireNonNull(builder.nLuIntentConfidenceThreshold, "nLuIntentConfidenceThreshold is required");
            this.description = builder.description;
            this.name = builder.name;
            this.timeouts = builder.timeouts;
            this.voiceSettings = builder.voiceSettings;
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
        public final java.lang.Number getNLuIntentConfidenceThreshold() {
            return this.nLuIntentConfidenceThreshold;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.lexv2_models_bot_locale.Lexv2ModelsBotLocaleTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getVoiceSettings() {
            return this.voiceSettings;
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
            data.set("nLuIntentConfidenceThreshold", om.valueToTree(this.getNLuIntentConfidenceThreshold()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVoiceSettings() != null) {
                data.set("voiceSettings", om.valueToTree(this.getVoiceSettings()));
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
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsBotLocale.Lexv2ModelsBotLocaleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsBotLocaleConfig.Jsii$Proxy that = (Lexv2ModelsBotLocaleConfig.Jsii$Proxy) o;

            if (!botId.equals(that.botId)) return false;
            if (!botVersion.equals(that.botVersion)) return false;
            if (!localeId.equals(that.localeId)) return false;
            if (!nLuIntentConfidenceThreshold.equals(that.nLuIntentConfidenceThreshold)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.voiceSettings != null ? !this.voiceSettings.equals(that.voiceSettings) : that.voiceSettings != null) return false;
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
            result = 31 * result + (this.nLuIntentConfidenceThreshold.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.voiceSettings != null ? this.voiceSettings.hashCode() : 0);
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

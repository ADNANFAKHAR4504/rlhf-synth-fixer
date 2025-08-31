package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.568Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfig")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfig.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_id Lexv2ModelsIntent#bot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_version Lexv2ModelsIntent#bot_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBotVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#locale_id Lexv2ModelsIntent#locale_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocaleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * closing_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_setting Lexv2ModelsIntent#closing_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getClosingSetting() {
        return null;
    }

    /**
     * confirmation_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_setting Lexv2ModelsIntent#confirmation_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfirmationSetting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#description Lexv2ModelsIntent#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * dialog_code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_code_hook Lexv2ModelsIntent#dialog_code_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDialogCodeHook() {
        return null;
    }

    /**
     * fulfillment_code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_code_hook Lexv2ModelsIntent#fulfillment_code_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFulfillmentCodeHook() {
        return null;
    }

    /**
     * initial_response_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response_setting Lexv2ModelsIntent#initial_response_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInitialResponseSetting() {
        return null;
    }

    /**
     * input_context block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#input_context Lexv2ModelsIntent#input_context}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputContext() {
        return null;
    }

    /**
     * kendra_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_configuration Lexv2ModelsIntent#kendra_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKendraConfiguration() {
        return null;
    }

    /**
     * output_context block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#output_context Lexv2ModelsIntent#output_context}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOutputContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#parent_intent_signature Lexv2ModelsIntent#parent_intent_signature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParentIntentSignature() {
        return null;
    }

    /**
     * sample_utterance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#sample_utterance Lexv2ModelsIntent#sample_utterance}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSampleUtterance() {
        return null;
    }

    /**
     * slot_priority block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_priority Lexv2ModelsIntent#slot_priority}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSlotPriority() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeouts Lexv2ModelsIntent#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfig> {
        java.lang.String botId;
        java.lang.String botVersion;
        java.lang.String localeId;
        java.lang.String name;
        java.lang.Object closingSetting;
        java.lang.Object confirmationSetting;
        java.lang.String description;
        java.lang.Object dialogCodeHook;
        java.lang.Object fulfillmentCodeHook;
        java.lang.Object initialResponseSetting;
        java.lang.Object inputContext;
        java.lang.Object kendraConfiguration;
        java.lang.Object outputContext;
        java.lang.String parentIntentSignature;
        java.lang.Object sampleUtterance;
        java.lang.Object slotPriority;
        imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getBotId}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_id Lexv2ModelsIntent#bot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder botId(java.lang.String botId) {
            this.botId = botId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getBotVersion}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_version Lexv2ModelsIntent#bot_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder botVersion(java.lang.String botVersion) {
            this.botVersion = botVersion;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getLocaleId}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#locale_id Lexv2ModelsIntent#locale_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder localeId(java.lang.String localeId) {
            this.localeId = localeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getClosingSetting}
         * @param closingSetting closing_setting block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_setting Lexv2ModelsIntent#closing_setting}
         * @return {@code this}
         */
        public Builder closingSetting(com.hashicorp.cdktf.IResolvable closingSetting) {
            this.closingSetting = closingSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getClosingSetting}
         * @param closingSetting closing_setting block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_setting Lexv2ModelsIntent#closing_setting}
         * @return {@code this}
         */
        public Builder closingSetting(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting> closingSetting) {
            this.closingSetting = closingSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getConfirmationSetting}
         * @param confirmationSetting confirmation_setting block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_setting Lexv2ModelsIntent#confirmation_setting}
         * @return {@code this}
         */
        public Builder confirmationSetting(com.hashicorp.cdktf.IResolvable confirmationSetting) {
            this.confirmationSetting = confirmationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getConfirmationSetting}
         * @param confirmationSetting confirmation_setting block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_setting Lexv2ModelsIntent#confirmation_setting}
         * @return {@code this}
         */
        public Builder confirmationSetting(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting> confirmationSetting) {
            this.confirmationSetting = confirmationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#description Lexv2ModelsIntent#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getDialogCodeHook}
         * @param dialogCodeHook dialog_code_hook block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_code_hook Lexv2ModelsIntent#dialog_code_hook}
         * @return {@code this}
         */
        public Builder dialogCodeHook(com.hashicorp.cdktf.IResolvable dialogCodeHook) {
            this.dialogCodeHook = dialogCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getDialogCodeHook}
         * @param dialogCodeHook dialog_code_hook block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_code_hook Lexv2ModelsIntent#dialog_code_hook}
         * @return {@code this}
         */
        public Builder dialogCodeHook(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook> dialogCodeHook) {
            this.dialogCodeHook = dialogCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getFulfillmentCodeHook}
         * @param fulfillmentCodeHook fulfillment_code_hook block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_code_hook Lexv2ModelsIntent#fulfillment_code_hook}
         * @return {@code this}
         */
        public Builder fulfillmentCodeHook(com.hashicorp.cdktf.IResolvable fulfillmentCodeHook) {
            this.fulfillmentCodeHook = fulfillmentCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getFulfillmentCodeHook}
         * @param fulfillmentCodeHook fulfillment_code_hook block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_code_hook Lexv2ModelsIntent#fulfillment_code_hook}
         * @return {@code this}
         */
        public Builder fulfillmentCodeHook(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook> fulfillmentCodeHook) {
            this.fulfillmentCodeHook = fulfillmentCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getInitialResponseSetting}
         * @param initialResponseSetting initial_response_setting block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response_setting Lexv2ModelsIntent#initial_response_setting}
         * @return {@code this}
         */
        public Builder initialResponseSetting(com.hashicorp.cdktf.IResolvable initialResponseSetting) {
            this.initialResponseSetting = initialResponseSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getInitialResponseSetting}
         * @param initialResponseSetting initial_response_setting block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response_setting Lexv2ModelsIntent#initial_response_setting}
         * @return {@code this}
         */
        public Builder initialResponseSetting(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting> initialResponseSetting) {
            this.initialResponseSetting = initialResponseSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getInputContext}
         * @param inputContext input_context block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#input_context Lexv2ModelsIntent#input_context}
         * @return {@code this}
         */
        public Builder inputContext(com.hashicorp.cdktf.IResolvable inputContext) {
            this.inputContext = inputContext;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getInputContext}
         * @param inputContext input_context block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#input_context Lexv2ModelsIntent#input_context}
         * @return {@code this}
         */
        public Builder inputContext(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext> inputContext) {
            this.inputContext = inputContext;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getKendraConfiguration}
         * @param kendraConfiguration kendra_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_configuration Lexv2ModelsIntent#kendra_configuration}
         * @return {@code this}
         */
        public Builder kendraConfiguration(com.hashicorp.cdktf.IResolvable kendraConfiguration) {
            this.kendraConfiguration = kendraConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getKendraConfiguration}
         * @param kendraConfiguration kendra_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_configuration Lexv2ModelsIntent#kendra_configuration}
         * @return {@code this}
         */
        public Builder kendraConfiguration(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration> kendraConfiguration) {
            this.kendraConfiguration = kendraConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getOutputContext}
         * @param outputContext output_context block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#output_context Lexv2ModelsIntent#output_context}
         * @return {@code this}
         */
        public Builder outputContext(com.hashicorp.cdktf.IResolvable outputContext) {
            this.outputContext = outputContext;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getOutputContext}
         * @param outputContext output_context block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#output_context Lexv2ModelsIntent#output_context}
         * @return {@code this}
         */
        public Builder outputContext(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext> outputContext) {
            this.outputContext = outputContext;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getParentIntentSignature}
         * @param parentIntentSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#parent_intent_signature Lexv2ModelsIntent#parent_intent_signature}.
         * @return {@code this}
         */
        public Builder parentIntentSignature(java.lang.String parentIntentSignature) {
            this.parentIntentSignature = parentIntentSignature;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getSampleUtterance}
         * @param sampleUtterance sample_utterance block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#sample_utterance Lexv2ModelsIntent#sample_utterance}
         * @return {@code this}
         */
        public Builder sampleUtterance(com.hashicorp.cdktf.IResolvable sampleUtterance) {
            this.sampleUtterance = sampleUtterance;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getSampleUtterance}
         * @param sampleUtterance sample_utterance block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#sample_utterance Lexv2ModelsIntent#sample_utterance}
         * @return {@code this}
         */
        public Builder sampleUtterance(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance> sampleUtterance) {
            this.sampleUtterance = sampleUtterance;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getSlotPriority}
         * @param slotPriority slot_priority block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_priority Lexv2ModelsIntent#slot_priority}
         * @return {@code this}
         */
        public Builder slotPriority(com.hashicorp.cdktf.IResolvable slotPriority) {
            this.slotPriority = slotPriority;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getSlotPriority}
         * @param slotPriority slot_priority block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_priority Lexv2ModelsIntent#slot_priority}
         * @return {@code this}
         */
        public Builder slotPriority(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority> slotPriority) {
            this.slotPriority = slotPriority;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeouts Lexv2ModelsIntent#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getDependsOn}
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
         * Sets the value of {@link Lexv2ModelsIntentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfig#getProvisioners}
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
         * @return a new instance of {@link Lexv2ModelsIntentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfig {
        private final java.lang.String botId;
        private final java.lang.String botVersion;
        private final java.lang.String localeId;
        private final java.lang.String name;
        private final java.lang.Object closingSetting;
        private final java.lang.Object confirmationSetting;
        private final java.lang.String description;
        private final java.lang.Object dialogCodeHook;
        private final java.lang.Object fulfillmentCodeHook;
        private final java.lang.Object initialResponseSetting;
        private final java.lang.Object inputContext;
        private final java.lang.Object kendraConfiguration;
        private final java.lang.Object outputContext;
        private final java.lang.String parentIntentSignature;
        private final java.lang.Object sampleUtterance;
        private final java.lang.Object slotPriority;
        private final imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts timeouts;
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
            this.closingSetting = software.amazon.jsii.Kernel.get(this, "closingSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.confirmationSetting = software.amazon.jsii.Kernel.get(this, "confirmationSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dialogCodeHook = software.amazon.jsii.Kernel.get(this, "dialogCodeHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fulfillmentCodeHook = software.amazon.jsii.Kernel.get(this, "fulfillmentCodeHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.initialResponseSetting = software.amazon.jsii.Kernel.get(this, "initialResponseSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inputContext = software.amazon.jsii.Kernel.get(this, "inputContext", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kendraConfiguration = software.amazon.jsii.Kernel.get(this, "kendraConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.outputContext = software.amazon.jsii.Kernel.get(this, "outputContext", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parentIntentSignature = software.amazon.jsii.Kernel.get(this, "parentIntentSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sampleUtterance = software.amazon.jsii.Kernel.get(this, "sampleUtterance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.slotPriority = software.amazon.jsii.Kernel.get(this, "slotPriority", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts.class));
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
            this.closingSetting = builder.closingSetting;
            this.confirmationSetting = builder.confirmationSetting;
            this.description = builder.description;
            this.dialogCodeHook = builder.dialogCodeHook;
            this.fulfillmentCodeHook = builder.fulfillmentCodeHook;
            this.initialResponseSetting = builder.initialResponseSetting;
            this.inputContext = builder.inputContext;
            this.kendraConfiguration = builder.kendraConfiguration;
            this.outputContext = builder.outputContext;
            this.parentIntentSignature = builder.parentIntentSignature;
            this.sampleUtterance = builder.sampleUtterance;
            this.slotPriority = builder.slotPriority;
            this.timeouts = builder.timeouts;
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
        public final java.lang.Object getClosingSetting() {
            return this.closingSetting;
        }

        @Override
        public final java.lang.Object getConfirmationSetting() {
            return this.confirmationSetting;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDialogCodeHook() {
            return this.dialogCodeHook;
        }

        @Override
        public final java.lang.Object getFulfillmentCodeHook() {
            return this.fulfillmentCodeHook;
        }

        @Override
        public final java.lang.Object getInitialResponseSetting() {
            return this.initialResponseSetting;
        }

        @Override
        public final java.lang.Object getInputContext() {
            return this.inputContext;
        }

        @Override
        public final java.lang.Object getKendraConfiguration() {
            return this.kendraConfiguration;
        }

        @Override
        public final java.lang.Object getOutputContext() {
            return this.outputContext;
        }

        @Override
        public final java.lang.String getParentIntentSignature() {
            return this.parentIntentSignature;
        }

        @Override
        public final java.lang.Object getSampleUtterance() {
            return this.sampleUtterance;
        }

        @Override
        public final java.lang.Object getSlotPriority() {
            return this.slotPriority;
        }

        @Override
        public final imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts getTimeouts() {
            return this.timeouts;
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
            if (this.getClosingSetting() != null) {
                data.set("closingSetting", om.valueToTree(this.getClosingSetting()));
            }
            if (this.getConfirmationSetting() != null) {
                data.set("confirmationSetting", om.valueToTree(this.getConfirmationSetting()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDialogCodeHook() != null) {
                data.set("dialogCodeHook", om.valueToTree(this.getDialogCodeHook()));
            }
            if (this.getFulfillmentCodeHook() != null) {
                data.set("fulfillmentCodeHook", om.valueToTree(this.getFulfillmentCodeHook()));
            }
            if (this.getInitialResponseSetting() != null) {
                data.set("initialResponseSetting", om.valueToTree(this.getInitialResponseSetting()));
            }
            if (this.getInputContext() != null) {
                data.set("inputContext", om.valueToTree(this.getInputContext()));
            }
            if (this.getKendraConfiguration() != null) {
                data.set("kendraConfiguration", om.valueToTree(this.getKendraConfiguration()));
            }
            if (this.getOutputContext() != null) {
                data.set("outputContext", om.valueToTree(this.getOutputContext()));
            }
            if (this.getParentIntentSignature() != null) {
                data.set("parentIntentSignature", om.valueToTree(this.getParentIntentSignature()));
            }
            if (this.getSampleUtterance() != null) {
                data.set("sampleUtterance", om.valueToTree(this.getSampleUtterance()));
            }
            if (this.getSlotPriority() != null) {
                data.set("slotPriority", om.valueToTree(this.getSlotPriority()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfig.Jsii$Proxy that = (Lexv2ModelsIntentConfig.Jsii$Proxy) o;

            if (!botId.equals(that.botId)) return false;
            if (!botVersion.equals(that.botVersion)) return false;
            if (!localeId.equals(that.localeId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.closingSetting != null ? !this.closingSetting.equals(that.closingSetting) : that.closingSetting != null) return false;
            if (this.confirmationSetting != null ? !this.confirmationSetting.equals(that.confirmationSetting) : that.confirmationSetting != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dialogCodeHook != null ? !this.dialogCodeHook.equals(that.dialogCodeHook) : that.dialogCodeHook != null) return false;
            if (this.fulfillmentCodeHook != null ? !this.fulfillmentCodeHook.equals(that.fulfillmentCodeHook) : that.fulfillmentCodeHook != null) return false;
            if (this.initialResponseSetting != null ? !this.initialResponseSetting.equals(that.initialResponseSetting) : that.initialResponseSetting != null) return false;
            if (this.inputContext != null ? !this.inputContext.equals(that.inputContext) : that.inputContext != null) return false;
            if (this.kendraConfiguration != null ? !this.kendraConfiguration.equals(that.kendraConfiguration) : that.kendraConfiguration != null) return false;
            if (this.outputContext != null ? !this.outputContext.equals(that.outputContext) : that.outputContext != null) return false;
            if (this.parentIntentSignature != null ? !this.parentIntentSignature.equals(that.parentIntentSignature) : that.parentIntentSignature != null) return false;
            if (this.sampleUtterance != null ? !this.sampleUtterance.equals(that.sampleUtterance) : that.sampleUtterance != null) return false;
            if (this.slotPriority != null ? !this.slotPriority.equals(that.slotPriority) : that.slotPriority != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            result = 31 * result + (this.closingSetting != null ? this.closingSetting.hashCode() : 0);
            result = 31 * result + (this.confirmationSetting != null ? this.confirmationSetting.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dialogCodeHook != null ? this.dialogCodeHook.hashCode() : 0);
            result = 31 * result + (this.fulfillmentCodeHook != null ? this.fulfillmentCodeHook.hashCode() : 0);
            result = 31 * result + (this.initialResponseSetting != null ? this.initialResponseSetting.hashCode() : 0);
            result = 31 * result + (this.inputContext != null ? this.inputContext.hashCode() : 0);
            result = 31 * result + (this.kendraConfiguration != null ? this.kendraConfiguration.hashCode() : 0);
            result = 31 * result + (this.outputContext != null ? this.outputContext.hashCode() : 0);
            result = 31 * result + (this.parentIntentSignature != null ? this.parentIntentSignature.hashCode() : 0);
            result = 31 * result + (this.sampleUtterance != null ? this.sampleUtterance.hashCode() : 0);
            result = 31 * result + (this.slotPriority != null ? this.slotPriority.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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

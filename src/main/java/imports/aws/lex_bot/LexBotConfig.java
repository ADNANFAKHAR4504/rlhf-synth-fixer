package imports.aws.lex_bot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.540Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexBot.LexBotConfig")
@software.amazon.jsii.Jsii.Proxy(LexBotConfig.Jsii$Proxy.class)
public interface LexBotConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * abort_statement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#abort_statement LexBot#abort_statement}
     */
    @org.jetbrains.annotations.NotNull imports.aws.lex_bot.LexBotAbortStatement getAbortStatement();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#child_directed LexBot#child_directed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getChildDirected();

    /**
     * intent block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent LexBot#intent}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getIntent();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#name LexBot#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * clarification_prompt block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#clarification_prompt LexBot#clarification_prompt}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_bot.LexBotClarificationPrompt getClarificationPrompt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#create_version LexBot#create_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#description LexBot#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#detect_sentiment LexBot#detect_sentiment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDetectSentiment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#enable_model_improvements LexBot#enable_model_improvements}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableModelImprovements() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#id LexBot#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#idle_session_ttl_in_seconds LexBot#idle_session_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleSessionTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#locale LexBot#locale}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocale() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#nlu_intent_confidence_threshold LexBot#nlu_intent_confidence_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNluIntentConfidenceThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#process_behavior LexBot#process_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProcessBehavior() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#timeouts LexBot#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_bot.LexBotTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#voice_id LexBot#voice_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVoiceId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexBotConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexBotConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexBotConfig> {
        imports.aws.lex_bot.LexBotAbortStatement abortStatement;
        java.lang.Object childDirected;
        java.lang.Object intent;
        java.lang.String name;
        imports.aws.lex_bot.LexBotClarificationPrompt clarificationPrompt;
        java.lang.Object createVersion;
        java.lang.String description;
        java.lang.Object detectSentiment;
        java.lang.Object enableModelImprovements;
        java.lang.String id;
        java.lang.Number idleSessionTtlInSeconds;
        java.lang.String locale;
        java.lang.Number nluIntentConfidenceThreshold;
        java.lang.String processBehavior;
        imports.aws.lex_bot.LexBotTimeouts timeouts;
        java.lang.String voiceId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LexBotConfig#getAbortStatement}
         * @param abortStatement abort_statement block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#abort_statement LexBot#abort_statement}
         * @return {@code this}
         */
        public Builder abortStatement(imports.aws.lex_bot.LexBotAbortStatement abortStatement) {
            this.abortStatement = abortStatement;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getChildDirected}
         * @param childDirected Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#child_directed LexBot#child_directed}. This parameter is required.
         * @return {@code this}
         */
        public Builder childDirected(java.lang.Boolean childDirected) {
            this.childDirected = childDirected;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getChildDirected}
         * @param childDirected Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#child_directed LexBot#child_directed}. This parameter is required.
         * @return {@code this}
         */
        public Builder childDirected(com.hashicorp.cdktf.IResolvable childDirected) {
            this.childDirected = childDirected;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getIntent}
         * @param intent intent block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent LexBot#intent}
         * @return {@code this}
         */
        public Builder intent(com.hashicorp.cdktf.IResolvable intent) {
            this.intent = intent;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getIntent}
         * @param intent intent block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent LexBot#intent}
         * @return {@code this}
         */
        public Builder intent(java.util.List<? extends imports.aws.lex_bot.LexBotIntent> intent) {
            this.intent = intent;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#name LexBot#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getClarificationPrompt}
         * @param clarificationPrompt clarification_prompt block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#clarification_prompt LexBot#clarification_prompt}
         * @return {@code this}
         */
        public Builder clarificationPrompt(imports.aws.lex_bot.LexBotClarificationPrompt clarificationPrompt) {
            this.clarificationPrompt = clarificationPrompt;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getCreateVersion}
         * @param createVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#create_version LexBot#create_version}.
         * @return {@code this}
         */
        public Builder createVersion(java.lang.Boolean createVersion) {
            this.createVersion = createVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getCreateVersion}
         * @param createVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#create_version LexBot#create_version}.
         * @return {@code this}
         */
        public Builder createVersion(com.hashicorp.cdktf.IResolvable createVersion) {
            this.createVersion = createVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#description LexBot#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getDetectSentiment}
         * @param detectSentiment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#detect_sentiment LexBot#detect_sentiment}.
         * @return {@code this}
         */
        public Builder detectSentiment(java.lang.Boolean detectSentiment) {
            this.detectSentiment = detectSentiment;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getDetectSentiment}
         * @param detectSentiment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#detect_sentiment LexBot#detect_sentiment}.
         * @return {@code this}
         */
        public Builder detectSentiment(com.hashicorp.cdktf.IResolvable detectSentiment) {
            this.detectSentiment = detectSentiment;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getEnableModelImprovements}
         * @param enableModelImprovements Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#enable_model_improvements LexBot#enable_model_improvements}.
         * @return {@code this}
         */
        public Builder enableModelImprovements(java.lang.Boolean enableModelImprovements) {
            this.enableModelImprovements = enableModelImprovements;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getEnableModelImprovements}
         * @param enableModelImprovements Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#enable_model_improvements LexBot#enable_model_improvements}.
         * @return {@code this}
         */
        public Builder enableModelImprovements(com.hashicorp.cdktf.IResolvable enableModelImprovements) {
            this.enableModelImprovements = enableModelImprovements;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#id LexBot#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getIdleSessionTtlInSeconds}
         * @param idleSessionTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#idle_session_ttl_in_seconds LexBot#idle_session_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder idleSessionTtlInSeconds(java.lang.Number idleSessionTtlInSeconds) {
            this.idleSessionTtlInSeconds = idleSessionTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getLocale}
         * @param locale Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#locale LexBot#locale}.
         * @return {@code this}
         */
        public Builder locale(java.lang.String locale) {
            this.locale = locale;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getNluIntentConfidenceThreshold}
         * @param nluIntentConfidenceThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#nlu_intent_confidence_threshold LexBot#nlu_intent_confidence_threshold}.
         * @return {@code this}
         */
        public Builder nluIntentConfidenceThreshold(java.lang.Number nluIntentConfidenceThreshold) {
            this.nluIntentConfidenceThreshold = nluIntentConfidenceThreshold;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getProcessBehavior}
         * @param processBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#process_behavior LexBot#process_behavior}.
         * @return {@code this}
         */
        public Builder processBehavior(java.lang.String processBehavior) {
            this.processBehavior = processBehavior;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#timeouts LexBot#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lex_bot.LexBotTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getVoiceId}
         * @param voiceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#voice_id LexBot#voice_id}.
         * @return {@code this}
         */
        public Builder voiceId(java.lang.String voiceId) {
            this.voiceId = voiceId;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getDependsOn}
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
         * Sets the value of {@link LexBotConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LexBotConfig#getProvisioners}
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
         * @return a new instance of {@link LexBotConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexBotConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexBotConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexBotConfig {
        private final imports.aws.lex_bot.LexBotAbortStatement abortStatement;
        private final java.lang.Object childDirected;
        private final java.lang.Object intent;
        private final java.lang.String name;
        private final imports.aws.lex_bot.LexBotClarificationPrompt clarificationPrompt;
        private final java.lang.Object createVersion;
        private final java.lang.String description;
        private final java.lang.Object detectSentiment;
        private final java.lang.Object enableModelImprovements;
        private final java.lang.String id;
        private final java.lang.Number idleSessionTtlInSeconds;
        private final java.lang.String locale;
        private final java.lang.Number nluIntentConfidenceThreshold;
        private final java.lang.String processBehavior;
        private final imports.aws.lex_bot.LexBotTimeouts timeouts;
        private final java.lang.String voiceId;
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
            this.abortStatement = software.amazon.jsii.Kernel.get(this, "abortStatement", software.amazon.jsii.NativeType.forClass(imports.aws.lex_bot.LexBotAbortStatement.class));
            this.childDirected = software.amazon.jsii.Kernel.get(this, "childDirected", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.intent = software.amazon.jsii.Kernel.get(this, "intent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clarificationPrompt = software.amazon.jsii.Kernel.get(this, "clarificationPrompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_bot.LexBotClarificationPrompt.class));
            this.createVersion = software.amazon.jsii.Kernel.get(this, "createVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.detectSentiment = software.amazon.jsii.Kernel.get(this, "detectSentiment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableModelImprovements = software.amazon.jsii.Kernel.get(this, "enableModelImprovements", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idleSessionTtlInSeconds = software.amazon.jsii.Kernel.get(this, "idleSessionTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.locale = software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nluIntentConfidenceThreshold = software.amazon.jsii.Kernel.get(this, "nluIntentConfidenceThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.processBehavior = software.amazon.jsii.Kernel.get(this, "processBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lex_bot.LexBotTimeouts.class));
            this.voiceId = software.amazon.jsii.Kernel.get(this, "voiceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.abortStatement = java.util.Objects.requireNonNull(builder.abortStatement, "abortStatement is required");
            this.childDirected = java.util.Objects.requireNonNull(builder.childDirected, "childDirected is required");
            this.intent = java.util.Objects.requireNonNull(builder.intent, "intent is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.clarificationPrompt = builder.clarificationPrompt;
            this.createVersion = builder.createVersion;
            this.description = builder.description;
            this.detectSentiment = builder.detectSentiment;
            this.enableModelImprovements = builder.enableModelImprovements;
            this.id = builder.id;
            this.idleSessionTtlInSeconds = builder.idleSessionTtlInSeconds;
            this.locale = builder.locale;
            this.nluIntentConfidenceThreshold = builder.nluIntentConfidenceThreshold;
            this.processBehavior = builder.processBehavior;
            this.timeouts = builder.timeouts;
            this.voiceId = builder.voiceId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.lex_bot.LexBotAbortStatement getAbortStatement() {
            return this.abortStatement;
        }

        @Override
        public final java.lang.Object getChildDirected() {
            return this.childDirected;
        }

        @Override
        public final java.lang.Object getIntent() {
            return this.intent;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.lex_bot.LexBotClarificationPrompt getClarificationPrompt() {
            return this.clarificationPrompt;
        }

        @Override
        public final java.lang.Object getCreateVersion() {
            return this.createVersion;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDetectSentiment() {
            return this.detectSentiment;
        }

        @Override
        public final java.lang.Object getEnableModelImprovements() {
            return this.enableModelImprovements;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getIdleSessionTtlInSeconds() {
            return this.idleSessionTtlInSeconds;
        }

        @Override
        public final java.lang.String getLocale() {
            return this.locale;
        }

        @Override
        public final java.lang.Number getNluIntentConfidenceThreshold() {
            return this.nluIntentConfidenceThreshold;
        }

        @Override
        public final java.lang.String getProcessBehavior() {
            return this.processBehavior;
        }

        @Override
        public final imports.aws.lex_bot.LexBotTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVoiceId() {
            return this.voiceId;
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

            data.set("abortStatement", om.valueToTree(this.getAbortStatement()));
            data.set("childDirected", om.valueToTree(this.getChildDirected()));
            data.set("intent", om.valueToTree(this.getIntent()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getClarificationPrompt() != null) {
                data.set("clarificationPrompt", om.valueToTree(this.getClarificationPrompt()));
            }
            if (this.getCreateVersion() != null) {
                data.set("createVersion", om.valueToTree(this.getCreateVersion()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDetectSentiment() != null) {
                data.set("detectSentiment", om.valueToTree(this.getDetectSentiment()));
            }
            if (this.getEnableModelImprovements() != null) {
                data.set("enableModelImprovements", om.valueToTree(this.getEnableModelImprovements()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdleSessionTtlInSeconds() != null) {
                data.set("idleSessionTtlInSeconds", om.valueToTree(this.getIdleSessionTtlInSeconds()));
            }
            if (this.getLocale() != null) {
                data.set("locale", om.valueToTree(this.getLocale()));
            }
            if (this.getNluIntentConfidenceThreshold() != null) {
                data.set("nluIntentConfidenceThreshold", om.valueToTree(this.getNluIntentConfidenceThreshold()));
            }
            if (this.getProcessBehavior() != null) {
                data.set("processBehavior", om.valueToTree(this.getProcessBehavior()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVoiceId() != null) {
                data.set("voiceId", om.valueToTree(this.getVoiceId()));
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
            struct.set("fqn", om.valueToTree("aws.lexBot.LexBotConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexBotConfig.Jsii$Proxy that = (LexBotConfig.Jsii$Proxy) o;

            if (!abortStatement.equals(that.abortStatement)) return false;
            if (!childDirected.equals(that.childDirected)) return false;
            if (!intent.equals(that.intent)) return false;
            if (!name.equals(that.name)) return false;
            if (this.clarificationPrompt != null ? !this.clarificationPrompt.equals(that.clarificationPrompt) : that.clarificationPrompt != null) return false;
            if (this.createVersion != null ? !this.createVersion.equals(that.createVersion) : that.createVersion != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.detectSentiment != null ? !this.detectSentiment.equals(that.detectSentiment) : that.detectSentiment != null) return false;
            if (this.enableModelImprovements != null ? !this.enableModelImprovements.equals(that.enableModelImprovements) : that.enableModelImprovements != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idleSessionTtlInSeconds != null ? !this.idleSessionTtlInSeconds.equals(that.idleSessionTtlInSeconds) : that.idleSessionTtlInSeconds != null) return false;
            if (this.locale != null ? !this.locale.equals(that.locale) : that.locale != null) return false;
            if (this.nluIntentConfidenceThreshold != null ? !this.nluIntentConfidenceThreshold.equals(that.nluIntentConfidenceThreshold) : that.nluIntentConfidenceThreshold != null) return false;
            if (this.processBehavior != null ? !this.processBehavior.equals(that.processBehavior) : that.processBehavior != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.voiceId != null ? !this.voiceId.equals(that.voiceId) : that.voiceId != null) return false;
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
            int result = this.abortStatement.hashCode();
            result = 31 * result + (this.childDirected.hashCode());
            result = 31 * result + (this.intent.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.clarificationPrompt != null ? this.clarificationPrompt.hashCode() : 0);
            result = 31 * result + (this.createVersion != null ? this.createVersion.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.detectSentiment != null ? this.detectSentiment.hashCode() : 0);
            result = 31 * result + (this.enableModelImprovements != null ? this.enableModelImprovements.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idleSessionTtlInSeconds != null ? this.idleSessionTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.locale != null ? this.locale.hashCode() : 0);
            result = 31 * result + (this.nluIntentConfidenceThreshold != null ? this.nluIntentConfidenceThreshold.hashCode() : 0);
            result = 31 * result + (this.processBehavior != null ? this.processBehavior.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.voiceId != null ? this.voiceId.hashCode() : 0);
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

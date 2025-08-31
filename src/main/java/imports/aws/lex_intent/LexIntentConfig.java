package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.542Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentConfig")
@software.amazon.jsii.Jsii.Proxy(LexIntentConfig.Jsii$Proxy.class)
public interface LexIntentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * fulfillment_activity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#fulfillment_activity LexIntent#fulfillment_activity}
     */
    @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFulfillmentActivity getFulfillmentActivity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#name LexIntent#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * conclusion_statement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#conclusion_statement LexIntent#conclusion_statement}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentConclusionStatement getConclusionStatement() {
        return null;
    }

    /**
     * confirmation_prompt block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#confirmation_prompt LexIntent#confirmation_prompt}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentConfirmationPrompt getConfirmationPrompt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#create_version LexIntent#create_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#description LexIntent#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * dialog_code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#dialog_code_hook LexIntent#dialog_code_hook}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentDialogCodeHook getDialogCodeHook() {
        return null;
    }

    /**
     * follow_up_prompt block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#follow_up_prompt LexIntent#follow_up_prompt}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPrompt getFollowUpPrompt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#id LexIntent#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#parent_intent_signature LexIntent#parent_intent_signature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParentIntentSignature() {
        return null;
    }

    /**
     * rejection_statement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#rejection_statement LexIntent#rejection_statement}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentRejectionStatement getRejectionStatement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#sample_utterances LexIntent#sample_utterances}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSampleUtterances() {
        return null;
    }

    /**
     * slot block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot LexIntent#slot}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSlot() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#timeouts LexIntent#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexIntentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexIntentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexIntentConfig> {
        imports.aws.lex_intent.LexIntentFulfillmentActivity fulfillmentActivity;
        java.lang.String name;
        imports.aws.lex_intent.LexIntentConclusionStatement conclusionStatement;
        imports.aws.lex_intent.LexIntentConfirmationPrompt confirmationPrompt;
        java.lang.Object createVersion;
        java.lang.String description;
        imports.aws.lex_intent.LexIntentDialogCodeHook dialogCodeHook;
        imports.aws.lex_intent.LexIntentFollowUpPrompt followUpPrompt;
        java.lang.String id;
        java.lang.String parentIntentSignature;
        imports.aws.lex_intent.LexIntentRejectionStatement rejectionStatement;
        java.util.List<java.lang.String> sampleUtterances;
        java.lang.Object slot;
        imports.aws.lex_intent.LexIntentTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LexIntentConfig#getFulfillmentActivity}
         * @param fulfillmentActivity fulfillment_activity block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#fulfillment_activity LexIntent#fulfillment_activity}
         * @return {@code this}
         */
        public Builder fulfillmentActivity(imports.aws.lex_intent.LexIntentFulfillmentActivity fulfillmentActivity) {
            this.fulfillmentActivity = fulfillmentActivity;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#name LexIntent#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getConclusionStatement}
         * @param conclusionStatement conclusion_statement block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#conclusion_statement LexIntent#conclusion_statement}
         * @return {@code this}
         */
        public Builder conclusionStatement(imports.aws.lex_intent.LexIntentConclusionStatement conclusionStatement) {
            this.conclusionStatement = conclusionStatement;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getConfirmationPrompt}
         * @param confirmationPrompt confirmation_prompt block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#confirmation_prompt LexIntent#confirmation_prompt}
         * @return {@code this}
         */
        public Builder confirmationPrompt(imports.aws.lex_intent.LexIntentConfirmationPrompt confirmationPrompt) {
            this.confirmationPrompt = confirmationPrompt;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getCreateVersion}
         * @param createVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#create_version LexIntent#create_version}.
         * @return {@code this}
         */
        public Builder createVersion(java.lang.Boolean createVersion) {
            this.createVersion = createVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getCreateVersion}
         * @param createVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#create_version LexIntent#create_version}.
         * @return {@code this}
         */
        public Builder createVersion(com.hashicorp.cdktf.IResolvable createVersion) {
            this.createVersion = createVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#description LexIntent#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getDialogCodeHook}
         * @param dialogCodeHook dialog_code_hook block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#dialog_code_hook LexIntent#dialog_code_hook}
         * @return {@code this}
         */
        public Builder dialogCodeHook(imports.aws.lex_intent.LexIntentDialogCodeHook dialogCodeHook) {
            this.dialogCodeHook = dialogCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getFollowUpPrompt}
         * @param followUpPrompt follow_up_prompt block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#follow_up_prompt LexIntent#follow_up_prompt}
         * @return {@code this}
         */
        public Builder followUpPrompt(imports.aws.lex_intent.LexIntentFollowUpPrompt followUpPrompt) {
            this.followUpPrompt = followUpPrompt;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#id LexIntent#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getParentIntentSignature}
         * @param parentIntentSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#parent_intent_signature LexIntent#parent_intent_signature}.
         * @return {@code this}
         */
        public Builder parentIntentSignature(java.lang.String parentIntentSignature) {
            this.parentIntentSignature = parentIntentSignature;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getRejectionStatement}
         * @param rejectionStatement rejection_statement block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#rejection_statement LexIntent#rejection_statement}
         * @return {@code this}
         */
        public Builder rejectionStatement(imports.aws.lex_intent.LexIntentRejectionStatement rejectionStatement) {
            this.rejectionStatement = rejectionStatement;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getSampleUtterances}
         * @param sampleUtterances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#sample_utterances LexIntent#sample_utterances}.
         * @return {@code this}
         */
        public Builder sampleUtterances(java.util.List<java.lang.String> sampleUtterances) {
            this.sampleUtterances = sampleUtterances;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getSlot}
         * @param slot slot block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot LexIntent#slot}
         * @return {@code this}
         */
        public Builder slot(com.hashicorp.cdktf.IResolvable slot) {
            this.slot = slot;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getSlot}
         * @param slot slot block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot LexIntent#slot}
         * @return {@code this}
         */
        public Builder slot(java.util.List<? extends imports.aws.lex_intent.LexIntentSlot> slot) {
            this.slot = slot;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#timeouts LexIntent#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lex_intent.LexIntentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getDependsOn}
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
         * Sets the value of {@link LexIntentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentConfig#getProvisioners}
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
         * @return a new instance of {@link LexIntentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexIntentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexIntentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexIntentConfig {
        private final imports.aws.lex_intent.LexIntentFulfillmentActivity fulfillmentActivity;
        private final java.lang.String name;
        private final imports.aws.lex_intent.LexIntentConclusionStatement conclusionStatement;
        private final imports.aws.lex_intent.LexIntentConfirmationPrompt confirmationPrompt;
        private final java.lang.Object createVersion;
        private final java.lang.String description;
        private final imports.aws.lex_intent.LexIntentDialogCodeHook dialogCodeHook;
        private final imports.aws.lex_intent.LexIntentFollowUpPrompt followUpPrompt;
        private final java.lang.String id;
        private final java.lang.String parentIntentSignature;
        private final imports.aws.lex_intent.LexIntentRejectionStatement rejectionStatement;
        private final java.util.List<java.lang.String> sampleUtterances;
        private final java.lang.Object slot;
        private final imports.aws.lex_intent.LexIntentTimeouts timeouts;
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
            this.fulfillmentActivity = software.amazon.jsii.Kernel.get(this, "fulfillmentActivity", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFulfillmentActivity.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.conclusionStatement = software.amazon.jsii.Kernel.get(this, "conclusionStatement", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentConclusionStatement.class));
            this.confirmationPrompt = software.amazon.jsii.Kernel.get(this, "confirmationPrompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentConfirmationPrompt.class));
            this.createVersion = software.amazon.jsii.Kernel.get(this, "createVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dialogCodeHook = software.amazon.jsii.Kernel.get(this, "dialogCodeHook", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentDialogCodeHook.class));
            this.followUpPrompt = software.amazon.jsii.Kernel.get(this, "followUpPrompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPrompt.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parentIntentSignature = software.amazon.jsii.Kernel.get(this, "parentIntentSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rejectionStatement = software.amazon.jsii.Kernel.get(this, "rejectionStatement", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentRejectionStatement.class));
            this.sampleUtterances = software.amazon.jsii.Kernel.get(this, "sampleUtterances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.slot = software.amazon.jsii.Kernel.get(this, "slot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentTimeouts.class));
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
            this.fulfillmentActivity = java.util.Objects.requireNonNull(builder.fulfillmentActivity, "fulfillmentActivity is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.conclusionStatement = builder.conclusionStatement;
            this.confirmationPrompt = builder.confirmationPrompt;
            this.createVersion = builder.createVersion;
            this.description = builder.description;
            this.dialogCodeHook = builder.dialogCodeHook;
            this.followUpPrompt = builder.followUpPrompt;
            this.id = builder.id;
            this.parentIntentSignature = builder.parentIntentSignature;
            this.rejectionStatement = builder.rejectionStatement;
            this.sampleUtterances = builder.sampleUtterances;
            this.slot = builder.slot;
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
        public final imports.aws.lex_intent.LexIntentFulfillmentActivity getFulfillmentActivity() {
            return this.fulfillmentActivity;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentConclusionStatement getConclusionStatement() {
            return this.conclusionStatement;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentConfirmationPrompt getConfirmationPrompt() {
            return this.confirmationPrompt;
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
        public final imports.aws.lex_intent.LexIntentDialogCodeHook getDialogCodeHook() {
            return this.dialogCodeHook;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentFollowUpPrompt getFollowUpPrompt() {
            return this.followUpPrompt;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getParentIntentSignature() {
            return this.parentIntentSignature;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentRejectionStatement getRejectionStatement() {
            return this.rejectionStatement;
        }

        @Override
        public final java.util.List<java.lang.String> getSampleUtterances() {
            return this.sampleUtterances;
        }

        @Override
        public final java.lang.Object getSlot() {
            return this.slot;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentTimeouts getTimeouts() {
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

            data.set("fulfillmentActivity", om.valueToTree(this.getFulfillmentActivity()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getConclusionStatement() != null) {
                data.set("conclusionStatement", om.valueToTree(this.getConclusionStatement()));
            }
            if (this.getConfirmationPrompt() != null) {
                data.set("confirmationPrompt", om.valueToTree(this.getConfirmationPrompt()));
            }
            if (this.getCreateVersion() != null) {
                data.set("createVersion", om.valueToTree(this.getCreateVersion()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDialogCodeHook() != null) {
                data.set("dialogCodeHook", om.valueToTree(this.getDialogCodeHook()));
            }
            if (this.getFollowUpPrompt() != null) {
                data.set("followUpPrompt", om.valueToTree(this.getFollowUpPrompt()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParentIntentSignature() != null) {
                data.set("parentIntentSignature", om.valueToTree(this.getParentIntentSignature()));
            }
            if (this.getRejectionStatement() != null) {
                data.set("rejectionStatement", om.valueToTree(this.getRejectionStatement()));
            }
            if (this.getSampleUtterances() != null) {
                data.set("sampleUtterances", om.valueToTree(this.getSampleUtterances()));
            }
            if (this.getSlot() != null) {
                data.set("slot", om.valueToTree(this.getSlot()));
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
            struct.set("fqn", om.valueToTree("aws.lexIntent.LexIntentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexIntentConfig.Jsii$Proxy that = (LexIntentConfig.Jsii$Proxy) o;

            if (!fulfillmentActivity.equals(that.fulfillmentActivity)) return false;
            if (!name.equals(that.name)) return false;
            if (this.conclusionStatement != null ? !this.conclusionStatement.equals(that.conclusionStatement) : that.conclusionStatement != null) return false;
            if (this.confirmationPrompt != null ? !this.confirmationPrompt.equals(that.confirmationPrompt) : that.confirmationPrompt != null) return false;
            if (this.createVersion != null ? !this.createVersion.equals(that.createVersion) : that.createVersion != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dialogCodeHook != null ? !this.dialogCodeHook.equals(that.dialogCodeHook) : that.dialogCodeHook != null) return false;
            if (this.followUpPrompt != null ? !this.followUpPrompt.equals(that.followUpPrompt) : that.followUpPrompt != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parentIntentSignature != null ? !this.parentIntentSignature.equals(that.parentIntentSignature) : that.parentIntentSignature != null) return false;
            if (this.rejectionStatement != null ? !this.rejectionStatement.equals(that.rejectionStatement) : that.rejectionStatement != null) return false;
            if (this.sampleUtterances != null ? !this.sampleUtterances.equals(that.sampleUtterances) : that.sampleUtterances != null) return false;
            if (this.slot != null ? !this.slot.equals(that.slot) : that.slot != null) return false;
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
            int result = this.fulfillmentActivity.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.conclusionStatement != null ? this.conclusionStatement.hashCode() : 0);
            result = 31 * result + (this.confirmationPrompt != null ? this.confirmationPrompt.hashCode() : 0);
            result = 31 * result + (this.createVersion != null ? this.createVersion.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dialogCodeHook != null ? this.dialogCodeHook.hashCode() : 0);
            result = 31 * result + (this.followUpPrompt != null ? this.followUpPrompt.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parentIntentSignature != null ? this.parentIntentSignature.hashCode() : 0);
            result = 31 * result + (this.rejectionStatement != null ? this.rejectionStatement.hashCode() : 0);
            result = 31 * result + (this.sampleUtterances != null ? this.sampleUtterances.hashCode() : 0);
            result = 31 * result + (this.slot != null ? this.slot.hashCode() : 0);
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

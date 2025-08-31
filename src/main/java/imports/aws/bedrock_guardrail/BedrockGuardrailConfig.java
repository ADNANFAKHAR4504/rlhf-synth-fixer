package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailConfig.Jsii$Proxy.class)
public interface BedrockGuardrailConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_input_messaging BedrockGuardrail#blocked_input_messaging}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBlockedInputMessaging();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_outputs_messaging BedrockGuardrail#blocked_outputs_messaging}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBlockedOutputsMessaging();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * content_policy_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#content_policy_config BedrockGuardrail#content_policy_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContentPolicyConfig() {
        return null;
    }

    /**
     * contextual_grounding_policy_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#contextual_grounding_policy_config BedrockGuardrail#contextual_grounding_policy_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContextualGroundingPolicyConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#description BedrockGuardrail#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#kms_key_arn BedrockGuardrail#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * sensitive_information_policy_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#sensitive_information_policy_config BedrockGuardrail#sensitive_information_policy_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSensitiveInformationPolicyConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#tags BedrockGuardrail#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#timeouts BedrockGuardrail#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts getTimeouts() {
        return null;
    }

    /**
     * topic_policy_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topic_policy_config BedrockGuardrail#topic_policy_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTopicPolicyConfig() {
        return null;
    }

    /**
     * word_policy_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#word_policy_config BedrockGuardrail#word_policy_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWordPolicyConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailConfig> {
        java.lang.String blockedInputMessaging;
        java.lang.String blockedOutputsMessaging;
        java.lang.String name;
        java.lang.Object contentPolicyConfig;
        java.lang.Object contextualGroundingPolicyConfig;
        java.lang.String description;
        java.lang.String kmsKeyArn;
        java.lang.Object sensitiveInformationPolicyConfig;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts timeouts;
        java.lang.Object topicPolicyConfig;
        java.lang.Object wordPolicyConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getBlockedInputMessaging}
         * @param blockedInputMessaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_input_messaging BedrockGuardrail#blocked_input_messaging}. This parameter is required.
         * @return {@code this}
         */
        public Builder blockedInputMessaging(java.lang.String blockedInputMessaging) {
            this.blockedInputMessaging = blockedInputMessaging;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getBlockedOutputsMessaging}
         * @param blockedOutputsMessaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_outputs_messaging BedrockGuardrail#blocked_outputs_messaging}. This parameter is required.
         * @return {@code this}
         */
        public Builder blockedOutputsMessaging(java.lang.String blockedOutputsMessaging) {
            this.blockedOutputsMessaging = blockedOutputsMessaging;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getContentPolicyConfig}
         * @param contentPolicyConfig content_policy_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#content_policy_config BedrockGuardrail#content_policy_config}
         * @return {@code this}
         */
        public Builder contentPolicyConfig(com.hashicorp.cdktf.IResolvable contentPolicyConfig) {
            this.contentPolicyConfig = contentPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getContentPolicyConfig}
         * @param contentPolicyConfig content_policy_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#content_policy_config BedrockGuardrail#content_policy_config}
         * @return {@code this}
         */
        public Builder contentPolicyConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig> contentPolicyConfig) {
            this.contentPolicyConfig = contentPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getContextualGroundingPolicyConfig}
         * @param contextualGroundingPolicyConfig contextual_grounding_policy_config block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#contextual_grounding_policy_config BedrockGuardrail#contextual_grounding_policy_config}
         * @return {@code this}
         */
        public Builder contextualGroundingPolicyConfig(com.hashicorp.cdktf.IResolvable contextualGroundingPolicyConfig) {
            this.contextualGroundingPolicyConfig = contextualGroundingPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getContextualGroundingPolicyConfig}
         * @param contextualGroundingPolicyConfig contextual_grounding_policy_config block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#contextual_grounding_policy_config BedrockGuardrail#contextual_grounding_policy_config}
         * @return {@code this}
         */
        public Builder contextualGroundingPolicyConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig> contextualGroundingPolicyConfig) {
            this.contextualGroundingPolicyConfig = contextualGroundingPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#description BedrockGuardrail#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#kms_key_arn BedrockGuardrail#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getSensitiveInformationPolicyConfig}
         * @param sensitiveInformationPolicyConfig sensitive_information_policy_config block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#sensitive_information_policy_config BedrockGuardrail#sensitive_information_policy_config}
         * @return {@code this}
         */
        public Builder sensitiveInformationPolicyConfig(com.hashicorp.cdktf.IResolvable sensitiveInformationPolicyConfig) {
            this.sensitiveInformationPolicyConfig = sensitiveInformationPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getSensitiveInformationPolicyConfig}
         * @param sensitiveInformationPolicyConfig sensitive_information_policy_config block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#sensitive_information_policy_config BedrockGuardrail#sensitive_information_policy_config}
         * @return {@code this}
         */
        public Builder sensitiveInformationPolicyConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig> sensitiveInformationPolicyConfig) {
            this.sensitiveInformationPolicyConfig = sensitiveInformationPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#tags BedrockGuardrail#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#timeouts BedrockGuardrail#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getTopicPolicyConfig}
         * @param topicPolicyConfig topic_policy_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topic_policy_config BedrockGuardrail#topic_policy_config}
         * @return {@code this}
         */
        public Builder topicPolicyConfig(com.hashicorp.cdktf.IResolvable topicPolicyConfig) {
            this.topicPolicyConfig = topicPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getTopicPolicyConfig}
         * @param topicPolicyConfig topic_policy_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topic_policy_config BedrockGuardrail#topic_policy_config}
         * @return {@code this}
         */
        public Builder topicPolicyConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig> topicPolicyConfig) {
            this.topicPolicyConfig = topicPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getWordPolicyConfig}
         * @param wordPolicyConfig word_policy_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#word_policy_config BedrockGuardrail#word_policy_config}
         * @return {@code this}
         */
        public Builder wordPolicyConfig(com.hashicorp.cdktf.IResolvable wordPolicyConfig) {
            this.wordPolicyConfig = wordPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getWordPolicyConfig}
         * @param wordPolicyConfig word_policy_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#word_policy_config BedrockGuardrail#word_policy_config}
         * @return {@code this}
         */
        public Builder wordPolicyConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig> wordPolicyConfig) {
            this.wordPolicyConfig = wordPolicyConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getDependsOn}
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
         * Sets the value of {@link BedrockGuardrailConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailConfig#getProvisioners}
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
         * @return a new instance of {@link BedrockGuardrailConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailConfig {
        private final java.lang.String blockedInputMessaging;
        private final java.lang.String blockedOutputsMessaging;
        private final java.lang.String name;
        private final java.lang.Object contentPolicyConfig;
        private final java.lang.Object contextualGroundingPolicyConfig;
        private final java.lang.String description;
        private final java.lang.String kmsKeyArn;
        private final java.lang.Object sensitiveInformationPolicyConfig;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts timeouts;
        private final java.lang.Object topicPolicyConfig;
        private final java.lang.Object wordPolicyConfig;
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
            this.blockedInputMessaging = software.amazon.jsii.Kernel.get(this, "blockedInputMessaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blockedOutputsMessaging = software.amazon.jsii.Kernel.get(this, "blockedOutputsMessaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentPolicyConfig = software.amazon.jsii.Kernel.get(this, "contentPolicyConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.contextualGroundingPolicyConfig = software.amazon.jsii.Kernel.get(this, "contextualGroundingPolicyConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sensitiveInformationPolicyConfig = software.amazon.jsii.Kernel.get(this, "sensitiveInformationPolicyConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts.class));
            this.topicPolicyConfig = software.amazon.jsii.Kernel.get(this, "topicPolicyConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.wordPolicyConfig = software.amazon.jsii.Kernel.get(this, "wordPolicyConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.blockedInputMessaging = java.util.Objects.requireNonNull(builder.blockedInputMessaging, "blockedInputMessaging is required");
            this.blockedOutputsMessaging = java.util.Objects.requireNonNull(builder.blockedOutputsMessaging, "blockedOutputsMessaging is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.contentPolicyConfig = builder.contentPolicyConfig;
            this.contextualGroundingPolicyConfig = builder.contextualGroundingPolicyConfig;
            this.description = builder.description;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.sensitiveInformationPolicyConfig = builder.sensitiveInformationPolicyConfig;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.topicPolicyConfig = builder.topicPolicyConfig;
            this.wordPolicyConfig = builder.wordPolicyConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBlockedInputMessaging() {
            return this.blockedInputMessaging;
        }

        @Override
        public final java.lang.String getBlockedOutputsMessaging() {
            return this.blockedOutputsMessaging;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getContentPolicyConfig() {
            return this.contentPolicyConfig;
        }

        @Override
        public final java.lang.Object getContextualGroundingPolicyConfig() {
            return this.contextualGroundingPolicyConfig;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.Object getSensitiveInformationPolicyConfig() {
            return this.sensitiveInformationPolicyConfig;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTopicPolicyConfig() {
            return this.topicPolicyConfig;
        }

        @Override
        public final java.lang.Object getWordPolicyConfig() {
            return this.wordPolicyConfig;
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

            data.set("blockedInputMessaging", om.valueToTree(this.getBlockedInputMessaging()));
            data.set("blockedOutputsMessaging", om.valueToTree(this.getBlockedOutputsMessaging()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getContentPolicyConfig() != null) {
                data.set("contentPolicyConfig", om.valueToTree(this.getContentPolicyConfig()));
            }
            if (this.getContextualGroundingPolicyConfig() != null) {
                data.set("contextualGroundingPolicyConfig", om.valueToTree(this.getContextualGroundingPolicyConfig()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getSensitiveInformationPolicyConfig() != null) {
                data.set("sensitiveInformationPolicyConfig", om.valueToTree(this.getSensitiveInformationPolicyConfig()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTopicPolicyConfig() != null) {
                data.set("topicPolicyConfig", om.valueToTree(this.getTopicPolicyConfig()));
            }
            if (this.getWordPolicyConfig() != null) {
                data.set("wordPolicyConfig", om.valueToTree(this.getWordPolicyConfig()));
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
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailConfig.Jsii$Proxy that = (BedrockGuardrailConfig.Jsii$Proxy) o;

            if (!blockedInputMessaging.equals(that.blockedInputMessaging)) return false;
            if (!blockedOutputsMessaging.equals(that.blockedOutputsMessaging)) return false;
            if (!name.equals(that.name)) return false;
            if (this.contentPolicyConfig != null ? !this.contentPolicyConfig.equals(that.contentPolicyConfig) : that.contentPolicyConfig != null) return false;
            if (this.contextualGroundingPolicyConfig != null ? !this.contextualGroundingPolicyConfig.equals(that.contextualGroundingPolicyConfig) : that.contextualGroundingPolicyConfig != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.sensitiveInformationPolicyConfig != null ? !this.sensitiveInformationPolicyConfig.equals(that.sensitiveInformationPolicyConfig) : that.sensitiveInformationPolicyConfig != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.topicPolicyConfig != null ? !this.topicPolicyConfig.equals(that.topicPolicyConfig) : that.topicPolicyConfig != null) return false;
            if (this.wordPolicyConfig != null ? !this.wordPolicyConfig.equals(that.wordPolicyConfig) : that.wordPolicyConfig != null) return false;
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
            int result = this.blockedInputMessaging.hashCode();
            result = 31 * result + (this.blockedOutputsMessaging.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.contentPolicyConfig != null ? this.contentPolicyConfig.hashCode() : 0);
            result = 31 * result + (this.contextualGroundingPolicyConfig != null ? this.contextualGroundingPolicyConfig.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.sensitiveInformationPolicyConfig != null ? this.sensitiveInformationPolicyConfig.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.topicPolicyConfig != null ? this.topicPolicyConfig.hashCode() : 0);
            result = 31 * result + (this.wordPolicyConfig != null ? this.wordPolicyConfig.hashCode() : 0);
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

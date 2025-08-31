package imports.aws.chatbot_slack_channel_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.201Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chatbotSlackChannelConfiguration.ChatbotSlackChannelConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(ChatbotSlackChannelConfigurationConfig.Jsii$Proxy.class)
public interface ChatbotSlackChannelConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#configuration_name ChatbotSlackChannelConfiguration#configuration_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#iam_role_arn ChatbotSlackChannelConfiguration#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_channel_id ChatbotSlackChannelConfiguration#slack_channel_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlackChannelId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_team_id ChatbotSlackChannelConfiguration#slack_team_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlackTeamId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#guardrail_policy_arns ChatbotSlackChannelConfiguration#guardrail_policy_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGuardrailPolicyArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#logging_level ChatbotSlackChannelConfiguration#logging_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoggingLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#sns_topic_arns ChatbotSlackChannelConfiguration#sns_topic_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnsTopicArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#tags ChatbotSlackChannelConfiguration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#timeouts ChatbotSlackChannelConfiguration#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserAuthorizationRequired() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChatbotSlackChannelConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChatbotSlackChannelConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChatbotSlackChannelConfigurationConfig> {
        java.lang.String configurationName;
        java.lang.String iamRoleArn;
        java.lang.String slackChannelId;
        java.lang.String slackTeamId;
        java.util.List<java.lang.String> guardrailPolicyArns;
        java.lang.String loggingLevel;
        java.util.List<java.lang.String> snsTopicArns;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts timeouts;
        java.lang.Object userAuthorizationRequired;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getConfigurationName}
         * @param configurationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#configuration_name ChatbotSlackChannelConfiguration#configuration_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationName(java.lang.String configurationName) {
            this.configurationName = configurationName;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#iam_role_arn ChatbotSlackChannelConfiguration#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getSlackChannelId}
         * @param slackChannelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_channel_id ChatbotSlackChannelConfiguration#slack_channel_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder slackChannelId(java.lang.String slackChannelId) {
            this.slackChannelId = slackChannelId;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getSlackTeamId}
         * @param slackTeamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_team_id ChatbotSlackChannelConfiguration#slack_team_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder slackTeamId(java.lang.String slackTeamId) {
            this.slackTeamId = slackTeamId;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getGuardrailPolicyArns}
         * @param guardrailPolicyArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#guardrail_policy_arns ChatbotSlackChannelConfiguration#guardrail_policy_arns}.
         * @return {@code this}
         */
        public Builder guardrailPolicyArns(java.util.List<java.lang.String> guardrailPolicyArns) {
            this.guardrailPolicyArns = guardrailPolicyArns;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getLoggingLevel}
         * @param loggingLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#logging_level ChatbotSlackChannelConfiguration#logging_level}.
         * @return {@code this}
         */
        public Builder loggingLevel(java.lang.String loggingLevel) {
            this.loggingLevel = loggingLevel;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getSnsTopicArns}
         * @param snsTopicArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#sns_topic_arns ChatbotSlackChannelConfiguration#sns_topic_arns}.
         * @return {@code this}
         */
        public Builder snsTopicArns(java.util.List<java.lang.String> snsTopicArns) {
            this.snsTopicArns = snsTopicArns;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#tags ChatbotSlackChannelConfiguration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#timeouts ChatbotSlackChannelConfiguration#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getUserAuthorizationRequired}
         * @param userAuthorizationRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}.
         * @return {@code this}
         */
        public Builder userAuthorizationRequired(java.lang.Boolean userAuthorizationRequired) {
            this.userAuthorizationRequired = userAuthorizationRequired;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getUserAuthorizationRequired}
         * @param userAuthorizationRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}.
         * @return {@code this}
         */
        public Builder userAuthorizationRequired(com.hashicorp.cdktf.IResolvable userAuthorizationRequired) {
            this.userAuthorizationRequired = userAuthorizationRequired;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ChatbotSlackChannelConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link ChatbotSlackChannelConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChatbotSlackChannelConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChatbotSlackChannelConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChatbotSlackChannelConfigurationConfig {
        private final java.lang.String configurationName;
        private final java.lang.String iamRoleArn;
        private final java.lang.String slackChannelId;
        private final java.lang.String slackTeamId;
        private final java.util.List<java.lang.String> guardrailPolicyArns;
        private final java.lang.String loggingLevel;
        private final java.util.List<java.lang.String> snsTopicArns;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts timeouts;
        private final java.lang.Object userAuthorizationRequired;
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
            this.configurationName = software.amazon.jsii.Kernel.get(this, "configurationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slackChannelId = software.amazon.jsii.Kernel.get(this, "slackChannelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slackTeamId = software.amazon.jsii.Kernel.get(this, "slackTeamId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.guardrailPolicyArns = software.amazon.jsii.Kernel.get(this, "guardrailPolicyArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.loggingLevel = software.amazon.jsii.Kernel.get(this, "loggingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snsTopicArns = software.amazon.jsii.Kernel.get(this, "snsTopicArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts.class));
            this.userAuthorizationRequired = software.amazon.jsii.Kernel.get(this, "userAuthorizationRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.configurationName = java.util.Objects.requireNonNull(builder.configurationName, "configurationName is required");
            this.iamRoleArn = java.util.Objects.requireNonNull(builder.iamRoleArn, "iamRoleArn is required");
            this.slackChannelId = java.util.Objects.requireNonNull(builder.slackChannelId, "slackChannelId is required");
            this.slackTeamId = java.util.Objects.requireNonNull(builder.slackTeamId, "slackTeamId is required");
            this.guardrailPolicyArns = builder.guardrailPolicyArns;
            this.loggingLevel = builder.loggingLevel;
            this.snsTopicArns = builder.snsTopicArns;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.userAuthorizationRequired = builder.userAuthorizationRequired;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getConfigurationName() {
            return this.configurationName;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getSlackChannelId() {
            return this.slackChannelId;
        }

        @Override
        public final java.lang.String getSlackTeamId() {
            return this.slackTeamId;
        }

        @Override
        public final java.util.List<java.lang.String> getGuardrailPolicyArns() {
            return this.guardrailPolicyArns;
        }

        @Override
        public final java.lang.String getLoggingLevel() {
            return this.loggingLevel;
        }

        @Override
        public final java.util.List<java.lang.String> getSnsTopicArns() {
            return this.snsTopicArns;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUserAuthorizationRequired() {
            return this.userAuthorizationRequired;
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

            data.set("configurationName", om.valueToTree(this.getConfigurationName()));
            data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            data.set("slackChannelId", om.valueToTree(this.getSlackChannelId()));
            data.set("slackTeamId", om.valueToTree(this.getSlackTeamId()));
            if (this.getGuardrailPolicyArns() != null) {
                data.set("guardrailPolicyArns", om.valueToTree(this.getGuardrailPolicyArns()));
            }
            if (this.getLoggingLevel() != null) {
                data.set("loggingLevel", om.valueToTree(this.getLoggingLevel()));
            }
            if (this.getSnsTopicArns() != null) {
                data.set("snsTopicArns", om.valueToTree(this.getSnsTopicArns()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserAuthorizationRequired() != null) {
                data.set("userAuthorizationRequired", om.valueToTree(this.getUserAuthorizationRequired()));
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
            struct.set("fqn", om.valueToTree("aws.chatbotSlackChannelConfiguration.ChatbotSlackChannelConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChatbotSlackChannelConfigurationConfig.Jsii$Proxy that = (ChatbotSlackChannelConfigurationConfig.Jsii$Proxy) o;

            if (!configurationName.equals(that.configurationName)) return false;
            if (!iamRoleArn.equals(that.iamRoleArn)) return false;
            if (!slackChannelId.equals(that.slackChannelId)) return false;
            if (!slackTeamId.equals(that.slackTeamId)) return false;
            if (this.guardrailPolicyArns != null ? !this.guardrailPolicyArns.equals(that.guardrailPolicyArns) : that.guardrailPolicyArns != null) return false;
            if (this.loggingLevel != null ? !this.loggingLevel.equals(that.loggingLevel) : that.loggingLevel != null) return false;
            if (this.snsTopicArns != null ? !this.snsTopicArns.equals(that.snsTopicArns) : that.snsTopicArns != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userAuthorizationRequired != null ? !this.userAuthorizationRequired.equals(that.userAuthorizationRequired) : that.userAuthorizationRequired != null) return false;
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
            int result = this.configurationName.hashCode();
            result = 31 * result + (this.iamRoleArn.hashCode());
            result = 31 * result + (this.slackChannelId.hashCode());
            result = 31 * result + (this.slackTeamId.hashCode());
            result = 31 * result + (this.guardrailPolicyArns != null ? this.guardrailPolicyArns.hashCode() : 0);
            result = 31 * result + (this.loggingLevel != null ? this.loggingLevel.hashCode() : 0);
            result = 31 * result + (this.snsTopicArns != null ? this.snsTopicArns.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userAuthorizationRequired != null ? this.userAuthorizationRequired.hashCode() : 0);
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

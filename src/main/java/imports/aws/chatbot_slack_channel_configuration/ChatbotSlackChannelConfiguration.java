package imports.aws.chatbot_slack_channel_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration aws_chatbot_slack_channel_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.201Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chatbotSlackChannelConfiguration.ChatbotSlackChannelConfiguration")
public class ChatbotSlackChannelConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected ChatbotSlackChannelConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChatbotSlackChannelConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration aws_chatbot_slack_channel_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ChatbotSlackChannelConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ChatbotSlackChannelConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ChatbotSlackChannelConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing ChatbotSlackChannelConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ChatbotSlackChannelConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ChatbotSlackChannelConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ChatbotSlackChannelConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing ChatbotSlackChannelConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetGuardrailPolicyArns() {
        software.amazon.jsii.Kernel.call(this, "resetGuardrailPolicyArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsTopicArns() {
        software.amazon.jsii.Kernel.call(this, "resetSnsTopicArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserAuthorizationRequired() {
        software.amazon.jsii.Kernel.call(this, "resetUserAuthorizationRequired", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getChatConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "chatConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlackChannelName() {
        return software.amazon.jsii.Kernel.get(this, "slackChannelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlackTeamName() {
        return software.amazon.jsii.Kernel.get(this, "slackTeamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGuardrailPolicyArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "guardrailPolicyArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoggingLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlackChannelIdInput() {
        return software.amazon.jsii.Kernel.get(this, "slackChannelIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlackTeamIdInput() {
        return software.amazon.jsii.Kernel.get(this, "slackTeamIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnsTopicArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "snsTopicArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserAuthorizationRequiredInput() {
        return software.amazon.jsii.Kernel.get(this, "userAuthorizationRequiredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationName() {
        return software.amazon.jsii.Kernel.get(this, "configurationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationName", java.util.Objects.requireNonNull(value, "configurationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGuardrailPolicyArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "guardrailPolicyArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGuardrailPolicyArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "guardrailPolicyArns", java.util.Objects.requireNonNull(value, "guardrailPolicyArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamRoleArn", java.util.Objects.requireNonNull(value, "iamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoggingLevel() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoggingLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loggingLevel", java.util.Objects.requireNonNull(value, "loggingLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlackChannelId() {
        return software.amazon.jsii.Kernel.get(this, "slackChannelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlackChannelId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slackChannelId", java.util.Objects.requireNonNull(value, "slackChannelId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlackTeamId() {
        return software.amazon.jsii.Kernel.get(this, "slackTeamId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlackTeamId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slackTeamId", java.util.Objects.requireNonNull(value, "slackTeamId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSnsTopicArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "snsTopicArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSnsTopicArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "snsTopicArns", java.util.Objects.requireNonNull(value, "snsTopicArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUserAuthorizationRequired() {
        return software.amazon.jsii.Kernel.get(this, "userAuthorizationRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUserAuthorizationRequired(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "userAuthorizationRequired", java.util.Objects.requireNonNull(value, "userAuthorizationRequired is required"));
    }

    public void setUserAuthorizationRequired(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "userAuthorizationRequired", java.util.Objects.requireNonNull(value, "userAuthorizationRequired is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration> {
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
        private final imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#configuration_name ChatbotSlackChannelConfiguration#configuration_name}.
         * <p>
         * @return {@code this}
         * @param configurationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#configuration_name ChatbotSlackChannelConfiguration#configuration_name}. This parameter is required.
         */
        public Builder configurationName(final java.lang.String configurationName) {
            this.config.configurationName(configurationName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#iam_role_arn ChatbotSlackChannelConfiguration#iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#iam_role_arn ChatbotSlackChannelConfiguration#iam_role_arn}. This parameter is required.
         */
        public Builder iamRoleArn(final java.lang.String iamRoleArn) {
            this.config.iamRoleArn(iamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_channel_id ChatbotSlackChannelConfiguration#slack_channel_id}.
         * <p>
         * @return {@code this}
         * @param slackChannelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_channel_id ChatbotSlackChannelConfiguration#slack_channel_id}. This parameter is required.
         */
        public Builder slackChannelId(final java.lang.String slackChannelId) {
            this.config.slackChannelId(slackChannelId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_team_id ChatbotSlackChannelConfiguration#slack_team_id}.
         * <p>
         * @return {@code this}
         * @param slackTeamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#slack_team_id ChatbotSlackChannelConfiguration#slack_team_id}. This parameter is required.
         */
        public Builder slackTeamId(final java.lang.String slackTeamId) {
            this.config.slackTeamId(slackTeamId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#guardrail_policy_arns ChatbotSlackChannelConfiguration#guardrail_policy_arns}.
         * <p>
         * @return {@code this}
         * @param guardrailPolicyArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#guardrail_policy_arns ChatbotSlackChannelConfiguration#guardrail_policy_arns}. This parameter is required.
         */
        public Builder guardrailPolicyArns(final java.util.List<java.lang.String> guardrailPolicyArns) {
            this.config.guardrailPolicyArns(guardrailPolicyArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#logging_level ChatbotSlackChannelConfiguration#logging_level}.
         * <p>
         * @return {@code this}
         * @param loggingLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#logging_level ChatbotSlackChannelConfiguration#logging_level}. This parameter is required.
         */
        public Builder loggingLevel(final java.lang.String loggingLevel) {
            this.config.loggingLevel(loggingLevel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#sns_topic_arns ChatbotSlackChannelConfiguration#sns_topic_arns}.
         * <p>
         * @return {@code this}
         * @param snsTopicArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#sns_topic_arns ChatbotSlackChannelConfiguration#sns_topic_arns}. This parameter is required.
         */
        public Builder snsTopicArns(final java.util.List<java.lang.String> snsTopicArns) {
            this.config.snsTopicArns(snsTopicArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#tags ChatbotSlackChannelConfiguration#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#tags ChatbotSlackChannelConfiguration#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#timeouts ChatbotSlackChannelConfiguration#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfigurationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}.
         * <p>
         * @return {@code this}
         * @param userAuthorizationRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}. This parameter is required.
         */
        public Builder userAuthorizationRequired(final java.lang.Boolean userAuthorizationRequired) {
            this.config.userAuthorizationRequired(userAuthorizationRequired);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}.
         * <p>
         * @return {@code this}
         * @param userAuthorizationRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chatbot_slack_channel_configuration#user_authorization_required ChatbotSlackChannelConfiguration#user_authorization_required}. This parameter is required.
         */
        public Builder userAuthorizationRequired(final com.hashicorp.cdktf.IResolvable userAuthorizationRequired) {
            this.config.userAuthorizationRequired(userAuthorizationRequired);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration}.
         */
        @Override
        public imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration build() {
            return new imports.aws.chatbot_slack_channel_configuration.ChatbotSlackChannelConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

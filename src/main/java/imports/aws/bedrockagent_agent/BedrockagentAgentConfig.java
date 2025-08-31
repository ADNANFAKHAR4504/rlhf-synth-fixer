package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentConfig.Jsii$Proxy.class)
public interface BedrockagentAgentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAgentName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAgentResourceRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFoundationModel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAgentCollaboration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerEncryptionKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGuardrailConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleSessionTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstruction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMemoryConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPromptOverrideConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipResourceInUseCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentConfig> {
        java.lang.String agentName;
        java.lang.String agentResourceRoleArn;
        java.lang.String foundationModel;
        java.lang.String agentCollaboration;
        java.lang.String customerEncryptionKeyArn;
        java.lang.String description;
        java.lang.Object guardrailConfiguration;
        java.lang.Number idleSessionTtlInSeconds;
        java.lang.String instruction;
        java.lang.Object memoryConfiguration;
        java.lang.Object prepareAgent;
        java.lang.Object promptOverrideConfiguration;
        java.lang.Object skipResourceInUseCheck;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getAgentName}
         * @param agentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentName(java.lang.String agentName) {
            this.agentName = agentName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getAgentResourceRoleArn}
         * @param agentResourceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentResourceRoleArn(java.lang.String agentResourceRoleArn) {
            this.agentResourceRoleArn = agentResourceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getFoundationModel}
         * @param foundationModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}. This parameter is required.
         * @return {@code this}
         */
        public Builder foundationModel(java.lang.String foundationModel) {
            this.foundationModel = foundationModel;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getAgentCollaboration}
         * @param agentCollaboration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.
         * @return {@code this}
         */
        public Builder agentCollaboration(java.lang.String agentCollaboration) {
            this.agentCollaboration = agentCollaboration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getCustomerEncryptionKeyArn}
         * @param customerEncryptionKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.
         * @return {@code this}
         */
        public Builder customerEncryptionKeyArn(java.lang.String customerEncryptionKeyArn) {
            this.customerEncryptionKeyArn = customerEncryptionKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getGuardrailConfiguration}
         * @param guardrailConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
         * @return {@code this}
         */
        public Builder guardrailConfiguration(com.hashicorp.cdktf.IResolvable guardrailConfiguration) {
            this.guardrailConfiguration = guardrailConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getGuardrailConfiguration}
         * @param guardrailConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
         * @return {@code this}
         */
        public Builder guardrailConfiguration(java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration> guardrailConfiguration) {
            this.guardrailConfiguration = guardrailConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getIdleSessionTtlInSeconds}
         * @param idleSessionTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder idleSessionTtlInSeconds(java.lang.Number idleSessionTtlInSeconds) {
            this.idleSessionTtlInSeconds = idleSessionTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getInstruction}
         * @param instruction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.
         * @return {@code this}
         */
        public Builder instruction(java.lang.String instruction) {
            this.instruction = instruction;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getMemoryConfiguration}
         * @param memoryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
         * @return {@code this}
         */
        public Builder memoryConfiguration(com.hashicorp.cdktf.IResolvable memoryConfiguration) {
            this.memoryConfiguration = memoryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getMemoryConfiguration}
         * @param memoryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
         * @return {@code this}
         */
        public Builder memoryConfiguration(java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration> memoryConfiguration) {
            this.memoryConfiguration = memoryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(java.lang.Boolean prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getPromptOverrideConfiguration}
         * @param promptOverrideConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
         * @return {@code this}
         */
        public Builder promptOverrideConfiguration(com.hashicorp.cdktf.IResolvable promptOverrideConfiguration) {
            this.promptOverrideConfiguration = promptOverrideConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getPromptOverrideConfiguration}
         * @param promptOverrideConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
         * @return {@code this}
         */
        public Builder promptOverrideConfiguration(java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration> promptOverrideConfiguration) {
            this.promptOverrideConfiguration = promptOverrideConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getSkipResourceInUseCheck}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
         * @return {@code this}
         */
        public Builder skipResourceInUseCheck(java.lang.Boolean skipResourceInUseCheck) {
            this.skipResourceInUseCheck = skipResourceInUseCheck;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getSkipResourceInUseCheck}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
         * @return {@code this}
         */
        public Builder skipResourceInUseCheck(com.hashicorp.cdktf.IResolvable skipResourceInUseCheck) {
            this.skipResourceInUseCheck = skipResourceInUseCheck;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getDependsOn}
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
         * Sets the value of {@link BedrockagentAgentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentConfig#getProvisioners}
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
         * @return a new instance of {@link BedrockagentAgentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentConfig {
        private final java.lang.String agentName;
        private final java.lang.String agentResourceRoleArn;
        private final java.lang.String foundationModel;
        private final java.lang.String agentCollaboration;
        private final java.lang.String customerEncryptionKeyArn;
        private final java.lang.String description;
        private final java.lang.Object guardrailConfiguration;
        private final java.lang.Number idleSessionTtlInSeconds;
        private final java.lang.String instruction;
        private final java.lang.Object memoryConfiguration;
        private final java.lang.Object prepareAgent;
        private final java.lang.Object promptOverrideConfiguration;
        private final java.lang.Object skipResourceInUseCheck;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts timeouts;
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
            this.agentName = software.amazon.jsii.Kernel.get(this, "agentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentResourceRoleArn = software.amazon.jsii.Kernel.get(this, "agentResourceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.foundationModel = software.amazon.jsii.Kernel.get(this, "foundationModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentCollaboration = software.amazon.jsii.Kernel.get(this, "agentCollaboration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerEncryptionKeyArn = software.amazon.jsii.Kernel.get(this, "customerEncryptionKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.guardrailConfiguration = software.amazon.jsii.Kernel.get(this, "guardrailConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.idleSessionTtlInSeconds = software.amazon.jsii.Kernel.get(this, "idleSessionTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instruction = software.amazon.jsii.Kernel.get(this, "instruction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memoryConfiguration = software.amazon.jsii.Kernel.get(this, "memoryConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.prepareAgent = software.amazon.jsii.Kernel.get(this, "prepareAgent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.promptOverrideConfiguration = software.amazon.jsii.Kernel.get(this, "promptOverrideConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.skipResourceInUseCheck = software.amazon.jsii.Kernel.get(this, "skipResourceInUseCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts.class));
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
            this.agentName = java.util.Objects.requireNonNull(builder.agentName, "agentName is required");
            this.agentResourceRoleArn = java.util.Objects.requireNonNull(builder.agentResourceRoleArn, "agentResourceRoleArn is required");
            this.foundationModel = java.util.Objects.requireNonNull(builder.foundationModel, "foundationModel is required");
            this.agentCollaboration = builder.agentCollaboration;
            this.customerEncryptionKeyArn = builder.customerEncryptionKeyArn;
            this.description = builder.description;
            this.guardrailConfiguration = builder.guardrailConfiguration;
            this.idleSessionTtlInSeconds = builder.idleSessionTtlInSeconds;
            this.instruction = builder.instruction;
            this.memoryConfiguration = builder.memoryConfiguration;
            this.prepareAgent = builder.prepareAgent;
            this.promptOverrideConfiguration = builder.promptOverrideConfiguration;
            this.skipResourceInUseCheck = builder.skipResourceInUseCheck;
            this.tags = builder.tags;
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
        public final java.lang.String getAgentName() {
            return this.agentName;
        }

        @Override
        public final java.lang.String getAgentResourceRoleArn() {
            return this.agentResourceRoleArn;
        }

        @Override
        public final java.lang.String getFoundationModel() {
            return this.foundationModel;
        }

        @Override
        public final java.lang.String getAgentCollaboration() {
            return this.agentCollaboration;
        }

        @Override
        public final java.lang.String getCustomerEncryptionKeyArn() {
            return this.customerEncryptionKeyArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getGuardrailConfiguration() {
            return this.guardrailConfiguration;
        }

        @Override
        public final java.lang.Number getIdleSessionTtlInSeconds() {
            return this.idleSessionTtlInSeconds;
        }

        @Override
        public final java.lang.String getInstruction() {
            return this.instruction;
        }

        @Override
        public final java.lang.Object getMemoryConfiguration() {
            return this.memoryConfiguration;
        }

        @Override
        public final java.lang.Object getPrepareAgent() {
            return this.prepareAgent;
        }

        @Override
        public final java.lang.Object getPromptOverrideConfiguration() {
            return this.promptOverrideConfiguration;
        }

        @Override
        public final java.lang.Object getSkipResourceInUseCheck() {
            return this.skipResourceInUseCheck;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts getTimeouts() {
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

            data.set("agentName", om.valueToTree(this.getAgentName()));
            data.set("agentResourceRoleArn", om.valueToTree(this.getAgentResourceRoleArn()));
            data.set("foundationModel", om.valueToTree(this.getFoundationModel()));
            if (this.getAgentCollaboration() != null) {
                data.set("agentCollaboration", om.valueToTree(this.getAgentCollaboration()));
            }
            if (this.getCustomerEncryptionKeyArn() != null) {
                data.set("customerEncryptionKeyArn", om.valueToTree(this.getCustomerEncryptionKeyArn()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getGuardrailConfiguration() != null) {
                data.set("guardrailConfiguration", om.valueToTree(this.getGuardrailConfiguration()));
            }
            if (this.getIdleSessionTtlInSeconds() != null) {
                data.set("idleSessionTtlInSeconds", om.valueToTree(this.getIdleSessionTtlInSeconds()));
            }
            if (this.getInstruction() != null) {
                data.set("instruction", om.valueToTree(this.getInstruction()));
            }
            if (this.getMemoryConfiguration() != null) {
                data.set("memoryConfiguration", om.valueToTree(this.getMemoryConfiguration()));
            }
            if (this.getPrepareAgent() != null) {
                data.set("prepareAgent", om.valueToTree(this.getPrepareAgent()));
            }
            if (this.getPromptOverrideConfiguration() != null) {
                data.set("promptOverrideConfiguration", om.valueToTree(this.getPromptOverrideConfiguration()));
            }
            if (this.getSkipResourceInUseCheck() != null) {
                data.set("skipResourceInUseCheck", om.valueToTree(this.getSkipResourceInUseCheck()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentConfig.Jsii$Proxy that = (BedrockagentAgentConfig.Jsii$Proxy) o;

            if (!agentName.equals(that.agentName)) return false;
            if (!agentResourceRoleArn.equals(that.agentResourceRoleArn)) return false;
            if (!foundationModel.equals(that.foundationModel)) return false;
            if (this.agentCollaboration != null ? !this.agentCollaboration.equals(that.agentCollaboration) : that.agentCollaboration != null) return false;
            if (this.customerEncryptionKeyArn != null ? !this.customerEncryptionKeyArn.equals(that.customerEncryptionKeyArn) : that.customerEncryptionKeyArn != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.guardrailConfiguration != null ? !this.guardrailConfiguration.equals(that.guardrailConfiguration) : that.guardrailConfiguration != null) return false;
            if (this.idleSessionTtlInSeconds != null ? !this.idleSessionTtlInSeconds.equals(that.idleSessionTtlInSeconds) : that.idleSessionTtlInSeconds != null) return false;
            if (this.instruction != null ? !this.instruction.equals(that.instruction) : that.instruction != null) return false;
            if (this.memoryConfiguration != null ? !this.memoryConfiguration.equals(that.memoryConfiguration) : that.memoryConfiguration != null) return false;
            if (this.prepareAgent != null ? !this.prepareAgent.equals(that.prepareAgent) : that.prepareAgent != null) return false;
            if (this.promptOverrideConfiguration != null ? !this.promptOverrideConfiguration.equals(that.promptOverrideConfiguration) : that.promptOverrideConfiguration != null) return false;
            if (this.skipResourceInUseCheck != null ? !this.skipResourceInUseCheck.equals(that.skipResourceInUseCheck) : that.skipResourceInUseCheck != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.agentName.hashCode();
            result = 31 * result + (this.agentResourceRoleArn.hashCode());
            result = 31 * result + (this.foundationModel.hashCode());
            result = 31 * result + (this.agentCollaboration != null ? this.agentCollaboration.hashCode() : 0);
            result = 31 * result + (this.customerEncryptionKeyArn != null ? this.customerEncryptionKeyArn.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.guardrailConfiguration != null ? this.guardrailConfiguration.hashCode() : 0);
            result = 31 * result + (this.idleSessionTtlInSeconds != null ? this.idleSessionTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.instruction != null ? this.instruction.hashCode() : 0);
            result = 31 * result + (this.memoryConfiguration != null ? this.memoryConfiguration.hashCode() : 0);
            result = 31 * result + (this.prepareAgent != null ? this.prepareAgent.hashCode() : 0);
            result = 31 * result + (this.promptOverrideConfiguration != null ? this.promptOverrideConfiguration.hashCode() : 0);
            result = 31 * result + (this.skipResourceInUseCheck != null ? this.skipResourceInUseCheck.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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

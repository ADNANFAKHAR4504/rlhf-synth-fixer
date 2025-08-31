package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupConfig.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_name BedrockagentAgentActionGroup#action_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_id BedrockagentAgentActionGroup#agent_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAgentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_version BedrockagentAgentActionGroup#agent_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAgentVersion();

    /**
     * action_group_executor block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_executor BedrockagentAgentActionGroup#action_group_executor}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActionGroupExecutor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_state BedrockagentAgentActionGroup#action_group_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getActionGroupState() {
        return null;
    }

    /**
     * api_schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#api_schema BedrockagentAgentActionGroup#api_schema}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApiSchema() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * function_schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#function_schema BedrockagentAgentActionGroup#function_schema}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFunctionSchema() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parent_action_group_signature BedrockagentAgentActionGroup#parent_action_group_signature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParentActionGroupSignature() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipResourceInUseCheck() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#timeouts BedrockagentAgentActionGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupConfig> {
        java.lang.String actionGroupName;
        java.lang.String agentId;
        java.lang.String agentVersion;
        java.lang.Object actionGroupExecutor;
        java.lang.String actionGroupState;
        java.lang.Object apiSchema;
        java.lang.String description;
        java.lang.Object functionSchema;
        java.lang.String parentActionGroupSignature;
        java.lang.Object prepareAgent;
        java.lang.Object skipResourceInUseCheck;
        imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getActionGroupName}
         * @param actionGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_name BedrockagentAgentActionGroup#action_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionGroupName(java.lang.String actionGroupName) {
            this.actionGroupName = actionGroupName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getAgentId}
         * @param agentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_id BedrockagentAgentActionGroup#agent_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentId(java.lang.String agentId) {
            this.agentId = agentId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getAgentVersion}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_version BedrockagentAgentActionGroup#agent_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentVersion(java.lang.String agentVersion) {
            this.agentVersion = agentVersion;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getActionGroupExecutor}
         * @param actionGroupExecutor action_group_executor block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_executor BedrockagentAgentActionGroup#action_group_executor}
         * @return {@code this}
         */
        public Builder actionGroupExecutor(com.hashicorp.cdktf.IResolvable actionGroupExecutor) {
            this.actionGroupExecutor = actionGroupExecutor;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getActionGroupExecutor}
         * @param actionGroupExecutor action_group_executor block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_executor BedrockagentAgentActionGroup#action_group_executor}
         * @return {@code this}
         */
        public Builder actionGroupExecutor(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor> actionGroupExecutor) {
            this.actionGroupExecutor = actionGroupExecutor;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getActionGroupState}
         * @param actionGroupState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_state BedrockagentAgentActionGroup#action_group_state}.
         * @return {@code this}
         */
        public Builder actionGroupState(java.lang.String actionGroupState) {
            this.actionGroupState = actionGroupState;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getApiSchema}
         * @param apiSchema api_schema block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#api_schema BedrockagentAgentActionGroup#api_schema}
         * @return {@code this}
         */
        public Builder apiSchema(com.hashicorp.cdktf.IResolvable apiSchema) {
            this.apiSchema = apiSchema;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getApiSchema}
         * @param apiSchema api_schema block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#api_schema BedrockagentAgentActionGroup#api_schema}
         * @return {@code this}
         */
        public Builder apiSchema(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema> apiSchema) {
            this.apiSchema = apiSchema;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getFunctionSchema}
         * @param functionSchema function_schema block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#function_schema BedrockagentAgentActionGroup#function_schema}
         * @return {@code this}
         */
        public Builder functionSchema(com.hashicorp.cdktf.IResolvable functionSchema) {
            this.functionSchema = functionSchema;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getFunctionSchema}
         * @param functionSchema function_schema block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#function_schema BedrockagentAgentActionGroup#function_schema}
         * @return {@code this}
         */
        public Builder functionSchema(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema> functionSchema) {
            this.functionSchema = functionSchema;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getParentActionGroupSignature}
         * @param parentActionGroupSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parent_action_group_signature BedrockagentAgentActionGroup#parent_action_group_signature}.
         * @return {@code this}
         */
        public Builder parentActionGroupSignature(java.lang.String parentActionGroupSignature) {
            this.parentActionGroupSignature = parentActionGroupSignature;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(java.lang.Boolean prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getSkipResourceInUseCheck}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}.
         * @return {@code this}
         */
        public Builder skipResourceInUseCheck(java.lang.Boolean skipResourceInUseCheck) {
            this.skipResourceInUseCheck = skipResourceInUseCheck;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getSkipResourceInUseCheck}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}.
         * @return {@code this}
         */
        public Builder skipResourceInUseCheck(com.hashicorp.cdktf.IResolvable skipResourceInUseCheck) {
            this.skipResourceInUseCheck = skipResourceInUseCheck;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#timeouts BedrockagentAgentActionGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getDependsOn}
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
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupConfig#getProvisioners}
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
         * @return a new instance of {@link BedrockagentAgentActionGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupConfig {
        private final java.lang.String actionGroupName;
        private final java.lang.String agentId;
        private final java.lang.String agentVersion;
        private final java.lang.Object actionGroupExecutor;
        private final java.lang.String actionGroupState;
        private final java.lang.Object apiSchema;
        private final java.lang.String description;
        private final java.lang.Object functionSchema;
        private final java.lang.String parentActionGroupSignature;
        private final java.lang.Object prepareAgent;
        private final java.lang.Object skipResourceInUseCheck;
        private final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts timeouts;
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
            this.actionGroupName = software.amazon.jsii.Kernel.get(this, "actionGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentId = software.amazon.jsii.Kernel.get(this, "agentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentVersion = software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.actionGroupExecutor = software.amazon.jsii.Kernel.get(this, "actionGroupExecutor", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.actionGroupState = software.amazon.jsii.Kernel.get(this, "actionGroupState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiSchema = software.amazon.jsii.Kernel.get(this, "apiSchema", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.functionSchema = software.amazon.jsii.Kernel.get(this, "functionSchema", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parentActionGroupSignature = software.amazon.jsii.Kernel.get(this, "parentActionGroupSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prepareAgent = software.amazon.jsii.Kernel.get(this, "prepareAgent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.skipResourceInUseCheck = software.amazon.jsii.Kernel.get(this, "skipResourceInUseCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts.class));
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
            this.actionGroupName = java.util.Objects.requireNonNull(builder.actionGroupName, "actionGroupName is required");
            this.agentId = java.util.Objects.requireNonNull(builder.agentId, "agentId is required");
            this.agentVersion = java.util.Objects.requireNonNull(builder.agentVersion, "agentVersion is required");
            this.actionGroupExecutor = builder.actionGroupExecutor;
            this.actionGroupState = builder.actionGroupState;
            this.apiSchema = builder.apiSchema;
            this.description = builder.description;
            this.functionSchema = builder.functionSchema;
            this.parentActionGroupSignature = builder.parentActionGroupSignature;
            this.prepareAgent = builder.prepareAgent;
            this.skipResourceInUseCheck = builder.skipResourceInUseCheck;
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
        public final java.lang.String getActionGroupName() {
            return this.actionGroupName;
        }

        @Override
        public final java.lang.String getAgentId() {
            return this.agentId;
        }

        @Override
        public final java.lang.String getAgentVersion() {
            return this.agentVersion;
        }

        @Override
        public final java.lang.Object getActionGroupExecutor() {
            return this.actionGroupExecutor;
        }

        @Override
        public final java.lang.String getActionGroupState() {
            return this.actionGroupState;
        }

        @Override
        public final java.lang.Object getApiSchema() {
            return this.apiSchema;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getFunctionSchema() {
            return this.functionSchema;
        }

        @Override
        public final java.lang.String getParentActionGroupSignature() {
            return this.parentActionGroupSignature;
        }

        @Override
        public final java.lang.Object getPrepareAgent() {
            return this.prepareAgent;
        }

        @Override
        public final java.lang.Object getSkipResourceInUseCheck() {
            return this.skipResourceInUseCheck;
        }

        @Override
        public final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts getTimeouts() {
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

            data.set("actionGroupName", om.valueToTree(this.getActionGroupName()));
            data.set("agentId", om.valueToTree(this.getAgentId()));
            data.set("agentVersion", om.valueToTree(this.getAgentVersion()));
            if (this.getActionGroupExecutor() != null) {
                data.set("actionGroupExecutor", om.valueToTree(this.getActionGroupExecutor()));
            }
            if (this.getActionGroupState() != null) {
                data.set("actionGroupState", om.valueToTree(this.getActionGroupState()));
            }
            if (this.getApiSchema() != null) {
                data.set("apiSchema", om.valueToTree(this.getApiSchema()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFunctionSchema() != null) {
                data.set("functionSchema", om.valueToTree(this.getFunctionSchema()));
            }
            if (this.getParentActionGroupSignature() != null) {
                data.set("parentActionGroupSignature", om.valueToTree(this.getParentActionGroupSignature()));
            }
            if (this.getPrepareAgent() != null) {
                data.set("prepareAgent", om.valueToTree(this.getPrepareAgent()));
            }
            if (this.getSkipResourceInUseCheck() != null) {
                data.set("skipResourceInUseCheck", om.valueToTree(this.getSkipResourceInUseCheck()));
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
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupConfig.Jsii$Proxy that = (BedrockagentAgentActionGroupConfig.Jsii$Proxy) o;

            if (!actionGroupName.equals(that.actionGroupName)) return false;
            if (!agentId.equals(that.agentId)) return false;
            if (!agentVersion.equals(that.agentVersion)) return false;
            if (this.actionGroupExecutor != null ? !this.actionGroupExecutor.equals(that.actionGroupExecutor) : that.actionGroupExecutor != null) return false;
            if (this.actionGroupState != null ? !this.actionGroupState.equals(that.actionGroupState) : that.actionGroupState != null) return false;
            if (this.apiSchema != null ? !this.apiSchema.equals(that.apiSchema) : that.apiSchema != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.functionSchema != null ? !this.functionSchema.equals(that.functionSchema) : that.functionSchema != null) return false;
            if (this.parentActionGroupSignature != null ? !this.parentActionGroupSignature.equals(that.parentActionGroupSignature) : that.parentActionGroupSignature != null) return false;
            if (this.prepareAgent != null ? !this.prepareAgent.equals(that.prepareAgent) : that.prepareAgent != null) return false;
            if (this.skipResourceInUseCheck != null ? !this.skipResourceInUseCheck.equals(that.skipResourceInUseCheck) : that.skipResourceInUseCheck != null) return false;
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
            int result = this.actionGroupName.hashCode();
            result = 31 * result + (this.agentId.hashCode());
            result = 31 * result + (this.agentVersion.hashCode());
            result = 31 * result + (this.actionGroupExecutor != null ? this.actionGroupExecutor.hashCode() : 0);
            result = 31 * result + (this.actionGroupState != null ? this.actionGroupState.hashCode() : 0);
            result = 31 * result + (this.apiSchema != null ? this.apiSchema.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.functionSchema != null ? this.functionSchema.hashCode() : 0);
            result = 31 * result + (this.parentActionGroupSignature != null ? this.parentActionGroupSignature.hashCode() : 0);
            result = 31 * result + (this.prepareAgent != null ? this.prepareAgent.hashCode() : 0);
            result = 31 * result + (this.skipResourceInUseCheck != null ? this.skipResourceInUseCheck.hashCode() : 0);
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

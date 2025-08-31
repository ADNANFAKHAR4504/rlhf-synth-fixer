package imports.aws.bedrockagent_agent_collaborator;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator aws_bedrockagent_agent_collaborator}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.157Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentCollaborator.BedrockagentAgentCollaborator")
public class BedrockagentAgentCollaborator extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockagentAgentCollaborator(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentCollaborator(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator aws_bedrockagent_agent_collaborator} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockagentAgentCollaborator(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentCollaborator resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentCollaborator to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentCollaborator that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockagentAgentCollaborator to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentCollaborator resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentCollaborator to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentCollaborator that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAgentDescriptor(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAgentDescriptor", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAgentDescriptor() {
        software.amazon.jsii.Kernel.call(this, "resetAgentDescriptor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAgentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAgentVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrepareAgent() {
        software.amazon.jsii.Kernel.call(this, "resetPrepareAgent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelayConversationHistory() {
        software.amazon.jsii.Kernel.call(this, "resetRelayConversationHistory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptorList getAgentDescriptor() {
        return software.amazon.jsii.Kernel.get(this, "agentDescriptor", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptorList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollaboratorId() {
        return software.amazon.jsii.Kernel.get(this, "collaboratorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAgentDescriptorInput() {
        return software.amazon.jsii.Kernel.get(this, "agentDescriptorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "agentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "agentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollaborationInstructionInput() {
        return software.amazon.jsii.Kernel.get(this, "collaborationInstructionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollaboratorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "collaboratorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgentInput() {
        return software.amazon.jsii.Kernel.get(this, "prepareAgentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRelayConversationHistoryInput() {
        return software.amazon.jsii.Kernel.get(this, "relayConversationHistoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentId() {
        return software.amazon.jsii.Kernel.get(this, "agentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentId", java.util.Objects.requireNonNull(value, "agentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentVersion() {
        return software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentVersion", java.util.Objects.requireNonNull(value, "agentVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollaborationInstruction() {
        return software.amazon.jsii.Kernel.get(this, "collaborationInstruction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollaborationInstruction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collaborationInstruction", java.util.Objects.requireNonNull(value, "collaborationInstruction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollaboratorName() {
        return software.amazon.jsii.Kernel.get(this, "collaboratorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollaboratorName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collaboratorName", java.util.Objects.requireNonNull(value, "collaboratorName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrepareAgent() {
        return software.amazon.jsii.Kernel.get(this, "prepareAgent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrepareAgent(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "prepareAgent", java.util.Objects.requireNonNull(value, "prepareAgent is required"));
    }

    public void setPrepareAgent(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "prepareAgent", java.util.Objects.requireNonNull(value, "prepareAgent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRelayConversationHistory() {
        return software.amazon.jsii.Kernel.get(this, "relayConversationHistory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRelayConversationHistory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "relayConversationHistory", java.util.Objects.requireNonNull(value, "relayConversationHistory is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator> {
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
        private final imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_id BedrockagentAgentCollaborator#agent_id}.
         * <p>
         * @return {@code this}
         * @param agentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_id BedrockagentAgentCollaborator#agent_id}. This parameter is required.
         */
        public Builder agentId(final java.lang.String agentId) {
            this.config.agentId(agentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaboration_instruction BedrockagentAgentCollaborator#collaboration_instruction}.
         * <p>
         * @return {@code this}
         * @param collaborationInstruction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaboration_instruction BedrockagentAgentCollaborator#collaboration_instruction}. This parameter is required.
         */
        public Builder collaborationInstruction(final java.lang.String collaborationInstruction) {
            this.config.collaborationInstruction(collaborationInstruction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaborator_name BedrockagentAgentCollaborator#collaborator_name}.
         * <p>
         * @return {@code this}
         * @param collaboratorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaborator_name BedrockagentAgentCollaborator#collaborator_name}. This parameter is required.
         */
        public Builder collaboratorName(final java.lang.String collaboratorName) {
            this.config.collaboratorName(collaboratorName);
            return this;
        }

        /**
         * agent_descriptor block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_descriptor BedrockagentAgentCollaborator#agent_descriptor}
         * <p>
         * @return {@code this}
         * @param agentDescriptor agent_descriptor block. This parameter is required.
         */
        public Builder agentDescriptor(final com.hashicorp.cdktf.IResolvable agentDescriptor) {
            this.config.agentDescriptor(agentDescriptor);
            return this;
        }
        /**
         * agent_descriptor block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_descriptor BedrockagentAgentCollaborator#agent_descriptor}
         * <p>
         * @return {@code this}
         * @param agentDescriptor agent_descriptor block. This parameter is required.
         */
        public Builder agentDescriptor(final java.util.List<? extends imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor> agentDescriptor) {
            this.config.agentDescriptor(agentDescriptor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_version BedrockagentAgentCollaborator#agent_version}.
         * <p>
         * @return {@code this}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_version BedrockagentAgentCollaborator#agent_version}. This parameter is required.
         */
        public Builder agentVersion(final java.lang.String agentVersion) {
            this.config.agentVersion(agentVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final java.lang.Boolean prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#relay_conversation_history BedrockagentAgentCollaborator#relay_conversation_history}.
         * <p>
         * @return {@code this}
         * @param relayConversationHistory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#relay_conversation_history BedrockagentAgentCollaborator#relay_conversation_history}. This parameter is required.
         */
        public Builder relayConversationHistory(final java.lang.String relayConversationHistory) {
            this.config.relayConversationHistory(relayConversationHistory);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#timeouts BedrockagentAgentCollaborator#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator}.
         */
        @Override
        public imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator build() {
            return new imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaborator(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

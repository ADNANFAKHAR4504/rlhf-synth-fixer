package imports.aws.bedrockagent_agent_collaborator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.157Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentCollaborator.BedrockagentAgentCollaboratorConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentCollaboratorConfig.Jsii$Proxy.class)
public interface BedrockagentAgentCollaboratorConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_id BedrockagentAgentCollaborator#agent_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAgentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaboration_instruction BedrockagentAgentCollaborator#collaboration_instruction}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCollaborationInstruction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaborator_name BedrockagentAgentCollaborator#collaborator_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCollaboratorName();

    /**
     * agent_descriptor block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_descriptor BedrockagentAgentCollaborator#agent_descriptor}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAgentDescriptor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_version BedrockagentAgentCollaborator#agent_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAgentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#relay_conversation_history BedrockagentAgentCollaborator#relay_conversation_history}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRelayConversationHistory() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#timeouts BedrockagentAgentCollaborator#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentCollaboratorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentCollaboratorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentCollaboratorConfig> {
        java.lang.String agentId;
        java.lang.String collaborationInstruction;
        java.lang.String collaboratorName;
        java.lang.Object agentDescriptor;
        java.lang.String agentVersion;
        java.lang.Object prepareAgent;
        java.lang.String relayConversationHistory;
        imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getAgentId}
         * @param agentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_id BedrockagentAgentCollaborator#agent_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentId(java.lang.String agentId) {
            this.agentId = agentId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getCollaborationInstruction}
         * @param collaborationInstruction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaboration_instruction BedrockagentAgentCollaborator#collaboration_instruction}. This parameter is required.
         * @return {@code this}
         */
        public Builder collaborationInstruction(java.lang.String collaborationInstruction) {
            this.collaborationInstruction = collaborationInstruction;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getCollaboratorName}
         * @param collaboratorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#collaborator_name BedrockagentAgentCollaborator#collaborator_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder collaboratorName(java.lang.String collaboratorName) {
            this.collaboratorName = collaboratorName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getAgentDescriptor}
         * @param agentDescriptor agent_descriptor block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_descriptor BedrockagentAgentCollaborator#agent_descriptor}
         * @return {@code this}
         */
        public Builder agentDescriptor(com.hashicorp.cdktf.IResolvable agentDescriptor) {
            this.agentDescriptor = agentDescriptor;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getAgentDescriptor}
         * @param agentDescriptor agent_descriptor block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_descriptor BedrockagentAgentCollaborator#agent_descriptor}
         * @return {@code this}
         */
        public Builder agentDescriptor(java.util.List<? extends imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorAgentDescriptor> agentDescriptor) {
            this.agentDescriptor = agentDescriptor;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getAgentVersion}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#agent_version BedrockagentAgentCollaborator#agent_version}.
         * @return {@code this}
         */
        public Builder agentVersion(java.lang.String agentVersion) {
            this.agentVersion = agentVersion;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(java.lang.Boolean prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getPrepareAgent}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#prepare_agent BedrockagentAgentCollaborator#prepare_agent}.
         * @return {@code this}
         */
        public Builder prepareAgent(com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.prepareAgent = prepareAgent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getRelayConversationHistory}
         * @param relayConversationHistory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#relay_conversation_history BedrockagentAgentCollaborator#relay_conversation_history}.
         * @return {@code this}
         */
        public Builder relayConversationHistory(java.lang.String relayConversationHistory) {
            this.relayConversationHistory = relayConversationHistory;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#timeouts BedrockagentAgentCollaborator#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getDependsOn}
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
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorConfig#getProvisioners}
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
         * @return a new instance of {@link BedrockagentAgentCollaboratorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentCollaboratorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentCollaboratorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentCollaboratorConfig {
        private final java.lang.String agentId;
        private final java.lang.String collaborationInstruction;
        private final java.lang.String collaboratorName;
        private final java.lang.Object agentDescriptor;
        private final java.lang.String agentVersion;
        private final java.lang.Object prepareAgent;
        private final java.lang.String relayConversationHistory;
        private final imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts timeouts;
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
            this.agentId = software.amazon.jsii.Kernel.get(this, "agentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.collaborationInstruction = software.amazon.jsii.Kernel.get(this, "collaborationInstruction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.collaboratorName = software.amazon.jsii.Kernel.get(this, "collaboratorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentDescriptor = software.amazon.jsii.Kernel.get(this, "agentDescriptor", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.agentVersion = software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prepareAgent = software.amazon.jsii.Kernel.get(this, "prepareAgent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.relayConversationHistory = software.amazon.jsii.Kernel.get(this, "relayConversationHistory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts.class));
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
            this.agentId = java.util.Objects.requireNonNull(builder.agentId, "agentId is required");
            this.collaborationInstruction = java.util.Objects.requireNonNull(builder.collaborationInstruction, "collaborationInstruction is required");
            this.collaboratorName = java.util.Objects.requireNonNull(builder.collaboratorName, "collaboratorName is required");
            this.agentDescriptor = builder.agentDescriptor;
            this.agentVersion = builder.agentVersion;
            this.prepareAgent = builder.prepareAgent;
            this.relayConversationHistory = builder.relayConversationHistory;
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
        public final java.lang.String getAgentId() {
            return this.agentId;
        }

        @Override
        public final java.lang.String getCollaborationInstruction() {
            return this.collaborationInstruction;
        }

        @Override
        public final java.lang.String getCollaboratorName() {
            return this.collaboratorName;
        }

        @Override
        public final java.lang.Object getAgentDescriptor() {
            return this.agentDescriptor;
        }

        @Override
        public final java.lang.String getAgentVersion() {
            return this.agentVersion;
        }

        @Override
        public final java.lang.Object getPrepareAgent() {
            return this.prepareAgent;
        }

        @Override
        public final java.lang.String getRelayConversationHistory() {
            return this.relayConversationHistory;
        }

        @Override
        public final imports.aws.bedrockagent_agent_collaborator.BedrockagentAgentCollaboratorTimeouts getTimeouts() {
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

            data.set("agentId", om.valueToTree(this.getAgentId()));
            data.set("collaborationInstruction", om.valueToTree(this.getCollaborationInstruction()));
            data.set("collaboratorName", om.valueToTree(this.getCollaboratorName()));
            if (this.getAgentDescriptor() != null) {
                data.set("agentDescriptor", om.valueToTree(this.getAgentDescriptor()));
            }
            if (this.getAgentVersion() != null) {
                data.set("agentVersion", om.valueToTree(this.getAgentVersion()));
            }
            if (this.getPrepareAgent() != null) {
                data.set("prepareAgent", om.valueToTree(this.getPrepareAgent()));
            }
            if (this.getRelayConversationHistory() != null) {
                data.set("relayConversationHistory", om.valueToTree(this.getRelayConversationHistory()));
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
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentCollaborator.BedrockagentAgentCollaboratorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentCollaboratorConfig.Jsii$Proxy that = (BedrockagentAgentCollaboratorConfig.Jsii$Proxy) o;

            if (!agentId.equals(that.agentId)) return false;
            if (!collaborationInstruction.equals(that.collaborationInstruction)) return false;
            if (!collaboratorName.equals(that.collaboratorName)) return false;
            if (this.agentDescriptor != null ? !this.agentDescriptor.equals(that.agentDescriptor) : that.agentDescriptor != null) return false;
            if (this.agentVersion != null ? !this.agentVersion.equals(that.agentVersion) : that.agentVersion != null) return false;
            if (this.prepareAgent != null ? !this.prepareAgent.equals(that.prepareAgent) : that.prepareAgent != null) return false;
            if (this.relayConversationHistory != null ? !this.relayConversationHistory.equals(that.relayConversationHistory) : that.relayConversationHistory != null) return false;
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
            int result = this.agentId.hashCode();
            result = 31 * result + (this.collaborationInstruction.hashCode());
            result = 31 * result + (this.collaboratorName.hashCode());
            result = 31 * result + (this.agentDescriptor != null ? this.agentDescriptor.hashCode() : 0);
            result = 31 * result + (this.agentVersion != null ? this.agentVersion.hashCode() : 0);
            result = 31 * result + (this.prepareAgent != null ? this.prepareAgent.hashCode() : 0);
            result = 31 * result + (this.relayConversationHistory != null ? this.relayConversationHistory.hashCode() : 0);
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

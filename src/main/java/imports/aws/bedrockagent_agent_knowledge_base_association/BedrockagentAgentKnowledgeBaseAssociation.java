package imports.aws.bedrockagent_agent_knowledge_base_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association aws_bedrockagent_agent_knowledge_base_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentKnowledgeBaseAssociation.BedrockagentAgentKnowledgeBaseAssociation")
public class BedrockagentAgentKnowledgeBaseAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockagentAgentKnowledgeBaseAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentKnowledgeBaseAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association aws_bedrockagent_agent_knowledge_base_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockagentAgentKnowledgeBaseAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentKnowledgeBaseAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentKnowledgeBaseAssociation to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentKnowledgeBaseAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockagentAgentKnowledgeBaseAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentKnowledgeBaseAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentKnowledgeBaseAssociation to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentKnowledgeBaseAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAgentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAgentVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "agentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "agentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKnowledgeBaseIdInput() {
        return software.amazon.jsii.Kernel.get(this, "knowledgeBaseIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKnowledgeBaseStateInput() {
        return software.amazon.jsii.Kernel.get(this, "knowledgeBaseStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKnowledgeBaseId() {
        return software.amazon.jsii.Kernel.get(this, "knowledgeBaseId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKnowledgeBaseId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "knowledgeBaseId", java.util.Objects.requireNonNull(value, "knowledgeBaseId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKnowledgeBaseState() {
        return software.amazon.jsii.Kernel.get(this, "knowledgeBaseState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKnowledgeBaseState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "knowledgeBaseState", java.util.Objects.requireNonNull(value, "knowledgeBaseState is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation> {
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
        private final imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#agent_id BedrockagentAgentKnowledgeBaseAssociation#agent_id}.
         * <p>
         * @return {@code this}
         * @param agentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#agent_id BedrockagentAgentKnowledgeBaseAssociation#agent_id}. This parameter is required.
         */
        public Builder agentId(final java.lang.String agentId) {
            this.config.agentId(agentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#description BedrockagentAgentKnowledgeBaseAssociation#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#description BedrockagentAgentKnowledgeBaseAssociation#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#knowledge_base_id BedrockagentAgentKnowledgeBaseAssociation#knowledge_base_id}.
         * <p>
         * @return {@code this}
         * @param knowledgeBaseId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#knowledge_base_id BedrockagentAgentKnowledgeBaseAssociation#knowledge_base_id}. This parameter is required.
         */
        public Builder knowledgeBaseId(final java.lang.String knowledgeBaseId) {
            this.config.knowledgeBaseId(knowledgeBaseId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#knowledge_base_state BedrockagentAgentKnowledgeBaseAssociation#knowledge_base_state}.
         * <p>
         * @return {@code this}
         * @param knowledgeBaseState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#knowledge_base_state BedrockagentAgentKnowledgeBaseAssociation#knowledge_base_state}. This parameter is required.
         */
        public Builder knowledgeBaseState(final java.lang.String knowledgeBaseState) {
            this.config.knowledgeBaseState(knowledgeBaseState);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#agent_version BedrockagentAgentKnowledgeBaseAssociation#agent_version}.
         * <p>
         * @return {@code this}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#agent_version BedrockagentAgentKnowledgeBaseAssociation#agent_version}. This parameter is required.
         */
        public Builder agentVersion(final java.lang.String agentVersion) {
            this.config.agentVersion(agentVersion);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_knowledge_base_association#timeouts BedrockagentAgentKnowledgeBaseAssociation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation}.
         */
        @Override
        public imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation build() {
            return new imports.aws.bedrockagent_agent_knowledge_base_association.BedrockagentAgentKnowledgeBaseAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

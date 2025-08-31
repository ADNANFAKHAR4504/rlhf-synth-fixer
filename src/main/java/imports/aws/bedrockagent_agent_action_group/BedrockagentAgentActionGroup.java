package imports.aws.bedrockagent_agent_action_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group aws_bedrockagent_agent_action_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroup")
public class BedrockagentAgentActionGroup extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockagentAgentActionGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentActionGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group aws_bedrockagent_agent_action_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockagentAgentActionGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentActionGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentActionGroup to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentActionGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockagentAgentActionGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgentActionGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgentActionGroup to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgentActionGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putActionGroupExecutor(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putActionGroupExecutor", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putApiSchema(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putApiSchema", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFunctionSchema(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFunctionSchema", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActionGroupExecutor() {
        software.amazon.jsii.Kernel.call(this, "resetActionGroupExecutor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetActionGroupState() {
        software.amazon.jsii.Kernel.call(this, "resetActionGroupState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApiSchema() {
        software.amazon.jsii.Kernel.call(this, "resetApiSchema", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFunctionSchema() {
        software.amazon.jsii.Kernel.call(this, "resetFunctionSchema", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParentActionGroupSignature() {
        software.amazon.jsii.Kernel.call(this, "resetParentActionGroupSignature", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrepareAgent() {
        software.amazon.jsii.Kernel.call(this, "resetPrepareAgent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipResourceInUseCheck() {
        software.amazon.jsii.Kernel.call(this, "resetSkipResourceInUseCheck", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutorList getActionGroupExecutor() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupExecutor", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutorList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionGroupId() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchemaList getApiSchema() {
        return software.amazon.jsii.Kernel.get(this, "apiSchema", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchemaList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchemaList getFunctionSchema() {
        return software.amazon.jsii.Kernel.get(this, "functionSchema", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchemaList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActionGroupExecutorInput() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupExecutorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionGroupStateInput() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "agentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "agentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApiSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "apiSchemaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFunctionSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "functionSchemaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParentActionGroupSignatureInput() {
        return software.amazon.jsii.Kernel.get(this, "parentActionGroupSignatureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgentInput() {
        return software.amazon.jsii.Kernel.get(this, "prepareAgentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipResourceInUseCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "skipResourceInUseCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionGroupName() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActionGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "actionGroupName", java.util.Objects.requireNonNull(value, "actionGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionGroupState() {
        return software.amazon.jsii.Kernel.get(this, "actionGroupState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActionGroupState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "actionGroupState", java.util.Objects.requireNonNull(value, "actionGroupState is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getParentActionGroupSignature() {
        return software.amazon.jsii.Kernel.get(this, "parentActionGroupSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParentActionGroupSignature(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parentActionGroupSignature", java.util.Objects.requireNonNull(value, "parentActionGroupSignature is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipResourceInUseCheck() {
        return software.amazon.jsii.Kernel.get(this, "skipResourceInUseCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipResourceInUseCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipResourceInUseCheck", java.util.Objects.requireNonNull(value, "skipResourceInUseCheck is required"));
    }

    public void setSkipResourceInUseCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipResourceInUseCheck", java.util.Objects.requireNonNull(value, "skipResourceInUseCheck is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup> {
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
        private final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_name BedrockagentAgentActionGroup#action_group_name}.
         * <p>
         * @return {@code this}
         * @param actionGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_name BedrockagentAgentActionGroup#action_group_name}. This parameter is required.
         */
        public Builder actionGroupName(final java.lang.String actionGroupName) {
            this.config.actionGroupName(actionGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_id BedrockagentAgentActionGroup#agent_id}.
         * <p>
         * @return {@code this}
         * @param agentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_id BedrockagentAgentActionGroup#agent_id}. This parameter is required.
         */
        public Builder agentId(final java.lang.String agentId) {
            this.config.agentId(agentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_version BedrockagentAgentActionGroup#agent_version}.
         * <p>
         * @return {@code this}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#agent_version BedrockagentAgentActionGroup#agent_version}. This parameter is required.
         */
        public Builder agentVersion(final java.lang.String agentVersion) {
            this.config.agentVersion(agentVersion);
            return this;
        }

        /**
         * action_group_executor block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_executor BedrockagentAgentActionGroup#action_group_executor}
         * <p>
         * @return {@code this}
         * @param actionGroupExecutor action_group_executor block. This parameter is required.
         */
        public Builder actionGroupExecutor(final com.hashicorp.cdktf.IResolvable actionGroupExecutor) {
            this.config.actionGroupExecutor(actionGroupExecutor);
            return this;
        }
        /**
         * action_group_executor block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_executor BedrockagentAgentActionGroup#action_group_executor}
         * <p>
         * @return {@code this}
         * @param actionGroupExecutor action_group_executor block. This parameter is required.
         */
        public Builder actionGroupExecutor(final java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor> actionGroupExecutor) {
            this.config.actionGroupExecutor(actionGroupExecutor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_state BedrockagentAgentActionGroup#action_group_state}.
         * <p>
         * @return {@code this}
         * @param actionGroupState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#action_group_state BedrockagentAgentActionGroup#action_group_state}. This parameter is required.
         */
        public Builder actionGroupState(final java.lang.String actionGroupState) {
            this.config.actionGroupState(actionGroupState);
            return this;
        }

        /**
         * api_schema block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#api_schema BedrockagentAgentActionGroup#api_schema}
         * <p>
         * @return {@code this}
         * @param apiSchema api_schema block. This parameter is required.
         */
        public Builder apiSchema(final com.hashicorp.cdktf.IResolvable apiSchema) {
            this.config.apiSchema(apiSchema);
            return this;
        }
        /**
         * api_schema block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#api_schema BedrockagentAgentActionGroup#api_schema}
         * <p>
         * @return {@code this}
         * @param apiSchema api_schema block. This parameter is required.
         */
        public Builder apiSchema(final java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchema> apiSchema) {
            this.config.apiSchema(apiSchema);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * function_schema block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#function_schema BedrockagentAgentActionGroup#function_schema}
         * <p>
         * @return {@code this}
         * @param functionSchema function_schema block. This parameter is required.
         */
        public Builder functionSchema(final com.hashicorp.cdktf.IResolvable functionSchema) {
            this.config.functionSchema(functionSchema);
            return this;
        }
        /**
         * function_schema block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#function_schema BedrockagentAgentActionGroup#function_schema}
         * <p>
         * @return {@code this}
         * @param functionSchema function_schema block. This parameter is required.
         */
        public Builder functionSchema(final java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchema> functionSchema) {
            this.config.functionSchema(functionSchema);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parent_action_group_signature BedrockagentAgentActionGroup#parent_action_group_signature}.
         * <p>
         * @return {@code this}
         * @param parentActionGroupSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parent_action_group_signature BedrockagentAgentActionGroup#parent_action_group_signature}. This parameter is required.
         */
        public Builder parentActionGroupSignature(final java.lang.String parentActionGroupSignature) {
            this.config.parentActionGroupSignature(parentActionGroupSignature);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final java.lang.Boolean prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#prepare_agent BedrockagentAgentActionGroup#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}.
         * <p>
         * @return {@code this}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}. This parameter is required.
         */
        public Builder skipResourceInUseCheck(final java.lang.Boolean skipResourceInUseCheck) {
            this.config.skipResourceInUseCheck(skipResourceInUseCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}.
         * <p>
         * @return {@code this}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#skip_resource_in_use_check BedrockagentAgentActionGroup#skip_resource_in_use_check}. This parameter is required.
         */
        public Builder skipResourceInUseCheck(final com.hashicorp.cdktf.IResolvable skipResourceInUseCheck) {
            this.config.skipResourceInUseCheck(skipResourceInUseCheck);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#timeouts BedrockagentAgentActionGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup}.
         */
        @Override
        public imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup build() {
            return new imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

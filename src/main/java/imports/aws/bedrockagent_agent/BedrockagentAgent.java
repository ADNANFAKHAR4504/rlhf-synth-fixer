package imports.aws.bedrockagent_agent;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent aws_bedrockagent_agent}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.150Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgent")
public class BedrockagentAgent extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockagentAgent(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgent(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrockagent_agent.BedrockagentAgent.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent aws_bedrockagent_agent} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockagentAgent(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgent resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgent to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgent that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockagentAgent to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent.BedrockagentAgent.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockagentAgent resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockagentAgent to import. This parameter is required.
     * @param importFromId The id of the existing BedrockagentAgent that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrockagent_agent.BedrockagentAgent.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putGuardrailConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGuardrailConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMemoryConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMemoryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPromptOverrideConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPromptOverrideConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAgentCollaboration() {
        software.amazon.jsii.Kernel.call(this, "resetAgentCollaboration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerEncryptionKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerEncryptionKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuardrailConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetGuardrailConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdleSessionTtlInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetIdleSessionTtlInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstruction() {
        software.amazon.jsii.Kernel.call(this, "resetInstruction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrepareAgent() {
        software.amazon.jsii.Kernel.call(this, "resetPrepareAgent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptOverrideConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetPromptOverrideConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipResourceInUseCheck() {
        software.amazon.jsii.Kernel.call(this, "resetSkipResourceInUseCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentArn() {
        return software.amazon.jsii.Kernel.get(this, "agentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentId() {
        return software.amazon.jsii.Kernel.get(this, "agentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentVersion() {
        return software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfigurationList getGuardrailConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "guardrailConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfigurationList getMemoryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "memoryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreparedAt() {
        return software.amazon.jsii.Kernel.get(this, "preparedAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationList getPromptOverrideConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "promptOverrideConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentCollaborationInput() {
        return software.amazon.jsii.Kernel.get(this, "agentCollaborationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "agentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentResourceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "agentResourceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerEncryptionKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "customerEncryptionKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFoundationModelInput() {
        return software.amazon.jsii.Kernel.get(this, "foundationModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGuardrailConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "guardrailConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleSessionTtlInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "idleSessionTtlInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstructionInput() {
        return software.amazon.jsii.Kernel.get(this, "instructionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMemoryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrepareAgentInput() {
        return software.amazon.jsii.Kernel.get(this, "prepareAgentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPromptOverrideConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "promptOverrideConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipResourceInUseCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "skipResourceInUseCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentCollaboration() {
        return software.amazon.jsii.Kernel.get(this, "agentCollaboration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentCollaboration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentCollaboration", java.util.Objects.requireNonNull(value, "agentCollaboration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentName() {
        return software.amazon.jsii.Kernel.get(this, "agentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentName", java.util.Objects.requireNonNull(value, "agentName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentResourceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "agentResourceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentResourceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentResourceRoleArn", java.util.Objects.requireNonNull(value, "agentResourceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerEncryptionKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "customerEncryptionKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerEncryptionKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerEncryptionKeyArn", java.util.Objects.requireNonNull(value, "customerEncryptionKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFoundationModel() {
        return software.amazon.jsii.Kernel.get(this, "foundationModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFoundationModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "foundationModel", java.util.Objects.requireNonNull(value, "foundationModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleSessionTtlInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "idleSessionTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleSessionTtlInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleSessionTtlInSeconds", java.util.Objects.requireNonNull(value, "idleSessionTtlInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstruction() {
        return software.amazon.jsii.Kernel.get(this, "instruction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstruction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instruction", java.util.Objects.requireNonNull(value, "instruction is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrockagent_agent.BedrockagentAgent}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrockagent_agent.BedrockagentAgent> {
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
        private final imports.aws.bedrockagent_agent.BedrockagentAgentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrockagent_agent.BedrockagentAgentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}.
         * <p>
         * @return {@code this}
         * @param agentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}. This parameter is required.
         */
        public Builder agentName(final java.lang.String agentName) {
            this.config.agentName(agentName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}.
         * <p>
         * @return {@code this}
         * @param agentResourceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}. This parameter is required.
         */
        public Builder agentResourceRoleArn(final java.lang.String agentResourceRoleArn) {
            this.config.agentResourceRoleArn(agentResourceRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}.
         * <p>
         * @return {@code this}
         * @param foundationModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}. This parameter is required.
         */
        public Builder foundationModel(final java.lang.String foundationModel) {
            this.config.foundationModel(foundationModel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.
         * <p>
         * @return {@code this}
         * @param agentCollaboration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}. This parameter is required.
         */
        public Builder agentCollaboration(final java.lang.String agentCollaboration) {
            this.config.agentCollaboration(agentCollaboration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.
         * <p>
         * @return {@code this}
         * @param customerEncryptionKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}. This parameter is required.
         */
        public Builder customerEncryptionKeyArn(final java.lang.String customerEncryptionKeyArn) {
            this.config.customerEncryptionKeyArn(customerEncryptionKeyArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
         * <p>
         * @return {@code this}
         * @param guardrailConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}. This parameter is required.
         */
        public Builder guardrailConfiguration(final com.hashicorp.cdktf.IResolvable guardrailConfiguration) {
            this.config.guardrailConfiguration(guardrailConfiguration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
         * <p>
         * @return {@code this}
         * @param guardrailConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}. This parameter is required.
         */
        public Builder guardrailConfiguration(final java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration> guardrailConfiguration) {
            this.config.guardrailConfiguration(guardrailConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.
         * <p>
         * @return {@code this}
         * @param idleSessionTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}. This parameter is required.
         */
        public Builder idleSessionTtlInSeconds(final java.lang.Number idleSessionTtlInSeconds) {
            this.config.idleSessionTtlInSeconds(idleSessionTtlInSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.
         * <p>
         * @return {@code this}
         * @param instruction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}. This parameter is required.
         */
        public Builder instruction(final java.lang.String instruction) {
            this.config.instruction(instruction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
         * <p>
         * @return {@code this}
         * @param memoryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}. This parameter is required.
         */
        public Builder memoryConfiguration(final com.hashicorp.cdktf.IResolvable memoryConfiguration) {
            this.config.memoryConfiguration(memoryConfiguration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
         * <p>
         * @return {@code this}
         * @param memoryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}. This parameter is required.
         */
        public Builder memoryConfiguration(final java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentMemoryConfiguration> memoryConfiguration) {
            this.config.memoryConfiguration(memoryConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final java.lang.Boolean prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
         * <p>
         * @return {@code this}
         * @param prepareAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}. This parameter is required.
         */
        public Builder prepareAgent(final com.hashicorp.cdktf.IResolvable prepareAgent) {
            this.config.prepareAgent(prepareAgent);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
         * <p>
         * @return {@code this}
         * @param promptOverrideConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}. This parameter is required.
         */
        public Builder promptOverrideConfiguration(final com.hashicorp.cdktf.IResolvable promptOverrideConfiguration) {
            this.config.promptOverrideConfiguration(promptOverrideConfiguration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
         * <p>
         * @return {@code this}
         * @param promptOverrideConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}. This parameter is required.
         */
        public Builder promptOverrideConfiguration(final java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration> promptOverrideConfiguration) {
            this.config.promptOverrideConfiguration(promptOverrideConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
         * <p>
         * @return {@code this}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}. This parameter is required.
         */
        public Builder skipResourceInUseCheck(final java.lang.Boolean skipResourceInUseCheck) {
            this.config.skipResourceInUseCheck(skipResourceInUseCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
         * <p>
         * @return {@code this}
         * @param skipResourceInUseCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}. This parameter is required.
         */
        public Builder skipResourceInUseCheck(final com.hashicorp.cdktf.IResolvable skipResourceInUseCheck) {
            this.config.skipResourceInUseCheck(skipResourceInUseCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrockagent_agent.BedrockagentAgentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrockagent_agent.BedrockagentAgent}.
         */
        @Override
        public imports.aws.bedrockagent_agent.BedrockagentAgent build() {
            return new imports.aws.bedrockagent_agent.BedrockagentAgent(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

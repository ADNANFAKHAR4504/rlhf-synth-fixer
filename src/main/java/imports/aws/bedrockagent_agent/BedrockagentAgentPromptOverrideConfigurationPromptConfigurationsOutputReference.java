package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference")
public class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putInferenceConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInferenceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBasePromptTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetBasePromptTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParserMode() {
        software.amazon.jsii.Kernel.call(this, "resetParserMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptCreationMode() {
        software.amazon.jsii.Kernel.call(this, "resetPromptCreationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptState() {
        software.amazon.jsii.Kernel.call(this, "resetPromptState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptType() {
        software.amazon.jsii.Kernel.call(this, "resetPromptType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList getInferenceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "inferenceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasePromptTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "basePromptTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInferenceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParserModeInput() {
        return software.amazon.jsii.Kernel.get(this, "parserModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPromptCreationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "promptCreationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPromptStateInput() {
        return software.amazon.jsii.Kernel.get(this, "promptStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPromptTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "promptTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBasePromptTemplate() {
        return software.amazon.jsii.Kernel.get(this, "basePromptTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBasePromptTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "basePromptTemplate", java.util.Objects.requireNonNull(value, "basePromptTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParserMode() {
        return software.amazon.jsii.Kernel.get(this, "parserMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParserMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parserMode", java.util.Objects.requireNonNull(value, "parserMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPromptCreationMode() {
        return software.amazon.jsii.Kernel.get(this, "promptCreationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPromptCreationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "promptCreationMode", java.util.Objects.requireNonNull(value, "promptCreationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPromptState() {
        return software.amazon.jsii.Kernel.get(this, "promptState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPromptState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "promptState", java.util.Objects.requireNonNull(value, "promptState is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPromptType() {
        return software.amazon.jsii.Kernel.get(this, "promptType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPromptType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "promptType", java.util.Objects.requireNonNull(value, "promptType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

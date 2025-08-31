package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationOutputReference")
public class BedrockagentAgentPromptOverrideConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentAgentPromptOverrideConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentPromptOverrideConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentAgentPromptOverrideConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putPromptConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPromptConfigurations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOverrideLambda() {
        software.amazon.jsii.Kernel.call(this, "resetOverrideLambda", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetPromptConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList getPromptConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "promptConfigurations", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOverrideLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideLambdaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPromptConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "promptConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOverrideLambda() {
        return software.amazon.jsii.Kernel.get(this, "overrideLambda", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOverrideLambda(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "overrideLambda", java.util.Objects.requireNonNull(value, "overrideLambda is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

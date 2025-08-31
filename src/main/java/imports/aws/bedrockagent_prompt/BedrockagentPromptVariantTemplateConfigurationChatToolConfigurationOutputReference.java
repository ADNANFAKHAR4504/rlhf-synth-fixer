package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.181Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationOutputReference")
public class BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putTool(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTool", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putToolChoice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putToolChoice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetTool() {
        software.amazon.jsii.Kernel.call(this, "resetTool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetToolChoice() {
        software.amazon.jsii.Kernel.call(this, "resetToolChoice", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolList getTool() {
        return software.amazon.jsii.Kernel.get(this, "tool", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoiceList getToolChoice() {
        return software.amazon.jsii.Kernel.get(this, "toolChoice", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoiceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getToolChoiceInput() {
        return software.amazon.jsii.Kernel.get(this, "toolChoiceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getToolInput() {
        return software.amazon.jsii.Kernel.get(this, "toolInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

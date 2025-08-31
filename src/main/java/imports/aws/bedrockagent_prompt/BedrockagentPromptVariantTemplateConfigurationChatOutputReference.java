package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.178Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatOutputReference")
public class BedrockagentPromptVariantTemplateConfigurationChatOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentPromptVariantTemplateConfigurationChatOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentPromptVariantTemplateConfigurationChatOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentPromptVariantTemplateConfigurationChatOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putInputVariable(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariable>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariable> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariable>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariable __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInputVariable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMessage(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessage>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessage> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessage>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessage __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMessage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSystemAttribute(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystem>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystem> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystem>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystem __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSystemAttribute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putToolConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putToolConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInputVariable() {
        software.amazon.jsii.Kernel.call(this, "resetInputVariable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessage() {
        software.amazon.jsii.Kernel.call(this, "resetMessage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSystemAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetSystemAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public void resetToolConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetToolConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariableList getInputVariable() {
        return software.amazon.jsii.Kernel.get(this, "inputVariable", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessageList getMessage() {
        return software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessageList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystemList getSystemAttribute() {
        return software.amazon.jsii.Kernel.get(this, "systemAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystemList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationList getToolConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "toolConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInputVariableInput() {
        return software.amazon.jsii.Kernel.get(this, "inputVariableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "messageInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSystemAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "systemAttributeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getToolConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "toolConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChat value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

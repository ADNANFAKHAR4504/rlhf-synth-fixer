package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantOutputReference")
public class BedrockagentPromptVariantOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentPromptVariantOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentPromptVariantOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentPromptVariantOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putGenAiResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResource> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGenAiResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInferenceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadata(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadata>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadata> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadata>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadata __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMetadata", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTemplateConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTemplateConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalModelRequestFields() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalModelRequestFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenAiResource() {
        software.amazon.jsii.Kernel.call(this, "resetGenAiResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelId() {
        software.amazon.jsii.Kernel.call(this, "resetModelId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResourceList getGenAiResource() {
        return software.amazon.jsii.Kernel.get(this, "genAiResource", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfigurationList getInferenceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "inferenceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadataList getMetadata() {
        return software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadataList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationList getTemplateConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "templateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdditionalModelRequestFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalModelRequestFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGenAiResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "genAiResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInferenceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelIdInput() {
        return software.amazon.jsii.Kernel.get(this, "modelIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTemplateConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "templateConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "templateTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdditionalModelRequestFields() {
        return software.amazon.jsii.Kernel.get(this, "additionalModelRequestFields", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdditionalModelRequestFields(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "additionalModelRequestFields", java.util.Objects.requireNonNull(value, "additionalModelRequestFields is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelId() {
        return software.amazon.jsii.Kernel.get(this, "modelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelId", java.util.Objects.requireNonNull(value, "modelId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateType() {
        return software.amazon.jsii.Kernel.get(this, "templateType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateType", java.util.Objects.requireNonNull(value, "templateType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_prompt.BedrockagentPromptVariant value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

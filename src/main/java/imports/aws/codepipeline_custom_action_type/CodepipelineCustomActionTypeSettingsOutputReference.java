package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeSettingsOutputReference")
public class CodepipelineCustomActionTypeSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineCustomActionTypeSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineCustomActionTypeSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineCustomActionTypeSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEntityUrlTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetEntityUrlTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionUrlTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionUrlTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRevisionUrlTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetRevisionUrlTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThirdPartyConfigurationUrl() {
        software.amazon.jsii.Kernel.call(this, "resetThirdPartyConfigurationUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntityUrlTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "entityUrlTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionUrlTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "executionUrlTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRevisionUrlTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "revisionUrlTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThirdPartyConfigurationUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "thirdPartyConfigurationUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntityUrlTemplate() {
        return software.amazon.jsii.Kernel.get(this, "entityUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntityUrlTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entityUrlTemplate", java.util.Objects.requireNonNull(value, "entityUrlTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionUrlTemplate() {
        return software.amazon.jsii.Kernel.get(this, "executionUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionUrlTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionUrlTemplate", java.util.Objects.requireNonNull(value, "executionUrlTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevisionUrlTemplate() {
        return software.amazon.jsii.Kernel.get(this, "revisionUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRevisionUrlTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "revisionUrlTemplate", java.util.Objects.requireNonNull(value, "revisionUrlTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThirdPartyConfigurationUrl() {
        return software.amazon.jsii.Kernel.get(this, "thirdPartyConfigurationUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThirdPartyConfigurationUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "thirdPartyConfigurationUrl", java.util.Objects.requireNonNull(value, "thirdPartyConfigurationUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

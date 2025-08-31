package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailureRetryConfigurationOutputReference")
public class CodepipelineStageOnFailureRetryConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineStageOnFailureRetryConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineStageOnFailureRetryConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineStageOnFailureRetryConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRetryMode() {
        software.amazon.jsii.Kernel.call(this, "resetRetryMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRetryModeInput() {
        return software.amazon.jsii.Kernel.get(this, "retryModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRetryMode() {
        return software.amazon.jsii.Kernel.get(this, "retryMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRetryMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "retryMode", java.util.Objects.requireNonNull(value, "retryMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

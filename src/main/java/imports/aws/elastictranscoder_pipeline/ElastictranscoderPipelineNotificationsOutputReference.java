package imports.aws.elastictranscoder_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPipeline.ElastictranscoderPipelineNotificationsOutputReference")
public class ElastictranscoderPipelineNotificationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPipelineNotificationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPipelineNotificationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElastictranscoderPipelineNotificationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCompleted() {
        software.amazon.jsii.Kernel.call(this, "resetCompleted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetError() {
        software.amazon.jsii.Kernel.call(this, "resetError", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgressing() {
        software.amazon.jsii.Kernel.call(this, "resetProgressing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarning() {
        software.amazon.jsii.Kernel.call(this, "resetWarning", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompletedInput() {
        return software.amazon.jsii.Kernel.get(this, "completedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getErrorInput() {
        return software.amazon.jsii.Kernel.get(this, "errorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgressingInput() {
        return software.amazon.jsii.Kernel.get(this, "progressingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWarningInput() {
        return software.amazon.jsii.Kernel.get(this, "warningInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompleted() {
        return software.amazon.jsii.Kernel.get(this, "completed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompleted(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "completed", java.util.Objects.requireNonNull(value, "completed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getError() {
        return software.amazon.jsii.Kernel.get(this, "error", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setError(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "error", java.util.Objects.requireNonNull(value, "error is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgressing() {
        return software.amazon.jsii.Kernel.get(this, "progressing", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgressing(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "progressing", java.util.Objects.requireNonNull(value, "progressing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarning() {
        return software.amazon.jsii.Kernel.get(this, "warning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWarning(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "warning", java.util.Objects.requireNonNull(value, "warning is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

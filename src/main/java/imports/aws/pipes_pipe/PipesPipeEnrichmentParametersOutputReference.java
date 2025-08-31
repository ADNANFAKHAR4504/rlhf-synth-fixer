package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeEnrichmentParametersOutputReference")
public class PipesPipeEnrichmentParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeEnrichmentParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeEnrichmentParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeEnrichmentParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHttpParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters value) {
        software.amazon.jsii.Kernel.call(this, "putHttpParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHttpParameters() {
        software.amazon.jsii.Kernel.call(this, "resetHttpParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetInputTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParametersOutputReference getHttpParameters() {
        return software.amazon.jsii.Kernel.get(this, "httpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters getHttpParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "httpParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "inputTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputTemplate() {
        return software.amazon.jsii.Kernel.get(this, "inputTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputTemplate", java.util.Objects.requireNonNull(value, "inputTemplate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeEnrichmentParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeEnrichmentParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeEnrichmentParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.074Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersHttpParametersOutputReference")
public class PipesPipeTargetParametersHttpParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersHttpParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersHttpParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersHttpParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHeaderParameters() {
        software.amazon.jsii.Kernel.call(this, "resetHeaderParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPathParameterValues() {
        software.amazon.jsii.Kernel.call(this, "resetPathParameterValues", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryStringParameters() {
        software.amazon.jsii.Kernel.call(this, "resetQueryStringParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getHeaderParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "headerParametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPathParameterValuesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "pathParameterValuesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getQueryStringParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "queryStringParametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getHeaderParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "headerParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHeaderParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "headerParameters", java.util.Objects.requireNonNull(value, "headerParameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPathParameterValues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "pathParameterValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPathParameterValues(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "pathParameterValues", java.util.Objects.requireNonNull(value, "pathParameterValues is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getQueryStringParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "queryStringParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setQueryStringParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "queryStringParameters", java.util.Objects.requireNonNull(value, "queryStringParameters is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

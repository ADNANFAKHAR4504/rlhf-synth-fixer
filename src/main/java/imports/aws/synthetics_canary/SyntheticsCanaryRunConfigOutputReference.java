package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryRunConfigOutputReference")
public class SyntheticsCanaryRunConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SyntheticsCanaryRunConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SyntheticsCanaryRunConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SyntheticsCanaryRunConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetActiveTracing() {
        software.amazon.jsii.Kernel.call(this, "resetActiveTracing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironmentVariables() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironmentVariables", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryInMb() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryInMb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActiveTracingInput() {
        return software.amazon.jsii.Kernel.get(this, "activeTracingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariablesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "environmentVariablesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemoryInMbInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryInMbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getActiveTracing() {
        return software.amazon.jsii.Kernel.get(this, "activeTracing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setActiveTracing(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "activeTracing", java.util.Objects.requireNonNull(value, "activeTracing is required"));
    }

    public void setActiveTracing(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "activeTracing", java.util.Objects.requireNonNull(value, "activeTracing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnvironmentVariables(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "environmentVariables", java.util.Objects.requireNonNull(value, "environmentVariables is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemoryInMb() {
        return software.amazon.jsii.Kernel.get(this, "memoryInMb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemoryInMb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memoryInMb", java.util.Objects.requireNonNull(value, "memoryInMb is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutInSeconds", java.util.Objects.requireNonNull(value, "timeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryRunConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryRunConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryRunConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

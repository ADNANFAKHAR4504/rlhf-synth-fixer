package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetBatchTargetOutputReference")
public class CloudwatchEventTargetBatchTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventTargetBatchTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventTargetBatchTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventTargetBatchTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetArraySize() {
        software.amazon.jsii.Kernel.call(this, "resetArraySize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobAttempts() {
        software.amazon.jsii.Kernel.call(this, "resetJobAttempts", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getArraySizeInput() {
        return software.amazon.jsii.Kernel.get(this, "arraySizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getJobAttemptsInput() {
        return software.amazon.jsii.Kernel.get(this, "jobAttemptsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "jobDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobNameInput() {
        return software.amazon.jsii.Kernel.get(this, "jobNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getArraySize() {
        return software.amazon.jsii.Kernel.get(this, "arraySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setArraySize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "arraySize", java.util.Objects.requireNonNull(value, "arraySize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getJobAttempts() {
        return software.amazon.jsii.Kernel.get(this, "jobAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setJobAttempts(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "jobAttempts", java.util.Objects.requireNonNull(value, "jobAttempts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobDefinition() {
        return software.amazon.jsii.Kernel.get(this, "jobDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobDefinition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobDefinition", java.util.Objects.requireNonNull(value, "jobDefinition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobName() {
        return software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobName", java.util.Objects.requireNonNull(value, "jobName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

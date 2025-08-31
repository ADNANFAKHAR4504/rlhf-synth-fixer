package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersCloudwatchLogsParametersOutputReference")
public class PipesPipeTargetParametersCloudwatchLogsParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersCloudwatchLogsParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersCloudwatchLogsParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersCloudwatchLogsParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLogStreamName() {
        software.amazon.jsii.Kernel.call(this, "resetLogStreamName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestamp() {
        software.amazon.jsii.Kernel.call(this, "resetTimestamp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogStreamNameInput() {
        return software.amazon.jsii.Kernel.get(this, "logStreamNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimestampInput() {
        return software.amazon.jsii.Kernel.get(this, "timestampInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogStreamName() {
        return software.amazon.jsii.Kernel.get(this, "logStreamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogStreamName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logStreamName", java.util.Objects.requireNonNull(value, "logStreamName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "timestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimestamp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timestamp", java.util.Objects.requireNonNull(value, "timestamp is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

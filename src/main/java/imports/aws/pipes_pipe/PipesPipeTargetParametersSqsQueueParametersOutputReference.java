package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersSqsQueueParametersOutputReference")
public class PipesPipeTargetParametersSqsQueueParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersSqsQueueParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersSqsQueueParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersSqsQueueParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMessageDeduplicationId() {
        software.amazon.jsii.Kernel.call(this, "resetMessageDeduplicationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetMessageGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageDeduplicationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "messageDeduplicationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "messageGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageDeduplicationId() {
        return software.amazon.jsii.Kernel.get(this, "messageDeduplicationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageDeduplicationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageDeduplicationId", java.util.Objects.requireNonNull(value, "messageDeduplicationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageGroupId() {
        return software.amazon.jsii.Kernel.get(this, "messageGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageGroupId", java.util.Objects.requireNonNull(value, "messageGroupId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

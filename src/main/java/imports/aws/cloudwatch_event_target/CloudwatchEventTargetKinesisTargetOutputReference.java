package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetKinesisTargetOutputReference")
public class CloudwatchEventTargetKinesisTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventTargetKinesisTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventTargetKinesisTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventTargetKinesisTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPartitionKeyPath() {
        software.amazon.jsii.Kernel.call(this, "resetPartitionKeyPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPartitionKeyPathInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionKeyPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPartitionKeyPath() {
        return software.amazon.jsii.Kernel.get(this, "partitionKeyPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPartitionKeyPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "partitionKeyPath", java.util.Objects.requireNonNull(value, "partitionKeyPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

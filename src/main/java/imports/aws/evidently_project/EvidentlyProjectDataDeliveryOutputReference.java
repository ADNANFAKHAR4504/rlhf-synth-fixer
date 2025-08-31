package imports.aws.evidently_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyProject.EvidentlyProjectDataDeliveryOutputReference")
public class EvidentlyProjectDataDeliveryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyProjectDataDeliveryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyProjectDataDeliveryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EvidentlyProjectDataDeliveryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Destination(final @org.jetbrains.annotations.NotNull imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination value) {
        software.amazon.jsii.Kernel.call(this, "putS3Destination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Destination() {
        software.amazon.jsii.Kernel.call(this, "resetS3Destination", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3DestinationOutputReference getS3Destination() {
        return software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3DestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination getS3DestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3DestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDelivery getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDelivery.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDelivery value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

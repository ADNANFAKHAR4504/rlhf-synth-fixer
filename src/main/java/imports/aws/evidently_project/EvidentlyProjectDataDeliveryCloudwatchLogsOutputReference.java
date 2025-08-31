package imports.aws.evidently_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyProject.EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference")
public class EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EvidentlyProjectDataDeliveryCloudwatchLogsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLogGroup() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroup", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroup() {
        return software.amazon.jsii.Kernel.get(this, "logGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroup", java.util.Objects.requireNonNull(value, "logGroup is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

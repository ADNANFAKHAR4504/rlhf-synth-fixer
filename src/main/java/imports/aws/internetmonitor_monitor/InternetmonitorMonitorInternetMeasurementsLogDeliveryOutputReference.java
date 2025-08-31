package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference")
public class InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3Config(final @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config value) {
        software.amazon.jsii.Kernel.call(this, "putS3Config", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetS3Config() {
        software.amazon.jsii.Kernel.call(this, "resetS3Config", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference getS3Config() {
        return software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config getS3ConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDelivery value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference")
public class InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetBucketPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDeliveryStatus() {
        software.amazon.jsii.Kernel.call(this, "resetLogDeliveryStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDeliveryStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketPrefix", java.util.Objects.requireNonNull(value, "bucketPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDeliveryStatus() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDeliveryStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDeliveryStatus", java.util.Objects.requireNonNull(value, "logDeliveryStatus is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

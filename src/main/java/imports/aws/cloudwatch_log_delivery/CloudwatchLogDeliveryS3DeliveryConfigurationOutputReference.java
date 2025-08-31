package imports.aws.cloudwatch_log_delivery;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.282Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogDelivery.CloudwatchLogDeliveryS3DeliveryConfigurationOutputReference")
public class CloudwatchLogDeliveryS3DeliveryConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchLogDeliveryS3DeliveryConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchLogDeliveryS3DeliveryConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudwatchLogDeliveryS3DeliveryConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEnableHiveCompatiblePath() {
        software.amazon.jsii.Kernel.call(this, "resetEnableHiveCompatiblePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuffixPath() {
        software.amazon.jsii.Kernel.call(this, "resetSuffixPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableHiveCompatiblePathInput() {
        return software.amazon.jsii.Kernel.get(this, "enableHiveCompatiblePathInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuffixPathInput() {
        return software.amazon.jsii.Kernel.get(this, "suffixPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableHiveCompatiblePath() {
        return software.amazon.jsii.Kernel.get(this, "enableHiveCompatiblePath", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableHiveCompatiblePath(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableHiveCompatiblePath", java.util.Objects.requireNonNull(value, "enableHiveCompatiblePath is required"));
    }

    public void setEnableHiveCompatiblePath(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableHiveCompatiblePath", java.util.Objects.requireNonNull(value, "enableHiveCompatiblePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuffixPath() {
        return software.amazon.jsii.Kernel.get(this, "suffixPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuffixPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "suffixPath", java.util.Objects.requireNonNull(value, "suffixPath is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

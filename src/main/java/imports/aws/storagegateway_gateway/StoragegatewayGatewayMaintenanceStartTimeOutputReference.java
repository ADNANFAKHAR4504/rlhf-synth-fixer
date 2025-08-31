package imports.aws.storagegateway_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGatewayMaintenanceStartTimeOutputReference")
public class StoragegatewayGatewayMaintenanceStartTimeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected StoragegatewayGatewayMaintenanceStartTimeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayGatewayMaintenanceStartTimeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public StoragegatewayGatewayMaintenanceStartTimeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDayOfMonth() {
        software.amazon.jsii.Kernel.call(this, "resetDayOfMonth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDayOfWeek() {
        software.amazon.jsii.Kernel.call(this, "resetDayOfWeek", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinuteOfHour() {
        software.amazon.jsii.Kernel.call(this, "resetMinuteOfHour", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDayOfMonthInput() {
        return software.amazon.jsii.Kernel.get(this, "dayOfMonthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDayOfWeekInput() {
        return software.amazon.jsii.Kernel.get(this, "dayOfWeekInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHourOfDayInput() {
        return software.amazon.jsii.Kernel.get(this, "hourOfDayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinuteOfHourInput() {
        return software.amazon.jsii.Kernel.get(this, "minuteOfHourInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDayOfMonth() {
        return software.amazon.jsii.Kernel.get(this, "dayOfMonth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDayOfMonth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dayOfMonth", java.util.Objects.requireNonNull(value, "dayOfMonth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDayOfWeek() {
        return software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDayOfWeek(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dayOfWeek", java.util.Objects.requireNonNull(value, "dayOfWeek is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHourOfDay() {
        return software.amazon.jsii.Kernel.get(this, "hourOfDay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHourOfDay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "hourOfDay", java.util.Objects.requireNonNull(value, "hourOfDay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinuteOfHour() {
        return software.amazon.jsii.Kernel.get(this, "minuteOfHour", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinuteOfHour(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minuteOfHour", java.util.Objects.requireNonNull(value, "minuteOfHour is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.cloudwatch_composite_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarmActionsSuppressorOutputReference")
public class CloudwatchCompositeAlarmActionsSuppressorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchCompositeAlarmActionsSuppressorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchCompositeAlarmActionsSuppressorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchCompositeAlarmActionsSuppressorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getExtensionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "extensionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "waitPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarm() {
        return software.amazon.jsii.Kernel.get(this, "alarm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarm", java.util.Objects.requireNonNull(value, "alarm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getExtensionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "extensionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setExtensionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "extensionPeriod", java.util.Objects.requireNonNull(value, "extensionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitPeriod() {
        return software.amazon.jsii.Kernel.get(this, "waitPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitPeriod", java.util.Objects.requireNonNull(value, "waitPeriod is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

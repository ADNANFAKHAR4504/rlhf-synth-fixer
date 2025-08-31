package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTriggerConfigTriggerPropertiesScheduledOutputReference")
public class AppflowFlowTriggerConfigTriggerPropertiesScheduledOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowTriggerConfigTriggerPropertiesScheduledOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowTriggerConfigTriggerPropertiesScheduledOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowTriggerConfigTriggerPropertiesScheduledOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDataPullMode() {
        software.amazon.jsii.Kernel.call(this, "resetDataPullMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstExecutionFrom() {
        software.amazon.jsii.Kernel.call(this, "resetFirstExecutionFrom", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleEndTime() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleEndTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleOffset() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleOffset", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataPullModeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPullModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstExecutionFromInput() {
        return software.amazon.jsii.Kernel.get(this, "firstExecutionFromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleEndTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleEndTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScheduleOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleStartTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "timezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataPullMode() {
        return software.amazon.jsii.Kernel.get(this, "dataPullMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataPullMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataPullMode", java.util.Objects.requireNonNull(value, "dataPullMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirstExecutionFrom() {
        return software.amazon.jsii.Kernel.get(this, "firstExecutionFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirstExecutionFrom(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firstExecutionFrom", java.util.Objects.requireNonNull(value, "firstExecutionFrom is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleEndTime() {
        return software.amazon.jsii.Kernel.get(this, "scheduleEndTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleEndTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleEndTime", java.util.Objects.requireNonNull(value, "scheduleEndTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpression", java.util.Objects.requireNonNull(value, "scheduleExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScheduleOffset() {
        return software.amazon.jsii.Kernel.get(this, "scheduleOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScheduleOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scheduleOffset", java.util.Objects.requireNonNull(value, "scheduleOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleStartTime() {
        return software.amazon.jsii.Kernel.get(this, "scheduleStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleStartTime", java.util.Objects.requireNonNull(value, "scheduleStartTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimezone() {
        return software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timezone", java.util.Objects.requireNonNull(value, "timezone is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

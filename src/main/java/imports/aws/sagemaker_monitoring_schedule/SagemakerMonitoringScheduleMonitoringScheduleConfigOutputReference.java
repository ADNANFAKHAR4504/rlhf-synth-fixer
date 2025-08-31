package imports.aws.sagemaker_monitoring_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.334Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerMonitoringSchedule.SagemakerMonitoringScheduleMonitoringScheduleConfigOutputReference")
public class SagemakerMonitoringScheduleMonitoringScheduleConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerMonitoringScheduleMonitoringScheduleConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerMonitoringScheduleMonitoringScheduleConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerMonitoringScheduleMonitoringScheduleConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putScheduleConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig value) {
        software.amazon.jsii.Kernel.call(this, "putScheduleConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetScheduleConfig() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfigOutputReference getScheduleConfig() {
        return software.amazon.jsii.Kernel.get(this, "scheduleConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMonitoringJobDefinitionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringJobDefinitionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMonitoringTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig getScheduleConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMonitoringJobDefinitionName() {
        return software.amazon.jsii.Kernel.get(this, "monitoringJobDefinitionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMonitoringJobDefinitionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "monitoringJobDefinitionName", java.util.Objects.requireNonNull(value, "monitoringJobDefinitionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMonitoringType() {
        return software.amazon.jsii.Kernel.get(this, "monitoringType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMonitoringType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "monitoringType", java.util.Objects.requireNonNull(value, "monitoringType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

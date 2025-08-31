package imports.aws.mwaa_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.923Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mwaaEnvironment.MwaaEnvironmentLoggingConfigurationOutputReference")
public class MwaaEnvironmentLoggingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MwaaEnvironmentLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MwaaEnvironmentLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MwaaEnvironmentLoggingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDagProcessingLogs(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationDagProcessingLogs value) {
        software.amazon.jsii.Kernel.call(this, "putDagProcessingLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSchedulerLogs(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationSchedulerLogs value) {
        software.amazon.jsii.Kernel.call(this, "putSchedulerLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTaskLogs(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationTaskLogs value) {
        software.amazon.jsii.Kernel.call(this, "putTaskLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWebserverLogs(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWebserverLogs value) {
        software.amazon.jsii.Kernel.call(this, "putWebserverLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkerLogs(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWorkerLogs value) {
        software.amazon.jsii.Kernel.call(this, "putWorkerLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDagProcessingLogs() {
        software.amazon.jsii.Kernel.call(this, "resetDagProcessingLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedulerLogs() {
        software.amazon.jsii.Kernel.call(this, "resetSchedulerLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskLogs() {
        software.amazon.jsii.Kernel.call(this, "resetTaskLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebserverLogs() {
        software.amazon.jsii.Kernel.call(this, "resetWebserverLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkerLogs() {
        software.amazon.jsii.Kernel.call(this, "resetWorkerLogs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationDagProcessingLogsOutputReference getDagProcessingLogs() {
        return software.amazon.jsii.Kernel.get(this, "dagProcessingLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationDagProcessingLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationSchedulerLogsOutputReference getSchedulerLogs() {
        return software.amazon.jsii.Kernel.get(this, "schedulerLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationSchedulerLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationTaskLogsOutputReference getTaskLogs() {
        return software.amazon.jsii.Kernel.get(this, "taskLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationTaskLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWebserverLogsOutputReference getWebserverLogs() {
        return software.amazon.jsii.Kernel.get(this, "webserverLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWebserverLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWorkerLogsOutputReference getWorkerLogs() {
        return software.amazon.jsii.Kernel.get(this, "workerLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWorkerLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationDagProcessingLogs getDagProcessingLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "dagProcessingLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationDagProcessingLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationSchedulerLogs getSchedulerLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "schedulerLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationSchedulerLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationTaskLogs getTaskLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "taskLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationTaskLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWebserverLogs getWebserverLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "webserverLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWebserverLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWorkerLogs getWorkerLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "workerLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationWorkerLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

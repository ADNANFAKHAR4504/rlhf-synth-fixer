package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference")
public class SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCloudwatchLogGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchOutputEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchOutputEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchOutputEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchOutputEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogGroupName() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchLogGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchLogGroupName", java.util.Objects.requireNonNull(value, "cloudwatchLogGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCloudwatchOutputEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchOutputEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCloudwatchOutputEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchOutputEnabled", java.util.Objects.requireNonNull(value, "cloudwatchOutputEnabled is required"));
    }

    public void setCloudwatchOutputEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchOutputEnabled", java.util.Objects.requireNonNull(value, "cloudwatchOutputEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

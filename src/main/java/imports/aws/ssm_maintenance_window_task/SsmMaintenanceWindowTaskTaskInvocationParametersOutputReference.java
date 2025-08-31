package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference")
public class SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutomationParameters(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters value) {
        software.amazon.jsii.Kernel.call(this, "putAutomationParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaParameters(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRunCommandParameters(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters value) {
        software.amazon.jsii.Kernel.call(this, "putRunCommandParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStepFunctionsParameters(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters value) {
        software.amazon.jsii.Kernel.call(this, "putStepFunctionsParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutomationParameters() {
        software.amazon.jsii.Kernel.call(this, "resetAutomationParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaParameters() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunCommandParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRunCommandParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepFunctionsParameters() {
        software.amazon.jsii.Kernel.call(this, "resetStepFunctionsParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParametersOutputReference getAutomationParameters() {
        return software.amazon.jsii.Kernel.get(this, "automationParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference getLambdaParameters() {
        return software.amazon.jsii.Kernel.get(this, "lambdaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference getRunCommandParameters() {
        return software.amazon.jsii.Kernel.get(this, "runCommandParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParametersOutputReference getStepFunctionsParameters() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters getAutomationParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "automationParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters getLambdaParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters getRunCommandParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "runCommandParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters getStepFunctionsParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionsParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

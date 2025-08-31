package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference")
public class SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetClientContext() {
        software.amazon.jsii.Kernel.call(this, "resetClientContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPayload() {
        software.amazon.jsii.Kernel.call(this, "resetPayload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientContextInput() {
        return software.amazon.jsii.Kernel.get(this, "clientContextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPayloadInput() {
        return software.amazon.jsii.Kernel.get(this, "payloadInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "qualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientContext() {
        return software.amazon.jsii.Kernel.get(this, "clientContext", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientContext(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientContext", java.util.Objects.requireNonNull(value, "clientContext is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPayload() {
        return software.amazon.jsii.Kernel.get(this, "payload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPayload(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "payload", java.util.Objects.requireNonNull(value, "payload is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifier() {
        return software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "qualifier", java.util.Objects.requireNonNull(value, "qualifier is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

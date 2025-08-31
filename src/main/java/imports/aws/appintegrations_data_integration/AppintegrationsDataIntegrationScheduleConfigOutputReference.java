package imports.aws.appintegrations_data_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.017Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appintegrationsDataIntegration.AppintegrationsDataIntegrationScheduleConfigOutputReference")
public class AppintegrationsDataIntegrationScheduleConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppintegrationsDataIntegrationScheduleConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppintegrationsDataIntegrationScheduleConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppintegrationsDataIntegrationScheduleConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstExecutionFromInput() {
        return software.amazon.jsii.Kernel.get(this, "firstExecutionFromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "objectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirstExecutionFrom() {
        return software.amazon.jsii.Kernel.get(this, "firstExecutionFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirstExecutionFrom(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firstExecutionFrom", java.util.Objects.requireNonNull(value, "firstExecutionFrom is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObject() {
        return software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "object", java.util.Objects.requireNonNull(value, "object is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpression", java.util.Objects.requireNonNull(value, "scheduleExpression is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appintegrations_data_integration.AppintegrationsDataIntegrationScheduleConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appintegrations_data_integration.AppintegrationsDataIntegrationScheduleConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appintegrations_data_integration.AppintegrationsDataIntegrationScheduleConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

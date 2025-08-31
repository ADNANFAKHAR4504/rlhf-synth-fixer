package imports.aws.appintegrations_event_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.017Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appintegrationsEventIntegration.AppintegrationsEventIntegrationEventFilterOutputReference")
public class AppintegrationsEventIntegrationEventFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppintegrationsEventIntegrationEventFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppintegrationsEventIntegrationEventFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppintegrationsEventIntegrationEventFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSource() {
        return software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "source", java.util.Objects.requireNonNull(value, "source is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appintegrations_event_integration.AppintegrationsEventIntegrationEventFilter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appintegrations_event_integration.AppintegrationsEventIntegrationEventFilter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appintegrations_event_integration.AppintegrationsEventIntegrationEventFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

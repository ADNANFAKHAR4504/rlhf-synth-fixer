package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.210Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInteractiveConfigurationOutputReference")
public class EmrserverlessApplicationInteractiveConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrserverlessApplicationInteractiveConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrserverlessApplicationInteractiveConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrserverlessApplicationInteractiveConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLivyEndpointEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetLivyEndpointEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStudioEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetStudioEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLivyEndpointEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "livyEndpointEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStudioEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "studioEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLivyEndpointEnabled() {
        return software.amazon.jsii.Kernel.get(this, "livyEndpointEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLivyEndpointEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "livyEndpointEnabled", java.util.Objects.requireNonNull(value, "livyEndpointEnabled is required"));
    }

    public void setLivyEndpointEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "livyEndpointEnabled", java.util.Objects.requireNonNull(value, "livyEndpointEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStudioEnabled() {
        return software.amazon.jsii.Kernel.get(this, "studioEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStudioEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "studioEnabled", java.util.Objects.requireNonNull(value, "studioEnabled is required"));
    }

    public void setStudioEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "studioEnabled", java.util.Objects.requireNonNull(value, "studioEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

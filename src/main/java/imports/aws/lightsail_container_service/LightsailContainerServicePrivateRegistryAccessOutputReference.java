package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccessOutputReference")
public class LightsailContainerServicePrivateRegistryAccessOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailContainerServicePrivateRegistryAccessOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailContainerServicePrivateRegistryAccessOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailContainerServicePrivateRegistryAccessOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEcrImagePullerRole(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole value) {
        software.amazon.jsii.Kernel.call(this, "putEcrImagePullerRole", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEcrImagePullerRole() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImagePullerRole", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference getEcrImagePullerRole() {
        return software.amazon.jsii.Kernel.get(this, "ecrImagePullerRole", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole getEcrImagePullerRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImagePullerRoleInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccess getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccess.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccess value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

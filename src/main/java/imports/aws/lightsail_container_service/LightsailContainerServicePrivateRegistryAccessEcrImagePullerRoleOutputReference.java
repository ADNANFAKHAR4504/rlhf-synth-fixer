package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference")
public class LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailContainerServicePrivateRegistryAccessEcrImagePullerRoleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIsActive() {
        software.amazon.jsii.Kernel.call(this, "resetIsActive", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipalArn() {
        return software.amazon.jsii.Kernel.get(this, "principalArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsActiveInput() {
        return software.amazon.jsii.Kernel.get(this, "isActiveInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsActive() {
        return software.amazon.jsii.Kernel.get(this, "isActive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsActive(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isActive", java.util.Objects.requireNonNull(value, "isActive is required"));
    }

    public void setIsActive(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isActive", java.util.Objects.requireNonNull(value, "isActive is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

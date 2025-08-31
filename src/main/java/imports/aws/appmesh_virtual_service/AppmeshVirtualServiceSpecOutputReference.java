package imports.aws.appmesh_virtual_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualService.AppmeshVirtualServiceSpecOutputReference")
public class AppmeshVirtualServiceSpecOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualServiceSpecOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualServiceSpecOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualServiceSpecOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putProvider(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider value) {
        software.amazon.jsii.Kernel.call(this, "putProvider", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetProvider() {
        software.amazon.jsii.Kernel.call(this, "resetProvider", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderOutputReference getProvider() {
        return software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider getProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "providerInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpec getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpec.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpec value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

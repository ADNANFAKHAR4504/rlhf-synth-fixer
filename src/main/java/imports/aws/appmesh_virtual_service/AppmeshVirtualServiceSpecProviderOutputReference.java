package imports.aws.appmesh_virtual_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualService.AppmeshVirtualServiceSpecProviderOutputReference")
public class AppmeshVirtualServiceSpecProviderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualServiceSpecProviderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualServiceSpecProviderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualServiceSpecProviderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putVirtualNode(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode value) {
        software.amazon.jsii.Kernel.call(this, "putVirtualNode", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVirtualRouter(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualRouter value) {
        software.amazon.jsii.Kernel.call(this, "putVirtualRouter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetVirtualNode() {
        software.amazon.jsii.Kernel.call(this, "resetVirtualNode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVirtualRouter() {
        software.amazon.jsii.Kernel.call(this, "resetVirtualRouter", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference getVirtualNode() {
        return software.amazon.jsii.Kernel.get(this, "virtualNode", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualRouterOutputReference getVirtualRouter() {
        return software.amazon.jsii.Kernel.get(this, "virtualRouter", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualRouterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode getVirtualNodeInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualNodeInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualRouter getVirtualRouterInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualRouterInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualRouter.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProvider value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

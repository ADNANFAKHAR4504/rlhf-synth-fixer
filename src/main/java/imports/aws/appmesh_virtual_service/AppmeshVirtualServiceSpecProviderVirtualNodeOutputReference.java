package imports.aws.appmesh_virtual_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualService.AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference")
public class AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualServiceSpecProviderVirtualNodeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVirtualNodeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualNodeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualNodeName() {
        return software.amazon.jsii.Kernel.get(this, "virtualNodeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVirtualNodeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "virtualNodeName", java.util.Objects.requireNonNull(value, "virtualNodeName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_service.AppmeshVirtualServiceSpecProviderVirtualNode value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

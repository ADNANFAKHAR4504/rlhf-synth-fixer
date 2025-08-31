package imports.aws.appmesh_virtual_router;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.049Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualRouter.AppmeshVirtualRouterSpecListenerOutputReference")
public class AppmeshVirtualRouterSpecListenerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualRouterSpecListenerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualRouterSpecListenerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AppmeshVirtualRouterSpecListenerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putPortMapping(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListenerPortMapping value) {
        software.amazon.jsii.Kernel.call(this, "putPortMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListenerPortMappingOutputReference getPortMapping() {
        return software.amazon.jsii.Kernel.get(this, "portMapping", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListenerPortMappingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListenerPortMapping getPortMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "portMappingInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListenerPortMapping.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListener value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

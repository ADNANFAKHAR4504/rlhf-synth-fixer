package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.047Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesOutputReference")
public class AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMatch(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesMatch value) {
        software.amazon.jsii.Kernel.call(this, "putMatch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesMatchOutputReference getMatch() {
        return software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesMatchOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesMatch getMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "matchInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNamesMatch.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNames getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNames.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationSubjectAlternativeNames value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

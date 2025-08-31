package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.035Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationOutputReference")
public class AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSubjectAlternativeNames(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationSubjectAlternativeNames value) {
        software.amazon.jsii.Kernel.call(this, "putSubjectAlternativeNames", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTrust(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust value) {
        software.amazon.jsii.Kernel.call(this, "putTrust", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSubjectAlternativeNames() {
        software.amazon.jsii.Kernel.call(this, "resetSubjectAlternativeNames", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationSubjectAlternativeNamesOutputReference getSubjectAlternativeNames() {
        return software.amazon.jsii.Kernel.get(this, "subjectAlternativeNames", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationSubjectAlternativeNamesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference getTrust() {
        return software.amazon.jsii.Kernel.get(this, "trust", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationSubjectAlternativeNames getSubjectAlternativeNamesInput() {
        return software.amazon.jsii.Kernel.get(this, "subjectAlternativeNamesInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationSubjectAlternativeNames.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust getTrustInput() {
        return software.amazon.jsii.Kernel.get(this, "trustInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

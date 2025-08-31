package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.035Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference")
public class AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAcm(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm value) {
        software.amazon.jsii.Kernel.call(this, "putAcm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFile(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustFile value) {
        software.amazon.jsii.Kernel.call(this, "putFile", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSds(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustSds value) {
        software.amazon.jsii.Kernel.call(this, "putSds", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcm() {
        software.amazon.jsii.Kernel.call(this, "resetAcm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFile() {
        software.amazon.jsii.Kernel.call(this, "resetFile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSds() {
        software.amazon.jsii.Kernel.call(this, "resetSds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcmOutputReference getAcm() {
        return software.amazon.jsii.Kernel.get(this, "acm", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcmOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustFileOutputReference getFile() {
        return software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustFileOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustSdsOutputReference getSds() {
        return software.amazon.jsii.Kernel.get(this, "sds", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustSdsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm getAcmInput() {
        return software.amazon.jsii.Kernel.get(this, "acmInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustFile getFileInput() {
        return software.amazon.jsii.Kernel.get(this, "fileInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustFile.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustSds getSdsInput() {
        return software.amazon.jsii.Kernel.get(this, "sdsInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustSds.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrust value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

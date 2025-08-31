package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsCertificateOutputReference")
public class AppmeshVirtualGatewaySpecListenerTlsCertificateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualGatewaySpecListenerTlsCertificateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualGatewaySpecListenerTlsCertificateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualGatewaySpecListenerTlsCertificateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAcm(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateAcm value) {
        software.amazon.jsii.Kernel.call(this, "putAcm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFile(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateFile value) {
        software.amazon.jsii.Kernel.call(this, "putFile", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSds(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateSds value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateAcmOutputReference getAcm() {
        return software.amazon.jsii.Kernel.get(this, "acm", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateAcmOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateFileOutputReference getFile() {
        return software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateFileOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateSdsOutputReference getSds() {
        return software.amazon.jsii.Kernel.get(this, "sds", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateSdsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateAcm getAcmInput() {
        return software.amazon.jsii.Kernel.get(this, "acmInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateAcm.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateFile getFileInput() {
        return software.amazon.jsii.Kernel.get(this, "fileInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateFile.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateSds getSdsInput() {
        return software.amazon.jsii.Kernel.get(this, "sdsInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificateSds.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsCertificate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

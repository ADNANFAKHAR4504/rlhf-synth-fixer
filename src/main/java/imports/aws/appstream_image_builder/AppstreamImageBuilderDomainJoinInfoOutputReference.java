package imports.aws.appstream_image_builder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.061Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamImageBuilder.AppstreamImageBuilderDomainJoinInfoOutputReference")
public class AppstreamImageBuilderDomainJoinInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppstreamImageBuilderDomainJoinInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppstreamImageBuilderDomainJoinInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppstreamImageBuilderDomainJoinInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDirectoryName() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationalUnitDistinguishedName() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnitDistinguishedName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryNameInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnitDistinguishedNameInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnitDistinguishedNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryName() {
        return software.amazon.jsii.Kernel.get(this, "directoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryName", java.util.Objects.requireNonNull(value, "directoryName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationalUnitDistinguishedName() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnitDistinguishedName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationalUnitDistinguishedName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnitDistinguishedName", java.util.Objects.requireNonNull(value, "organizationalUnitDistinguishedName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

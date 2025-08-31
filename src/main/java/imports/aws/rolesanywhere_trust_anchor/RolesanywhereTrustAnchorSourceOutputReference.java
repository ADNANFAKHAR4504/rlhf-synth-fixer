package imports.aws.rolesanywhere_trust_anchor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.194Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorSourceOutputReference")
public class RolesanywhereTrustAnchorSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RolesanywhereTrustAnchorSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RolesanywhereTrustAnchorSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RolesanywhereTrustAnchorSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSourceData(final @org.jetbrains.annotations.NotNull imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData value) {
        software.amazon.jsii.Kernel.call(this, "putSourceData", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceDataOutputReference getSourceData() {
        return software.amazon.jsii.Kernel.get(this, "sourceData", software.amazon.jsii.NativeType.forClass(imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceDataOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData getSourceDataInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDataInput", software.amazon.jsii.NativeType.forClass(imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceType() {
        return software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceType", java.util.Objects.requireNonNull(value, "sourceType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

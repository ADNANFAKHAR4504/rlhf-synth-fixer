package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference")
public class Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSizeInspectionLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSizeInspectionLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSizeInspectionLimit() {
        return software.amazon.jsii.Kernel.get(this, "defaultSizeInspectionLimit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSizeInspectionLimit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSizeInspectionLimit", java.util.Objects.requireNonNull(value, "defaultSizeInspectionLimit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference")
public class Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFieldKeys() {
        software.amazon.jsii.Kernel.call(this, "resetFieldKeys", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFieldKeysInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "fieldKeysInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getFieldKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "fieldKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFieldKeys(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "fieldKeys", java.util.Objects.requireNonNull(value, "fieldKeys is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFieldType() {
        return software.amazon.jsii.Kernel.get(this, "fieldType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFieldType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fieldType", java.util.Objects.requireNonNull(value, "fieldType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

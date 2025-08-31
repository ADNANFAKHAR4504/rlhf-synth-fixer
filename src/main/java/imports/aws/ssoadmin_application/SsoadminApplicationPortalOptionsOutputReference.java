package imports.aws.ssoadmin_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.519Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminApplication.SsoadminApplicationPortalOptionsOutputReference")
public class SsoadminApplicationPortalOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsoadminApplicationPortalOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsoadminApplicationPortalOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsoadminApplicationPortalOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putSignInOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptions> __cast_cd4240 = (java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSignInOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSignInOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSignInOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisibility() {
        software.amazon.jsii.Kernel.call(this, "resetVisibility", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptionsList getSignInOptions() {
        return software.amazon.jsii.Kernel.get(this, "signInOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSignInOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "signInOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVisibilityInput() {
        return software.amazon.jsii.Kernel.get(this, "visibilityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVisibility() {
        return software.amazon.jsii.Kernel.get(this, "visibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVisibility(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "visibility", java.util.Objects.requireNonNull(value, "visibility is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.581Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOutputReference")
public class VerifiedpermissionsIdentitySourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedpermissionsIdentitySourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedpermissionsIdentitySourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public VerifiedpermissionsIdentitySourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCognitoUserPoolConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration> __cast_cd4240 = (java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCognitoUserPoolConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpenIdConnectConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration> __cast_cd4240 = (java.util.List<imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOpenIdConnectConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCognitoUserPoolConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCognitoUserPoolConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpenIdConnectConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetOpenIdConnectConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList getCognitoUserPoolConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "cognitoUserPoolConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList getOpenIdConnectConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "openIdConnectConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCognitoUserPoolConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "cognitoUserPoolConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOpenIdConnectConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "openIdConnectConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

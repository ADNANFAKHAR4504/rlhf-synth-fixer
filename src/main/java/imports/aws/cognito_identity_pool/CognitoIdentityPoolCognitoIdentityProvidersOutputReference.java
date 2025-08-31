package imports.aws.cognito_identity_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPool.CognitoIdentityPoolCognitoIdentityProvidersOutputReference")
public class CognitoIdentityPoolCognitoIdentityProvidersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoIdentityPoolCognitoIdentityProvidersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoIdentityPoolCognitoIdentityProvidersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CognitoIdentityPoolCognitoIdentityProvidersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetClientId() {
        software.amazon.jsii.Kernel.call(this, "resetClientId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProviderName() {
        software.amazon.jsii.Kernel.call(this, "resetProviderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideTokenCheck() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideTokenCheck", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProviderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "providerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getServerSideTokenCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideTokenCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientId() {
        return software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientId", java.util.Objects.requireNonNull(value, "clientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProviderName() {
        return software.amazon.jsii.Kernel.get(this, "providerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProviderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "providerName", java.util.Objects.requireNonNull(value, "providerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getServerSideTokenCheck() {
        return software.amazon.jsii.Kernel.get(this, "serverSideTokenCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setServerSideTokenCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "serverSideTokenCheck", java.util.Objects.requireNonNull(value, "serverSideTokenCheck is required"));
    }

    public void setServerSideTokenCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "serverSideTokenCheck", java.util.Objects.requireNonNull(value, "serverSideTokenCheck is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

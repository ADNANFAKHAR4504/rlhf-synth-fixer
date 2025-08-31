package imports.aws.cognito_resource_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.346Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoResourceServer.CognitoResourceServerScopeOutputReference")
public class CognitoResourceServerScopeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoResourceServerScopeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoResourceServerScopeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CognitoResourceServerScopeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScopeDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScopeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScopeDescription() {
        return software.amazon.jsii.Kernel.get(this, "scopeDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScopeDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scopeDescription", java.util.Objects.requireNonNull(value, "scopeDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScopeName() {
        return software.amazon.jsii.Kernel.get(this, "scopeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScopeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scopeName", java.util.Objects.requireNonNull(value, "scopeName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_resource_server.CognitoResourceServerScope value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

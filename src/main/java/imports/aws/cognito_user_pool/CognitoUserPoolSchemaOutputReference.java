package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSchemaOutputReference")
public class CognitoUserPoolSchemaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolSchemaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolSchemaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CognitoUserPoolSchemaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putNumberAttributeConstraints(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints value) {
        software.amazon.jsii.Kernel.call(this, "putNumberAttributeConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringAttributeConstraints(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints value) {
        software.amazon.jsii.Kernel.call(this, "putStringAttributeConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeveloperOnlyAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetDeveloperOnlyAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMutable() {
        software.amazon.jsii.Kernel.call(this, "resetMutable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberAttributeConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetNumberAttributeConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequired() {
        software.amazon.jsii.Kernel.call(this, "resetRequired", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringAttributeConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetStringAttributeConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraintsOutputReference getNumberAttributeConstraints() {
        return software.amazon.jsii.Kernel.get(this, "numberAttributeConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraintsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraintsOutputReference getStringAttributeConstraints() {
        return software.amazon.jsii.Kernel.get(this, "stringAttributeConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraintsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttributeDataTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "attributeDataTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeveloperOnlyAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "developerOnlyAttributeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMutableInput() {
        return software.amazon.jsii.Kernel.get(this, "mutableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints getNumberAttributeConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "numberAttributeConstraintsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequiredInput() {
        return software.amazon.jsii.Kernel.get(this, "requiredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints getStringAttributeConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "stringAttributeConstraintsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttributeDataType() {
        return software.amazon.jsii.Kernel.get(this, "attributeDataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttributeDataType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attributeDataType", java.util.Objects.requireNonNull(value, "attributeDataType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeveloperOnlyAttribute() {
        return software.amazon.jsii.Kernel.get(this, "developerOnlyAttribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeveloperOnlyAttribute(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "developerOnlyAttribute", java.util.Objects.requireNonNull(value, "developerOnlyAttribute is required"));
    }

    public void setDeveloperOnlyAttribute(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "developerOnlyAttribute", java.util.Objects.requireNonNull(value, "developerOnlyAttribute is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMutable() {
        return software.amazon.jsii.Kernel.get(this, "mutable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMutable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "mutable", java.util.Objects.requireNonNull(value, "mutable is required"));
    }

    public void setMutable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "mutable", java.util.Objects.requireNonNull(value, "mutable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequired() {
        return software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequired(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "required", java.util.Objects.requireNonNull(value, "required is required"));
    }

    public void setRequired(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "required", java.util.Objects.requireNonNull(value, "required is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchema value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

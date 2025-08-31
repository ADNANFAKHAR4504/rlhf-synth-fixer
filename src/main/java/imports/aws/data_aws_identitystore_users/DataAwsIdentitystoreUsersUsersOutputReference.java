package imports.aws.data_aws_identitystore_users;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.683Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUsers.DataAwsIdentitystoreUsersUsersOutputReference")
public class DataAwsIdentitystoreUsersUsersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIdentitystoreUsersUsersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreUsersUsersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsIdentitystoreUsersUsersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersAddressesList getAddresses() {
        return software.amazon.jsii.Kernel.get(this, "addresses", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersAddressesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersEmailsList getEmails() {
        return software.amazon.jsii.Kernel.get(this, "emails", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersEmailsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersExternalIdsList getExternalIds() {
        return software.amazon.jsii.Kernel.get(this, "externalIds", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersExternalIdsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreId() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocale() {
        return software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersNameList getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersNameList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNickname() {
        return software.amazon.jsii.Kernel.get(this, "nickname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersPhoneNumbersList getPhoneNumbers() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumbers", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsersPhoneNumbersList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredLanguage() {
        return software.amazon.jsii.Kernel.get(this, "preferredLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileUrl() {
        return software.amazon.jsii.Kernel.get(this, "profileUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimezone() {
        return software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserId() {
        return software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserName() {
        return software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserType() {
        return software.amazon.jsii.Kernel.get(this, "userType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsers getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsers.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_users.DataAwsIdentitystoreUsersUsers value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

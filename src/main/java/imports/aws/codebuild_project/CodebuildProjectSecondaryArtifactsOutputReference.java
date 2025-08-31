package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSecondaryArtifactsOutputReference")
public class CodebuildProjectSecondaryArtifactsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectSecondaryArtifactsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectSecondaryArtifactsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodebuildProjectSecondaryArtifactsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetBucketOwnerAccess() {
        software.amazon.jsii.Kernel.call(this, "resetBucketOwnerAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionDisabled() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionDisabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocation() {
        software.amazon.jsii.Kernel.call(this, "resetLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamespaceType() {
        software.amazon.jsii.Kernel.call(this, "resetNamespaceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrideArtifactName() {
        software.amazon.jsii.Kernel.call(this, "resetOverrideArtifactName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPackaging() {
        software.amazon.jsii.Kernel.call(this, "resetPackaging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPath() {
        software.amazon.jsii.Kernel.call(this, "resetPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArtifactIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "artifactIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwnerAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionDisabledInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionDisabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "locationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOverrideArtifactNameInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideArtifactNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPackagingInput() {
        return software.amazon.jsii.Kernel.get(this, "packagingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArtifactIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "artifactIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArtifactIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "artifactIdentifier", java.util.Objects.requireNonNull(value, "artifactIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketOwnerAccess() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwnerAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketOwnerAccess(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketOwnerAccess", java.util.Objects.requireNonNull(value, "bucketOwnerAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncryptionDisabled() {
        return software.amazon.jsii.Kernel.get(this, "encryptionDisabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncryptionDisabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encryptionDisabled", java.util.Objects.requireNonNull(value, "encryptionDisabled is required"));
    }

    public void setEncryptionDisabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encryptionDisabled", java.util.Objects.requireNonNull(value, "encryptionDisabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocation() {
        return software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "location", java.util.Objects.requireNonNull(value, "location is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespaceType() {
        return software.amazon.jsii.Kernel.get(this, "namespaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespaceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespaceType", java.util.Objects.requireNonNull(value, "namespaceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOverrideArtifactName() {
        return software.amazon.jsii.Kernel.get(this, "overrideArtifactName", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOverrideArtifactName(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "overrideArtifactName", java.util.Objects.requireNonNull(value, "overrideArtifactName is required"));
    }

    public void setOverrideArtifactName(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "overrideArtifactName", java.util.Objects.requireNonNull(value, "overrideArtifactName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPackaging() {
        return software.amazon.jsii.Kernel.get(this, "packaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPackaging(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "packaging", java.util.Objects.requireNonNull(value, "packaging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "path", java.util.Objects.requireNonNull(value, "path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSecondaryArtifacts value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

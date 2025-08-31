package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.384Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference")
public class Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putArchitecture(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putArchitecture", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEpoch(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEpoch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilePath(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilePath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesName> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelease(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelease", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceLambdaLayerArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceLambdaLayerArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceLayerHash(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceLayerHash", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVersion(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVersion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEpoch() {
        software.amazon.jsii.Kernel.call(this, "resetEpoch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilePath() {
        software.amazon.jsii.Kernel.call(this, "resetFilePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelease() {
        software.amazon.jsii.Kernel.call(this, "resetRelease", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceLambdaLayerArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceLambdaLayerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceLayerHash() {
        software.amazon.jsii.Kernel.call(this, "resetSourceLayerHash", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList getArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpochList getEpoch() {
        return software.amazon.jsii.Kernel.get(this, "epoch", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpochList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList getFilePath() {
        return software.amazon.jsii.Kernel.get(this, "filePath", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesNameList getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList getRelease() {
        return software.amazon.jsii.Kernel.get(this, "release", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList getSourceLambdaLayerArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceLambdaLayerArn", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList getSourceLayerHash() {
        return software.amazon.jsii.Kernel.get(this, "sourceLayerHash", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersionList getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "architectureInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEpochInput() {
        return software.amazon.jsii.Kernel.get(this, "epochInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilePathInput() {
        return software.amazon.jsii.Kernel.get(this, "filePathInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReleaseInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceLambdaLayerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceLambdaLayerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceLayerHashInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceLayerHashInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackages value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

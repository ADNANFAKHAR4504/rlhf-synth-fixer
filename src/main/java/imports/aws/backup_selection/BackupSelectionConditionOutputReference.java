package imports.aws.backup_selection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupSelection.BackupSelectionConditionOutputReference")
public class BackupSelectionConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BackupSelectionConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupSelectionConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BackupSelectionConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putStringEquals(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringEquals>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringEquals> __cast_cd4240 = (java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringEquals>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_selection.BackupSelectionConditionStringEquals __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStringEquals", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringLike(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringLike>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringLike> __cast_cd4240 = (java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringLike>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_selection.BackupSelectionConditionStringLike __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStringLike", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringNotEquals(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotEquals>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotEquals> __cast_cd4240 = (java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotEquals>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_selection.BackupSelectionConditionStringNotEquals __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStringNotEquals", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringNotLike(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotLike>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotLike> __cast_cd4240 = (java.util.List<imports.aws.backup_selection.BackupSelectionConditionStringNotLike>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_selection.BackupSelectionConditionStringNotLike __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStringNotLike", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetStringEquals() {
        software.amazon.jsii.Kernel.call(this, "resetStringEquals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringLike() {
        software.amazon.jsii.Kernel.call(this, "resetStringLike", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringNotEquals() {
        software.amazon.jsii.Kernel.call(this, "resetStringNotEquals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringNotLike() {
        software.amazon.jsii.Kernel.call(this, "resetStringNotLike", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_selection.BackupSelectionConditionStringEqualsList getStringEquals() {
        return software.amazon.jsii.Kernel.get(this, "stringEquals", software.amazon.jsii.NativeType.forClass(imports.aws.backup_selection.BackupSelectionConditionStringEqualsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_selection.BackupSelectionConditionStringLikeList getStringLike() {
        return software.amazon.jsii.Kernel.get(this, "stringLike", software.amazon.jsii.NativeType.forClass(imports.aws.backup_selection.BackupSelectionConditionStringLikeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_selection.BackupSelectionConditionStringNotEqualsList getStringNotEquals() {
        return software.amazon.jsii.Kernel.get(this, "stringNotEquals", software.amazon.jsii.NativeType.forClass(imports.aws.backup_selection.BackupSelectionConditionStringNotEqualsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_selection.BackupSelectionConditionStringNotLikeList getStringNotLike() {
        return software.amazon.jsii.Kernel.get(this, "stringNotLike", software.amazon.jsii.NativeType.forClass(imports.aws.backup_selection.BackupSelectionConditionStringNotLikeList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStringEqualsInput() {
        return software.amazon.jsii.Kernel.get(this, "stringEqualsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStringLikeInput() {
        return software.amazon.jsii.Kernel.get(this, "stringLikeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStringNotEqualsInput() {
        return software.amazon.jsii.Kernel.get(this, "stringNotEqualsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStringNotLikeInput() {
        return software.amazon.jsii.Kernel.get(this, "stringNotLikeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.backup_selection.BackupSelectionCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

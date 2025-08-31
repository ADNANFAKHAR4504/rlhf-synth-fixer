package imports.aws.m2_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.846Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Environment.M2EnvironmentStorageConfigurationOutputReference")
public class M2EnvironmentStorageConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected M2EnvironmentStorageConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected M2EnvironmentStorageConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public M2EnvironmentStorageConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putEfs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfs> __cast_cd4240 = (java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEfs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFsx(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsx>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsx> __cast_cd4240 = (java.util.List<imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsx>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsx __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFsx", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEfs() {
        software.amazon.jsii.Kernel.call(this, "resetEfs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFsx() {
        software.amazon.jsii.Kernel.call(this, "resetFsx", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfsList getEfs() {
        return software.amazon.jsii.Kernel.get(this, "efs", software.amazon.jsii.NativeType.forClass(imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsxList getFsx() {
        return software.amazon.jsii.Kernel.get(this, "fsx", software.amazon.jsii.NativeType.forClass(imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsxList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEfsInput() {
        return software.amazon.jsii.Kernel.get(this, "efsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFsxInput() {
        return software.amazon.jsii.Kernel.get(this, "fsxInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.m2_environment.M2EnvironmentStorageConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

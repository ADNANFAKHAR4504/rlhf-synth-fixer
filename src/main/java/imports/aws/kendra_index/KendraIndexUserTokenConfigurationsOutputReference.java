package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.435Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexUserTokenConfigurationsOutputReference")
public class KendraIndexUserTokenConfigurationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexUserTokenConfigurationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexUserTokenConfigurationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraIndexUserTokenConfigurationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putJsonTokenTypeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putJsonTokenTypeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJwtTokenTypeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putJwtTokenTypeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetJsonTokenTypeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetJsonTokenTypeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJwtTokenTypeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetJwtTokenTypeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJsonTokenTypeConfigurationOutputReference getJsonTokenTypeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "jsonTokenTypeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJsonTokenTypeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference getJwtTokenTypeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "jwtTokenTypeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration getJsonTokenTypeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "jsonTokenTypeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration getJwtTokenTypeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "jwtTokenTypeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurations getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurations.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

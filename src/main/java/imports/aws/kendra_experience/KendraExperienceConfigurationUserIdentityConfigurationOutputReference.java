package imports.aws.kendra_experience;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.433Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraExperience.KendraExperienceConfigurationUserIdentityConfigurationOutputReference")
public class KendraExperienceConfigurationUserIdentityConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraExperienceConfigurationUserIdentityConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraExperienceConfigurationUserIdentityConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraExperienceConfigurationUserIdentityConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityAttributeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "identityAttributeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityAttributeName() {
        return software.amazon.jsii.Kernel.get(this, "identityAttributeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityAttributeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityAttributeName", java.util.Objects.requireNonNull(value, "identityAttributeName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

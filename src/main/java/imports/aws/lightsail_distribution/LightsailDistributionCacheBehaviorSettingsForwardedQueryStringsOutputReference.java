package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference")
public class LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOption() {
        software.amazon.jsii.Kernel.call(this, "resetOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryStringsAllowedList() {
        software.amazon.jsii.Kernel.call(this, "resetQueryStringsAllowedList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "optionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getQueryStringsAllowedListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "queryStringsAllowedListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOption() {
        return software.amazon.jsii.Kernel.get(this, "option", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOption(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "option", java.util.Objects.requireNonNull(value, "option is required"));
    }

    public void setOption(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "option", java.util.Objects.requireNonNull(value, "option is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getQueryStringsAllowedList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "queryStringsAllowedList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setQueryStringsAllowedList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "queryStringsAllowedList", java.util.Objects.requireNonNull(value, "queryStringsAllowedList is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

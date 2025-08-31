package imports.aws.location_place_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.839Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.locationPlaceIndex.LocationPlaceIndexDataSourceConfigurationOutputReference")
public class LocationPlaceIndexDataSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LocationPlaceIndexDataSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LocationPlaceIndexDataSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LocationPlaceIndexDataSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIntendedUse() {
        software.amazon.jsii.Kernel.call(this, "resetIntendedUse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntendedUseInput() {
        return software.amazon.jsii.Kernel.get(this, "intendedUseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntendedUse() {
        return software.amazon.jsii.Kernel.get(this, "intendedUse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntendedUse(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "intendedUse", java.util.Objects.requireNonNull(value, "intendedUse is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.location_place_index.LocationPlaceIndexDataSourceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.location_place_index.LocationPlaceIndexDataSourceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.location_place_index.LocationPlaceIndexDataSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

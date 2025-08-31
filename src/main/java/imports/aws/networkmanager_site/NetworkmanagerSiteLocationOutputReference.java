package imports.aws.networkmanager_site;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.973Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerSite.NetworkmanagerSiteLocationOutputReference")
public class NetworkmanagerSiteLocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkmanagerSiteLocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkmanagerSiteLocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkmanagerSiteLocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLatitude() {
        software.amazon.jsii.Kernel.call(this, "resetLatitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLongitude() {
        software.amazon.jsii.Kernel.call(this, "resetLongitude", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "addressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLatitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "latitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLongitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "longitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddress() {
        return software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "address", java.util.Objects.requireNonNull(value, "address is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLatitude() {
        return software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLatitude(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "latitude", java.util.Objects.requireNonNull(value, "latitude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLongitude() {
        return software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLongitude(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "longitude", java.util.Objects.requireNonNull(value, "longitude is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkmanager_site.NetworkmanagerSiteLocation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_site.NetworkmanagerSiteLocation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkmanager_site.NetworkmanagerSiteLocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

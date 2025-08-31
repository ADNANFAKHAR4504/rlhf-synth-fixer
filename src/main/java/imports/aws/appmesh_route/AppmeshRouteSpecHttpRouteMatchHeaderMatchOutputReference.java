package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecHttpRouteMatchHeaderMatchOutputReference")
public class AppmeshRouteSpecHttpRouteMatchHeaderMatchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshRouteSpecHttpRouteMatchHeaderMatchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshRouteSpecHttpRouteMatchHeaderMatchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshRouteSpecHttpRouteMatchHeaderMatchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRange(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatchRange value) {
        software.amazon.jsii.Kernel.call(this, "putRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExact() {
        software.amazon.jsii.Kernel.call(this, "resetExact", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRange() {
        software.amazon.jsii.Kernel.call(this, "resetRange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegex() {
        software.amazon.jsii.Kernel.call(this, "resetRegex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuffix() {
        software.amazon.jsii.Kernel.call(this, "resetSuffix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference getRange() {
        return software.amazon.jsii.Kernel.get(this, "range", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatchRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExactInput() {
        return software.amazon.jsii.Kernel.get(this, "exactInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatchRange getRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "rangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatchRange.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "regexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuffixInput() {
        return software.amazon.jsii.Kernel.get(this, "suffixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExact() {
        return software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExact(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exact", java.util.Objects.requireNonNull(value, "exact is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegex() {
        return software.amazon.jsii.Kernel.get(this, "regex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "regex", java.util.Objects.requireNonNull(value, "regex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuffix() {
        return software.amazon.jsii.Kernel.get(this, "suffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuffix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "suffix", java.util.Objects.requireNonNull(value, "suffix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeaderMatch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

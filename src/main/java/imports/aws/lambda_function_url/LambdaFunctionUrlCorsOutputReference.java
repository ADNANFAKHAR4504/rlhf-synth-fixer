package imports.aws.lambda_function_url;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.506Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunctionUrl.LambdaFunctionUrlCorsOutputReference")
public class LambdaFunctionUrlCorsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaFunctionUrlCorsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaFunctionUrlCorsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaFunctionUrlCorsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetAllowCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetAllowHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowMethods() {
        software.amazon.jsii.Kernel.call(this, "resetAllowMethods", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowOrigins() {
        software.amazon.jsii.Kernel.call(this, "resetAllowOrigins", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExposeHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetExposeHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxAge() {
        software.amazon.jsii.Kernel.call(this, "resetMaxAge", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "allowCredentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowHeadersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowHeadersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowMethodsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowMethodsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowOriginsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowOriginsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExposeHeadersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "exposeHeadersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxAgeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxAgeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowCredentials() {
        return software.amazon.jsii.Kernel.get(this, "allowCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowCredentials(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowCredentials", java.util.Objects.requireNonNull(value, "allowCredentials is required"));
    }

    public void setAllowCredentials(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowCredentials", java.util.Objects.requireNonNull(value, "allowCredentials is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowHeaders() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowHeaders(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowHeaders", java.util.Objects.requireNonNull(value, "allowHeaders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowMethods() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowMethods", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowMethods(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowMethods", java.util.Objects.requireNonNull(value, "allowMethods is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowOrigins() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowOrigins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowOrigins(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowOrigins", java.util.Objects.requireNonNull(value, "allowOrigins is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExposeHeaders() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "exposeHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExposeHeaders(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "exposeHeaders", java.util.Objects.requireNonNull(value, "exposeHeaders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxAge() {
        return software.amazon.jsii.Kernel.get(this, "maxAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxAge(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxAge", java.util.Objects.requireNonNull(value, "maxAge is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function_url.LambdaFunctionUrlCors getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function_url.LambdaFunctionUrlCors.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_function_url.LambdaFunctionUrlCors value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.270Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference")
public class CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBody(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBody>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBody> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBody>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBody __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBody", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeader> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryString(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryString>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryString> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryString>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryString __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putQueryString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBody() {
        software.amazon.jsii.Kernel.call(this, "resetBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryString() {
        software.amazon.jsii.Kernel.call(this, "resetQueryString", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBodyList getBody() {
        return software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersBodyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeaderList getHeader() {
        return software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryStringList getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersQueryStringList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "bodyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "headerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}

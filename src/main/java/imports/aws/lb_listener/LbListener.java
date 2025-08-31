package imports.aws.lb_listener;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener aws_lb_listener}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.525Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListener")
public class LbListener extends com.hashicorp.cdktf.TerraformResource {

    protected LbListener(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbListener(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lb_listener.LbListener.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener aws_lb_listener} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LbListener(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LbListener resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbListener to import. This parameter is required.
     * @param importFromId The id of the existing LbListener that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LbListener to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_listener.LbListener.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LbListener resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbListener to import. This parameter is required.
     * @param importFromId The id of the existing LbListener that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_listener.LbListener.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDefaultAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lb_listener.LbListenerDefaultAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lb_listener.LbListenerDefaultAction> __cast_cd4240 = (java.util.List<imports.aws.lb_listener.LbListenerDefaultAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lb_listener.LbListenerDefaultAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDefaultAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMutualAuthentication(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerMutualAuthentication value) {
        software.amazon.jsii.Kernel.call(this, "putMutualAuthentication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlpnPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAlpnPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMutualAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetMutualAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznTlsCipherSuiteHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznTlsCipherSuiteHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpRequestXAmznTlsVersionHeaderName() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpRequestXAmznTlsVersionHeaderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlAllowCredentialsHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlAllowCredentialsHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlAllowHeadersHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlAllowHeadersHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlAllowMethodsHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlAllowMethodsHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlAllowOriginHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlAllowOriginHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlExposeHeadersHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlExposeHeadersHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseAccessControlMaxAgeHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseAccessControlMaxAgeHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseContentSecurityPolicyHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseContentSecurityPolicyHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseServerEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseServerEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseStrictTransportSecurityHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseStrictTransportSecurityHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseXContentTypeOptionsHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseXContentTypeOptionsHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingHttpResponseXFrameOptionsHeaderValue() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingHttpResponseXFrameOptionsHeaderValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetSslPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTcpIdleTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerDefaultActionList getDefaultAction() {
        return software.amazon.jsii.Kernel.get(this, "defaultAction", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerMutualAuthenticationOutputReference getMutualAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "mutualAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerMutualAuthenticationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener.LbListenerTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlpnPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "alpnPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDefaultActionInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerMutualAuthentication getMutualAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "mutualAuthenticationInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerMutualAuthentication.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertLeafHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertValidityHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznTlsCipherSuiteHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsCipherSuiteHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznTlsVersionHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsVersionHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowCredentialsHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowCredentialsHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowHeadersHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowHeadersHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowMethodsHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowMethodsHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowOriginHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowOriginHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlExposeHeadersHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlExposeHeadersHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlMaxAgeHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlMaxAgeHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseContentSecurityPolicyHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseContentSecurityPolicyHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRoutingHttpResponseServerEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseServerEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseStrictTransportSecurityHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseStrictTransportSecurityHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseXContentTypeOptionsHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseXContentTypeOptionsHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseXFrameOptionsHeaderValueInput() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseXFrameOptionsHeaderValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "sslPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTcpIdleTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlpnPolicy() {
        return software.amazon.jsii.Kernel.get(this, "alpnPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlpnPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alpnPolicy", java.util.Objects.requireNonNull(value, "alpnPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateArn", java.util.Objects.requireNonNull(value, "certificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancerArn() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoadBalancerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loadBalancerArn", java.util.Objects.requireNonNull(value, "loadBalancerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsCipherSuiteHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznTlsCipherSuiteHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznTlsCipherSuiteHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznTlsCipherSuiteHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpRequestXAmznTlsVersionHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsVersionHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpRequestXAmznTlsVersionHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpRequestXAmznTlsVersionHeaderName", java.util.Objects.requireNonNull(value, "routingHttpRequestXAmznTlsVersionHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowCredentialsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlAllowCredentialsHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlAllowCredentialsHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlAllowCredentialsHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlAllowHeadersHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowHeadersHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlAllowHeadersHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlAllowHeadersHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlAllowHeadersHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlAllowMethodsHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowMethodsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlAllowMethodsHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlAllowMethodsHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlAllowMethodsHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlAllowOriginHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowOriginHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlAllowOriginHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlAllowOriginHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlAllowOriginHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlExposeHeadersHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlExposeHeadersHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlExposeHeadersHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlExposeHeadersHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlExposeHeadersHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseAccessControlMaxAgeHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlMaxAgeHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseAccessControlMaxAgeHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseAccessControlMaxAgeHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseAccessControlMaxAgeHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseContentSecurityPolicyHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseContentSecurityPolicyHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseContentSecurityPolicyHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseContentSecurityPolicyHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseContentSecurityPolicyHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRoutingHttpResponseServerEnabled() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseServerEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRoutingHttpResponseServerEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseServerEnabled", java.util.Objects.requireNonNull(value, "routingHttpResponseServerEnabled is required"));
    }

    public void setRoutingHttpResponseServerEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseServerEnabled", java.util.Objects.requireNonNull(value, "routingHttpResponseServerEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseStrictTransportSecurityHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseStrictTransportSecurityHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseStrictTransportSecurityHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseStrictTransportSecurityHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseStrictTransportSecurityHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseXContentTypeOptionsHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseXContentTypeOptionsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseXContentTypeOptionsHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseXContentTypeOptionsHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseXContentTypeOptionsHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingHttpResponseXFrameOptionsHeaderValue() {
        return software.amazon.jsii.Kernel.get(this, "routingHttpResponseXFrameOptionsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingHttpResponseXFrameOptionsHeaderValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingHttpResponseXFrameOptionsHeaderValue", java.util.Objects.requireNonNull(value, "routingHttpResponseXFrameOptionsHeaderValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslPolicy() {
        return software.amazon.jsii.Kernel.get(this, "sslPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslPolicy", java.util.Objects.requireNonNull(value, "sslPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTcpIdleTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTcpIdleTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tcpIdleTimeoutSeconds", java.util.Objects.requireNonNull(value, "tcpIdleTimeoutSeconds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lb_listener.LbListener}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lb_listener.LbListener> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.lb_listener.LbListenerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lb_listener.LbListenerConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * default_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
         * <p>
         * @return {@code this}
         * @param defaultAction default_action block. This parameter is required.
         */
        public Builder defaultAction(final com.hashicorp.cdktf.IResolvable defaultAction) {
            this.config.defaultAction(defaultAction);
            return this;
        }
        /**
         * default_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
         * <p>
         * @return {@code this}
         * @param defaultAction default_action block. This parameter is required.
         */
        public Builder defaultAction(final java.util.List<? extends imports.aws.lb_listener.LbListenerDefaultAction> defaultAction) {
            this.config.defaultAction(defaultAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}.
         * <p>
         * @return {@code this}
         * @param loadBalancerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}. This parameter is required.
         */
        public Builder loadBalancerArn(final java.lang.String loadBalancerArn) {
            this.config.loadBalancerArn(loadBalancerArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.
         * <p>
         * @return {@code this}
         * @param alpnPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}. This parameter is required.
         */
        public Builder alpnPolicy(final java.lang.String alpnPolicy) {
            this.config.alpnPolicy(alpnPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.
         * <p>
         * @return {@code this}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}. This parameter is required.
         */
        public Builder certificateArn(final java.lang.String certificateArn) {
            this.config.certificateArn(certificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * mutual_authentication block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
         * <p>
         * @return {@code this}
         * @param mutualAuthentication mutual_authentication block. This parameter is required.
         */
        public Builder mutualAuthentication(final imports.aws.lb_listener.LbListenerMutualAuthentication mutualAuthentication) {
            this.config.mutualAuthentication(mutualAuthentication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.String protocol) {
            this.config.protocol(protocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertHeaderName(routingHttpRequestXAmznMtlsClientcertHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertIssuerHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertIssuerHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertIssuerHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName(routingHttpRequestXAmznMtlsClientcertIssuerHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertLeafHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertLeafHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertLeafHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertLeafHeaderName(routingHttpRequestXAmznMtlsClientcertLeafHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName(routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertSubjectHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertSubjectHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertSubjectHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName(routingHttpRequestXAmznMtlsClientcertSubjectHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznMtlsClientcertValidityHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznMtlsClientcertValidityHeaderName(final java.lang.String routingHttpRequestXAmznMtlsClientcertValidityHeaderName) {
            this.config.routingHttpRequestXAmznMtlsClientcertValidityHeaderName(routingHttpRequestXAmznMtlsClientcertValidityHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznTlsCipherSuiteHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznTlsCipherSuiteHeaderName(final java.lang.String routingHttpRequestXAmznTlsCipherSuiteHeaderName) {
            this.config.routingHttpRequestXAmznTlsCipherSuiteHeaderName(routingHttpRequestXAmznTlsCipherSuiteHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.
         * <p>
         * @return {@code this}
         * @param routingHttpRequestXAmznTlsVersionHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}. This parameter is required.
         */
        public Builder routingHttpRequestXAmznTlsVersionHeaderName(final java.lang.String routingHttpRequestXAmznTlsVersionHeaderName) {
            this.config.routingHttpRequestXAmznTlsVersionHeaderName(routingHttpRequestXAmznTlsVersionHeaderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlAllowCredentialsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlAllowCredentialsHeaderValue(final java.lang.String routingHttpResponseAccessControlAllowCredentialsHeaderValue) {
            this.config.routingHttpResponseAccessControlAllowCredentialsHeaderValue(routingHttpResponseAccessControlAllowCredentialsHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlAllowHeadersHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlAllowHeadersHeaderValue(final java.lang.String routingHttpResponseAccessControlAllowHeadersHeaderValue) {
            this.config.routingHttpResponseAccessControlAllowHeadersHeaderValue(routingHttpResponseAccessControlAllowHeadersHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlAllowMethodsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlAllowMethodsHeaderValue(final java.lang.String routingHttpResponseAccessControlAllowMethodsHeaderValue) {
            this.config.routingHttpResponseAccessControlAllowMethodsHeaderValue(routingHttpResponseAccessControlAllowMethodsHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlAllowOriginHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlAllowOriginHeaderValue(final java.lang.String routingHttpResponseAccessControlAllowOriginHeaderValue) {
            this.config.routingHttpResponseAccessControlAllowOriginHeaderValue(routingHttpResponseAccessControlAllowOriginHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlExposeHeadersHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlExposeHeadersHeaderValue(final java.lang.String routingHttpResponseAccessControlExposeHeadersHeaderValue) {
            this.config.routingHttpResponseAccessControlExposeHeadersHeaderValue(routingHttpResponseAccessControlExposeHeadersHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseAccessControlMaxAgeHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseAccessControlMaxAgeHeaderValue(final java.lang.String routingHttpResponseAccessControlMaxAgeHeaderValue) {
            this.config.routingHttpResponseAccessControlMaxAgeHeaderValue(routingHttpResponseAccessControlMaxAgeHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseContentSecurityPolicyHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseContentSecurityPolicyHeaderValue(final java.lang.String routingHttpResponseContentSecurityPolicyHeaderValue) {
            this.config.routingHttpResponseContentSecurityPolicyHeaderValue(routingHttpResponseContentSecurityPolicyHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseServerEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}. This parameter is required.
         */
        public Builder routingHttpResponseServerEnabled(final java.lang.Boolean routingHttpResponseServerEnabled) {
            this.config.routingHttpResponseServerEnabled(routingHttpResponseServerEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseServerEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}. This parameter is required.
         */
        public Builder routingHttpResponseServerEnabled(final com.hashicorp.cdktf.IResolvable routingHttpResponseServerEnabled) {
            this.config.routingHttpResponseServerEnabled(routingHttpResponseServerEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseStrictTransportSecurityHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseStrictTransportSecurityHeaderValue(final java.lang.String routingHttpResponseStrictTransportSecurityHeaderValue) {
            this.config.routingHttpResponseStrictTransportSecurityHeaderValue(routingHttpResponseStrictTransportSecurityHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseXContentTypeOptionsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseXContentTypeOptionsHeaderValue(final java.lang.String routingHttpResponseXContentTypeOptionsHeaderValue) {
            this.config.routingHttpResponseXContentTypeOptionsHeaderValue(routingHttpResponseXContentTypeOptionsHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.
         * <p>
         * @return {@code this}
         * @param routingHttpResponseXFrameOptionsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}. This parameter is required.
         */
        public Builder routingHttpResponseXFrameOptionsHeaderValue(final java.lang.String routingHttpResponseXFrameOptionsHeaderValue) {
            this.config.routingHttpResponseXFrameOptionsHeaderValue(routingHttpResponseXFrameOptionsHeaderValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.
         * <p>
         * @return {@code this}
         * @param sslPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}. This parameter is required.
         */
        public Builder sslPolicy(final java.lang.String sslPolicy) {
            this.config.sslPolicy(sslPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.
         * <p>
         * @return {@code this}
         * @param tcpIdleTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}. This parameter is required.
         */
        public Builder tcpIdleTimeoutSeconds(final java.lang.Number tcpIdleTimeoutSeconds) {
            this.config.tcpIdleTimeoutSeconds(tcpIdleTimeoutSeconds);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lb_listener.LbListenerTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lb_listener.LbListener}.
         */
        @Override
        public imports.aws.lb_listener.LbListener build() {
            return new imports.aws.lb_listener.LbListener(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}

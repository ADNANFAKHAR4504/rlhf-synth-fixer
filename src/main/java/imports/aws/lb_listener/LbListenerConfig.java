package imports.aws.lb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListenerConfig")
@software.amazon.jsii.Jsii.Proxy(LbListenerConfig.Jsii$Proxy.class)
public interface LbListenerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * default_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDefaultAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancerArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlpnPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * mutual_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerMutualAuthentication getMutualAuthentication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpRequestXAmznTlsVersionHeaderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowHeadersHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowMethodsHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlAllowOriginHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlExposeHeadersHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseAccessControlMaxAgeHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseContentSecurityPolicyHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRoutingHttpResponseServerEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseStrictTransportSecurityHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseXContentTypeOptionsHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingHttpResponseXFrameOptionsHeaderValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTcpIdleTimeoutSeconds() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerConfig> {
        java.lang.Object defaultAction;
        java.lang.String loadBalancerArn;
        java.lang.String alpnPolicy;
        java.lang.String certificateArn;
        java.lang.String id;
        imports.aws.lb_listener.LbListenerMutualAuthentication mutualAuthentication;
        java.lang.Number port;
        java.lang.String protocol;
        java.lang.String routingHttpRequestXAmznMtlsClientcertHeaderName;
        java.lang.String routingHttpRequestXAmznMtlsClientcertIssuerHeaderName;
        java.lang.String routingHttpRequestXAmznMtlsClientcertLeafHeaderName;
        java.lang.String routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName;
        java.lang.String routingHttpRequestXAmznMtlsClientcertSubjectHeaderName;
        java.lang.String routingHttpRequestXAmznMtlsClientcertValidityHeaderName;
        java.lang.String routingHttpRequestXAmznTlsCipherSuiteHeaderName;
        java.lang.String routingHttpRequestXAmznTlsVersionHeaderName;
        java.lang.String routingHttpResponseAccessControlAllowCredentialsHeaderValue;
        java.lang.String routingHttpResponseAccessControlAllowHeadersHeaderValue;
        java.lang.String routingHttpResponseAccessControlAllowMethodsHeaderValue;
        java.lang.String routingHttpResponseAccessControlAllowOriginHeaderValue;
        java.lang.String routingHttpResponseAccessControlExposeHeadersHeaderValue;
        java.lang.String routingHttpResponseAccessControlMaxAgeHeaderValue;
        java.lang.String routingHttpResponseContentSecurityPolicyHeaderValue;
        java.lang.Object routingHttpResponseServerEnabled;
        java.lang.String routingHttpResponseStrictTransportSecurityHeaderValue;
        java.lang.String routingHttpResponseXContentTypeOptionsHeaderValue;
        java.lang.String routingHttpResponseXFrameOptionsHeaderValue;
        java.lang.String sslPolicy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number tcpIdleTimeoutSeconds;
        imports.aws.lb_listener.LbListenerTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LbListenerConfig#getDefaultAction}
         * @param defaultAction default_action block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
         * @return {@code this}
         */
        public Builder defaultAction(com.hashicorp.cdktf.IResolvable defaultAction) {
            this.defaultAction = defaultAction;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getDefaultAction}
         * @param defaultAction default_action block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
         * @return {@code this}
         */
        public Builder defaultAction(java.util.List<? extends imports.aws.lb_listener.LbListenerDefaultAction> defaultAction) {
            this.defaultAction = defaultAction;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getLoadBalancerArn}
         * @param loadBalancerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder loadBalancerArn(java.lang.String loadBalancerArn) {
            this.loadBalancerArn = loadBalancerArn;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getAlpnPolicy}
         * @param alpnPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.
         * @return {@code this}
         */
        public Builder alpnPolicy(java.lang.String alpnPolicy) {
            this.alpnPolicy = alpnPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getCertificateArn}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.
         * @return {@code this}
         */
        public Builder certificateArn(java.lang.String certificateArn) {
            this.certificateArn = certificateArn;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getMutualAuthentication}
         * @param mutualAuthentication mutual_authentication block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
         * @return {@code this}
         */
        public Builder mutualAuthentication(imports.aws.lb_listener.LbListenerMutualAuthentication mutualAuthentication) {
            this.mutualAuthentication = mutualAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertHeaderName = routingHttpRequestXAmznMtlsClientcertHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertIssuerHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertIssuerHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertIssuerHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName = routingHttpRequestXAmznMtlsClientcertIssuerHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertLeafHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertLeafHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertLeafHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName = routingHttpRequestXAmznMtlsClientcertLeafHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName = routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertSubjectHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertSubjectHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertSubjectHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName = routingHttpRequestXAmznMtlsClientcertSubjectHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName}
         * @param routingHttpRequestXAmznMtlsClientcertValidityHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznMtlsClientcertValidityHeaderName(java.lang.String routingHttpRequestXAmznMtlsClientcertValidityHeaderName) {
            this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName = routingHttpRequestXAmznMtlsClientcertValidityHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName}
         * @param routingHttpRequestXAmznTlsCipherSuiteHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznTlsCipherSuiteHeaderName(java.lang.String routingHttpRequestXAmznTlsCipherSuiteHeaderName) {
            this.routingHttpRequestXAmznTlsCipherSuiteHeaderName = routingHttpRequestXAmznTlsCipherSuiteHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpRequestXAmznTlsVersionHeaderName}
         * @param routingHttpRequestXAmznTlsVersionHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.
         * @return {@code this}
         */
        public Builder routingHttpRequestXAmznTlsVersionHeaderName(java.lang.String routingHttpRequestXAmznTlsVersionHeaderName) {
            this.routingHttpRequestXAmznTlsVersionHeaderName = routingHttpRequestXAmznTlsVersionHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue}
         * @param routingHttpResponseAccessControlAllowCredentialsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlAllowCredentialsHeaderValue(java.lang.String routingHttpResponseAccessControlAllowCredentialsHeaderValue) {
            this.routingHttpResponseAccessControlAllowCredentialsHeaderValue = routingHttpResponseAccessControlAllowCredentialsHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlAllowHeadersHeaderValue}
         * @param routingHttpResponseAccessControlAllowHeadersHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlAllowHeadersHeaderValue(java.lang.String routingHttpResponseAccessControlAllowHeadersHeaderValue) {
            this.routingHttpResponseAccessControlAllowHeadersHeaderValue = routingHttpResponseAccessControlAllowHeadersHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlAllowMethodsHeaderValue}
         * @param routingHttpResponseAccessControlAllowMethodsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlAllowMethodsHeaderValue(java.lang.String routingHttpResponseAccessControlAllowMethodsHeaderValue) {
            this.routingHttpResponseAccessControlAllowMethodsHeaderValue = routingHttpResponseAccessControlAllowMethodsHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlAllowOriginHeaderValue}
         * @param routingHttpResponseAccessControlAllowOriginHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlAllowOriginHeaderValue(java.lang.String routingHttpResponseAccessControlAllowOriginHeaderValue) {
            this.routingHttpResponseAccessControlAllowOriginHeaderValue = routingHttpResponseAccessControlAllowOriginHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlExposeHeadersHeaderValue}
         * @param routingHttpResponseAccessControlExposeHeadersHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlExposeHeadersHeaderValue(java.lang.String routingHttpResponseAccessControlExposeHeadersHeaderValue) {
            this.routingHttpResponseAccessControlExposeHeadersHeaderValue = routingHttpResponseAccessControlExposeHeadersHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseAccessControlMaxAgeHeaderValue}
         * @param routingHttpResponseAccessControlMaxAgeHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseAccessControlMaxAgeHeaderValue(java.lang.String routingHttpResponseAccessControlMaxAgeHeaderValue) {
            this.routingHttpResponseAccessControlMaxAgeHeaderValue = routingHttpResponseAccessControlMaxAgeHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseContentSecurityPolicyHeaderValue}
         * @param routingHttpResponseContentSecurityPolicyHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseContentSecurityPolicyHeaderValue(java.lang.String routingHttpResponseContentSecurityPolicyHeaderValue) {
            this.routingHttpResponseContentSecurityPolicyHeaderValue = routingHttpResponseContentSecurityPolicyHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseServerEnabled}
         * @param routingHttpResponseServerEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
         * @return {@code this}
         */
        public Builder routingHttpResponseServerEnabled(java.lang.Boolean routingHttpResponseServerEnabled) {
            this.routingHttpResponseServerEnabled = routingHttpResponseServerEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseServerEnabled}
         * @param routingHttpResponseServerEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
         * @return {@code this}
         */
        public Builder routingHttpResponseServerEnabled(com.hashicorp.cdktf.IResolvable routingHttpResponseServerEnabled) {
            this.routingHttpResponseServerEnabled = routingHttpResponseServerEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseStrictTransportSecurityHeaderValue}
         * @param routingHttpResponseStrictTransportSecurityHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseStrictTransportSecurityHeaderValue(java.lang.String routingHttpResponseStrictTransportSecurityHeaderValue) {
            this.routingHttpResponseStrictTransportSecurityHeaderValue = routingHttpResponseStrictTransportSecurityHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseXContentTypeOptionsHeaderValue}
         * @param routingHttpResponseXContentTypeOptionsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseXContentTypeOptionsHeaderValue(java.lang.String routingHttpResponseXContentTypeOptionsHeaderValue) {
            this.routingHttpResponseXContentTypeOptionsHeaderValue = routingHttpResponseXContentTypeOptionsHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getRoutingHttpResponseXFrameOptionsHeaderValue}
         * @param routingHttpResponseXFrameOptionsHeaderValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.
         * @return {@code this}
         */
        public Builder routingHttpResponseXFrameOptionsHeaderValue(java.lang.String routingHttpResponseXFrameOptionsHeaderValue) {
            this.routingHttpResponseXFrameOptionsHeaderValue = routingHttpResponseXFrameOptionsHeaderValue;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getSslPolicy}
         * @param sslPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.
         * @return {@code this}
         */
        public Builder sslPolicy(java.lang.String sslPolicy) {
            this.sslPolicy = sslPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getTcpIdleTimeoutSeconds}
         * @param tcpIdleTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.
         * @return {@code this}
         */
        public Builder tcpIdleTimeoutSeconds(java.lang.Number tcpIdleTimeoutSeconds) {
            this.tcpIdleTimeoutSeconds = tcpIdleTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lb_listener.LbListenerTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerConfig {
        private final java.lang.Object defaultAction;
        private final java.lang.String loadBalancerArn;
        private final java.lang.String alpnPolicy;
        private final java.lang.String certificateArn;
        private final java.lang.String id;
        private final imports.aws.lb_listener.LbListenerMutualAuthentication mutualAuthentication;
        private final java.lang.Number port;
        private final java.lang.String protocol;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertHeaderName;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertIssuerHeaderName;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertLeafHeaderName;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertSubjectHeaderName;
        private final java.lang.String routingHttpRequestXAmznMtlsClientcertValidityHeaderName;
        private final java.lang.String routingHttpRequestXAmznTlsCipherSuiteHeaderName;
        private final java.lang.String routingHttpRequestXAmznTlsVersionHeaderName;
        private final java.lang.String routingHttpResponseAccessControlAllowCredentialsHeaderValue;
        private final java.lang.String routingHttpResponseAccessControlAllowHeadersHeaderValue;
        private final java.lang.String routingHttpResponseAccessControlAllowMethodsHeaderValue;
        private final java.lang.String routingHttpResponseAccessControlAllowOriginHeaderValue;
        private final java.lang.String routingHttpResponseAccessControlExposeHeadersHeaderValue;
        private final java.lang.String routingHttpResponseAccessControlMaxAgeHeaderValue;
        private final java.lang.String routingHttpResponseContentSecurityPolicyHeaderValue;
        private final java.lang.Object routingHttpResponseServerEnabled;
        private final java.lang.String routingHttpResponseStrictTransportSecurityHeaderValue;
        private final java.lang.String routingHttpResponseXContentTypeOptionsHeaderValue;
        private final java.lang.String routingHttpResponseXFrameOptionsHeaderValue;
        private final java.lang.String sslPolicy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number tcpIdleTimeoutSeconds;
        private final imports.aws.lb_listener.LbListenerTimeouts timeouts;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultAction = software.amazon.jsii.Kernel.get(this, "defaultAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.loadBalancerArn = software.amazon.jsii.Kernel.get(this, "loadBalancerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alpnPolicy = software.amazon.jsii.Kernel.get(this, "alpnPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateArn = software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mutualAuthentication = software.amazon.jsii.Kernel.get(this, "mutualAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerMutualAuthentication.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznTlsCipherSuiteHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsCipherSuiteHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpRequestXAmznTlsVersionHeaderName = software.amazon.jsii.Kernel.get(this, "routingHttpRequestXAmznTlsVersionHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlAllowCredentialsHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowCredentialsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlAllowHeadersHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowHeadersHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlAllowMethodsHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowMethodsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlAllowOriginHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlAllowOriginHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlExposeHeadersHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlExposeHeadersHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseAccessControlMaxAgeHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseAccessControlMaxAgeHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseContentSecurityPolicyHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseContentSecurityPolicyHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseServerEnabled = software.amazon.jsii.Kernel.get(this, "routingHttpResponseServerEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.routingHttpResponseStrictTransportSecurityHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseStrictTransportSecurityHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseXContentTypeOptionsHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseXContentTypeOptionsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingHttpResponseXFrameOptionsHeaderValue = software.amazon.jsii.Kernel.get(this, "routingHttpResponseXFrameOptionsHeaderValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslPolicy = software.amazon.jsii.Kernel.get(this, "sslPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tcpIdleTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerTimeouts.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultAction = java.util.Objects.requireNonNull(builder.defaultAction, "defaultAction is required");
            this.loadBalancerArn = java.util.Objects.requireNonNull(builder.loadBalancerArn, "loadBalancerArn is required");
            this.alpnPolicy = builder.alpnPolicy;
            this.certificateArn = builder.certificateArn;
            this.id = builder.id;
            this.mutualAuthentication = builder.mutualAuthentication;
            this.port = builder.port;
            this.protocol = builder.protocol;
            this.routingHttpRequestXAmznMtlsClientcertHeaderName = builder.routingHttpRequestXAmznMtlsClientcertHeaderName;
            this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName = builder.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName;
            this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName = builder.routingHttpRequestXAmznMtlsClientcertLeafHeaderName;
            this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName = builder.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName;
            this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName = builder.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName;
            this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName = builder.routingHttpRequestXAmznMtlsClientcertValidityHeaderName;
            this.routingHttpRequestXAmznTlsCipherSuiteHeaderName = builder.routingHttpRequestXAmznTlsCipherSuiteHeaderName;
            this.routingHttpRequestXAmznTlsVersionHeaderName = builder.routingHttpRequestXAmznTlsVersionHeaderName;
            this.routingHttpResponseAccessControlAllowCredentialsHeaderValue = builder.routingHttpResponseAccessControlAllowCredentialsHeaderValue;
            this.routingHttpResponseAccessControlAllowHeadersHeaderValue = builder.routingHttpResponseAccessControlAllowHeadersHeaderValue;
            this.routingHttpResponseAccessControlAllowMethodsHeaderValue = builder.routingHttpResponseAccessControlAllowMethodsHeaderValue;
            this.routingHttpResponseAccessControlAllowOriginHeaderValue = builder.routingHttpResponseAccessControlAllowOriginHeaderValue;
            this.routingHttpResponseAccessControlExposeHeadersHeaderValue = builder.routingHttpResponseAccessControlExposeHeadersHeaderValue;
            this.routingHttpResponseAccessControlMaxAgeHeaderValue = builder.routingHttpResponseAccessControlMaxAgeHeaderValue;
            this.routingHttpResponseContentSecurityPolicyHeaderValue = builder.routingHttpResponseContentSecurityPolicyHeaderValue;
            this.routingHttpResponseServerEnabled = builder.routingHttpResponseServerEnabled;
            this.routingHttpResponseStrictTransportSecurityHeaderValue = builder.routingHttpResponseStrictTransportSecurityHeaderValue;
            this.routingHttpResponseXContentTypeOptionsHeaderValue = builder.routingHttpResponseXContentTypeOptionsHeaderValue;
            this.routingHttpResponseXFrameOptionsHeaderValue = builder.routingHttpResponseXFrameOptionsHeaderValue;
            this.sslPolicy = builder.sslPolicy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tcpIdleTimeoutSeconds = builder.tcpIdleTimeoutSeconds;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getDefaultAction() {
            return this.defaultAction;
        }

        @Override
        public final java.lang.String getLoadBalancerArn() {
            return this.loadBalancerArn;
        }

        @Override
        public final java.lang.String getAlpnPolicy() {
            return this.alpnPolicy;
        }

        @Override
        public final java.lang.String getCertificateArn() {
            return this.certificateArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerMutualAuthentication getMutualAuthentication() {
            return this.mutualAuthentication;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName() {
            return this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName() {
            return this.routingHttpRequestXAmznTlsCipherSuiteHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpRequestXAmznTlsVersionHeaderName() {
            return this.routingHttpRequestXAmznTlsVersionHeaderName;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue() {
            return this.routingHttpResponseAccessControlAllowCredentialsHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlAllowHeadersHeaderValue() {
            return this.routingHttpResponseAccessControlAllowHeadersHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlAllowMethodsHeaderValue() {
            return this.routingHttpResponseAccessControlAllowMethodsHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlAllowOriginHeaderValue() {
            return this.routingHttpResponseAccessControlAllowOriginHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlExposeHeadersHeaderValue() {
            return this.routingHttpResponseAccessControlExposeHeadersHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseAccessControlMaxAgeHeaderValue() {
            return this.routingHttpResponseAccessControlMaxAgeHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseContentSecurityPolicyHeaderValue() {
            return this.routingHttpResponseContentSecurityPolicyHeaderValue;
        }

        @Override
        public final java.lang.Object getRoutingHttpResponseServerEnabled() {
            return this.routingHttpResponseServerEnabled;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseStrictTransportSecurityHeaderValue() {
            return this.routingHttpResponseStrictTransportSecurityHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseXContentTypeOptionsHeaderValue() {
            return this.routingHttpResponseXContentTypeOptionsHeaderValue;
        }

        @Override
        public final java.lang.String getRoutingHttpResponseXFrameOptionsHeaderValue() {
            return this.routingHttpResponseXFrameOptionsHeaderValue;
        }

        @Override
        public final java.lang.String getSslPolicy() {
            return this.sslPolicy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Number getTcpIdleTimeoutSeconds() {
            return this.tcpIdleTimeoutSeconds;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultAction", om.valueToTree(this.getDefaultAction()));
            data.set("loadBalancerArn", om.valueToTree(this.getLoadBalancerArn()));
            if (this.getAlpnPolicy() != null) {
                data.set("alpnPolicy", om.valueToTree(this.getAlpnPolicy()));
            }
            if (this.getCertificateArn() != null) {
                data.set("certificateArn", om.valueToTree(this.getCertificateArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMutualAuthentication() != null) {
                data.set("mutualAuthentication", om.valueToTree(this.getMutualAuthentication()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertIssuerHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertLeafHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertSubjectHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName() != null) {
                data.set("routingHttpRequestXAmznMtlsClientcertValidityHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName() != null) {
                data.set("routingHttpRequestXAmznTlsCipherSuiteHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznTlsCipherSuiteHeaderName()));
            }
            if (this.getRoutingHttpRequestXAmznTlsVersionHeaderName() != null) {
                data.set("routingHttpRequestXAmznTlsVersionHeaderName", om.valueToTree(this.getRoutingHttpRequestXAmznTlsVersionHeaderName()));
            }
            if (this.getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlAllowCredentialsHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlAllowCredentialsHeaderValue()));
            }
            if (this.getRoutingHttpResponseAccessControlAllowHeadersHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlAllowHeadersHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlAllowHeadersHeaderValue()));
            }
            if (this.getRoutingHttpResponseAccessControlAllowMethodsHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlAllowMethodsHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlAllowMethodsHeaderValue()));
            }
            if (this.getRoutingHttpResponseAccessControlAllowOriginHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlAllowOriginHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlAllowOriginHeaderValue()));
            }
            if (this.getRoutingHttpResponseAccessControlExposeHeadersHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlExposeHeadersHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlExposeHeadersHeaderValue()));
            }
            if (this.getRoutingHttpResponseAccessControlMaxAgeHeaderValue() != null) {
                data.set("routingHttpResponseAccessControlMaxAgeHeaderValue", om.valueToTree(this.getRoutingHttpResponseAccessControlMaxAgeHeaderValue()));
            }
            if (this.getRoutingHttpResponseContentSecurityPolicyHeaderValue() != null) {
                data.set("routingHttpResponseContentSecurityPolicyHeaderValue", om.valueToTree(this.getRoutingHttpResponseContentSecurityPolicyHeaderValue()));
            }
            if (this.getRoutingHttpResponseServerEnabled() != null) {
                data.set("routingHttpResponseServerEnabled", om.valueToTree(this.getRoutingHttpResponseServerEnabled()));
            }
            if (this.getRoutingHttpResponseStrictTransportSecurityHeaderValue() != null) {
                data.set("routingHttpResponseStrictTransportSecurityHeaderValue", om.valueToTree(this.getRoutingHttpResponseStrictTransportSecurityHeaderValue()));
            }
            if (this.getRoutingHttpResponseXContentTypeOptionsHeaderValue() != null) {
                data.set("routingHttpResponseXContentTypeOptionsHeaderValue", om.valueToTree(this.getRoutingHttpResponseXContentTypeOptionsHeaderValue()));
            }
            if (this.getRoutingHttpResponseXFrameOptionsHeaderValue() != null) {
                data.set("routingHttpResponseXFrameOptionsHeaderValue", om.valueToTree(this.getRoutingHttpResponseXFrameOptionsHeaderValue()));
            }
            if (this.getSslPolicy() != null) {
                data.set("sslPolicy", om.valueToTree(this.getSslPolicy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTcpIdleTimeoutSeconds() != null) {
                data.set("tcpIdleTimeoutSeconds", om.valueToTree(this.getTcpIdleTimeoutSeconds()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListener.LbListenerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerConfig.Jsii$Proxy that = (LbListenerConfig.Jsii$Proxy) o;

            if (!defaultAction.equals(that.defaultAction)) return false;
            if (!loadBalancerArn.equals(that.loadBalancerArn)) return false;
            if (this.alpnPolicy != null ? !this.alpnPolicy.equals(that.alpnPolicy) : that.alpnPolicy != null) return false;
            if (this.certificateArn != null ? !this.certificateArn.equals(that.certificateArn) : that.certificateArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.mutualAuthentication != null ? !this.mutualAuthentication.equals(that.mutualAuthentication) : that.mutualAuthentication != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertHeaderName) : that.routingHttpRequestXAmznMtlsClientcertHeaderName != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName) : that.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertLeafHeaderName) : that.routingHttpRequestXAmznMtlsClientcertLeafHeaderName != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName) : that.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName) : that.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName != null) return false;
            if (this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName != null ? !this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName.equals(that.routingHttpRequestXAmznMtlsClientcertValidityHeaderName) : that.routingHttpRequestXAmznMtlsClientcertValidityHeaderName != null) return false;
            if (this.routingHttpRequestXAmznTlsCipherSuiteHeaderName != null ? !this.routingHttpRequestXAmznTlsCipherSuiteHeaderName.equals(that.routingHttpRequestXAmznTlsCipherSuiteHeaderName) : that.routingHttpRequestXAmznTlsCipherSuiteHeaderName != null) return false;
            if (this.routingHttpRequestXAmznTlsVersionHeaderName != null ? !this.routingHttpRequestXAmznTlsVersionHeaderName.equals(that.routingHttpRequestXAmznTlsVersionHeaderName) : that.routingHttpRequestXAmznTlsVersionHeaderName != null) return false;
            if (this.routingHttpResponseAccessControlAllowCredentialsHeaderValue != null ? !this.routingHttpResponseAccessControlAllowCredentialsHeaderValue.equals(that.routingHttpResponseAccessControlAllowCredentialsHeaderValue) : that.routingHttpResponseAccessControlAllowCredentialsHeaderValue != null) return false;
            if (this.routingHttpResponseAccessControlAllowHeadersHeaderValue != null ? !this.routingHttpResponseAccessControlAllowHeadersHeaderValue.equals(that.routingHttpResponseAccessControlAllowHeadersHeaderValue) : that.routingHttpResponseAccessControlAllowHeadersHeaderValue != null) return false;
            if (this.routingHttpResponseAccessControlAllowMethodsHeaderValue != null ? !this.routingHttpResponseAccessControlAllowMethodsHeaderValue.equals(that.routingHttpResponseAccessControlAllowMethodsHeaderValue) : that.routingHttpResponseAccessControlAllowMethodsHeaderValue != null) return false;
            if (this.routingHttpResponseAccessControlAllowOriginHeaderValue != null ? !this.routingHttpResponseAccessControlAllowOriginHeaderValue.equals(that.routingHttpResponseAccessControlAllowOriginHeaderValue) : that.routingHttpResponseAccessControlAllowOriginHeaderValue != null) return false;
            if (this.routingHttpResponseAccessControlExposeHeadersHeaderValue != null ? !this.routingHttpResponseAccessControlExposeHeadersHeaderValue.equals(that.routingHttpResponseAccessControlExposeHeadersHeaderValue) : that.routingHttpResponseAccessControlExposeHeadersHeaderValue != null) return false;
            if (this.routingHttpResponseAccessControlMaxAgeHeaderValue != null ? !this.routingHttpResponseAccessControlMaxAgeHeaderValue.equals(that.routingHttpResponseAccessControlMaxAgeHeaderValue) : that.routingHttpResponseAccessControlMaxAgeHeaderValue != null) return false;
            if (this.routingHttpResponseContentSecurityPolicyHeaderValue != null ? !this.routingHttpResponseContentSecurityPolicyHeaderValue.equals(that.routingHttpResponseContentSecurityPolicyHeaderValue) : that.routingHttpResponseContentSecurityPolicyHeaderValue != null) return false;
            if (this.routingHttpResponseServerEnabled != null ? !this.routingHttpResponseServerEnabled.equals(that.routingHttpResponseServerEnabled) : that.routingHttpResponseServerEnabled != null) return false;
            if (this.routingHttpResponseStrictTransportSecurityHeaderValue != null ? !this.routingHttpResponseStrictTransportSecurityHeaderValue.equals(that.routingHttpResponseStrictTransportSecurityHeaderValue) : that.routingHttpResponseStrictTransportSecurityHeaderValue != null) return false;
            if (this.routingHttpResponseXContentTypeOptionsHeaderValue != null ? !this.routingHttpResponseXContentTypeOptionsHeaderValue.equals(that.routingHttpResponseXContentTypeOptionsHeaderValue) : that.routingHttpResponseXContentTypeOptionsHeaderValue != null) return false;
            if (this.routingHttpResponseXFrameOptionsHeaderValue != null ? !this.routingHttpResponseXFrameOptionsHeaderValue.equals(that.routingHttpResponseXFrameOptionsHeaderValue) : that.routingHttpResponseXFrameOptionsHeaderValue != null) return false;
            if (this.sslPolicy != null ? !this.sslPolicy.equals(that.sslPolicy) : that.sslPolicy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tcpIdleTimeoutSeconds != null ? !this.tcpIdleTimeoutSeconds.equals(that.tcpIdleTimeoutSeconds) : that.tcpIdleTimeoutSeconds != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultAction.hashCode();
            result = 31 * result + (this.loadBalancerArn.hashCode());
            result = 31 * result + (this.alpnPolicy != null ? this.alpnPolicy.hashCode() : 0);
            result = 31 * result + (this.certificateArn != null ? this.certificateArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.mutualAuthentication != null ? this.mutualAuthentication.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertIssuerHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertLeafHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertSubjectHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName != null ? this.routingHttpRequestXAmznMtlsClientcertValidityHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznTlsCipherSuiteHeaderName != null ? this.routingHttpRequestXAmznTlsCipherSuiteHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpRequestXAmznTlsVersionHeaderName != null ? this.routingHttpRequestXAmznTlsVersionHeaderName.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlAllowCredentialsHeaderValue != null ? this.routingHttpResponseAccessControlAllowCredentialsHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlAllowHeadersHeaderValue != null ? this.routingHttpResponseAccessControlAllowHeadersHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlAllowMethodsHeaderValue != null ? this.routingHttpResponseAccessControlAllowMethodsHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlAllowOriginHeaderValue != null ? this.routingHttpResponseAccessControlAllowOriginHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlExposeHeadersHeaderValue != null ? this.routingHttpResponseAccessControlExposeHeadersHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseAccessControlMaxAgeHeaderValue != null ? this.routingHttpResponseAccessControlMaxAgeHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseContentSecurityPolicyHeaderValue != null ? this.routingHttpResponseContentSecurityPolicyHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseServerEnabled != null ? this.routingHttpResponseServerEnabled.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseStrictTransportSecurityHeaderValue != null ? this.routingHttpResponseStrictTransportSecurityHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseXContentTypeOptionsHeaderValue != null ? this.routingHttpResponseXContentTypeOptionsHeaderValue.hashCode() : 0);
            result = 31 * result + (this.routingHttpResponseXFrameOptionsHeaderValue != null ? this.routingHttpResponseXFrameOptionsHeaderValue.hashCode() : 0);
            result = 31 * result + (this.sslPolicy != null ? this.sslPolicy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tcpIdleTimeoutSeconds != null ? this.tcpIdleTimeoutSeconds.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}

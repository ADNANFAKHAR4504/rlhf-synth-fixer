package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainDomainEndpointOptions")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainDomainEndpointOptions.Jsii$Proxy.class)
public interface ElasticsearchDomainDomainEndpointOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint ElasticsearchDomain#custom_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint_certificate_arn ElasticsearchDomain#custom_endpoint_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomEndpointCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint_enabled ElasticsearchDomain#custom_endpoint_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomEndpointEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enforce_https ElasticsearchDomain#enforce_https}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnforceHttps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tls_security_policy ElasticsearchDomain#tls_security_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsSecurityPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainDomainEndpointOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainDomainEndpointOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainDomainEndpointOptions> {
        java.lang.String customEndpoint;
        java.lang.String customEndpointCertificateArn;
        java.lang.Object customEndpointEnabled;
        java.lang.Object enforceHttps;
        java.lang.String tlsSecurityPolicy;

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getCustomEndpoint}
         * @param customEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint ElasticsearchDomain#custom_endpoint}.
         * @return {@code this}
         */
        public Builder customEndpoint(java.lang.String customEndpoint) {
            this.customEndpoint = customEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getCustomEndpointCertificateArn}
         * @param customEndpointCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint_certificate_arn ElasticsearchDomain#custom_endpoint_certificate_arn}.
         * @return {@code this}
         */
        public Builder customEndpointCertificateArn(java.lang.String customEndpointCertificateArn) {
            this.customEndpointCertificateArn = customEndpointCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getCustomEndpointEnabled}
         * @param customEndpointEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint_enabled ElasticsearchDomain#custom_endpoint_enabled}.
         * @return {@code this}
         */
        public Builder customEndpointEnabled(java.lang.Boolean customEndpointEnabled) {
            this.customEndpointEnabled = customEndpointEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getCustomEndpointEnabled}
         * @param customEndpointEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#custom_endpoint_enabled ElasticsearchDomain#custom_endpoint_enabled}.
         * @return {@code this}
         */
        public Builder customEndpointEnabled(com.hashicorp.cdktf.IResolvable customEndpointEnabled) {
            this.customEndpointEnabled = customEndpointEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getEnforceHttps}
         * @param enforceHttps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enforce_https ElasticsearchDomain#enforce_https}.
         * @return {@code this}
         */
        public Builder enforceHttps(java.lang.Boolean enforceHttps) {
            this.enforceHttps = enforceHttps;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getEnforceHttps}
         * @param enforceHttps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enforce_https ElasticsearchDomain#enforce_https}.
         * @return {@code this}
         */
        public Builder enforceHttps(com.hashicorp.cdktf.IResolvable enforceHttps) {
            this.enforceHttps = enforceHttps;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainDomainEndpointOptions#getTlsSecurityPolicy}
         * @param tlsSecurityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tls_security_policy ElasticsearchDomain#tls_security_policy}.
         * @return {@code this}
         */
        public Builder tlsSecurityPolicy(java.lang.String tlsSecurityPolicy) {
            this.tlsSecurityPolicy = tlsSecurityPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainDomainEndpointOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainDomainEndpointOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainDomainEndpointOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainDomainEndpointOptions {
        private final java.lang.String customEndpoint;
        private final java.lang.String customEndpointCertificateArn;
        private final java.lang.Object customEndpointEnabled;
        private final java.lang.Object enforceHttps;
        private final java.lang.String tlsSecurityPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customEndpoint = software.amazon.jsii.Kernel.get(this, "customEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customEndpointCertificateArn = software.amazon.jsii.Kernel.get(this, "customEndpointCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customEndpointEnabled = software.amazon.jsii.Kernel.get(this, "customEndpointEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enforceHttps = software.amazon.jsii.Kernel.get(this, "enforceHttps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tlsSecurityPolicy = software.amazon.jsii.Kernel.get(this, "tlsSecurityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customEndpoint = builder.customEndpoint;
            this.customEndpointCertificateArn = builder.customEndpointCertificateArn;
            this.customEndpointEnabled = builder.customEndpointEnabled;
            this.enforceHttps = builder.enforceHttps;
            this.tlsSecurityPolicy = builder.tlsSecurityPolicy;
        }

        @Override
        public final java.lang.String getCustomEndpoint() {
            return this.customEndpoint;
        }

        @Override
        public final java.lang.String getCustomEndpointCertificateArn() {
            return this.customEndpointCertificateArn;
        }

        @Override
        public final java.lang.Object getCustomEndpointEnabled() {
            return this.customEndpointEnabled;
        }

        @Override
        public final java.lang.Object getEnforceHttps() {
            return this.enforceHttps;
        }

        @Override
        public final java.lang.String getTlsSecurityPolicy() {
            return this.tlsSecurityPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomEndpoint() != null) {
                data.set("customEndpoint", om.valueToTree(this.getCustomEndpoint()));
            }
            if (this.getCustomEndpointCertificateArn() != null) {
                data.set("customEndpointCertificateArn", om.valueToTree(this.getCustomEndpointCertificateArn()));
            }
            if (this.getCustomEndpointEnabled() != null) {
                data.set("customEndpointEnabled", om.valueToTree(this.getCustomEndpointEnabled()));
            }
            if (this.getEnforceHttps() != null) {
                data.set("enforceHttps", om.valueToTree(this.getEnforceHttps()));
            }
            if (this.getTlsSecurityPolicy() != null) {
                data.set("tlsSecurityPolicy", om.valueToTree(this.getTlsSecurityPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainDomainEndpointOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainDomainEndpointOptions.Jsii$Proxy that = (ElasticsearchDomainDomainEndpointOptions.Jsii$Proxy) o;

            if (this.customEndpoint != null ? !this.customEndpoint.equals(that.customEndpoint) : that.customEndpoint != null) return false;
            if (this.customEndpointCertificateArn != null ? !this.customEndpointCertificateArn.equals(that.customEndpointCertificateArn) : that.customEndpointCertificateArn != null) return false;
            if (this.customEndpointEnabled != null ? !this.customEndpointEnabled.equals(that.customEndpointEnabled) : that.customEndpointEnabled != null) return false;
            if (this.enforceHttps != null ? !this.enforceHttps.equals(that.enforceHttps) : that.enforceHttps != null) return false;
            return this.tlsSecurityPolicy != null ? this.tlsSecurityPolicy.equals(that.tlsSecurityPolicy) : that.tlsSecurityPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customEndpoint != null ? this.customEndpoint.hashCode() : 0;
            result = 31 * result + (this.customEndpointCertificateArn != null ? this.customEndpointCertificateArn.hashCode() : 0);
            result = 31 * result + (this.customEndpointEnabled != null ? this.customEndpointEnabled.hashCode() : 0);
            result = 31 * result + (this.enforceHttps != null ? this.enforceHttps.hashCode() : 0);
            result = 31 * result + (this.tlsSecurityPolicy != null ? this.tlsSecurityPolicy.hashCode() : 0);
            return result;
        }
    }
}

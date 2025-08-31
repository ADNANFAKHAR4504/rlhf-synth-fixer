package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.Jsii$Proxy.class)
public interface PipesPipeSourceParametersSelfManagedKafkaParametersCredentials extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasicAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateTlsAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_256_auth PipesPipe#sasl_scram_256_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSaslScram256Auth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSaslScram512Auth() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersSelfManagedKafkaParametersCredentials> {
        java.lang.String basicAuth;
        java.lang.String clientCertificateTlsAuth;
        java.lang.String saslScram256Auth;
        java.lang.String saslScram512Auth;

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials#getBasicAuth}
         * @param basicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
         * @return {@code this}
         */
        public Builder basicAuth(java.lang.String basicAuth) {
            this.basicAuth = basicAuth;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials#getClientCertificateTlsAuth}
         * @param clientCertificateTlsAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
         * @return {@code this}
         */
        public Builder clientCertificateTlsAuth(java.lang.String clientCertificateTlsAuth) {
            this.clientCertificateTlsAuth = clientCertificateTlsAuth;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials#getSaslScram256Auth}
         * @param saslScram256Auth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_256_auth PipesPipe#sasl_scram_256_auth}.
         * @return {@code this}
         */
        public Builder saslScram256Auth(java.lang.String saslScram256Auth) {
            this.saslScram256Auth = saslScram256Auth;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials#getSaslScram512Auth}
         * @param saslScram512Auth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
         * @return {@code this}
         */
        public Builder saslScram512Auth(java.lang.String saslScram512Auth) {
            this.saslScram512Auth = saslScram512Auth;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersSelfManagedKafkaParametersCredentials build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersSelfManagedKafkaParametersCredentials}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersSelfManagedKafkaParametersCredentials {
        private final java.lang.String basicAuth;
        private final java.lang.String clientCertificateTlsAuth;
        private final java.lang.String saslScram256Auth;
        private final java.lang.String saslScram512Auth;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basicAuth = software.amazon.jsii.Kernel.get(this, "basicAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientCertificateTlsAuth = software.amazon.jsii.Kernel.get(this, "clientCertificateTlsAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.saslScram256Auth = software.amazon.jsii.Kernel.get(this, "saslScram256Auth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.saslScram512Auth = software.amazon.jsii.Kernel.get(this, "saslScram512Auth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basicAuth = builder.basicAuth;
            this.clientCertificateTlsAuth = builder.clientCertificateTlsAuth;
            this.saslScram256Auth = builder.saslScram256Auth;
            this.saslScram512Auth = builder.saslScram512Auth;
        }

        @Override
        public final java.lang.String getBasicAuth() {
            return this.basicAuth;
        }

        @Override
        public final java.lang.String getClientCertificateTlsAuth() {
            return this.clientCertificateTlsAuth;
        }

        @Override
        public final java.lang.String getSaslScram256Auth() {
            return this.saslScram256Auth;
        }

        @Override
        public final java.lang.String getSaslScram512Auth() {
            return this.saslScram512Auth;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBasicAuth() != null) {
                data.set("basicAuth", om.valueToTree(this.getBasicAuth()));
            }
            if (this.getClientCertificateTlsAuth() != null) {
                data.set("clientCertificateTlsAuth", om.valueToTree(this.getClientCertificateTlsAuth()));
            }
            if (this.getSaslScram256Auth() != null) {
                data.set("saslScram256Auth", om.valueToTree(this.getSaslScram256Auth()));
            }
            if (this.getSaslScram512Auth() != null) {
                data.set("saslScram512Auth", om.valueToTree(this.getSaslScram512Auth()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.Jsii$Proxy that = (PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.Jsii$Proxy) o;

            if (this.basicAuth != null ? !this.basicAuth.equals(that.basicAuth) : that.basicAuth != null) return false;
            if (this.clientCertificateTlsAuth != null ? !this.clientCertificateTlsAuth.equals(that.clientCertificateTlsAuth) : that.clientCertificateTlsAuth != null) return false;
            if (this.saslScram256Auth != null ? !this.saslScram256Auth.equals(that.saslScram256Auth) : that.saslScram256Auth != null) return false;
            return this.saslScram512Auth != null ? this.saslScram512Auth.equals(that.saslScram512Auth) : that.saslScram512Auth == null;
        }

        @Override
        public final int hashCode() {
            int result = this.basicAuth != null ? this.basicAuth.hashCode() : 0;
            result = 31 * result + (this.clientCertificateTlsAuth != null ? this.clientCertificateTlsAuth.hashCode() : 0);
            result = 31 * result + (this.saslScram256Auth != null ? this.saslScram256Auth.hashCode() : 0);
            result = 31 * result + (this.saslScram512Auth != null ? this.saslScram512Auth.hashCode() : 0);
            return result;
        }
    }
}

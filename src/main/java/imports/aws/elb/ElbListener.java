package imports.aws.elb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.190Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elb.ElbListener")
@software.amazon.jsii.Jsii.Proxy(ElbListener.Jsii$Proxy.class)
public interface ElbListener extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instance_port Elb#instance_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInstancePort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instance_protocol Elb#instance_protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#lb_port Elb#lb_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getLbPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#lb_protocol Elb#lb_protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLbProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#ssl_certificate_id Elb#ssl_certificate_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslCertificateId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElbListener}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElbListener}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElbListener> {
        java.lang.Number instancePort;
        java.lang.String instanceProtocol;
        java.lang.Number lbPort;
        java.lang.String lbProtocol;
        java.lang.String sslCertificateId;

        /**
         * Sets the value of {@link ElbListener#getInstancePort}
         * @param instancePort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instance_port Elb#instance_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder instancePort(java.lang.Number instancePort) {
            this.instancePort = instancePort;
            return this;
        }

        /**
         * Sets the value of {@link ElbListener#getInstanceProtocol}
         * @param instanceProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instance_protocol Elb#instance_protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceProtocol(java.lang.String instanceProtocol) {
            this.instanceProtocol = instanceProtocol;
            return this;
        }

        /**
         * Sets the value of {@link ElbListener#getLbPort}
         * @param lbPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#lb_port Elb#lb_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder lbPort(java.lang.Number lbPort) {
            this.lbPort = lbPort;
            return this;
        }

        /**
         * Sets the value of {@link ElbListener#getLbProtocol}
         * @param lbProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#lb_protocol Elb#lb_protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder lbProtocol(java.lang.String lbProtocol) {
            this.lbProtocol = lbProtocol;
            return this;
        }

        /**
         * Sets the value of {@link ElbListener#getSslCertificateId}
         * @param sslCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#ssl_certificate_id Elb#ssl_certificate_id}.
         * @return {@code this}
         */
        public Builder sslCertificateId(java.lang.String sslCertificateId) {
            this.sslCertificateId = sslCertificateId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElbListener}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElbListener build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElbListener}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElbListener {
        private final java.lang.Number instancePort;
        private final java.lang.String instanceProtocol;
        private final java.lang.Number lbPort;
        private final java.lang.String lbProtocol;
        private final java.lang.String sslCertificateId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instancePort = software.amazon.jsii.Kernel.get(this, "instancePort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceProtocol = software.amazon.jsii.Kernel.get(this, "instanceProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lbPort = software.amazon.jsii.Kernel.get(this, "lbPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.lbProtocol = software.amazon.jsii.Kernel.get(this, "lbProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslCertificateId = software.amazon.jsii.Kernel.get(this, "sslCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instancePort = java.util.Objects.requireNonNull(builder.instancePort, "instancePort is required");
            this.instanceProtocol = java.util.Objects.requireNonNull(builder.instanceProtocol, "instanceProtocol is required");
            this.lbPort = java.util.Objects.requireNonNull(builder.lbPort, "lbPort is required");
            this.lbProtocol = java.util.Objects.requireNonNull(builder.lbProtocol, "lbProtocol is required");
            this.sslCertificateId = builder.sslCertificateId;
        }

        @Override
        public final java.lang.Number getInstancePort() {
            return this.instancePort;
        }

        @Override
        public final java.lang.String getInstanceProtocol() {
            return this.instanceProtocol;
        }

        @Override
        public final java.lang.Number getLbPort() {
            return this.lbPort;
        }

        @Override
        public final java.lang.String getLbProtocol() {
            return this.lbProtocol;
        }

        @Override
        public final java.lang.String getSslCertificateId() {
            return this.sslCertificateId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instancePort", om.valueToTree(this.getInstancePort()));
            data.set("instanceProtocol", om.valueToTree(this.getInstanceProtocol()));
            data.set("lbPort", om.valueToTree(this.getLbPort()));
            data.set("lbProtocol", om.valueToTree(this.getLbProtocol()));
            if (this.getSslCertificateId() != null) {
                data.set("sslCertificateId", om.valueToTree(this.getSslCertificateId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elb.ElbListener"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElbListener.Jsii$Proxy that = (ElbListener.Jsii$Proxy) o;

            if (!instancePort.equals(that.instancePort)) return false;
            if (!instanceProtocol.equals(that.instanceProtocol)) return false;
            if (!lbPort.equals(that.lbPort)) return false;
            if (!lbProtocol.equals(that.lbProtocol)) return false;
            return this.sslCertificateId != null ? this.sslCertificateId.equals(that.sslCertificateId) : that.sslCertificateId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instancePort.hashCode();
            result = 31 * result + (this.instanceProtocol.hashCode());
            result = 31 * result + (this.lbPort.hashCode());
            result = 31 * result + (this.lbProtocol.hashCode());
            result = 31 * result + (this.sslCertificateId != null ? this.sslCertificateId.hashCode() : 0);
            return result;
        }
    }
}

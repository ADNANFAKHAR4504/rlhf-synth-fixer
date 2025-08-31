package imports.aws.route53_domains_registered_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.205Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomainNameServer")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsRegisteredDomainNameServer.Jsii$Proxy.class)
public interface Route53DomainsRegisteredDomainNameServer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name Route53DomainsRegisteredDomain#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#glue_ips Route53DomainsRegisteredDomain#glue_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlueIps() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53DomainsRegisteredDomainNameServer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsRegisteredDomainNameServer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsRegisteredDomainNameServer> {
        java.lang.String name;
        java.util.List<java.lang.String> glueIps;

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainNameServer#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name Route53DomainsRegisteredDomain#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainNameServer#getGlueIps}
         * @param glueIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#glue_ips Route53DomainsRegisteredDomain#glue_ips}.
         * @return {@code this}
         */
        public Builder glueIps(java.util.List<java.lang.String> glueIps) {
            this.glueIps = glueIps;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53DomainsRegisteredDomainNameServer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsRegisteredDomainNameServer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsRegisteredDomainNameServer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsRegisteredDomainNameServer {
        private final java.lang.String name;
        private final java.util.List<java.lang.String> glueIps;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.glueIps = software.amazon.jsii.Kernel.get(this, "glueIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.glueIps = builder.glueIps;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getGlueIps() {
            return this.glueIps;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getGlueIps() != null) {
                data.set("glueIps", om.valueToTree(this.getGlueIps()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomainNameServer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsRegisteredDomainNameServer.Jsii$Proxy that = (Route53DomainsRegisteredDomainNameServer.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.glueIps != null ? this.glueIps.equals(that.glueIps) : that.glueIps == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.glueIps != null ? this.glueIps.hashCode() : 0);
            return result;
        }
    }
}

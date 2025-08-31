package imports.aws.route53_domains_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.202Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDomain.Route53DomainsDomainNameServer")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsDomainNameServer.Jsii$Proxy.class)
public interface Route53DomainsDomainNameServer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#glue_ips Route53DomainsDomain#glue_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlueIps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53DomainsDomainNameServer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsDomainNameServer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsDomainNameServer> {
        java.util.List<java.lang.String> glueIps;
        java.lang.String name;

        /**
         * Sets the value of {@link Route53DomainsDomainNameServer#getGlueIps}
         * @param glueIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#glue_ips Route53DomainsDomain#glue_ips}.
         * @return {@code this}
         */
        public Builder glueIps(java.util.List<java.lang.String> glueIps) {
            this.glueIps = glueIps;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainNameServer#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name Route53DomainsDomain#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53DomainsDomainNameServer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsDomainNameServer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsDomainNameServer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsDomainNameServer {
        private final java.util.List<java.lang.String> glueIps;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.glueIps = software.amazon.jsii.Kernel.get(this, "glueIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.glueIps = builder.glueIps;
            this.name = builder.name;
        }

        @Override
        public final java.util.List<java.lang.String> getGlueIps() {
            return this.glueIps;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGlueIps() != null) {
                data.set("glueIps", om.valueToTree(this.getGlueIps()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53DomainsDomain.Route53DomainsDomainNameServer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsDomainNameServer.Jsii$Proxy that = (Route53DomainsDomainNameServer.Jsii$Proxy) o;

            if (this.glueIps != null ? !this.glueIps.equals(that.glueIps) : that.glueIps != null) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.glueIps != null ? this.glueIps.hashCode() : 0;
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}

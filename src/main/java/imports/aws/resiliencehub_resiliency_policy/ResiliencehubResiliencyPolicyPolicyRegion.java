package imports.aws.resiliencehub_resiliency_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyRegion")
@software.amazon.jsii.Jsii.Proxy(ResiliencehubResiliencyPolicyPolicyRegion.Jsii$Proxy.class)
public interface ResiliencehubResiliencyPolicyPolicyRegion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Recovery Point Objective (RPO) as a Go duration.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRpo() {
        return null;
    }

    /**
     * Recovery Time Objective (RTO) as a Go duration.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRto() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ResiliencehubResiliencyPolicyPolicyRegion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ResiliencehubResiliencyPolicyPolicyRegion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ResiliencehubResiliencyPolicyPolicyRegion> {
        java.lang.String rpo;
        java.lang.String rto;

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicyRegion#getRpo}
         * @param rpo Recovery Point Objective (RPO) as a Go duration.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
         * @return {@code this}
         */
        public Builder rpo(java.lang.String rpo) {
            this.rpo = rpo;
            return this;
        }

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicyRegion#getRto}
         * @param rto Recovery Time Objective (RTO) as a Go duration.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
         * @return {@code this}
         */
        public Builder rto(java.lang.String rto) {
            this.rto = rto;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ResiliencehubResiliencyPolicyPolicyRegion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ResiliencehubResiliencyPolicyPolicyRegion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ResiliencehubResiliencyPolicyPolicyRegion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ResiliencehubResiliencyPolicyPolicyRegion {
        private final java.lang.String rpo;
        private final java.lang.String rto;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rpo = software.amazon.jsii.Kernel.get(this, "rpo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rto = software.amazon.jsii.Kernel.get(this, "rto", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rpo = builder.rpo;
            this.rto = builder.rto;
        }

        @Override
        public final java.lang.String getRpo() {
            return this.rpo;
        }

        @Override
        public final java.lang.String getRto() {
            return this.rto;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRpo() != null) {
                data.set("rpo", om.valueToTree(this.getRpo()));
            }
            if (this.getRto() != null) {
                data.set("rto", om.valueToTree(this.getRto()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyRegion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ResiliencehubResiliencyPolicyPolicyRegion.Jsii$Proxy that = (ResiliencehubResiliencyPolicyPolicyRegion.Jsii$Proxy) o;

            if (this.rpo != null ? !this.rpo.equals(that.rpo) : that.rpo != null) return false;
            return this.rto != null ? this.rto.equals(that.rto) : that.rto == null;
        }

        @Override
        public final int hashCode() {
            int result = this.rpo != null ? this.rpo.hashCode() : 0;
            result = 31 * result + (this.rto != null ? this.rto.hashCode() : 0);
            return result;
        }
    }
}

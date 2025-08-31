package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource")
@software.amazon.jsii.Jsii.Proxy(Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.Jsii$Proxy.class)
public interface Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * nlb_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#nlb_resource Route53RecoveryreadinessResourceSet#nlb_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource getNlbResource() {
        return null;
    }

    /**
     * r53_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#r53_resource Route53RecoveryreadinessResourceSet#r53_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource getR53Resource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource> {
        imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource nlbResource;
        imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource r53Resource;

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource#getNlbResource}
         * @param nlbResource nlb_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#nlb_resource Route53RecoveryreadinessResourceSet#nlb_resource}
         * @return {@code this}
         */
        public Builder nlbResource(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource nlbResource) {
            this.nlbResource = nlbResource;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource#getR53Resource}
         * @param r53Resource r53_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#r53_resource Route53RecoveryreadinessResourceSet#r53_resource}
         * @return {@code this}
         */
        public Builder r53Resource(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource r53Resource) {
            this.r53Resource = r53Resource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource {
        private final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource nlbResource;
        private final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource r53Resource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nlbResource = software.amazon.jsii.Kernel.get(this, "nlbResource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource.class));
            this.r53Resource = software.amazon.jsii.Kernel.get(this, "r53Resource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nlbResource = builder.nlbResource;
            this.r53Resource = builder.r53Resource;
        }

        @Override
        public final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource getNlbResource() {
            return this.nlbResource;
        }

        @Override
        public final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource getR53Resource() {
            return this.r53Resource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNlbResource() != null) {
                data.set("nlbResource", om.valueToTree(this.getNlbResource()));
            }
            if (this.getR53Resource() != null) {
                data.set("r53Resource", om.valueToTree(this.getR53Resource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.Jsii$Proxy that = (Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.Jsii$Proxy) o;

            if (this.nlbResource != null ? !this.nlbResource.equals(that.nlbResource) : that.nlbResource != null) return false;
            return this.r53Resource != null ? this.r53Resource.equals(that.r53Resource) : that.r53Resource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nlbResource != null ? this.nlbResource.hashCode() : 0;
            result = 31 * result + (this.r53Resource != null ? this.r53Resource.hashCode() : 0);
            return result;
        }
    }
}

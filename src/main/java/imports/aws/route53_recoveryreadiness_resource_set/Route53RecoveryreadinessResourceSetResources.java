package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResources")
@software.amazon.jsii.Jsii.Proxy(Route53RecoveryreadinessResourceSetResources.Jsii$Proxy.class)
public interface Route53RecoveryreadinessResourceSetResources extends software.amazon.jsii.JsiiSerializable {

    /**
     * dns_target_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#dns_target_resource Route53RecoveryreadinessResourceSet#dns_target_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource getDnsTargetResource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#readiness_scopes Route53RecoveryreadinessResourceSet#readiness_scopes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReadinessScopes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#resource_arn Route53RecoveryreadinessResourceSet#resource_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecoveryreadinessResourceSetResources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecoveryreadinessResourceSetResources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecoveryreadinessResourceSetResources> {
        imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource dnsTargetResource;
        java.util.List<java.lang.String> readinessScopes;
        java.lang.String resourceArn;

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResources#getDnsTargetResource}
         * @param dnsTargetResource dns_target_resource block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#dns_target_resource Route53RecoveryreadinessResourceSet#dns_target_resource}
         * @return {@code this}
         */
        public Builder dnsTargetResource(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource dnsTargetResource) {
            this.dnsTargetResource = dnsTargetResource;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResources#getReadinessScopes}
         * @param readinessScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#readiness_scopes Route53RecoveryreadinessResourceSet#readiness_scopes}.
         * @return {@code this}
         */
        public Builder readinessScopes(java.util.List<java.lang.String> readinessScopes) {
            this.readinessScopes = readinessScopes;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResources#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#resource_arn Route53RecoveryreadinessResourceSet#resource_arn}.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecoveryreadinessResourceSetResources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecoveryreadinessResourceSetResources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecoveryreadinessResourceSetResources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecoveryreadinessResourceSetResources {
        private final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource dnsTargetResource;
        private final java.util.List<java.lang.String> readinessScopes;
        private final java.lang.String resourceArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dnsTargetResource = software.amazon.jsii.Kernel.get(this, "dnsTargetResource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource.class));
            this.readinessScopes = software.amazon.jsii.Kernel.get(this, "readinessScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dnsTargetResource = builder.dnsTargetResource;
            this.readinessScopes = builder.readinessScopes;
            this.resourceArn = builder.resourceArn;
        }

        @Override
        public final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource getDnsTargetResource() {
            return this.dnsTargetResource;
        }

        @Override
        public final java.util.List<java.lang.String> getReadinessScopes() {
            return this.readinessScopes;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDnsTargetResource() != null) {
                data.set("dnsTargetResource", om.valueToTree(this.getDnsTargetResource()));
            }
            if (this.getReadinessScopes() != null) {
                data.set("readinessScopes", om.valueToTree(this.getReadinessScopes()));
            }
            if (this.getResourceArn() != null) {
                data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecoveryreadinessResourceSetResources.Jsii$Proxy that = (Route53RecoveryreadinessResourceSetResources.Jsii$Proxy) o;

            if (this.dnsTargetResource != null ? !this.dnsTargetResource.equals(that.dnsTargetResource) : that.dnsTargetResource != null) return false;
            if (this.readinessScopes != null ? !this.readinessScopes.equals(that.readinessScopes) : that.readinessScopes != null) return false;
            return this.resourceArn != null ? this.resourceArn.equals(that.resourceArn) : that.resourceArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dnsTargetResource != null ? this.dnsTargetResource.hashCode() : 0;
            result = 31 * result + (this.readinessScopes != null ? this.readinessScopes.hashCode() : 0);
            result = 31 * result + (this.resourceArn != null ? this.resourceArn.hashCode() : 0);
            return result;
        }
    }
}

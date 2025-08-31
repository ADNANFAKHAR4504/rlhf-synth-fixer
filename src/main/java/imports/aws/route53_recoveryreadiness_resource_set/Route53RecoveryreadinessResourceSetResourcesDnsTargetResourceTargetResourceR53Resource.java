package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource")
@software.amazon.jsii.Jsii.Proxy(Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource.Jsii$Proxy.class)
public interface Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#domain_name Route53RecoveryreadinessResourceSet#domain_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_set_id Route53RecoveryreadinessResourceSet#record_set_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordSetId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource> {
        java.lang.String domainName;
        java.lang.String recordSetId;

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#domain_name Route53RecoveryreadinessResourceSet#domain_name}.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource#getRecordSetId}
         * @param recordSetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_set_id Route53RecoveryreadinessResourceSet#record_set_id}.
         * @return {@code this}
         */
        public Builder recordSetId(java.lang.String recordSetId) {
            this.recordSetId = recordSetId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource {
        private final java.lang.String domainName;
        private final java.lang.String recordSetId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordSetId = software.amazon.jsii.Kernel.get(this, "recordSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = builder.domainName;
            this.recordSetId = builder.recordSetId;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getRecordSetId() {
            return this.recordSetId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDomainName() != null) {
                data.set("domainName", om.valueToTree(this.getDomainName()));
            }
            if (this.getRecordSetId() != null) {
                data.set("recordSetId", om.valueToTree(this.getRecordSetId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource.Jsii$Proxy that = (Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource.Jsii$Proxy) o;

            if (this.domainName != null ? !this.domainName.equals(that.domainName) : that.domainName != null) return false;
            return this.recordSetId != null ? this.recordSetId.equals(that.recordSetId) : that.recordSetId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainName != null ? this.domainName.hashCode() : 0;
            result = 31 * result + (this.recordSetId != null ? this.recordSetId.hashCode() : 0);
            return result;
        }
    }
}

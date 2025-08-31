package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource")
@software.amazon.jsii.Jsii.Proxy(Route53RecoveryreadinessResourceSetResourcesDnsTargetResource.Jsii$Proxy.class)
public interface Route53RecoveryreadinessResourceSetResourcesDnsTargetResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#domain_name Route53RecoveryreadinessResourceSet#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#hosted_zone_arn Route53RecoveryreadinessResourceSet#hosted_zone_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostedZoneArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_set_id Route53RecoveryreadinessResourceSet#record_set_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordSetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_type Route53RecoveryreadinessResourceSet#record_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordType() {
        return null;
    }

    /**
     * target_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#target_resource Route53RecoveryreadinessResourceSet#target_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource getTargetResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecoveryreadinessResourceSetResourcesDnsTargetResource> {
        java.lang.String domainName;
        java.lang.String hostedZoneArn;
        java.lang.String recordSetId;
        java.lang.String recordType;
        imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource targetResource;

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#domain_name Route53RecoveryreadinessResourceSet#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource#getHostedZoneArn}
         * @param hostedZoneArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#hosted_zone_arn Route53RecoveryreadinessResourceSet#hosted_zone_arn}.
         * @return {@code this}
         */
        public Builder hostedZoneArn(java.lang.String hostedZoneArn) {
            this.hostedZoneArn = hostedZoneArn;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource#getRecordSetId}
         * @param recordSetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_set_id Route53RecoveryreadinessResourceSet#record_set_id}.
         * @return {@code this}
         */
        public Builder recordSetId(java.lang.String recordSetId) {
            this.recordSetId = recordSetId;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource#getRecordType}
         * @param recordType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#record_type Route53RecoveryreadinessResourceSet#record_type}.
         * @return {@code this}
         */
        public Builder recordType(java.lang.String recordType) {
            this.recordType = recordType;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource#getTargetResource}
         * @param targetResource target_resource block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoveryreadiness_resource_set#target_resource Route53RecoveryreadinessResourceSet#target_resource}
         * @return {@code this}
         */
        public Builder targetResource(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource targetResource) {
            this.targetResource = targetResource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecoveryreadinessResourceSetResourcesDnsTargetResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecoveryreadinessResourceSetResourcesDnsTargetResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecoveryreadinessResourceSetResourcesDnsTargetResource {
        private final java.lang.String domainName;
        private final java.lang.String hostedZoneArn;
        private final java.lang.String recordSetId;
        private final java.lang.String recordType;
        private final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource targetResource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostedZoneArn = software.amazon.jsii.Kernel.get(this, "hostedZoneArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordSetId = software.amazon.jsii.Kernel.get(this, "recordSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordType = software.amazon.jsii.Kernel.get(this, "recordType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetResource = software.amazon.jsii.Kernel.get(this, "targetResource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.hostedZoneArn = builder.hostedZoneArn;
            this.recordSetId = builder.recordSetId;
            this.recordType = builder.recordType;
            this.targetResource = builder.targetResource;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getHostedZoneArn() {
            return this.hostedZoneArn;
        }

        @Override
        public final java.lang.String getRecordSetId() {
            return this.recordSetId;
        }

        @Override
        public final java.lang.String getRecordType() {
            return this.recordType;
        }

        @Override
        public final imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource getTargetResource() {
            return this.targetResource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getHostedZoneArn() != null) {
                data.set("hostedZoneArn", om.valueToTree(this.getHostedZoneArn()));
            }
            if (this.getRecordSetId() != null) {
                data.set("recordSetId", om.valueToTree(this.getRecordSetId()));
            }
            if (this.getRecordType() != null) {
                data.set("recordType", om.valueToTree(this.getRecordType()));
            }
            if (this.getTargetResource() != null) {
                data.set("targetResource", om.valueToTree(this.getTargetResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecoveryreadinessResourceSetResourcesDnsTargetResource.Jsii$Proxy that = (Route53RecoveryreadinessResourceSetResourcesDnsTargetResource.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.hostedZoneArn != null ? !this.hostedZoneArn.equals(that.hostedZoneArn) : that.hostedZoneArn != null) return false;
            if (this.recordSetId != null ? !this.recordSetId.equals(that.recordSetId) : that.recordSetId != null) return false;
            if (this.recordType != null ? !this.recordType.equals(that.recordType) : that.recordType != null) return false;
            return this.targetResource != null ? this.targetResource.equals(that.targetResource) : that.targetResource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.hostedZoneArn != null ? this.hostedZoneArn.hashCode() : 0);
            result = 31 * result + (this.recordSetId != null ? this.recordSetId.hashCode() : 0);
            result = 31 * result + (this.recordType != null ? this.recordType.hashCode() : 0);
            result = 31 * result + (this.targetResource != null ? this.targetResource.hashCode() : 0);
            return result;
        }
    }
}

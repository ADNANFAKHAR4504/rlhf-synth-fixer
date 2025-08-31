package imports.aws.codestarconnections_host;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.338Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codestarconnectionsHost.CodestarconnectionsHostVpcConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodestarconnectionsHostVpcConfiguration.Jsii$Proxy.class)
public interface CodestarconnectionsHostVpcConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#security_group_ids CodestarconnectionsHost#security_group_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#subnet_ids CodestarconnectionsHost#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#vpc_id CodestarconnectionsHost#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#tls_certificate CodestarconnectionsHost#tls_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsCertificate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodestarconnectionsHostVpcConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodestarconnectionsHostVpcConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodestarconnectionsHostVpcConfiguration> {
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;
        java.lang.String tlsCertificate;

        /**
         * Sets the value of {@link CodestarconnectionsHostVpcConfiguration#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#security_group_ids CodestarconnectionsHost#security_group_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link CodestarconnectionsHostVpcConfiguration#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#subnet_ids CodestarconnectionsHost#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link CodestarconnectionsHostVpcConfiguration#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#vpc_id CodestarconnectionsHost#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link CodestarconnectionsHostVpcConfiguration#getTlsCertificate}
         * @param tlsCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codestarconnections_host#tls_certificate CodestarconnectionsHost#tls_certificate}.
         * @return {@code this}
         */
        public Builder tlsCertificate(java.lang.String tlsCertificate) {
            this.tlsCertificate = tlsCertificate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodestarconnectionsHostVpcConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodestarconnectionsHostVpcConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodestarconnectionsHostVpcConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodestarconnectionsHostVpcConfiguration {
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;
        private final java.lang.String tlsCertificate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tlsCertificate = software.amazon.jsii.Kernel.get(this, "tlsCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.securityGroupIds = java.util.Objects.requireNonNull(builder.securityGroupIds, "securityGroupIds is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.tlsCertificate = builder.tlsCertificate;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.String getTlsCertificate() {
            return this.tlsCertificate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getTlsCertificate() != null) {
                data.set("tlsCertificate", om.valueToTree(this.getTlsCertificate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codestarconnectionsHost.CodestarconnectionsHostVpcConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodestarconnectionsHostVpcConfiguration.Jsii$Proxy that = (CodestarconnectionsHostVpcConfiguration.Jsii$Proxy) o;

            if (!securityGroupIds.equals(that.securityGroupIds)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            return this.tlsCertificate != null ? this.tlsCertificate.equals(that.tlsCertificate) : that.tlsCertificate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.securityGroupIds.hashCode();
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.tlsCertificate != null ? this.tlsCertificate.hashCode() : 0);
            return result;
        }
    }
}

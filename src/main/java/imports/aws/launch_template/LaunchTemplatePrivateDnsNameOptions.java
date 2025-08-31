package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplatePrivateDnsNameOptions")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplatePrivateDnsNameOptions.Jsii$Proxy.class)
public interface LaunchTemplatePrivateDnsNameOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_aaaa_record LaunchTemplate#enable_resource_name_dns_aaaa_record}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsAaaaRecord() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_a_record LaunchTemplate#enable_resource_name_dns_a_record}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsARecord() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#hostname_type LaunchTemplate#hostname_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostnameType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplatePrivateDnsNameOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplatePrivateDnsNameOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplatePrivateDnsNameOptions> {
        java.lang.Object enableResourceNameDnsAaaaRecord;
        java.lang.Object enableResourceNameDnsARecord;
        java.lang.String hostnameType;

        /**
         * Sets the value of {@link LaunchTemplatePrivateDnsNameOptions#getEnableResourceNameDnsAaaaRecord}
         * @param enableResourceNameDnsAaaaRecord Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_aaaa_record LaunchTemplate#enable_resource_name_dns_aaaa_record}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsAaaaRecord(java.lang.Boolean enableResourceNameDnsAaaaRecord) {
            this.enableResourceNameDnsAaaaRecord = enableResourceNameDnsAaaaRecord;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePrivateDnsNameOptions#getEnableResourceNameDnsAaaaRecord}
         * @param enableResourceNameDnsAaaaRecord Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_aaaa_record LaunchTemplate#enable_resource_name_dns_aaaa_record}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsAaaaRecord(com.hashicorp.cdktf.IResolvable enableResourceNameDnsAaaaRecord) {
            this.enableResourceNameDnsAaaaRecord = enableResourceNameDnsAaaaRecord;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePrivateDnsNameOptions#getEnableResourceNameDnsARecord}
         * @param enableResourceNameDnsARecord Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_a_record LaunchTemplate#enable_resource_name_dns_a_record}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsARecord(java.lang.Boolean enableResourceNameDnsARecord) {
            this.enableResourceNameDnsARecord = enableResourceNameDnsARecord;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePrivateDnsNameOptions#getEnableResourceNameDnsARecord}
         * @param enableResourceNameDnsARecord Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enable_resource_name_dns_a_record LaunchTemplate#enable_resource_name_dns_a_record}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsARecord(com.hashicorp.cdktf.IResolvable enableResourceNameDnsARecord) {
            this.enableResourceNameDnsARecord = enableResourceNameDnsARecord;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePrivateDnsNameOptions#getHostnameType}
         * @param hostnameType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#hostname_type LaunchTemplate#hostname_type}.
         * @return {@code this}
         */
        public Builder hostnameType(java.lang.String hostnameType) {
            this.hostnameType = hostnameType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplatePrivateDnsNameOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplatePrivateDnsNameOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplatePrivateDnsNameOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplatePrivateDnsNameOptions {
        private final java.lang.Object enableResourceNameDnsAaaaRecord;
        private final java.lang.Object enableResourceNameDnsARecord;
        private final java.lang.String hostnameType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableResourceNameDnsAaaaRecord = software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecord", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableResourceNameDnsARecord = software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecord", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hostnameType = software.amazon.jsii.Kernel.get(this, "hostnameType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableResourceNameDnsAaaaRecord = builder.enableResourceNameDnsAaaaRecord;
            this.enableResourceNameDnsARecord = builder.enableResourceNameDnsARecord;
            this.hostnameType = builder.hostnameType;
        }

        @Override
        public final java.lang.Object getEnableResourceNameDnsAaaaRecord() {
            return this.enableResourceNameDnsAaaaRecord;
        }

        @Override
        public final java.lang.Object getEnableResourceNameDnsARecord() {
            return this.enableResourceNameDnsARecord;
        }

        @Override
        public final java.lang.String getHostnameType() {
            return this.hostnameType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableResourceNameDnsAaaaRecord() != null) {
                data.set("enableResourceNameDnsAaaaRecord", om.valueToTree(this.getEnableResourceNameDnsAaaaRecord()));
            }
            if (this.getEnableResourceNameDnsARecord() != null) {
                data.set("enableResourceNameDnsARecord", om.valueToTree(this.getEnableResourceNameDnsARecord()));
            }
            if (this.getHostnameType() != null) {
                data.set("hostnameType", om.valueToTree(this.getHostnameType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplatePrivateDnsNameOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplatePrivateDnsNameOptions.Jsii$Proxy that = (LaunchTemplatePrivateDnsNameOptions.Jsii$Proxy) o;

            if (this.enableResourceNameDnsAaaaRecord != null ? !this.enableResourceNameDnsAaaaRecord.equals(that.enableResourceNameDnsAaaaRecord) : that.enableResourceNameDnsAaaaRecord != null) return false;
            if (this.enableResourceNameDnsARecord != null ? !this.enableResourceNameDnsARecord.equals(that.enableResourceNameDnsARecord) : that.enableResourceNameDnsARecord != null) return false;
            return this.hostnameType != null ? this.hostnameType.equals(that.hostnameType) : that.hostnameType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableResourceNameDnsAaaaRecord != null ? this.enableResourceNameDnsAaaaRecord.hashCode() : 0;
            result = 31 * result + (this.enableResourceNameDnsARecord != null ? this.enableResourceNameDnsARecord.hashCode() : 0);
            result = 31 * result + (this.hostnameType != null ? this.hostnameType.hashCode() : 0);
            return result;
        }
    }
}

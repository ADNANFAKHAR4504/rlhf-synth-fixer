package imports.aws.athena_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration")
@software.amazon.jsii.Jsii.Proxy(AthenaWorkgroupConfigurationResultConfigurationAclConfiguration.Jsii$Proxy.class)
public interface AthenaWorkgroupConfigurationResultConfigurationAclConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#s3_acl_option AthenaWorkgroup#s3_acl_option}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3AclOption();

    /**
     * @return a {@link Builder} of {@link AthenaWorkgroupConfigurationResultConfigurationAclConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AthenaWorkgroupConfigurationResultConfigurationAclConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AthenaWorkgroupConfigurationResultConfigurationAclConfiguration> {
        java.lang.String s3AclOption;

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfigurationAclConfiguration#getS3AclOption}
         * @param s3AclOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#s3_acl_option AthenaWorkgroup#s3_acl_option}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3AclOption(java.lang.String s3AclOption) {
            this.s3AclOption = s3AclOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AthenaWorkgroupConfigurationResultConfigurationAclConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AthenaWorkgroupConfigurationResultConfigurationAclConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AthenaWorkgroupConfigurationResultConfigurationAclConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AthenaWorkgroupConfigurationResultConfigurationAclConfiguration {
        private final java.lang.String s3AclOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3AclOption = software.amazon.jsii.Kernel.get(this, "s3AclOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3AclOption = java.util.Objects.requireNonNull(builder.s3AclOption, "s3AclOption is required");
        }

        @Override
        public final java.lang.String getS3AclOption() {
            return this.s3AclOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3AclOption", om.valueToTree(this.getS3AclOption()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AthenaWorkgroupConfigurationResultConfigurationAclConfiguration.Jsii$Proxy that = (AthenaWorkgroupConfigurationResultConfigurationAclConfiguration.Jsii$Proxy) o;

            return this.s3AclOption.equals(that.s3AclOption);
        }

        @Override
        public final int hashCode() {
            int result = this.s3AclOption.hashCode();
            return result;
        }
    }
}

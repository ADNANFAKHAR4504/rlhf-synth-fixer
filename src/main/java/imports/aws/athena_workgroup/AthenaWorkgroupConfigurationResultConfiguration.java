package imports.aws.athena_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfiguration")
@software.amazon.jsii.Jsii.Proxy(AthenaWorkgroupConfigurationResultConfiguration.Jsii$Proxy.class)
public interface AthenaWorkgroupConfigurationResultConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * acl_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#acl_configuration AthenaWorkgroup#acl_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration getAclConfiguration() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#encryption_configuration AthenaWorkgroup#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration getEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#expected_bucket_owner AthenaWorkgroup#expected_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#output_location AthenaWorkgroup#output_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AthenaWorkgroupConfigurationResultConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AthenaWorkgroupConfigurationResultConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AthenaWorkgroupConfigurationResultConfiguration> {
        imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration aclConfiguration;
        imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration encryptionConfiguration;
        java.lang.String expectedBucketOwner;
        java.lang.String outputLocation;

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfiguration#getAclConfiguration}
         * @param aclConfiguration acl_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#acl_configuration AthenaWorkgroup#acl_configuration}
         * @return {@code this}
         */
        public Builder aclConfiguration(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration aclConfiguration) {
            this.aclConfiguration = aclConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfiguration#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#encryption_configuration AthenaWorkgroup#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfiguration#getExpectedBucketOwner}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#expected_bucket_owner AthenaWorkgroup#expected_bucket_owner}.
         * @return {@code this}
         */
        public Builder expectedBucketOwner(java.lang.String expectedBucketOwner) {
            this.expectedBucketOwner = expectedBucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfiguration#getOutputLocation}
         * @param outputLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#output_location AthenaWorkgroup#output_location}.
         * @return {@code this}
         */
        public Builder outputLocation(java.lang.String outputLocation) {
            this.outputLocation = outputLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AthenaWorkgroupConfigurationResultConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AthenaWorkgroupConfigurationResultConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AthenaWorkgroupConfigurationResultConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AthenaWorkgroupConfigurationResultConfiguration {
        private final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration aclConfiguration;
        private final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration encryptionConfiguration;
        private final java.lang.String expectedBucketOwner;
        private final java.lang.String outputLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aclConfiguration = software.amazon.jsii.Kernel.get(this, "aclConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration.class));
            this.expectedBucketOwner = software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputLocation = software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aclConfiguration = builder.aclConfiguration;
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.expectedBucketOwner = builder.expectedBucketOwner;
            this.outputLocation = builder.outputLocation;
        }

        @Override
        public final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationAclConfiguration getAclConfiguration() {
            return this.aclConfiguration;
        }

        @Override
        public final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.lang.String getExpectedBucketOwner() {
            return this.expectedBucketOwner;
        }

        @Override
        public final java.lang.String getOutputLocation() {
            return this.outputLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAclConfiguration() != null) {
                data.set("aclConfiguration", om.valueToTree(this.getAclConfiguration()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getExpectedBucketOwner() != null) {
                data.set("expectedBucketOwner", om.valueToTree(this.getExpectedBucketOwner()));
            }
            if (this.getOutputLocation() != null) {
                data.set("outputLocation", om.valueToTree(this.getOutputLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AthenaWorkgroupConfigurationResultConfiguration.Jsii$Proxy that = (AthenaWorkgroupConfigurationResultConfiguration.Jsii$Proxy) o;

            if (this.aclConfiguration != null ? !this.aclConfiguration.equals(that.aclConfiguration) : that.aclConfiguration != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.expectedBucketOwner != null ? !this.expectedBucketOwner.equals(that.expectedBucketOwner) : that.expectedBucketOwner != null) return false;
            return this.outputLocation != null ? this.outputLocation.equals(that.outputLocation) : that.outputLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.aclConfiguration != null ? this.aclConfiguration.hashCode() : 0;
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.expectedBucketOwner != null ? this.expectedBucketOwner.hashCode() : 0);
            result = 31 * result + (this.outputLocation != null ? this.outputLocation.hashCode() : 0);
            return result;
        }
    }
}

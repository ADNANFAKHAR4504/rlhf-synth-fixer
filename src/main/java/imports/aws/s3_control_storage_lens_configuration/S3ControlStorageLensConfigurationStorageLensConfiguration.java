package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfiguration.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * account_level block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#account_level S3ControlStorageLensConfiguration#account_level}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel getAccountLevel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#enabled S3ControlStorageLensConfiguration#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * aws_org block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#aws_org S3ControlStorageLensConfiguration#aws_org}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg getAwsOrg() {
        return null;
    }

    /**
     * data_export block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#data_export S3ControlStorageLensConfiguration#data_export}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport getDataExport() {
        return null;
    }

    /**
     * exclude block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#exclude S3ControlStorageLensConfiguration#exclude}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude getExclude() {
        return null;
    }

    /**
     * include block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#include S3ControlStorageLensConfiguration#include}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude getInclude() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfiguration> {
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel accountLevel;
        java.lang.Object enabled;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg awsOrg;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport dataExport;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude exclude;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude include;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getAccountLevel}
         * @param accountLevel account_level block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#account_level S3ControlStorageLensConfiguration#account_level}
         * @return {@code this}
         */
        public Builder accountLevel(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel accountLevel) {
            this.accountLevel = accountLevel;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#enabled S3ControlStorageLensConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#enabled S3ControlStorageLensConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getAwsOrg}
         * @param awsOrg aws_org block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#aws_org S3ControlStorageLensConfiguration#aws_org}
         * @return {@code this}
         */
        public Builder awsOrg(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg awsOrg) {
            this.awsOrg = awsOrg;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getDataExport}
         * @param dataExport data_export block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#data_export S3ControlStorageLensConfiguration#data_export}
         * @return {@code this}
         */
        public Builder dataExport(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport dataExport) {
            this.dataExport = dataExport;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getExclude}
         * @param exclude exclude block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#exclude S3ControlStorageLensConfiguration#exclude}
         * @return {@code this}
         */
        public Builder exclude(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude exclude) {
            this.exclude = exclude;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfiguration#getInclude}
         * @param include include block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#include S3ControlStorageLensConfiguration#include}
         * @return {@code this}
         */
        public Builder include(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude include) {
            this.include = include;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfiguration {
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel accountLevel;
        private final java.lang.Object enabled;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg awsOrg;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport dataExport;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude exclude;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude include;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountLevel = software.amazon.jsii.Kernel.get(this, "accountLevel", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.awsOrg = software.amazon.jsii.Kernel.get(this, "awsOrg", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg.class));
            this.dataExport = software.amazon.jsii.Kernel.get(this, "dataExport", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport.class));
            this.exclude = software.amazon.jsii.Kernel.get(this, "exclude", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude.class));
            this.include = software.amazon.jsii.Kernel.get(this, "include", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountLevel = java.util.Objects.requireNonNull(builder.accountLevel, "accountLevel is required");
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.awsOrg = builder.awsOrg;
            this.dataExport = builder.dataExport;
            this.exclude = builder.exclude;
            this.include = builder.include;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel getAccountLevel() {
            return this.accountLevel;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAwsOrg getAwsOrg() {
            return this.awsOrg;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport getDataExport() {
            return this.dataExport;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude getExclude() {
            return this.exclude;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationInclude getInclude() {
            return this.include;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountLevel", om.valueToTree(this.getAccountLevel()));
            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getAwsOrg() != null) {
                data.set("awsOrg", om.valueToTree(this.getAwsOrg()));
            }
            if (this.getDataExport() != null) {
                data.set("dataExport", om.valueToTree(this.getDataExport()));
            }
            if (this.getExclude() != null) {
                data.set("exclude", om.valueToTree(this.getExclude()));
            }
            if (this.getInclude() != null) {
                data.set("include", om.valueToTree(this.getInclude()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfiguration.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfiguration.Jsii$Proxy) o;

            if (!accountLevel.equals(that.accountLevel)) return false;
            if (!enabled.equals(that.enabled)) return false;
            if (this.awsOrg != null ? !this.awsOrg.equals(that.awsOrg) : that.awsOrg != null) return false;
            if (this.dataExport != null ? !this.dataExport.equals(that.dataExport) : that.dataExport != null) return false;
            if (this.exclude != null ? !this.exclude.equals(that.exclude) : that.exclude != null) return false;
            return this.include != null ? this.include.equals(that.include) : that.include == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountLevel.hashCode();
            result = 31 * result + (this.enabled.hashCode());
            result = 31 * result + (this.awsOrg != null ? this.awsOrg.hashCode() : 0);
            result = 31 * result + (this.dataExport != null ? this.dataExport.hashCode() : 0);
            result = 31 * result + (this.exclude != null ? this.exclude.hashCode() : 0);
            result = 31 * result + (this.include != null ? this.include.hashCode() : 0);
            return result;
        }
    }
}

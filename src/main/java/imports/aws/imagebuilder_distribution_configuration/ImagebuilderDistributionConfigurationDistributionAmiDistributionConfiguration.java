package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#ami_tags ImagebuilderDistributionConfiguration#ami_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAmiTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#description ImagebuilderDistributionConfiguration#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#kms_key_id ImagebuilderDistributionConfiguration#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * launch_permission block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_permission ImagebuilderDistributionConfiguration#launch_permission}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission getLaunchPermission() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#name ImagebuilderDistributionConfiguration#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_account_ids ImagebuilderDistributionConfiguration#target_account_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetAccountIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration> {
        java.util.Map<java.lang.String, java.lang.String> amiTags;
        java.lang.String description;
        java.lang.String kmsKeyId;
        imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission launchPermission;
        java.lang.String name;
        java.util.List<java.lang.String> targetAccountIds;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getAmiTags}
         * @param amiTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#ami_tags ImagebuilderDistributionConfiguration#ami_tags}.
         * @return {@code this}
         */
        public Builder amiTags(java.util.Map<java.lang.String, java.lang.String> amiTags) {
            this.amiTags = amiTags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#description ImagebuilderDistributionConfiguration#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#kms_key_id ImagebuilderDistributionConfiguration#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getLaunchPermission}
         * @param launchPermission launch_permission block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_permission ImagebuilderDistributionConfiguration#launch_permission}
         * @return {@code this}
         */
        public Builder launchPermission(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission launchPermission) {
            this.launchPermission = launchPermission;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#name ImagebuilderDistributionConfiguration#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration#getTargetAccountIds}
         * @param targetAccountIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_account_ids ImagebuilderDistributionConfiguration#target_account_ids}.
         * @return {@code this}
         */
        public Builder targetAccountIds(java.util.List<java.lang.String> targetAccountIds) {
            this.targetAccountIds = targetAccountIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration {
        private final java.util.Map<java.lang.String, java.lang.String> amiTags;
        private final java.lang.String description;
        private final java.lang.String kmsKeyId;
        private final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission launchPermission;
        private final java.lang.String name;
        private final java.util.List<java.lang.String> targetAccountIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amiTags = software.amazon.jsii.Kernel.get(this, "amiTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchPermission = software.amazon.jsii.Kernel.get(this, "launchPermission", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetAccountIds = software.amazon.jsii.Kernel.get(this, "targetAccountIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amiTags = builder.amiTags;
            this.description = builder.description;
            this.kmsKeyId = builder.kmsKeyId;
            this.launchPermission = builder.launchPermission;
            this.name = builder.name;
            this.targetAccountIds = builder.targetAccountIds;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAmiTags() {
            return this.amiTags;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission getLaunchPermission() {
            return this.launchPermission;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetAccountIds() {
            return this.targetAccountIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmiTags() != null) {
                data.set("amiTags", om.valueToTree(this.getAmiTags()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLaunchPermission() != null) {
                data.set("launchPermission", om.valueToTree(this.getLaunchPermission()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTargetAccountIds() != null) {
                data.set("targetAccountIds", om.valueToTree(this.getTargetAccountIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration.Jsii$Proxy) o;

            if (this.amiTags != null ? !this.amiTags.equals(that.amiTags) : that.amiTags != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.launchPermission != null ? !this.launchPermission.equals(that.launchPermission) : that.launchPermission != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.targetAccountIds != null ? this.targetAccountIds.equals(that.targetAccountIds) : that.targetAccountIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amiTags != null ? this.amiTags.hashCode() : 0;
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.launchPermission != null ? this.launchPermission.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.targetAccountIds != null ? this.targetAccountIds.hashCode() : 0);
            return result;
        }
    }
}

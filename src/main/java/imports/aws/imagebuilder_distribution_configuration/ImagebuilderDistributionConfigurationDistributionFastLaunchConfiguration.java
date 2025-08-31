package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#account_id ImagebuilderDistributionConfiguration#account_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#enabled ImagebuilderDistributionConfiguration#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template ImagebuilderDistributionConfiguration#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#max_parallel_launches ImagebuilderDistributionConfiguration#max_parallel_launches}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxParallelLaunches() {
        return null;
    }

    /**
     * snapshot_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#snapshot_configuration ImagebuilderDistributionConfiguration#snapshot_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration getSnapshotConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration> {
        java.lang.String accountId;
        java.lang.Object enabled;
        imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate launchTemplate;
        java.lang.Number maxParallelLaunches;
        imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration snapshotConfiguration;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#account_id ImagebuilderDistributionConfiguration#account_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#enabled ImagebuilderDistributionConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#enabled ImagebuilderDistributionConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template ImagebuilderDistributionConfiguration#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getMaxParallelLaunches}
         * @param maxParallelLaunches Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#max_parallel_launches ImagebuilderDistributionConfiguration#max_parallel_launches}.
         * @return {@code this}
         */
        public Builder maxParallelLaunches(java.lang.Number maxParallelLaunches) {
            this.maxParallelLaunches = maxParallelLaunches;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration#getSnapshotConfiguration}
         * @param snapshotConfiguration snapshot_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#snapshot_configuration ImagebuilderDistributionConfiguration#snapshot_configuration}
         * @return {@code this}
         */
        public Builder snapshotConfiguration(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration snapshotConfiguration) {
            this.snapshotConfiguration = snapshotConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration {
        private final java.lang.String accountId;
        private final java.lang.Object enabled;
        private final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate launchTemplate;
        private final java.lang.Number maxParallelLaunches;
        private final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration snapshotConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.class));
            this.maxParallelLaunches = software.amazon.jsii.Kernel.get(this, "maxParallelLaunches", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotConfiguration = software.amazon.jsii.Kernel.get(this, "snapshotConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountId = java.util.Objects.requireNonNull(builder.accountId, "accountId is required");
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.launchTemplate = builder.launchTemplate;
            this.maxParallelLaunches = builder.maxParallelLaunches;
            this.snapshotConfiguration = builder.snapshotConfiguration;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final java.lang.Number getMaxParallelLaunches() {
            return this.maxParallelLaunches;
        }

        @Override
        public final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration getSnapshotConfiguration() {
            return this.snapshotConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountId", om.valueToTree(this.getAccountId()));
            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getLaunchTemplate() != null) {
                data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            }
            if (this.getMaxParallelLaunches() != null) {
                data.set("maxParallelLaunches", om.valueToTree(this.getMaxParallelLaunches()));
            }
            if (this.getSnapshotConfiguration() != null) {
                data.set("snapshotConfiguration", om.valueToTree(this.getSnapshotConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration.Jsii$Proxy) o;

            if (!accountId.equals(that.accountId)) return false;
            if (!enabled.equals(that.enabled)) return false;
            if (this.launchTemplate != null ? !this.launchTemplate.equals(that.launchTemplate) : that.launchTemplate != null) return false;
            if (this.maxParallelLaunches != null ? !this.maxParallelLaunches.equals(that.maxParallelLaunches) : that.maxParallelLaunches != null) return false;
            return this.snapshotConfiguration != null ? this.snapshotConfiguration.equals(that.snapshotConfiguration) : that.snapshotConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountId.hashCode();
            result = 31 * result + (this.enabled.hashCode());
            result = 31 * result + (this.launchTemplate != null ? this.launchTemplate.hashCode() : 0);
            result = 31 * result + (this.maxParallelLaunches != null ? this.maxParallelLaunches.hashCode() : 0);
            result = 31 * result + (this.snapshotConfiguration != null ? this.snapshotConfiguration.hashCode() : 0);
            return result;
        }
    }
}

package imports.aws.ecr_registry_scanning_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRegistryScanningConfiguration.EcrRegistryScanningConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(EcrRegistryScanningConfigurationRule.Jsii$Proxy.class)
public interface EcrRegistryScanningConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * repository_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_registry_scanning_configuration#repository_filter EcrRegistryScanningConfiguration#repository_filter}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRepositoryFilter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_registry_scanning_configuration#scan_frequency EcrRegistryScanningConfiguration#scan_frequency}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScanFrequency();

    /**
     * @return a {@link Builder} of {@link EcrRegistryScanningConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrRegistryScanningConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrRegistryScanningConfigurationRule> {
        java.lang.Object repositoryFilter;
        java.lang.String scanFrequency;

        /**
         * Sets the value of {@link EcrRegistryScanningConfigurationRule#getRepositoryFilter}
         * @param repositoryFilter repository_filter block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_registry_scanning_configuration#repository_filter EcrRegistryScanningConfiguration#repository_filter}
         * @return {@code this}
         */
        public Builder repositoryFilter(com.hashicorp.cdktf.IResolvable repositoryFilter) {
            this.repositoryFilter = repositoryFilter;
            return this;
        }

        /**
         * Sets the value of {@link EcrRegistryScanningConfigurationRule#getRepositoryFilter}
         * @param repositoryFilter repository_filter block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_registry_scanning_configuration#repository_filter EcrRegistryScanningConfiguration#repository_filter}
         * @return {@code this}
         */
        public Builder repositoryFilter(java.util.List<? extends imports.aws.ecr_registry_scanning_configuration.EcrRegistryScanningConfigurationRuleRepositoryFilter> repositoryFilter) {
            this.repositoryFilter = repositoryFilter;
            return this;
        }

        /**
         * Sets the value of {@link EcrRegistryScanningConfigurationRule#getScanFrequency}
         * @param scanFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_registry_scanning_configuration#scan_frequency EcrRegistryScanningConfiguration#scan_frequency}. This parameter is required.
         * @return {@code this}
         */
        public Builder scanFrequency(java.lang.String scanFrequency) {
            this.scanFrequency = scanFrequency;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrRegistryScanningConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrRegistryScanningConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrRegistryScanningConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrRegistryScanningConfigurationRule {
        private final java.lang.Object repositoryFilter;
        private final java.lang.String scanFrequency;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryFilter = software.amazon.jsii.Kernel.get(this, "repositoryFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scanFrequency = software.amazon.jsii.Kernel.get(this, "scanFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryFilter = java.util.Objects.requireNonNull(builder.repositoryFilter, "repositoryFilter is required");
            this.scanFrequency = java.util.Objects.requireNonNull(builder.scanFrequency, "scanFrequency is required");
        }

        @Override
        public final java.lang.Object getRepositoryFilter() {
            return this.repositoryFilter;
        }

        @Override
        public final java.lang.String getScanFrequency() {
            return this.scanFrequency;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryFilter", om.valueToTree(this.getRepositoryFilter()));
            data.set("scanFrequency", om.valueToTree(this.getScanFrequency()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrRegistryScanningConfiguration.EcrRegistryScanningConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrRegistryScanningConfigurationRule.Jsii$Proxy that = (EcrRegistryScanningConfigurationRule.Jsii$Proxy) o;

            if (!repositoryFilter.equals(that.repositoryFilter)) return false;
            return this.scanFrequency.equals(that.scanFrequency);
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryFilter.hashCode();
            result = 31 * result + (this.scanFrequency.hashCode());
            return result;
        }
    }
}

package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.402Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatching")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainMatching.Jsii$Proxy.class)
public interface CustomerprofilesDomainMatching extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * auto_merging block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#auto_merging CustomerprofilesDomain#auto_merging}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging getAutoMerging() {
        return null;
    }

    /**
     * exporting_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig getExportingConfig() {
        return null;
    }

    /**
     * job_schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#job_schedule CustomerprofilesDomain#job_schedule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule getJobSchedule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainMatching}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainMatching}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainMatching> {
        java.lang.Object enabled;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging autoMerging;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig exportingConfig;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule jobSchedule;

        /**
         * Sets the value of {@link CustomerprofilesDomainMatching#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatching#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatching#getAutoMerging}
         * @param autoMerging auto_merging block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#auto_merging CustomerprofilesDomain#auto_merging}
         * @return {@code this}
         */
        public Builder autoMerging(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging autoMerging) {
            this.autoMerging = autoMerging;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatching#getExportingConfig}
         * @param exportingConfig exporting_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
         * @return {@code this}
         */
        public Builder exportingConfig(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig exportingConfig) {
            this.exportingConfig = exportingConfig;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatching#getJobSchedule}
         * @param jobSchedule job_schedule block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#job_schedule CustomerprofilesDomain#job_schedule}
         * @return {@code this}
         */
        public Builder jobSchedule(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule jobSchedule) {
            this.jobSchedule = jobSchedule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainMatching}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainMatching build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainMatching}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainMatching {
        private final java.lang.Object enabled;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging autoMerging;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig exportingConfig;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule jobSchedule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoMerging = software.amazon.jsii.Kernel.get(this, "autoMerging", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging.class));
            this.exportingConfig = software.amazon.jsii.Kernel.get(this, "exportingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig.class));
            this.jobSchedule = software.amazon.jsii.Kernel.get(this, "jobSchedule", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.autoMerging = builder.autoMerging;
            this.exportingConfig = builder.exportingConfig;
            this.jobSchedule = builder.jobSchedule;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging getAutoMerging() {
            return this.autoMerging;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig getExportingConfig() {
            return this.exportingConfig;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule getJobSchedule() {
            return this.jobSchedule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getAutoMerging() != null) {
                data.set("autoMerging", om.valueToTree(this.getAutoMerging()));
            }
            if (this.getExportingConfig() != null) {
                data.set("exportingConfig", om.valueToTree(this.getExportingConfig()));
            }
            if (this.getJobSchedule() != null) {
                data.set("jobSchedule", om.valueToTree(this.getJobSchedule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainMatching"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainMatching.Jsii$Proxy that = (CustomerprofilesDomainMatching.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.autoMerging != null ? !this.autoMerging.equals(that.autoMerging) : that.autoMerging != null) return false;
            if (this.exportingConfig != null ? !this.exportingConfig.equals(that.exportingConfig) : that.exportingConfig != null) return false;
            return this.jobSchedule != null ? this.jobSchedule.equals(that.jobSchedule) : that.jobSchedule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.autoMerging != null ? this.autoMerging.hashCode() : 0);
            result = 31 * result + (this.exportingConfig != null ? this.exportingConfig.hashCode() : 0);
            result = 31 * result + (this.jobSchedule != null ? this.jobSchedule.hashCode() : 0);
            return result;
        }
    }
}

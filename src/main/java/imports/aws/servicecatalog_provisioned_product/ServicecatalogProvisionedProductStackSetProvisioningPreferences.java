package imports.aws.servicecatalog_provisioned_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.436Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductStackSetProvisioningPreferences")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogProvisionedProductStackSetProvisioningPreferences.Jsii$Proxy.class)
public interface ServicecatalogProvisionedProductStackSetProvisioningPreferences extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accounts ServicecatalogProvisionedProduct#accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#failure_tolerance_count ServicecatalogProvisionedProduct#failure_tolerance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureToleranceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#failure_tolerance_percentage ServicecatalogProvisionedProduct#failure_tolerance_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureTolerancePercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#max_concurrency_count ServicecatalogProvisionedProduct#max_concurrency_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrencyCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#max_concurrency_percentage ServicecatalogProvisionedProduct#max_concurrency_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrencyPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#regions ServicecatalogProvisionedProduct#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogProvisionedProductStackSetProvisioningPreferences> {
        java.util.List<java.lang.String> accounts;
        java.lang.Number failureToleranceCount;
        java.lang.Number failureTolerancePercentage;
        java.lang.Number maxConcurrencyCount;
        java.lang.Number maxConcurrencyPercentage;
        java.util.List<java.lang.String> regions;

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getAccounts}
         * @param accounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accounts ServicecatalogProvisionedProduct#accounts}.
         * @return {@code this}
         */
        public Builder accounts(java.util.List<java.lang.String> accounts) {
            this.accounts = accounts;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getFailureToleranceCount}
         * @param failureToleranceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#failure_tolerance_count ServicecatalogProvisionedProduct#failure_tolerance_count}.
         * @return {@code this}
         */
        public Builder failureToleranceCount(java.lang.Number failureToleranceCount) {
            this.failureToleranceCount = failureToleranceCount;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getFailureTolerancePercentage}
         * @param failureTolerancePercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#failure_tolerance_percentage ServicecatalogProvisionedProduct#failure_tolerance_percentage}.
         * @return {@code this}
         */
        public Builder failureTolerancePercentage(java.lang.Number failureTolerancePercentage) {
            this.failureTolerancePercentage = failureTolerancePercentage;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getMaxConcurrencyCount}
         * @param maxConcurrencyCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#max_concurrency_count ServicecatalogProvisionedProduct#max_concurrency_count}.
         * @return {@code this}
         */
        public Builder maxConcurrencyCount(java.lang.Number maxConcurrencyCount) {
            this.maxConcurrencyCount = maxConcurrencyCount;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getMaxConcurrencyPercentage}
         * @param maxConcurrencyPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#max_concurrency_percentage ServicecatalogProvisionedProduct#max_concurrency_percentage}.
         * @return {@code this}
         */
        public Builder maxConcurrencyPercentage(java.lang.Number maxConcurrencyPercentage) {
            this.maxConcurrencyPercentage = maxConcurrencyPercentage;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#regions ServicecatalogProvisionedProduct#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogProvisionedProductStackSetProvisioningPreferences build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogProvisionedProductStackSetProvisioningPreferences}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogProvisionedProductStackSetProvisioningPreferences {
        private final java.util.List<java.lang.String> accounts;
        private final java.lang.Number failureToleranceCount;
        private final java.lang.Number failureTolerancePercentage;
        private final java.lang.Number maxConcurrencyCount;
        private final java.lang.Number maxConcurrencyPercentage;
        private final java.util.List<java.lang.String> regions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accounts = software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.failureToleranceCount = software.amazon.jsii.Kernel.get(this, "failureToleranceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.failureTolerancePercentage = software.amazon.jsii.Kernel.get(this, "failureTolerancePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxConcurrencyCount = software.amazon.jsii.Kernel.get(this, "maxConcurrencyCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxConcurrencyPercentage = software.amazon.jsii.Kernel.get(this, "maxConcurrencyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accounts = builder.accounts;
            this.failureToleranceCount = builder.failureToleranceCount;
            this.failureTolerancePercentage = builder.failureTolerancePercentage;
            this.maxConcurrencyCount = builder.maxConcurrencyCount;
            this.maxConcurrencyPercentage = builder.maxConcurrencyPercentage;
            this.regions = builder.regions;
        }

        @Override
        public final java.util.List<java.lang.String> getAccounts() {
            return this.accounts;
        }

        @Override
        public final java.lang.Number getFailureToleranceCount() {
            return this.failureToleranceCount;
        }

        @Override
        public final java.lang.Number getFailureTolerancePercentage() {
            return this.failureTolerancePercentage;
        }

        @Override
        public final java.lang.Number getMaxConcurrencyCount() {
            return this.maxConcurrencyCount;
        }

        @Override
        public final java.lang.Number getMaxConcurrencyPercentage() {
            return this.maxConcurrencyPercentage;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccounts() != null) {
                data.set("accounts", om.valueToTree(this.getAccounts()));
            }
            if (this.getFailureToleranceCount() != null) {
                data.set("failureToleranceCount", om.valueToTree(this.getFailureToleranceCount()));
            }
            if (this.getFailureTolerancePercentage() != null) {
                data.set("failureTolerancePercentage", om.valueToTree(this.getFailureTolerancePercentage()));
            }
            if (this.getMaxConcurrencyCount() != null) {
                data.set("maxConcurrencyCount", om.valueToTree(this.getMaxConcurrencyCount()));
            }
            if (this.getMaxConcurrencyPercentage() != null) {
                data.set("maxConcurrencyPercentage", om.valueToTree(this.getMaxConcurrencyPercentage()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductStackSetProvisioningPreferences"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogProvisionedProductStackSetProvisioningPreferences.Jsii$Proxy that = (ServicecatalogProvisionedProductStackSetProvisioningPreferences.Jsii$Proxy) o;

            if (this.accounts != null ? !this.accounts.equals(that.accounts) : that.accounts != null) return false;
            if (this.failureToleranceCount != null ? !this.failureToleranceCount.equals(that.failureToleranceCount) : that.failureToleranceCount != null) return false;
            if (this.failureTolerancePercentage != null ? !this.failureTolerancePercentage.equals(that.failureTolerancePercentage) : that.failureTolerancePercentage != null) return false;
            if (this.maxConcurrencyCount != null ? !this.maxConcurrencyCount.equals(that.maxConcurrencyCount) : that.maxConcurrencyCount != null) return false;
            if (this.maxConcurrencyPercentage != null ? !this.maxConcurrencyPercentage.equals(that.maxConcurrencyPercentage) : that.maxConcurrencyPercentage != null) return false;
            return this.regions != null ? this.regions.equals(that.regions) : that.regions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accounts != null ? this.accounts.hashCode() : 0;
            result = 31 * result + (this.failureToleranceCount != null ? this.failureToleranceCount.hashCode() : 0);
            result = 31 * result + (this.failureTolerancePercentage != null ? this.failureTolerancePercentage.hashCode() : 0);
            result = 31 * result + (this.maxConcurrencyCount != null ? this.maxConcurrencyCount.hashCode() : 0);
            result = 31 * result + (this.maxConcurrencyPercentage != null ? this.maxConcurrencyPercentage.hashCode() : 0);
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            return result;
        }
    }
}

package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel extends software.amazon.jsii.JsiiSerializable {

    /**
     * bucket_level block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#bucket_level S3ControlStorageLensConfiguration#bucket_level}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel getBucketLevel();

    /**
     * activity_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#activity_metrics S3ControlStorageLensConfiguration#activity_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics getActivityMetrics() {
        return null;
    }

    /**
     * advanced_cost_optimization_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_cost_optimization_metrics S3ControlStorageLensConfiguration#advanced_cost_optimization_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetrics() {
        return null;
    }

    /**
     * advanced_data_protection_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_data_protection_metrics S3ControlStorageLensConfiguration#advanced_data_protection_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetrics() {
        return null;
    }

    /**
     * detailed_status_code_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#detailed_status_code_metrics S3ControlStorageLensConfiguration#detailed_status_code_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetrics() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel> {
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel bucketLevel;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics activityMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel#getBucketLevel}
         * @param bucketLevel bucket_level block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#bucket_level S3ControlStorageLensConfiguration#bucket_level}
         * @return {@code this}
         */
        public Builder bucketLevel(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel bucketLevel) {
            this.bucketLevel = bucketLevel;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel#getActivityMetrics}
         * @param activityMetrics activity_metrics block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#activity_metrics S3ControlStorageLensConfiguration#activity_metrics}
         * @return {@code this}
         */
        public Builder activityMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics activityMetrics) {
            this.activityMetrics = activityMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel#getAdvancedCostOptimizationMetrics}
         * @param advancedCostOptimizationMetrics advanced_cost_optimization_metrics block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_cost_optimization_metrics S3ControlStorageLensConfiguration#advanced_cost_optimization_metrics}
         * @return {@code this}
         */
        public Builder advancedCostOptimizationMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics) {
            this.advancedCostOptimizationMetrics = advancedCostOptimizationMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel#getAdvancedDataProtectionMetrics}
         * @param advancedDataProtectionMetrics advanced_data_protection_metrics block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_data_protection_metrics S3ControlStorageLensConfiguration#advanced_data_protection_metrics}
         * @return {@code this}
         */
        public Builder advancedDataProtectionMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics) {
            this.advancedDataProtectionMetrics = advancedDataProtectionMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel#getDetailedStatusCodeMetrics}
         * @param detailedStatusCodeMetrics detailed_status_code_metrics block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#detailed_status_code_metrics S3ControlStorageLensConfiguration#detailed_status_code_metrics}
         * @return {@code this}
         */
        public Builder detailedStatusCodeMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics) {
            this.detailedStatusCodeMetrics = detailedStatusCodeMetrics;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel {
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel bucketLevel;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics activityMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketLevel = software.amazon.jsii.Kernel.get(this, "bucketLevel", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.class));
            this.activityMetrics = software.amazon.jsii.Kernel.get(this, "activityMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics.class));
            this.advancedCostOptimizationMetrics = software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics.class));
            this.advancedDataProtectionMetrics = software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics.class));
            this.detailedStatusCodeMetrics = software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketLevel = java.util.Objects.requireNonNull(builder.bucketLevel, "bucketLevel is required");
            this.activityMetrics = builder.activityMetrics;
            this.advancedCostOptimizationMetrics = builder.advancedCostOptimizationMetrics;
            this.advancedDataProtectionMetrics = builder.advancedDataProtectionMetrics;
            this.detailedStatusCodeMetrics = builder.detailedStatusCodeMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel getBucketLevel() {
            return this.bucketLevel;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics getActivityMetrics() {
            return this.activityMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetrics() {
            return this.advancedCostOptimizationMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetrics() {
            return this.advancedDataProtectionMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetrics() {
            return this.detailedStatusCodeMetrics;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketLevel", om.valueToTree(this.getBucketLevel()));
            if (this.getActivityMetrics() != null) {
                data.set("activityMetrics", om.valueToTree(this.getActivityMetrics()));
            }
            if (this.getAdvancedCostOptimizationMetrics() != null) {
                data.set("advancedCostOptimizationMetrics", om.valueToTree(this.getAdvancedCostOptimizationMetrics()));
            }
            if (this.getAdvancedDataProtectionMetrics() != null) {
                data.set("advancedDataProtectionMetrics", om.valueToTree(this.getAdvancedDataProtectionMetrics()));
            }
            if (this.getDetailedStatusCodeMetrics() != null) {
                data.set("detailedStatusCodeMetrics", om.valueToTree(this.getDetailedStatusCodeMetrics()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel.Jsii$Proxy) o;

            if (!bucketLevel.equals(that.bucketLevel)) return false;
            if (this.activityMetrics != null ? !this.activityMetrics.equals(that.activityMetrics) : that.activityMetrics != null) return false;
            if (this.advancedCostOptimizationMetrics != null ? !this.advancedCostOptimizationMetrics.equals(that.advancedCostOptimizationMetrics) : that.advancedCostOptimizationMetrics != null) return false;
            if (this.advancedDataProtectionMetrics != null ? !this.advancedDataProtectionMetrics.equals(that.advancedDataProtectionMetrics) : that.advancedDataProtectionMetrics != null) return false;
            return this.detailedStatusCodeMetrics != null ? this.detailedStatusCodeMetrics.equals(that.detailedStatusCodeMetrics) : that.detailedStatusCodeMetrics == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketLevel.hashCode();
            result = 31 * result + (this.activityMetrics != null ? this.activityMetrics.hashCode() : 0);
            result = 31 * result + (this.advancedCostOptimizationMetrics != null ? this.advancedCostOptimizationMetrics.hashCode() : 0);
            result = 31 * result + (this.advancedDataProtectionMetrics != null ? this.advancedDataProtectionMetrics.hashCode() : 0);
            result = 31 * result + (this.detailedStatusCodeMetrics != null ? this.detailedStatusCodeMetrics.hashCode() : 0);
            return result;
        }
    }
}

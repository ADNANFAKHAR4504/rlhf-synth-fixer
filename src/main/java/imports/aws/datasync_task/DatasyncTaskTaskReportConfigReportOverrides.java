package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskTaskReportConfigReportOverrides")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskTaskReportConfigReportOverrides.Jsii$Proxy.class)
public interface DatasyncTaskTaskReportConfigReportOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#deleted_override DatasyncTask#deleted_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeletedOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#skipped_override DatasyncTask#skipped_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSkippedOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transferred_override DatasyncTask#transferred_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransferredOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verified_override DatasyncTask#verified_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVerifiedOverride() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskTaskReportConfigReportOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskTaskReportConfigReportOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskTaskReportConfigReportOverrides> {
        java.lang.String deletedOverride;
        java.lang.String skippedOverride;
        java.lang.String transferredOverride;
        java.lang.String verifiedOverride;

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigReportOverrides#getDeletedOverride}
         * @param deletedOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#deleted_override DatasyncTask#deleted_override}.
         * @return {@code this}
         */
        public Builder deletedOverride(java.lang.String deletedOverride) {
            this.deletedOverride = deletedOverride;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigReportOverrides#getSkippedOverride}
         * @param skippedOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#skipped_override DatasyncTask#skipped_override}.
         * @return {@code this}
         */
        public Builder skippedOverride(java.lang.String skippedOverride) {
            this.skippedOverride = skippedOverride;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigReportOverrides#getTransferredOverride}
         * @param transferredOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transferred_override DatasyncTask#transferred_override}.
         * @return {@code this}
         */
        public Builder transferredOverride(java.lang.String transferredOverride) {
            this.transferredOverride = transferredOverride;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigReportOverrides#getVerifiedOverride}
         * @param verifiedOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verified_override DatasyncTask#verified_override}.
         * @return {@code this}
         */
        public Builder verifiedOverride(java.lang.String verifiedOverride) {
            this.verifiedOverride = verifiedOverride;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncTaskTaskReportConfigReportOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskTaskReportConfigReportOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskTaskReportConfigReportOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskTaskReportConfigReportOverrides {
        private final java.lang.String deletedOverride;
        private final java.lang.String skippedOverride;
        private final java.lang.String transferredOverride;
        private final java.lang.String verifiedOverride;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deletedOverride = software.amazon.jsii.Kernel.get(this, "deletedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.skippedOverride = software.amazon.jsii.Kernel.get(this, "skippedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transferredOverride = software.amazon.jsii.Kernel.get(this, "transferredOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.verifiedOverride = software.amazon.jsii.Kernel.get(this, "verifiedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deletedOverride = builder.deletedOverride;
            this.skippedOverride = builder.skippedOverride;
            this.transferredOverride = builder.transferredOverride;
            this.verifiedOverride = builder.verifiedOverride;
        }

        @Override
        public final java.lang.String getDeletedOverride() {
            return this.deletedOverride;
        }

        @Override
        public final java.lang.String getSkippedOverride() {
            return this.skippedOverride;
        }

        @Override
        public final java.lang.String getTransferredOverride() {
            return this.transferredOverride;
        }

        @Override
        public final java.lang.String getVerifiedOverride() {
            return this.verifiedOverride;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeletedOverride() != null) {
                data.set("deletedOverride", om.valueToTree(this.getDeletedOverride()));
            }
            if (this.getSkippedOverride() != null) {
                data.set("skippedOverride", om.valueToTree(this.getSkippedOverride()));
            }
            if (this.getTransferredOverride() != null) {
                data.set("transferredOverride", om.valueToTree(this.getTransferredOverride()));
            }
            if (this.getVerifiedOverride() != null) {
                data.set("verifiedOverride", om.valueToTree(this.getVerifiedOverride()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskTaskReportConfigReportOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskTaskReportConfigReportOverrides.Jsii$Proxy that = (DatasyncTaskTaskReportConfigReportOverrides.Jsii$Proxy) o;

            if (this.deletedOverride != null ? !this.deletedOverride.equals(that.deletedOverride) : that.deletedOverride != null) return false;
            if (this.skippedOverride != null ? !this.skippedOverride.equals(that.skippedOverride) : that.skippedOverride != null) return false;
            if (this.transferredOverride != null ? !this.transferredOverride.equals(that.transferredOverride) : that.transferredOverride != null) return false;
            return this.verifiedOverride != null ? this.verifiedOverride.equals(that.verifiedOverride) : that.verifiedOverride == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deletedOverride != null ? this.deletedOverride.hashCode() : 0;
            result = 31 * result + (this.skippedOverride != null ? this.skippedOverride.hashCode() : 0);
            result = 31 * result + (this.transferredOverride != null ? this.transferredOverride.hashCode() : 0);
            result = 31 * result + (this.verifiedOverride != null ? this.verifiedOverride.hashCode() : 0);
            return result;
        }
    }
}

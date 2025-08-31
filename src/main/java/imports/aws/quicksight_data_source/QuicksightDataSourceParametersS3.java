package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersS3")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersS3.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * manifest_file_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#manifest_file_location QuicksightDataSource#manifest_file_location}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation getManifestFileLocation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#role_arn QuicksightDataSource#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersS3> {
        imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation manifestFileLocation;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersS3#getManifestFileLocation}
         * @param manifestFileLocation manifest_file_location block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#manifest_file_location QuicksightDataSource#manifest_file_location}
         * @return {@code this}
         */
        public Builder manifestFileLocation(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation manifestFileLocation) {
            this.manifestFileLocation = manifestFileLocation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersS3#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#role_arn QuicksightDataSource#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersS3 {
        private final imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation manifestFileLocation;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.manifestFileLocation = software.amazon.jsii.Kernel.get(this, "manifestFileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.manifestFileLocation = java.util.Objects.requireNonNull(builder.manifestFileLocation, "manifestFileLocation is required");
            this.roleArn = builder.roleArn;
        }

        @Override
        public final imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation getManifestFileLocation() {
            return this.manifestFileLocation;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("manifestFileLocation", om.valueToTree(this.getManifestFileLocation()));
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersS3.Jsii$Proxy that = (QuicksightDataSourceParametersS3.Jsii$Proxy) o;

            if (!manifestFileLocation.equals(that.manifestFileLocation)) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.manifestFileLocation.hashCode();
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}

package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionDataSet")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRowLevelPermissionDataSet.Jsii$Proxy.class)
public interface QuicksightDataSetRowLevelPermissionDataSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#arn QuicksightDataSet#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permission_policy QuicksightDataSet#permission_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermissionPolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format_version QuicksightDataSet#format_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormatVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#namespace QuicksightDataSet#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRowLevelPermissionDataSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRowLevelPermissionDataSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRowLevelPermissionDataSet> {
        java.lang.String arn;
        java.lang.String permissionPolicy;
        java.lang.String formatVersion;
        java.lang.String namespace;
        java.lang.String status;

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionDataSet#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#arn QuicksightDataSet#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionDataSet#getPermissionPolicy}
         * @param permissionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permission_policy QuicksightDataSet#permission_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder permissionPolicy(java.lang.String permissionPolicy) {
            this.permissionPolicy = permissionPolicy;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionDataSet#getFormatVersion}
         * @param formatVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format_version QuicksightDataSet#format_version}.
         * @return {@code this}
         */
        public Builder formatVersion(java.lang.String formatVersion) {
            this.formatVersion = formatVersion;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionDataSet#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#namespace QuicksightDataSet#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionDataSet#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRowLevelPermissionDataSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRowLevelPermissionDataSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRowLevelPermissionDataSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRowLevelPermissionDataSet {
        private final java.lang.String arn;
        private final java.lang.String permissionPolicy;
        private final java.lang.String formatVersion;
        private final java.lang.String namespace;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permissionPolicy = software.amazon.jsii.Kernel.get(this, "permissionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.formatVersion = software.amazon.jsii.Kernel.get(this, "formatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.permissionPolicy = java.util.Objects.requireNonNull(builder.permissionPolicy, "permissionPolicy is required");
            this.formatVersion = builder.formatVersion;
            this.namespace = builder.namespace;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.String getPermissionPolicy() {
            return this.permissionPolicy;
        }

        @Override
        public final java.lang.String getFormatVersion() {
            return this.formatVersion;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("permissionPolicy", om.valueToTree(this.getPermissionPolicy()));
            if (this.getFormatVersion() != null) {
                data.set("formatVersion", om.valueToTree(this.getFormatVersion()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionDataSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRowLevelPermissionDataSet.Jsii$Proxy that = (QuicksightDataSetRowLevelPermissionDataSet.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            if (!permissionPolicy.equals(that.permissionPolicy)) return false;
            if (this.formatVersion != null ? !this.formatVersion.equals(that.formatVersion) : that.formatVersion != null) return false;
            if (this.namespace != null ? !this.namespace.equals(that.namespace) : that.namespace != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.permissionPolicy.hashCode());
            result = 31 * result + (this.formatVersion != null ? this.formatVersion.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}

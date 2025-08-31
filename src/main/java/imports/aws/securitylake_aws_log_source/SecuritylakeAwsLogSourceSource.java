package imports.aws.securitylake_aws_log_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.418Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeAwsLogSource.SecuritylakeAwsLogSourceSource")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeAwsLogSourceSource.Jsii$Proxy.class)
public interface SecuritylakeAwsLogSourceSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#regions SecuritylakeAwsLogSource#regions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#source_name SecuritylakeAwsLogSource#source_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#accounts SecuritylakeAwsLogSource#accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#source_version SecuritylakeAwsLogSource#source_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeAwsLogSourceSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeAwsLogSourceSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeAwsLogSourceSource> {
        java.util.List<java.lang.String> regions;
        java.lang.String sourceName;
        java.util.List<java.lang.String> accounts;
        java.lang.String sourceVersion;

        /**
         * Sets the value of {@link SecuritylakeAwsLogSourceSource#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#regions SecuritylakeAwsLogSource#regions}. This parameter is required.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeAwsLogSourceSource#getSourceName}
         * @param sourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#source_name SecuritylakeAwsLogSource#source_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceName(java.lang.String sourceName) {
            this.sourceName = sourceName;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeAwsLogSourceSource#getAccounts}
         * @param accounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#accounts SecuritylakeAwsLogSource#accounts}.
         * @return {@code this}
         */
        public Builder accounts(java.util.List<java.lang.String> accounts) {
            this.accounts = accounts;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeAwsLogSourceSource#getSourceVersion}
         * @param sourceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_aws_log_source#source_version SecuritylakeAwsLogSource#source_version}.
         * @return {@code this}
         */
        public Builder sourceVersion(java.lang.String sourceVersion) {
            this.sourceVersion = sourceVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeAwsLogSourceSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeAwsLogSourceSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeAwsLogSourceSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeAwsLogSourceSource {
        private final java.util.List<java.lang.String> regions;
        private final java.lang.String sourceName;
        private final java.util.List<java.lang.String> accounts;
        private final java.lang.String sourceVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceName = software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accounts = software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceVersion = software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.regions = java.util.Objects.requireNonNull(builder.regions, "regions is required");
            this.sourceName = java.util.Objects.requireNonNull(builder.sourceName, "sourceName is required");
            this.accounts = builder.accounts;
            this.sourceVersion = builder.sourceVersion;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        public final java.lang.String getSourceName() {
            return this.sourceName;
        }

        @Override
        public final java.util.List<java.lang.String> getAccounts() {
            return this.accounts;
        }

        @Override
        public final java.lang.String getSourceVersion() {
            return this.sourceVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("regions", om.valueToTree(this.getRegions()));
            data.set("sourceName", om.valueToTree(this.getSourceName()));
            if (this.getAccounts() != null) {
                data.set("accounts", om.valueToTree(this.getAccounts()));
            }
            if (this.getSourceVersion() != null) {
                data.set("sourceVersion", om.valueToTree(this.getSourceVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeAwsLogSource.SecuritylakeAwsLogSourceSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeAwsLogSourceSource.Jsii$Proxy that = (SecuritylakeAwsLogSourceSource.Jsii$Proxy) o;

            if (!regions.equals(that.regions)) return false;
            if (!sourceName.equals(that.sourceName)) return false;
            if (this.accounts != null ? !this.accounts.equals(that.accounts) : that.accounts != null) return false;
            return this.sourceVersion != null ? this.sourceVersion.equals(that.sourceVersion) : that.sourceVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.regions.hashCode();
            result = 31 * result + (this.sourceName.hashCode());
            result = 31 * result + (this.accounts != null ? this.accounts.hashCode() : 0);
            result = 31 * result + (this.sourceVersion != null ? this.sourceVersion.hashCode() : 0);
            return result;
        }
    }
}

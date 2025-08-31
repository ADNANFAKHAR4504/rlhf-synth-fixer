package imports.aws.codecatalyst_dev_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentRepositories")
@software.amazon.jsii.Jsii.Proxy(CodecatalystDevEnvironmentRepositories.Jsii$Proxy.class)
public interface CodecatalystDevEnvironmentRepositories extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repository_name CodecatalystDevEnvironment#repository_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#branch_name CodecatalystDevEnvironment#branch_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBranchName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodecatalystDevEnvironmentRepositories}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodecatalystDevEnvironmentRepositories}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodecatalystDevEnvironmentRepositories> {
        java.lang.String repositoryName;
        java.lang.String branchName;

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentRepositories#getRepositoryName}
         * @param repositoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repository_name CodecatalystDevEnvironment#repository_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryName(java.lang.String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentRepositories#getBranchName}
         * @param branchName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#branch_name CodecatalystDevEnvironment#branch_name}.
         * @return {@code this}
         */
        public Builder branchName(java.lang.String branchName) {
            this.branchName = branchName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodecatalystDevEnvironmentRepositories}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodecatalystDevEnvironmentRepositories build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodecatalystDevEnvironmentRepositories}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodecatalystDevEnvironmentRepositories {
        private final java.lang.String repositoryName;
        private final java.lang.String branchName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryName = software.amazon.jsii.Kernel.get(this, "repositoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.branchName = software.amazon.jsii.Kernel.get(this, "branchName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryName = java.util.Objects.requireNonNull(builder.repositoryName, "repositoryName is required");
            this.branchName = builder.branchName;
        }

        @Override
        public final java.lang.String getRepositoryName() {
            return this.repositoryName;
        }

        @Override
        public final java.lang.String getBranchName() {
            return this.branchName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryName", om.valueToTree(this.getRepositoryName()));
            if (this.getBranchName() != null) {
                data.set("branchName", om.valueToTree(this.getBranchName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentRepositories"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodecatalystDevEnvironmentRepositories.Jsii$Proxy that = (CodecatalystDevEnvironmentRepositories.Jsii$Proxy) o;

            if (!repositoryName.equals(that.repositoryName)) return false;
            return this.branchName != null ? this.branchName.equals(that.branchName) : that.branchName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryName.hashCode();
            result = 31 * result + (this.branchName != null ? this.branchName.hashCode() : 0);
            return result;
        }
    }
}

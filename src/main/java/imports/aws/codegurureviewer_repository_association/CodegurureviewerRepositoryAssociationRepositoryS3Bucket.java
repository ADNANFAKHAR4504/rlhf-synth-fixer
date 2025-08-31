package imports.aws.codegurureviewer_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepositoryS3Bucket")
@software.amazon.jsii.Jsii.Proxy(CodegurureviewerRepositoryAssociationRepositoryS3Bucket.Jsii$Proxy.class)
public interface CodegurureviewerRepositoryAssociationRepositoryS3Bucket extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#bucket_name CodegurureviewerRepositoryAssociation#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#name CodegurureviewerRepositoryAssociation#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodegurureviewerRepositoryAssociationRepositoryS3Bucket> {
        java.lang.String bucketName;
        java.lang.String name;

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#bucket_name CodegurureviewerRepositoryAssociation#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codegurureviewer_repository_association#name CodegurureviewerRepositoryAssociation#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodegurureviewerRepositoryAssociationRepositoryS3Bucket build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodegurureviewerRepositoryAssociationRepositoryS3Bucket}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodegurureviewerRepositoryAssociationRepositoryS3Bucket {
        private final java.lang.String bucketName;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepositoryS3Bucket"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodegurureviewerRepositoryAssociationRepositoryS3Bucket.Jsii$Proxy that = (CodegurureviewerRepositoryAssociationRepositoryS3Bucket.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}

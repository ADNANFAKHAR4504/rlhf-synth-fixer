package imports.aws.cleanrooms_collaboration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsCollaboration.CleanroomsCollaborationDataEncryptionMetadata")
@software.amazon.jsii.Jsii.Proxy(CleanroomsCollaborationDataEncryptionMetadata.Jsii$Proxy.class)
public interface CleanroomsCollaborationDataEncryptionMetadata extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_clear_text CleanroomsCollaboration#allow_clear_text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAllowClearText();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_duplicates CleanroomsCollaboration#allow_duplicates}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAllowDuplicates();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_joins_on_columns_with_different_names CleanroomsCollaboration#allow_joins_on_columns_with_different_names}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAllowJoinsOnColumnsWithDifferentNames();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#preserve_nulls CleanroomsCollaboration#preserve_nulls}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPreserveNulls();

    /**
     * @return a {@link Builder} of {@link CleanroomsCollaborationDataEncryptionMetadata}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsCollaborationDataEncryptionMetadata}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsCollaborationDataEncryptionMetadata> {
        java.lang.Object allowClearText;
        java.lang.Object allowDuplicates;
        java.lang.Object allowJoinsOnColumnsWithDifferentNames;
        java.lang.Object preserveNulls;

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowClearText}
         * @param allowClearText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_clear_text CleanroomsCollaboration#allow_clear_text}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowClearText(java.lang.Boolean allowClearText) {
            this.allowClearText = allowClearText;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowClearText}
         * @param allowClearText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_clear_text CleanroomsCollaboration#allow_clear_text}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowClearText(com.hashicorp.cdktf.IResolvable allowClearText) {
            this.allowClearText = allowClearText;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowDuplicates}
         * @param allowDuplicates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_duplicates CleanroomsCollaboration#allow_duplicates}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowDuplicates(java.lang.Boolean allowDuplicates) {
            this.allowDuplicates = allowDuplicates;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowDuplicates}
         * @param allowDuplicates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_duplicates CleanroomsCollaboration#allow_duplicates}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowDuplicates(com.hashicorp.cdktf.IResolvable allowDuplicates) {
            this.allowDuplicates = allowDuplicates;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowJoinsOnColumnsWithDifferentNames}
         * @param allowJoinsOnColumnsWithDifferentNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_joins_on_columns_with_different_names CleanroomsCollaboration#allow_joins_on_columns_with_different_names}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowJoinsOnColumnsWithDifferentNames(java.lang.Boolean allowJoinsOnColumnsWithDifferentNames) {
            this.allowJoinsOnColumnsWithDifferentNames = allowJoinsOnColumnsWithDifferentNames;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getAllowJoinsOnColumnsWithDifferentNames}
         * @param allowJoinsOnColumnsWithDifferentNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#allow_joins_on_columns_with_different_names CleanroomsCollaboration#allow_joins_on_columns_with_different_names}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowJoinsOnColumnsWithDifferentNames(com.hashicorp.cdktf.IResolvable allowJoinsOnColumnsWithDifferentNames) {
            this.allowJoinsOnColumnsWithDifferentNames = allowJoinsOnColumnsWithDifferentNames;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getPreserveNulls}
         * @param preserveNulls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#preserve_nulls CleanroomsCollaboration#preserve_nulls}. This parameter is required.
         * @return {@code this}
         */
        public Builder preserveNulls(java.lang.Boolean preserveNulls) {
            this.preserveNulls = preserveNulls;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationDataEncryptionMetadata#getPreserveNulls}
         * @param preserveNulls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#preserve_nulls CleanroomsCollaboration#preserve_nulls}. This parameter is required.
         * @return {@code this}
         */
        public Builder preserveNulls(com.hashicorp.cdktf.IResolvable preserveNulls) {
            this.preserveNulls = preserveNulls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsCollaborationDataEncryptionMetadata}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsCollaborationDataEncryptionMetadata build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsCollaborationDataEncryptionMetadata}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsCollaborationDataEncryptionMetadata {
        private final java.lang.Object allowClearText;
        private final java.lang.Object allowDuplicates;
        private final java.lang.Object allowJoinsOnColumnsWithDifferentNames;
        private final java.lang.Object preserveNulls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowClearText = software.amazon.jsii.Kernel.get(this, "allowClearText", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowDuplicates = software.amazon.jsii.Kernel.get(this, "allowDuplicates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowJoinsOnColumnsWithDifferentNames = software.amazon.jsii.Kernel.get(this, "allowJoinsOnColumnsWithDifferentNames", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.preserveNulls = software.amazon.jsii.Kernel.get(this, "preserveNulls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowClearText = java.util.Objects.requireNonNull(builder.allowClearText, "allowClearText is required");
            this.allowDuplicates = java.util.Objects.requireNonNull(builder.allowDuplicates, "allowDuplicates is required");
            this.allowJoinsOnColumnsWithDifferentNames = java.util.Objects.requireNonNull(builder.allowJoinsOnColumnsWithDifferentNames, "allowJoinsOnColumnsWithDifferentNames is required");
            this.preserveNulls = java.util.Objects.requireNonNull(builder.preserveNulls, "preserveNulls is required");
        }

        @Override
        public final java.lang.Object getAllowClearText() {
            return this.allowClearText;
        }

        @Override
        public final java.lang.Object getAllowDuplicates() {
            return this.allowDuplicates;
        }

        @Override
        public final java.lang.Object getAllowJoinsOnColumnsWithDifferentNames() {
            return this.allowJoinsOnColumnsWithDifferentNames;
        }

        @Override
        public final java.lang.Object getPreserveNulls() {
            return this.preserveNulls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allowClearText", om.valueToTree(this.getAllowClearText()));
            data.set("allowDuplicates", om.valueToTree(this.getAllowDuplicates()));
            data.set("allowJoinsOnColumnsWithDifferentNames", om.valueToTree(this.getAllowJoinsOnColumnsWithDifferentNames()));
            data.set("preserveNulls", om.valueToTree(this.getPreserveNulls()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsCollaboration.CleanroomsCollaborationDataEncryptionMetadata"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsCollaborationDataEncryptionMetadata.Jsii$Proxy that = (CleanroomsCollaborationDataEncryptionMetadata.Jsii$Proxy) o;

            if (!allowClearText.equals(that.allowClearText)) return false;
            if (!allowDuplicates.equals(that.allowDuplicates)) return false;
            if (!allowJoinsOnColumnsWithDifferentNames.equals(that.allowJoinsOnColumnsWithDifferentNames)) return false;
            return this.preserveNulls.equals(that.preserveNulls);
        }

        @Override
        public final int hashCode() {
            int result = this.allowClearText.hashCode();
            result = 31 * result + (this.allowDuplicates.hashCode());
            result = 31 * result + (this.allowJoinsOnColumnsWithDifferentNames.hashCode());
            result = 31 * result + (this.preserveNulls.hashCode());
            return result;
        }
    }
}

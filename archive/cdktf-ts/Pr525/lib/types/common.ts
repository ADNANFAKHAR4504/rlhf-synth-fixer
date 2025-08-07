/**
 * Defines a common interface for tags to be applied across resources.
 */
export interface CommonTags {
  Project: string;
  Environment: string;
  Owner: string;
  [key: string]: string; // Allows for additional arbitrary tags
}

/**
 * Defines base properties for constructs, including common tags.
 */
export interface BaseConstructProps {
  tags: CommonTags;
}

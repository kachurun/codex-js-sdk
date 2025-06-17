/**
 * Utilities for handling Codex configuration
 */
/**
 * Flattens a nested configuration object into dot-notation key-value pairs
 * @param obj - The configuration object to flatten
 * @param prefix - Optional prefix for nested keys
 * @returns Array of [key, value] pairs with dot notation for nested keys
 */
export declare function flattenConfig(obj: Record<string, unknown>, prefix?: string): Array<[string, unknown]>;
/**
 * Converts a camelCase string to snake_case
 * @param str - The string to convert
 * @returns The converted string in snake_case
 */
export declare function camelToSnakeCase(str: string): string;
/**
 * Converts a configuration object to command line arguments
 * @param config - The configuration object to convert
 * @returns Array of command line argument pairs as readonly tuples
 */
export declare function configToArgs(config: Record<string, unknown>): readonly string[];
//# sourceMappingURL=config.d.ts.map
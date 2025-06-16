/**
 * Utilities for handling Codex configuration
 */

/**
 * Flattens a nested configuration object into dot-notation key-value pairs
 * @param obj - The configuration object to flatten
 * @param prefix - Optional prefix for nested keys
 * @returns Array of [key, value] pairs with dot notation for nested keys
 */
export function flattenConfig(obj: Record<string, unknown>, prefix = ''): Array<[string, unknown]> {
    return Object.entries(obj).flatMap(([k, v]) => {
        const newKey = prefix ? `${ prefix }.${ k }` : k;

        if (v && typeof v === 'object' && !Array.isArray(v) && v !== null) {
            return flattenConfig(v as Record<string, unknown>, newKey);
        }

        return [[newKey, v]];
    });
}

/**
 * Converts a camelCase string to snake_case
 * @param str - The string to convert
 * @returns The converted string in snake_case
 */
export function camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${ letter.toLowerCase() }`);
}

/**
 * Converts a configuration object to command line arguments
 * @param config - The configuration object to convert
 * @returns Array of command line argument pairs as readonly tuples
 */
export function configToArgs(config: Record<string, unknown>): readonly string[] {
    return Object.entries(config).flatMap(([key, value]) => {
        const entries = flattenConfig({ [key]: value });

        return entries.map(([k, v]) => {
            const configKey = camelToSnakeCase(k);
            // Stringify the value as JSON, but handle primitive values specially
            const configValue = typeof v === 'string' ? v : JSON.stringify(v);

            return `-c ${ configKey }=${ configValue }`;
        });
    });
}

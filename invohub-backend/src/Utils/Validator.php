<?php

namespace InvoHub\Utils;

class Validator
{
    public static function validate(?array $data, array $rules): array
    {
        $data ??= [];
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $ruleList = explode('|', $ruleString);

            foreach ($ruleList as $rule) {
                [$name, $parameter] = array_pad(explode(':', $rule, 2), 2, null);

                if ($name === 'required' && self::isEmpty($value)) {
                    $errors[$field][] = 'This field is required.';
                    continue;
                }

                if (self::isEmpty($value)) {
                    continue;
                }

                switch ($name) {
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field][] = 'A valid email address is required.';
                        }
                        break;

                    case 'min':
                        if (mb_strlen((string) $value) < (int) $parameter) {
                            $errors[$field][] = "Minimum length is {$parameter}.";
                        }
                        break;

                    case 'max':
                        if (mb_strlen((string) $value) > (int) $parameter) {
                            $errors[$field][] = "Maximum length is {$parameter}.";
                        }
                        break;

                    case 'string':
                        if (!is_string($value)) {
                            $errors[$field][] = 'Must be a string.';
                        }
                        break;

                    case 'numeric':
                        if (!is_numeric($value)) {
                            $errors[$field][] = 'Must be numeric.';
                        }
                        break;

                    case 'array':
                        if (!is_array($value)) {
                            $errors[$field][] = 'Must be an array.';
                        }
                        break;

                    case 'in':
                        $allowed = array_map('trim', explode(',', (string) $parameter));
                        if (!in_array((string) $value, $allowed, true)) {
                            $errors[$field][] = 'Contains an invalid value.';
                        }
                        break;
                }
            }
        }

        return $errors;
    }

    private static function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '';
    }
}

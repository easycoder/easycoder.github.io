# Conformance Runner Contract

This document defines the runner input/output contract used by all EasyCoder implementations.

## 1. Inputs

A runner must accept:
- Path to a test metadata file (`conformance/tests/EC-xxxx-*.json`).
- Path to the matching `.ecs` script (from the metadata `script` field).
- Optional timeout in milliseconds.

## 2. Expected Metadata Fields

Each test JSON provides:
- `id`: stable test id.
- `specVersion`: target spec version.
- `required`: whether failure blocks compatibility.
- `expect.logs`: ordered expected output records.
- `expect.error`: expected error object or `null`.

## 3. Runner Result Schema

Each executed test returns:

```json
{
  "id": "EC-0001",
  "status": "pass",
  "actual": {
    "logs": ["hello"],
    "error": null
  },
  "details": "optional note"
}
```

Allowed `status` values:
- `pass`
- `fail`
- `skip`

## 4. Comparison Rules

- `actual.logs` must match expected logs exactly and in order.
- If `expect.error` is `null`, no runtime/compile error is allowed.
- If `expect.error` is non-null, category must match and message should be comparable.

## 5. Aggregate Report

Implementations should emit aggregate results in parity-report format (see `conformance/parity-report-template.json`).

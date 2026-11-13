# Tests

- `acceptance/`: criteria T01–T15 (V1) and Search Intelligence criteria A.10.
- `baseline/`: reproducible traffic/CPU/RAM/energy comparison against stock Firefox on the same device.
- `tools/marionette.py`: minimal client to drive Firefox in tests (temporary install of unsigned extensions, toolbar button, scripts in pages). Works headless on Firefox 160.0.
- Each acceptance folder has a `run.py FIREFOX_DIR` that drives a real Firefox, and where the logic is separable a `unit.js` (`node`).

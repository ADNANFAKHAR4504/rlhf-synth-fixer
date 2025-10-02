let configGetMock = jest.fn((key) => {
  if (key === 'environment') return 'test';
  return undefined;
});

let configRequireMock = jest.fn((key) => {
  if (key === 'domainName') return 'test.example.com';
  return 'test-value';
});

module.exports = {
  Config: jest.fn(() => ({
    get: configGetMock,
    require: configRequireMock,
  })),
  _setConfigGetMock: (fn) => { configGetMock = fn; },
  _setConfigRequireMock: (fn) => { configRequireMock = fn; },
  interpolate: jest.fn((strings, ...values) => {
    if (!strings) return '';
    if (typeof strings === 'string') return strings;
    let result = strings[0] || '';
    for (let i = 0; i < values.length; i++) {
      result += (values[i] || '') + (strings[i + 1] || '');
    }
    return result;
  }),
  output: (val) => val,
  all: (vals) => ({
    apply: (fn) => fn(vals),
  }),
};
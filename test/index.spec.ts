import index from '../src/';
import {RinnaiControlrHomebridgePlatform} from '../src/platform';
import {API} from 'homebridge';

describe('Platform should be registered correctly', () => {
  it('SendResultFailedRatio', () => {
    const api : API = {registerPlatform: jest.fn()} as unknown as API;
    index(api);

    expect(api.registerPlatform).toBeCalledWith('RinnaiControlR', expect.anything());
  });
});
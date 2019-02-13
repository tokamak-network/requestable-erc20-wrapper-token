const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const MintableToken = artifacts.require('./MintableToken.sol');

const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const tokenAddress = process.env.TOKEN;
const rootchainAddress = process.env.ROOTCHAIN || '0x00';

module.exports = function (deployer) {
  if (tokenAddress) {
    deployer.deploy(RequestableERC20Wrapper, development, rootchainAddress, tokenAddress);
    return;
  }

  deployer.deploy(MintableToken).then((token) =>
    deployer.deploy(RequestableERC20Wrapper, development, rootchainAddress, token.address)
  ).catch(e => { throw e; });
};

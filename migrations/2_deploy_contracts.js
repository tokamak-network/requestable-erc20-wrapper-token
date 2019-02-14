const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const MintableToken = artifacts.require('./MintableToken.sol');

const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const tokenAddress = process.env.TOKEN;

module.exports = function (deployer) {
  if (tokenAddress) {
    deployer.deploy(RequestableERC20Wrapper, development, tokenAddress);
    return;
  }

  deployer.deploy(MintableToken).then((token) =>
    deployer.deploy(RequestableERC20Wrapper, development, token.address)
  ).catch(e => { throw e; });
};

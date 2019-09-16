const RequestableERC20 = artifacts.require('./RequestableERC20.sol');
const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');

const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const tokenAddress = process.env.TOKEN;

module.exports = function (deployer) {
  deployer.deploy(RequestableERC20, development);

  if (tokenAddress) {
    deployer.deploy(RequestableERC20Wrapper, development, tokenAddress);
    return;
  }

  deployer.deploy(ERC20Mintable).then((token) =>
    deployer.deploy(RequestableERC20Wrapper, development, token.address)
  ).catch(e => { throw e; });

};

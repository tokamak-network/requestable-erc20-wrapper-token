const BN = require('bn.js');

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');
const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const RequestableERC20Mintable = artifacts.require('./RequestableERC20Mintable.sol');

const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const lockInRootChain = process.env.LOCK_IN_ROOTCHAIN === 'true';
const initialSupply = process.env.LOCK_IN_ROOTCHAIN || '0';
const tokenAddress = process.env.TOKEN;

module.exports = function (deployer) {
  if (tokenAddress) {
    deployer.deploy(RequestableERC20Wrapper, development, lockInRootChain, initialSupply, tokenAddress);
    return;
  }

  deployer.deploy(RequestableERC20Mintable, development, lockInRootChain).then((token) =>
    deployer.deploy(RequestableERC20Wrapper, development, lockInRootChain, token.address)
  ).catch(e => { throw e; });
};

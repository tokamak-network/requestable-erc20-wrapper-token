const BN = require('bn.js');

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');
const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const RequestableERC20Mintable = artifacts.require('./RequestableERC20MintableMock.sol');
const RequestableERC20Burnable = artifacts.require('./RequestableERC20BurnableMock.sol');
const RequestableERC20MintableBurnable = artifacts.require('./RequestableERC20MintableBurnableMock.sol');

const development = process.env.DEVELOPMENT || false;
const lockInRootChain = process.env.LOCK_IN_ROOTCHAIN === 'true';
const initialSupply = process.env.INITIAL_SUPPLY || '0';
const tokenAddress = process.env.TOKEN;

const mintable = process.env.MINTABLE || false;
const burnable = process.env.BURNABLE || false;

module.exports = async function (deployer) {
  console.log(`
  Deployment parameters
    development     ${development}
    lockInRootChain ${Boolean(lockInRootChain)}
    initialSupply   ${initialSupply}
    tokenAddress    ${tokenAddress || '0x'}
    mintable        ${Boolean(mintable)}
    burnable        ${Boolean(burnable)}
`);

  if (tokenAddress) {
    console.log(`Deploying RequestableERC20Wrapper with token ${tokenAddress}`);
    await deployer.deploy(RequestableERC20Wrapper, development, lockInRootChain, tokenAddress);
    return;
  }

  const deployToken = () => {
    if (mintable && burnable) return deployer.deploy(RequestableERC20MintableBurnable, development, lockInRootChain);
    if (mintable) return deployer.deploy(RequestableERC20Mintable, development, lockInRootChain);
    if (burnable) return deployer.deploy(RequestableERC20Burnable, development, lockInRootChain, initialSupply);
    return deployer.deploy(RequestableERC20, development, lockInRootChain, initialSupply);
  };

  const token = await deployToken();
};

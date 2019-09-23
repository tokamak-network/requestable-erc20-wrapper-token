const chai = require('chai');
const { shouldBehaveLikeRequestableERC20 } = require('./RequestableERC20.behavior');
chai.use(require('chai-bn')(web3.utils.BN));

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');

const { toBN, toHex } = web3.utils;

const { expect } = chai;

contract('RequestableERC20', function (accounts) {
  const [owner, user] = accounts;

  const development = true;
  const lockInRootChain = false;
  const initialSupply = toBN(100e18);

  const tokenAmount = toBN(1e18);

  before(async function () {
    this.token = await RequestableERC20.new(development, lockInRootChain, initialSupply);
    await this.token.transfer(user, tokenAmount, { from: owner });
  });

  shouldBehaveLikeRequestableERC20(owner, user);
});

const RLP = require('rlp');
const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
const { shouldBehaveLikeRequestableERC20 } = require('./RequestableERC20.behavior');
const {
  shouldBehaveLikeRequestableERC20Burnable,
  shouldBehaveLikeRequestableERC20BurnableBasic,
} = require('./RequestableERC20Burnable.behavior');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const RequestableERC20Burnable = artifacts.require('./RequestableERC20BurnableMock.sol');

const { expect } = chai;

const toLowerCase = (l) => l.map(s => s.toLowerCase());

contract('RequestableERC20Burnable', function (accounts) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  const development = true;
  const lockInRootChain = false;

  const initialSupply = toBN(1e20);
  const tokenAmount = toBN(1e18);

  before(async function () {
    this.token = await RequestableERC20Burnable.new(development, lockInRootChain, initialSupply);
  });

  describe('Requestable', function () {
    before(async function () {
      await this.token.transfer(user1, tokenAmount);
    });

    shouldBehaveLikeRequestableERC20(owner, user1, 0);

    shouldBehaveLikeRequestableERC20Burnable(accounts, 1e4);
  });

  shouldBehaveLikeRequestableERC20BurnableBasic(accounts, tokenAmount);
});

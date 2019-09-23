const RLP = require('rlp');
const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
const { shouldBehaveLikeRequestableERC20 } = require('./RequestableERC20.behavior');
const {
  shouldBehaveLikeRequestableERC20Mintable,
  shouldBehaveLikeRequestableERC20MintableBasic,
} = require('./RequestableERC20Mintable.behavior');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const RequestableERC20Mintable = artifacts.require('./RequestableERC20MintableMock.sol');

const { expect } = chai;

const toLowerCase = (l) => l.map(s => s.toLowerCase());

contract('RequestableERC20Mintable', function (accounts) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  const development = true;
  const lockInRootChain = false;

  const tokenAmount = toBN(1e18);

  before(async function () {
    this.token = await RequestableERC20Mintable.new(development, lockInRootChain);
  });

  describe('Requestable', function () {
    before(async function () {
      await this.token.mint(user1, tokenAmount);
    });

    shouldBehaveLikeRequestableERC20(owner, user1, 0);

    shouldBehaveLikeRequestableERC20Mintable(accounts, 1e4);
  });

  shouldBehaveLikeRequestableERC20MintableBasic(accounts, tokenAmount);
});

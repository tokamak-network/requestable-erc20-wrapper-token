const chai = require('chai');
const { shouldBehaveLikeRequestableERC20 } = require('./RequestableERC20.behavior');
const {
  shouldBehaveLikeRequestableERC20Mintable,
  shouldBehaveLikeRequestableERC20MintableBasic,
} = require('./RequestableERC20Mintable.behavior');
const {
  shouldBehaveLikeRequestableERC20Burnable,
  shouldBehaveLikeRequestableERC20BurnableBasic,
} = require('./RequestableERC20Burnable.behavior');

chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const RequestableERC20MintableBurnable = artifacts.require('./RequestableERC20MintableBurnableMock.sol');

const toLowerCase = (l) => l.map(s => s.toLowerCase());

contract('RequestableERC20MintableBurnable', function (accounts) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  const development = true;
  const lockInRootChain = false;

  const tokenAmount = toBN(1e18);

  before(async function () {
    this.token = await RequestableERC20MintableBurnable.new(development, lockInRootChain);
    await this.token.mint(owner, tokenAmount);
  });

  describe('Requestable', function () {
    before(async function () {
      await this.token.mint(user1, tokenAmount);
    });

    shouldBehaveLikeRequestableERC20(owner, user1, 0);

    shouldBehaveLikeRequestableERC20Mintable(accounts, 1e4);
    shouldBehaveLikeRequestableERC20Burnable(accounts, 2e4);
  });

  shouldBehaveLikeRequestableERC20MintableBasic(accounts, tokenAmount);
  shouldBehaveLikeRequestableERC20BurnableBasic(accounts, tokenAmount);
});

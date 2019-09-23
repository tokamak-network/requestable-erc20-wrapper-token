const RLP = require('rlp');
const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN, toHex } = web3.utils;

const { expect } = chai;

function shouldBehaveLikeRequestableERC20 (owner, user) {
  const tokenAmount = toBN(1000000);
  const requestAmount = toBN(100);
  const overTokenAmount = toBN(1e19);

  let requestId = 0;

  describe('Apply request', function () {
    let trieKey;
    const trieValue = RLP.encode([owner, toHex(requestAmount)]);
    const overTrieValue = RLP.encode([owner, toHex(overTokenAmount)]);

    before(async function () {
      trieKey = await this.token.KEY_ALLOWANCE();
      await this.token.approve(user, tokenAmount);
    });

    describe('#allowances', function () {
      describe('#Enter', function () {
        const isExit = false;

        it('cannot make an enter request over allowance', async function () {
          await expectRevert(
            this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue),
            'SafeMath: subtraction overflow',
          );
        });

        it('can make an enter request', async function () {
          const allowance0 = await this.token.allowance(owner, user);

          await this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await this.token.allowance(owner, user);

          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount.neg());
        });

        it('balance in child chain should be updated', async function () {
          const allowance0 = await this.token.allowance(owner, user);

          await this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await this.token.allowance(owner, user);

          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount);
        });
      });
      describe('#Exit', function () {
        const isExit = true;

        it('cannot make an exit request over his balance', async function () {
          await expectRevert(
            this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
            'SafeMath: subtraction overflow',
          );
        });

        it('can make an exit request', async function () {
          const allowance0 = await this.token.allowance(owner, user);

          await this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await this.token.allowance(owner, user);
          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount.neg());
        });

        it('balance in root chain should be updated', async function () {
          const allowance0 = await this.token.allowance(owner, user);

          await this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await this.token.allowance(owner, user);
          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount);
        });
      });
    });
  });

  describe('#balances', function () {
    let trieKey;
    const trieValue = RLP.encode(toHex(requestAmount));
    const overTrieValue = RLP.encode(toHex(overTokenAmount));

    before(async function () {
      trieKey = await this.token.KEY_BALANCES();
    });

    describe('#Enter', function () {
      const isExit = false;

      it('cannot make an enter request over his balance', async function () {
        await expectRevert.unspecified(
          this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an enter request', async function () {
        const balance0 = await this.token.balanceOf(user);

        await this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await this.token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount.neg());
      });

      it('balance in child chain shoul d be updated', async function () {
        const balance0 = await this.token.balanceOf(user);

        await this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await this.token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount);
      });
    });
    describe('#Exit', function () {
      const isExit = true;

      it('cannot make an exit request over his balance', async function () {
        await expectRevert.unspecified(
          this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an exit request', async function () {
        const balance0 = await this.token.balanceOf(user);

        await this.token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await this.token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount.neg());
      });

      it('balance in root chain should be updated', async function () {
        const balance0 = await this.token.balanceOf(user);

        await this.token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await this.token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeRequestableERC20,
}
;

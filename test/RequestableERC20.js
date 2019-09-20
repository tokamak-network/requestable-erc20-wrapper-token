const RLP = require('rlp');
const { expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { padLeft, padRight } = require('./helpers/pad');
const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');

const { toBN, toHex } = web3.utils;

const { expect } = chai;

const nullAddress = '0x0000000000000000000000000000000000000000';

contract('RequestableERC20', (accounts) => {
  const [owner, user] = accounts;

  const development = true;
  const lockInRootChain = false;
  const initialSupply = toBN(100e18);

  const tokenAmount = toBN(1000000);
  const requestAmount = toBN(100);
  const overTokenAmount = toBN(1e19);

  let token;

  let requestId = 0;

  before(async () => {
    token = await RequestableERC20.new(development, lockInRootChain, initialSupply);

    await token.transfer(user, tokenAmount, { from: owner });
  });

  describe('Apply request', () => {
    let trieKey;
    const trieValue = RLP.encode([owner, toHex(requestAmount)]);
    const overTrieValue = RLP.encode([owner, toHex(overTokenAmount)]);

    before(async () => {
      trieKey = await token.KEY_ALLOWANCE();
      await token.approve(user, tokenAmount);
    });

    describe('#allowances', () => {
      describe('#Enter', () => {
        const isExit = false;

        it('cannot make an enter request over allowance', async () => {
          await expectRevert(
            token.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue),
            'SafeMath: subtraction overflow',
          );
        });

        it('can make an enter request', async () => {
          const allowance0 = await token.allowance(owner, user);

          await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await token.allowance(owner, user);

          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount.neg());
        });

        it('balance in child chain should be updated', async () => {
          const allowance0 = await token.allowance(owner, user);

          await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await token.allowance(owner, user);

          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount);
        });
      });
      describe('#Exit', () => {
        const isExit = true;

        it('cannot make an exit request over his balance', async () => {
          await expectRevert(
            token.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
            'SafeMath: subtraction overflow',
          );
        });

        it('can make an exit request', async () => {
          const allowance0 = await token.allowance(owner, user);

          await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await token.allowance(owner, user);
          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount.neg());
        });

        it('balance in root chain should be updated', async () => {
          const allowance0 = await token.allowance(owner, user);

          await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

          const allowance1 = await token.allowance(owner, user);
          expect(allowance1.sub(allowance0)).to.be.bignumber.equal(requestAmount);
        });
      });
    });
  });

  describe('#balances', () => {
    let trieKey;
    const trieValue = RLP.encode(toHex(requestAmount));
    const overTrieValue = RLP.encode(toHex(overTokenAmount));

    before(async () => {
      trieKey = await token.KEY_BALANCES();
    });

    describe('#Enter', () => {
      const isExit = false;

      it('cannot make an enter request over his balance', async () => {
        await expectRevert.unspecified(
          token.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an enter request', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount.neg());
      });

      it('balance in child chain shoul d be updated', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount);
      });
    });
    describe('#Exit', () => {
      const isExit = true;

      it('cannot make an exit request over his balance', async () => {
        await expectRevert.unspecified(
          token.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an exit request', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount.neg());
      });

      it('balance in root chain should be updated', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(requestAmount);
      });
    });
  });
});

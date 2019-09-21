const { expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { padLeft, padRight } = require('./helpers/pad');
const chai = require('chai');

const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');

chai.use(require('chai-bn')(web3.utils.BN));

const { expect } = chai;
const development = true;

contract('RequestableERC20Wrapper', (accounts) => {
  const owner = accounts[0];
  const user = accounts[1];

  const pHundred = '100';
  const mHundred = '-100';
  const pMillion = '1000000';

  const tokenAmount = web3.utils.toBN(pMillion);
  const requestAmount = web3.utils.toBN(pHundred);

  let token, wrapper;

  before(async () => {
    token = await ERC20Mintable.new();
    wrapper = await RequestableERC20Wrapper.new(development, token.address);

    console.log(`
      token:    ${token.address}
      wrapper:  ${wrapper.address}
    `);

    await wrapper.init(owner);
    await token.mint(user, tokenAmount);
  });

  describe('deposit and withdraw', async () => {
    it('user can deposit token', async () => {
      expect(await token.balanceOf(user)).to.be.bignumber.equal(pMillion);

      await token.approve(wrapper.address, tokenAmount, { from: user, gas: 9000000 });

      await wrapper.deposit(tokenAmount, { from: user });
      expect(await token.balanceOf(user)).to.be.bignumber.equal('0');
      expect(await wrapper.balanceOf(user)).to.be.bignumber.equal(pMillion);
    });

    it('user can withdraw token', async () => {
      await wrapper.withdraw(requestAmount, { from: user, gas: 9000000 });
      expect(await token.balanceOf(user)).to.be.bignumber.equal(pHundred);
      expect(await wrapper.balanceOf(user)).to.be.bignumber.equal('999900');
    });
  });

  describe('request on token balance', () => {
    let requestId = 0;
    let trieKey;
    const trieValue = padLeft(requestAmount);

    before(async () => {
      trieKey = await wrapper.getBalanceTrieKey(user);
    });

    describe('#Enter', () => {
      const isExit = false;

      it('cannot make an enter request over his balance', async () => {
        const overTokenAmount = web3.utils.toBN(1e19);
        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          wrapper.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue, { gas: 9000000 }),
        );
      });

      it('can make an enter request', async () => {
        const balance0 = await wrapper.balanceOf(user);

        await wrapper.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await wrapper.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(mHundred);
      });

      it('balance in child chain should be updated', async () => {
        const balance0 = await wrapper.balanceOf(user);

        await wrapper.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await wrapper.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(pHundred);
      });
    });

    describe('#Exit', () => {
      const isExit = true;

      it('cannot make an exit request over his balance', async () => {
        const overTokenAmount = web3.utils.toBN(1e19);
        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          wrapper.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an exit request', async () => {
        const balance0 = await wrapper.balanceOf(user);

        await wrapper.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await wrapper.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(mHundred);
      });

      it('balance in root chain should be updated', async () => {
        const balance0 = await wrapper.balanceOf(user);

        await wrapper.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await wrapper.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(pHundred);
      });
    });
  });
});

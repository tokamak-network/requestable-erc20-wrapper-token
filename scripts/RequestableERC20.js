const { expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { padLeft, padRight } = require('./helpers/pad');
const chai = require('chai');

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');

chai.use(require('chai-bn')(web3.utils.BN));

const { expect } = chai;

contract('RequestableERC20', (accounts) => {
  const owner = accounts[0];
  const user = accounts[1];

  const pHundred = '100'
  const mHundred = '-100'

  const tokenAmount = web3.utils.toBN(1000000);
  const requestAmount = web3.utils.toBN(pHundred);

  let token;

  before(async () => {
    token = await RequestableERC20.deployed();

    console.log(`token:    ${token.address}`);

    await token.mint(user, tokenAmount, {from: owner});
  });

  describe('Valid Mint Token by Owner', async () => {
    it('Check Balance of User', async () => {
      expect(await token.balanceOf(user)).to.be.bignumber.equal(tokenAmount);
    });
  });

  describe('Invalid Mint Token by User', async () => {
    it('Mint Token User by self', async () => {
      await expectRevert.unspecified(
        token.mint(user, tokenAmount, {from: user})
      );
    });
  });

  describe('Add an Address into minters', async () => {
    it('append 0x00..01 into minters array)', async () => {
       const zeroOne = "0x0000000000000000000000000000000000000001"
       await token.addMinter(zeroOne);
       expect(await token.isMinter(zeroOne)).to.be.equal(true);
    });
  });

  describe('Check Ownership as Minter', async () => {
    it('renounce Minter(removed minter list)', async () => {
      await token.renounceMinter();
      await expectRevert.unspecified(
        token.mint(user, tokenAmount, {from: owner})
      );
    });
  });

  describe('Start Enter and Exit test', () => {
    let requestId = 0;
    let trieKey;
    const trieValue = padLeft(requestAmount);

    before(async () => {
      trieKey = await token.getBalanceTrieKey(user);
    });

    describe('#Enter', () => {
      const isExit = false;

      it('cannot make an enter request over his balance', async () => {
        const overTokenAmount = web3.utils.toBN(1e19);
        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          token.applyRequestInRootChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an enter request', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(mHundred)
      });

      it('balance in child chain should be updated', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);

        expect(balance1.sub(balance0)).to.be.bignumber.equal(pHundred);
      });
    });

    describe('#Exit', () => {
      const isExit = true;

      it('cannot make an exit request over his balance', async () => {
        const overTokenAmount = web3.utils.toBN(1e19);
        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          token.applyRequestInChildChain(isExit, requestId++, user, trieKey, overTrieValue),
        );
      });

      it('can make an exit request', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInChildChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(mHundred)
      });

      it('balance in root chain should be updated', async () => {
        const balance0 = await token.balanceOf(user);

        await token.applyRequestInRootChain(isExit, requestId++, user, trieKey, trieValue);

        const balance1 = await token.balanceOf(user);
        expect(balance1.sub(balance0)).to.be.bignumber.equal(pHundred)
      });
    });
  });
});

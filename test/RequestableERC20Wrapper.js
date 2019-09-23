const { expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { balance } = require('openzeppelin-test-helpers');
const { padLeft, padRight } = require('./helpers/pad');
const chai = require('chai');

const RequestableERC20 = artifacts.require('./RequestableERC20.sol');
const RequestableERC20Wrapper = artifacts.require('./RequestableERC20Wrapper.sol');

chai.use(require('chai-bn')(web3.utils.BN));

const { toBN, toHex } = web3.utils;

const { expect } = chai;

contract('RequestableERC20Wrapper', (accounts) => {
  const [owner, user] = accounts;

  const development = true;
  const lockInRootChain = false;
  const initialSupply = toBN(100e18);

  const tokenAmount = toBN(1e6);
  const requestAmount = toBN(100);

  let token, wrapper;

  before(async () => {
    token = await RequestableERC20.new(development, lockInRootChain, initialSupply);
    wrapper = await RequestableERC20Wrapper.new(development, lockInRootChain, token.address);

    await token.transfer(user, tokenAmount);

    console.log(`
      token:    ${token.address}
      wrapper:  ${wrapper.address}
    `);

    await wrapper.init(owner);
  });

  describe('deposit and withdraw', async () => {
    it('user can deposit token', async () => {
      const tokenBalance0 = await token.balanceOf(user);
      const wrapperBalance0 = await wrapper.balanceOf(user);

      await token.approve(wrapper.address, requestAmount, { from: user });
      await wrapper.deposit(requestAmount, { from: user });

      const tokenBalance1 = await token.balanceOf(user);
      const wrapperBalance1 = await wrapper.balanceOf(user);

      expect(tokenBalance1.sub(tokenBalance0)).to.be.bignumber.equal(requestAmount.neg());
      expect(wrapperBalance1.sub(wrapperBalance0)).to.be.bignumber.equal(requestAmount);
    });

    it('user can withdraw token', async () => {
      const tokenBalance0 = await token.balanceOf(user);
      const wrapperBalance0 = await wrapper.balanceOf(user);

      await wrapper.withdraw(requestAmount, { from: user });

      const tokenBalance1 = await token.balanceOf(user);
      const wrapperBalance1 = await wrapper.balanceOf(user);

      expect(tokenBalance1.sub(tokenBalance0)).to.be.bignumber.equal(requestAmount);
      expect(wrapperBalance1.sub(wrapperBalance0)).to.be.bignumber.equal(requestAmount.neg());
    });
  });
});

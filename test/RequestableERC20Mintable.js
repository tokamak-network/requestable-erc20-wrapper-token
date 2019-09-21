const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const RequestableERC20Mintable = artifacts.require('./RequestableERC20Mintable.sol');

const { expect } = chai;

const toLowerCase = (l) => l.map(s => s.toLowerCase());

contract('RequestableERC20Mintable', (accounts) => {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  const development = true;
  const lockInRootChain = false;

  const tokenAmount = toBN(1e18);

  let token;

  before(async () => {
    console.log(`
    owner: ${owner}
    user1: ${user1}
    user2: ${user2}
    other: ${other}
    `);
    token = await RequestableERC20Mintable.new(development, lockInRootChain);
  });

  it('deployer should has minter role', async () => {
    expect(await token.isMinter(owner)).to.be.equal(true);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(1);
    expect(minters[0]).to.be.equal(owner);
  });

  it('can add new minter', async () => {
    await token.addMinter(user1);
    expect(await token.isMinter(user1)).to.be.equal(true);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(2);
    expect(minters[0]).to.be.equal(owner);
    expect(minters[1]).to.be.equal(user1);
  });

  it('can add new minter again', async () => {
    await token.addMinter(user2, { from: user1 });
    expect(await token.isMinter(user2)).to.be.equal(true);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(3);
    expect(minters[0]).to.be.equal(owner);
    expect(minters[1]).to.be.equal(user1);
    expect(minters[2]).to.be.equal(user2);
  });

  it('should remove owner', async () => {
    await token.renounceMinter({ from: user1 });
    expect(await token.isMinter(user1)).to.be.equal(false);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(2);
    expect(minters[0]).to.be.equal(owner);
    expect(minters[1]).to.be.equal(user2);
  });

  it('should remove owner again', async () => {
    await token.renounceMinter({ from: user2 });
    expect(await token.isMinter(user2)).to.be.equal(false);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(1);
    expect(minters[0]).to.be.equal(owner);
  });

  it('only minter can add new minter', async () => {
    await expectRevert(
      token.addMinter(other, { from: other }),
      'MinterRole: caller does not have the Minter role',
    );
  });

  it('only minter can mint tokens', async () => {
    await expectRevert(
      token.mint(other, tokenAmount, { from: other }),
      'MinterRole: caller does not have the Minter role',
    );
    token.mint(other, tokenAmount, { from: owner });
  });

  it('there can be no minter at all', async () => {
    await token.renounceMinter({ from: owner });
    expect(await token.isMinter(owner)).to.be.equal(false);

    const minters = toLowerCase(await token.getMinters());

    expect(minters.length).to.be.equal(0);
  });
});

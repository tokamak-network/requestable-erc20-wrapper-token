const RLP = require('rlp');
const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
const { shouldBehaveLikeRequestableERC20 } = require('./RequestableERC20.behavior');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const RequestableERC20Mintable = artifacts.require('./RequestableERC20Mintable.sol');

const { expect } = chai;

const toLowerCase = (l) => l.map(s => s.toLowerCase());

contract('RequestableERC20Mintable', function (accounts) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  const development = true;
  const lockInRootChain = false;

  const tokenAmount = toBN(1e18);

  before(async function () {
    console.log(`
    owner: ${owner}
    user1: ${user1}
    user2: ${user2}
    other: ${other}
    `);
    this.token = await RequestableERC20Mintable.new(development, lockInRootChain);
  });

  describe('#Requestable', function () {
    describe('#RequestableERC20', function () {
      before(async function () {
        await this.token.mint(user1, tokenAmount);
      });

      shouldBehaveLikeRequestableERC20(owner, user1);
    });

    describe('#RequestableERC20Mintable.minters', function () {
      let requestId = 1e4;
      const user = user1;

      let trieKey;
      const newMinterTrieValue = RLP.encode([user, 1]);
      const removedMinterTrieValue = RLP.encode([user, 0]);

      const newOtherTrieValue = RLP.encode([other, 1]);

      before(async function () {
        trieKey = await this.token.KEY_MINTERS();
      });

      describe('#Enter', function () {
        const isExit = false;

        describe('new minter role', function () {
          it('only valid minter can be requested', async function () {
            await expectRevert.unspecified(
              this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newOtherTrieValue),
            );
          });

          it('can make an enter request for new minter role', async function () {
            await this.token.addMinter(user);

            await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newMinterTrieValue);

            // roll-back
            await this.token.renounceMinter({ from: user });
          });

          it('new minter role in child chain should be updated', async function () {
            expect(await this.token.isMinter(user)).to.be.equal(false);
            await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newMinterTrieValue);
            expect(await this.token.isMinter(user)).to.be.equal(true);

            // roll-back
            await this.token.renounceMinter({ from: user });
          });
        });

        describe('removed minter role', function () {
          it('only valid non-minter can be requested', async function () {
            await this.token.addMinter(user);

            await expectRevert.unspecified(
              this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedMinterTrieValue),
            );

            // roll-back
            await this.token.renounceMinter({ from: user });
          });

          it('can make an enter request for new minter role', async function () {
            await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedMinterTrieValue);
          });

          it('new minter role in child chain should be updated', async function () {
            await this.token.addMinter(user);

            expect(await this.token.isMinter(user)).to.be.equal(true);
            await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedMinterTrieValue);
            expect(await this.token.isMinter(user)).to.be.equal(false);
          });
        });
      });

      describe('#Exit', function () {
        const isExit = true;

        describe('new minter role', function () {
          it('only valid minter can be requested', async function () {
            await expectRevert.unspecified(
              this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newOtherTrieValue),
            );
          });

          it('can make an enter request for new minter role', async function () {
            await this.token.addMinter(user);

            await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newMinterTrieValue);

            // roll-back
            await this.token.renounceMinter({ from: user });
          });

          it('new minter role in root chain should be updated', async function () {
            expect(await this.token.isMinter(user)).to.be.equal(false);
            await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newMinterTrieValue);
            expect(await this.token.isMinter(user)).to.be.equal(true);

            // roll-back
            await this.token.renounceMinter({ from: user });
          });
        });

        describe('removed minter role', function () {
          it('only valid non-minter can be requested', async function () {
            await this.token.addMinter(user);

            await expectRevert.unspecified(
              this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedMinterTrieValue),
            );

            // roll-back
            await this.token.renounceMinter({ from: user });
          });

          it('can make an enter request for new minter role', async function () {
            await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedMinterTrieValue);
          });

          it('new minter role in child chain should be updated', async function () {
            await this.token.addMinter(user);

            expect(await this.token.isMinter(user)).to.be.equal(true);
            await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedMinterTrieValue);
            expect(await this.token.isMinter(user)).to.be.equal(false);
          });
        });
      });
    });
  });

  describe('Basic', function () {
    it('deployer should has minter role', async function () {
      expect(await this.token.isMinter(owner)).to.be.equal(true);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(1);
      expect(minters[0]).to.be.equal(owner);
    });

    it('can add new minter', async function () {
      await this.token.addMinter(user1);
      expect(await this.token.isMinter(user1)).to.be.equal(true);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(2);
      expect(minters[0]).to.be.equal(owner);
      expect(minters[1]).to.be.equal(user1);
    });

    it('can add new minter again', async function () {
      await this.token.addMinter(user2, { from: user1 });
      expect(await this.token.isMinter(user2)).to.be.equal(true);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(3);
      expect(minters[0]).to.be.equal(owner);
      expect(minters[1]).to.be.equal(user1);
      expect(minters[2]).to.be.equal(user2);
    });

    it('can remove owner', async function () {
      await this.token.renounceMinter({ from: user1 });
      expect(await this.token.isMinter(user1)).to.be.equal(false);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(2);
      expect(minters[0]).to.be.equal(owner);
      expect(minters[1]).to.be.equal(user2);
    });

    it('can remove owner again', async function () {
      await this.token.renounceMinter({ from: user2 });
      expect(await this.token.isMinter(user2)).to.be.equal(false);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(1);
      expect(minters[0]).to.be.equal(owner);
    });

    it('only minter can add new minter', async function () {
      await expectRevert(
        this.token.addMinter(other, { from: other }),
        'MinterRole: caller does not have the Minter role',
      );
    });

    it('only minter can mint tokens', async function () {
      await expectRevert(
        this.token.mint(other, tokenAmount, { from: other }),
        'MinterRole: caller does not have the Minter role',
      );
      this.token.mint(other, tokenAmount, { from: owner });
    });

    it('there can be no minter at all', async function () {
      await this.token.renounceMinter({ from: owner });
      expect(await this.token.isMinter(owner)).to.be.equal(false);

      const minters = toLowerCase(await this.token.getMinters());

      expect(minters.length).to.be.equal(0);
    });
  });
});

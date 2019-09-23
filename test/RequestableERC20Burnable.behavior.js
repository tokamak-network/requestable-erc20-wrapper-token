const RLP = require('rlp');
const { expectRevert } = require('openzeppelin-test-helpers');
const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));

const { toBN } = web3.utils;

const { expect } = chai;

const toLowerCase = (l) => l.map(s => s.toLowerCase());

function shouldBehaveLikeRequestableERC20Burnable (accounts, requestId = 0) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  describe('#RequestableERC20Burnable.burners', function () {
    const user = user1;

    let trieKey;
    const newBurnerTrieValue = RLP.encode([user, 1]);
    const removedBurnerTrieValue = RLP.encode([user, 0]);

    const newOtherTrieValue = RLP.encode([other, 1]);

    before(async function () {
      trieKey = await this.token.KEY_BURNERS();
    });

    describe('#Enter', function () {
      const isExit = false;

      describe('new burner role', function () {
        it('only valid burner can be requested', async function () {
          await expectRevert.unspecified(
            this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newOtherTrieValue),
          );
        });

        it('can make an enter request for new burner role', async function () {
          await this.token.addBurner(user);

          await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newBurnerTrieValue);

          // roll-back
          await this.token.renounceBurner({ from: user });
        });

        it('new burner role in child chain should be updated', async function () {
          expect(await this.token.isBurner(user)).to.be.equal(false);
          await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newBurnerTrieValue);
          expect(await this.token.isBurner(user)).to.be.equal(true);

          // roll-back
          await this.token.renounceBurner({ from: user });
        });
      });

      describe('removed burner role', function () {
        it('only valid non-burner can be requested', async function () {
          await this.token.addBurner(user);

          await expectRevert.unspecified(
            this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue),
          );

          // roll-back
          await this.token.renounceBurner({ from: user });
        });

        it('can make an enter request for new burner role', async function () {
          await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue);
        });

        it('new burner role in child chain should be updated', async function () {
          await this.token.addBurner(user);

          expect(await this.token.isBurner(user)).to.be.equal(true);
          await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue);
          expect(await this.token.isBurner(user)).to.be.equal(false);
        });
      });
    });

    describe('#Exit', function () {
      const isExit = true;

      describe('new burner role', function () {
        it('only valid burner can be requested', async function () {
          await expectRevert.unspecified(
            this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newOtherTrieValue),
          );
        });

        it('can make an enter request for new burner role', async function () {
          await this.token.addBurner(user);

          await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, newBurnerTrieValue);

          // roll-back
          await this.token.renounceBurner({ from: user });
        });

        it('new burner role in root chain should be updated', async function () {
          expect(await this.token.isBurner(user)).to.be.equal(false);
          await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, newBurnerTrieValue);
          expect(await this.token.isBurner(user)).to.be.equal(true);

          // roll-back
          await this.token.renounceBurner({ from: user });
        });
      });

      describe('removed burner role', function () {
        it('only valid non-burner can be requested', async function () {
          await this.token.addBurner(user);

          await expectRevert.unspecified(
            this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue),
          );

          // roll-back
          await this.token.renounceBurner({ from: user });
        });

        it('can make an enter request for new burner role', async function () {
          await this.token.applyRequestInChildChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue);
        });

        it('new burner role in child chain should be updated', async function () {
          await this.token.addBurner(user);

          expect(await this.token.isBurner(user)).to.be.equal(true);
          await this.token.applyRequestInRootChain(isExit, requestId++, other, trieKey, removedBurnerTrieValue);
          expect(await this.token.isBurner(user)).to.be.equal(false);
        });
      });
    });
  });
}

function shouldBehaveLikeRequestableERC20BurnableBasic (accounts, tokenAmount = toBN(1e18)) {
  const [owner, user1, user2, other] = toLowerCase(accounts);

  describe('RequestableERC20Burnable basic functions', function () {
    it('deployer should has burner role', async function () {
      expect(await this.token.isBurner(owner)).to.be.equal(true);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(1);
      expect(burners[0]).to.be.equal(owner);
    });

    it('can add new burner', async function () {
      await this.token.addBurner(user1);
      expect(await this.token.isBurner(user1)).to.be.equal(true);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(2);
      expect(burners[0]).to.be.equal(owner);
      expect(burners[1]).to.be.equal(user1);
    });

    it('can add new burner again', async function () {
      await this.token.addBurner(user2, { from: user1 });
      expect(await this.token.isBurner(user2)).to.be.equal(true);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(3);
      expect(burners[0]).to.be.equal(owner);
      expect(burners[1]).to.be.equal(user1);
      expect(burners[2]).to.be.equal(user2);
    });

    it('can remove owner', async function () {
      await this.token.renounceBurner({ from: user1 });
      expect(await this.token.isBurner(user1)).to.be.equal(false);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(2);
      expect(burners[0]).to.be.equal(owner);
      expect(burners[1]).to.be.equal(user2);
    });

    it('can remove owner again', async function () {
      await this.token.renounceBurner({ from: user2 });
      expect(await this.token.isBurner(user2)).to.be.equal(false);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(1);
      expect(burners[0]).to.be.equal(owner);
    });

    it('only burner can add new burner', async function () {
      await expectRevert(
        this.token.addBurner(other, { from: other }),
        'BurnerRole: caller does not have the Burner role',
      );
    });

    it('only burner can burn tokens', async function () {
      await this.token.transfer(other, tokenAmount);

      await expectRevert(
        this.token.methods['burn(address,uint256)'](other, tokenAmount, { from: other }),
        'BurnerRole: caller does not have the Burner role',
      );
      await this.token.methods['burn(address,uint256)'](other, tokenAmount, { from: owner });
    });

    it('there can be no burner at all', async function () {
      await this.token.renounceBurner({ from: owner });
      expect(await this.token.isBurner(owner)).to.be.equal(false);

      const burners = toLowerCase(await this.token.getBurners());

      expect(burners.length).to.be.equal(0);
    });
  });
}

module.exports = {
  shouldBehaveLikeRequestableERC20Burnable,
  shouldBehaveLikeRequestableERC20BurnableBasic,
};

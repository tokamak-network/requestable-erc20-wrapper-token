pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./lib/RLP.sol";
import "./lib/BurnerRole.sol";
import "./RequestableERC20.sol";

/**
 * @title  RequestableERC20Burnable
 * @notice RequestableERC20Burnable is not compatible with ERC20Burnable that only can burn token holder's token.
 *         This allows burner to be able to burn any other holder's token.
 */
contract RequestableERC20Burnable is RequestableERC20, BurnerRole {
  using SafeMath for *;
  using RLP for bytes;
  using RLP for RLP.RLPItem;

  address[] public burners;

  uint256 constant public MAX_NUM_BURNERS = 64;

  // request for other burner role
  bytes32 constant public KEY_BURNERS = keccak256("RequestableERC20Burnable.burners(address account, bool isNew)");

  function getBurners() public view returns (address[] memory) {
    return burners;
  }

  function burn(address account, uint256 amount) public onlyBurner {
    _burn(account, amount);
  }

  function _addBurner(address account) internal {
    require(burners.length < MAX_NUM_BURNERS);

    burners.push(account);
    super._addBurner(account);
  }

  function _removeBurner(address account) internal {
    for (uint i = 0; i < burners.length; i++) {
      if (burners[i] == account) {
        burners[i] = burners[burners.length - 1];
        delete burners[burners.length - 1];
        burners.length--;
      }
    }

    super._removeBurner(account);
  }

  function _applyRequestInRootChain(
    bool isExit,
    address requestor,
    bytes32 trieKey,
    bytes memory trieValue
  ) internal returns (bool success) {
    if (trieKey != KEY_BURNERS) {
      return super._applyRequestInRootChain(isExit, requestor, trieKey, trieValue);
    }

    RLP.RLPItem[] memory list = trieValue.toRLPItem().toList(2);
    address burner = list[0].toAddress();
    bool isNew = (list[1].toUint() != 0);

    if (isExit) {
      if (isNew) {
        if (!isBurner(burner)) _addBurner(burner);
      } else {
        if (isBurner(burner)) _removeBurner(burner);
      }
    } else {
      if (isNew) require(isBurner(burner));
      else require(!isBurner(burner));
    }

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }

  function _applyRequestInChildChain(
    bool isExit,
    address requestor,
    bytes32 trieKey,
    bytes memory trieValue
  ) internal returns (bool success) {
    if (trieKey != KEY_BURNERS) {
      return super._applyRequestInChildChain(isExit, requestor, trieKey, trieValue);
    }

    RLP.RLPItem[] memory list = trieValue.toRLPItem().toList(2);
    address burner = list[0].toAddress();
    bool isNew = (list[1].toUint() != 0);

    if (isExit) {
      if (isNew) require(isBurner(burner));
      else require(!isBurner(burner));
    } else {
      if (isNew) {
        if (!isBurner(burner)) _addBurner(burner);
      } else {
        if (isBurner(burner)) _removeBurner(burner);
      }
    }

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }
}

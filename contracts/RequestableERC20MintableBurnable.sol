pragma solidity ^0.5.0;

import "./RequestableERC20.sol";
import "./RequestableERC20Burnable.sol";
import "./RequestableERC20Mintable.sol";

contract RequestableERC20MintableBurnable is RequestableERC20Mintable, RequestableERC20Burnable {
}

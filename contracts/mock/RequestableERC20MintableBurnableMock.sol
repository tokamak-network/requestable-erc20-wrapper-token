pragma solidity ^0.5.0;

import "../RequestableERC20MintableBurnable.sol";


contract RequestableERC20MintableBurnableMock is RequestableERC20MintableBurnable {
  constructor(bool _development, bool _lockInRootChain)
    RequestableERC20(_development, _lockInRootChain, 0)
    public
  {}
}

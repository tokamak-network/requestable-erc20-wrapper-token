pragma solidity ^0.5.0;

import "../RequestableERC20Mintable.sol";


contract RequestableERC20MintableMock is RequestableERC20Mintable {
  constructor(bool _development, bool _lockInRootChain)
    RequestableERC20(_development, _lockInRootChain, 0)
    public
  {}
}

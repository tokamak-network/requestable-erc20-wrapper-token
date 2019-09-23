pragma solidity ^0.5.0;

import "../RequestableERC20Burnable.sol";


contract RequestableERC20BurnableMock is RequestableERC20Burnable {
  constructor(bool _development, bool _lockInRootChain, uint256 _initialSupply)
    RequestableERC20(_development, _lockInRootChain, _initialSupply)
    public
  {}
}
